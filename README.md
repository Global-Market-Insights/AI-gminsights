# LLAMA Report Writer - Next.js App

A Next.js application for AI-powered report generation using LLAMA AI with web scraping capabilities.

## Features

- 🤖 **LLAMA AI Integration**: Direct chat interface with LLAMA AI for intelligent report generation
- 📊 **Auto-filled Forms**: Smart form fields that populate automatically based on AI analysis
- 📱 **Real-time Preview**: Live preview of generated report content
- 🌐 **Web Scraping Simulation**: Visual status of data collection from various sources
- 📄 **Export Options**: Export reports as HTML or PDF
- 💬 **Interactive Chat**: Natural language interaction with AI assistant

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd app-nexjs
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.local` and configure your LLAMA API settings
   - The default API endpoint is already configured

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app-nexjs/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # LLAMA AI API integration
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page component
├── components/
│   ├── ChatInterface.tsx         # Chat with LLAMA AI
│   ├── ContentPreview.tsx        # Report preview component
│   ├── Header.tsx                # Application header
│   └── ReportForm.tsx            # Auto-filled form fields
├── package.json
├── tailwind.config.js
└── next.config.js
```

## Components

### 1. **ChatInterface**
- Interactive chat with LLAMA AI
- Web scraping status display
- Quick action buttons for common tasks
- Real-time message handling

### 2. **ReportForm** 
- Auto-populated form fields
- SEO metadata inputs
- Market analysis data
- AI-powered data refresh

### 3. **ContentPreview**
- Live report preview
- Professional formatting
- Export functionality
- Real-time updates

## LLAMA API Integration

The application integrates with LLAMA AI using the following endpoint:
```
POST https://irhvspnum5fwv533ke4334mw.agents.do-ai.run/api/v1/chat/completions
```

### API Request Format
```json
{
  "messages": [],
  "temperature": 0.7,
  "max_tokens": 1000,
  "provide_citations": true
}
```

## Usage

1. **Start a Conversation**: Type your report requirements in the chat
2. **Watch Auto-fill**: Form fields populate automatically based on AI analysis
3. **Monitor Progress**: Web scraping status shows data collection progress
4. **Preview Content**: Real-time preview updates as AI processes information
5. **Export Report**: Generate HTML or PDF versions of your report

## Technologies Used

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **LLAMA AI**: Advanced language model integration
- **React Hooks**: State management and effects

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. **New Components**: Add to `/components` directory
2. **API Routes**: Add to `/app/api` directory  
3. **Styling**: Use Tailwind classes or update `globals.css`
4. **Types**: Define in component files or create separate type files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please create an issue in the repository.

## Recent Improvements ✨

### Enhanced Auto-Fill Logic
The application now features significantly improved auto-fill functionality:

#### Smart Data Extraction
- **Advanced Pattern Recognition**: Uses sophisticated regex patterns to extract market data from natural language AI responses
- **Multi-format Support**: Handles various ways market data can be presented (e.g., "Market Size: $500 billion", "$500B market", "valued at $500 billion")
- **Comprehensive Field Mapping**: Automatically extracts and populates:
  - Report titles from AI discussions
  - Market size with currency formatting
  - CAGR percentages from growth discussions
  - Forecast periods (base year to forecast year)
  - Industry categories based on keyword analysis
  - SEO metadata (meta title, description, keywords)

#### Real-time Refresh Functionality
- **AI-Powered Updates**: "Refresh AI Data" button now fetches actual updated market data from LLAMA AI
- **Context-Aware Requests**: Uses current report topic to request relevant updated information
- **Visual Feedback**: Shows AI response in chat to demonstrate what data was refreshed
- **Graceful Fallback**: Provides minor updates if API requests fail

#### Enhanced AI Integration
- **Optimized Prompts**: System prompts designed to elicit structured, parseable responses
- **Lower Temperature for Data**: Uses more focused AI settings for consistent data extraction
- **Automatic Form Updates**: Form fields update immediately after each AI interaction
- **Error Handling**: Robust error handling with user-friendly feedback

### Technical Improvements
- **Type Safety**: Full TypeScript implementation with proper interfaces
- **Performance**: Efficient state management and minimal re-renders
- **User Experience**: Immediate visual feedback for all user actions
- **Maintainability**: Clean, documented code with modular components
# AI-gminsights
# AI-gminsights
