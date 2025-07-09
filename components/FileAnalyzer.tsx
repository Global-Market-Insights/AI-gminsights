'use client';

import { FileAnalysisResult } from '@/types/file';

interface FileAnalyzerProps {
  analysisResult: FileAnalysisResult;
  isLoading: boolean;
}

export default function FileAnalyzer({ analysisResult, isLoading }: FileAnalyzerProps) {
  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  const getDataTypeIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      document: 'fas fa-file-alt text-blue-500',
      spreadsheet: 'fas fa-table text-green-500',
      data: 'fas fa-database text-purple-500',
      text: 'fas fa-file-text text-gray-500'
    };
    
    return iconMap[type] || 'fas fa-file text-gray-400';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-3 flex-shrink-0">
          <h2 className="text-sm font-semibold flex items-center">
            <i className="fas fa-brain mr-2 text-xs"></i>
            AI Analysis
          </h2>
        </div>
        
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-28"></div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Analyzing content...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-3 flex-shrink-0">
        <h2 className="text-sm font-semibold flex items-center">
          <i className="fas fa-brain mr-2 text-xs"></i>
          AI Analysis Results
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {/* Confidence Score */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">Analysis Confidence</span>
            <span className="text-xs font-bold text-green-600">
              {formatConfidence(analysisResult.confidence)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${analysisResult.confidence * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
            <i className="fas fa-info-circle mr-1 text-blue-500"></i>
            Summary
          </h3>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-gray-700 leading-relaxed">
              {analysisResult.summary}
            </p>
          </div>
        </div>

        {/* Key Points */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
            <i className="fas fa-list-ul mr-1 text-green-500"></i>
            Key Points
          </h3>
          <div className="space-y-2">
            {analysisResult.keyPoints.map((point, index) => (
              <div key={index} className="flex items-start text-xs text-gray-600">
                <i className="fas fa-check-circle text-green-500 mr-2 mt-0.5 flex-shrink-0"></i>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Structure */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
            <i className="fas fa-sitemap mr-1 text-purple-500"></i>
            Data Structure
          </h3>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center mb-2">
              <i className={`${getDataTypeIcon(analysisResult.dataStructure.type)} mr-2`}></i>
              <span className="text-xs font-medium text-gray-700 capitalize">
                {analysisResult.dataStructure.type}
              </span>
            </div>
            <div className="space-y-1">
              {Object.entries(analysisResult.dataStructure).map(([key, value]) => (
                key !== 'type' && (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-gray-600 capitalize">{key}:</span>
                    <span className="text-gray-800 font-medium">{String(value)}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>

        {/* Analysis Metadata */}
        <div className="text-xs text-gray-500 border-t pt-3">
          <div className="flex items-center justify-between">
            <span>Analyzed:</span>
            <span>{new Date(analysisResult.analyzedAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span>Analysis ID:</span>
            <span className="font-mono">{analysisResult.id.slice(-8)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
