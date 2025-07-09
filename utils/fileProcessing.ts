// File processing utilities for different file types

export function extractTextFromCSV(content: string): { columns: string[], rows: string[][], preview: string } {
  const lines = content.split('\n').filter(line => line.trim());
  const columns = lines[0]?.split(',').map(col => col.trim()) || [];
  const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));
  
  return {
    columns,
    rows,
    preview: lines.slice(0, 5).join('\n')
  };
}

export function analyzeDataStructure(columns: string[], rows: string[][]): Record<string, any> {
  const analysis: Record<string, any> = {};
  
  columns.forEach((column, index) => {
    const values = rows.map(row => row[index]).filter(Boolean);
    const numericValues = values.filter(val => !isNaN(Number(val)));
    
    analysis[column] = {
      type: numericValues.length > values.length * 0.8 ? 'numeric' : 'text',
      uniqueValues: new Set(values).size,
      nullCount: rows.length - values.length,
      sampleValues: values.slice(0, 3)
    };
  });
  
  return analysis;
}

export function generateFileSummary(fileName: string, fileType: string, content: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const size = new Blob([content]).size;
  
  switch (extension) {
    case 'pdf':
      return `PDF document "${fileName}" (${(size/1024).toFixed(1)}KB) containing structured content ready for analysis.`;
    case 'docx':
    case 'doc':
      return `Word document "${fileName}" (${(size/1024).toFixed(1)}KB) with formatted text content and sections.`;
    case 'xlsx':
    case 'xls':
      return `Excel spreadsheet "${fileName}" (${(size/1024).toFixed(1)}KB) containing tabular data and potentially multiple sheets.`;
    case 'csv':
      const lines = content.split('\n').length;
      return `CSV data file "${fileName}" (${(size/1024).toFixed(1)}KB) with ${lines} rows of structured data.`;
    default:
      return `Text file "${fileName}" (${(size/1024).toFixed(1)}KB) containing ${content.length} characters of content.`;
  }
}

export function validateFileType(fileName: string, supportedTypes: string[]): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? supportedTypes.includes(extension) : false;
}

export function getFileIcon(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const iconMap: Record<string, string> = {
    'pdf': 'fas fa-file-pdf text-red-500',
    'doc': 'fas fa-file-word text-blue-500',
    'docx': 'fas fa-file-word text-blue-500', 
    'xls': 'fas fa-file-excel text-green-500',
    'xlsx': 'fas fa-file-excel text-green-500',
    'csv': 'fas fa-table text-green-600',
    'txt': 'fas fa-file-alt text-gray-500'
  };
  
  return iconMap[extension || ''] || 'fas fa-file text-gray-400';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function generateQuickQueries(fileName: string): string[] {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const baseQueries = [
    'Summarize the main content',
    'What are the key insights?',
    'Extract important data points',
    'What is this file about?'
  ];

  const typeSpecificQueries: Record<string, string[]> = {
    'pdf': [
      'What are the main sections?',
      'Extract key findings',
      'Summarize conclusions',
      'List important headings'
    ],
    'docx': [
      'Summarize the document',
      'Find important headings', 
      'Extract conclusions',
      'What are the main topics?'
    ],
    'doc': [
      'Summarize the document',
      'Find important headings',
      'Extract conclusions', 
      'What are the main topics?'
    ],
    'xlsx': [
      'Analyze the data trends',
      'What columns are available?',
      'Show data summary',
      'Find patterns in data'
    ],
    'xls': [
      'Analyze the data trends', 
      'What columns are available?',
      'Show data summary',
      'Find patterns in data'
    ],
    'csv': [
      'Analyze the dataset',
      'Show column statistics',
      'Find patterns in data',
      'What insights can you extract?'
    ],
    'txt': [
      'Summarize the text',
      'Extract key information', 
      'Identify main themes',
      'What are the important points?'
    ]
  };

  const specificQueries = typeSpecificQueries[extension || ''] || [];
  return [...baseQueries, ...specificQueries].slice(0, 6);
}
