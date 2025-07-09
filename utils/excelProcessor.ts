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
          
          // Scan for table titles with "By" patterns in the raw data
          const tableTitles = scanForTableTitles(rawData);
          
          // Scan for units in the raw data
          const unitsFromData = scanForUnitsInData(rawData);
          
          // Find headers (first non-empty row with meaningful content)
          let headers: string[] = [];
          let dataStartIndex = 0;
          
          for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            if (row && row.length > 0 && row.some(cell => cell != null && cell !== '')) {
              // Check if this looks like a header row (has text and isn't just years)
              const hasTextHeaders = row.some(cell => 
                cell && typeof cell === 'string' && cell.trim() !== ''
              );
              
              // Check if this row is mostly years (skip if so)
              const isYearRow = isRowMostlyYears(row);
              
              if (hasTextHeaders && !isYearRow) {
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
              processingMethod: 'single-table' as const,
              tableTitles: tableTitles,
              unitsFromData: unitsFromData
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
      
      // Scan for table titles with "By" patterns in the raw data
      const tableTitles = scanForTableTitles(rawData);
      
      // Scan for units in the raw data
      const unitsFromData = scanForUnitsInData(rawData);
      
      // Find headers (first non-empty row with meaningful content)
      let headers: string[] = [];
      let dataStartIndex = 0;
      
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (row && row.length > 0 && row.some(cell => cell != null && cell !== '')) {
          // Check if this looks like a header row (has text and isn't just years)
          const hasTextHeaders = row.some(cell => 
            cell && typeof cell === 'string' && cell.trim() !== ''
          );
          
          // Check if this row is mostly years (skip if so)
          const isYearRow = isRowMostlyYears(row);
          
          if (hasTextHeaders && !isYearRow) {
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
          processingMethod: 'single-table' as const,
          tableTitles: tableTitles,
          unitsFromData: unitsFromData
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
  
  // Extract segment information from sheet title or table titles
  let segmentFromTitle = extractSegmentFromTitle(sheet.sheetName);
  
  // Also check for segments in the raw data table titles
  if (!segmentFromTitle && sheet.metadata && sheet.metadata.tableTitles) {
    for (const title of sheet.metadata.tableTitles) {
      const segmentFromTableTitle = extractSegmentFromByPattern(title);
      if (segmentFromTableTitle) {
        segmentFromTitle = segmentFromTableTitle;
        break;
      }
    }
  }
  
  // Log what segment was found from titles
  if (segmentFromTitle) {
    console.log(`Found segment from title in ${sheet.sheetName}: "${segmentFromTitle}"`);
  }
  
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
    
    // Skip header-like, total rows, or year-only rows
    if (isHeaderOrTotalRow(segmentName) || isYearOnlyRow(row, detectedYears)) continue;
    
    // Determine segment and product mapping
    let finalSegment = segmentName; // This will be the product
    let finalProduct = filterOutUnitPatterns(segmentName); // Filter units from product name
    
    // Check if we have a "By [segment]" pattern from table titles
    if (segmentFromTitle) {
      // Use the "By [segment]" as the main segment category
      finalSegment = segmentFromTitle;
      // Keep the row segment name as the product (filtered)
      finalProduct = filterOutUnitPatterns(segmentName);
    } else {
      // Check if the current row contains a "By" pattern for segment extraction
      const segmentFromRow = extractSegmentFromByPattern(segmentName);
      if (segmentFromRow) {
        finalSegment = segmentFromRow;
        finalProduct = filterOutUnitPatterns(segmentName); // Keep original as product (filtered)
      } else {
        // Also check for "By" patterns in the entire row
        let foundByPattern = false;
        for (const cell of row) {
          if (cell && typeof cell === 'string') {
            const segmentFromCell = extractSegmentFromByPattern(cell);
            if (segmentFromCell) {
              finalSegment = segmentFromCell;
              finalProduct = filterOutUnitPatterns(segmentName); // Keep row segment as product (filtered)
              foundByPattern = true;
              break;
            }
          }
        }
        
        // If no "By" pattern found anywhere, use row segment as both segment and product
        if (!foundByPattern) {
          finalSegment = segmentName;
          finalProduct = determineProduct(sheet.sheetName, segmentName); // This function already filters units
        }
      }
    }
    
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
    const cagr = calculateCAGR(yearData);      // Create flat row with dynamic year columns
      const flatRow: FlatDataRow = {
        id: `${sheet.sheetName}_${idCounter++}`,
        Title: generateTitleFromSheet(sheet.sheetName, finalSegment),
        Regions: determineRegions(finalSegment, sheet.sheetName),
        Country: determineCountry(finalSegment, sheet.sheetName),
        Segments: finalSegment, // This will be the "By [segment]" category
        Units: determineUnits(sheet.sheetName, sheet.metadata?.tableTitles, sheet.metadata?.unitsFromData),
        Product: finalProduct, // This will be the specific row product/category
      
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
      level: determineDataLevel(finalSegment, sheet.sheetName)
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
    
    // Check for duplicate segments (avoid adding the same segment multiple times)
    const isDuplicate = rows.some(existingRow => 
      existingRow.Segments === finalSegment && 
      existingRow.Product === finalProduct &&
      existingRow.sourceSheet === sheet.sheetName &&
      existingRow.level === determineDataLevel(finalSegment, sheet.sheetName)
    );
    
    if (isDuplicate) continue;
    
    rows.push(flatRow);
  }
  
  return { rows, nextId: idCounter };
}

// Helper functions
function isRowMostlyYears(row: any[]): boolean {
  const nonEmptyValues = row.filter(cell => cell != null && cell !== '');
  if (nonEmptyValues.length === 0) return false;
  
  let yearCount = 0;
  for (const cell of nonEmptyValues) {
    const cellStr = String(cell).trim();
    const cellNum = typeof cell === 'number' ? cell : parseFloat(cellStr);
    
    // Check if it's a year
    if (!isNaN(cellNum)) {
      const year = Math.floor(cellNum);
      if (year >= 1990 && year <= 2100) {
        yearCount++;
      }
    } else if (cellStr.match(/\b(19|20)\d{2}\b/)) {
      yearCount++;
    }
  }
  
  // If more than 50% of values are years, consider it a year row
  return (yearCount / nonEmptyValues.length) > 0.5;
}

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
        // Skip if it looks like a year
        const yearMatch = trimmed.match(/^\b(19|20)\d{2}\b$/);
        if (yearMatch) continue;
        
        // Skip if it's a pure number that could be a year
        const num = parseFloat(trimmed);
        if (!isNaN(num) && num >= 1990 && num <= 2100) continue;
        
        // Check if this contains a "By" segment pattern
        const segmentFromBy = extractSegmentFromByPattern(trimmed);
        if (segmentFromBy) return segmentFromBy;
        
        return trimmed;
      }
    }
  }
  return null;
}

function extractSegmentFromTitle(sheetName: string): string | null {
  // Look for "By [segment]" patterns in sheet name or table titles
  const byPattern = /(?:^|[^\w])By\s+([^,\d]+?)(?:\s*,|\s+\d{4}|$)/i;
  const match = sheetName.match(byPattern);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  return null;
}

function extractSegmentFromByPattern(text: string): string | null {
  // Extract segment from "By [segment]" patterns
  // Patterns like "XXX Market Estimates & Forecast, By AAA, 2021 - 2034, (USD Billion)"
  // or "XXX Market, By BBB, 2021 - 2034 (USD Billion)"
  
  const patterns = [
    /By\s+([^,\d\(]+?)(?:\s*,|\s+\d{4}|\s*\()/i,  // By AAA, or By AAA 2021 or By AAA (
    /By\s+([^,\d\(]+?)(?:\s*$)/i,                  // By AAA at end
    /By\s+([^,\d\(]+?)(?:\s+[,\-])/i               // By AAA - or By AAA,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let segment = match[1].trim();
      
      // Clean up common suffixes and prefixes
      segment = segment.replace(/\s*(market|estimates?|forecast|analysis|type|category)$/i, '');
      segment = segment.replace(/^(the|a|an)\s+/i, ''); // Remove articles
      segment = segment.replace(/\s*[,;:\-]$/, ''); // Remove trailing punctuation
      segment = segment.replace(/\s+/g, ' '); // Normalize spaces
      
      if (segment && segment.length > 1) {
        return segment;
      }
    }
  }
  
  return null;
}

function scanForTableTitles(rawData: any[][]): string[] {
  const titles: string[] = [];
  
  // Look through the first 15 rows for table titles
  for (let i = 0; i < Math.min(rawData.length, 15); i++) {
    const row = rawData[i];
    if (row && row.length > 0) {
      for (const cell of row) {
        if (cell && typeof cell === 'string') {
          const cellStr = cell.trim();
          // Look for titles that contain market-related keywords and "By" patterns
          if (cellStr.length > 15 && 
              (cellStr.toLowerCase().includes('market') || 
               cellStr.toLowerCase().includes('forecast') ||
               cellStr.toLowerCase().includes('estimates')) && 
              cellStr.toLowerCase().includes('by')) {
            
            // Avoid duplicates
            if (!titles.some(existingTitle => 
                existingTitle.toLowerCase() === cellStr.toLowerCase())) {
              titles.push(cellStr);
            }
          }
        }
      }
    }
  }
  
  return titles;
}

// Scan raw data for unit information
function scanForUnitsInData(rawData: any[][]): string | null {
  // Look through the first 10 rows for unit indicators
  for (let i = 0; i < Math.min(rawData.length, 10); i++) {
    const row = rawData[i];
    if (row && row.length > 0) {
      for (const cell of row) {
        if (cell && typeof cell === 'string') {
          const cellStr = cell.toLowerCase().trim();
          
          // Look for unit patterns in parentheses first (most reliable)
          const parenthesesPatterns = [
            /\(usd\s+billion\)/i,
            /\(usd\s+million\)/i,
            /\(usd\s+thousand\)/i,
            /\(usd\s+trillion\)/i,
            /\(usd\s+[\w\s]+\)/i,  // Any USD [something] in parentheses
            /\(billion\s+usd\)/i,
            /\(million\s+usd\)/i,
            /\(thousand\s+usd\)/i,
            /\(units?\)/i,
            /\(thousand\s+units?\)/i,
            /\(million\s+units?\)/i,
            /\(billion\s+units?\)/i,
            /\(thousand\)/i,
            /\(million\)/i,
            /\(billion\)/i,
            /\(trillion\)/i
          ];
          
          for (const pattern of parenthesesPatterns) {
            const match = cellStr.match(pattern);
            if (match) {
              return formatUnitString(match[0]);
            }
          }
          
          // Look for unit patterns without parentheses as fallback
          const generalPatterns = [
            /usd\s+billion/i,
            /usd\s+million/i,
            /usd\s+thousand/i,
            /usd\s+trillion/i,
            /billion\s+usd/i,
            /million\s+usd/i,
            /thousand\s+usd/i,
            /usd\s+[\w\s]{1,20}(?=\s|,|$)/i  // USD followed by 1-20 characters
          ];
          
          for (const pattern of generalPatterns) {
            const match = cellStr.match(pattern);
            if (match) {
              return formatUnitString(`(${match[0]})`);
            }
          }
        }
      }
    }
  }
  
  return null;
}

// Helper function to format unit strings consistently
function formatUnitString(unitStr: string): string {
  let unit = unitStr.replace(/[()]/g, '').trim(); // Remove parentheses
  unit = unit.replace(/\s+/g, ' ').trim(); // Normalize spaces
  
  // Standardize common patterns
  if (unit.match(/^usd\s+billion$/i)) return '(USD Billion)';
  if (unit.match(/^usd\s+million$/i)) return '(USD Million)';
  if (unit.match(/^usd\s+thousand$/i)) return '(USD Thousand)';
  if (unit.match(/^usd\s+trillion$/i)) return '(USD Trillion)';
  if (unit.match(/^billion\s+usd$/i)) return '(USD Billion)';
  if (unit.match(/^million\s+usd$/i)) return '(USD Million)';
  if (unit.match(/^thousand\s+usd$/i)) return '(USD Thousand)';
  if (unit.match(/^units?$/i)) return '(Units)';
  if (unit.match(/^thousand\s+units?$/i)) return '(Thousand Units)';
  if (unit.match(/^million\s+units?$/i)) return '(Million Units)';
  if (unit.match(/^billion\s+units?$/i)) return '(Billion Units)';
  if (unit.match(/^billion$/i)) return '(USD Billion)';
  if (unit.match(/^million$/i)) return '(USD Million)';
  if (unit.match(/^thousand$/i)) return '(USD Thousand)';
  if (unit.match(/^trillion$/i)) return '(USD Trillion)';
  
  // For USD [something] patterns, capitalize properly
  if (unit.toLowerCase().startsWith('usd ')) {
    unit = unit.replace(/^usd/i, 'USD');
    // Capitalize the next word(s)
    unit = unit.replace(/(\s+)(\w)/g, (match, space, letter) => space + letter.toUpperCase());
  } else {
    // Capitalize first letter for other patterns
    unit = unit.charAt(0).toUpperCase() + unit.slice(1).toLowerCase();
  }
  
  return `(${unit})`;
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

function isYearOnlyRow(row: any[], detectedYears: number[]): boolean {
  // Check if this row contains only years (likely a duplicate header row)
  const nonEmptyValues = row.filter(cell => cell != null && cell !== '');
  
  if (nonEmptyValues.length === 0) return false;
  
  // Check if most values in the row are years
  let yearCount = 0;
  let numericCount = 0;
  
  for (const cell of nonEmptyValues) {
    if (cell != null && cell !== '') {
      const cellStr = String(cell).trim();
      const cellNum = typeof cell === 'number' ? cell : parseFloat(cellStr);
      
      // Check if it's a year
      if (!isNaN(cellNum)) {
        const year = Math.floor(cellNum);
        if (year >= 1990 && year <= 2100) {
          yearCount++;
        } else {
          numericCount++;
        }
      } else if (cellStr.match(/\b(19|20)\d{2}\b/)) {
        yearCount++;
      }
    }
  }
  
  // If more than 70% of non-empty values are years, consider it a year-only row
  const yearRatio = yearCount / nonEmptyValues.length;
  return yearRatio > 0.7;
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
  return "Global";
}

function determineRegions(segmentName: string, sheetName: string): string {
  const combined = (sheetName + ' ' + segmentName).toLowerCase();
  
  // Global check first
  if (combined.includes('global') || combined.includes('worldwide')) {
    return 'Global';
  }
  
  // North America
  if (combined.includes('north america') || combined.includes('na ') || combined.includes(' na')) {
    return 'North America';
  }
  
  // Latin America / South America
  if (combined.includes('latin america') || combined.includes('south america') || 
      combined.includes('latam') || combined.includes('southam')) {
    return 'Latin America';
  }
  
  // Asia Pacific / APAC
  if (combined.includes('asia pacific') || combined.includes('apac') || 
      combined.includes('asia-pacific') || combined.includes('asiapacific')) {
    return 'Asia Pacific';
  }
  
  // Europe
  if (combined.includes('europe') || combined.includes('emea') || combined.includes('eu ') || combined.includes(' eu')) {
    return 'Europe';
  }
  
  // Middle East & Africa
  if (combined.includes('middle east') || combined.includes('mea') || 
      combined.includes('africa') || combined.includes('middle east & africa')) {
    return 'Middle East & Africa';
  }
  
  return 'Global';
}

function determineCountry(segmentName: string, sheetName: string): string {
  const combined = (sheetName + ' ' + segmentName).toLowerCase();
  
  // North America countries
  if (combined.includes('united states') || combined.includes('usa') || 
      combined.includes('u.s.') || combined.includes('america') || combined.includes('us ')) {
    return 'U.S.';
  }
  if (combined.includes('canada')) {
    return 'Canada';
  }
  
  // Europe countries
  if (combined.includes('united kingdom') || combined.includes('uk') || 
      combined.includes('britain') || combined.includes('england')) {
    return 'UK';
  }
  if (combined.includes('germany') || combined.includes('deutschland')) {
    return 'Germany';
  }
  if (combined.includes('france')) {
    return 'France';
  }
  if (combined.includes('italy')) {
    return 'Italy';
  }
  if (combined.includes('spain')) {
    return 'Spain';
  }
  if (combined.includes('russia')) {
    return 'Russia';
  }
  if (combined.includes('netherlands') || combined.includes('holland')) {
    return 'Netherlands';
  }
  if (combined.includes('sweden')) {
    return 'Sweden';
  }
  if (combined.includes('bulgaria')) {
    return 'Bulgaria';
  }
  if (combined.includes('poland')) {
    return 'Poland';
  }
  if (combined.includes('norway')) {
    return 'Norway';
  }
  if (combined.includes('denmark')) {
    return 'Denmark';
  }
  if (combined.includes('austria')) {
    return 'Austria';
  }
  if (combined.includes('belgium')) {
    return 'Belgium';
  }
  if (combined.includes('switzerland')) {
    return 'Switzerland';
  }
  if (combined.includes('finland')) {
    return 'Finland';
  }
  if (combined.includes('portugal')) {
    return 'Portugal';
  }
  if (combined.includes('ireland')) {
    return 'Ireland';
  }
  if (combined.includes('turkiye') || combined.includes('turkey')) {
    return 'Turkiye';
  }
  if (combined.includes('greece')) {
    return 'Greece';
  }
  if (combined.includes('luxemborg') || combined.includes('luxembourg')) {
    return 'Luxemborg';
  }
  if (combined.includes('croatia')) {
    return 'Croatia';
  }
  if (combined.includes('roe') || combined.includes('rest of europe')) {
    return 'RoE';
  }
  
  // Asia Pacific countries
  if (combined.includes('china')) {
    return 'China';
  }
  if (combined.includes('india')) {
    return 'India';
  }
  if (combined.includes('japan')) {
    return 'Japan';
  }
  if (combined.includes('south korea') || combined.includes('korea')) {
    return 'South Korea';
  }
  if (combined.includes('anz') || combined.includes('australia') || combined.includes('new zealand')) {
    return 'ANZ';
  }
  if (combined.includes('taiwan')) {
    return 'Taiwan';
  }
  if (combined.includes('indonesia')) {
    return 'Indonesia';
  }
  if (combined.includes('thailand')) {
    return 'Thailand';
  }
  if (combined.includes('singapore')) {
    return 'Singapore';
  }
  if (combined.includes('philippines')) {
    return 'Philippines';
  }
  if (combined.includes('vietnam')) {
    return 'Vietnam';
  }
  if (combined.includes('malaysia')) {
    return 'Malaysia';
  }
  if (combined.includes('myanmar')) {
    return 'Myanmar';
  }
  if (combined.includes('roapac') || combined.includes('rest of apac') || combined.includes('rest of asia pacific')) {
    return 'RoAPAC';
  }
  
  // Latin America countries
  if (combined.includes('brazil')) {
    return 'Brazil';
  }
  if (combined.includes('mexico')) {
    return 'Mexico';
  }
  if (combined.includes('argentina')) {
    return 'Argentina';
  }
  if (combined.includes('peru')) {
    return 'Peru';
  }
  if (combined.includes('columbia') || combined.includes('colombia')) {
    return 'Columbia';
  }
  if (combined.includes('rola') || combined.includes('rest of latin america')) {
    return 'RoLA';
  }
  
  // Middle East & Africa countries
  if (combined.includes('uae') || combined.includes('united arab emirates')) {
    return 'UAE';
  }
  if (combined.includes('saudi arabia') || combined.includes('saudi')) {
    return 'Saudi Arabia';
  }
  if (combined.includes('south africa')) {
    return 'South Africa';
  }
  if (combined.includes('romea') || combined.includes('rest of mea') || combined.includes('rest of middle east')) {
    return 'RoMEA';
  }
  
  return '';
}

function determineUnits(sheetName: string, tableTitles?: string[], unitsFromData?: string | null): string {
  // If we found units directly in the data, use those first (most reliable)
  if (unitsFromData) {
    return unitsFromData;
  }
  
  // Combine sheet name and table titles for unit detection
  const textToAnalyze = [sheetName];
  if (tableTitles && tableTitles.length > 0) {
    textToAnalyze.push(...tableTitles);
  }
  
  const combinedText = textToAnalyze.join(' ').toLowerCase();
  
  // Look for unit patterns in parentheses first (most reliable)
  const parenthesesPatterns = [
    /\(usd\s+billion\)/i,
    /\(usd\s+million\)/i,
    /\(usd\s+thousand\)/i,
    /\(usd\s+trillion\)/i,
    /\(usd\s+[\w\s]+?\)/i,  // Any USD [something] in parentheses
    /\(billion\s+usd\)/i,
    /\(million\s+usd\)/i,
    /\(thousand\s+usd\)/i,
    /\(units?\)/i,
    /\(thousand\s+units?\)/i,
    /\(million\s+units?\)/i,
    /\(billion\s+units?\)/i,
    /\(thousand\)/i,
    /\(million\)/i,
    /\(billion\)/i,
    /\(trillion\)/i
  ];
  
  // Check for patterns in parentheses first
  for (const pattern of parenthesesPatterns) {
    const match = combinedText.match(pattern);
    if (match) {
      return formatUnitString(match[0]);
    }
  }
  
  // Fallback to patterns without parentheses
  const generalPatterns = [
    /usd\s+billion/i,
    /usd\s+million/i,
    /usd\s+thousand/i,
    /usd\s+trillion/i,
    /billion\s+usd/i,
    /million\s+usd/i,
    /thousand\s+usd/i,
    /usd\s+[\w\s]{1,20}(?=\s|,|$)/i  // USD followed by 1-20 characters
  ];
  
  for (const pattern of generalPatterns) {
    const match = combinedText.match(pattern);
    if (match) {
      return formatUnitString(`(${match[0]})`);
    }
  }
  
  // Simple keyword fallbacks
  if (combinedText.includes('billion')) return '(USD Billion)';
  if (combinedText.includes('million')) return '(USD Million)';
  if (combinedText.includes('thousand')) return '(USD Thousand)';
  if (combinedText.includes('trillion')) return '(USD Trillion)';
  if (combinedText.includes('units') || combinedText.includes('unit')) return '(Units)';
  
  // Default fallback
  return '(USD Million)';
}

function determineProduct(sheetName: string, segmentName: string): string {
  // Filter out unit-related patterns from segmentName
  const filteredSegmentName = filterOutUnitPatterns(segmentName);
  
  // Extract product information from sheet name or segment
  const combined = (sheetName + ' ' + filteredSegmentName).toLowerCase();
  
  // Skip if the segment is just a unit or empty after filtering
  if (!filteredSegmentName || filteredSegmentName.trim() === '' || isUnitPattern(filteredSegmentName)) {
    // Try to extract from sheet name only
    const cleanSheetName = sheetName.replace(/global|regional|country|by|market|forecast|usd|billion|million|units|\(|\)/gi, '').trim();
    return cleanSheetName || 'General';
  }
  
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
  if (combined.includes('automotive')) {
    return 'Automotive';
  }
  if (combined.includes('healthcare')) {
    return 'Healthcare';
  }
  if (combined.includes('technology')) {
    return 'Technology';
  }
  
  // Return the filtered segment name if it's meaningful
  return filteredSegmentName || 'General';
}

function determineDataLevel(segmentName: string, sheetName: string): 'global' | 'regional' | 'country' | 'product' | 'segment' {
  const combined = (sheetName + ' ' + segmentName).toLowerCase();
  
  // Check for global level
  if (combined.includes('global') || combined.includes('total') || combined.includes('worldwide')) {
    return 'global';
  }
  
  // Check for country level first (more specific)
  const countryKeywords = [
    'united states', 'usa', 'u.s.', 'america', 'canada',
    'united kingdom', 'uk', 'britain', 'england', 'germany', 'deutschland', 'france', 
    'italy', 'spain', 'russia', 'netherlands', 'holland', 'sweden', 'bulgaria', 
    'poland', 'norway', 'denmark', 'austria', 'belgium', 'switzerland', 'finland', 
    'portugal', 'ireland', 'turkiye', 'turkey', 'greece', 'luxemborg', 'luxembourg', 
    'croatia', 'china', 'india', 'japan', 'south korea', 'korea', 'australia', 
    'new zealand', 'taiwan', 'indonesia', 'thailand', 'singapore', 'philippines', 
    'vietnam', 'malaysia', 'myanmar', 'brazil', 'mexico', 'argentina', 'peru', 
    'columbia', 'colombia', 'uae', 'united arab emirates', 'saudi arabia', 'saudi', 
    'south africa'
  ];
  
  if (countryKeywords.some(country => combined.includes(country))) {
    return 'country';
  }
  
  // Check for regional level
  const regionKeywords = [
    'north america', 'latin america', 'south america', 'asia pacific', 'apac', 
    'europe', 'emea', 'middle east', 'mea', 'africa'
  ];
  
  if (regionKeywords.some(region => combined.includes(region))) {
    return 'regional';
  }
  
  // Default to segment
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

// Helper function to check if a string is primarily a unit pattern
function isUnitPattern(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  
  const cleanText = text.trim().toLowerCase();
  
  // Check if it's just a unit pattern
  const unitPatterns = [
    /^usd\s*billion$/i,
    /^usd\s*million$/i,
    /^billion$/i,
    /^million$/i,
    /^units$/i,
    /^usd$/i,
    /^\(usd\s*billion\)$/i,
    /^\(usd\s*million\)$/i,
    /^\(billion\)$/i,
    /^\(million\)$/i,
    /^\(units\)$/i,
    /^usd\s+\w+$/i, // USD [anything]
    /^\(\s*usd\s+\w+\s*\)$/i // (USD [anything])
  ];
  
  return unitPatterns.some(pattern => pattern.test(cleanText));
}

// Helper function to filter out unit patterns from text
function filterOutUnitPatterns(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  let cleaned = text.trim();
  
  // Remove unit patterns
  const unitPatterns = [
    /\busd\s*billion\b/gi,
    /\busd\s*million\b/gi,
    /\bbillion\b/gi,
    /\bmillion\b/gi,
    /\bunits\b/gi,
    /\busd\s+\w+/gi, // USD [anything]
    /\(\s*usd\s*billion\s*\)/gi,
    /\(\s*usd\s*million\s*\)/gi,
    /\(\s*billion\s*\)/gi,
    /\(\s*million\s*\)/gi,
    /\(\s*units\s*\)/gi,
    /\(\s*usd\s+\w+\s*\)/gi, // (USD [anything])
    /,\s*usd\s*billion/gi,
    /,\s*usd\s*million/gi,
    /,\s*billion/gi,
    /,\s*million/gi,
    /,\s*units/gi,
    /\s*-\s*\d{4}\s*-?\s*\d{4}?/gi, // Remove year ranges like "2021-2034"
    /\s*,\s*\d{4}\s*-\s*\d{4}/gi // Remove ", 2021 - 2034"
  ];
  
  unitPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // Clean up extra spaces, commas, and parentheses
  cleaned = cleaned.replace(/\s*,\s*,/g, ',') // Remove double commas
                   .replace(/,\s*$/g, '') // Remove trailing comma
                   .replace(/^\s*,/g, '') // Remove leading comma
                   .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                   .replace(/\(\s*\)/g, '') // Remove empty parentheses
                   .trim();
  
  return cleaned;
}
