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

// Parse Excel file and extract all sheets
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
          
          // Find headers (first non-empty row with meaningful content)
          let headers: string[] = [];
          let dataStartIndex = 0;
          
          for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            if (row && row.length > 0 && row.some(cell => cell != null && cell !== '')) {
              // Check if this looks like a header row
              const hasTextHeaders = row.some(cell => 
                cell && typeof cell === 'string' && cell.trim() !== ''
              );
              
              if (hasTextHeaders) {
                headers = row.map(cell => String(cell || '').trim()).filter(h => h !== '');
                dataStartIndex = i + 1;
                break;
              }
            }
          }
          
          // Extract data rows
          const data = rawData.slice(dataStartIndex).filter(row => 
            row && row.length > 0 && row.some(cell => cell != null && cell !== '')
          );
          
          return {
            sheetName,
            headers,
            data,
            rowCount: data.length,
            columnCount: headers.length,
            type: detectSheetType(sheetName, headers),
            tableCount: 1,
            metadata: {
              originalRowCount: rawData.length,
              tablesDetected: 1,
              processingMethod: 'single-table' as const
            }
          };
        });

        resolve({
          fileName: file.name,
          fileSize: file.size,
          sheets,
          uploadedAt: new Date().toISOString(),
          parsedAt: new Date().toISOString()
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

// Server-side version of parseExcelFile (for API routes)
export function parseExcelFileServer(buffer: ArrayBuffer, fileName: string, fileSize: number): ParsedExcelData {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    const sheets: ExcelSheetData[] = workbook.SheetNames.map(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      
      // Get the raw data as array of arrays
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
      
      // Find headers (first non-empty row with meaningful content)
      let headers: string[] = [];
      let dataStartIndex = 0;
      
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (row && row.length > 0 && row.some(cell => cell != null && cell !== '')) {
          // Check if this looks like a header row
          const hasTextHeaders = row.some(cell => 
            cell && typeof cell === 'string' && cell.trim() !== ''
          );
          
          if (hasTextHeaders) {
            headers = row.map(cell => String(cell || '').trim()).filter(h => h !== '');
            dataStartIndex = i + 1;
            break;
          }
        }
      }
      
      // Extract data rows
      const data = rawData.slice(dataStartIndex).filter(row => 
        row && row.length > 0 && row.some(cell => cell != null && cell !== '')
      );
      
      return {
        sheetName,
        headers,
        data,
        rowCount: data.length,
        columnCount: headers.length,
        type: detectSheetType(sheetName, headers),
        tableCount: 1,
        metadata: {
          originalRowCount: rawData.length,
          tablesDetected: 1,
          processingMethod: 'single-table' as const
        }
      };
    });

    return {
      fileName,
      fileSize,
      sheets,
      uploadedAt: new Date().toISOString(),
      parsedAt: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Convert parsed Excel data to flat format
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
  
  // Look for year columns in headers
  const yearColumns = findYearColumns(sheet.headers);
  
  // If no year columns found in headers, try to detect years from data
  const allYears = new Set<number>();
  if (yearColumns.length === 0) {
    // Scan through data to find year patterns
    for (const row of sheet.data) {
      for (let i = 0; i < row.length; i++) {
        const cell = row[i];
        if (cell && typeof cell === 'number') {
          const year = Math.floor(cell);
          if (year >= 1990 && year <= 2100) {
            allYears.add(year);
          }
        } else if (cell && typeof cell === 'string') {
          const yearMatch = String(cell).match(/\b(19|20)\d{2}\b/);
          if (yearMatch) {
            allYears.add(parseInt(yearMatch[0]));
          }
        }
      }
    }
  } else {
    // Use years from headers
    yearColumns.forEach(yc => allYears.add(yc.year));
  }
  
  const detectedYears = Array.from(allYears).sort();
  
  // Process each row in the sheet data
  for (let rowIndex = 0; rowIndex < sheet.data.length; rowIndex++) {
    const row = sheet.data[rowIndex];
    
    // Skip empty rows
    if (!row || row.length === 0 || row.every(cell => cell == null || cell === '')) {
      continue;
    }
    
    // Extract segment name from first column(s)
    const segmentName = extractSegmentFromRow(row);
    if (!segmentName) continue;
    
    // Skip header-like or total rows
    if (isHeaderOrTotalRow(segmentName)) continue;
    
    // Extract year data
    const yearData: { [key: string]: string } = {};
    
    if (yearColumns.length > 0) {
      // Use header-based year columns
      yearColumns.forEach(yearCol => {
        const value = row[yearCol.index];
        if (value != null && value !== '') {
          yearData[yearCol.year.toString()] = formatNumericValue(value);
        }
      });
    } else {
      // Try to extract year data from numeric values in the row
      const numericValues: number[] = [];
      for (let i = 1; i < row.length; i++) { // Skip first column (segment name)
        const cell = row[i];
        if (cell != null && cell !== '') {
          const num = typeof cell === 'number' ? cell : parseFloat(String(cell));
          if (!isNaN(num) && num > 0) {
            numericValues.push(num);
          }
        }
      }
      
      // Map numeric values to detected years
      detectedYears.forEach((year, index) => {
        if (index < numericValues.length) {
          yearData[year.toString()] = formatNumericValue(numericValues[index]);
        }
      });
    }
    
    // Calculate CAGR if we have year data
    const cagr = calculateCAGR(yearData);
    
    // Create flat row with dynamic year columns
    const flatRow: FlatDataRow = {
      id: `${sheet.sheetName}_${idCounter++}`,
      Title: generateTitleFromSheet(sheet.sheetName, segmentName),
      Regions: determineRegions(segmentName, sheet.sheetName),
      Country: determineCountry(segmentName, sheet.sheetName),
      Segments: segmentName,
      Units: determineUnits(sheet.sheetName),
      Product: determineProduct(sheet.sheetName, segmentName),
      
      // Initialize required year columns with empty values
      "2021": "",
      "2022": "",
      "2023": "",
      "2024": "",
      "2025": "",
      "2026": "",
      "2027": "",
      "2028": "",
      "2029": "",
      "2030": "",
      "2031": "",
      "2032": "",
      "2033": "",
      "2034": "",
      
      CAGR: cagr,
      
      // Metadata
      sourceSheet: sheet.sheetName,
      sourceRow: rowIndex + 1,
      level: determineDataLevel(segmentName, sheet.sheetName)
    };
    
    // Add dynamic year columns (this will overwrite the empty standard years if they exist)
    detectedYears.forEach(year => {
      flatRow[year.toString()] = yearData[year.toString()] || "";
    });
    
    // Ensure we populate standard years with detected data if available
    const standardYears = ['2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034'];
    standardYears.forEach(year => {
      if (yearData[year]) {
        flatRow[year] = yearData[year];
      }
    });
    
    rows.push(flatRow);
  }
  
  return { rows, nextId: idCounter };
}

// Helper functions
function detectSheetType(sheetName: string, headers: string[]): 'global' | 'regional' | 'country' | 'product' | 'segment' | 'other' {
  const name = sheetName.toLowerCase();
  const headerText = headers.join(' ').toLowerCase();
  
  if (name.includes('global') || name.includes('worldwide') || headerText.includes('global')) {
    return 'global';
  }
  
  if (name.includes('region') || name.includes('regional') || headerText.includes('region')) {
    return 'regional';
  }
  
  if (name.includes('country') || name.includes('countries') || headerText.includes('country')) {
    return 'country';
  }
  
  if (name.includes('product') || name.includes('item') || headerText.includes('product')) {
    return 'product';
  }
  
  if (name.includes('segment') || name.includes('category') || headerText.includes('segment')) {
    return 'segment';
  }
  
  return 'other';
}

function findYearColumns(headers: string[]): { year: number, index: number }[] {
  const yearColumns: { year: number, index: number }[] = [];
  
  headers.forEach((header, index) => {
    const headerStr = String(header).trim();
    
    // Try to parse as year directly
    let year = parseInt(headerStr);
    
    // If not a direct year, look for year patterns in the header
    if (isNaN(year) || year < 1990 || year > 2100) {
      // Look for 4-digit year patterns in the header text
      const yearMatch = headerStr.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        year = parseInt(yearMatch[0]);
      }
    }
    
    // Check if this is a valid year (expanded range)
    if (!isNaN(year) && year >= 1990 && year <= 2100) {
      yearColumns.push({ year, index });
    }
  });
  
  return yearColumns.sort((a, b) => a.year - b.year);
}

function extractSegmentFromRow(row: any[]): string | null {
  // Look for the first non-null text value in the first few columns
  for (let i = 0; i < Math.min(row.length, 3); i++) {
    const value = row[i];
    if (value && typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed && trimmed !== 'null' && trimmed !== '') {
        return trimmed;
      }
    }
  }
  return null;
}

function isHeaderOrTotalRow(segmentName: string): boolean {
  const lower = segmentName.toLowerCase();
  return lower.includes('total') || 
         lower.includes('segment') ||
         lower.includes('forecast') ||
         lower.includes('estimates') ||
         lower.includes('by') ||
         lower === 'region' ||
         lower === 'country' ||
         lower === 'product';
}

function formatNumericValue(value: any): string {
  if (value == null || value === '') return '';
  
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) return String(value);
  
  return num.toFixed(2);
}

function calculateCAGR(yearData: { [key: string]: string }): string {
  const years = Object.keys(yearData).map(y => parseInt(y)).sort();
  if (years.length < 2) return '';
  
  const firstYear = years[0];
  const lastYear = years[years.length - 1];
  const firstValue = parseFloat(yearData[firstYear.toString()]);
  const lastValue = parseFloat(yearData[lastYear.toString()]);
  
  if (isNaN(firstValue) || isNaN(lastValue) || firstValue <= 0) return '';
  
  const yearsDiff = lastYear - firstYear;
  const cagr = Math.pow(lastValue / firstValue, 1 / yearsDiff) - 1;
  
  return (cagr * 100).toFixed(2);
}

function generateTitleFromSheet(sheetName: string, segmentName: string): string {
  return `${sheetName} - ${segmentName}`;
}

function determineRegions(segmentName: string, sheetName: string): string {
  const combined = (sheetName + ' ' + segmentName).toLowerCase();
  
  if (combined.includes('global') || combined.includes('worldwide')) {
    return 'Global';
  }
  
  const regionKeywords = {
    'North America': ['north america', 'na', 'usa', 'canada'],
    'Europe': ['europe', 'eu', 'emea'],
    'Asia Pacific': ['asia pacific', 'apac', 'asia'],
    'South America': ['south america', 'latin america'],
    'Middle East & Africa': ['mea', 'middle east', 'africa']
  };
  
  for (const [region, keywords] of Object.entries(regionKeywords)) {
    if (keywords.some(keyword => combined.includes(keyword))) {
      return region;
    }
  }
  
  return 'Global';
}

function determineCountry(segmentName: string, sheetName: string): string {
  const combined = (sheetName + ' ' + segmentName).toLowerCase();
  
  const countryMap: { [key: string]: string[] } = {
    'United States': ['usa', 'united states', 'u.s.', 'america'],
    'Canada': ['canada'],
    'United Kingdom': ['uk', 'united kingdom', 'britain'],
    'Germany': ['germany', 'deutschland'],
    'France': ['france'],
    'China': ['china'],
    'Japan': ['japan'],
    'India': ['india'],
    'Australia': ['australia']
  };
  
  for (const [country, keywords] of Object.entries(countryMap)) {
    if (keywords.some(keyword => combined.includes(keyword))) {
      return country;
    }
  }
  
  return '';
}

function determineUnits(sheetName: string): string {
  const lower = sheetName.toLowerCase();
  
  if (lower.includes('billion')) return '(USD Billion)';
  if (lower.includes('million')) return '(USD Million)';
  if (lower.includes('units')) return '(Units)';
  if (lower.includes('thousand')) return '(Thousand)';
  
  return '(USD Million)';
}

function determineProduct(sheetName: string, segmentName: string): string {
  // Extract product information from sheet name or segment
  const combined = (sheetName + ' ' + segmentName).toLowerCase();
  
  if (combined.includes('electric vehicle') || combined.includes('ev')) {
    return 'Electric Vehicle';
  }
  if (combined.includes('3pl') || combined.includes('third party logistics')) {
    return 'Third Party Logistics';
  }
  if (combined.includes('software')) {
    return 'Software';
  }
  if (combined.includes('hardware')) {
    return 'Hardware';
  }
  
  // Try to extract from sheet name
  const cleanSheetName = sheetName.replace(/global|regional|country|by|market|forecast/gi, '').trim();
  return cleanSheetName || 'General';
}

function determineDataLevel(segmentName: string, sheetName: string): 'global' | 'regional' | 'country' | 'product' | 'segment' {
  const combined = (sheetName + ' ' + segmentName).toLowerCase();
  
  if (combined.includes('global') || combined.includes('total') || combined.includes('worldwide')) {
    return 'global';
  }
  
  const regionKeywords = ['north america', 'europe', 'asia pacific', 'south america', 'mea'];
  if (regionKeywords.some(region => combined.includes(region))) {
    return 'regional';
  }
  
  const countryKeywords = ['usa', 'united states', 'canada', 'u.s.', 'uk', 'china', 'japan'];
  if (countryKeywords.some(country => combined.includes(country))) {
    return 'country';
  }
  
  return 'segment';
}

function generateSummary(flatData: FlatDataRow[]): ConvertedExcelData['summary'] {
  let globalRows = 0;
  let regionalRows = 0;
  let countryRows = 0;
  let productRows = 0;
  let segmentRows = 0;
  
  // Collect all unique columns from the data
  const allColumns = new Set<string>();
  
  flatData.forEach(row => {
    switch (row.level) {
      case 'global': globalRows++; break;
      case 'regional': regionalRows++; break;
      case 'country': countryRows++; break;
      case 'product': productRows++; break;
      case 'segment': segmentRows++; break;
    }
    
    // Add all columns from this row
    Object.keys(row).forEach(key => {
      allColumns.add(key);
    });
  });
  
  // Extract year columns and sort them
  const yearColumns: string[] = [];
  const otherColumns: string[] = [];
  
  Array.from(allColumns).forEach(col => {
    const year = parseInt(col);
    if (!isNaN(year) && year >= 1990 && year <= 2100) {
      yearColumns.push(col);
    } else if (!['id', 'sourceSheet', 'sourceRow', 'level'].includes(col)) {
      otherColumns.push(col);
    }
  });
  
  // Sort year columns numerically
  yearColumns.sort((a, b) => parseInt(a) - parseInt(b));
  
  // Create final column order: standard columns, then years, then CAGR
  const standardColumns = ['Title', 'Regions', 'Country', 'Segments', 'Units', 'Product'];
  const finalColumns = [
    ...standardColumns,
    ...yearColumns,
    'CAGR'
  ];
  
  return {
    totalRows: flatData.length,
    globalRows,
    regionalRows,
    countryRows,
    productRows,
    segmentRows,
    columns: finalColumns
  };
}

// Export functions
export function exportToCSV(convertedData: ConvertedExcelData, fileName?: string): void {
  try {
    // Use the dynamic column order from the summary
    const columnOrder = convertedData.summary.columns;
    
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

export function exportToExcel(convertedData: ConvertedExcelData, fileName?: string): void {
  try {
    const wb = XLSX.utils.book_new();
    
    // Use the dynamic column order from the summary
    const columnOrder = convertedData.summary.columns;
    
    // Create worksheet data
    const wsData = [
      columnOrder, // Header row
      ...convertedData.flatData.map(row => 
        columnOrder.map(col => row[col] || '')
      )
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Flat Data');
    
    // Generate file name
    const outputFileName = fileName || `Market_Data_${convertedData.originalData.fileName.replace(/\.[^/.]+$/, '')}_${new Date().getTime()}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, outputFileName);
  } catch (error) {
    console.error('Export to Excel failed:', error);
    throw new Error(`Failed to export Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function saveAsJSON(convertedData: ConvertedExcelData, fileName?: string): void {
  try {
    const jsonContent = JSON.stringify(convertedData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const outputFileName = fileName || `Market_Data_${convertedData.originalData.fileName.replace(/\.[^/.]+$/, '')}_${new Date().getTime()}.json`;
    saveAs(blob, outputFileName);
  } catch (error) {
    console.error('Export to JSON failed:', error);
    throw new Error(`Failed to export JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
