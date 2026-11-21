import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, ChevronDown, ChevronLeft, Check, CheckSquare, Download, File, FileImage, HardDrive, Heading2, House, Italic, List, ListOrdered, MoreHorizontal, Paperclip, Pin, Plus, Redo2, Tag, Trash2, Undo2, TriangleAlert, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SaveSession } from '../data/save-session';
import { downloadJson } from '../data/recovery';
import { editorExtensions } from './schema';
import type { Journal, Attachment } from '../domain/model';
import { saveAttachment, deleteAttachment, readAttachmentData } from '../data/database';
import { formatBytes, getStorageHealth, type StorageHealth } from '../data/storage';
import { triggerBlobDownload } from '../data/backup';
import { HelpTip } from '../app/HelpTip';
import { ClearableInput } from '../app/ClearableInput';

function Toolbar({ editor, onAttach }: { editor: Editor; onAttach: () => void }) {
  const state = useEditorState({ editor, selector: ({ editor: instance }) => instance.isDestroyed ? {
    bold: false, italic: false, heading: false, bullet: false, ordered: false, tasks: false, undo: false, redo: false,
  } : ({
    bold: instance.isActive('bold'), italic: instance.isActive('italic'),
    heading: instance.isActive('heading'), bullet: instance.isActive('bulletList'),
    ordered: instance.isActive('orderedList'), tasks: instance.isActive('taskList'),
    undo: instance.can().undo(), redo: instance.can().redo(),
  }) });
  const controls: { label: string; icon: LucideIcon; active?: boolean; disabled?: boolean; run: () => void }[] = [
    { label: 'Bold', icon: Bold, active: state.bold, run: () => { editor.chain().focus().toggleBold().run(); } },
    { label: 'Italic', icon: Italic, active: state.italic, run: () => { editor.chain().focus().toggleItalic().run(); } },
    { label: 'Heading', icon: Heading2, active: state.heading, run: () => { editor.chain().focus().toggleHeading({ level: 2 }).run(); } },
    { label: 'Bullet list', icon: List, active: state.bullet, run: () => { editor.chain().focus().toggleBulletList().run(); } },
    { label: 'Numbered list', icon: ListOrdered, active: state.ordered, run: () => { editor.chain().focus().toggleOrderedList().run(); } },
    { label: 'Checklist', icon: CheckSquare, active: state.tasks, run: () => { editor.chain().focus().toggleTaskList().run(); } },
    { label: 'Attach file', icon: Paperclip, active: false, run: onAttach },
    { label: 'Undo', icon: Undo2, disabled: !state.undo, run: () => { editor.chain().focus().undo().run(); } },
    { label: 'Redo', icon: Redo2, disabled: !state.redo, run: () => { editor.chain().focus().redo().run(); } },
  ];
  return <div className="format-toolbar" role="group" aria-label="Text formatting">{controls.map(({ label, icon: Icon, active, disabled, run }) => (
    <button key={label} type="button" aria-label={label} title={label} aria-pressed={active} disabled={disabled} onPointerDown={event => event.preventDefault()} onClick={run}><Icon size={19} aria-hidden="true" /></button>
  ))}<HelpTip label="Text formatting">Select text, then choose Bold, Italic or Heading. List buttons turn the current paragraph into a list or checklist. Paperclip lets you attach images or documents. Undo also restores text removed with a clear button.</HelpTip></div>;
}

function SaveStatus({ session }: { session: SaveSession }) {
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot);
  return <div className={`save-area save-${state.status}`}>
    <p className="save-status" role="status" aria-live="polite" aria-atomic="true">{state.status === 'saved' ? <><Check size={15} aria-hidden="true" />Saved on this device</> : state.status === 'saving' ? 'Saving…' : <><TriangleAlert size={17} aria-hidden="true" />Save failed</>}</p>
    {state.status === 'failed' && <div className="save-recovery"><p>{state.message}</p><div>{!state.conflict && <button className="secondary-button" onClick={() => void session.flush()}>Retry save</button>}<button className="secondary-button" onClick={() => downloadDraft(session)}><Download size={17} aria-hidden="true" />Download draft</button></div></div>}
  </div>;
}

function WordCount({ editor }: { editor: Editor }) {
  const count = useEditorState({ editor, selector: ({ editor: instance }) => instance.isDestroyed ? 0 : instance.getText().trim().split(/\s+/u).filter(Boolean).length });
  return <span className="word-count">{count} {count === 1 ? 'word' : 'words'}</span>;
}

function ClearNoteText({ editor }: { editor: Editor }) {
  const hasContent = useEditorState({ editor, selector: ({ editor: instance }) => !instance.isDestroyed && !instance.isEmpty });
  return hasContent ? <button className="icon-button clear-note-text" aria-label="Clear note text" title="Clear note text — Undo is available" onPointerDown={event => event.preventDefault()} onClick={() => { editor.chain().focus().selectAll().deleteSelection().run(); }}><X size={18} aria-hidden="true" /></button> : null;
}

function downloadDraft(session: SaveSession) {
  downloadJson({ format: 'eviescratch-note-draft', version: 1, note: session.draft }, `eviescratch-draft-${session.draft.id}.json`);
}

export default function NoteEditor({
  session,
  focusOnOpen,
  readyForFocus,
  onBack,
  onHome,
  journal,
  guide,
  attachments = [],
  onAttachmentChange,
  onOptions,
  onPin,
  onRestore,
}: {
  session: SaveSession;
  focusOnOpen: boolean;
  readyForFocus: boolean;
  onBack: () => void;
  onHome: () => void;
  journal: Journal | undefined;
  guide: ReactNode;
  attachments?: Attachment[];
  onAttachmentChange?: () => Promise<void>;
  onOptions: () => void;
  onPin: () => void;
  onArchive: () => void;
  onTrash: () => void;
  onRestore: () => void;
}) {
  const title = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [titleValue, setTitleValue] = useState(session.draft.title);
  const [tags, setTags] = useState(session.draft.tags);
  const [tagInput, setTagInput] = useState('');
  const [showAttachments, setShowAttachments] = useState(attachments.length > 0);
  const [isDragging, setIsDragging] = useState(false);
  const [attachmentError, setAttachmentError] = useState('');
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const [storageHealth, setStorageHealth] = useState<StorageHealth | null>(null);

  const trashed = !!session.draft.deletedAt;

  useEffect(() => {
    if (attachments.length > 0) setShowAttachments(true);
  }, [attachments.length]);

  useEffect(() => {
    void getStorageHealth({ notes: [], journals: [], shelves: [], attachments, defaultJournalId: '' }).then(setStorageHealth);
  }, [attachments]);

  function addTag() {
    const next = tagInput.trim().replace(/^#+/, '');
    if (!next || tags.length >= 50 || tags.some(tag => tag.toLocaleLowerCase() === next.toLocaleLowerCase())) { setTagInput(''); return; }
    const updated = [...tags, next]; setTags(updated); session.edit({ tags: updated }); setTagInput('');
  }

  const editor = useEditor({
    extensions: [...editorExtensions(), Placeholder.configure({ placeholder: 'What would you like to remember?' })],
    content: session.draft.document.content,
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: { id: 'note-body', role: 'textbox', 'aria-label': 'Note body', 'aria-multiline': 'true', spellcheck: 'true', autocapitalize: 'sentences' },
    },
    editable: !trashed,
    onUpdate: ({ editor: instance }) => { if (!session.draft.deletedAt) session.edit({ document: { schemaVersion: 1, content: instance.getJSON() } }); },
  }, [session]);

  useEffect(() => {
    const element = title.current;
    if (element) { element.style.height = 'auto'; element.style.height = `${element.scrollHeight}px`; }
    if (!focusOnOpen || !readyForFocus || !editor) return;
    const frame = requestAnimationFrame(() => {
      if (editor.isDestroyed) return;
      const activeField = document.activeElement;
      if (activeField instanceof HTMLInputElement || activeField instanceof HTMLTextAreaElement) return;
      editor.commands.setTextSelection(Math.max(1, editor.state.doc.content.size - 1));
      editor.view.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [editor, focusOnOpen, readyForFocus]);

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(!trashed, false);
      editor.view.dom.setAttribute('aria-readonly', String(trashed));
    }
  }, [editor, trashed]);

  async function handleFilesUpload(files: FileList | File[]) {
    if (!files.length || trashed) return;
    setAttachmentBusy(true);
    setAttachmentError('');
    setShowAttachments(true);
    try {
      for (const file of Array.from(files)) {
        await saveAttachment(session.draft.id, file);
      }
      await onAttachmentChange?.();
    } catch (err) {
      setAttachmentError(err instanceof Error ? err.message : 'Failed to save attachment.');
    } finally {
      setAttachmentBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDeleteAttachment(id: string) {
    if (trashed) return;
    setAttachmentBusy(true);
    setAttachmentError('');
    try {
      await deleteAttachment(id);
      await onAttachmentChange?.();
    } catch (err) {
      setAttachmentError(err instanceof Error ? err.message : 'Could not delete attachment.');
    } finally {
      setAttachmentBusy(false);
    }
  }

  async function handleDownloadAttachment(att: Attachment) {
    try {
      const bytes = await readAttachmentData(att.id);
      if (!bytes) throw new Error('Attachment file data not found.');
      const blob = new Blob([bytes as unknown as ArrayBuffer], { type: att.mime });
      triggerBlobDownload(blob, att.filename);
    } catch (err) {
      setAttachmentError(err instanceof Error ? err.message : 'Could not download attachment.');
    }
  }

  return <>
    <div className="editor-topbar">
      <button className="back-button" onClick={onBack}><ChevronLeft size={19} aria-hidden="true" />Notes</button>
      <button className="icon-button editor-home-button" aria-label="Home" title="Home" onClick={onHome}><House size={18} aria-hidden="true" /></button>
      <button className="journal-label journal-move" aria-label="Note options" onClick={onOptions}><span>{journal?.name ?? 'Note'}</span><ChevronDown size={15} aria-hidden="true" /></button>
      <div className="note-top-actions">
        {!trashed && (
          <button
            className="icon-button pin-note-button"
            title={session.draft.pinned ? 'Pinned — click to unpin' : 'Pin note'}
            aria-label={session.draft.pinned ? 'Unpin note' : 'Pin note'}
            aria-pressed={session.draft.pinned}
            onClick={onPin}
          >
            <Pin size={18} fill={session.draft.pinned ? 'currentColor' : 'none'} aria-hidden="true" />
            {session.draft.pinned && <Check className="pin-active-check" size={12} strokeWidth={3} aria-hidden="true" />}
          </button>
        )}
        {!trashed && (
          <button
            className="icon-button note-attach-button"
            title="Attach file (images, docs up to 10 MB)"
            aria-label="Attach file"
            aria-expanded={showAttachments}
            onClick={() => {
              setShowAttachments(true);
              fileInputRef.current?.click();
            }}
          >
            <Paperclip size={18} aria-hidden="true" />
            {attachments.length > 0 && <span className="attach-count-badge">{attachments.length}</span>}
          </button>
        )}
        <button className="icon-button download-note" aria-label="Download note draft" title="Download note draft (JSON)" onClick={() => downloadDraft(session)}>
          <Download size={19} aria-hidden="true" />
        </button>
        <button className="icon-button" aria-label="More note actions" aria-haspopup="dialog" onClick={onOptions}>
          <MoreHorizontal size={20} aria-hidden="true" />
        </button>
      </div>
    </div>

    <input
      ref={fileInputRef}
      type="file"
      multiple
      style={{ display: 'none' }}
      onChange={e => e.target.files && void handleFilesUpload(e.target.files)}
    />

    <div
      className={`writing-scroll ${isDragging ? 'drag-over' : ''}`}
      onDragOver={e => { e.preventDefault(); if (!trashed) setIsDragging(true); }}
      onDragLeave={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
      }}
      onDrop={e => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.length) void handleFilesUpload(e.dataTransfer.files);
      }}
    >
      {isDragging && (
        <div className="dropzone-overlay">
          <Paperclip size={32} aria-hidden="true" />
          <p>Drop files here to attach to this note (up to 10 MB each)</p>
        </div>
      )}

      <div className="writing-page">
        {!trashed && guide}
        {trashed && <div className="trashed-notice"><Trash2 size={18} aria-hidden="true" /><p>This note is in the litter box. Restore it to make changes.</p><button className="secondary-button" onClick={onRestore}>Restore note</button></div>}
        <p className="page-eyebrow">A THOUGHT WORTH KEEPING</p>
        <div className="note-title-field">
          <textarea
            ref={title}
            className="note-title"
            aria-label="Note title"
            placeholder="Untitled note"
            rows={1}
            maxLength={2000}
            readOnly={trashed}
            value={titleValue}
            onChange={event => {
              const element = event.currentTarget;
              element.style.height = 'auto';
              element.style.height = `${element.scrollHeight}px`;
              setTitleValue(element.value);
              session.edit({ title: element.value });
            }}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                event.preventDefault();
                editor?.commands.focus('start');
              }
            }}
          />
          {titleValue && !trashed && (
            <button
              className="icon-button clear-title"
              aria-label="Clear note title"
              onPointerDown={event => event.preventDefault()}
              onClick={() => {
                setTitleValue('');
                session.edit({ title: '' });
                title.current?.focus();
              }}
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="note-meta">
          <span>{journal?.name ?? 'Journal'}</span>
          <span aria-hidden="true">·</span>
          <span>{new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(session.draft.createdAt))}</span>
          {session.draft.pinned && <span className="pinned-label"><Pin size={12} fill="currentColor" aria-hidden="true" />Pinned</span>}
          {session.draft.archivedAt && <span className="archived-label">Archived</span>}
        </div>

        <div className="note-tags">
          <HelpTip label="Tags">Type a tag and press Enter or comma, or leave the field, to add it. Search for tags from your notes list. Use the small cross to remove a tag.</HelpTip>
          {tags.map(tag => (
            <span className="tag-chip" key={tag}>
              #{tag}
              {!trashed && (
                <button aria-label={`Remove tag ${tag}`} onClick={() => {
                  const next = tags.filter(value => value !== tag);
                  setTags(next);
                  session.edit({ tags: next });
                }}>
                  <X size={13} aria-hidden="true" />
                </button>
              )}
            </span>
          ))}
          {!trashed && (
            <label className="tag-entry">
              <Tag size={14} aria-hidden="true" />
              <ClearableInput
                aria-label="Add a tag"
                value={tagInput}
                onClear={() => setTagInput('')}
                placeholder="Add a tag…"
                maxLength={80}
                onChange={event => setTagInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ',') {
                    event.preventDefault();
                    addTag();
                  }
                }}
                onBlur={addTag}
              />
            </label>
          )}
        </div>

        <div className="page-rule" />
        <div className="note-content-wrap">
          <EditorContent editor={editor} className="note-content" />
          {editor && !trashed && <ClearNoteText editor={editor} />}
        </div>

        {/* Attachments Section on Note */}
        {(showAttachments || attachments.length > 0) && (
          <section className="note-attachments-section" aria-label="Attachments">
            <div className="note-attachments-header">
              <div className="attachments-title-wrap">
                <Paperclip size={16} aria-hidden="true" />
                <strong>Attachments ({attachments.length})</strong>
              </div>

              {/* Location & Remaining Space Indicators */}
              <div className="attachment-storage-indicators">
                <span className="location-pill device-pill" title="Stored locally in this browser">
                  <HardDrive size={13} aria-hidden="true" />
                  Location: On this device
                </span>
                <span className="location-pill cloud-pill" title="Cloud sync not activated yet">
                  Cloud: Not connected
                </span>
                <span className="storage-remaining-info">
                  Available: {storageHealth?.deviceRemainingBytes != null ? formatBytes(storageHealth.deviceRemainingBytes) : '~Device space'} (10 MB/file)
                </span>
              </div>

              {!trashed && (
                <button
                  type="button"
                  className="secondary-button attach-add-btn"
                  disabled={attachmentBusy}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus size={15} aria-hidden="true" />
                  Attach file
                </button>
              )}
            </div>

            {attachmentError && <p className="form-error" role="alert">{attachmentError}</p>}

            {attachments.length === 0 ? (
              <p className="attachments-empty-hint">
                No attachments on this note yet. Click “Attach file” or drag images/files here.
              </p>
            ) : (
              <div className="attachments-grid">
                {attachments.map(att => {
                  const isImage = att.mime.startsWith('image/');
                  return (
                    <div key={att.id} className="attachment-card">
                      <div className="attachment-card-icon">
                        {isImage ? (
                          <FileImage size={24} className="file-icon image-icon" aria-hidden="true" />
                        ) : (
                          <File size={24} className="file-icon" aria-hidden="true" />
                        )}
                      </div>
                      <div className="attachment-card-details">
                        <strong className="attachment-name" title={att.filename}>{att.filename}</strong>
                        <div className="attachment-meta-row">
                          <span>{formatBytes(att.size)}</span>
                          <span className="location-tiny-badge">Device</span>
                        </div>
                      </div>
                      <div className="attachment-card-actions">
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`Download ${att.filename}`}
                          title="Download attachment"
                          onClick={() => void handleDownloadAttachment(att)}
                        >
                          <Download size={16} aria-hidden="true" />
                        </button>
                        {!trashed && (
                          <button
                            type="button"
                            className="icon-button text-danger"
                            aria-label={`Remove ${att.filename}`}
                            title="Delete attachment"
                            disabled={attachmentBusy}
                            onClick={() => void handleDeleteAttachment(att.id)}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>

    <div className="editor-bottom">
      <div className="editor-status-row">
        <div className="help-row">
          <SaveStatus session={session} />
          <HelpTip label="Saving notes">Edits save automatically on this device. Wait for Saved on this device before closing. If saving fails, keep the page open and retry or download your draft. Cloud sync is not connected yet.</HelpTip>
        </div>
        {editor && <WordCount editor={editor} />}
      </div>
      {editor && !trashed && <Toolbar editor={editor} onAttach={() => { setShowAttachments(true); fileInputRef.current?.click(); }} />}
    </div>
  </>;
}
