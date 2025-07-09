'use client';

import { useState, useEffect } from 'react';

export interface PromptField {
  key: string;
  label: string;
  prompt: string;
  enabled: boolean;
  category: 'basic' | 'summary' | 'meta';
}

const DEFAULT_PROMPTS: PromptField[] = [
  {
    key: 'title',
    label: 'Report Title',
    prompt: 'Generate a professional market research report title for {market}. Include forecast years (2024-2030) and make it SEO-friendly. Format: "Global [Market Name] Market Analysis [Years]"',
    enabled: true,
    category: 'basic'
  },
  {
    key: 'metaDescription',
    label: 'Executive Summary',
    prompt: 'Write a comprehensive executive summary for {market} including current market size, key growth drivers, major trends, challenges, and forecast outlook. Keep it under 200 words.',
    enabled: true,
    category: 'meta'
  },
  {
    key: 'marketSize',
    label: 'Market Size',
    prompt: 'Provide the current market size for {market} in USD. Format as "$X.X Billion" or "$X.X Million". Include the base year (2024).',
    enabled: true,
    category: 'basic'
  },
  {
    key: 'marketSizeForecast',
    label: 'Market Size Forecast',
    prompt: 'Provide the forecasted market size for {market} in USD by 2030. Format as "$X.X Billion" or "$X.X Million". Base the forecast on current growth trends and CAGR projections.',
    enabled: true,
    category: 'basic'
  },
  {
    key: 'cagr',
    label: 'CAGR',
    prompt: 'What is the projected CAGR (Compound Annual Growth Rate) for {market} from 2024-2030? Provide only the percentage value like "15.2%".',
    enabled: true,
    category: 'basic'
  },
  {
    key: 'category',
    label: 'Industry Category',
    prompt: 'What industry category does {market} belong to? Choose from: Technology, Automotive & Transportation, Energy & Environment, Healthcare & Pharmaceuticals, Financial Services, Consumer Goods, Manufacturing, Real Estate. Provide only the category name.',
    enabled: true,
    category: 'basic'
  },
  {
    key: 'targetAudience',
    label: 'Target Audience',
    prompt: 'Who is the target audience for a {market} research report? List 3-5 key stakeholders, decision makers, and professionals who would benefit from this research.',
    enabled: true,
    category: 'basic'
  },
  {
    key: 'metaKeywords',
    label: 'SEO Keywords',
    prompt: 'Generate 8-10 SEO keywords for {market} research report. Include market-specific terms, industry keywords, and research-related phrases. Separate with commas.',
    enabled: false,
    category: 'meta'
  },
  {
    key: 'reportSummary.marketSize',
    label: 'Market Size Analysis',
    prompt: 'Provide detailed market size analysis for {market}. Include historical data (2020-2023), current valuation (2024), growth projections (2025-2030), regional breakdown, and key factors driving market expansion.',
    enabled: false,
    category: 'summary'
  },
  {
    key: 'reportSummary.marketShare',
    label: 'Market Share Analysis',
    prompt: 'Analyze the market share distribution in {market}. Include top 5-7 leading companies, their approximate market share percentages, competitive positioning, and recent market movements.',
    enabled: false,
    category: 'summary'
  },
  {
    key: 'reportSummary.marketAnalysis',
    label: 'Market Analysis',
    prompt: 'Conduct comprehensive market analysis for {market}. Cover market dynamics, key growth drivers, major restraints, emerging opportunities, potential threats, and regulatory landscape.',
    enabled: false,
    category: 'summary'
  },
  {
    key: 'reportSummary.marketTrends',
    label: 'Market Trends',
    prompt: 'Identify current and emerging trends in {market}. Include technological innovations, consumer behavior shifts, regulatory changes, sustainability trends, and disruptive technologies.',
    enabled: false,
    category: 'summary'
  },
  {
    key: 'reportSummary.marketPlayers',
    label: 'Key Market Players',
    prompt: 'List and analyze key players in {market}. Include company profiles, market strategies, recent developments, partnerships, product launches, and competitive advantages for top 7-10 companies.',
    enabled: false,
    category: 'summary'
  }
];

export function usePromptConfig() {
  const [prompts, setPrompts] = useState<PromptField[]>(DEFAULT_PROMPTS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [configurations, setConfigurations] = useState<any[]>([]);
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);

  // Load prompts from API on mount
  useEffect(() => {
    loadCurrentConfig();
    loadAllConfigurations();
  }, []);

  // Load current active configuration
  const loadCurrentConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/prompts?type=current');
      const data = await response.json();
      
      if (data.success && data.config) {
        setPrompts(data.config.prompts || DEFAULT_PROMPTS);
        setActiveConfigId(data.config.id);
      } else {
        // Fallback to localStorage if API fails
        const savedPrompts = localStorage.getItem('promptConfig');
        if (savedPrompts) {
          try {
            const parsed = JSON.parse(savedPrompts);
            setPrompts(parsed);
          } catch (error) {
            console.error('Error loading saved prompts:', error);
            setPrompts(DEFAULT_PROMPTS);
          }
        }
      }
    } catch (error) {
      console.error('Error loading current config:', error);
      // Fallback to localStorage
      const savedPrompts = localStorage.getItem('promptConfig');
      if (savedPrompts) {
        try {
          const parsed = JSON.parse(savedPrompts);
          setPrompts(parsed);
        } catch (error) {
          setPrompts(DEFAULT_PROMPTS);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load all configurations
  const loadAllConfigurations = async () => {
    try {
      const response = await fetch('/api/prompts?type=all');
      const data = await response.json();
      
      if (data.success) {
        setConfigurations(data.configurations || []);
        if (data.activeConfigId) {
          setActiveConfigId(data.activeConfigId);
        }
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
    }
  };

  // Save current prompts to API
  const saveToAPI = async (newPrompts: PromptField[], configName?: string) => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/prompts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompts: newPrompts,
          name: configName || 'Current Configuration',
          description: 'Auto-saved configuration'
        }),
      });

      const data = await response.json();
      if (data.success) {
        setActiveConfigId(data.config.id);
        // Also save to localStorage as backup
        localStorage.setItem('promptConfig', JSON.stringify(newPrompts));
        return data.config;
      } else {
        throw new Error(data.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving to API:', error);
      // Fallback to localStorage
      localStorage.setItem('promptConfig', JSON.stringify(newPrompts));
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const updatePrompt = async (index: number, updates: Partial<PromptField>) => {
    const updatedPrompts = [...prompts];
    updatedPrompts[index] = { ...updatedPrompts[index], ...updates };
    setPrompts(updatedPrompts);
    
    // Auto-save to API
    try {
      await saveToAPI(updatedPrompts);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const resetToDefaults = async () => {
    setPrompts(DEFAULT_PROMPTS);
    try {
      await saveToAPI(DEFAULT_PROMPTS, 'Default Configuration');
      await loadAllConfigurations(); // Refresh configurations list
    } catch (error) {
      console.error('Reset failed:', error);
    }
  };

  // Save as new configuration
  const saveAsNewConfig = async (name: string, description: string = '') => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          prompts,
          isDefault: false
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadAllConfigurations(); // Refresh configurations list
        return data.config;
      } else {
        throw new Error(data.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving new config:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Load specific configuration
  const loadConfiguration = async (configId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/prompts/${configId}/activate`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        setPrompts(data.config.prompts);
        setActiveConfigId(data.config.id);
        await loadAllConfigurations(); // Refresh to update active status
        return data.config;
      } else {
        throw new Error(data.error || 'Failed to load configuration');
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete configuration
  const deleteConfiguration = async (configId: string) => {
    try {
      const response = await fetch(`/api/prompts/${configId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        await loadAllConfigurations(); // Refresh configurations list
        return true;
      } else {
        throw new Error(data.error || 'Failed to delete configuration');
      }
    } catch (error) {
      console.error('Error deleting configuration:', error);
      throw error;
    }
  };

  const exportConfig = () => {
    const dataStr = JSON.stringify(prompts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'prompt-config.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = (jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString);
      if (Array.isArray(imported)) {
        setPrompts(imported);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing config:', error);
      return false;
    }
  };

  const getPromptByKey = (key: string): PromptField | undefined => {
    return prompts.find(p => p.key === key);
  };

  const generateSingleField = async (key: string, marketInput: string): Promise<string | null> => {
    const promptField = getPromptByKey(key);
    if (!promptField) return null;

    setIsLoading(true);
    try {
      const prompt = promptField.prompt.replace(/{market}/g, marketInput);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a market research expert. Provide accurate, specific, and well-formatted information. Follow the prompt instructions exactly.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 800
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return data.choices?.[0]?.message?.content || null;
    } catch (error) {
      console.error(`Error generating ${key}:`, error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    prompts,
    configurations,
    activeConfigId,
    updatePrompt,
    resetToDefaults,
    saveAsNewConfig,
    loadConfiguration,
    deleteConfiguration,
    loadCurrentConfig,
    loadAllConfigurations,
    exportConfig,
    importConfig,
    getPromptByKey,
    generateSingleField,
    isLoading,
    isSaving
  };
}
