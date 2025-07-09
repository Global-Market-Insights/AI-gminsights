'use client';

import { useState } from 'react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  scrapingStatus: Record<string, string>;
  onSendMessage: (message: string) => void;
  onExtractFromMessage: (messageContent: string) => void;
}

export default function ChatInterface({ 
  messages, 
  isLoading, 
  scrapingStatus, 
  onSendMessage,
  onExtractFromMessage
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleQuickAction = (action: string) => {
    const quickActions: Record<string, string> = {
      'Research Market': 'Research the current market size, key players, and growth trends for this industry',
      'Get Trends': 'Analyze the latest industry trends, emerging technologies, and market disruptions',
      'Generate Report': 'Create a comprehensive market analysis report with executive summary and recommendations'
    };
    
    if (quickActions[action]) {
      onSendMessage(quickActions[action]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'text-green-500';
      case 'in-progress': return 'text-yellow-500';
      case 'pending': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return 'fas fa-check';
      case 'in-progress': return 'fas fa-spinner fa-spin';
      case 'pending': return 'fas fa-clock';
      default: return 'fas fa-clock';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 flex-shrink-0">
        <h2 className="text-sm font-semibold flex items-center">
          <i className="fas fa-comments mr-2 text-xs"></i>
          LLAMA Chat & Web Scraping
        </h2>
      </div>
      
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 min-h-0">{/* ...existing code... */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-2 chat-message ${
              message.role === 'user' ? 'justify-end' : ''
            }`}
          >
            {message.role === 'assistant' && (
              <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                AI
              </div>
            )}
            <div
              className={`rounded-lg p-2 max-w-xs ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-xs">{message.content}</p>
              {message.role === 'assistant' && isLoading && message.id === messages[messages.length - 1]?.id && (
                <div className="mt-1 text-xs text-gray-500">
                  <i className="fas fa-spinner fa-spin mr-1"></i>Thinking...
                </div>
              )}
              {message.role === 'assistant' && !isLoading && (
                <div className="mt-2 pt-1 border-t border-gray-200">
                  <button
                    onClick={() => onExtractFromMessage(message.content)}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs transition-colors flex items-center"
                    title="Extract data from this response to populate report fields"
                  >
                    <i className="fas fa-download mr-1"></i>
                    Extract Data
                  </button>
                </div>
              )}
            </div>
            {message.role === 'user' && (
              <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                U
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start space-x-2">
            <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              AI
            </div>
            <div className="bg-gray-100 rounded-lg p-2 max-w-xs">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Web Scraping Status */}
      <div className="border-t bg-gray-50 p-3 flex-shrink-0">
        <h3 className="text-xs font-semibold text-gray-700 mb-2">
          <i className="fas fa-globe mr-1"></i>Web Scraping Status
        </h3>
        <div className="space-y-1">
          {Object.entries(scrapingStatus).map(([source, status]) => (
            <div key={source} className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{source}</span>
              <span className={getStatusColor(status)}>
                <i className={getStatusIcon(status)}></i> {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Chat Input */}
      <div className="border-t p-3 flex-shrink-0">{/* ...existing code... */}
        <form onSubmit={handleSubmit} className="flex space-x-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask LLAMA to research..."
            disabled={isLoading}
            className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
          >
            <i className="fas fa-paper-plane text-xs"></i>
          </button>
        </form>
        <div className="flex space-x-1 mt-1">
          {['Research Market', 'Get Trends', 'Generate Report'].map((action) => (
            <button
              key={action}
              onClick={() => handleQuickAction(action)}
              disabled={isLoading}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded-full text-xs transition-colors disabled:opacity-50"
            >
              <i className={`fas ${action.includes('Research') ? 'fa-search' : action.includes('Trends') ? 'fa-chart-line' : 'fa-file-alt'} mr-1`}></i>
              {action.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
