-- Migration 08: Schema cache, columns and RLS fixes

-- 1. Ensure notes, session, bunk columns exist on kids
ALTER TABLE public.kids ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.kids ADD COLUMN IF NOT EXISTS session TEXT;
ALTER TABLE public.kids ADD COLUMN IF NOT EXISTS bunk TEXT;
ALTER TABLE public.kids ADD COLUMN IF NOT EXISTS grade TEXT;
ALTER TABLE public.kids ADD COLUMN IF NOT EXISTS school TEXT;
ALTER TABLE public.kids ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.kids ADD COLUMN IF NOT EXISTS state TEXT;

-- 2. Drop gender column if it exists to align with requirements
ALTER TABLE public.kids DROP COLUMN IF EXISTS gender;

-- 3. Ensure photos, voice_notes, transcripts tables exist
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  filename TEXT,
  caption TEXT,
  drive_file_id TEXT,
  drive_url TEXT,
  uploaded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.voice_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  filename TEXT,
  title TEXT,
  duration_seconds INTEGER DEFAULT 0,
  drive_file_id TEXT,
  drive_url TEXT,
  uploaded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  filename TEXT,
  title TEXT,
  content TEXT,
  drive_file_id TEXT,
  drive_url TEXT,
  uploaded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS and permissive policies for authenticated and service_role
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for authenticated users on photos" ON public.photos;
CREATE POLICY "Enable all for authenticated users on photos" ON public.photos FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all for authenticated users on voice_notes" ON public.voice_notes;
CREATE POLICY "Enable all for authenticated users on voice_notes" ON public.voice_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all for authenticated users on transcripts" ON public.transcripts;
CREATE POLICY "Enable all for authenticated users on transcripts" ON public.transcripts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Fix RLS on kids to allow authenticated insertions and service role full access
DROP POLICY IF EXISTS "kids_insert_policy" ON public.kids;
CREATE POLICY "kids_insert_policy" ON public.kids FOR INSERT TO authenticated WITH CHECK (true);

-- 6. Ensure unique vote per user per kid
ALTER TABLE public.vaad_votes DROP CONSTRAINT IF EXISTS vaad_votes_kid_user_unique;
ALTER TABLE public.vaad_votes ADD CONSTRAINT vaad_votes_kid_user_unique UNIQUE (kid_id, vaad_member_id);

-- Notify PostgREST schema cache
NOTIFY pgrst, 'reload schema';
