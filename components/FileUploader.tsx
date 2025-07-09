'use client';

import { useState, useRef } from 'react';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
  supportedTypes: string[];
}

export default function FileUploader({ onFileUpload, isProcessing, supportedTypes }: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getSupportedTypesText = () => {
    return supportedTypes.map(type => type.toUpperCase()).join(', ');
  };

  const getAcceptAttribute = () => {
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      txt: 'text/plain'
    };
    
    return supportedTypes.map(type => mimeTypes[type] || '').filter(Boolean).join(',');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!extension || !supportedTypes.includes(extension)) {
      alert(`Unsupported file type. Please upload: ${getSupportedTypesText()}`);
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      alert('File size too large. Please upload files smaller than 50MB.');
      return;
    }

    onFileUpload(file);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const getFileTypeIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      pdf: 'fas fa-file-pdf text-red-500',
      doc: 'fas fa-file-word text-blue-500',
      docx: 'fas fa-file-word text-blue-500',
      xls: 'fas fa-file-excel text-green-500',
      xlsx: 'fas fa-file-excel text-green-500',
      csv: 'fas fa-table text-green-600',
      txt: 'fas fa-file-alt text-gray-500'
    };
    
    return iconMap[type] || 'fas fa-file text-gray-400';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-3 flex-shrink-0">
        <h2 className="text-sm font-semibold flex items-center">
          <i className="fas fa-upload mr-2 text-xs"></i>
          File Upload & Analysis
        </h2>
      </div>

      <div className="flex-1 p-4">
        {isProcessing ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Processing file...</p>
              <p className="text-xs text-gray-500 mt-1">Analyzing content with AI</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Drag & Drop Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                dragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
            >
              <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-3"></i>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Supported: {getSupportedTypesText()}
              </p>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors">
                <i className="fas fa-folder-open mr-2"></i>
                Choose File
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={getAcceptAttribute()}
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Supported File Types */}
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">Supported File Types</h3>
              <div className="grid grid-cols-2 gap-2">
                {supportedTypes.map(type => (
                  <div key={type} className="flex items-center text-xs text-gray-600">
                    <i className={`${getFileTypeIcon(type)} mr-2`}></i>
                    {type.toUpperCase()}
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="mt-4 bg-gray-50 p-3 rounded-lg">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">AI Capabilities</h3>
              <div className="space-y-1">
                <div className="flex items-center text-xs text-gray-600">
                  <i className="fas fa-search mr-2 text-blue-500"></i>
                  Content analysis & extraction
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <i className="fas fa-brain mr-2 text-purple-500"></i>
                  AI-powered Q&A
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <i className="fas fa-chart-bar mr-2 text-green-500"></i>
                  Data structure analysis
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <i className="fas fa-comments mr-2 text-orange-500"></i>
                  Interactive chat interface
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
