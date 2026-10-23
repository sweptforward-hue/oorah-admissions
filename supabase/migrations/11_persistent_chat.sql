-- Migration 11: Persistent Chat, Attachments and Author Mentions
-- Hardens public.chat_messages schema with attachment metadata, audio proxy URLs,
-- duration tracking, tagged users, and Row Level Security policies.

-- 1. Ensure columns exist on public.chat_messages
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(50);
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255);
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS duration_seconds INT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS tagged_users TEXT[];
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Indexes for fast retrieval by camper ordered by time
CREATE INDEX IF NOT EXISTS idx_chat_messages_kid_created ON public.chat_messages(kid_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_author ON public.chat_messages(author_id);

-- 3. Row Level Security for chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_select_policy" ON public.chat_messages;
CREATE POLICY "chat_messages_select_policy" ON public.chat_messages
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "chat_messages_insert_policy" ON public.chat_messages;
CREATE POLICY "chat_messages_insert_policy" ON public.chat_messages
    FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "chat_messages_update_policy" ON public.chat_messages;
CREATE POLICY "chat_messages_update_policy" ON public.chat_messages
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        ) OR author_id = auth.uid()
    );

DROP POLICY IF EXISTS "chat_messages_delete_policy" ON public.chat_messages;
CREATE POLICY "chat_messages_delete_policy" ON public.chat_messages
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        ) OR author_id = auth.uid()
    );

DROP POLICY IF EXISTS "chat_messages_service_role" ON public.chat_messages;
CREATE POLICY "chat_messages_service_role" ON public.chat_messages
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Notify schema reload for PostgREST
NOTIFY pgrst, 'reload schema';
