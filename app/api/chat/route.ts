import { NextRequest, NextResponse } from 'next/server';

const LLAMA_API_URL = 'https://irhvspnum5fwv533ke4334mw.agents.do-ai.run/api/v1/chat/completions';
const LLAMA_API_KEY = process.env.LLAMA_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if API key is configured
    if (!LLAMA_API_KEY) {
      return NextResponse.json(
        { error: 'LLAMA API key is not configured. Please add LLAMA_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }
    
    // Default LLAMA API payload structure
    const llamaPayload = {
      messages: body.messages || [],
      temperature: body.temperature || 0.7,
      top_p: body.top_p || 0.9,
      max_tokens: body.max_tokens || 2000,
      max_completion_tokens: body.max_completion_tokens || 2000,
      stream: body.stream || false,
      k: body.k || 0,
      retrieval_method: body.retrieval_method || "rewrite",
      frequency_penalty: body.frequency_penalty || 0,
      presence_penalty: body.presence_penalty || 0,
      stop: body.stop || null,
      stream_options: {
        include_usage: true
      },
      kb_filters: body.kb_filters || [],
      filter_kb_content_by_query_metadata: body.filter_kb_content_by_query_metadata || false,
      instruction_override: body.instruction_override || null,
      include_functions_info: body.include_functions_info || false,
      include_retrieval_info: body.include_retrieval_info || false,
      include_guardrails_info: body.include_guardrails_info || false,
      provide_citations: body.provide_citations || true
    };

    console.log('Sending request to LLAMA API:', llamaPayload);

    const response = await fetch(LLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLAMA_API_KEY}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(llamaPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LLAMA API Error:', response.status, errorText);
      return NextResponse.json(
        { error: 'LLAMA API request failed', details: errorText, status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('LLAMA API Response:', data);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error calling LLAMA API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
