import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ChatTab } from '@/components/kids/chat-tab';
import {
  fetchMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  subscribeToChat,
} from '@/lib/services/chat';

// Mock Supabase browser client
vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error('Mock fallback') }),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error('Mock fallback') }),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  })),
}));

beforeEach(() => {
  if (typeof window !== 'undefined') {
    window.URL.createObjectURL = vi.fn(() => 'mock-audio-url');
  }
});

describe('Chat Service Functions', () => {
  it('fetchMessages retrieves messages or fallback mock messages for a kid', async () => {
    const messages = await fetchMessages('1');
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].kid_id).toBe('1');
    expect(messages[0].user_name).toBeDefined();
    expect(messages[0].user_role).toBeDefined();
  });

  it('sendMessage adds a new message with author attribution and role', async () => {
    const newMsg = await sendMessage({
      kidId: '1',
      userId: 'user-test',
      userName: 'Test User',
      userEmail: 'test@oorah.org',
      userRole: 'VAAD Member',
      body: 'Testing chat message insertion',
    });

    expect(newMsg.id).toBeDefined();
    expect(newMsg.body).toBe('Testing chat message insertion');
    expect(newMsg.user_name).toBe('Test User');
    expect(newMsg.user_role).toBe('VAAD Member');
  });

  it('editMessage updates message body and records edit history', async () => {
    const original = await sendMessage({
      kidId: '1',
      userId: 'user-test',
      userName: 'Test User',
      body: 'Original text before edit',
    });

    const updated = await editMessage({
      messageId: original.id,
      body: 'Updated text after edit',
    });

    expect(updated.body).toBe('Updated text after edit');
    expect(updated.updated_at).toBeDefined();
    expect(updated.edit_history?.length).toBeGreaterThan(0);
    expect(updated.edit_history?.[0].body).toBe('Original text before edit');
  });

  it('deleteMessage soft deletes a message', async () => {
    const msg = await sendMessage({
      kidId: '1',
      userId: 'user-test',
      userName: 'Test User',
      body: 'To be deleted',
    });

    const result = await deleteMessage(msg.id);
    expect(result).toBe(true);
  });

  it('subscribeToChat returns a subscription handle with unsubscribe', () => {
    const sub = subscribeToChat('1', vi.fn());
    expect(sub).toBeDefined();
    expect(typeof sub.unsubscribe).toBe('function');
  });
});

describe('ChatTab Component', () => {
  const mockUser = {
    id: 'user-azriel',
    name: 'Azriel Cohenca',
    email: 'azrielcohenca@gmail.com',
    role: 'Master Admin',
  };

  it('renders Real-Time Admissions Chat interface with live channel indicator', async () => {
    render(<ChatTab kidId="1" currentUser={mockUser} />);

    expect(screen.getByText('Real-Time Admissions Chat')).toBeInTheDocument();
    expect(screen.getByText('Live channel active')).toBeInTheDocument();
    expect(screen.getByText('Export Chat')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Azriel Cohenca')).toBeInTheDocument();
    });
  });

  it('renders author role badges correctly', async () => {
    render(<ChatTab kidId="1" currentUser={mockUser} />);

    await waitFor(() => {
      expect(screen.getAllByText('Master Admin').length).toBeGreaterThan(0);
      expect(screen.getAllByText('VAAD Member').length).toBeGreaterThan(0);
    });
  });

  it('applies rich text formatting when toolbar buttons are clicked', async () => {
    render(<ChatTab kidId="1" currentUser={mockUser} />);

    const boldBtn = screen.getByTitle('Bold (**text**)');
    const textarea = screen.getByPlaceholderText(/Type your message with markdown formatting/i);

    fireEvent.click(boldBtn);

    expect(textarea).toHaveValue('**text**');
  });

  it('sends a new message when user types text and clicks Send Message', async () => {
    render(<ChatTab kidId="1" currentUser={mockUser} />);

    const textarea = screen.getByPlaceholderText(/Type your message with markdown formatting/i);
    const sendBtn = screen.getByRole('button', { name: /Send Message/i });

    fireEvent.change(textarea, { target: { value: 'New real-time team note' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('New real-time team note')).toBeInTheDocument();
    });
  });

  it('supports voice note recording and preview', async () => {
    render(<ChatTab kidId="1" currentUser={mockUser} />);

    const recordBtn = screen.getByRole('button', { name: /Record Voice Note/i });
    fireEvent.click(recordBtn);

    expect(screen.getByText(/Recording/i)).toBeInTheDocument();

    const stopBtn = screen.getByTitle('Stop Recording');
    fireEvent.click(stopBtn);

    await waitFor(() => {
      expect(screen.getByText(/Voice note recorded/i)).toBeInTheDocument();
    });
  });
});
