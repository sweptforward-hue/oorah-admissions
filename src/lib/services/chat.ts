import { createBrowserClient } from '@/lib/supabase/client';
import { ChatMessage, SendMessageInput, EditMessageInput } from '@/types/chat';

// In-memory fallback cache for development / offline / test environments
const mockChatStore: Record<string, ChatMessage[]> = {};

const initialMockMessages: Record<string, ChatMessage[]> = {
  "1": [
    {
      id: "msg-101",
      kid_id: "1",
      user_id: "user-azriel",
      user_name: "Azriel Cohenca",
      user_email: "azrielcohenca@gmail.com",
      user_role: "Master Admin",
      body: "I spoke with the family regarding enrollment. They will send the remaining transcript tomorrow.",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: "msg-102",
      kid_id: "1",
      user_id: "user-sarah",
      user_name: "Sarah Cohen",
      user_email: "sarah@oorah.org",
      user_role: "VAAD Member",
      body: "Thanks Azriel. **Please review** the attached recommendation letter when available.",
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "msg-103",
      kid_id: "1",
      user_id: "user-david",
      user_name: "David Levy",
      user_email: "david@oorah.org",
      user_role: "Staff",
      body: "Follow-up voice note recorded regarding transportation preferences.",
      voice_note_url: "https://www.w3schools.com/html/horse.mp3",
      voice_note_duration: 14,
      created_at: new Date(Date.now() - 1800000).toISOString(),
    }
  ]
};

export function getMockMessages(kidId: string): ChatMessage[] {
  if (!mockChatStore[kidId]) {
    mockChatStore[kidId] = initialMockMessages[kidId] ? [...initialMockMessages[kidId]] : [];
  }
  return mockChatStore[kidId];
}

export async function fetchMessages(kidId: string): Promise<ChatMessage[]> {
  try {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        kid_id,
        user_id,
        body,
        voice_note_url,
        voice_note_duration,
        user_name,
        user_role,
        created_at,
        updated_at,
        deleted_at,
        edit_history,
        users (
          name,
          email,
          role
        )
      `)
      .eq('kid_id', kidId)
      .order('created_at', { ascending: true });

    if (error || !data) {
      return getMockMessages(kidId);
    }

    return data.map((msg: any) => ({
      id: msg.id,
      kid_id: msg.kid_id,
      user_id: msg.user_id,
      user_name: msg.user_name || msg.users?.name || 'Staff Member',
      user_email: msg.users?.email || '',
      user_role: msg.user_role || msg.users?.role || 'Staff',
      body: msg.body,
      voice_note_url: msg.voice_note_url,
      voice_note_duration: msg.voice_note_duration,
      created_at: msg.created_at,
      updated_at: msg.updated_at,
      deleted_at: msg.deleted_at,
      edit_history: Array.isArray(msg.edit_history) ? msg.edit_history : [],
    }));
  } catch (_e) {
    return getMockMessages(kidId);
  }
}

export async function sendMessage(input: SendMessageInput): Promise<ChatMessage> {
  const newMessage: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    kid_id: input.kidId,
    user_id: input.userId,
    user_name: input.userName,
    user_email: input.userEmail,
    user_role: input.userRole || 'Staff',
    body: input.body,
    voice_note_url: input.voiceNoteUrl || null,
    voice_note_duration: input.voiceNoteDuration || null,
    created_at: new Date().toISOString(),
    edit_history: [],
  };

  try {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from('messages')
      .insert({
        kid_id: input.kidId,
        user_id: input.userId,
        body: input.body,
        voice_note_url: input.voiceNoteUrl || null,
        voice_note_duration: input.voiceNoteDuration || null,
        user_name: input.userName,
        user_role: input.userRole || 'Staff',
      })
      .select()
      .single();

    if (error || !data) {
      // Store in fallback mock store
      const list = getMockMessages(input.kidId);
      list.push(newMessage);
      return newMessage;
    }

    return {
      id: data.id,
      kid_id: data.kid_id,
      user_id: data.user_id,
      user_name: input.userName,
      user_email: input.userEmail,
      user_role: input.userRole || 'Staff',
      body: data.body,
      voice_note_url: data.voice_note_url,
      voice_note_duration: data.voice_note_duration,
      created_at: data.created_at,
      updated_at: data.updated_at,
      deleted_at: data.deleted_at,
      edit_history: [],
    };
  } catch (_e) {
    const list = getMockMessages(input.kidId);
    list.push(newMessage);
    return newMessage;
  }
}

export async function editMessage(input: EditMessageInput): Promise<ChatMessage> {
  const now = new Date().toISOString();

  try {
    const supabase = createBrowserClient();

    // Fetch existing message to update edit_history
    const { data: existing } = await supabase
      .from('messages')
      .select('body, edit_history, user_name, user_role, kid_id, user_id, created_at')
      .eq('id', input.messageId)
      .single();

    let oldBody = existing?.body || '';
    let currentHistory = Array.isArray(existing?.edit_history) ? existing.edit_history : [];

    if (oldBody && oldBody !== input.body) {
      currentHistory = [...currentHistory, { body: oldBody, edited_at: now }];
    }

    const { data, error } = await supabase
      .from('messages')
      .update({
        body: input.body,
        updated_at: now,
        edit_history: currentHistory,
      })
      .eq('id', input.messageId)
      .select()
      .single();

    if (error || !data) {
      // Fallback search in mock store
      for (const kidId of Object.keys(mockChatStore)) {
        const msg = mockChatStore[kidId].find(m => m.id === input.messageId);
        if (msg) {
          if (!msg.edit_history) msg.edit_history = [];
          msg.edit_history.push({ body: msg.body, edited_at: now });
          msg.body = input.body;
          msg.updated_at = now;
          return { ...msg };
        }
      }
      throw new Error('Message not found');
    }

    return {
      id: data.id,
      kid_id: data.kid_id,
      user_id: data.user_id,
      user_name: data.user_name || 'Staff Member',
      user_role: data.user_role || 'Staff',
      body: data.body,
      voice_note_url: data.voice_note_url,
      voice_note_duration: data.voice_note_duration,
      created_at: data.created_at,
      updated_at: data.updated_at,
      deleted_at: data.deleted_at,
      edit_history: currentHistory,
    };
  } catch (_e) {
    for (const kidId of Object.keys(mockChatStore)) {
      const msg = mockChatStore[kidId].find(m => m.id === input.messageId);
      if (msg) {
        if (!msg.edit_history) msg.edit_history = [];
        msg.edit_history.push({ body: msg.body, edited_at: now });
        msg.body = input.body;
        msg.updated_at = now;
        return { ...msg };
      }
    }
    throw new Error('Message edit failed');
  }
}

export async function deleteMessage(messageId: string): Promise<boolean> {
  const now = new Date().toISOString();
  try {
    const supabase = createBrowserClient();
    const { error } = await supabase
      .from('messages')
      .update({ deleted_at: now })
      .eq('id', messageId);

    if (error) {
      // Fallback
      for (const kidId of Object.keys(mockChatStore)) {
        const msg = mockChatStore[kidId].find(m => m.id === messageId);
        if (msg) {
          msg.deleted_at = now;
          return true;
        }
      }
    }
    return true;
  } catch (_e) {
    for (const kidId of Object.keys(mockChatStore)) {
      const msg = mockChatStore[kidId].find(m => m.id === messageId);
      if (msg) {
        msg.deleted_at = now;
        return true;
      }
    }
    return false;
  }
}

export function subscribeToChat(
  kidId: string,
  onEvent: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; newRecord?: any; oldRecord?: any }) => void
) {
  try {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel(`chat_channel:${kidId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `kid_id=eq.${kidId}`,
        },
        (payload) => {
          onEvent({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            newRecord: payload.new,
            oldRecord: payload.old,
          });
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  } catch (_e) {
    return {
      unsubscribe: () => {},
    };
  }
}
