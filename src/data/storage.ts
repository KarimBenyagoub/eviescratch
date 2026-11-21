import type { Library } from './database';

export interface StorageHealth {
  deviceUsageBytes: number;
  deviceQuotaBytes: number | null;
  deviceRemainingBytes: number | null;
  deviceUsagePercent: number | null;
  notesCount: number;
  notesApproxBytes: number;
  attachmentsCount: number;
  attachmentsTotalBytes: number;
  location: 'device';
  cloudStatus: 'not-connected';
  cloudLimitBytes: number;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0 || isNaN(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(index === 0 ? 0 : decimals)} ${units[index]}`;
}

export async function getStorageHealth(library: Library): Promise<StorageHealth> {
  let deviceUsageBytes = 0;
  let deviceQuotaBytes: number | null = null;
  let deviceRemainingBytes: number | null = null;
  let deviceUsagePercent: number | null = null;

  if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      deviceUsageBytes = estimate.usage ?? 0;
      deviceQuotaBytes = estimate.quota ?? null;
      if (deviceQuotaBytes && deviceQuotaBytes > 0) {
        deviceRemainingBytes = Math.max(0, deviceQuotaBytes - deviceUsageBytes);
        deviceUsagePercent = Math.min(100, (deviceUsageBytes / deviceQuotaBytes) * 100);
      }
    } catch {
      // Storage estimation is optional/best-effort in browsers
    }
  }

  const activeNotes = library.notes.filter(note => !note.deletedAt);
  const notesApproxBytes = JSON.stringify(activeNotes).length;
  const activeAttachments = library.attachments.filter(att => !att.deletedAt);
  const attachmentsTotalBytes = activeAttachments.reduce((total, att) => total + att.size, 0);

  return {
    deviceUsageBytes,
    deviceQuotaBytes,
    deviceRemainingBytes,
    deviceUsagePercent,
    notesCount: activeNotes.length,
    notesApproxBytes,
    attachmentsCount: activeAttachments.length,
    attachmentsTotalBytes,
    location: 'device',
    cloudStatus: 'not-connected',
    cloudLimitBytes: 100_000_000, // 100 MB proposed beta allowance
  };
}
