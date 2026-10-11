import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import {
  retrieveRAGContext,
  buildGroundedSystemPrompt,
  generateSmartFallbackResponse,
} from '@/lib/ai/rag';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body?.message;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'A valid message string is required.' },
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim();

    // 1. Retrieve RAG context from live Supabase database tables
    const context = await retrieveRAGContext(trimmedMessage);

    // 2. Build grounded context system prompt for Gemini
    const systemPrompt = buildGroundedSystemPrompt(context);

    const apiKey = process.env.GEMINI_API_KEY;

    // 3. If GEMINI_API_KEY is present, query Google Gemini API
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        // Use gemini-2.5-flash as default, with fallback model names if needed
        let geminiResponse;
        try {
          geminiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: trimmedMessage,
            config: {
              systemInstruction: systemPrompt,
            },
          });
        } catch {
          geminiResponse = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: trimmedMessage,
            config: {
              systemInstruction: systemPrompt,
            },
          });
        }

        const reply = geminiResponse.text || generateSmartFallbackResponse(trimmedMessage, context);

        return NextResponse.json({
          response: reply,
          sources: context.sources,
        });
      } catch (geminiError: unknown) {
        console.error('Gemini API call failed, falling back to smart RAG response:', geminiError);
        const fallbackText = generateSmartFallbackResponse(trimmedMessage, context);
        return NextResponse.json({
          response: fallbackText,
          sources: context.sources,
        });
      }
    }

    // 4. If GEMINI_API_KEY is not configured (e.g. dev or test environment without key):
    // generate contextual response grounded strictly on live database RAG context.
    const fallbackText = generateSmartFallbackResponse(trimmedMessage, context);

    return NextResponse.json({
      response: fallbackText,
      sources: context.sources,
    });
  } catch (err: unknown) {
    console.error('Chat API route error:', err);
    return NextResponse.json(
      {
        error: 'An internal error occurred while processing the chat request.',
        response: 'Sorry, I encountered an issue processing your request. Please try again.',
        sources: [],
      },
      { status: 500 }
    );
  }
}
