export interface ExportOptions {
  dataTypes: ('diaries' | 'feedback' | 'analytics')[];
  format: 'json' | 'csv' | 'pdf';
  dateRange?: string;
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  message?: string;
}

export interface BackupOptions {
  type: 'full' | 'incremental';
  encryptionKey?: string;
}

export interface BackupResult {
  success: boolean;
  backupPath?: string;
  message?: string;
}