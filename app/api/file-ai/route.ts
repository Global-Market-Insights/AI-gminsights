import { NextRequest, NextResponse } from 'next/server';
import * as Papa from 'papaparse';
import { saveToJsonFile, ParsedFileData } from '@/utils/jsonStorage';

export async function POST(request: NextRequest) {
  try {
    console.log('File AI API called');
    const body = await request.json();
    console.log('Request body:', { 
      fileName: body.fileName, 
      fileType: body.fileType, 
      query: body.query,
      contentLength: body.fileContent?.length 
    });
    
    const { fileContent, fileName, fileType, query } = body;

    if (!fileContent || !fileName) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: fileContent and fileName' 
        },
        { status: 400 }
      );
    }

    // Simulate AI processing - replace with actual AI API calls
    const response = await processFileWithAI(fileContent, fileName, fileType, query);

    console.log('Processing successful');
    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('File AI API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process file with AI' 
      },
      { status: 500 }
    );
  }
}

async function processFileWithAI(
  fileContent: string, 
  fileName: string, 
  fileType: string, 
  query: string
): Promise<any> {
  // Add a small delay for better UX
  await new Promise(resolve => setTimeout(resolve, 500));

  const extension = fileName.split('.').pop()?.toLowerCase();
  
  // Different processing based on file type
  switch (extension) {
    case 'pdf':
      return processPDF(fileContent, query);
    case 'docx':
    case 'doc':
      return processWord(fileContent, query);
    case 'xlsx':
    case 'xls':
      return processExcel(fileContent, query);
    case 'csv':
      return processCSV(fileContent, query);
    default:
      return processText(fileContent, query);
  }
}

function processPDF(content: string, query: string) {
  // Check if content is base64 (binary data) or text
  const isBase64 = content.length > 100 && !content.includes(' ') && /^[A-Za-z0-9+/]*={0,2}$/.test(content);
  
  if (isBase64) {
    // Calculate actual file size from base64
    const contentLength = Math.floor(content.length * 0.75); // Base64 to binary size
    const estimatedPages = Math.max(1, Math.ceil(contentLength / 50000)); // Rough estimation
    
    return {
      type: 'pdf',
      summary: `This PDF document is ${(contentLength / 1024).toFixed(2)} KB in size, estimated to contain approximately ${estimatedPages} pages. The file was successfully uploaded and is ready for analysis.`,
      extractedData: {
        fileSize: `${(contentLength / 1024).toFixed(2)} KB`,
        estimatedPages: estimatedPages,
        fileType: 'PDF Document',
        dataFormat: 'Binary (Base64)',
        note: 'Full text extraction requires PDF parsing library (pdf-parse, PDF.js, etc.)'
      },
      answer: analyzeQuery(query, 'PDF document', contentLength),
      confidence: 0.75
    };
  } else {
    // Handle as text content
    return {
      type: 'pdf',
      summary: `PDF content analysis: ${content.substring(0, 200)}...`,
      extractedData: {
        contentLength: content.length,
        preview: content.substring(0, 300)
      },
      answer: analyzeQuery(query, 'PDF text content', content.length),
      confidence: 0.80
    };
  }
}

function processWord(content: string, query: string) {
  const isBase64 = content.length > 100 && !content.includes(' ') && /^[A-Za-z0-9+/]*={0,2}$/.test(content);
  
  if (isBase64) {
    const contentLength = Math.floor(content.length * 0.75);
    const estimatedWords = Math.max(1, Math.ceil(contentLength / 6)); // Rough estimation
    
    return {
      type: 'document',
      summary: `This Word document is ${(contentLength / 1024).toFixed(2)} KB in size, estimated to contain approximately ${estimatedWords} words. The file was successfully uploaded and is ready for analysis.`,
      extractedData: {
        fileSize: `${(contentLength / 1024).toFixed(2)} KB`,
        estimatedWords: estimatedWords,
        fileType: 'Microsoft Word Document',
        dataFormat: 'Binary (Base64)',
        note: 'Full text extraction requires Word document parsing library (mammoth, docx, etc.)'
      },
      answer: analyzeQuery(query, 'Word document', contentLength),
      confidence: 0.75
    };
  } else {
    return {
      type: 'document',
      summary: `Word document content: ${content.substring(0, 200)}...`,
      extractedData: {
        contentLength: content.length,
        preview: content.substring(0, 300)
      },
      answer: analyzeQuery(query, 'Word document content', content.length),
      confidence: 0.80
    };
  }
}

function processExcel(content: string, query: string) {
  const isBase64 = content.length > 100 && !content.includes(' ') && /^[A-Za-z0-9+/]*={0,2}$/.test(content);
  
  if (isBase64) {
    const contentLength = Math.floor(content.length * 0.75);
    
    // Provide more intelligent analysis based on file size and query
    const analysis = analyzeExcelQuery(query, contentLength);
    
    return {
      type: 'spreadsheet',
      summary: `This Excel file is ${(contentLength / 1024).toFixed(2)} KB in size. Based on the file size, it likely contains substantial data across multiple sheets.`,
      extractedData: {
        fileSize: `${(contentLength / 1024).toFixed(2)} KB`,
        estimatedDataVolume: getDataVolumeEstimate(contentLength),
        fileType: 'Microsoft Excel Spreadsheet',
        dataFormat: 'Binary (Base64)',
        capabilities: [
          'File structure analysis',
          'Size-based insights',
          'Query-specific responses',
          'Data trend estimation'
        ],
        note: 'For full data extraction, consider using libraries like xlsx or exceljs'
      },
      answer: analysis,
      confidence: 0.85
    };
  } else {
    return {
      type: 'spreadsheet',
      summary: `Excel content: ${content.substring(0, 200)}...`,
      extractedData: {
        contentLength: content.length,
        preview: content.substring(0, 300)
      },
      answer: analyzeQuery(query, 'Excel content', content.length),
      confidence: 0.80
    };
  }
}

function analyzeExcelQuery(query: string, contentLength: number): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('trends') || lowerQuery.includes('trend')) {
    const dataPoints = Math.floor(contentLength / 50); // Rough estimate
    return `Based on the Excel file size (${(contentLength / 1024).toFixed(2)} KB), this appears to contain approximately ${dataPoints} data points. For trend analysis, the file likely contains time-series data or numerical datasets. Common Excel trend patterns include: seasonal variations, growth patterns, correlations between variables, and outlier detection. To provide specific trend analysis, the Excel file would need to be parsed to extract the actual numerical data and column relationships.`;
  }
  
  if (lowerQuery.includes('data') || lowerQuery.includes('analyze')) {
    return `This Excel file contains ${(contentLength / 1024).toFixed(2)} KB of data, suggesting a substantial dataset. Excel files typically contain structured data in rows and columns, formulas, charts, and multiple worksheets. Based on the file size, it likely includes multiple data tables, calculated fields, and possibly pivot tables or charts. For detailed data analysis, specific columns and data types would need to be extracted.`;
  }
  
  if (lowerQuery.includes('summary') || lowerQuery.includes('overview')) {
    const estimatedRows = Math.floor(contentLength / 100);
    return `Excel file summary: ${(contentLength / 1024).toFixed(2)} KB file size suggests approximately ${estimatedRows} rows of data across potentially multiple sheets. Excel files commonly contain business data, financial records, statistical analysis, or research data. The file structure likely includes headers, data rows, and possibly calculated columns or summary sections.`;
  }
  
  if (lowerQuery.includes('structure') || lowerQuery.includes('format')) {
    return `Excel file structure analysis: This ${(contentLength / 1024).toFixed(2)} KB file follows the Microsoft Excel format (.xlsx/.xls). The file likely contains multiple worksheets, with data organized in rows and columns. Common structural elements include: header rows, data tables, formula cells, formatted sections, and potentially charts or pivot tables.`;
  }
  
  // Default response with intelligent estimation
  const estimatedComplexity = contentLength > 100000 ? 'complex' : contentLength > 50000 ? 'moderate' : 'simple';
  return `Regarding "${query}": This Excel file (${(contentLength / 1024).toFixed(2)} KB) appears to be a ${estimatedComplexity} dataset. Based on the file size, it contains substantial structured data that would benefit from detailed analysis. For specific insights about "${query}", the Excel file would need to be parsed to extract column headers, data types, and actual values for targeted analysis.`;
}

function getDataVolumeEstimate(contentLength: number): string {
  if (contentLength > 500000) {
    return 'Large dataset (likely 10,000+ rows)';
  } else if (contentLength > 100000) {
    return 'Medium dataset (likely 1,000-10,000 rows)';
  } else if (contentLength > 20000) {
    return 'Small-medium dataset (likely 100-1,000 rows)';
  } else {
    return 'Small dataset (likely under 100 rows)';
  }
}

function processCSV(content: string, query: string) {
  try {
    // Simple CSV parsing for now (can be enhanced with proper library later)
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0]?.split(',').map(h => h.trim().replace(/['"]/g, '')) || [];
    
    // Parse data rows
    const data: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }
    
    const rowCount = data.length;
    
    // Analyze the actual CSV content
    const analysis = analyzeCSVData(data, query, headers);
    
    // Prepare data for JSON storage
    const parsedData: ParsedFileData = {
      id: Date.now().toString(),
      fileName: 'current-csv',
      fileType: 'text/csv',
      uploadedAt: new Date().toISOString(),
      parsedContent: {
        headers,
        data: data.slice(0, 1000), // Store first 1000 rows to avoid huge files
        fullRowCount: rowCount
      },
      metadata: {
        originalSize: content.length,
        parsedSize: JSON.stringify(data).length,
        parseMethod: 'Simple CSV Parser',
        columns: headers,
        rowCount: rowCount
      },
      analysis: {
        id: Date.now().toString(),
        fileId: 'current-csv',
        summary: `This CSV file contains ${rowCount} rows of data with ${headers.length} columns: ${headers.join(', ')}.`,
        keyPoints: [
          `${rowCount} data records`,
          `${headers.length} columns`,
          'Successfully parsed and analyzed',
          'Data trends and patterns identified'
        ],
        dataStructure: {
          columns: headers,
          rowCount: rowCount,
          dataTypes: detectColumnTypes(data, headers),
          sampleData: data.slice(0, 5)
        },
        confidence: 0.95,
        analyzedAt: new Date().toISOString()
      }
    };

    // Save to JSON file (async, but don't wait for it)
    saveToJsonFile(parsedData).catch(err => 
      console.warn('Could not save parsed data to JSON:', err)
    );
    
    return {
      type: 'data',
      summary: `This CSV file contains ${rowCount} rows of data with ${headers.length} columns: ${headers.join(', ')}.`,
      extractedData: {
        columns: headers,
        rowCount: rowCount,
        dataPreview: data.slice(0, 5),
        columnCount: headers.length,
        fileSize: `${(content.length / 1024).toFixed(2)} KB`,
        dataTypes: detectColumnTypes(data, headers),
        statistics: generateBasicStatistics(data, headers)
      },
      answer: analysis,
      confidence: 0.95
    };
  } catch (error) {
    console.error('CSV parsing error:', error);
    return {
      type: 'data',
      summary: 'This appears to be CSV data, but there was an issue parsing it.',
      extractedData: {
        error: 'CSV parsing failed',
        contentLength: content.length,
        rawPreview: content.substring(0, 500)
      },
      answer: `I couldn't fully parse the CSV file. Error: ${error instanceof Error ? error.message : 'Unknown error'}. Regarding "${query}": Please check the file format and try again.`,
      confidence: 0.50
    };
  }
}

function processText(content: string, query: string) {
  const lines = content.split('\n');
  const words = content.split(/\s+/).filter(word => word.length > 0);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Analyze actual text content
  const analysis = analyzeTextContent(content, query);
  
  return {
    type: 'text',
    summary: `This text file contains ${words.length} words across ${lines.length} lines in ${sentences.length} sentences.`,
    extractedData: {
      characterCount: content.length,
      wordCount: words.length,
      lineCount: lines.length,
      sentenceCount: sentences.length,
      averageWordsPerSentence: Math.round(words.length / sentences.length),
      fileSize: `${(content.length / 1024).toFixed(2)} KB`
    },
    answer: analysis,
    confidence: 0.90
  };
}

function analyzeQuery(query: string, fileType: string, contentSize: number): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('summary') || lowerQuery.includes('summarize')) {
    return `This ${fileType} (${(contentSize / 1024).toFixed(2)} KB) contains structured data. For a detailed summary, the file would need to be processed with appropriate parsing libraries to extract the actual content.`;
  }
  
  if (lowerQuery.includes('size') || lowerQuery.includes('how big')) {
    return `The ${fileType} is ${(contentSize / 1024).toFixed(2)} KB in size.`;
  }
  
  if (lowerQuery.includes('content') || lowerQuery.includes('contains')) {
    return `This ${fileType} contains binary data that requires specialized parsing. The file size suggests it has substantial content that would need proper extraction tools to analyze.`;
  }
  
  return `Regarding "${query}": This ${fileType} appears to contain relevant data, but to provide specific answers about its content, we would need to implement proper file parsing libraries for this file type.`;
}

// Helper functions for CSV analysis
function analyzeCSVData(data: any[], query: string, headers: string[]): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('trends') || lowerQuery.includes('trend')) {
    return analyzeDataTrends(data, headers);
  }
  
  if (lowerQuery.includes('summary') || lowerQuery.includes('summarize')) {
    return `This CSV contains ${data.length} data records with columns: ${headers.join(', ')}. The data appears to be structured tabular information suitable for analysis.`;
  }
  
  if (lowerQuery.includes('columns') || lowerQuery.includes('fields')) {
    return `The CSV has ${headers.length} columns: ${headers.map((h, i) => `${i + 1}. ${h}`).join(', ')}.`;
  }
  
  if (lowerQuery.includes('rows') || lowerQuery.includes('records')) {
    return `The CSV contains ${data.length} data rows (excluding header).`;
  }
  
  // Try to find query terms in headers or data
  const matchingHeaders = headers.filter(h => 
    h.toLowerCase().includes(lowerQuery) || 
    lowerQuery.split(' ').some(word => h.toLowerCase().includes(word))
  );
  
  if (matchingHeaders.length > 0) {
    const columnAnalysis = analyzeSpecificColumns(data, matchingHeaders);
    return `Found relevant columns for "${query}": ${matchingHeaders.join(', ')}. ${columnAnalysis}`;
  }
  
  return `Regarding "${query}": I analyzed the CSV structure with ${headers.length} columns and ${data.length} rows. The data includes: ${headers.slice(0, 5).join(', ')}${headers.length > 5 ? '...' : ''}. Please ask about specific columns or data patterns you're interested in.`;
}

function analyzeDataTrends(data: any[], headers: string[]): string {
  const numericColumns = headers.filter(header => {
    const values = data.slice(0, 10).map(row => row[header]);
    return values.some(val => !isNaN(parseFloat(val)) && isFinite(val));
  });
  
  if (numericColumns.length === 0) {
    return "I found mostly text-based data in this CSV. For trend analysis, numeric columns would be needed. The data appears to contain categorical information that could be analyzed for patterns and distributions.";
  }
  
  const trends: string[] = [];
  
  numericColumns.slice(0, 3).forEach(column => {
    const values = data.map(row => parseFloat(row[column])).filter(val => !isNaN(val));
    if (values.length > 0) {
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      trends.push(`${column}: avg ${avg.toFixed(2)}, range ${min.toFixed(2)}-${max.toFixed(2)}`);
    }
  });
  
  return `Data trends analysis: Found ${numericColumns.length} numeric columns. Key insights: ${trends.join('; ')}. ${data.length} total records analyzed.`;
}

function analyzeSpecificColumns(data: any[], columns: string[]): string {
  const insights: string[] = [];
  
  columns.forEach(column => {
    const values = data.map(row => row[column]).filter(val => val != null && val !== '');
    const uniqueValues = new Set(values);
    
    if (uniqueValues.size <= 10) {
      // Categorical data
      const valueCounts: { [key: string]: number } = {};
      values.forEach(val => {
        valueCounts[val] = (valueCounts[val] || 0) + 1;
      });
      const topValues = Object.entries(valueCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([val, count]) => `${val} (${count})`)
        .join(', ');
      insights.push(`${column}: ${uniqueValues.size} unique values, top: ${topValues}`);
    } else {
      // Likely numeric or high-cardinality data
      const numericValues = values.map(val => parseFloat(val)).filter(val => !isNaN(val));
      if (numericValues.length > values.length * 0.7) {
        const avg = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
        insights.push(`${column}: numeric data, avg ${avg.toFixed(2)}, ${values.length} values`);
      } else {
        insights.push(`${column}: ${uniqueValues.size} unique text values, ${values.length} total entries`);
      }
    }
  });
  
  return insights.join('; ');
}

function detectColumnTypes(data: any[], headers: string[]): { [key: string]: string } {
  const types: { [key: string]: string } = {};
  
  headers.forEach(header => {
    const sampleValues = data.slice(0, 20).map(row => row[header]).filter(val => val != null && val !== '');
    
    if (sampleValues.length === 0) {
      types[header] = 'empty';
      return;
    }
    
    const numericValues = sampleValues.filter(val => !isNaN(parseFloat(val)) && isFinite(val));
    const dateValues = sampleValues.filter(val => !isNaN(Date.parse(val)));
    
    if (numericValues.length > sampleValues.length * 0.8) {
      types[header] = 'numeric';
    } else if (dateValues.length > sampleValues.length * 0.8) {
      types[header] = 'date';
    } else {
      const uniqueCount = new Set(sampleValues).size;
      if (uniqueCount <= 10) {
        types[header] = 'categorical';
      } else {
        types[header] = 'text';
      }
    }
  });
  
  return types;
}

function generateBasicStatistics(data: any[], headers: string[]): { [key: string]: any } {
  const stats: { [key: string]: any } = {};
  
  headers.forEach(header => {
    const values = data.map(row => row[header]).filter(val => val != null && val !== '');
    const numericValues = values.map(val => parseFloat(val)).filter(val => !isNaN(val));
    
    if (numericValues.length > 0) {
      const sorted = numericValues.sort((a, b) => a - b);
      stats[header] = {
        count: numericValues.length,
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        avg: numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length,
        median: sorted[Math.floor(sorted.length / 2)]
      };
    } else {
      const uniqueValues = new Set(values);
      stats[header] = {
        count: values.length,
        unique: uniqueValues.size,
        type: 'categorical',
        topValues: Object.entries(
          values.reduce((acc: { [key: string]: number }, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
          }, {})
        ).sort(([,a], [,b]) => b - a).slice(0, 5)
      };
    }
  });
  
  return stats;
}

function analyzeTextContent(content: string, query: string): string {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('summary') || lowerQuery.includes('summarize')) {
    const firstSentences = content.split(/[.!?]+/).slice(0, 3).join('. ').trim();
    return `Text summary: ${firstSentences}${firstSentences.endsWith('.') ? '' : '.'}`;
  }
  
  if (lowerQuery.includes('word count') || lowerQuery.includes('length')) {
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    return `This text contains ${wordCount} words and ${content.length} characters.`;
  }
  
  // Search for query terms in content
  const queryWords = lowerQuery.split(/\s+/).filter(word => word.length > 2);
  const foundTerms: string[] = [];
  const contextSentences: string[] = [];
  
  queryWords.forEach(word => {
    if (lowerContent.includes(word)) {
      foundTerms.push(word);
      
      // Find sentences containing the term
      const sentences = content.split(/[.!?]+/);
      const matchingSentences = sentences.filter(s => 
        s.toLowerCase().includes(word)
      ).slice(0, 2); // Limit to 2 sentences per term
      
      contextSentences.push(...matchingSentences.map(s => s.trim()));
    }
  });
  
  if (foundTerms.length > 0) {
    const uniqueContextSet = new Set(contextSentences);
    const uniqueContext = Array.from(uniqueContextSet).slice(0, 3);
    return `Found references to "${foundTerms.join(', ')}" in the text. Relevant context: ${uniqueContext.join('. ')}.`;
  }
  
  return `I searched the text for "${query}" but didn't find direct matches. The text appears to discuss other topics. You might want to try different search terms or ask for a general summary.`;
}
