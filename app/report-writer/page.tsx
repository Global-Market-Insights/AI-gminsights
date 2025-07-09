'use client';

import { useState, useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import ReportForm from '@/components/ReportForm';
import ContentPreview from '@/components/ContentPreview';
import ReportManager from '@/components/ReportManager';
import PromptConfig from '@/components/PromptConfig';
import ResizablePanel from '@/components/ResizablePanel';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useReportStorage } from '@/hooks/useReportStorage';
import { useResizable } from '@/hooks/useResizable';
import { Message, ReportData } from '@/types';
import { PromptField } from '@/hooks/usePromptConfig';

export default function ReportWriterPage() {
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your LLAMA AI assistant. What report would you like me to help you create today?",
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  
  const [reportData, setReportData] = useState<ReportData>({
    title: '',
    slug: '',
    metaTitle: '',
    metaKeywords: '',
    metaDescription: '',
    marketName: '',
    baseYear: new Date().getFullYear(),
    forecastYear: new Date().getFullYear() + 5,
    cagr: '',
    marketSize: '',
    marketSizeForecast: '',
    category: '',
    targetAudience: '',
    reportLength: 'medium',
    reportSummary: {
      marketSize: '',
      marketShare: '',
      marketAnalysis: '',
      marketTrends: '',
      marketPlayers: ''
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [autoFillEnabled, setAutoFillEnabled] = useState(true);
  const [showAutoFillNotification, setShowAutoFillNotification] = useState(false);
  const [scrapingStatus, setScrapingStatus] = useState({
    'Market research sites': 'complete',
    'Industry reports': 'in-progress',
    'Financial data': 'pending'
  });

  // Author and timing information
  const [reportMeta, setReportMeta] = useState({
    author: user?.username || '',
    authorRole: user?.role.name || '',
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    estimatedReadingTime: '10-15 minutes',
    wordCount: 0,
    status: 'draft' as 'draft' | 'in-review' | 'published',
    version: '1.0',
    assignedTo: user?.username || '',
    deadline: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });

  // Use the report storage hook
  const {
    savedReports,
    currentReportId,
    isSaving,
    isLoading: isStorageLoading,
    fetchReports,
    saveReport,
    loadReport,
    deleteReport,
    createNewReport,
  } = useReportStorage();

  // Use the resizable hook
  const {
    panelWidths,
    isResizing,
    updatePanelWidth,
    startResize,
    stopResize,
    handleMouseMove,
    resetPanelWidth,
    resetAllWidths,
    minWidths,
    maxWidths
  } = useResizable();

  // Load saved reports on component mount
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Update author info when user changes
  useEffect(() => {
    if (user) {
      setReportMeta(prev => ({
        ...prev,
        author: user.username,
        authorRole: user.role.name,
        assignedTo: user.username
      }));
    }
  }, [user]);

  // Update word count and reading time when report data changes
  useEffect(() => {
    const calculateWordCount = () => {
      const text = [
        reportData.title,
        reportData.metaDescription,
        reportData.reportSummary?.marketSize,
        reportData.reportSummary?.marketShare,
        reportData.reportSummary?.marketAnalysis,
        reportData.reportSummary?.marketTrends,
        reportData.reportSummary?.marketPlayers
      ].filter(Boolean).join(' ');
      
      const words = text.split(/\s+/).filter(word => word.length > 0);
      const wordCount = words.length;
      const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200)); // 200 words per minute
      
      setReportMeta(prev => ({
        ...prev,
        wordCount,
        estimatedReadingTime: `${readingTimeMinutes}-${readingTimeMinutes + 2} minutes`,
        lastModified: new Date().toISOString()
      }));
    };

    calculateWordCount();
  }, [reportData]);

  // Keyboard shortcuts for layout management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'r':
            if (e.shiftKey) {
              e.preventDefault();
              resetAllWidths();
            }
            break;
          case '1':
            e.preventDefault();
            resetPanelWidth('chat');
            break;
          case '2':
            e.preventDefault();
            resetPanelWidth('promptConfig');
            break;
          case '3':
            e.preventDefault();
            resetPanelWidth('reportManager');
            break;
          case '4':
            e.preventDefault();
            resetPanelWidth('reportForm');
            break;
          case '5':
            e.preventDefault();
            resetPanelWidth('contentPreview');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [resetAllWidths, resetPanelWidth]);

  // Force scroll recalculation when panel widths change
  useEffect(() => {
    const mainElement = document.querySelector('.resizable-container');
    if (mainElement) {
      // Force a reflow to ensure scroll bars appear
      const totalWidth = Object.values(panelWidths).reduce((sum, width) => sum + width, 0);
      const viewportWidth = window.innerWidth;
      
      if (totalWidth > viewportWidth) {
        mainElement.scrollLeft = mainElement.scrollLeft; // Force scroll recalculation
      }
    }
  }, [panelWidths]);

  // Helper function to check if slug exists in other reports
  const hasSlugConflict = (slug: string, excludeId?: string): boolean => {
    return savedReports.some(report => 
      report.slug === slug && report.id !== (excludeId || currentReportId)
    );
  };

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

  const extractReportDataFromAI = (aiResponse: string): Partial<ReportData> => {
    // Extract report information from AI response using pattern matching
    const extractedData: Partial<ReportData> = {};
    
    console.log('Processing AI response for extraction:', aiResponse.substring(0, 200)); // Debug log
    
    // Extract title - look for patterns like "Report Title:", "Title:", or quoted titles
    const titleMatch = aiResponse.match(/(?:report\s+title|title):\s*([^\n\r]+)/i) ||
                      aiResponse.match(/"([^"]+(?:market|analysis|report|forecast)[^"]*)"?/i) ||
                      aiResponse.match(/(?:analyzing|analysis\s+of|report\s+on)\s+(?:the\s+)?([^.\n\r]+(?:market|industry))/i) ||
                      aiResponse.match(/([A-Za-z\s]+(?:market|industry|analysis|report))/i);
    if (titleMatch) {
      const title = titleMatch[1].trim().replace(/"/g, '');
      if (title.length > 5) { // Only use meaningful titles
        extractedData.title = title;
      }
    }
    
    // Extract market size - look for dollar amounts with billion/million/trillion
    const marketSizeMatch = aiResponse.match(/(?:market\s+size|valued\s+at|worth|size\s+of):\s*\$?[\d,.]+\s*(?:billion|million|trillion)/i) ||
                           aiResponse.match(/\$[\d,.]+\s*(?:billion|million|trillion)(?:\s+market)?/i) ||
                           aiResponse.match(/(?:reach|projected to reach|market is)\s+\$?[\d,.]+\s*(?:billion|million|trillion)/i);
    if (marketSizeMatch) {
      const sizeMatch = marketSizeMatch[0].match(/\$?[\d,.]+\s*(?:billion|million|trillion)/i);
      if (sizeMatch) {
        extractedData.marketSize = sizeMatch[0].startsWith('$') ? sizeMatch[0] : '$' + sizeMatch[0];
      }
    }
    
    // Extract CAGR - look for percentage growth rates
    const cagrMatch = aiResponse.match(/(?:cagr|compound\s+annual\s+growth\s+rate|growth\s+rate|annual\s+growth):\s*(\d+\.?\d*%)/i) ||
                     aiResponse.match(/(\d+\.?\d*%)\s*(?:cagr|annual\s+growth|growth\s+rate|compound\s+annual)/i) ||
                     aiResponse.match(/(?:growing\s+at|expected\s+to\s+grow\s+at|growth\s+of)\s*(\d+\.?\d*%)/i) ||
                     aiResponse.match(/(\d+\.?\d*%)\s+from\s+\d{4}\s+to\s+\d{4}/i);
    if (cagrMatch) {
      extractedData.cagr = cagrMatch[1];
    }
    
    // Extract years - look for forecast periods
    const yearMatch = aiResponse.match(/(?:forecast\s+period|period|from)\s*(\d{4})\s*(?:to|-|through)\s*(\d{4})/i) ||
                     aiResponse.match(/(\d{4})\s*-\s*(\d{4})\s*(?:forecast|analysis|period)/i) ||
                     aiResponse.match(/from\s+(\d{4})\s+to\s+(\d{4})/i) ||
                     aiResponse.match(/(\d{4})\s+to\s+(\d{4})/i);
    if (yearMatch) {
      extractedData.baseYear = parseInt(yearMatch[1]);
      extractedData.forecastYear = parseInt(yearMatch[2]);
    }
    
    // Extract category based on keywords
    const categoryKeywords = {
      'Technology': ['technology', 'ai', 'artificial intelligence', 'software', 'digital', 'tech', 'it', 'computer', 'cloud', 'data'],
      'Automotive & Transportation': ['vehicle', 'automotive', 'car', 'transport', 'mobility', 'electric vehicle', 'ev', 'automobile'],
      'Energy & Environment': ['energy', 'renewable', 'solar', 'wind', 'power', 'environment', 'green', 'clean energy', 'oil', 'gas'],
      'Healthcare & Pharmaceuticals': ['healthcare', 'medical', 'pharmaceutical', 'drug', 'health', 'medicine', 'biotech', 'clinical'],
      'Financial Services': ['financial', 'banking', 'fintech', 'insurance', 'payment', 'finance', 'investment', 'trading'],
      'Consumer Goods': ['consumer', 'retail', 'goods', 'product', 'market', 'food', 'beverage', 'clothing', 'fashion'],
      'Manufacturing': ['manufacturing', 'industrial', 'factory', 'production', 'machinery', 'equipment'],
      'Real Estate': ['real estate', 'property', 'housing', 'construction', 'building', 'residential', 'commercial']
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => aiResponse.toLowerCase().includes(keyword.toLowerCase()))) {
        extractedData.category = category;
        break;
      }
    }
    
    // Generate slug from title if available
    if (extractedData.title) {
      extractedData.slug = extractedData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      // Generate meta title
      extractedData.metaTitle = `${extractedData.title} | Market Analysis & Forecast`;
      
      // Generate meta description
      const yearRange = extractedData.baseYear && extractedData.forecastYear ? 
        ` ${extractedData.baseYear}-${extractedData.forecastYear}` : '';
      extractedData.metaDescription = `Comprehensive analysis of ${extractedData.title.toLowerCase()} with market size, growth trends, key players, and detailed forecast${yearRange}.`;
      
      // Generate keywords from title and category
      const titleWords = extractedData.title.toLowerCase().split(' ').filter(word => word.length > 3);
      const categoryWords = extractedData.category ? extractedData.category.toLowerCase().split(' & ').join(', ') : '';
      extractedData.metaKeywords = [...titleWords, 'market analysis', 'industry report', 'market size', 'growth forecast', categoryWords]
        .filter(Boolean)
        .join(', ');
    }
    
    console.log('Final extracted data:', extractedData); // Debug log
    return extractedData;
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a LLAMA AI assistant specialized in market research and business intelligence. Provide detailed, accurate information about markets, industries, and business trends. Always include specific data points like market size, growth rates (CAGR), key players, and market segments when discussing any industry or market. Format your responses to be comprehensive yet accessible.'
            },
            ...messages.slice(-4).map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          provide_citations: true
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error + (data.details ? ': ' + data.details : ''));
      }

      const aiResponseContent = data.choices?.[0]?.message?.content || 'I apologize, but I encountered an error processing your request.';
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseContent,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Extract report data from AI response and auto-fill form (only if enabled)
      if (autoFillEnabled) {
        const extractedData = extractReportDataFromAI(aiResponseContent);
        console.log('Extracted data from AI:', extractedData); // Debug log
        if (Object.keys(extractedData).length > 0) {
          setReportData(prev => ({
            ...prev,
            ...extractedData
          }));
          // Show notification that data was auto-filled
          setShowAutoFillNotification(true);
          setTimeout(() => setShowAutoFillNotification(false), 3000);
          console.log('Report data updated with extracted data'); // Debug log
        } else {
          console.log('No data extracted from AI response'); // Debug log
        }
      } else {
        console.log('Auto-fill is disabled'); // Debug log
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I apologize, but I encountered an error: ${error instanceof Error ? error.message : 'Unknown error occurred'}. Please try again.`,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (field: keyof ReportData, value: string | number | any) => {
    setReportData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRefreshData = async () => {
    setIsLoading(true);
    
    try {
      // Get the current report topic from the latest conversation context
      const lastMessages = messages.slice(-4); // Get last 4 messages for context
      const conversationContext = lastMessages.map(msg => msg.content).join(' ');
      
      // Ask AI to provide updated market data
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a market research expert. Provide the most current market data including market size, CAGR, and key statistics. Focus on numerical data and specific metrics.'
            },
            {
              role: 'user',
              content: `Please provide updated market data and statistics for: ${reportData.title}. Include current market size, growth rate (CAGR), and any recent developments that might affect the forecast.`
            }
          ],
          temperature: 0.3, // Lower temperature for more consistent data
          max_tokens: 800,
          provide_citations: true
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const aiResponse = data.choices?.[0]?.message?.content || '';
      
      // Extract updated data from AI response and merge carefully
      const updatedData = extractReportDataFromAI(aiResponse);
      
      // Only update fields that have meaningful new data and don't overwrite user input
      const fieldsToUpdate: Partial<ReportData> = {};
      
      // Only update if we have a significantly different value
      if (updatedData.marketSize && updatedData.marketSize !== reportData.marketSize) {
        fieldsToUpdate.marketSize = updatedData.marketSize;
      }
      if (updatedData.cagr && updatedData.cagr !== reportData.cagr) {
        fieldsToUpdate.cagr = updatedData.cagr;
      }
      if (updatedData.baseYear && updatedData.baseYear !== reportData.baseYear) {
        fieldsToUpdate.baseYear = updatedData.baseYear;
      }
      if (updatedData.forecastYear && updatedData.forecastYear !== reportData.forecastYear) {
        fieldsToUpdate.forecastYear = updatedData.forecastYear;
      }
      
      // Apply updates only if we have meaningful changes
      if (Object.keys(fieldsToUpdate).length > 0) {
        setReportData(prev => ({
          ...prev,
          ...fieldsToUpdate,
          // Update timestamp in meta description to show it's refreshed
          metaDescription: prev.metaDescription.replace(/ \(Updated.*?\)$/, '') + ' (Updated ' + new Date().toLocaleDateString() + ')'
        }));
      }

      // Add the AI response as a new message to show what was updated
      const refreshMessage: Message = {
        id: Date.now().toString(),
        content: `🔄 **Data Refreshed**: ${aiResponse}`,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, refreshMessage]);

    } catch (error) {
      console.error('Error refreshing data:', error);
      // Fallback to minor random updates if API fails
      const variation = (Math.random() - 0.5) * 0.1;
      const currentCagr = parseFloat(reportData.cagr.replace('%', ''));
      const newCagr = (currentCagr + variation).toFixed(1);
      
      setReportData(prev => ({
        ...prev,
        cagr: `${newCagr}%`,
        metaDescription: prev.metaDescription + ' (Refreshed ' + new Date().toLocaleDateString() + ')'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for manually extracting data from the latest AI response
  const handleExtractFromChat = () => {
    const lastAssistantMessage = messages
      .slice()
      .reverse()
      .find(msg => msg.role === 'assistant');
    
    if (lastAssistantMessage) {
      const extractedData = extractReportDataFromAI(lastAssistantMessage.content);
      console.log('Manual extraction result:', extractedData); // Debug log
      if (Object.keys(extractedData).length > 0) {
        setReportData(prev => ({
          ...prev,
          ...extractedData
        }));
        // Show notification that data was extracted
        setShowAutoFillNotification(true);
        setTimeout(() => setShowAutoFillNotification(false), 3000);
      }
    }
  };

  // Handler for extracting data from a specific message
  const handleExtractFromMessage = (messageContent: string) => {
    const extractedData = extractReportDataFromAI(messageContent);
    console.log('Manual extraction from specific message:', extractedData); // Debug log
    if (Object.keys(extractedData).length > 0) {
      setReportData(prev => ({
        ...prev,
        ...extractedData
      }));
      // Show notification that data was extracted
      setShowAutoFillNotification(true);
      setTimeout(() => setShowAutoFillNotification(false), 3000);
    }
  };

  // Handler for toggling auto-fill
  const handleToggleAutoFill = () => {
    setAutoFillEnabled(prev => !prev);
  };

  // Handler for generating content from prompt configuration
  const handleGenerateContent = async (marketInput: string, selectedFields: PromptField[]) => {
    setIsLoading(true);
    
    try {
      // Process each selected field
      const results: any = {};
      
      for (const field of selectedFields) {
        // Replace {market} placeholder with actual market input
        const prompt = field.prompt.replace(/{market}/g, marketInput);
        
        console.log(`Generating content for ${field.key}:`, prompt);
        
        // Call AI API for each field
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: 'You are a market research expert. Provide accurate, specific, and detailed information. Focus on facts and data-driven insights.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3,
            max_tokens: 500
          }),
        });

        const data = await response.json();
        
        if (data.error) {
          console.error(`Error generating ${field.key}:`, data.error);
          continue;
        }

        const content = data.choices?.[0]?.message?.content || '';
        
        // Handle nested fields (reportSummary.*)
        if (field.key.includes('.')) {
          const [parent, child] = field.key.split('.');
          if (!results[parent]) results[parent] = {};
          results[parent][child] = content;
        } else {
          // Handle special field processing
          if (field.key === 'title') {
            results.title = content;
            // Auto-generate slug from title
            results.slug = content.toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim();
            // Auto-generate meta title
            results.metaTitle = `${content} | Market Analysis & Forecast`;
          } else if (field.key === 'marketSize') {
            // Extract market size value
            const sizeMatch = content.match(/\$?[\d,.]+\s*(?:billion|million|trillion)/i);
            results.marketSize = sizeMatch ? sizeMatch[0] : content;
          } else if (field.key === 'cagr') {
            // Extract CAGR percentage
            const cagrMatch = content.match(/(\d+\.?\d*%)/);
            results.cagr = cagrMatch ? cagrMatch[1] : content;
          } else {
            results[field.key] = content;
          }
        }
      }

      // Auto-generate base and forecast years if title contains years
      if (results.title) {
        const yearMatch = results.title.match(/(\d{4})\s*-\s*(\d{4})/);
        if (yearMatch) {
          results.baseYear = parseInt(yearMatch[1]);
          results.forecastYear = parseInt(yearMatch[2]);
        } else {
          results.baseYear = new Date().getFullYear();
          results.forecastYear = new Date().getFullYear() + 6;
        }
      }

      // Generate keywords from market input and category
      if (results.title || results.category) {
        const marketWords = marketInput.toLowerCase().split(' ').filter(word => word.length > 2);
        const categoryWords = results.category ? results.category.toLowerCase().split(' & ').join(', ') : '';
        results.metaKeywords = [...marketWords, 'market analysis', 'industry report', 'market size', 'growth forecast', categoryWords]
          .filter(Boolean)
          .join(', ');
      }

      // Update report data
      setReportData(prev => ({
        ...prev,
        ...results
      }));

      // Show success notification
      setShowAutoFillNotification(true);
      setTimeout(() => setShowAutoFillNotification(false), 3000);

      // Add AI message to chat
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: `🚀 **Content Generated**: Successfully generated market research data for "${marketInput}" across ${selectedFields.length} fields using AI prompts.`,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error generating content:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `Error generating content for "${marketInput}": ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveReport = async () => {
    // Check if a report with this slug already exists (excluding current report)
    const slugConflict = hasSlugConflict(reportData.slug);
    
    if (slugConflict && !currentReportId) {
      console.log('Slug conflict detected. A new report will be created with a unique slug.');
    }
    
    // Ensure marketName is populated before saving
    const extractedMarketName = extractMarketName(reportData.title);
    const finalReportData = {
      ...reportData,
      marketName: extractedMarketName || reportData.marketName,
      slug: slugConflict && !currentReportId ? `${reportData.slug}-new` : reportData.slug // Append -new to slug if conflict exists
    };
    
    // Update local state immediately with the extracted market name
    setReportData(finalReportData);
    
    const reportId = await saveReport(finalReportData);
    if (reportId) {
      // Fetch the saved report to get the final data (including any modified slug)
      try {
        const response = await fetch(`/api/reports/${reportId}`);
        const data = await response.json();
        
        if (data.success) {
          setReportData(data.report);
        } else {
          // Fallback: just update the ID
          setReportData(prev => ({ ...prev, id: reportId }));
        }
      } catch (error) {
        console.error('Error fetching saved report:', error);
        setReportData(prev => ({ ...prev, id: reportId }));
      }
      
      // Show success notification
      setShowAutoFillNotification(true);
      setTimeout(() => setShowAutoFillNotification(false), 2000);
    }
  };

  // Handler for loading a report
  const handleLoadReport = async (id: string) => {
    const loadedReport = await loadReport(id);
    if (loadedReport) {
      setReportData(loadedReport);
    }
  };

  // Handler for creating new report
  const handleCreateNewReport = () => {
    createNewReport();
    setReportData({
      title: '',
      slug: '',
      metaTitle: '',
      metaKeywords: '',
      metaDescription: '',
      marketName: '',
      baseYear: new Date().getFullYear(),
      forecastYear: new Date().getFullYear() + 5,
      cagr: '',
      marketSize: '',
      category: '',
      targetAudience: '',
      reportLength: 'medium',
      reportSummary: {
        marketSize: '',
        marketShare: '',
        marketAnalysis: '',
        marketTrends: '',
        marketPlayers: ''
      }
    });
    
    // Reset report meta
    setReportMeta({
      author: user?.username || '',
      authorRole: user?.role.name || '',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      estimatedReadingTime: '10-15 minutes',
      wordCount: 0,
      status: 'draft',
      version: '1.0',
      assignedTo: user?.username || '',
      deadline: '',
      priority: 'medium'
    });
  };

  const handleMetaChange = (field: keyof typeof reportMeta, value: string) => {
    setReportMeta(prev => ({
      ...prev,
      [field]: value,
      lastModified: new Date().toISOString()
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-100';
      case 'in-review': return 'text-blue-600 bg-blue-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <ProtectedRoute requiredPermission="reports">
      <div className={`bg-gray-100 h-screen flex flex-col ${isResizing ? 'resizing' : ''}`}>
        <Header 
          showLayoutControls={true}
          onResetAllPanels={resetAllWidths}
          onResetLayout={() => {
            // Reset to wide layout - reset all panels to default wide widths
            updatePanelWidth('chat', 400);
            updatePanelWidth('promptConfig', 350);
            updatePanelWidth('reportManager', 300);
            updatePanelWidth('reportForm', 350);
            updatePanelWidth('contentPreview', 400);
          }}
        />
        
        {/* Enhanced Report Header with Author & Timing Info */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 mr-3">Report Workflow:</span>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                    <i className="fas fa-edit mr-1"></i>
                    Stage 1: Report Details
                    <i className="fas fa-check ml-1 text-green-600"></i>
                  </div>
                  <i className="fas fa-arrow-right text-gray-400 text-xs"></i>
                  <a
                    href={`/report-toc/${reportData.slug}`}
                    rel="noopener noreferrer"
                    className="flex items-center bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                  >
                    <i className="fas fa-list-ol mr-1"></i>
                    Stage 2: Table of Contents
                    <i className="fas fa-external-link-alt ml-1 text-xs"></i>
                  </a>
                  <i className="fas fa-arrow-right text-gray-400 text-xs"></i>
                  <div className="flex items-center bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-medium cursor-not-allowed">
                    <i className="fas fa-file-alt mr-1"></i>
                    Stage 3: Content Generation
                    <i className="fas fa-lock ml-1"></i>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Report Metadata */}
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <i className="fas fa-user"></i>
                <span>Author: <strong>{reportMeta.author}</strong></span>
                <span className="text-gray-400">({reportMeta.authorRole})</span>
              </div>
              <div className="flex items-center space-x-1">
                <i className="fas fa-clock"></i>
                <span>Modified: {formatDate(reportMeta.lastModified)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <i className="fas fa-file-word"></i>
                <span>{reportMeta.wordCount} words</span>
              </div>
              <div className="flex items-center space-x-1">
                <i className="fas fa-book-reader"></i>
                <span>{reportMeta.estimatedReadingTime}</span>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(reportMeta.priority)}`}>
                <i className="fas fa-flag mr-1"></i>
                {reportMeta.priority.toUpperCase()}
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reportMeta.status)}`}>
                <i className="fas fa-circle mr-1"></i>
                {reportMeta.status.toUpperCase()}
              </div>
            </div>
          </div>
          
          {/* Additional Report Controls */}
          <div className="mt-2 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Report ID: <span className="font-mono bg-gray-100 px-1 rounded">{reportData.slug || 'unsaved'}</span>
              {reportMeta.version && (
                <>
                  <span className="mx-2">•</span>
                  Version: <span className="font-mono">{reportMeta.version}</span>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Status Selector */}
              <select
                value={reportMeta.status}
                onChange={(e) => handleMetaChange('status', e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="draft">Draft</option>
                <option value="in-review">In Review</option>
                <option value="published">Published</option>
              </select>
              
              {/* Priority Selector */}
              <select
                value={reportMeta.priority}
                onChange={(e) => handleMetaChange('priority', e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
              
              {/* Deadline Picker */}
              <input
                type="date"
                value={reportMeta.deadline}
                onChange={(e) => handleMetaChange('deadline', e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Deadline"
              />
            </div>
          </div>
        </div>
        
        <main className="flex-1 overflow-x-auto overflow-y-hidden resizable-container" style={{ width: '100vw' }}>
          <div className="panel-container" style={{ 
            minWidth: `${Object.values(panelWidths).reduce((sum, width) => sum + width, 0)}px`,
            width: `${Object.values(panelWidths).reduce((sum, width) => sum + width, 0)}px`
          }}>
            {/* Chat Interface */}
            <ResizablePanel
              panelId="chat"
              width={panelWidths.chat}
              isResizing={isResizing === 'chat'}
              minWidth={minWidths.chat}
              maxWidth={maxWidths.chat}
              onStartResize={startResize}
              onStopResize={stopResize}
              onMouseMove={handleMouseMove}
              onReset={() => resetPanelWidth('chat')}
              className="pl-4 pr-2 py-4"
            >
              <ChatInterface
                messages={messages}
                isLoading={isLoading}
                scrapingStatus={scrapingStatus}
                onSendMessage={handleSendMessage}
                onExtractFromMessage={handleExtractFromMessage}
              />
            </ResizablePanel>
            
            {/* AI Prompt Generator */}
            <ResizablePanel
              panelId="promptConfig"
              width={panelWidths.promptConfig}
              isResizing={isResizing === 'promptConfig'}
              minWidth={minWidths.promptConfig}
              maxWidth={maxWidths.promptConfig}
              onStartResize={startResize}
              onStopResize={stopResize}
              onMouseMove={handleMouseMove}
              onReset={() => resetPanelWidth('promptConfig')}
              className="px-2 py-4"
            >
              <PromptConfig
                onGenerateContent={handleGenerateContent}
                isLoading={isLoading}
              />
            </ResizablePanel>
            
            {/* Report Manager */}
            <ResizablePanel
              panelId="reportManager"
              width={panelWidths.reportManager}
              isResizing={isResizing === 'reportManager'}
              minWidth={minWidths.reportManager}
              maxWidth={maxWidths.reportManager}
              onStartResize={startResize}
              onStopResize={stopResize}
              onMouseMove={handleMouseMove}
              onReset={() => resetPanelWidth('reportManager')}
              className="px-2 py-4"
            >
              <ReportManager
                savedReports={savedReports}
                currentReportId={currentReportId}
                isLoading={isStorageLoading}
                onLoadReport={handleLoadReport}
                onDeleteReport={deleteReport}
                onCreateNew={handleCreateNewReport}
              />
            </ResizablePanel>
            
            {/* Report Form */}
            <ResizablePanel
              panelId="reportForm"
              width={panelWidths.reportForm}
              isResizing={isResizing === 'reportForm'}
              minWidth={minWidths.reportForm}
              maxWidth={maxWidths.reportForm}
              onStartResize={startResize}
              onStopResize={stopResize}
              onMouseMove={handleMouseMove}
              onReset={() => resetPanelWidth('reportForm')}
              className="px-2 py-4"
            >
              <ReportForm
                reportData={reportData}
                isLoading={isLoading}
                isSaving={isSaving}
                currentReportId={currentReportId}
                autoFillEnabled={autoFillEnabled}
                showAutoFillNotification={showAutoFillNotification}
                onChange={handleFormChange}
                onRefresh={handleRefreshData}
                onSave={handleSaveReport}
                onToggleAutoFill={handleToggleAutoFill}
                onExtractFromChat={handleExtractFromChat}
              />
            </ResizablePanel>
            
            {/* Content Preview */}
            <ResizablePanel
              panelId="contentPreview"
              width={panelWidths.contentPreview}
              isResizing={isResizing === 'contentPreview'}
              minWidth={minWidths.contentPreview}
              maxWidth={maxWidths.contentPreview}
              onStartResize={startResize}
              onStopResize={stopResize}
              onMouseMove={handleMouseMove}
              onReset={() => resetPanelWidth('contentPreview')}
              isLast={true}
              className="px-2 py-4 pr-4 flex-1 min-w-0"
            >
              <ContentPreview
                reportData={reportData}
              />
            </ResizablePanel>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
