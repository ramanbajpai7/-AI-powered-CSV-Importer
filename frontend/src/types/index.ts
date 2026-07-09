export interface CRMRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

export interface SkippedRecord {
  rowIndex: number;
  reason: string;
  originalData: Record<string, string>;
}

export interface ProcessingResult {
  success: boolean;
  records: CRMRecord[];
  skippedRecords: SkippedRecord[];
  totalImported: number;
  totalSkipped: number;
  totalProcessed: number;
}

export interface UploadResponse {
  success: boolean;
  fileName: string;
  headers: string[];
  records: Record<string, string>[];
  totalRows: number;
}

export interface ProgressUpdate {
  type: 'progress' | 'complete' | 'batch_error' | 'error';
  currentBatch?: number;
  totalBatches?: number;
  processedRecords?: number;
  totalRecords?: number;
  message?: string;
  result?: ProcessingResult;
}

export type AppStep = 'upload' | 'preview' | 'processing' | 'results';
