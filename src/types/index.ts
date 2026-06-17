export type DataFormat = 'csv' | 'json' | 'xml' | 'yaml';

export type JsonData = Record<string, unknown> | unknown[];

export interface ConversionResult {
  success: boolean;
  data?: string;
  error?: string;
}

export interface ConversionHistoryItem {
  id: string;
  timestamp: number;
  sourceFormat: DataFormat;
  targetFormat: DataFormat;
  input: string;
  output: string;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}
