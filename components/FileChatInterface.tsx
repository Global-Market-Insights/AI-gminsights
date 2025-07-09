'use client';

import { useState } from 'react';
import { FileData, FileAnalysisResult, FileChatMessage } from '@/types/file';

interface FileChatInterfaceProps {
  messages: FileChatMessage[];
  currentFile: FileData | null;
  isLoading: boolean;
  onSendQuery: (query: string) => void;
  analysisResult: FileAnalysisResult | null;
}

export default function FileChatInterface({
  messages,
  currentFile,
  isLoading,
  onSendQuery,
  analysisResult
}: FileChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading && currentFile) {
      onSendQuery(inputValue.trim());
      setInputValue('');
    }
  };

  const handleQuickQuery = (query: string) => {
    if (currentFile && !isLoading) {
      onSendQuery(query);
    }
  };

  const getQuickQueries = () => {
    if (!currentFile) return [];

    const extension = currentFile.name.split('.').pop()?.toLowerCase();
    
    const baseQueries = [
      'Summarize the main content',
      'What are the key insights?',
      'Extract important data points'
    ];

    const typeSpecificQueries: Record<string, string[]> = {
      pdf: ['What is this document about?', 'Extract key sections', 'List main topics'],
      docx: ['Summarize the document', 'Find important headings', 'Extract conclusions'],
      doc: ['Summarize the document', 'Find important headings', 'Extract conclusions'],
      xlsx: ['Analyze the data trends', 'What columns are available?', 'Show data summary'],
      xls: ['Analyze the data trends', 'What columns are available?', 'Show data summary'],
      csv: ['Analyze the dataset', 'Show column statistics', 'Find patterns in data'],
      txt: ['Summarize the text', 'Extract key information', 'Identify main themes']
    };

    return typeSpecificQueries[extension || ''] || baseQueries;
  };

  const formatFileInfo = (file: FileData) => {
    const size = (file.size / 1024).toFixed(1);
    const date = new Date(file.uploadedAt).toLocaleDateString();
    return `${file.name} (${size} KB, uploaded ${date})`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white p-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center">
            <i className="fas fa-comments mr-2 text-xs"></i>
            AI File Assistant
          </h2>
          {currentFile && (
            <div className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
              <i className="fas fa-file mr-1"></i>
              {currentFile.name.split('.').pop()?.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {!currentFile ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <i className="fas fa-upload text-4xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No File Selected</h3>
            <p className="text-sm text-gray-500 mb-4">
              Upload a file to start analyzing and asking questions about its content.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Supported Actions:</h4>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center">
                  <i className="fas fa-search mr-2 text-blue-500"></i>
                  Content analysis and summarization
                </div>
                <div className="flex items-center">
                  <i className="fas fa-question-circle mr-2 text-green-500"></i>
                  Question answering based on file content
                </div>
                <div className="flex items-center">
                  <i className="fas fa-chart-bar mr-2 text-purple-500"></i>
                  Data extraction and insights
                </div>
                <div className="flex items-center">
                  <i className="fas fa-brain mr-2 text-orange-500"></i>
                  AI-powered content understanding
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* File Info Header */}
          <div className="border-b bg-gray-50 p-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <i className="fas fa-file-alt text-blue-500 mr-2"></i>
                <div>
                  <div className="text-sm font-medium text-gray-800">{currentFile.name}</div>
                  <div className="text-xs text-gray-500">
                    {formatFileInfo(currentFile)}
                  </div>
                </div>
              </div>
              {analysisResult && (
                <div className="text-xs">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    <i className="fas fa-check mr-1"></i>
                    Analyzed ({Math.round(analysisResult.confidence * 100)}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-2 ${
                  message.role === 'user' ? 'justify-end' : ''
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="bg-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    AI
                  </div>
                )}
                <div
                  className={`rounded-lg p-3 max-w-xs ${
                    message.role === 'user'
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <div className="mt-1 text-xs opacity-75">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="bg-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    U
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start space-x-2">
                <div className="bg-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  AI
                </div>
                <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Queries */}
          {getQuickQueries().length > 0 && (
            <div className="border-t bg-gray-50 p-3 flex-shrink-0">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">Quick Queries</h3>
              <div className="flex flex-wrap gap-1">
                {getQuickQueries().map((query, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuery(query)}
                    disabled={isLoading}
                    className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1 rounded text-xs transition-colors disabled:opacity-50"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input */}
          <div className="border-t p-3 flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask anything about this file..."
                disabled={isLoading}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-paper-plane"></i>
                )}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
