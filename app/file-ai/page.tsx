'use client';

import { useState, useEffect } from 'react';
import FileUploader from '@/components/FileUploader';
import FileAnalyzer from '@/components/FileAnalyzer';
import FileHistory from '@/components/FileHistory';
import FileChatInterface from '@/components/FileChatInterface';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useFileStorage } from '@/hooks/useFileStorage';
import { FileData, FileAnalysisResult } from '@/types/file';

export default function FileAIPage() {
  const [currentFile, setCurrentFile] = useState<FileData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FileAnalysisResult | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);

  // Use file storage hook for JSON persistence
  const {
    savedFiles,
    currentFileId,
    isSaving,
    isLoading: isStorageLoading,
    fetchFiles,
    saveFileData,
    loadFileData,
    deleteFileData,
    createNewFileSession,
  } = useFileStorage();

  // Load saved files on component mount
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileUpload = async (file: File) => {
    setIsAnalyzing(true);
    
    // Create file data object
    const fileData: FileData = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      content: '',
      metadata: {},
      analysisStatus: 'processing'
    };
    
    try {
      // Read file content for analysis (but don't store large content)
      const content = await readFileContent(file);
      
      // Analyze file content with AI first
      const analysis = await analyzeFileWithAI({
        ...fileData,
        content: content // Pass full content to API
      });
      setAnalysisResult(analysis);

      // Only store a preview of the content to avoid localStorage limits
      fileData.content = content.length > 1000 ? content.substring(0, 1000) + '...[truncated]' : content;
      fileData.analysisStatus = 'completed';
      fileData.metadata = {
        originalContentSize: content.length,
        contentTruncated: content.length > 1000
      };

      // Save to storage (with limited content)
      try {
        await saveFileData(fileData);
        console.log('File metadata saved to localStorage');
      } catch (storageError) {
        console.warn('Could not save to localStorage:', storageError);
        // Show user-friendly notice
        alert(`Note: File "${file.name}" was analyzed successfully, but cannot be saved locally due to size limitations. You can still use it during this session.`);
      }
      
      setCurrentFile({
        ...fileData,
        content: content // Keep full content in memory for current session
      });

      // Initialize chat with file context
      setChatMessages([{
        id: '1',
        content: `File "${file.name}" has been successfully analyzed. I can now answer questions about its content. What would you like to know?`,
        role: 'assistant',
        timestamp: new Date(),
        fileContext: fileData.id
      }]);

    } catch (error) {
      console.error('Error processing file:', error);
      setAnalysisResult({
        id: Date.now().toString(),
        fileId: fileData.id,
        summary: `Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        keyPoints: [
          'File upload failed',
          'Please try uploading again',
          'Check file format and size',
          'Contact support if issue persists'
        ],
        dataStructure: { type: 'error', status: 'failed' },
        confidence: 0,
        analyzedAt: new Date().toISOString()
      });
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error processing file: ${errorMessage}. Please try again.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else if (result instanceof ArrayBuffer) {
          // Convert ArrayBuffer to base64 for binary files
          const bytes = new Uint8Array(result);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          resolve(base64);
        } else {
          reject(new Error('Could not read file content'));
        }
      };
      
      reader.onerror = () => reject(new Error('Error reading file'));
      
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      // Read text files as text, binary files as ArrayBuffer
      if (fileExtension === 'txt' || fileExtension === 'csv' || file.type.includes('text')) {
        reader.readAsText(file);
      } else {
        // For binary files (PDF, Word, Excel), read as ArrayBuffer
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const analyzeFileWithAI = async (fileData: FileData): Promise<FileAnalysisResult> => {
    try {
      const response = await fetch('/api/file-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileContent: fileData.content,
          fileName: fileData.name,
          fileType: fileData.type,
          query: 'analyze file structure and content'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze file');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      return {
        id: Date.now().toString(),
        fileId: fileData.id,
        summary: result.data.summary,
        keyPoints: [
          'File successfully processed and analyzed',
          'Content structure identified and indexed',
          'Ready for AI-powered queries and insights',
          `Analysis confidence: ${Math.round(result.data.confidence * 100)}%`
        ],
        dataStructure: result.data.extractedData || getFileStructure(fileData),
        confidence: result.data.confidence || 0.95,
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error analyzing file:', error);
      // Fallback to local analysis
      return {
        id: Date.now().toString(),
        fileId: fileData.id,
        summary: `Analysis of ${fileData.name}: File processed locally. Some features may be limited without AI API.`,
        keyPoints: [
          'File processed successfully',
          'Basic content extraction completed',
          'Limited analysis without AI API',
          'Manual queries available'
        ],
        dataStructure: getFileStructure(fileData),
        confidence: 0.75,
        analyzedAt: new Date().toISOString()
      };
    }
  };

  const getFileStructure = (fileData: FileData) => {
    const extension = fileData.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return { type: 'document', pages: 'auto-detected', sections: 'auto-extracted' };
      case 'docx':
      case 'doc':
        return { type: 'document', paragraphs: 'auto-detected', headings: 'auto-extracted' };
      case 'xlsx':
      case 'xls':
        return { type: 'spreadsheet', sheets: 'auto-detected', columns: 'auto-extracted' };
      case 'csv':
        return { type: 'data', rows: 'auto-detected', columns: 'auto-extracted' };
      default:
        return { type: 'text', lines: 'auto-detected' };
    }
  };

  const handleQuery = async (query: string) => {
    if (!currentFile) return;

    setIsQuerying(true);
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      content: query,
      role: 'user' as const,
      timestamp: new Date(),
      fileContext: currentFile.id
    };
    
    setChatMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/file-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileContent: currentFile.content,
          fileName: currentFile.name,
          fileType: currentFile.type,
          query: query
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to query file');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Query failed');
      }
      
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        content: result.data.answer || `Based on the analysis of "${currentFile.name}", here's what I found regarding your query: "${query}".`,
        role: 'assistant' as const,
        timestamp: new Date(),
        fileContext: currentFile.id,
        extractedData: result.data.extractedData
      };
      
      setChatMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error querying file:', error);
      
      // Fallback response
      const fallbackResponse = {
        id: (Date.now() + 1).toString(),
        content: `I encountered an issue processing your query "${query}" for "${currentFile.name}". This appears to be a connection issue. Please try again or check the file format.`,
        role: 'assistant' as const,
        timestamp: new Date(),
        fileContext: currentFile.id
      };
      
      setChatMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleLoadFile = async (fileId: string) => {
    const fileData = await loadFileData(fileId);
    if (fileData) {
      setCurrentFile(fileData);
      
      // Check if content is available
      const hasFullContent = fileData.content && !fileData.content.includes('[truncated]');
      
      // Load associated chat history if available
      setChatMessages([{
        id: '1',
        content: hasFullContent 
          ? `File "${fileData.name}" loaded. You can continue asking questions about its content.`
          : `File "${fileData.name}" loaded. Note: Full content may not be available due to size limitations. Some queries might have limited results.`,
        role: 'assistant',
        timestamp: new Date(),
        fileContext: fileData.id
      }]);
      
      if (!hasFullContent) {
        // Set a simple analysis result for files without full content
        setAnalysisResult({
          id: Date.now().toString(),
          fileId: fileData.id,
          summary: `File "${fileData.name}" was previously processed but full content is not available due to storage limitations.`,
          keyPoints: [
            'File previously uploaded and analyzed',
            'Limited content available for queries',
            'Re-upload file for full analysis',
            'Basic file information is available'
          ],
          dataStructure: { type: 'limited', status: 'content-unavailable' },
          confidence: 0.50,
          analyzedAt: new Date().toISOString()
        });
      }
    } else {
      alert('File not found or could not be loaded.');
    }
  };

  const handleNewSession = () => {
    createNewFileSession();
    setCurrentFile(null);
    setAnalysisResult(null);
    setChatMessages([]);
  };

  return (
    <ProtectedRoute requiredPermission="chat">
      <div className="bg-gray-100 h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 overflow-hidden">
          <div className="h-full flex gap-4 p-4">
            {/* File Upload & Analysis */}
            <div className="w-80 flex-shrink-0 space-y-4">
              <FileUploader
                onFileUpload={handleFileUpload}
                isProcessing={isAnalyzing}
                supportedTypes={['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt']}
              />
              
              {analysisResult && (
              <FileAnalyzer
                analysisResult={analysisResult}
                isLoading={isAnalyzing}
              />
            )}
          </div>
          
          {/* File History */}
          <div className="w-72 flex-shrink-0">
            <FileHistory
              savedFiles={savedFiles}
              currentFileId={currentFileId}
              isLoading={isStorageLoading}
              onLoadFile={handleLoadFile}
              onDeleteFile={deleteFileData}
              onNewSession={handleNewSession}
            />
          </div>
          
          {/* File Chat Interface */}
          <div className="flex-1 min-w-0">
            <FileChatInterface
              messages={chatMessages}
              currentFile={currentFile}
              isLoading={isQuerying}
              onSendQuery={handleQuery}
              analysisResult={analysisResult}
            />
          </div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}
