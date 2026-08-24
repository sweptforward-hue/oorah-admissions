-- Chat table enhancement for Voice Notes, Edit History, and Role Badges

ALTER TABLE IF EXISTS public.messages
ADD COLUMN IF NOT EXISTS voice_note_url TEXT,
ADD COLUMN IF NOT EXISTS voice_note_duration INTEGER,
ADD COLUMN IF NOT EXISTS user_role TEXT,
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb;
