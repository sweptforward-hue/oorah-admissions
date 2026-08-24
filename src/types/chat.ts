export interface EditHistoryEntry {
  body: string;
  edited_at: string;
}

export interface ChatMessage {
  id: string;
  kid_id: string;
  user_id: string;
  user_name: string;
  user_email?: string;
  user_role?: string;
  body: string;
  voice_note_url?: string | null;
  voice_note_duration?: number | null;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  edit_history?: EditHistoryEntry[];
}

export interface SendMessageInput {
  kidId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userRole?: string;
  body: string;
  voiceNoteUrl?: string | null;
  voiceNoteDuration?: number | null;
}

export interface EditMessageInput {
  messageId: string;
  body: string;
}
