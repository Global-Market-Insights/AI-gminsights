'use client';

import { useState } from 'react';
import { ExcelConverterState, ConvertedExcelData } from '@/types/excel-converter';
import { parseExcelFile, convertToFlatData, exportToExcel, exportToCSV, saveAsJSON } from '@/utils/excelProcessor';

export default function ExcelConverter() {
  const [state, setState] = useState<ExcelConverterState>({
    file: null,
    isProcessing: false,
    parsedData: null,
    convertedData: null,
    error: null,
    currentStep: 'upload'
  });

  const handleFileUpload = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setState(prev => ({ ...prev, error: 'Please select a valid Excel file (.xlsx or .xls)' }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      file, 
      isProcessing: true, 
      error: null, 
      currentStep: 'parsing' 
    }));

    try {
      // Use API route for processing
      const formData = new FormData();
      formData.append('file', file);

      setState(prev => ({ ...prev, currentStep: 'converting' }));

      const response = await fetch('/api/excel-converter', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process file');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Processing failed');
      }

      setState(prev => ({ 
        ...prev, 
        parsedData: result.data.originalData,
        convertedData: result.data, 
        currentStep: 'preview',
        isProcessing: false 
      }));

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isProcessing: false,
        currentStep: 'upload'
      }));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleExportExcel = () => {
    if (state.convertedData) {
      try {
        exportToExcel(state.convertedData);
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Export failed' 
        }));
      }
    }
  };

  const handleExportCSV = () => {
    if (state.convertedData) {
      try {
        exportToCSV(state.convertedData);
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Export failed' 
        }));
      }
    }
  };

  const handleExportJSON = () => {
    if (state.convertedData) {
      try {
        saveAsJSON(state.convertedData);
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Export failed' 
        }));
      }
    }
  };

  const handleReset = () => {
    setState({
      file: null,
      isProcessing: false,
      parsedData: null,
      convertedData: null,
      error: null,
      currentStep: 'upload'
    });
  };

  const renderStepIndicator = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {['upload', 'parsing', 'converting', 'preview'].map((step, index) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              state.currentStep === step ? 'bg-blue-500 text-white' :
              ['upload', 'parsing', 'converting', 'preview'].indexOf(state.currentStep) > index ? 'bg-green-500 text-white' :
              'bg-gray-300 text-gray-600'
            }`}>
              {['upload', 'parsing', 'converting', 'preview'].indexOf(state.currentStep) > index ? '✓' : index + 1}
            </div>
            <span className="ml-2 text-sm font-medium capitalize">
              {step === 'upload' ? 'Upload' : 
               step === 'parsing' ? 'Parsing' : 
               step === 'converting' ? 'Converting' : 'Preview'}
            </span>
            {index < 3 && <div className="flex-1 h-px bg-gray-300 mx-4"></div>}
          </div>
        ))}
      </div>
    </div>
  );

  const renderUploadArea = () => (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <div className="mb-4">
        <i className="fas fa-file-excel text-4xl text-green-500 mb-2"></i>
        <h3 className="text-lg font-semibold mb-2">Upload Excel File</h3>
        <p className="text-gray-600 mb-4">
          Upload your Excel file with multiple sheets (Global, Regional, Country, Product, Segment data)
        </p>
      </div>
      
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileInputChange}
        className="hidden"
        id="excel-upload"
        disabled={state.isProcessing}
      />
      
      <label
        htmlFor="excel-upload"
        className={`inline-block px-6 py-3 rounded-lg font-medium cursor-pointer transition-colors ${
          state.isProcessing 
            ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        <i className="fas fa-upload mr-2"></i>
        Choose Excel File
      </label>
      
      <p className="text-sm text-gray-500 mt-2">
        Supported formats: .xlsx, .xls
      </p>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <h3 className="text-lg font-semibold mb-2">
        {state.currentStep === 'parsing' ? 'Parsing Excel File...' : 'Converting to Flat Data...'}
      </h3>
      <p className="text-gray-600">
        {state.currentStep === 'parsing' 
          ? 'Reading sheets and extracting data structures' 
          : 'Converting multi-sheet data into unified flat structure'
        }
      </p>
    </div>
  );

  const renderSummary = () => {
    if (!state.convertedData) return null;

    const { summary, originalData } = state.convertedData;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3">Original File Info</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>File Name:</span>
              <span className="font-medium">{originalData.fileName}</span>
            </div>
            <div className="flex justify-between">
              <span>File Size:</span>
              <span className="font-medium">{(originalData.fileSize / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <div className="flex justify-between">
              <span>Sheets:</span>
              <span className="font-medium">{originalData.sheets.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Tables Detected:</span>
              <span className="font-medium text-green-600">
                {originalData.sheets.reduce((total, sheet) => total + (sheet.tableCount || 1), 0)}
              </span>
            </div>
          </div>
          
          {/* Enhanced sheet details */}
          <div className="mt-4">
            <h5 className="font-medium text-sm mb-2">Sheet Analysis:</h5>
            <div className="space-y-1 text-xs">
              {originalData.sheets.map((sheet, index) => (
                <div key={index} className="flex justify-between items-center py-1 border-b border-gray-200 last:border-b-0">
                  <span className="font-medium">{sheet.sheetName}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(sheet.type)}`}>
                      {sheet.type}
                    </span>
                    {sheet.metadata && (
                      <span className="text-gray-500">
                        {sheet.metadata.tablesDetected} table{sheet.metadata.tablesDetected !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3">Conversion Results</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Rows:</span>
              <span className="font-medium text-blue-600">{summary.totalRows}</span>
            </div>
            <div className="flex justify-between">
              <span>Global Rows:</span>
              <span className="font-medium">{summary.globalRows}</span>
            </div>
            <div className="flex justify-between">
              <span>Regional Rows:</span>
              <span className="font-medium">{summary.regionalRows}</span>
            </div>
            <div className="flex justify-between">
              <span>Country Rows:</span>
              <span className="font-medium">{summary.countryRows}</span>
            </div>
            <div className="flex justify-between">
              <span>Product Rows:</span>
              <span className="font-medium">{summary.productRows}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDataPreview = () => {
    if (!state.convertedData) return null;

    const { flatData, summary } = state.convertedData;
    const previewData = flatData.slice(0, 10); // Show first 10 rows
    const displayColumns = summary.columns.slice(0, 8); // Show first 8 columns

    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold">Data Preview (First 10 rows)</h4>
          <span className="text-sm text-gray-600">
            Showing {previewData.length} of {flatData.length} rows
          </span>
        </div>
        
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {displayColumns.map(column => (
                  <th
                    key={column}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previewData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {displayColumns.map(column => (
                    <td key={column} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {String(row[column] || '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {summary.columns.length > 8 && (
          <p className="text-sm text-gray-600 mt-2">
            ... and {summary.columns.length - 8} more columns
          </p>
        )}
      </div>
    );
  };

  const renderActions = () => (
    <div className="flex justify-center space-x-4">
      <button
        onClick={handleExportExcel}
        className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
      >
        <i className="fas fa-file-excel mr-2"></i>
        Export as Excel
      </button>
      
      <button
        onClick={handleExportCSV}
        className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
      >
        <i className="fas fa-file-csv mr-2"></i>
        Export as CSV
      </button>
      
      <button
        onClick={handleExportJSON}
        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
      >
        <i className="fas fa-file-code mr-2"></i>
        Export as JSON
      </button>
      
      <button
        onClick={handleReset}
        className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
      >
        <i className="fas fa-refresh mr-2"></i>
        Start Over
      </button>
    </div>
  );

  const renderProcessingLog = () => {
    if (!state.convertedData || !state.convertedData.conversionLog) return null;

    return (
      <div className="mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3 flex items-center">
            <i className="fas fa-list-ul mr-2 text-blue-500"></i>
            Processing Log
          </h4>
          <div className="space-y-1 text-sm font-mono bg-white p-3 rounded border max-h-40 overflow-y-auto">
            {state.convertedData.conversionLog.map((log, index) => (
              <div key={index} className={`${getLogColor(log)}`}>
                <span className="text-gray-500">{index + 1}.</span> {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Helper function to get color for sheet types
  const getTypeColor = (type: string): string => {
    const colorMap: { [key: string]: string } = {
      'global': 'bg-purple-100 text-purple-800',
      'regional': 'bg-blue-100 text-blue-800',
      'country': 'bg-green-100 text-green-800',
      'product': 'bg-orange-100 text-orange-800',
      'segment': 'bg-yellow-100 text-yellow-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colorMap[type] || colorMap['other'];
  };

  // Helper function to get color for log entries
  const getLogColor = (log: string): string => {
    if (log.includes('✅')) return 'text-green-700';
    if (log.includes('⚠️')) return 'text-yellow-700';
    if (log.includes('📊')) return 'text-blue-700';
    if (log.includes('❌')) return 'text-red-700';
    return 'text-gray-700';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Excel Data Converter</h1>
        <p className="text-gray-600">
          Convert multi-sheet Excel files (Global, Regional, Country, Product, Segment data) into unified flat data structure
        </p>
      </div>

      {renderStepIndicator()}

      {state.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <i className="fas fa-exclamation-triangle text-red-500 mr-2 mt-0.5"></i>
            <div>
              <h4 className="font-medium text-red-800">Error</h4>
              <p className="text-red-700">{state.error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6">
        {state.currentStep === 'upload' && renderUploadArea()}
        {(state.currentStep === 'parsing' || state.currentStep === 'converting') && renderProcessing()}
        
        {state.currentStep === 'preview' && (
          <>
            {renderSummary()}
            {renderProcessingLog()}
            {renderDataPreview()}
            {renderActions()}
          </>
        )}
      </div>
    </div>
  );
}
