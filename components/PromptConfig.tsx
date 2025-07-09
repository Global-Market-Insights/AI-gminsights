'use client';

import { useState, useRef } from 'react';
import { usePromptConfig, PromptField } from '@/hooks/usePromptConfig';

interface PromptConfigProps {
  onGenerateContent: (marketInput: string, selectedFields: PromptField[]) => void;
  isLoading: boolean;
}

export default function PromptConfig({ onGenerateContent, isLoading }: PromptConfigProps) {
  const [marketInput, setMarketInput] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [jsonImport, setJsonImport] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    prompts, 
    updatePrompt, 
    resetToDefaults, 
    exportConfig, 
    importConfig,
    isLoading: isGenerating 
  } = usePromptConfig();

  const handleGenerate = () => {
    if (!marketInput.trim()) {
      alert('Please enter a market name first');
      return;
    }
    const enabledFields = prompts.filter(p => p.enabled);
    if (enabledFields.length === 0) {
      alert('Please select at least one field to generate');
      return;
    }
    onGenerateContent(marketInput, enabledFields);
  };

  const toggleAll = (enabled: boolean) => {
    prompts.forEach((_, index) => {
      updatePrompt(index, { enabled });
    });
  };

  const handleImportJson = () => {
    try {
      const success = importConfig(jsonImport);
      if (success) {
        alert('Configuration imported successfully!');
        setJsonImport('');
        setShowJsonEditor(false);
      } else {
        alert('Invalid JSON format');
      }
    } catch (error) {
      alert('Error importing configuration');
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const success = importConfig(content);
        if (success) {
          alert('Configuration imported successfully!');
        } else {
          alert('Invalid configuration file');
        }
      };
      reader.readAsText(file);
    }
  };

  const categoryColors = {
    basic: 'bg-blue-50 border-blue-200',
    summary: 'bg-purple-50 border-purple-200',
    meta: 'bg-green-50 border-green-200'
  };

  const categoryIcons = {
    basic: 'fas fa-info-circle text-blue-500',
    summary: 'fas fa-file-alt text-purple-500',
    meta: 'fas fa-search text-green-500'
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-3 flex-shrink-0">
        <h2 className="text-sm font-semibold flex items-center">
          <i className="fas fa-magic mr-2 text-xs"></i>
          AI Prompt Generator
          <div className="ml-auto flex gap-1">
            <button
              onClick={() => setShowJsonEditor(!showJsonEditor)}
              className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded hover:bg-opacity-30"
              title="JSON Config"
            >
              <i className="fas fa-code mr-1"></i>JSON
            </button>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded hover:bg-opacity-30"
            >
              <i className={`fas ${showConfig ? 'fa-eye-slash' : 'fa-cog'} mr-1`}></i>
              {showConfig ? 'Hide' : 'Config'}
            </button>
          </div>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 min-h-0">
        {/* JSON Editor */}
        {showJsonEditor && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
              <i className="fas fa-code mr-1"></i>JSON Configuration
            </h3>
            <div className="flex gap-2 mb-2">
              <button
                onClick={exportConfig}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
              >
                <i className="fas fa-download mr-1"></i>Export
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
              >
                <i className="fas fa-upload mr-1"></i>Import File
              </button>
              <button
                onClick={resetToDefaults}
                className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              >
                <i className="fas fa-undo mr-1"></i>Reset
              </button>
            </div>
            <textarea
              value={jsonImport}
              onChange={(e) => setJsonImport(e.target.value)}
              placeholder="Paste JSON configuration here..."
              rows={4}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono"
            />
            <button
              onClick={handleImportJson}
              disabled={!jsonImport.trim()}
              className="mt-2 text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600 disabled:opacity-50"
            >
              <i className="fas fa-magic mr-1"></i>Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>
        )}

        {/* Market Input */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Market Research Topic
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={marketInput}
              onChange={(e) => setMarketInput(e.target.value)}
              placeholder="e.g., Electric Vehicle Market, AI Healthcare Market"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleGenerate}
              disabled={!marketInput.trim() || isLoading}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-rocket"></i>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter any market name and select fields to generate comprehensive research data
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => toggleAll(true)}
            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
          >
            <i className="fas fa-check-double mr-1"></i>Select All
          </button>
          <button
            onClick={() => toggleAll(false)}
            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
          >
            <i className="fas fa-times mr-1"></i>Deselect All
          </button>
          <div className="text-xs text-gray-500 flex items-center ml-auto">
            {prompts.filter(p => p.enabled).length} of {prompts.length} enabled
          </div>
        </div>

        {/* Field Selection by Category */}
        {['basic', 'meta', 'summary'].map(category => (
          <div key={category} className="mb-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
              <i className={`${categoryIcons[category as keyof typeof categoryIcons]} mr-1`}></i>
              {category.charAt(0).toUpperCase() + category.slice(1)} Fields
            </h3>
            <div className="space-y-2">
              {prompts.filter(p => p.category === category).map((prompt, index) => {
                const globalIndex = prompts.findIndex(p => p.key === prompt.key);
                return (
                  <div key={prompt.key} className={`p-2 rounded-lg border ${categoryColors[category as keyof typeof categoryColors]}`}>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={prompt.enabled}
                        onChange={(e) => updatePrompt(globalIndex, { enabled: e.target.checked })}
                        className="rounded text-purple-500 focus:ring-purple-500"
                      />
                      <label className="text-xs font-medium text-gray-700 flex-1">
                        {prompt.label}
                      </label>
                      <div className="text-xs text-gray-500 px-1 py-0.5 bg-white rounded">
                        {prompt.key}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Prompt Configuration */}
        {showConfig && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              <i className="fas fa-edit mr-1"></i>Customize Prompts
            </h3>
            <div className="space-y-3">
              {prompts.map((prompt, index) => (
                <div key={prompt.key} className={`p-3 rounded-lg border ${prompt.enabled ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-800 flex items-center">
                      <i className={`${categoryIcons[prompt.category]} mr-1`}></i>
                      {prompt.label}
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 px-1 py-0.5 bg-white rounded">
                        {prompt.category}
                      </span>
                      <input
                        type="checkbox"
                        checked={prompt.enabled}
                        onChange={(e) => updatePrompt(index, { enabled: e.target.checked })}
                        className="rounded text-purple-500 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <textarea
                    value={prompt.prompt}
                    onChange={(e) => updatePrompt(index, { prompt: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Use {'{market}'} as placeholder for the market input
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
