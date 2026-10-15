export interface TransformedData {
  arrivals: TransportRecord[];
  departures: TransportRecord[];
  subvenue: SubvenueRecord;
  processingDate: string; // The date of the data (e.g., "09-12-2025")
}

export interface TransportRecord {
  tourCodes: string; // The extracted numeric tour IDs (e.g. "7536")
  tourId: string; // The Group Name (e.g. "NAJMI/ HAKIMI")
  pax: number;
  route: string; // "BA" or "NA"
  flight: string;
  time: string;
  tags?: string;
  notes?: string;
}

export interface SubvenueRecord {
  karbalaToNajaf: number;
  najafToKarbala: number;
}

export interface WebhookResponse {
  success: boolean;
  message: string;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  REVIEW = 'REVIEW',
  SENDING = 'SENDING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}