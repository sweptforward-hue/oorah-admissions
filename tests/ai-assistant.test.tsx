import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FloatingAIAssistant } from '@/components/ai/FloatingAIAssistant';
import {
  retrieveRAGContext,
  buildGroundedSystemPrompt,
  generateSmartFallbackResponse,
} from '@/lib/ai/rag';
import { POST } from '@/app/api/ai/chat/route';
import { NextRequest } from 'next/server';

// Ensure scrollIntoView exists in jsdom
beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Floating AI Assistant Component', () => {
  it('renders the floating action button on initial load', () => {
    render(<FloatingAIAssistant />);
    const button = screen.getByRole('button', { name: /Open Admissions AI Assistant/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('RAG')).toBeInTheDocument();
  });

  it('opens chat drawer when floating button is clicked and shows header elements', () => {
    render(<FloatingAIAssistant />);
    const openButton = screen.getByRole('button', { name: /Open Admissions AI Assistant/i });
    fireEvent.click(openButton);

    // Modal dialog should now be visible
    expect(screen.getByRole('dialog', { name: /Oorah Admissions AI Assistant/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Oorah Admissions AI Assistant' })).toBeInTheDocument();
    expect(screen.getAllByText(/Powered by Gemini RAG/i).length).toBeGreaterThanOrEqual(1);

    // Welcome message should be present
    expect(screen.getByText(/Hello! I am your/i)).toBeInTheDocument();

    // Quick prompt suggestion chips
    expect(screen.getByRole('button', { name: 'Campers in VAAD review?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Session A stats' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Admissions criteria' })).toBeInTheDocument();
  });

  it('closes chat drawer when close button is clicked', () => {
    render(<FloatingAIAssistant />);
    // Open
    fireEvent.click(screen.getByRole('button', { name: /Open Admissions AI Assistant/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Close
    const closeBtn = screen.getByRole('button', { name: /Close Assistant/i });
    fireEvent.click(closeBtn);

    // Dialog is removed and floating button is back
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Admissions AI Assistant/i })).toBeInTheDocument();
  });

  it('closes chat drawer when Escape key is pressed', () => {
    render(<FloatingAIAssistant />);
    fireEvent.click(screen.getByRole('button', { name: /Open Admissions AI Assistant/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sends user query and displays assistant response with source citation badges', async () => {
    const mockApiResponse = {
      response: '### VAAD Review Queue\n- **John Smith** (App #1042): Status VAAD Review',
      sources: ['Supabase: kids', 'Supabase: statuses'],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as unknown as Response);

    render(<FloatingAIAssistant />);
    fireEvent.click(screen.getByRole('button', { name: /Open Admissions AI Assistant/i }));

    const input = screen.getByRole('textbox', { name: /Ask Admissions Assistant/i });
    fireEvent.change(input, { target: { value: 'Campers in VAAD review?' } });

    const submitBtn = screen.getByRole('button', { name: /Send query/i });
    fireEvent.click(submitBtn);

    // Verify user message appears in log
    expect(screen.getAllByText('Campers in VAAD review?').length).toBeGreaterThanOrEqual(2);

    // Wait for assistant response to render
    await waitFor(() => {
      expect(screen.getByText(/VAAD Review Queue/i)).toBeInTheDocument();
      expect(screen.getByText('Supabase: kids')).toBeInTheDocument();
      expect(screen.getByText('Supabase: statuses')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/ai/chat', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ message: 'Campers in VAAD review?' }),
    }));
  });

  it('handles clicking a quick prompt suggestion', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: 'Session A has 4 registered campers.',
        sources: ['Supabase: sessions'],
      }),
    } as unknown as Response);

    render(<FloatingAIAssistant />);
    fireEvent.click(screen.getByRole('button', { name: /Open Admissions AI Assistant/i }));

    const promptBtn = screen.getByRole('button', { name: 'Session A stats' });
    fireEvent.click(promptBtn);

    await waitFor(() => {
      expect(screen.getByText('Session A has 4 registered campers.')).toBeInTheDocument();
      expect(screen.getByText('Supabase: sessions')).toBeInTheDocument();
    });
  });
});

describe('RAG Retrieval Engine & Prompt Building', () => {
  it('retrieves grounded context with campers, statuses, sessions, and statistics', async () => {
    const context = await retrieveRAGContext('Campers in VAAD review');
    expect(context.campers.length).toBeGreaterThan(0);
    expect(context.statuses.length).toBeGreaterThan(0);
    expect(context.sessions.length).toBeGreaterThan(0);
    expect(context.years.length).toBeGreaterThan(0);
    expect(context.vaadChoices.length).toBeGreaterThan(0);
    expect(context.sources.length).toBeGreaterThan(0);
    expect(context.stats.totalCampers).toBe(context.campers.length);
    expect(context.stats.byStatus).toBeDefined();
    expect(context.stats.bySession).toBeDefined();
  });

  it('buildsGroundedSystemPrompt with strict grounding rules and data sections', async () => {
    const context = await retrieveRAGContext('status rules');
    const prompt = buildGroundedSystemPrompt(context);

    expect(prompt).toContain('Oorah Admissions AI Assistant');
    expect(prompt).toContain('STRICT GROUNDING RULES');
    expect(prompt).toContain('[Active Seasons & Years]');
    expect(prompt).toContain('[Camp Sessions]');
    expect(prompt).toContain('[Admissions Status Pipeline]');
    expect(prompt).toContain('[VAAD Committee Choices & Rules]');
    expect(prompt).toContain('[Camper Records]');
  });

  it('generateSmartFallbackResponse produces accurate responses for VAAD queries', async () => {
    const context = await retrieveRAGContext('vaad review');
    const response = generateSmartFallbackResponse('Campers in VAAD review?', context);

    expect(response).toContain('Campers in VAAD Review');
    expect(response).toContain('John Smith');
    expect(response).toContain('App #1042');
  });

  it('generateSmartFallbackResponse produces accurate responses for session stats', async () => {
    const context = await retrieveRAGContext('session a stats');
    const response = generateSmartFallbackResponse('Session A stats', context);

    expect(response).toContain('Session A Statistics & Overview');
    expect(response).toContain('Total Applicants');
    expect(response).toContain('Accepted / Enrolled');
  });

  it('generateSmartFallbackResponse produces admissions criteria and rules', async () => {
    const context = await retrieveRAGContext('criteria');
    const response = generateSmartFallbackResponse('What are the admissions criteria?', context);

    expect(response).toContain('Oorah Admissions Criteria & Pipeline');
    expect(response).toContain('VAAD Review');
    expect(response).toContain('Voting Choices');
  });

  it('generateSmartFallbackResponse finds individual camper profile', async () => {
    const context = await retrieveRAGContext('John Smith');
    const response = generateSmartFallbackResponse('Tell me about John Smith', context);

    expect(response).toContain('Camper Profile: John Smith');
    expect(response).toContain('App #1042');
  });
});

describe('Chat API Route (/api/ai/chat)', () => {
  it('returns 400 when message is missing or empty', async () => {
    const req = new NextRequest('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('returns smart RAG response and sources when GEMINI_API_KEY is not set', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const req = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Campers in VAAD review?' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.response).toBeDefined();
      expect(data.response).toContain('Campers in VAAD Review');
      expect(Array.isArray(data.sources)).toBe(true);
      expect(data.sources.length).toBeGreaterThan(0);
    } finally {
      if (originalKey) {
        process.env.GEMINI_API_KEY = originalKey;
      }
    }
  });
});
