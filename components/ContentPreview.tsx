'use client';

interface ReportData {
  title: string;
  slug: string;
  metaTitle: string;
  metaKeywords: string;
  metaDescription: string;
  marketName: string;
  baseYear: number;
  forecastYear: number;
  cagr: string;
  marketSize: string;
  category: string;
  targetAudience: string;
  reportLength: string;
  reportSummary?: {
    marketSize?: string;
    marketShare?: string;
    marketAnalysis?: string;
    marketTrends?: string;
    marketPlayers?: string;
  };
}

interface ContentPreviewProps {
  reportData: ReportData;
}

export default function ContentPreview({ reportData }: ContentPreviewProps) {
  const handleExportHTML = () => {
    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportData.title}</title>
          <meta name="description" content="${reportData.metaDescription}">
          <meta name="keywords" content="${reportData.metaKeywords}">
        </head>
        <body>
          <h1>${reportData.title}</h1>
          <p>${reportData.metaDescription}</p>
        </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.slug}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGeneratePDF = () => {
    // Placeholder for PDF generation
    alert('PDF generation feature will be implemented with a PDF library like jsPDF');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: reportData.title,
        text: reportData.metaDescription,
        url: window.location.href,
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
      <div className="preview-bg text-white p-3 flex-shrink-0">
        <h2 className="text-sm font-semibold flex items-center">
          <i className="fas fa-eye mr-2 text-xs"></i>
          Content Preview
          <span className="ml-auto text-xs bg-white bg-opacity-20 px-2 py-1 rounded">Live Preview</span>
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">{/* ...existing code... */}
        {/* Preview Content */}
        <div className="p-4 bg-white">
          <div className="border-b pb-3 mb-4">
            <h1 className="text-lg font-bold text-gray-800 mb-2">
              {reportData.title || 'Untitled Report'}
            </h1>
            {reportData.marketName && (
              <div className="bg-purple-50 px-2 py-1 rounded mb-2 inline-block">
                <span className="text-xs text-purple-700">
                  <i className="fas fa-search mr-1"></i>Market Focus: {reportData.marketName}
                </span>
              </div>
            )}
            <div className="flex items-center space-x-3 text-xs text-gray-600 flex-wrap">
              <span><i className="fas fa-calendar mr-1"></i>Published: {new Date().toLocaleDateString()}</span>
              {reportData.cagr && (
                <span><i className="fas fa-chart-line mr-1"></i>CAGR: {reportData.cagr}</span>
              )}
              {reportData.marketSize && (
                <span><i className="fas fa-dollar-sign mr-1"></i>Market Size: {reportData.marketSize}</span>
              )}
              {reportData.category && (
                <span><i className="fas fa-tag mr-1"></i>Category: {reportData.category}</span>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Executive Summary */}
            <section>
              <h2 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                <i className="fas fa-star mr-1 text-yellow-500 text-xs"></i>
                Executive Summary
              </h2>
              <div className="bg-gray-50 p-3 rounded-lg">
                {reportData.metaDescription ? (
                  <>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {reportData.metaDescription}
                    </p>
                    <div className="mt-2 text-xs text-green-600">
                      <i className="fas fa-robot mr-1"></i>AI-generated content based on latest market data
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-500 italic">
                    No summary available. Start chatting with LLAMA to generate content.
                  </p>
                )}
              </div>
            </section>
            
            {/* Market Overview */}
            <section>
              <h2 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                <i className="fas fa-chart-pie mr-1 text-blue-500 text-xs"></i>
                Market Overview
              </h2>
              {(reportData.marketSize || reportData.cagr) ? (
                <div className="grid grid-cols-2 gap-3">
                  {reportData.marketSize && (
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <h4 className="text-xs font-semibold text-blue-800">Market Size {reportData.baseYear}</h4>
                      <p className="text-lg font-bold text-blue-600">{reportData.marketSize}</p>
                    </div>
                  )}
                  {reportData.cagr && (
                    <div className="bg-green-50 p-2 rounded-lg">
                      <h4 className="text-xs font-semibold text-green-800">Growth Rate</h4>
                      <p className="text-lg font-bold text-green-600">{reportData.cagr}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 italic">
                    Market data will appear here once populated through the report form or AI chat.
                  </p>
                </div>
              )}
            </section>

            {/* Detailed Report Summary */}
            {reportData.reportSummary && (
              <>
                {reportData.reportSummary.marketSize && (
                  <section>
                    <h2 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                      <i className="fas fa-chart-bar mr-1 text-blue-500 text-xs"></i>
                      Market Size Analysis
                    </h2>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {reportData.reportSummary.marketSize}
                      </p>
                    </div>
                  </section>
                )}

                {reportData.reportSummary.marketShare && (
                  <section>
                    <h2 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                      <i className="fas fa-pie-chart mr-1 text-green-500 text-xs"></i>
                      Market Share
                    </h2>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {reportData.reportSummary.marketShare}
                      </p>
                    </div>
                  </section>
                )}

                {reportData.reportSummary.marketAnalysis && (
                  <section>
                    <h2 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                      <i className="fas fa-chart-line mr-1 text-purple-500 text-xs"></i>
                      Market Analysis
                    </h2>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {reportData.reportSummary.marketAnalysis}
                      </p>
                    </div>
                  </section>
                )}

                {reportData.reportSummary.marketTrends && (
                  <section>
                    <h2 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                      <i className="fas fa-trending-up mr-1 text-orange-500 text-xs"></i>
                      Market Trends
                    </h2>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {reportData.reportSummary.marketTrends}
                      </p>
                    </div>
                  </section>
                )}

                {reportData.reportSummary.marketPlayers && (
                  <section>
                    <h2 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                      <i className="fas fa-building mr-1 text-red-500 text-xs"></i>
                      Key Market Players
                    </h2>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {reportData.reportSummary.marketPlayers}
                      </p>
                    </div>
                  </section>
                )}
              </>
            )}
            
            {/* Report Details - Dynamic Content Only */}
            {reportData.category && (
              <section>
                <h2 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <i className="fas fa-tag mr-1 text-purple-500 text-xs"></i>
                  Category
                </h2>
                <div className="bg-purple-50 p-2 rounded-lg">
                  <p className="text-xs font-medium text-purple-800">{reportData.category}</p>
                </div>
              </section>
            )}
            
            {reportData.targetAudience && (
              <section>
                <h2 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <i className="fas fa-users mr-1 text-indigo-500 text-xs"></i>
                  Target Audience
                </h2>
                <div className="bg-indigo-50 p-2 rounded-lg">
                  <p className="text-xs font-medium text-indigo-800">{reportData.targetAudience}</p>
                </div>
              </section>
            )}

            {(reportData.baseYear && reportData.forecastYear) && (
              <section>
                <h2 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <i className="fas fa-calendar-alt mr-1 text-orange-500 text-xs"></i>
                  Forecast Period
                </h2>
                <div className="bg-orange-50 p-2 rounded-lg">
                  <p className="text-xs font-medium text-orange-800">
                    {reportData.baseYear} - {reportData.forecastYear} ({reportData.forecastYear - reportData.baseYear} years)
                  </p>
                </div>
              </section>
            )}

            {reportData.reportLength && (
              <section>
                <h2 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <i className="fas fa-file-alt mr-1 text-teal-500 text-xs"></i>
                  Report Length
                </h2>
                <div className="bg-teal-50 p-2 rounded-lg">
                  <p className="text-xs font-medium text-teal-800 capitalize">{reportData.reportLength}</p>
                </div>
              </section>
            )}
          </div>
          
          {/* Update Status */}
          <div className="mt-4 p-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-gray-800">Dynamic Preview</h4>
                <p className="text-xs text-gray-600">Content automatically updates based on report data</p>
              </div>
              <div className="text-green-500">
                <i className="fas fa-sync-alt"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Preview Actions */}
      <div className="border-t p-3 bg-gray-50 flex-shrink-0">{/* ...existing code... */}
        <div className="flex space-x-2">
          <button
            onClick={handleExportHTML}
            className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white py-1 px-2 rounded-lg text-xs transition-all"
          >
            <i className="fas fa-download mr-1"></i>Export HTML
          </button>
          <button
            onClick={handleGeneratePDF}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white py-1 px-2 rounded-lg text-xs transition-all"
          >
            <i className="fas fa-file-pdf mr-1"></i>Generate PDF
          </button>
        </div>
        <div className="mt-2 flex space-x-1">
          <button
            onClick={handleShare}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded text-xs transition-colors"
          >
            <i className="fas fa-share mr-1"></i>Share
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded text-xs transition-colors"
          >
            <i className="fas fa-print mr-1"></i>Print
          </button>
        </div>
      </div>
    </div>
  );
}
