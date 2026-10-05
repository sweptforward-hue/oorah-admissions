-- Migration 07: Schema alignment with canonical columns
-- Adds voting_open to public.kids and can_contribute to public.vaad_members

ALTER TABLE public.kids ADD COLUMN IF NOT EXISTS voting_open BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.vaad_members ADD COLUMN IF NOT EXISTS can_contribute BOOLEAN NOT NULL DEFAULT false;

-- Media tables column alignments (supporting both canonical and RLS schemas)
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS filename TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS uploader_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_type VARCHAR(100);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;

ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS filename TEXT;
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS uploader_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.voice_notes ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE public.voice_notes ADD COLUMN IF NOT EXISTS filename TEXT;
ALTER TABLE public.voice_notes ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE public.voice_notes ADD COLUMN IF NOT EXISTS duration INT DEFAULT 0;
ALTER TABLE public.voice_notes ADD COLUMN IF NOT EXISTS duration_seconds INT DEFAULT 0;
ALTER TABLE public.voice_notes ADD COLUMN IF NOT EXISTS uploader_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.voice_notes ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

