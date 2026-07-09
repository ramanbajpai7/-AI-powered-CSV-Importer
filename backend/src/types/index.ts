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
  crm_status: CRMStatus | '';
  crm_note: string;
  data_source: DataSource | '';
  possession_time: string;
  description: string;
}

export type CRMStatus =
  | 'GOOD_LEAD_FOLLOW_UP'
  | 'DID_NOT_CONNECT'
  | 'BAD_LEAD'
  | 'SALE_DONE';

export type DataSource =
  | 'leads_on_demand'
  | 'meridian_tower'
  | 'eden_park'
  | 'varah_swamy'
  | 'sarjapur_plots';

export interface ProcessingResult {
  success: boolean;
  records: CRMRecord[];
  skippedRecords: SkippedRecord[];
  totalImported: number;
  totalSkipped: number;
  totalProcessed: number;
}

export interface SkippedRecord {
  rowIndex: number;
  reason: string;
  originalData: Record<string, string>;
}

export interface ProcessingProgress {
  type: 'progress' | 'complete' | 'error';
  currentBatch: number;
  totalBatches: number;
  processedRecords: number;
  totalRecords: number;
  message: string;
}
