// Utility for storing parsed file data in JSON files
import { FileData, FileAnalysisResult } from '@/types/file';

export interface ParsedFileData {
  id: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  parsedContent: any; // The actual parsed data (text, CSV rows, etc.)
  metadata: {
    originalSize: number;
    parsedSize: number;
    parseMethod: string;
    columns?: string[];
    rowCount?: number;
    pageCount?: number;
  };
  analysis: FileAnalysisResult;
}

// Store parsed data in a JSON file in the public directory
export async function saveToJsonFile(data: ParsedFileData): Promise<string> {
  try {
    const fileName = `parsed-file-${data.id}.json`;
    const response = await fetch('/api/storage/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        data
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save file data');
    }

    const result = await response.json();
    return result.filePath;
  } catch (error) {
    console.error('Error saving to JSON file:', error);
    throw error;
  }
}

// Load parsed data from JSON file
export async function loadFromJsonFile(fileId: string): Promise<ParsedFileData | null> {
  try {
    const fileName = `parsed-file-${fileId}.json`;
    const response = await fetch(`/api/storage/load?fileName=${fileName}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading from JSON file:', error);
    return null;
  }
}

// List all stored files
export async function listStoredFiles(): Promise<string[]> {
  try {
    const response = await fetch('/api/storage/list');
    if (!response.ok) {
      return [];
    }
    const result = await response.json();
    return result.files || [];
  } catch (error) {
    console.error('Error listing stored files:', error);
    return [];
  }
}
