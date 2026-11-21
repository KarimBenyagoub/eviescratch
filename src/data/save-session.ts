import type { LocalSaveState, Note } from '../domain/model';
import { commitNote, ConcurrentEditError } from './database';
type Writer = (note: Note, revision: number) => Promise<Note>;

/** An old completion can never mark a newer edit Saved. */
export class SaveSession {
  draft: Note;
  private generation = 0;
  private committedGeneration = 0;
  private revision: number;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private running: Promise<boolean> | undefined;
  private listeners = new Set<() => void>();
  private state: LocalSaveState;

  constructor(note: Note, private onCommit: (note: Note) => void, private writer: Writer = commitNote) {
    this.draft = note;
    this.revision = note.revision;
    this.state = { status: 'saved', committedAt: note.updatedAt };
  }
  get dirty() { return this.generation !== this.committedGeneration; }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private publish(state: LocalSaveState) {
    this.state = state;
    this.listeners.forEach(listener => listener());
  }
  adoptCommitted(note: Note) {
    if (this.dirty || note.id !== this.draft.id) throw new Error('Save your current draft before changing its metadata.');
    this.draft = note;
    this.revision = note.revision;
    this.onCommit(note);
    this.publish({ status: 'saved', committedAt: note.updatedAt });
  }
  edit(change: Partial<Pick<Note, 'title' | 'document' | 'tags'>>) {
    this.draft = { ...this.draft, ...change };
    this.generation++;
    if (this.state.status === 'failed' && this.state.conflict) return;
    this.publish({ status: 'saving' });
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { void this.flush(); }, 180);
  }
  flush = (): Promise<boolean> => {
    clearTimeout(this.timer);
    if (this.running) return this.running;
    if (!this.dirty) return Promise.resolve(true);
    if (this.state.status === 'failed' && this.state.conflict) return Promise.resolve(false);
    this.publish({ status: 'saving' });
    this.running = this.writeLoop().finally(() => { this.running = undefined; });
    return this.running;
  };
  private async writeLoop(): Promise<boolean> {
    try {
      while (this.dirty) {
        const generation = this.generation;
        const committed = await this.writer(this.draft, this.revision);
        this.revision = committed.revision;
        this.committedGeneration = generation;
        this.draft = { ...this.draft, revision: committed.revision, updatedAt: committed.updatedAt };
        this.onCommit(committed);
      }
      this.publish({ status: 'saved', committedAt: this.draft.updatedAt });
      return true;
    } catch (error) {
      const conflict = error instanceof ConcurrentEditError;
      this.publish({ status: 'failed', conflict, message: conflict
        ? error.message
        : 'Your changes are still open here. Free some device storage or retry, and download your draft before leaving.' });
      return false;
    }
  }
}
