// Simple test to verify the data extraction function works correctly

const testResponse = `
The global electric vehicle market is experiencing rapid growth. The market size was valued at $388.1 billion in 2023 and is expected to grow at a CAGR of 22.5% from 2024 to 2030. This impressive growth rate is driven by increasing environmental consciousness and government incentives for clean transportation solutions.

Key market insights:
- Market Size: $388.1 billion (2023)
- CAGR: 22.5% (2024-2030)
- Forecast Period: 2024 to 2030
- Major players include Tesla, BYD, and Volkswagen
- The automotive sector is undergoing a significant transformation
`;

function extractReportDataFromAI(aiResponse) {
  const extractedData = {};
  
  // Extract title
  const titleMatch = aiResponse.match(/(?:report\s+title|title):\s*([^\n\r]+)/i) ||
                    aiResponse.match(/"([^"]+(?:market|analysis|report|forecast)[^"]*)"?/i) ||
                    aiResponse.match(/(?:analyzing|analysis\s+of|report\s+on)\s+(?:the\s+)?([^.\n\r]+(?:market|industry))/i);
  if (titleMatch) {
    extractedData.title = titleMatch[1].trim().replace(/"/g, '');
  }
  
  // Extract market size
  const marketSizeMatch = aiResponse.match(/(?:market\s+size|valued\s+at|worth|size\s+of):\s*\$?[\d,.]+\s*(?:billion|million|trillion)/i) ||
                         aiResponse.match(/\$[\d,.]+\s*(?:billion|million|trillion)(?:\s+market)?/i);
  if (marketSizeMatch) {
    const sizeMatch = marketSizeMatch[0].match(/\$?[\d,.]+\s*(?:billion|million|trillion)/i);
    if (sizeMatch) {
      extractedData.marketSize = sizeMatch[0].startsWith('$') ? sizeMatch[0] : '$' + sizeMatch[0];
    }
  }
  
  // Extract CAGR
  const cagrMatch = aiResponse.match(/(?:cagr|compound\s+annual\s+growth\s+rate|growth\s+rate|annual\s+growth):\s*(\d+\.?\d*%)/i) ||
                   aiResponse.match(/(\d+\.?\d*%)\s*(?:cagr|annual\s+growth|growth\s+rate|compound\s+annual)/i) ||
                   aiResponse.match(/(?:growing\s+at|expected\s+to\s+grow\s+at)\s*(\d+\.?\d*%)/i);
  if (cagrMatch) {
    extractedData.cagr = cagrMatch[1];
  }
  
  // Extract years
  const yearMatch = aiResponse.match(/(?:forecast\s+period|period|from)\s*(\d{4})\s*(?:to|-|through)\s*(\d{4})/i) ||
                   aiResponse.match(/(\d{4})\s*-\s*(\d{4})\s*(?:forecast|analysis|period)/i);
  if (yearMatch) {
    extractedData.baseYear = parseInt(yearMatch[1]);
    extractedData.forecastYear = parseInt(yearMatch[2]);
  }
  
  return extractedData;
}

// Test the extraction
const result = extractReportDataFromAI(testResponse);
console.log('Extracted data:', result);

// Expected output should include:
// - marketSize: "$388.1 billion"
// - cagr: "22.5%"
// - baseYear: 2024
// - forecastYear: 2030
