'use client';

import { useState, useCallback } from 'react';
import { FileData, SavedFileItem } from '@/types/file';

const STORAGE_KEY = 'file-ai-data';
const FILES_KEY = 'file-ai-files';

export function useFileStorage() {
  const [savedFiles, setSavedFiles] = useState<SavedFileItem[]>([]);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedFiles = localStorage.getItem(FILES_KEY);
      if (storedFiles) {
        const parsedFiles = JSON.parse(storedFiles);
        setSavedFiles(parsedFiles);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveFileData = useCallback(async (fileData: FileData) => {
    setIsSaving(true);
    try {
      // Create a lightweight version without the actual file content
      // to avoid localStorage size limits
      const lightweightFileData = {
        ...fileData,
        content: '', // Don't store large file content
        contentSize: fileData.content.length,
        contentPreview: fileData.content.substring(0, 500) // Store only a preview
      };

      // Save lightweight file data
      const fileKey = `${STORAGE_KEY}-${fileData.id}`;
      localStorage.setItem(fileKey, JSON.stringify(lightweightFileData));

      // Update files list
      const savedFileItem: SavedFileItem = {
        id: fileData.id,
        name: fileData.name,
        type: fileData.type,
        size: fileData.size,
        uploadedAt: fileData.uploadedAt,
        lastAccessedAt: new Date().toISOString(),
        analysisStatus: fileData.analysisStatus
      };

      setSavedFiles(prev => {
        const filtered = prev.filter(f => f.id !== fileData.id);
        const updated = [savedFileItem, ...filtered];
        localStorage.setItem(FILES_KEY, JSON.stringify(updated));
        return updated;
      });

      setCurrentFileId(fileData.id);
      return fileData.id;
    } catch (error) {
      console.error('Error saving file data:', error);
      
      // If still failing, try saving without any content
      try {
        const minimalFileData = {
          id: fileData.id,
          name: fileData.name,
          type: fileData.type,
          size: fileData.size,
          uploadedAt: fileData.uploadedAt,
          content: '',
          metadata: {},
          analysisStatus: fileData.analysisStatus,
          note: 'File too large for local storage - content not saved'
        };

        const fileKey = `${STORAGE_KEY}-${fileData.id}`;
        localStorage.setItem(fileKey, JSON.stringify(minimalFileData));
        
        console.log('Saved minimal file data due to size constraints');
        return fileData.id;
      } catch (secondError) {
        console.error('Failed to save even minimal file data:', secondError);
        throw new Error('File too large to save locally. Consider using a different storage method.');
      }
    } finally {
      setIsSaving(false);
    }
  }, []);

  const loadFileData = useCallback(async (fileId: string): Promise<FileData | null> => {
    setIsLoading(true);
    try {
      const fileKey = `${STORAGE_KEY}-${fileId}`;
      const storedData = localStorage.getItem(fileKey);
      
      if (storedData) {
        const fileData = JSON.parse(storedData);
        setCurrentFileId(fileId);
        
        // Update last accessed time
        setSavedFiles(prev => {
          const updated = prev.map(f => 
            f.id === fileId 
              ? { ...f, lastAccessedAt: new Date().toISOString() }
              : f
          );
          localStorage.setItem(FILES_KEY, JSON.stringify(updated));
          return updated;
        });
        
        return fileData;
      }
      return null;
    } catch (error) {
      console.error('Error loading file data:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteFileData = useCallback(async (fileId: string) => {
    setIsLoading(true);
    try {
      // Remove from storage
      const fileKey = `${STORAGE_KEY}-${fileId}`;
      localStorage.removeItem(fileKey);

      // Update files list
      setSavedFiles(prev => {
        const filtered = prev.filter(f => f.id !== fileId);
        localStorage.setItem(FILES_KEY, JSON.stringify(filtered));
        return filtered;
      });

      if (currentFileId === fileId) {
        setCurrentFileId(null);
      }
    } catch (error) {
      console.error('Error deleting file data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentFileId]);

  const createNewFileSession = useCallback(() => {
    setCurrentFileId(null);
  }, []);

  const updateChatHistory = useCallback(async (fileId: string, chatHistory: any[]) => {
    try {
      const fileKey = `${STORAGE_KEY}-${fileId}`;
      const storedData = localStorage.getItem(fileKey);
      
      if (storedData) {
        const fileData = JSON.parse(storedData);
        fileData.chatHistory = chatHistory;
        localStorage.setItem(fileKey, JSON.stringify(fileData));
      }
    } catch (error) {
      console.error('Error updating chat history:', error);
    }
  }, []);

  const exportFileData = useCallback((fileId: string) => {
    try {
      const fileKey = `${STORAGE_KEY}-${fileId}`;
      const storedData = localStorage.getItem(fileKey);
      
      if (storedData) {
        const fileData = JSON.parse(storedData);
        const exportData = {
          ...fileData,
          exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `file-ai-export-${fileData.name}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting file data:', error);
    }
  }, []);

  const importFileData = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const fileData = JSON.parse(text);
      
      // Validate imported data
      if (fileData.id && fileData.name && fileData.content) {
        await saveFileData(fileData);
        return fileData.id;
      } else {
        throw new Error('Invalid file data format');
      }
    } catch (error) {
      console.error('Error importing file data:', error);
      throw error;
    }
  }, [saveFileData]);

  return {
    savedFiles,
    currentFileId,
    isSaving,
    isLoading,
    fetchFiles,
    saveFileData,
    loadFileData,
    deleteFileData,
    createNewFileSession,
    updateChatHistory,
    exportFileData,
    importFileData
  };
}
