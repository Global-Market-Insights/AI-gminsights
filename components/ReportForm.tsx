'use client';

import { useState } from 'react';
import { ReportData } from '@/types';
import { usePromptConfig } from '@/hooks/usePromptConfig';

interface ReportFormProps {
  reportData: ReportData;
  isLoading: boolean;
  isSaving: boolean;
  currentReportId: string | null;
  autoFillEnabled: boolean;
  showAutoFillNotification?: boolean;
  savedReports?: any[];
  onChange: (field: keyof ReportData, value: string | number | any) => void;
  onRefresh: () => void;
  onSave: () => void;
  onToggleAutoFill: () => void;
  onExtractFromChat: () => void;
  onCreateNew?: () => void;
  onLoadReport?: (reportId: string) => void;
}

export default function ReportForm({ 
  reportData, 
  isLoading, 
  isSaving,
  currentReportId,
  autoFillEnabled,
  showAutoFillNotification = false,
  savedReports = [],
  onChange, 
  onRefresh,
  onSave,
  onToggleAutoFill,
  onExtractFromChat,
  onCreateNew,
  onLoadReport
}: ReportFormProps) {
  const { 
    generateSingleField, 
    isLoading: isGenerating, 
    prompts, 
    configurations,
    activeConfigId,
    updatePrompt, 
    resetToDefaults,
    saveAsNewConfig,
    loadConfiguration,
    deleteConfiguration,
    isSaving: isConfigSaving
  } = usePromptConfig();
  
  const [showPromptConfig, setShowPromptConfig] = useState(false);
  const [showNewConfigDialog, setShowNewConfigDialog] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');
  const [newConfigDescription, setNewConfigDescription] = useState('');

  // Helper function to extract market name up to and including "Market"
  const extractMarketName = (input: string): string => {
    if (!input) return '';
    
    // Find the first occurrence of "Market" (case insensitive)
    const marketMatch = input.match(/^(.*?market)\b/i);
    if (marketMatch) {
      // Extract up to and including "Market", preserving original case
      return marketMatch[1].trim();
    }
    
    // If "Market" is not found, return empty string or the original input up to first comma
    const commaIndex = input.indexOf(',');
    if (commaIndex !== -1) {
      return input.substring(0, commaIndex).trim();
    }
    
    return '';
  };

  // Helper function to check if report has meaningful data
  const hasReportData = () => {
    return reportData.title.trim() !== '' || 
           reportData.marketName.trim() !== '' || 
           reportData.metaTitle.trim() !== '' ||
           currentReportId !== null;
  };

  // Handle saving new configuration
  const handleSaveNewConfig = async () => {
    if (!newConfigName.trim()) {
      alert('Please enter a configuration name');
      return;
    }

    try {
      await saveAsNewConfig(newConfigName, newConfigDescription);
      setShowNewConfigDialog(false);
      setNewConfigName('');
      setNewConfigDescription('');
      alert('Configuration saved successfully!');
    } catch (error) {
      alert('Failed to save configuration: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Handle loading configuration
  const handleLoadConfig = async (configId: string) => {
    try {
      await loadConfiguration(configId);
      alert('Configuration loaded successfully!');
    } catch (error) {
      alert('Failed to load configuration: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Handle deleting configuration
  const handleDeleteConfig = async (configId: string, configName: string) => {
    if (!confirm(`Are you sure you want to delete the configuration "${configName}"?`)) {
      return;
    }

    try {
      await deleteConfiguration(configId);
      alert('Configuration deleted successfully!');
    } catch (error) {
      alert('Failed to delete configuration: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleInputChange = (field: keyof ReportData, value: string | number) => {
    onChange(field, value);
    
    // Auto-update marketName when title changes
    if (field === 'title' && typeof value === 'string') {
      const extractedMarketName = extractMarketName(value);
      if (extractedMarketName && extractedMarketName !== reportData.marketName) {
        onChange('marketName', extractedMarketName);
      }
    }
  };

  const handleMarketNameChange = (value: string) => {
    // Update the marketName field in reportData
    onChange('marketName', value);
  };

  const handleSummaryChange = (section: string, value: string) => {
    const updatedSummary = {
      ...reportData.reportSummary,
      [section]: value
    };
    onChange('reportSummary' as keyof ReportData, updatedSummary);
  };

  const handleGenerateField = async (fieldKey: string) => {
    // Use extracted market name from title instead of reportData.marketName
    const marketInput = extractMarketName(reportData.title || '');
    if (!marketInput.trim()) {
      alert('Please enter a report title with a market name first');
      return;
    }

    const result = await generateSingleField(fieldKey, marketInput);
    if (result) {
      if (fieldKey.includes('.')) {
        // Handle nested fields (reportSummary.*)
        const [parent, child] = fieldKey.split('.');
        const updatedSummary = {
          ...reportData.reportSummary,
          [child]: result
        };
        onChange('reportSummary' as keyof ReportData, updatedSummary);
      } else {
        // Handle regular fields with special processing
        if (fieldKey === 'marketSize' || fieldKey === 'marketSizeForecast') {
          const sizeMatch = result.match(/\$?[\d,.]+\s*(?:billion|million|trillion)/i);
          onChange(fieldKey as keyof ReportData, sizeMatch ? sizeMatch[0] : result);
        } else if (fieldKey === 'cagr') {
          const cagrMatch = result.match(/(\d+\.?\d*%)/);
          onChange(fieldKey as keyof ReportData, cagrMatch ? cagrMatch[1] : result);
        } else {
          onChange(fieldKey as keyof ReportData, result);
        }
      }
    }
  };

  const PromptButton = ({ fieldKey, size = 'sm' }: { fieldKey: string; size?: 'xs' | 'sm' }) => (
    <button
      onClick={() => handleGenerateField(fieldKey)}
      disabled={isGenerating || !extractMarketName(reportData.title || '').trim()}
      className={`bg-purple-500 hover:bg-purple-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        size === 'xs' ? 'px-1 py-0.5 text-xs' : 'px-2 py-1 text-xs'
      }`}
      title="Generate with AI"
    >
      {isGenerating ? (
        <i className="fas fa-spinner fa-spin"></i>
      ) : (
        <i className="fas fa-magic"></i>
      )}
    </button>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col relative">
      {/* Auto-fill notification */}
      {showAutoFillNotification && (
        <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-xs px-3 py-1 z-10 animate-pulse">
          <i className="fas fa-magic mr-1"></i>
          Form auto-filled with AI data!
        </div>
      )}
      
      <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-3 flex-shrink-0"
           style={{ marginTop: showAutoFillNotification ? '24px' : '0' }}>{/* ...existing code... */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h2 className="text-sm font-semibold flex items-center">
              <i className="fas fa-edit mr-2 text-xs"></i>
              Report Details
            </h2>
            {currentReportId && (
              <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                Saved
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleAutoFill}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                autoFillEnabled 
                  ? 'bg-green-500 bg-opacity-80 text-white hover:bg-opacity-100' 
                  : 'bg-gray-500 bg-opacity-60 text-white hover:bg-opacity-80'
              }`}
              title={autoFillEnabled ? 'Auto-fill enabled - Click to disable' : 'Auto-fill disabled - Click to enable'}
            >
              <i className={`fas ${autoFillEnabled ? 'fa-magic' : 'fa-magic'} mr-1`}></i>
              {autoFillEnabled ? '🔥 AUTO' : '⚫ OFF'}
            </button>
            <button
              onClick={onExtractFromChat}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded text-xs transition-colors"
              title="Extract data from latest AI response"
            >
              <i className="fas fa-download mr-1"></i>
              Extract
            </button>
            <button
              onClick={async () => {
                // First save the report, then navigate to TOC
                if (!currentReportId) {
                  await onSave();
                }
                // Navigate to TOC page on same window
                window.location.href = `/report-toc/${reportData.slug}`;
              }}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded text-xs transition-colors inline-flex items-center"
              title="Edit Table of Contents"
            >
              <i className="fas fa-list-ol mr-1"></i>
              TOC
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 px-2 py-1 rounded text-xs transition-colors flex items-center"
              title="Save Report"
            >
              {isSaving ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-1"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-1"></i>
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 min-h-0">
        <form className="space-y-3">
          {/* AI Market Input */}
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
              <i className="fas fa-magic mr-1 text-purple-500"></i>Market Research Topic
            </h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Market Name</label>
                <input
                  type="text"
                  value={extractMarketName(reportData.title || '')}
                  readOnly
                  placeholder=""
                  className="w-full border border-purple-300 rounded-lg px-2 py-1 text-xs bg-purple-50 text-purple-700 focus:outline-none"
                />
                <div className="text-xs text-purple-600 mt-1">
                  <i className="fas fa-info-circle mr-1"></i>
                  Auto-extracted from Report Title. Add a title with "Market" to enable AI generation
                </div>
              </div>
            </div>
          </div>

          {/* AI Prompt Configuration Panel */}
          {showPromptConfig && (
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-700 flex items-center">
                  <i className="fas fa-cog mr-1 text-orange-500"></i>AI Prompt Configuration
                  {isConfigSaving && (
                    <span className="ml-2 text-xs text-orange-600">
                      <i className="fas fa-spinner fa-spin mr-1"></i>Saving...
                    </span>
                  )}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowNewConfigDialog(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition-colors"
                    title="Save current config as new"
                  >
                    <i className="fas fa-save mr-1"></i>Save As
                  </button>
                  <button
                    onClick={resetToDefaults}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-xs transition-colors"
                    title="Reset all prompts to defaults"
                  >
                    <i className="fas fa-undo mr-1"></i>Reset
                  </button>
                  <button
                    onClick={() => setShowPromptConfig(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs transition-colors"
                    title="Close prompt configuration"
                  >
                    <i className="fas fa-times mr-1"></i>Close
                  </button>
                </div>
              </div>

              {/* Configuration Selector */}
              {configurations.length > 0 && (
                <div className="mb-4 p-3 bg-white rounded border border-orange-200">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">
                    <i className="fas fa-list mr-1"></i>Saved Configurations
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {configurations.map((config) => (
                      <div key={config.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <span className="text-xs font-medium text-gray-800 truncate">{config.name}</span>
                            {config.id === activeConfigId && (
                              <span className="ml-2 px-1 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                Active
                              </span>
                            )}
                            {config.isDefault && (
                              <span className="ml-1 px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                Default
                              </span>
                            )}
                          </div>
                          {config.description && (
                            <p className="text-xs text-gray-500 truncate mt-1">{config.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            Updated: {new Date(config.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          {config.id !== activeConfigId && (
                            <button
                              onClick={() => handleLoadConfig(config.id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs transition-colors"
                              title="Load this configuration"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                          )}
                          {!config.isDefault && config.id !== activeConfigId && (
                            <button
                              onClick={() => handleDeleteConfig(config.id, config.name)}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-colors"
                              title="Delete this configuration"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {prompts.map((prompt, index) => (
                  <div key={prompt.key} className="bg-white p-3 rounded border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-xs font-medium text-gray-700">{prompt.label}</span>
                        <span className={`ml-2 px-1 py-0.5 rounded text-xs ${
                          prompt.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {prompt.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <span className="ml-1 px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          {prompt.category}
                        </span>
                      </div>
                      <button
                        onClick={() => updatePrompt(index, { enabled: !prompt.enabled })}
                        className={`px-2 py-1 rounded text-xs transition-colors ${
                          prompt.enabled 
                            ? 'bg-green-500 hover:bg-green-600 text-white' 
                            : 'bg-gray-400 hover:bg-gray-500 text-white'
                        }`}
                      >
                        {prompt.enabled ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    
                    <textarea
                      value={prompt.prompt}
                      onChange={(e) => updatePrompt(index, { prompt: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                      placeholder="Enter prompt template (use {market} as placeholder)"
                    />
                    
                    <div className="text-xs text-gray-500 mt-1">
                      <i className="fas fa-info-circle mr-1"></i>
                      Use {'{market}'} as placeholder for market name. Key: {prompt.key}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Configuration Dialog */}
          {showNewConfigDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Save Configuration</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Configuration Name</label>
                    <input
                      type="text"
                      value={newConfigName}
                      onChange={(e) => setNewConfigName(e.target.value)}
                      placeholder="e.g., My Custom Prompts"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                    <textarea
                      value={newConfigDescription}
                      onChange={(e) => setNewConfigDescription(e.target.value)}
                      placeholder="Describe this configuration..."
                      rows={3}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowNewConfigDialog(false);
                      setNewConfigName('');
                      setNewConfigDescription('');
                    }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNewConfig}
                    disabled={!newConfigName.trim() || isConfigSaving}
                    className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded text-sm transition-colors"
                  >
                    {isConfigSaving ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-1"></i>Saving...
                      </>
                    ) : (
                      'Save Configuration'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Basic Report Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
              <i className="fas fa-info-circle mr-1"></i>Basic Information
            </h3>
            
            <div className="space-y-2">
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1">
                  Report Title
                  <PromptButton fieldKey="title" />
                </label>
                <input
                  type="text"
                  value={reportData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <div className="text-xs text-green-600 mt-1">
                  <i className={`fas ${autoFillEnabled ? 'fa-magic' : 'fa-edit'} mr-1`}></i>
                  {autoFillEnabled ? 'Auto-filled by LLAMA' : 'Manual input'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Extracted Market Name</label>
                <input
                  type="text"
                  value={extractMarketName(reportData.title || '')}
                  readOnly
                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs bg-gray-50 text-gray-600"
                  placeholder="Auto-extracted from Report Title"
                />
                <div className="text-xs text-gray-500 mt-1">
                  <i className="fas fa-sync mr-1"></i>
                  Auto-extracted from Report Title (up to "Market")
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Report Name/ID</label>
                <input
                  type="text"
                  value={reportData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">URL Slug</label>
                <input
                  type="text"
                  value={reportData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
          
          {/* SEO & Meta Information */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
              <i className="fas fa-search mr-1"></i>SEO & Meta Data
            </h3>
            
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Meta Title</label>
                <input
                  type="text"
                  value={reportData.metaTitle}
                  onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1">
                  Meta Keywords
                  <PromptButton fieldKey="metaKeywords" />
                </label>
                <textarea
                  rows={2}
                  value={reportData.metaKeywords}
                  onChange={(e) => handleInputChange('metaKeywords', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Keywords auto-filled by LLAMA..."
                />
              </div>
              
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1">
                  Meta Description
                  <PromptButton fieldKey="metaDescription" />
                </label>
                <textarea
                  rows={2}
                  value={reportData.metaDescription}
                  onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          {/* Market Analysis Data */}
          <div className="bg-purple-50 p-3 rounded-lg">
            <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
              <i className="fas fa-chart-bar mr-1"></i>Market Analysis
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Base Year</label>
                <input
                  type="number"
                  value={reportData.baseYear}
                  onChange={(e) => handleInputChange('baseYear', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Forecast Year</label>
                <input
                  type="number"
                  value={reportData.forecastYear}
                  onChange={(e) => handleInputChange('forecastYear', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1">
                  CAGR (%)
                  <PromptButton fieldKey="cagr" />
                </label>
                <input
                  type="text"
                  value={reportData.cagr}
                  onChange={(e) => handleInputChange('cagr', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <div className="text-xs text-purple-600 mt-1">
                  <i className="fas fa-calculator mr-1"></i>Calculated by AI
                </div>
              </div>
              
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1">
                  Market Size ({reportData.baseYear})
                  <PromptButton fieldKey="marketSize" />
                </label>
                <input
                  type="text"
                  value={reportData.marketSize}
                  onChange={(e) => handleInputChange('marketSize', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1">
                  Market Size ({reportData.forecastYear})
                  <PromptButton fieldKey="marketSizeForecast" />
                </label>
                <input
                  type="text"
                  value={reportData.marketSizeForecast || ''}
                  onChange={(e) => handleInputChange('marketSizeForecast', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
          
          {/* Additional Fields */}
          <div className="bg-yellow-50 p-3 rounded-lg">
            <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
              <i className="fas fa-plus-circle mr-1"></i>Additional Information
            </h3>
            
            <div className="space-y-2">
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1">
                  Industry Category
                  <PromptButton fieldKey="category" />
                </label>
                <select
                  value={reportData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500"
                >
                  <option>Automotive & Transportation</option>
                  <option>Technology</option>
                  <option>Energy</option>
                  <option>Healthcare</option>
                  <option>Financial Services</option>
                </select>
              </div>
              
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1">
                  Target Audience
                  <PromptButton fieldKey="targetAudience" />
                </label>
                <input
                  type="text"
                  value={reportData.targetAudience}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Report Length</label>
                <select
                  value={reportData.reportLength}
                  onChange={(e) => handleInputChange('reportLength', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500"
                >
                  <option value="short">Short (5-10 pages)</option>
                  <option value="medium">Medium (15-25 pages)</option>
                  <option value="long">Long (30+ pages)</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Report Summary */}
          <div className="bg-indigo-50 p-3 rounded-lg">
            <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
              <i className="fas fa-file-alt mr-1"></i>Report Summary
            </h3>
            
            <div className="space-y-2">
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1">
                  Market Size Analysis
                  <PromptButton fieldKey="reportSummary.marketSize" size="xs" />
                </label>
                <textarea
                  value={reportData.reportSummary?.marketSize || ''}
                  onChange={(e) => handleSummaryChange('marketSize', e.target.value)}
                  rows={2}
                  placeholder="Describe the current market size, value, and growth projections..."
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1">
                  Market Share
                  <PromptButton fieldKey="reportSummary.marketShare" size="xs" />
                </label>
                <textarea
                  value={reportData.reportSummary?.marketShare || ''}
                  onChange={(e) => handleSummaryChange('marketShare', e.target.value)}
                  rows={2}
                  placeholder="Detail market share distribution among key players..."
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1">
                  Market Analysis
                  <PromptButton fieldKey="reportSummary.marketAnalysis" size="xs" />
                </label>
                <textarea
                  value={reportData.reportSummary?.marketAnalysis || ''}
                  onChange={(e) => handleSummaryChange('marketAnalysis', e.target.value)}
                  rows={2}
                  placeholder="Comprehensive analysis of market dynamics, drivers, and challenges..."
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1">
                  Market Trends
                  <PromptButton fieldKey="reportSummary.marketTrends" size="xs" />
                </label>
                <textarea
                  value={reportData.reportSummary?.marketTrends || ''}
                  onChange={(e) => handleSummaryChange('marketTrends', e.target.value)}
                  rows={2}
                  placeholder="Current and emerging trends shaping the market..."
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1">
                  Key Market Players
                  <PromptButton fieldKey="reportSummary.marketPlayers" size="xs" />
                </label>
                <textarea
                  value={reportData.reportSummary?.marketPlayers || ''}
                  onChange={(e) => handleSummaryChange('marketPlayers', e.target.value)}
                  rows={2}
                  placeholder="Major companies, their strategies, and competitive landscape..."
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded-lg text-xs transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-1"></i>Refreshing...
                </>
              ) : (
                <>
                  <i className="fas fa-sync mr-1"></i>Refresh AI Data
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
