// Types for Excel Converter functionality

export interface ExcelSheetData {
  sheetName: string;
  headers: string[];
  data: any[][];
  rowCount: number;
  columnCount: number;
  type: 'global' | 'regional' | 'country' | 'product' | 'segment' | 'other';
  tableCount?: number;
  metadata?: {
    originalRowCount: number;
    tablesDetected: number;
    processingMethod: 'single-table' | 'multi-table';
    tableTitles?: string[];
    unitsFromData?: string | null;
  };
}

export interface ParsedExcelData {
  fileName: string;
  fileSize: number;
  sheets: ExcelSheetData[];
  uploadedAt: string;
  parsedAt: string;
}

export interface FlatDataRow {
  // Required columns for the output
  Title: string;
  Regions: string;
  Country: string;
  Segments: string;
  Units: string;
  Product: string;
  
  // Year columns 2021-2034
  "2021": number | string;
  "2022": number | string;
  "2023": number | string;
  "2024": number | string;
  "2025": number | string;
  "2026": number | string;
  "2027": number | string;
  "2028": number | string;
  "2029": number | string;
  "2030": number | string;
  "2031": number | string;
  "2032": number | string;
  "2033": number | string;
  "2034": number | string;
  
  CAGR: number | string;
  
  // Additional metadata
  id: string;
  sourceSheet: string;
  sourceRow: number;
  level: 'global' | 'regional' | 'country' | 'product' | 'segment';
  
  [key: string]: any; // For any additional columns from Excel data
}

export interface ConvertedExcelData {
  originalData: ParsedExcelData;
  flatData: FlatDataRow[];
  summary: {
    totalRows: number;
    globalRows: number;
    regionalRows: number;
    countryRows: number;
    productRows: number;
    segmentRows: number;
    columns: string[];
  };
  conversionLog: string[];
}

export interface ExcelConverterState {
  file: File | null;
  isProcessing: boolean;
  parsedData: ParsedExcelData | null;
  convertedData: ConvertedExcelData | null;
  error: string | null;
  currentStep: 'upload' | 'parsing' | 'converting' | 'preview' | 'complete';
}

export interface SheetMapping {
  sheetName: string;
  detectedType: 'global' | 'regional' | 'country' | 'product' | 'segment' | 'other';
  confidence: number;
  mappedType?: 'global' | 'regional' | 'country' | 'product' | 'segment' | 'other';
  keyColumns: string[];
  dataColumns: string[];
}
