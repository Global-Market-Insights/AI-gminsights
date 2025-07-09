'use client';

import { useState } from 'react';
import { SavedReport } from '@/types';

interface ReportManagerProps {
  savedReports: SavedReport[];
  currentReportId: string | null;
  isLoading: boolean;
  onLoadReport: (id: string) => void;
  onDeleteReport: (id: string) => void;
  onCreateNew: () => void;
}

export default function ReportManager({
  savedReports,
  currentReportId,
  isLoading,
  onLoadReport,
  onDeleteReport,
  onCreateNew,
}: ReportManagerProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmDelete(id);
  };

  const confirmDelete = (id: string) => {
    onDeleteReport(id);
    setShowConfirmDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center">
            <i className="fas fa-folder-open mr-2 text-xs"></i>
            Saved Reports
          </h2>
          <button
            onClick={onCreateNew}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded text-xs transition-colors"
            title="Create New Report"
          >
            <i className="fas fa-plus mr-1"></i>New
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 min-h-0">{/* ...existing code... */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : savedReports.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <i className="fas fa-folder-open text-3xl mb-2"></i>
            <p className="text-sm">No saved reports yet</p>
            <p className="text-xs mt-1">Create your first report to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {savedReports.map((report) => (
              <div
                key={report.id}
                className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                  currentReportId === report.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onLoadReport(report.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {report.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {report.category}
                    </p>
                    <div className="flex items-center mt-2 space-x-3">
                      <span className="text-xs text-gray-400">
                        <i className="fas fa-calendar mr-1"></i>
                        {formatDate(report.updatedAt)}
                      </span>
                      {currentReportId === report.id && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          <i className="fas fa-eye mr-1"></i>
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteClick(report.id, e)}
                    className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete Report"
                  >
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <div className="flex items-center mb-4">
              <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
              <h3 className="text-lg font-medium">Delete Report</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this report? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(showConfirmDelete)}
                className="flex-1 px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
