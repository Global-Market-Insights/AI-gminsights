'use client';

import { SavedFileItem } from '@/types/file';

interface FileHistoryProps {
  savedFiles: SavedFileItem[];
  currentFileId: string | null;
  isLoading: boolean;
  onLoadFile: (fileId: string) => void;
  onDeleteFile: (fileId: string) => void;
  onNewSession: () => void;
}

export default function FileHistory({
  savedFiles,
  currentFileId,
  isLoading,
  onLoadFile,
  onDeleteFile,
  onNewSession
}: FileHistoryProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getFileTypeIcon = (type: string): string => {
    if (type.includes('pdf')) return 'fas fa-file-pdf text-red-500';
    if (type.includes('word') || type.includes('document')) return 'fas fa-file-word text-blue-500';
    if (type.includes('sheet') || type.includes('excel')) return 'fas fa-file-excel text-green-500';
    if (type.includes('csv')) return 'fas fa-table text-green-600';
    return 'fas fa-file-alt text-gray-500';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'processing': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'completed': return 'fas fa-check-circle';
      case 'processing': return 'fas fa-spinner fa-spin';
      case 'error': return 'fas fa-exclamation-circle';
      default: return 'fas fa-clock';
    }
  };

  const handleDeleteFile = (fileId: string, fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
      onDeleteFile(fileId);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center">
            <i className="fas fa-history mr-2 text-xs"></i>
            File History
          </h2>
          <button
            onClick={onNewSession}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded text-xs transition-colors"
            title="Start new session"
          >
            <i className="fas fa-plus mr-1"></i>
            New
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="p-4">
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="border rounded-lg p-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        ) : savedFiles.length === 0 ? (
          <div className="p-4 text-center">
            <i className="fas fa-folder-open text-4xl text-gray-300 mb-3"></i>
            <p className="text-sm text-gray-500 mb-2">No files uploaded yet</p>
            <p className="text-xs text-gray-400">Upload a file to get started with AI analysis</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {savedFiles.map((file) => (
              <div
                key={file.id}
                className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                  currentFileId === file.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onLoadFile(file.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-1">
                      <i className={`${getFileTypeIcon(file.type)} mr-2 text-sm`}></i>
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {file.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{formatDate(file.lastAccessedAt)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <i className={`${getStatusIcon(file.analysisStatus)} mr-1 ${getStatusColor(file.analysisStatus)}`}></i>
                        <span className={`text-xs capitalize ${getStatusColor(file.analysisStatus)}`}>
                          {file.analysisStatus}
                        </span>
                      </div>
                      
                      {currentFileId === file.id && (
                        <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => handleDeleteFile(file.id, file.name, e)}
                    className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete file"
                  >
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {savedFiles.length > 0 && (
        <div className="border-t bg-gray-50 p-3 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>{savedFiles.length} file{savedFiles.length !== 1 ? 's' : ''}</span>
            <span>
              {savedFiles.filter(f => f.analysisStatus === 'completed').length} analyzed
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
