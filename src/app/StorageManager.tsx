import { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, CheckSquare, Download, File, FileImage, FileText, HardDrive, Search, Square, Trash2, TriangleAlert, Upload, X } from 'lucide-react';
import { Dialog } from './Dialog';
import { HelpTip } from './HelpTip';
import type { Library } from '../data/database';
import type { Attachment } from '../domain/model';
import { readAttachmentData, deleteAttachment, deleteAttachments } from '../data/database';
import { getStorageHealth, formatBytes, type StorageHealth } from '../data/storage';
import { exportNativeBackup, exportReadableMarkdown, inspectNativeBackup, restoreNativeBackup, triggerBlobDownload, type BackupManifest } from '../data/backup';
import { zipSync } from 'fflate';

export function StorageManager({
  library,
  onRefresh,
  onOpenNote,
  onClose,
}: {
  library: Library;
  onRefresh: () => Promise<Library>;
  onOpenNote?: (noteId: string) => void;
  onClose: () => void;
}) {
  const [health, setHealth] = useState<StorageHealth | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmDeleteBatch, setConfirmDeleteBatch] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreManifest, setRestoreManifest] = useState<BackupManifest | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);

  const restoreInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void getStorageHealth(library).then(setHealth);
  }, [library]);

  const activeAttachments = useMemo(() => {
    return library.attachments.filter(att => !att.deletedAt);
  }, [library.attachments]);

  const filteredAttachments = useMemo(() => {
    if (!searchQuery.trim()) return activeAttachments;
    const q = searchQuery.toLowerCase();
    return activeAttachments.filter(att => att.filename.toLowerCase().includes(q));
  }, [activeAttachments, searchQuery]);

  const selectedCount = selectedIds.size;
  const selectedSize = useMemo(() => {
    return activeAttachments
      .filter(att => selectedIds.has(att.id))
      .reduce((sum, att) => sum + att.size, 0);
  }, [activeAttachments, selectedIds]);

  const allSelected = filteredAttachments.length > 0 && filteredAttachments.every(att => selectedIds.has(att.id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAttachments.map(att => att.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDownloadSingle(att: Attachment) {
    try {
      const bytes = await readAttachmentData(att.id);
      if (!bytes) throw new Error('File data not found.');
      const blob = new Blob([bytes as unknown as ArrayBuffer], { type: att.mime });
      triggerBlobDownload(blob, att.filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download file.');
    }
  }

  async function handleDownloadSelected() {
    if (!selectedCount) return;
    setBusy(true);
    setError('');
    try {
      const entries: Record<string, Uint8Array> = {};
      for (const id of selectedIds) {
        const att = activeAttachments.find(a => a.id === id);
        if (!att) continue;
        const bytes = await readAttachmentData(id);
        if (bytes) {
          entries[att.filename] = bytes;
        }
      }
      const zipped = zipSync(entries);
      const blob = new Blob([zipped as unknown as ArrayBuffer], { type: 'application/zip' });
      triggerBlobDownload(blob, `eviescratch-selected-files-${new Date().toISOString().slice(0, 10)}.zip`);
      setMessage(`Downloaded ${selectedCount} files.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download selected files.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSelected() {
    setBusy(true);
    setError('');
    try {
      const idsToDelete = Array.from(selectedIds);
      await deleteAttachments(idsToDelete);
      setSelectedIds(new Set());
      setConfirmDeleteBatch(false);
      await onRefresh();
      setMessage(`Deleted ${idsToDelete.length} file${idsToDelete.length === 1 ? '' : 's'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete files.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSingle(id: string) {
    setBusy(true);
    setError('');
    try {
      await deleteAttachment(id);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await onRefresh();
      setMessage('File deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file.');
    } finally {
      setBusy(false);
    }
  }

  async function handleExportNative() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { blob, filename } = await exportNativeBackup();
      triggerBlobDownload(blob, filename);
      setMessage(`Backup exported as ${filename}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backup export failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleExportMarkdown() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { blob, filename } = await exportReadableMarkdown(library);
      triggerBlobDownload(blob, filename);
      setMessage(`Markdown exported as ${filename}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Markdown export failed.');
    } finally {
      setBusy(false);
    }
  }

  async function onFileSelectedForRestore(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setMessage('');
    try {
      const manifest = await inspectNativeBackup(file);
      setRestoreFile(file);
      setRestoreManifest(manifest);
      setConfirmRestore(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read backup file.');
    }
  }

  async function executeRestore() {
    if (!restoreFile) return;
    setBusy(true);
    setError('');
    try {
      const summary = await restoreNativeBackup(restoreFile, { mode: 'replace' });
      setConfirmRestore(false);
      setRestoreFile(null);
      setRestoreManifest(null);
      await onRefresh();
      setMessage(`Restored successfully: ${summary.notesCount} notes, ${summary.journalsCount} journals, and ${summary.attachmentsCount} files.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog title="Storage & file management" onClose={onClose} wide>
      <div className="storage-manager">
        {/* Health & Location Overview */}
        <section className="storage-overview-card">
          <div className="storage-location-badge-row">
            <span className="location-badge device-badge">
              <HardDrive size={15} aria-hidden="true" />
              Location: On this device
            </span>
            <span className="location-badge cloud-badge">
              Cloud sync: Not connected (local storage)
            </span>
          </div>

          <div className="storage-stats-grid">
            <div className="storage-stat-item">
              <span className="stat-label">Device space available</span>
              <strong className="stat-value">
                {health?.deviceRemainingBytes != null
                  ? formatBytes(health.deviceRemainingBytes)
                  : 'Available in browser'}
              </strong>
              <small className="stat-meta">
                {health?.deviceUsageBytes ? `${formatBytes(health.deviceUsageBytes)} used in browser` : 'Browser quota managed'}
              </small>
            </div>

            <div className="storage-stat-item">
              <span className="stat-label">Files & Attachments</span>
              <strong className="stat-value">{activeAttachments.length}</strong>
              <small className="stat-meta">
                {formatBytes(health?.attachmentsTotalBytes ?? 0)} total
              </small>
            </div>

            <div className="storage-stat-item">
              <span className="stat-label">Notes in Library</span>
              <strong className="stat-value">{health?.notesCount ?? 0}</strong>
              <small className="stat-meta">
                ~{formatBytes(health?.notesApproxBytes ?? 0)} text
              </small>
            </div>
          </div>

          <p className="small muted">
            Attachments have a maximum size of 10 MB per file and are stored locally in this browser.
          </p>
        </section>

        {/* Backup & Restore Action Bar */}
        <section className="storage-actions-section">
          <h3>Backup & Export</h3>
          <p className="small muted">
            Save a complete copy of your library or restore from an existing backup archive.
          </p>
          <div className="storage-backup-buttons">
            <button className="secondary-button" disabled={busy} onClick={() => void handleExportNative()}>
              <Archive size={17} aria-hidden="true" />
              Export full backup (.zip)
            </button>
            <button className="secondary-button" disabled={busy} onClick={() => void handleExportMarkdown()}>
              <Download size={17} aria-hidden="true" />
              Export readable Markdown (.zip)
            </button>
            <button className="secondary-button" disabled={busy} onClick={() => restoreInputRef.current?.click()}>
              <Upload size={17} aria-hidden="true" />
              Restore library (.zip)
            </button>
            <input
              ref={restoreInputRef}
              type="file"
              accept=".zip,application/zip"
              style={{ display: 'none' }}
              onChange={event => void onFileSelectedForRestore(event)}
            />
          </div>
        </section>

        {/* Message / Error notifications */}
        {message && <p className="notice" role="status">{message}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}

        {/* Files Browser & Multi-select */}
        <section className="storage-files-section">
          <div className="files-section-header">
            <div className="help-row">
              <h3>All attached files ({activeAttachments.length})</h3>
              <HelpTip label="Managing files">
                Select multiple files to delete or download them at once. Click a note title to jump directly to that note.
              </HelpTip>
            </div>

            <div className="files-search-wrap">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search files…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label="Search files by name"
              />
              {searchQuery && (
                <button className="icon-button" aria-label="Clear file search" onClick={() => setSearchQuery('')}>
                  <X size={15} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Multi-selection Toolbar */}
          {activeAttachments.length > 0 && (
            <div className="files-multiselect-bar" role="toolbar" aria-label="Batch actions">
              <button
                type="button"
                className="select-all-button"
                onClick={toggleSelectAll}
                aria-label={allSelected ? 'Deselect all files' : 'Select all files'}
              >
                {allSelected ? <CheckSquare size={18} aria-hidden="true" /> : <Square size={18} aria-hidden="true" />}
                <span>{allSelected ? 'Deselect all' : 'Select all'}</span>
              </button>

              {selectedCount > 0 && (
                <div className="multiselect-actions">
                  <span className="selected-summary">
                    {selectedCount} selected ({formatBytes(selectedSize)})
                  </span>
                  <button
                    type="button"
                    className="secondary-button small-btn"
                    disabled={busy}
                    onClick={() => void handleDownloadSelected()}
                  >
                    <Download size={15} aria-hidden="true" />
                    Download selected
                  </button>
                  <button
                    type="button"
                    className="danger-button small-btn"
                    disabled={busy}
                    onClick={() => setConfirmDeleteBatch(true)}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                    Delete selected
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Files List */}
          {filteredAttachments.length === 0 ? (
            <div className="list-empty">
              <File size={32} aria-hidden="true" />
              <strong>{activeAttachments.length === 0 ? 'No attachments in your library' : 'No matching files'}</strong>
              <p>
                {activeAttachments.length === 0
                  ? 'Use the paperclip button in any note to attach images or documents.'
                  : 'Try a different search query.'}
              </p>
            </div>
          ) : (
            <div className="files-table-wrap">
              <table className="files-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <span className="sr-only">Select</span>
                    </th>
                    <th>File</th>
                    <th>Note</th>
                    <th>Size</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttachments.map(att => {
                    const isSelected = selectedIds.has(att.id);
                    const note = library.notes.find(n => n.id === att.noteId);
                    const isImage = att.mime.startsWith('image/');
                    return (
                      <tr key={att.id} className={isSelected ? 'selected-row' : ''}>
                        <td>
                          <button
                            type="button"
                            className="row-checkbox-btn"
                            aria-label={`Select ${att.filename}`}
                            aria-pressed={isSelected}
                            onClick={() => toggleSelect(att.id)}
                          >
                            {isSelected ? <CheckSquare size={18} aria-hidden="true" /> : <Square size={18} aria-hidden="true" />}
                          </button>
                        </td>
                        <td>
                          <div className="file-name-cell">
                            {isImage ? (
                              <FileImage size={20} className="file-icon image-icon" aria-hidden="true" />
                            ) : att.mime.includes('pdf') || att.mime.includes('text') ? (
                              <FileText size={20} className="file-icon doc-icon" aria-hidden="true" />
                            ) : (
                              <File size={20} className="file-icon" aria-hidden="true" />
                            )}
                            <span className="file-name" title={att.filename}>{att.filename}</span>
                          </div>
                        </td>
                        <td>
                          {note ? (
                            <button
                              type="button"
                              className="note-link-btn"
                              title="Open note"
                              onClick={() => {
                                onOpenNote?.(note.id);
                                onClose();
                              }}
                            >
                              {note.title.trim() || 'Untitled note'}
                            </button>
                          ) : (
                            <span className="muted small">Orphaned</span>
                          )}
                        </td>
                        <td className="file-size-cell">{formatBytes(att.size)}</td>
                        <td>
                          <span className="location-pill">Device</span>
                        </td>
                        <td>
                          <div className="file-actions">
                            <button
                              type="button"
                              className="icon-button"
                              aria-label={`Download ${att.filename}`}
                              title="Download file"
                              onClick={() => void handleDownloadSingle(att)}
                            >
                              <Download size={16} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="icon-button text-danger"
                              aria-label={`Delete ${att.filename}`}
                              title="Delete file"
                              onClick={() => void handleDeleteSingle(att.id)}
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Confirmation dialog for batch deletion */}
        {confirmDeleteBatch && (
          <Dialog title={`Delete ${selectedCount} file${selectedCount === 1 ? '' : 's'}?`} onClose={() => setConfirmDeleteBatch(false)}>
            <p>
              Are you sure you want to permanently delete <strong>{selectedCount}</strong> file{selectedCount === 1 ? '' : 's'} ({formatBytes(selectedSize)})?
            </p>
            <p className="small muted">
              This will remove the file data from this device. Notes referencing these files will no longer be able to open them.
            </p>
            <div className="dialog-actions">
              <button className="secondary-button" onClick={() => setConfirmDeleteBatch(false)}>
                Cancel
              </button>
              <button className="danger-button" disabled={busy} onClick={() => void handleDeleteSelected()}>
                Permanently delete
              </button>
            </div>
          </Dialog>
        )}

        {/* Confirmation dialog for restore */}
        {confirmRestore && restoreManifest && (
          <Dialog title="Restore library from backup?" onClose={() => setConfirmRestore(false)}>
            <div className="restore-preview-info">
              <TriangleAlert size={24} className="text-warning" aria-hidden="true" />
              <div>
                <strong>Backup archive verified</strong>
                <p className="small">Created on {new Date(restoreManifest.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <ul className="restore-counts-list">
              <li><strong>{restoreManifest.counts.notes}</strong> notes</li>
              <li><strong>{restoreManifest.counts.journals}</strong> journals</li>
              <li><strong>{restoreManifest.counts.shelves}</strong> shelves</li>
              <li><strong>{restoreManifest.counts.attachments}</strong> attached files</li>
            </ul>
            <p className="form-error" role="alert">
              Restoring will replace the current library on this device with the contents of this backup. Make sure you have exported any recent notes you want to keep.
            </p>
            <div className="dialog-actions">
              <button className="secondary-button" onClick={() => setConfirmRestore(false)}>
                Cancel
              </button>
              <button className="primary-button" disabled={busy} onClick={() => void executeRestore()}>
                Restore library
              </button>
            </div>
          </Dialog>
        )}
      </div>
    </Dialog>
  );
}
