export interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  content: string;
  metadata: Record<string, any>;
  analysisStatus: 'processing' | 'completed' | 'error';
  chatHistory?: FileChatMessage[];
}

export interface FileAnalysisResult {
  id: string;
  fileId: string;
  summary: string;
  keyPoints: string[];
  dataStructure: Record<string, any>;
  confidence: number;
  analyzedAt: string;
  extractedData?: any;
}

export interface FileChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  fileContext: string;
  extractedData?: any;
}

export interface SavedFileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  lastAccessedAt: string;
  analysisStatus: string;
}

export interface FileProcessingOptions {
  extractText: boolean;
  analyzeStructure: boolean;
  generateSummary: boolean;
  enableChat: boolean;
}
