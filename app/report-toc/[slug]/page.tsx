'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ResizablePanel from '@/components/ResizablePanel';
import { useResizable } from '@/hooks/useResizable';
import { ReportData, ReportTableOfContents, TableOfContentsItem } from '@/types';

export default function ReportTOCPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [tocData, setTocData] = useState<ReportTableOfContents | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [rawTocContent, setRawTocContent] = useState<string>('');

  // Resizable panels setup
  const {
    panelWidths,
    isResizing,
    startResize,
    stopResize,
    handleMouseMove,
    updatePanelWidth,
    resetPanelWidth,
    resetAllWidths
  } = useResizable();

  // Override default widths for TOC page
  useEffect(() => {
    if (Object.keys(panelWidths).length > 0) {
      // Set initial widths for TOC panels if not already set
      if (!panelWidths.tocGenerator) {
        updatePanelWidth('tocGenerator', 400);
      }
      if (!panelWidths.tocEditor) {
        updatePanelWidth('tocEditor', 500);
      }
      if (!panelWidths.tocPreview) {
        updatePanelWidth('tocPreview', 400);
      }
    }
  }, [panelWidths, updatePanelWidth]);

  // Load report and TOC data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load report data
        const reportResponse = await fetch(`/api/reports/${slug}`);
        if (reportResponse.ok) {
          const result = await reportResponse.json();
          if (result.success && result.report) {
            setReportData(result.report);
          } else {
            // Fallback to direct result in case of different format
            setReportData(result);
          }
        } else {
          // If report not found, create a default report data
          const defaultReport: ReportData = {
            id: slug,
            title: `Report for ${slug}`,
            slug: slug,
            metaTitle: '',
            metaKeywords: '',
            metaDescription: '',
            marketName: slug.replace(/-/g, ' '),
            baseYear: 2024,
            forecastYear: 2030,
            cagr: '',
            marketSize: '',
            marketSizeForecast: '',
            category: 'Technology',
            targetAudience: '',
            reportLength: 'medium',
            reportSummary: {
              marketSize: '',
              marketShare: '',
              marketAnalysis: '',
              marketTrends: '',
              marketPlayers: ''
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setReportData(defaultReport);
        }
        
        // Load TOC data
        const tocResponse = await fetch(`/api/reports/${slug}/toc`);
        if (tocResponse.ok) {
          const toc = await tocResponse.json();
          setTocData(toc);
        } else {
          // Create default TOC if none exists
          const defaultTOC: ReportTableOfContents = {
            reportId: slug,
            reportSlug: slug,
            items: getDefaultTOCItems(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setTocData(defaultTOC);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      loadData();
    }
  }, [slug]);

  const getDefaultTOCItems = (): TableOfContentsItem[] => {
    return [
      // Chapter 1 - Methodology and Scope
      { id: '1', title: 'Methodology and Scope', level: 1, order: 1 },
      { id: '1.1', title: 'Market scope and definition', level: 2, order: 2, parentId: '1' },
      { id: '1.2', title: 'Research design', level: 2, order: 3, parentId: '1' },
      { id: '1.2.1', title: 'Research approach', level: 3, order: 4, parentId: '1.2' },
      { id: '1.2.2', title: 'Data collection methods', level: 3, order: 5, parentId: '1.2' },
      { id: '1.3', title: 'Data mining sources', level: 2, order: 6, parentId: '1' },
      { id: '1.3.1', title: 'Global', level: 3, order: 7, parentId: '1.3' },
      { id: '1.3.2', title: 'Regional/Country', level: 3, order: 8, parentId: '1.3' },
      { id: '1.4', title: 'Base estimates and calculations', level: 2, order: 9, parentId: '1' },
      { id: '1.4.1', title: 'Base year calculation', level: 3, order: 10, parentId: '1.4' },
      { id: '1.4.2', title: 'Key trends for market estimation', level: 3, order: 11, parentId: '1.4' },
      { id: '1.5', title: 'Primary research and validation', level: 2, order: 12, parentId: '1' },
      { id: '1.5.1', title: 'Primary sources', level: 3, order: 13, parentId: '1.5' },
      { id: '1.6', title: 'Forecast model', level: 2, order: 14, parentId: '1' },
      { id: '1.7', title: 'Research assumptions and limitations', level: 2, order: 15, parentId: '1' },

      // Chapter 2 - Executive Summary
      { id: '2', title: 'Executive Summary', level: 1, order: 16 },
      { id: '2.1', title: 'Industry 360° synopsis', level: 2, order: 17, parentId: '2' },
      { id: '2.2', title: 'Key market trends', level: 2, order: 18, parentId: '2' },
      { id: '2.2.1', title: 'Regional', level: 3, order: 19, parentId: '2.2' },
      { id: '2.2.2', title: 'Product type', level: 3, order: 20, parentId: '2.2' },
      { id: '2.2.3', title: 'Application', level: 3, order: 21, parentId: '2.2' },
      { id: '2.2.4', title: 'End use', level: 3, order: 22, parentId: '2.2' },
      { id: '2.3', title: 'CXO perspectives: Strategic imperatives', level: 2, order: 23, parentId: '2' },
      { id: '2.3.1', title: 'Key decision points for industry executives', level: 3, order: 24, parentId: '2.3' },
      { id: '2.3.2', title: 'Critical success factors for market players', level: 3, order: 25, parentId: '2.3' },
      { id: '2.4', title: 'Future outlook and strategic recommendations', level: 2, order: 26, parentId: '2' },

      // Chapter 3 - Industry Insights
      { id: '3', title: 'Industry Insights', level: 1, order: 27 },
      { id: '3.1', title: 'Industry ecosystem analysis', level: 2, order: 28, parentId: '3' },
      { id: '3.1.1', title: 'Supplier landscape', level: 3, order: 29, parentId: '3.1' },
      { id: '3.1.2', title: 'Value addition at each stage', level: 3, order: 30, parentId: '3.1' },
      { id: '3.1.3', title: 'Factors affecting the value chain', level: 3, order: 31, parentId: '3.1' },
      { id: '3.2', title: 'Industry impact forces', level: 2, order: 32, parentId: '3' },
      { id: '3.2.1', title: 'Growth drivers', level: 3, order: 33, parentId: '3.2' },
      { id: '3.2.2', title: 'Industry pitfalls and challenges', level: 3, order: 34, parentId: '3.2' },
      { id: '3.2.3', title: 'Market opportunities', level: 3, order: 35, parentId: '3.2' },
      { id: '3.3', title: 'Growth potential analysis', level: 2, order: 36, parentId: '3' },
      { id: '3.4', title: 'Pipeline analysis', level: 2, order: 37, parentId: '3' },
      { id: '3.5', title: 'Regulatory landscape', level: 2, order: 38, parentId: '3' },
      { id: '3.6', title: 'Technological advancements', level: 2, order: 39, parentId: '3' },
      { id: '3.7', title: 'Future market trends', level: 2, order: 40, parentId: '3' },
      { id: '3.8', title: 'Porter\'s analysis', level: 2, order: 41, parentId: '3' },
      { id: '3.9', title: 'PESTEL analysis', level: 2, order: 42, parentId: '3' },

      // Chapter 4 - Competitive Landscape
      { id: '4', title: 'Competitive Landscape, 2024', level: 1, order: 43 },
      { id: '4.1', title: 'Introduction', level: 2, order: 44, parentId: '4' },
      { id: '4.2', title: 'Company matrix analysis', level: 2, order: 45, parentId: '4' },
      { id: '4.3', title: 'Company market share analysis', level: 2, order: 46, parentId: '4' },
      { id: '4.4', title: 'Competitive analysis of major market players', level: 2, order: 47, parentId: '4' },
      { id: '4.5', title: 'Competitive positioning matrix', level: 2, order: 48, parentId: '4' },
      { id: '4.6', title: 'Key developments', level: 2, order: 49, parentId: '4' },
      { id: '4.6.1', title: 'Mergers and acquisitions', level: 3, order: 50, parentId: '4.6' },
      { id: '4.6.2', title: 'Partnerships and collaborations', level: 3, order: 51, parentId: '4.6' },
      { id: '4.6.3', title: 'Expansion plans', level: 3, order: 52, parentId: '4.6' },

      // Chapter 5 - Market Estimates by Product Type
      { id: '5', title: 'Market Estimates and Forecast, By Product Type, 2021 - 2034 ($ Mn)', level: 1, order: 53 },
      { id: '5.1', title: 'Key trends', level: 2, order: 54, parentId: '5' },
      { id: '5.2', title: 'Product Type A', level: 2, order: 55, parentId: '5' },
      { id: '5.3', title: 'Product Type B', level: 2, order: 56, parentId: '5' },

      // Chapter 6 - Market Estimates by Application
      { id: '6', title: 'Market Estimates and Forecast, By Application, 2021 - 2034 ($ Mn)', level: 1, order: 57 },
      { id: '6.1', title: 'Key trends', level: 2, order: 58, parentId: '6' },
      { id: '6.2', title: 'Application A', level: 2, order: 59, parentId: '6' },
      { id: '6.3', title: 'Application B', level: 2, order: 60, parentId: '6' },

      // Chapter 7 - Market Estimates by End Use
      { id: '7', title: 'Market Estimates and Forecast, By End Use, 2021 - 2034 ($ Mn)', level: 1, order: 61 },
      { id: '7.1', title: 'Key trends', level: 2, order: 62, parentId: '7' },
      { id: '7.2', title: 'End Use A', level: 2, order: 63, parentId: '7' },
      { id: '7.3', title: 'End Use B', level: 2, order: 64, parentId: '7' },

      // Chapter 8 - Market Estimates by Region
      { id: '8', title: 'Market Estimates and Forecast, By Region, 2021 - 2034 ($ Mn)', level: 1, order: 65 },
      { id: '8.1', title: 'Key trends', level: 2, order: 66, parentId: '8' },
      { id: '8.2', title: 'North America', level: 2, order: 67, parentId: '8' },
      { id: '8.2.1', title: 'U.S.', level: 3, order: 68, parentId: '8.2' },
      { id: '8.2.2', title: 'Canada', level: 3, order: 69, parentId: '8.2' },
      { id: '8.3', title: 'Europe', level: 2, order: 70, parentId: '8' },
      { id: '8.3.1', title: 'Germany', level: 3, order: 71, parentId: '8.3' },
      { id: '8.3.2', title: 'UK', level: 3, order: 72, parentId: '8.3' },
      { id: '8.3.3', title: 'France', level: 3, order: 73, parentId: '8.3' },
      { id: '8.3.4', title: 'Spain', level: 3, order: 74, parentId: '8.3' },
      { id: '8.3.5', title: 'Italy', level: 3, order: 75, parentId: '8.3' },
      { id: '8.3.6', title: 'Netherlands', level: 3, order: 76, parentId: '8.3' },
      { id: '8.4', title: 'Asia Pacific', level: 2, order: 77, parentId: '8' },
      { id: '8.4.1', title: 'China', level: 3, order: 78, parentId: '8.4' },
      { id: '8.4.2', title: 'Japan', level: 3, order: 79, parentId: '8.4' },
      { id: '8.4.3', title: 'India', level: 3, order: 80, parentId: '8.4' },
      { id: '8.4.4', title: 'Australia', level: 3, order: 81, parentId: '8.4' },
      { id: '8.4.5', title: 'South Korea', level: 3, order: 82, parentId: '8.4' },
      { id: '8.5', title: 'Latin America', level: 2, order: 83, parentId: '8' },
      { id: '8.5.1', title: 'Brazil', level: 3, order: 84, parentId: '8.5' },
      { id: '8.5.2', title: 'Mexico', level: 3, order: 85, parentId: '8.5' },
      { id: '8.5.3', title: 'Argentina', level: 3, order: 86, parentId: '8.5' },
      { id: '8.6', title: 'Middle East and Africa', level: 2, order: 87, parentId: '8' },
      { id: '8.6.1', title: 'South Africa', level: 3, order: 88, parentId: '8.6' },
      { id: '8.6.2', title: 'Saudi Arabia', level: 3, order: 89, parentId: '8.6' },
      { id: '8.6.3', title: 'UAE', level: 3, order: 90, parentId: '8.6' },

      // Chapter 9 - Company Profiles
      { id: '9', title: 'Company Profiles', level: 1, order: 91 },
      { id: '9.1', title: 'Company A', level: 2, order: 92, parentId: '9' },
      { id: '9.2', title: 'Company B', level: 2, order: 93, parentId: '9' },
      { id: '9.3', title: 'Company C', level: 2, order: 94, parentId: '9' },
      { id: '9.4', title: 'Company D', level: 2, order: 95, parentId: '9' },
      { id: '9.5', title: 'Company E', level: 2, order: 96, parentId: '9' }
    ];
  };

  // AI TOC Generation
  const handleGenerateTOC = async () => {
    if (!reportData?.marketName) {
      alert('Market name is required to generate TOC');
      return;
    }

    try {
      setIsGenerating(true);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a professional market research report writer. Generate a comprehensive table of contents for a market research report. Format each line as: Chapter/Section Number | Title | Level (1, 2, or 3). Use the format exactly like: "1|Methodology and Scope|1" or "1.1|Market scope and definition|2"'
            },
            {
              role: 'user',
              content: `Generate a detailed table of contents for a market research report on "${reportData.marketName}". Include chapters on methodology, executive summary, industry insights, competitive landscape, market estimates by different segments (product type, application, region), and company profiles. Make it comprehensive with proper numbering and hierarchy.`
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const aiResponse = data.choices?.[0]?.message?.content || '';
      setRawTocContent(aiResponse);
    } catch (error) {
      console.error('Error generating TOC:', error);
      alert('Failed to generate TOC: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Parse raw TOC content into structured data
  const handleParseTOC = () => {
    if (!rawTocContent.trim()) {
      alert('Please generate TOC content first');
      return;
    }

    try {
      const lines = rawTocContent.split('\n').filter(line => line.trim());
      const newItems: TableOfContentsItem[] = [];
      let order = 1;

      for (const line of lines) {
        const parts = line.split('|').map(part => part.trim());
        if (parts.length >= 3) {
          const id = parts[0];
          const title = parts[1];
          const level = parseInt(parts[2]);
          
          if (id && title && level >= 1 && level <= 3) {
            // Determine parent ID for levels 2 and 3
            let parentId: string | undefined;
            if (level === 2) {
              const parentNumber = id.split('.')[0];
              parentId = parentNumber;
            } else if (level === 3) {
              const parentParts = id.split('.');
              if (parentParts.length >= 2) {
                parentId = `${parentParts[0]}.${parentParts[1]}`;
              }
            }

            newItems.push({
              id,
              title,
              level,
              order: order++,
              parentId
            });
          }
        }
      }

      if (newItems.length > 0 && tocData) {
        setTocData({
          ...tocData,
          items: newItems,
          updatedAt: new Date().toISOString()
        });
        alert(`Successfully parsed ${newItems.length} TOC items!`);
      } else {
        alert('No valid TOC items found. Please check the format.');
      }
    } catch (error) {
      console.error('Error parsing TOC:', error);
      alert('Failed to parse TOC content');
    }
  };

  const handleSaveTOC = async () => {
    if (!tocData) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/reports/${slug}/toc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...tocData,
          updatedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save table of contents');
      }

      // Refresh data
      const updated = await response.json();
      setTocData(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const addTOCItem = () => {
    if (!tocData) return;

    const newId = (tocData.items.length + 1).toString();
    const newItem: TableOfContentsItem = {
      id: newId,
      title: 'New Section',
      level: 1,
      order: tocData.items.length + 1
    };

    setTocData({
      ...tocData,
      items: [...tocData.items, newItem]
    });
  };

  const updateTOCItem = (id: string, updates: Partial<TableOfContentsItem>) => {
    if (!tocData) return;

    setTocData({
      ...tocData,
      items: tocData.items.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    });
  };

  const deleteTOCItem = (id: string) => {
    if (!tocData) return;

    setTocData({
      ...tocData,
      items: tocData.items.filter(item => item.id !== id && item.parentId !== id)
    });
  };

  const moveTOCItem = (id: string, direction: 'up' | 'down') => {
    if (!tocData) return;

    const items = [...tocData.items];
    const index = items.findIndex(item => item.id === id);
    
    if (direction === 'up' && index > 0) {
      [items[index], items[index - 1]] = [items[index - 1], items[index]];
    } else if (direction === 'down' && index < items.length - 1) {
      [items[index], items[index + 1]] = [items[index + 1], items[index]];
    }

    // Update order numbers
    items.forEach((item, idx) => {
      item.order = idx + 1;
    });

    setTocData({
      ...tocData,
      items
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-100">
        <Header />
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading report data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-100">
        <Header />
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <i className="fas fa-exclamation-triangle text-4xl"></i>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/report-titles')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Back to Reports
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-100 h-screen flex flex-col ${isResizing ? 'resizing' : ''}`}>
      <Header 
        showLayoutControls={true}
        onResetAllPanels={resetAllWidths}
        onResetLayout={() => {
          // Reset to wide layout for TOC panels
          updatePanelWidth('tocGenerator', 450);
          updatePanelWidth('tocEditor', 550);
          updatePanelWidth('tocPreview', 450);
        }}
      />
      
      {/* Stage Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 mr-3">Report Workflow:</span>
              <div className="flex items-center space-x-2">
                <a
                  href="/"
                  className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                >
                  <i className="fas fa-edit mr-1"></i>
                  Stage 1: Report Details
                </a>
                <i className="fas fa-arrow-right text-gray-400 text-xs"></i>
                <div className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                  <i className="fas fa-list-ol mr-1"></i>
                  Stage 2: Table of Contents
                  <i className="fas fa-check ml-1 text-green-600"></i>
                </div>
                <i className="fas fa-arrow-right text-gray-400 text-xs"></i>
                <div className="flex items-center bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-medium cursor-not-allowed">
                  <i className="fas fa-file-alt mr-1"></i>
                  Stage 3: Content Generation
                  <i className="fas fa-lock ml-1"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Report: <span className="font-mono bg-gray-100 px-1 rounded">{reportData?.title || slug}</span>
          </div>
        </div>
      </div>
      
      <main className="flex-1 overflow-x-auto overflow-y-hidden resizable-container" style={{ width: '100vw' }}>
        <div className="h-full flex">
          {/* TOC AI Generator */}
          <ResizablePanel
            panelId="tocGenerator"
            width={panelWidths.tocGenerator || 400}
            isResizing={isResizing === 'tocGenerator'}
            minWidth={300}
            maxWidth={600}
            onStartResize={startResize}
            onStopResize={stopResize}
            onMouseMove={handleMouseMove}
            onReset={() => resetPanelWidth('tocGenerator')}
            className="px-2 py-4"
          >
            <TOCGenerator
              reportData={reportData}
              rawTocContent={rawTocContent}
              setRawTocContent={setRawTocContent}
              isGenerating={isGenerating}
              onGenerateTOC={handleGenerateTOC}
              onParseTOC={handleParseTOC}
            />
          </ResizablePanel>
          
          {/* TOC Editor */}
          <ResizablePanel
            panelId="tocEditor"
            width={panelWidths.tocEditor || 500}
            isResizing={isResizing === 'tocEditor'}
            minWidth={400}
            maxWidth={800}
            onStartResize={startResize}
            onStopResize={stopResize}
            onMouseMove={handleMouseMove}
            onReset={() => resetPanelWidth('tocEditor')}
            className="px-2 py-4"
          >
            <TOCEditor
              tocData={tocData}
              isSaving={isSaving}
              onAddItem={addTOCItem}
              onUpdateItem={updateTOCItem}
              onDeleteItem={deleteTOCItem}
              onMoveItem={moveTOCItem}
              onSave={handleSaveTOC}
            />
          </ResizablePanel>
          
          {/* TOC Preview */}
          <ResizablePanel
            panelId="tocPreview"
            width={panelWidths.tocPreview || 400}
            isResizing={isResizing === 'tocPreview'}
            minWidth={300}
            maxWidth={800}
            onStartResize={startResize}
            onStopResize={stopResize}
            onMouseMove={handleMouseMove}
            onReset={() => resetPanelWidth('tocPreview')}
            isLast={true}
            className="px-2 py-4 pr-4 flex-1 min-w-0"
          >
            <TOCPreview
              tocData={tocData}
              reportData={reportData}
            />
          </ResizablePanel>
        </div>
      </main>
    </div>
  );
}

// TOC Editor Component
interface TOCEditorProps {
  tocData: ReportTableOfContents | null;
  isSaving: boolean;
  onAddItem: () => void;
  onUpdateItem: (id: string, updates: Partial<TableOfContentsItem>) => void;
  onDeleteItem: (id: string) => void;
  onMoveItem: (id: string, direction: 'up' | 'down') => void;
  onSave: () => void;
}

function TOCEditor({ 
  tocData, 
  isSaving, 
  onAddItem, 
  onUpdateItem, 
  onDeleteItem, 
  onMoveItem, 
  onSave 
}: TOCEditorProps) {
  if (!tocData) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
      <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center">
            <i className="fas fa-edit mr-2 text-xs"></i>
            TOC Editor ({tocData.items.length} items)
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onAddItem}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded text-xs transition-colors"
              title="Add new section"
            >
              <i className="fas fa-plus mr-1"></i>
              Add
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 px-2 py-1 rounded text-xs transition-colors flex items-center"
              title="Save TOC"
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
        <div className="space-y-2">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-2 items-center text-xs font-medium text-gray-700 pb-2 border-b">
            <div className="col-span-1">ID</div>
            <div className="col-span-5">Title</div>
            <div className="col-span-2">Level</div>
            <div className="col-span-2">Page #</div>
            <div className="col-span-1">Order</div>
            <div className="col-span-1">Actions</div>
          </div>

          {/* TOC Items */}
          {tocData.items.map((item, index) => (
            <div
              key={item.id}
              className={`grid grid-cols-12 gap-2 items-center p-2 bg-white rounded border hover:bg-gray-50 transition-colors ${
                item.level === 2 ? 'border-l-4 border-l-blue-200 bg-blue-50' : 
                item.level === 3 ? 'border-l-4 border-l-green-200 bg-green-50' : 
                'border-gray-200'
              }`}
            >
              <div className="col-span-1">
                <input
                  type="text"
                  value={item.id}
                  onChange={(e) => onUpdateItem(item.id, { id: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded px-1 py-1"
                  placeholder="ID"
                />
              </div>
              
              <div className="col-span-5">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => onUpdateItem(item.id, { title: e.target.value })}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                  placeholder="Section title"
                />
              </div>
              
              <div className="col-span-2">
                <select
                  value={item.level}
                  onChange={(e) => onUpdateItem(item.id, { level: parseInt(e.target.value) })}
                  className="w-full text-xs border border-gray-300 rounded px-1 py-1"
                >
                  <option value={1}>Level 1</option>
                  <option value={2}>Level 2</option>
                  <option value={3}>Level 3</option>
                </select>
              </div>
              
              <div className="col-span-2">
                <input
                  type="number"
                  value={item.pageNumber || ''}
                  onChange={(e) => onUpdateItem(item.id, { 
                    pageNumber: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  className="w-full text-xs border border-gray-300 rounded px-1 py-1"
                  placeholder="Page"
                />
              </div>
              
              <div className="col-span-1">
                <span className="text-xs text-gray-500">#{item.order}</span>
              </div>

              <div className="col-span-1">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onMoveItem(item.id, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 text-xs"
                    title="Move up"
                  >
                    <i className="fas fa-chevron-up"></i>
                  </button>
                  <button
                    onClick={() => onMoveItem(item.id, 'down')}
                    disabled={index === tocData.items.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 text-xs"
                    title="Move down"
                  >
                    <i className="fas fa-chevron-down"></i>
                  </button>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1 text-red-400 hover:text-red-600 text-xs"
                    title="Delete"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {tocData.items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-list-ol text-2xl mb-2"></i>
              <p className="text-sm">No TOC items yet</p>
              <p className="text-xs">Generate content with AI or add manually</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// TOC Preview Component
interface TOCPreviewProps {
  tocData: ReportTableOfContents | null;
  reportData: ReportData | null;
}

function TOCPreview({ tocData, reportData }: TOCPreviewProps) {
  if (!tocData || !reportData) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white p-3 flex-shrink-0">
          <h2 className="text-sm font-semibold flex items-center">
            <i className="fas fa-eye mr-2 text-xs"></i>
            TOC Preview
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <i className="fas fa-file-alt text-3xl mb-2"></i>
            <p>No data to preview</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
      <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white p-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center">
            <i className="fas fa-eye mr-2 text-xs"></i>
            TOC Preview
          </h2>
          <div className="text-xs opacity-80">
            {tocData.items.length} sections
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 min-h-0">
        <div className="max-w-full">
          {/* Report Header */}
          <div className="text-center mb-6 pb-4 border-b border-gray-200">
            <h1 className="text-lg font-bold text-gray-800 mb-1">
              {reportData.title}
            </h1>
            {reportData.metaDescription && (
              <p className="text-xs text-gray-600 mb-2">{reportData.metaDescription}</p>
            )}
            <div className="flex justify-center space-x-4 text-xs text-gray-500">
              <span>Base: {reportData.baseYear}</span>
              <span>Forecast: {reportData.forecastYear}</span>
              {reportData.cagr && <span>CAGR: {reportData.cagr}</span>}
              {reportData.marketSize && <span>Size: {reportData.marketSize}</span>}
            </div>
          </div>

          {/* Table of Contents */}
          <div className="mb-6">
            <h2 className="text-base font-bold text-gray-800 mb-4 text-center">
              Table of Contents
            </h2>
            
            <div className="space-y-1">
              {tocData.items.map((item) => (
                <div
                  key={item.id}
                  className={`flex justify-between items-center py-1 ${
                    item.level === 1 
                      ? 'font-semibold text-gray-800 text-sm' 
                      : item.level === 2
                      ? 'ml-4 text-gray-700 text-sm'
                      : 'ml-8 text-gray-600 text-sm'
                  }`}
                >
                  <div className="flex items-start">
                    <span className="mr-2 text-gray-500 text-xs min-w-fit">
                      {item.id}
                    </span>
                    <span className="flex-1">{item.title}</span>
                  </div>
                  
                  <div className="flex-1 mx-2 border-b border-dotted border-gray-300 min-w-0"></div>
                  
                  <span className="text-xs text-gray-500 min-w-fit">
                    {item.pageNumber || '—'}
                  </span>
                </div>
              ))}
            </div>

            {tocData.items.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <i className="fas fa-list-ol text-2xl mb-2"></i>
                <p className="text-sm">No TOC items to preview</p>
                <p className="text-xs">Add items in the editor to see preview</p>
              </div>
            )}
          </div>

          {/* Report Info Footer */}
          <div className="pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>Generated on {new Date().toLocaleDateString()}</p>
            <p className="mt-1">
              Category: {reportData.category} | 
              Target: {reportData.targetAudience} | 
              Length: {reportData.reportLength}
            </p>
            {reportData.marketSizeForecast && (
              <p className="mt-1">Forecast Size: {reportData.marketSizeForecast}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// TOC Generator Component
interface TOCGeneratorProps {
  reportData: ReportData | null;
  rawTocContent: string;
  setRawTocContent: (content: string) => void;
  isGenerating: boolean;
  onGenerateTOC: () => void;
  onParseTOC: () => void;
}

function TOCGenerator({ 
  reportData, 
  rawTocContent, 
  setRawTocContent, 
  isGenerating, 
  onGenerateTOC, 
  onParseTOC 
}: TOCGeneratorProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center">
            <i className="fas fa-magic mr-2 text-xs"></i>
            AI TOC Generator
          </h2>
          <button
            onClick={onGenerateTOC}
            disabled={isGenerating || !reportData?.marketName}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 px-2 py-1 rounded text-xs transition-colors flex items-center"
            title="Generate TOC with AI"
          >
            {isGenerating ? (
              <>
                <i className="fas fa-spinner fa-spin mr-1"></i>
                Generating...
              </>
            ) : (
              <>
                <i className="fas fa-magic mr-1"></i>
                Generate
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        <div className="space-y-3">
          {/* Market Info */}
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
              <i className="fas fa-info-circle mr-1 text-purple-500"></i>Market Information
            </h3>
            <div className="text-xs text-gray-600">
              <p><strong>Market:</strong> {reportData?.marketName || 'Not specified'}</p>
              <p><strong>Title:</strong> {reportData?.title || 'Not specified'}</p>
              <p><strong>Category:</strong> {reportData?.category || 'Not specified'}</p>
              <p><strong>Years:</strong> {reportData?.baseYear || '2024'} - {reportData?.forecastYear || '2030'}</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
              <i className="fas fa-lightbulb mr-1 text-blue-500"></i>Instructions
            </h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>1. Click "Generate" to create AI TOC content</p>
              <p>2. Review and edit the raw content below</p>
              <p>3. Click "Parse & Apply" to convert to structured TOC</p>
              <p>4. Format: "ID|Title|Level" (e.g., "1.1|Market Overview|2")</p>
            </div>
          </div>

          {/* Raw TOC Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700">
                Raw TOC Content
              </label>
              <button
                onClick={onParseTOC}
                disabled={!rawTocContent.trim()}
                className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-2 py-1 rounded text-xs transition-colors"
              >
                <i className="fas fa-cogs mr-1"></i>
                Parse & Apply
              </button>
            </div>
            
            <textarea
              value={rawTocContent}
              onChange={(e) => setRawTocContent(e.target.value)}
              placeholder="Generated TOC content will appear here...

Format each line as:
1|Methodology and Scope|1
1.1|Market scope and definition|2
1.2|Research design|2
1.2.1|Research approach|3
1.2.2|Data collection methods|3
2|Executive Summary|1
2.1|Industry 360° synopsis|2"
              rows={15}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
            />
          </div>

          {/* Sample Format */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">Sample Format:</h3>
            <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
{`1|Methodology and Scope|1
1.1|Market scope and definition|2
1.2|Research design|2
1.2.1|Research approach|3
1.2.2|Data collection methods|3
2|Executive Summary|1
2.1|Industry 360° synopsis|2`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
