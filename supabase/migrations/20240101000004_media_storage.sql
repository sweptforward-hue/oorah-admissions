-- Media Storage Tables Migration

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES public.users(id),
    document_type TEXT,
    filename TEXT NOT NULL,
    mime_type TEXT,
    drive_file_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to documents" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access to documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES public.users(id),
    filename TEXT NOT NULL,
    caption TEXT,
    drive_file_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to photos" ON public.photos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access to photos" ON public.photos FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.voice_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES public.users(id),
    filename TEXT NOT NULL,
    caption TEXT,
    duration NUMERIC,
    drive_file_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to voice_notes" ON public.voice_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access to voice_notes" ON public.voice_notes FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES public.users(id),
    filename TEXT NOT NULL,
    drive_file_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to transcripts" ON public.transcripts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access to transcripts" ON public.transcripts FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.chat_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES public.users(id),
    filename TEXT NOT NULL,
    drive_file_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.chat_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to chat_exports" ON public.chat_exports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access to chat_exports" ON public.chat_exports FOR INSERT TO authenticated WITH CHECK (true);
