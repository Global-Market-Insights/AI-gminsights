// Excel processing utilities - Clean version
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { 
  ExcelSheetData, 
  ParsedExcelData, 
  FlatDataRow, 
  ConvertedExcelData, 
  SheetMapping 
} from '@/types/excel-converter';

// Parse Excel file and extract all sheets with enhanced table detection
export async function parseExcelFile(file: File): Promise<ParsedExcelData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheets: ExcelSheetData[] = workbook.SheetNames.map(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          
          // Get the raw data as array of arrays
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
          
          // Enhanced table detection - find all tables in the sheet
          const tablesInSheet = detectTablesInSheet(rawData, sheetName);
          
          // If multiple tables found, combine them intelligently
          let processedData;
          if (tablesInSheet.length > 1) {
            processedData = combineTablesInSheet(tablesInSheet, sheetName);
          } else if (tablesInSheet.length === 1) {
            processedData = tablesInSheet[0];
          } else {
            // Fallback to simple processing
            processedData = processSimpleSheet(rawData);
          }
          
          return {
            sheetName,
            headers: processedData.headers,
            data: processedData.data,
            rowCount: processedData.data.length,
            columnCount: processedData.headers.length,
            type: detectSheetType(sheetName, processedData.headers),
            tableCount: tablesInSheet.length,
            metadata: {
              originalRowCount: rawData.length,
              tablesDetected: tablesInSheet.length,
              processingMethod: tablesInSheet.length > 1 ? 'multi-table' : 'single-table'
            }
          };
        });
        
        const parsedData: ParsedExcelData = {
          fileName: file.name,
          fileSize: file.size,
          sheets,
          uploadedAt: new Date().toISOString(),
          parsedAt: new Date().toISOString()
        };
        
        resolve(parsedData);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

// Detect sheet type based on name and headers
function detectSheetType(sheetName: string, headers: string[]): 'global' | 'regional' | 'country' | 'product' | 'segment' | 'other' {
  const name = sheetName.toLowerCase();
  const headerText = headers.join(' ').toLowerCase();
  
  // Global indicators
  if (name.includes('global') || name.includes('worldwide') || name.includes('total') || name.includes('summary')) {
    return 'global';
  }
  
  // Regional indicators
  if (name.includes('region') || name.includes('regional') || name.includes('continent') || 
      headerText.includes('region') || headerText.includes('continent')) {
    return 'regional';
  }
  
  // Country indicators
  if (name.includes('country') || name.includes('countries') || name.includes('nation') ||
      headerText.includes('country') || headerText.includes('nation')) {
    return 'country';
  }
  
  // Product indicators
  if (name.includes('product') || name.includes('item') || name.includes('sku') ||
      headerText.includes('product') || headerText.includes('item') || headerText.includes('sku')) {
    return 'product';
  }
  
  // Segment indicators
  if (name.includes('segment') || name.includes('category') || name.includes('type') ||
      headerText.includes('segment') || headerText.includes('category')) {
    return 'segment';
  }
  
  return 'other';
}

// Convert parsed Excel data to flat structure with required columns
export function convertToFlatData(parsedData: ParsedExcelData): ConvertedExcelData {
  const flatData: FlatDataRow[] = [];
  const conversionLog: string[] = [];
  let idCounter = 1;
  
  conversionLog.push(`Starting conversion of ${parsedData.sheets.length} sheets`);
  
  // Process each sheet and extract data into the required format
  parsedData.sheets.forEach(sheet => {
    if (sheet.data.length === 0) {
      conversionLog.push(`⚠️ Skipped empty sheet: ${sheet.sheetName}`);
      return;
    }
    
    conversionLog.push(`📊 Processing ${sheet.sheetName} (${sheet.data.length} rows, ${sheet.headers.length} cols)`);
    
    // Extract market data from each sheet
    const extractedRows = extractMarketDataFromSheet(sheet, idCounter);
    flatData.push(...extractedRows.rows);
    idCounter = extractedRows.nextId;
    
    if (extractedRows.rows.length > 0) {
      conversionLog.push(`✅ Extracted ${extractedRows.rows.length} data rows from ${sheet.sheetName}`);
    } else {
      conversionLog.push(`⚠️ No data rows extracted from ${sheet.sheetName}`);
    }
  });
  
  // Generate summary
  const summary = generateSummary(flatData);
  conversionLog.push(`✅ Conversion complete: ${flatData.length} total rows`);
  
  return {
    originalData: parsedData,
    flatData,
    summary,
    conversionLog
  };
}

// Extract market data from a sheet and format it according to required columns
function extractMarketDataFromSheet(sheet: ExcelSheetData, startId: number): { rows: FlatDataRow[], nextId: number } {
  const rows: FlatDataRow[] = [];
  let idCounter = startId;
  
  // Process each row in the sheet data
  for (let rowIndex = 0; rowIndex < sheet.data.length; rowIndex++) {
    const row = sheet.data[rowIndex];
    
    // Skip empty rows
    if (!row || row.length === 0 || row.every(cell => cell == null || cell === '')) {
      continue;
    }
    
    // Check if this row has data with years and a segment name
    const extractedData = extractDataFromRow(row, rowIndex, sheet);
    
    if (extractedData) {
      const flatRow: FlatDataRow = {
        id: `${sheet.sheetName}_${idCounter++}`,
        Title: extractedData.title,
        Regions: extractedData.regions,
        Country: extractedData.country,
        Segments: extractedData.segments,
        Units: extractedData.units,
        Product: extractedData.product,
        
        // Initialize year columns
        "2021": extractedData.yearData["2021"] || "",
        "2022": extractedData.yearData["2022"] || "",
        "2023": extractedData.yearData["2023"] || "",
        "2024": extractedData.yearData["2024"] || "",
        "2025": extractedData.yearData["2025"] || "",
        "2026": extractedData.yearData["2026"] || "",
        "2027": extractedData.yearData["2027"] || "",
        "2028": extractedData.yearData["2028"] || "",
        "2029": extractedData.yearData["2029"] || "",
        "2030": extractedData.yearData["2030"] || "",
        "2031": extractedData.yearData["2031"] || "",
        "2032": extractedData.yearData["2032"] || "",
        "2033": extractedData.yearData["2033"] || "",
        "2034": extractedData.yearData["2034"] || "",
        
        CAGR: extractedData.cagr,
        
        // Metadata
        sourceSheet: sheet.sheetName,
        sourceRow: rowIndex + 1,
        level: extractedData.level
      };
      
      rows.push(flatRow);
    }
  }
  
  return { rows, nextId: idCounter };
}

// Interface for extracted row data
interface ExtractedRowData {
  title: string;
  regions: string;
  country: string;
  segments: string;
  units: string;
  product: string;
  yearData: { [key: string]: string };
  cagr: string;
  level: 'global' | 'regional' | 'country' | 'product' | 'segment';
}

// Extract data from a single row
function extractDataFromRow(row: any[], rowIndex: number, sheet: ExcelSheetData): ExtractedRowData | null {
  // Look for segment name in the first few columns
  let segmentName = '';
  let dataStartIndex = 0;
  
  // Find the segment name (first non-null text value)
  for (let i = 0; i < Math.min(row.length, 3); i++) {
    const cell = row[i];
    if (cell && typeof cell === 'string' && cell.trim() && 
        !cell.toLowerCase().includes('null') && 
        cell.trim() !== '') {
      segmentName = cell.trim();
      dataStartIndex = i + 1;
      break;
    }
  }
  
  // Skip if no segment name found
  if (!segmentName) {
    return null;
  }
  
  // Skip total rows and header-like rows
  if (segmentName.toLowerCase().includes('total') || 
      segmentName.toLowerCase().includes('segment') ||
      segmentName.toLowerCase().includes('forecast') ||
      segmentName.toLowerCase().includes('estimates')) {
    return null;
  }
  
  // Extract year data and CAGR
  const yearData: { [key: string]: string } = {};
  let cagr = '';
  
  // Look for numeric data that could be year values
  for (let i = dataStartIndex; i < row.length; i++) {
    const cell = row[i];
    if (cell != null && cell !== '') {
      const value = typeof cell === 'number' ? cell : parseFloat(String(cell));
      
      // Determine what this value represents
      if (!isNaN(value)) {
        // If it's a small decimal (< 1), it's likely CAGR
        if (value > 0 && value < 1) {
          cagr = (value * 100).toFixed(2);
        } else if (value > 1) {
          // It's likely a year value - assign to the next available year
          const availableYears = ['2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034'];
          const usedYears = Object.keys(yearData);
          const nextYear = availableYears.find(year => !usedYears.includes(year));
          
          if (nextYear) {
            yearData[nextYear] = value.toFixed(2);
          }
        }
      }
    }
  }
  
  // Skip rows without significant numeric data
  if (Object.keys(yearData).length === 0) {
    return null;
  }
  
  // Determine the context and categorization
  const title = generateTitleFromSheet(sheet.sheetName, segmentName);
  const regions = determineRegions(segmentName, sheet.sheetName);
  const country = determineCountry(segmentName, sheet.sheetName);
  const segments = determineSegments(segmentName, sheet.sheetName);
  const units = determineUnits(sheet.sheetName);
  const product = determineProduct(sheet.sheetName, segmentName);
  const level = determineDataLevel(segmentName, sheet.sheetName);
  
  return {
    title,
    regions,
    country,
    segments,
    units,
    product,
    yearData,
    cagr,
    level
  };
}

// Helper functions for data extraction
function generateTitleFromSheet(sheetName: string, segmentName: string): string {
  // Clean up sheet name and create a descriptive title
  let baseTitle = sheetName.replace(/\s+/g, ' ').trim();
  
  // If it's a market research sheet, create market title
  if (baseTitle.toLowerCase().includes('market') || baseTitle.toLowerCase().includes('logistics')) {
    return `${baseTitle} Market Analysis - ${segmentName}`;
  }
  
  return `${baseTitle} - ${segmentName}`;
}

function determineRegions(segmentName: string, sheetName: string): string {
  const regionKeywords = {
    'north america': 'North America',
    'europe': 'Europe', 
    'asia pacific': 'Asia Pacific',
    'south america': 'South America',
    'mea': 'MEA',
    'middle east': 'Middle East',
    'africa': 'Africa'
  };
  
  const lowerSegment = segmentName.toLowerCase();
  const lowerSheet = sheetName.toLowerCase();
  
  // Check segment name first
  for (const [keyword, region] of Object.entries(regionKeywords)) {
    if (lowerSegment.includes(keyword) || lowerSheet.includes(keyword)) {
      return region;
    }
  }
  
  // If sheet name indicates regional data
  if (lowerSheet.includes('global')) {
    return 'Global';
  }
  
  return '';
}

function determineCountry(segmentName: string, sheetName: string): string {
  const countryKeywords = {
    'usa': 'USA',
    'united states': 'USA',
    'u.s.': 'USA',
    'canada': 'Canada',
    'uk': 'UK',
    'united kingdom': 'UK',
    'germany': 'Germany',
    'france': 'France',
    'china': 'China',
    'japan': 'Japan',
    'india': 'India',
    'brazil': 'Brazil'
  };
  
  const lowerSegment = segmentName.toLowerCase();
  const lowerSheet = sheetName.toLowerCase();
  
  // Check both segment and sheet name
  for (const [keyword, country] of Object.entries(countryKeywords)) {
    if (lowerSegment.includes(keyword) || lowerSheet.includes(keyword)) {
      return country;
    }
  }
  
  return '';
}

function determineSegments(segmentName: string, sheetName: string): string {
  const lowerSegment = segmentName.toLowerCase();
  const lowerSheet = sheetName.toLowerCase();
  
  // If it's not a geographic entity, it's likely a business segment
  const regionKeywords = ['north america', 'europe', 'asia pacific', 'south america', 'mea', 'global'];
  const countryKeywords = ['usa', 'canada', 'uk', 'china', 'japan', 'india', 'brazil'];
  
  const isGeographic = regionKeywords.some(r => lowerSegment.includes(r) || lowerSheet.includes(r)) ||
                      countryKeywords.some(c => lowerSegment.includes(c) || lowerSheet.includes(c));
  
  if (!isGeographic) {
    // Extract segment type from sheet context
    if (lowerSheet.includes('solution')) return `By Solution - ${segmentName}`;
    if (lowerSheet.includes('application')) return `By Application - ${segmentName}`;
    if (lowerSheet.includes('end use')) return `By End Use - ${segmentName}`;
    if (lowerSheet.includes('product')) return `By Product - ${segmentName}`;
    
    return segmentName;
  }
  
  return '';
}

function determineUnits(sheetName: string): string {
  const lowerSheet = sheetName.toLowerCase();
  
  if (lowerSheet.includes('billion')) return 'USD Billion';
  if (lowerSheet.includes('million')) return 'USD Million';
  if (lowerSheet.includes('thousand')) return 'USD Thousand';
  
  return 'USD Billion'; // Default for market data
}

function determineProduct(sheetName: string, segmentName: string): string {
  let product = sheetName.replace(/\s+/g, ' ').trim();
  
  // Clean up product name
  product = product.replace(/\b(market|forecast|analysis|data|estimates|sheet|global|regional|country)\b/gi, '').trim();
  
  if (!product || product.length < 3) {
    product = segmentName;
  }
  
  return product;
}

function determineDataLevel(segmentName: string, sheetName: string): 'global' | 'regional' | 'country' | 'product' | 'segment' {
  const lowerSegment = segmentName.toLowerCase();
  const lowerSheet = sheetName.toLowerCase();
  
  if (lowerSegment.includes('global') || lowerSheet.includes('global')) {
    return 'global';
  }
  
  const regionKeywords = ['north america', 'europe', 'asia pacific', 'south america', 'mea'];
  if (regionKeywords.some(r => lowerSegment.includes(r))) {
    return 'regional';
  }
  
  const countryKeywords = ['usa', 'canada', 'uk', 'china', 'japan', 'india', 'brazil'];
  if (countryKeywords.some(c => lowerSegment.includes(c))) {
    return 'country';
  }
  
  if (lowerSheet.includes('product')) {
    return 'product';
  }
  
  return 'segment';
}

// Generate summary statistics
function generateSummary(flatData: FlatDataRow[]): ConvertedExcelData['summary'] {
  let globalRows = 0;
  let regionalRows = 0;
  let countryRows = 0;
  let productRows = 0;
  let segmentRows = 0;
  
  flatData.forEach(row => {
    // Count by level
    switch (row.level) {
      case 'global': globalRows++; break;
      case 'regional': regionalRows++; break;
      case 'country': countryRows++; break;
      case 'product': productRows++; break;
      case 'segment': segmentRows++; break;
    }
  });
  
  // Standard columns for the output format
  const standardColumns = [
    'Title', 'Regions', 'Country', 'Segments', 'Units', 'Product',
    '2021', '2022', '2023', '2024', '2025', '2026', '2027',
    '2028', '2029', '2030', '2031', '2032', '2033', '2034',
    'CAGR'
  ];
  
  return {
    totalRows: flatData.length,
    globalRows,
    regionalRows,
    countryRows,
    productRows,
    segmentRows,
    columns: standardColumns
  };
}

// Export converted data to CSV file
export function exportToCSV(convertedData: ConvertedExcelData, fileName?: string): void {
  try {
    // Define the exact column order for the output
    const columnOrder = [
      'Title', 'Regions', 'Country', 'Segments', 'Units', 'Product',
      '2021', '2022', '2023', '2024', '2025', '2026', '2027',
      '2028', '2029', '2030', '2031', '2032', '2033', '2034',
      'CAGR'
    ];
    
    // Create CSV content
    let csvContent = '';
    
    // Add header row
    csvContent += columnOrder.join(',') + '\n';
    
    // Add data rows
    convertedData.flatData.forEach(row => {
      const csvRow = columnOrder.map(col => {
        let value = row[col] || '';
        
        // Handle string values that might contain commas or quotes
        if (typeof value === 'string') {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
            value = '"' + value.replace(/"/g, '""') + '"';
          }
        }
        
        return value;
      });
      
      csvContent += csvRow.join(',') + '\n';
    });
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const outputFileName = fileName || `Market_Data_${convertedData.originalData.fileName.replace(/\.[^/.]+$/, '')}_${new Date().getTime()}.csv`;
    saveAs(blob, outputFileName);
  } catch (error) {
    console.error('Export to CSV failed:', error);
    throw new Error(`Failed to export CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Export flat data to Excel file
export function exportToExcel(convertedData: ConvertedExcelData, fileName?: string): void {
  try {
    const wb = XLSX.utils.book_new();
    
    // Define the exact column order for the output
    const columnOrder = [
      'Title', 'Regions', 'Country', 'Segments', 'Units', 'Product',
      '2021', '2022', '2023', '2024', '2025', '2026', '2027',
      '2028', '2029', '2030', '2031', '2032', '2033', '2034',
      'CAGR'
    ];
    
    // Prepare data with exact column order
    const orderedData = convertedData.flatData.map(row => {
      const orderedRow: any = {};
      columnOrder.forEach(col => {
        orderedRow[col] = row[col] || '';
      });
      return orderedRow;
    });
    
    // Create flat data sheet with ordered columns
    const flatWS = XLSX.utils.json_to_sheet(orderedData, { header: columnOrder });
    
    // Set column widths for better readability
    const colWidths = [
      { wch: 25 }, // Title
      { wch: 15 }, // Regions
      { wch: 15 }, // Country
      { wch: 20 }, // Segments
      { wch: 12 }, // Units
      { wch: 20 }, // Product
      ...Array(14).fill({ wch: 10 }), // Years 2021-2034
      { wch: 8 }   // CAGR
    ];
    flatWS['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, flatWS, 'Market Data');
    
    // Add summary sheet
    const summaryData = [
      ['Excel Conversion Summary'],
      [''],
      ['File Information'],
      ['Original File', convertedData.originalData.fileName],
      ['File Size', `${(convertedData.originalData.fileSize / 1024 / 1024).toFixed(2)} MB`],
      ['Sheets Processed', convertedData.originalData.sheets.length],
      ['Conversion Date', new Date().toLocaleDateString()],
      [''],
      ['Data Summary'],
      ['Total Data Rows', convertedData.summary.totalRows],
      ['Global Rows', convertedData.summary.globalRows],
      ['Regional Rows', convertedData.summary.regionalRows],
      ['Country Rows', convertedData.summary.countryRows],
      ['Product Rows', convertedData.summary.productRows],
      ['Segment Rows', convertedData.summary.segmentRows],
      [''],
      ['Output Columns'],
      ...columnOrder.map(col => [col]),
      [''],
      ['Processing Log'],
      ...convertedData.conversionLog.map(log => [log])
    ];
    
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWS['!cols'] = [{ wch: 20 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');
    
    // Add original sheets for reference (first 3 sheets only to avoid huge files)
    const maxSheetsToInclude = 3;
    convertedData.originalData.sheets.slice(0, maxSheetsToInclude).forEach(sheet => {
      if (sheet.data.length > 0) {
        const originalWS = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.data]);
        const sheetName = sheet.sheetName.substring(0, 31); // Excel sheet name limit
        XLSX.utils.book_append_sheet(wb, originalWS, `Orig_${sheetName}`);
      }
    });
    
    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Download file
    const outputFileName = fileName || `Market_Data_${convertedData.originalData.fileName.replace(/\.[^/.]+$/, '')}_${new Date().getTime()}.xlsx`;
    saveAs(blob, outputFileName);
  } catch (error) {
    console.error('Export to Excel failed:', error);
    throw new Error(`Failed to export Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Save converted data as JSON
export function saveAsJSON(data: ConvertedExcelData): void {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const fileName = `converted_${data.originalData.fileName.replace(/\.[^/.]+$/, '')}_${new Date().getTime()}.json`;
    saveAs(blob, fileName);
  } catch (error) {
    console.error('Save as JSON failed:', error);
    throw new Error(`Failed to save JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Enhanced table detection functions
interface TableRegion {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  headers: string[];
  data: any[][];
  confidence: number;
}

interface ProcessedSheetData {
  headers: string[];
  data: any[][];
}

// Detect multiple tables within a sheet
function detectTablesInSheet(rawData: any[][], sheetName: string): TableRegion[] {
  const tables: TableRegion[] = [];
  const processed = new Set<string>(); // Track processed cells
  
  for (let row = 0; row < rawData.length; row++) {
    for (let col = 0; col < (rawData[row]?.length || 0); col++) {
      const cellKey = `${row},${col}`;
      
      if (processed.has(cellKey)) continue;
      
      // Check if this could be a table header
      const cell = rawData[row]?.[col];
      if (cell != null && String(cell).trim() !== '') {
        const tableRegion = identifyTableRegion(rawData, row, col, processed);
        
        if (tableRegion && tableRegion.confidence > 0.6) {
          tables.push(tableRegion);
          
          // Mark all cells in this table as processed
          for (let r = tableRegion.startRow; r <= tableRegion.endRow; r++) {
            for (let c = tableRegion.startCol; c <= tableRegion.endCol; c++) {
              processed.add(`${r},${c}`);
            }
          }
        }
      }
    }
  }
  
  // Sort tables by confidence and size
  return tables.sort((a, b) => {
    const aSize = (a.endRow - a.startRow) * (a.endCol - a.startCol);
    const bSize = (b.endRow - b.startRow) * (b.endCol - b.startCol);
    return (b.confidence * bSize) - (a.confidence * aSize);
  });
}

// Identify a table region starting from a potential header cell
function identifyTableRegion(rawData: any[][], startRow: number, startCol: number, processed: Set<string>): TableRegion | null {
  // Find the extent of the current table
  let endRow = startRow;
  let endCol = startCol;
  
  // Extend right to find all headers in this row
  const headerRow = rawData[startRow] || [];
  while (endCol < headerRow.length && headerRow[endCol] != null && String(headerRow[endCol]).trim() !== '') {
    endCol++;
  }
  endCol--; // Last valid column
  
  if (endCol <= startCol) return null; // Need at least 2 columns
  
  // Extract potential headers
  const headers: string[] = [];
  for (let col = startCol; col <= endCol; col++) {
    const headerValue = headerRow[col];
    headers.push(String(headerValue || '').trim());
  }
  
  // Find data rows below headers
  const data: any[][] = [];
  let currentRow = startRow + 1;
  let consecutiveEmptyRows = 0;
  
  while (currentRow < rawData.length && consecutiveEmptyRows < 3) {
    const row = rawData[currentRow] || [];
    const rowData: any[] = [];
    let hasData = false;
    
    // Extract data for this row within the column range
    for (let col = startCol; col <= endCol; col++) {
      const cellValue = row[col];
      rowData.push(cellValue || '');
      if (cellValue != null && String(cellValue).trim() !== '') {
        hasData = true;
      }
    }
    
    if (hasData) {
      data.push(rowData);
      consecutiveEmptyRows = 0;
      endRow = currentRow;
    } else {
      consecutiveEmptyRows++;
    }
    
    currentRow++;
  }
  
  // Calculate confidence based on data consistency
  const confidence = calculateTableConfidence(headers, data);
  
  if (data.length === 0 || confidence < 0.3) {
    return null;
  }
  
  return {
    startRow,
    endRow,
    startCol,
    endCol,
    headers,
    data,
    confidence
  };
}

// Calculate confidence score for identified table
function calculateTableConfidence(headers: string[], data: any[][]): number {
  let score = 0;
  
  // Header quality (30%)
  const validHeaders = headers.filter(h => h && h.length > 0).length;
  score += (validHeaders / headers.length) * 0.3;
  
  // Data consistency (40%)
  const totalCells = data.length * headers.length;
  const nonEmptyCells = data.reduce((count, row) => {
    return count + row.filter(cell => cell != null && String(cell).trim() !== '').length;
  }, 0);
  score += (nonEmptyCells / totalCells) * 0.4;
  
  // Structure (30%)
  if (data.length >= 2) score += 0.15; // At least 2 data rows
  if (headers.length >= 3) score += 0.15; // At least 3 columns
  
  return Math.min(score, 1.0);
}

// Combine multiple tables in a sheet
function combineTablesInSheet(tables: TableRegion[], sheetName: string): ProcessedSheetData {
  if (tables.length === 0) {
    return { headers: [], data: [] };
  }
  
  // Use the most confident table as primary
  const primaryTable = tables[0];
  const headers = primaryTable.headers;
  let data = [...primaryTable.data];
  
  // Merge other compatible tables
  for (let i = 1; i < tables.length; i++) {
    const table = tables[i];
    
    // Check if headers are compatible (same number of columns)
    if (table.headers.length === headers.length) {
      data.push(...table.data);
    }
  }
  
  return { headers, data };
}

// Process simple sheet (fallback)
function processSimpleSheet(rawData: any[][]): ProcessedSheetData {
  if (rawData.length === 0) {
    return { headers: [], data: [] };
  }
  
  // Find first non-empty row as headers
  let headerRow: any[] = [];
  let dataStartIndex = 0;
  
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    if (row && row.some(cell => cell != null && String(cell).trim() !== '')) {
      headerRow = row;
      dataStartIndex = i + 1;
      break;
    }
  }
  
  // Convert headers to strings
  const headers = headerRow.map(h => String(h || '').trim());
  
  // Get data rows
  const data = rawData.slice(dataStartIndex).filter(row => 
    row && row.some(cell => cell != null && String(cell).trim() !== '')
  );
  
  return { headers, data };
}
