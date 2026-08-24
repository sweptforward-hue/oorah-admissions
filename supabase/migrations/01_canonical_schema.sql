-- Oorah Admissions Management System - Canonical Database Schema
-- Migration 01_canonical_schema.sql

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. CORE TABLES DEFINITIONS (19 TABLES)
-- ==========================================

-- Table 1: users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT DEFAULT 'staff',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: years
CREATE TABLE IF NOT EXISTS public.years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_number INT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_id UUID REFERENCES public.years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 4: statuses
CREATE TABLE IF NOT EXISTS public.statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  color_hex TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 5: kids
CREATE TABLE IF NOT EXISTS public.kids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status_id UUID REFERENCES public.statuses(id) ON DELETE RESTRICT,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  year_id UUID REFERENCES public.years(id) ON DELETE SET NULL,
  voting_open BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 6: vaad_choices
CREATE TABLE IF NOT EXISTS public.vaad_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  label TEXT,
  description TEXT,
  color_hex TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 7: vaad_members
CREATE TABLE IF NOT EXISTS public.vaad_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  can_contribute BOOLEAN DEFAULT true,
  can_vote BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 8: vaad_votes
CREATE TABLE IF NOT EXISTS public.vaad_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  vaad_member_id UUID NOT NULL REFERENCES public.vaad_members(id) ON DELETE CASCADE,
  choice_id UUID REFERENCES public.vaad_choices(id) ON DELETE RESTRICT,
  vote TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kid_id, vaad_member_id)
);

-- Table 9: chat_messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Table 10: documents
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  document_type TEXT,
  filename TEXT NOT NULL,
  mime_type TEXT,
  drive_file_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 11: voice_notes
CREATE TABLE IF NOT EXISTS public.voice_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  filename TEXT,
  caption TEXT,
  duration INTEGER,
  drive_file_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 12: photos
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  filename TEXT,
  caption TEXT,
  drive_file_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 13: transcripts
CREATE TABLE IF NOT EXISTS public.transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  filename TEXT,
  content TEXT,
  drive_file_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 14: status_history
CREATE TABLE IF NOT EXISTS public.status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  old_status_id UUID REFERENCES public.statuses(id) ON DELETE SET NULL,
  new_status_id UUID REFERENCES public.statuses(id) ON DELETE RESTRICT,
  changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 15: audit_log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 16: exports
CREATE TABLE IF NOT EXISTS public.exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID REFERENCES public.kids(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL,
  destination TEXT,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 17: custom_field_definitions
CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  options JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 18: custom_field_values
CREATE TABLE IF NOT EXISTS public.custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_definition_id UUID NOT NULL REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(field_definition_id, entity_id)
);

-- Table 19: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. COMPATIBILITY VIEWS
-- ==========================================

CREATE OR REPLACE VIEW public.messages AS
SELECT * FROM public.chat_messages;

CREATE OR REPLACE VIEW public.custom_fields AS
SELECT * FROM public.custom_field_definitions;

CREATE OR REPLACE VIEW public.vaad_voting_choices AS
SELECT * FROM public.vaad_choices;

-- ==========================================
-- 3. SEQUENCES AND TRIGGERS
-- ==========================================

-- Sequence and Trigger for Kid Application Number (Formatted: OOR-YYYY-XXXXX)
CREATE SEQUENCE IF NOT EXISTS application_number_seq START WITH 1001;

CREATE OR REPLACE FUNCTION public.generate_kid_application_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.application_number IS NULL OR NEW.application_number = '' THEN
        NEW.application_number := 'OOR-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('application_number_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_kid_application_number ON public.kids;
CREATE TRIGGER set_kid_application_number
BEFORE INSERT ON public.kids
FOR EACH ROW
EXECUTE FUNCTION public.generate_kid_application_number();

-- Trigger Function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers across all 19 tables
DO $$
DECLARE
    t TEXT;
    tables TEXT[] := ARRAY[
        'users', 'years', 'sessions', 'statuses', 'kids', 'vaad_choices',
        'vaad_members', 'vaad_votes', 'chat_messages', 'documents', 'voice_notes',
        'photos', 'transcripts', 'status_history', 'audit_log', 'exports',
        'custom_field_definitions', 'custom_field_values', 'notifications'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I;', t, t);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', t, t);
    END LOOP;
END $$;

-- Master Admin Protection Trigger
CREATE OR REPLACE FUNCTION public.protect_master_admin()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.email = 'Azrielcohenca@gmail.com' THEN
        IF TG_OP = 'DELETE' THEN
            RAISE EXCEPTION 'Cannot delete master admin account';
        END IF;
        IF TG_OP = 'UPDATE' AND NEW.role != 'admin' THEN
            RAISE EXCEPTION 'Cannot remove admin role from master admin';
        END IF;
        IF TG_OP = 'UPDATE' AND NEW.active = false THEN
            RAISE EXCEPTION 'Cannot deactivate master admin';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_master_admin_trigger ON public.users;
CREATE TRIGGER protect_master_admin_trigger
BEFORE UPDATE OR DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.protect_master_admin();

-- RPC Function for Atomic VAAD Voting & Automatic Acceptance Workflow
CREATE OR REPLACE FUNCTION public.submit_vaad_vote(p_kid_id UUID, p_choice_id UUID)
RETURNS void AS $$
DECLARE
    v_member_id UUID;
    v_choice_name TEXT;
    v_accept_count INT;
    v_accept_choice_ids UUID[];
    v_accepted_status_id UUID;
    v_current_status_id UUID;
    v_authenticated_user_id UUID;
BEGIN
    v_authenticated_user_id := auth.uid();
    IF v_authenticated_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    PERFORM id FROM public.kids WHERE id = p_kid_id FOR UPDATE;

    SELECT id INTO v_member_id
    FROM public.vaad_members
    WHERE user_id = v_authenticated_user_id AND is_active = true AND can_vote = true;

    IF v_member_id IS NULL THEN
        RAISE EXCEPTION 'User is not an active VAAD voter';
    END IF;

    SELECT name INTO v_choice_name
    FROM public.vaad_choices
    WHERE id = p_choice_id AND is_active = true;

    IF v_choice_name IS NULL THEN
        RAISE EXCEPTION 'Invalid or inactive voting choice';
    END IF;

    INSERT INTO public.vaad_votes (kid_id, vaad_member_id, choice_id, vote)
    VALUES (p_kid_id, v_member_id, p_choice_id, v_choice_name)
    ON CONFLICT (kid_id, vaad_member_id) DO UPDATE
    SET choice_id = EXCLUDED.choice_id, vote = EXCLUDED.vote, updated_at = NOW();

    SELECT array_agg(id) INTO v_accept_choice_ids
    FROM public.vaad_choices
    WHERE lower(name) = 'accept' OR lower(label) = 'accept';

    IF v_accept_choice_ids IS NOT NULL THEN
        SELECT count(*) INTO v_accept_count
        FROM public.vaad_votes
        WHERE kid_id = p_kid_id AND choice_id = ANY(v_accept_choice_ids);

        IF v_accept_count >= 2 THEN
            SELECT status_id INTO v_current_status_id FROM public.kids WHERE id = p_kid_id;
            SELECT id INTO v_accepted_status_id FROM public.statuses WHERE lower(name) = 'accepted' LIMIT 1;

            IF v_accepted_status_id IS NOT NULL AND (v_current_status_id IS NULL OR v_current_status_id IS DISTINCT FROM v_accepted_status_id) THEN
                UPDATE public.kids SET status_id = v_accepted_status_id, updated_at = NOW() WHERE id = p_kid_id;

                INSERT INTO public.status_history (kid_id, old_status_id, new_status_id, changed_by, reason)
                VALUES (p_kid_id, v_current_status_id, v_accepted_status_id, v_authenticated_user_id, 'Automatically triggered by 2/3 Accept votes');

                INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, metadata)
                VALUES (v_authenticated_user_id, 'automatic_acceptance', 'kid', p_kid_id, '{"reason": "2/3 Accept votes"}');
            END IF;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. B-TREE INDEXES FOR HIGH-FREQUENCY QUERIES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

CREATE INDEX IF NOT EXISTS idx_kids_status_id ON public.kids(status_id);
CREATE INDEX IF NOT EXISTS idx_kids_session_id ON public.kids(session_id);
CREATE INDEX IF NOT EXISTS idx_kids_year_id ON public.kids(year_id);
CREATE INDEX IF NOT EXISTS idx_kids_application_number ON public.kids(application_number);

CREATE INDEX IF NOT EXISTS idx_chat_messages_kid_id ON public.chat_messages(kid_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_documents_kid_id ON public.documents(kid_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_voice_notes_kid_id ON public.voice_notes(kid_id);
CREATE INDEX IF NOT EXISTS idx_photos_kid_id ON public.photos(kid_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_kid_id ON public.transcripts(kid_id);

CREATE INDEX IF NOT EXISTS idx_vaad_members_user_id ON public.vaad_members(user_id);
CREATE INDEX IF NOT EXISTS idx_vaad_votes_kid_id ON public.vaad_votes(kid_id);
CREATE INDEX IF NOT EXISTS idx_vaad_votes_choice_id ON public.vaad_votes(choice_id);

CREATE INDEX IF NOT EXISTS idx_status_history_kid_id ON public.status_history(kid_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_custom_field_values_lookup ON public.custom_field_values(field_definition_id, entity_id);
CREATE INDEX IF NOT EXISTS idx_exports_kid_id ON public.exports(kid_id);

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaad_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaad_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- General permissive policies for authenticated application access
CREATE POLICY "Allow read access to public tables for authenticated users" ON public.statuses FOR SELECT USING (true);
CREATE POLICY "Allow read access to vaad choices for authenticated users" ON public.vaad_choices FOR SELECT USING (true);
CREATE POLICY "Allow read access to vaad members for authenticated users" ON public.vaad_members FOR SELECT USING (true);
CREATE POLICY "Allow read access to kids for authenticated users" ON public.kids FOR SELECT USING (true);
CREATE POLICY "Allow insert/update kids for authenticated users" ON public.kids FOR ALL USING (true);

-- ==========================================
-- 6. IDEMPOTENT SEED DATA
-- ==========================================

-- Seed Master Admin
INSERT INTO public.users (id, email, name, role, active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Azrielcohenca@gmail.com', 'Azriel Cohenca', 'admin', true)
ON CONFLICT (email) DO UPDATE SET role = 'admin', active = true;

-- Seed Default Statuses
INSERT INTO public.statuses (name, display_order, active, is_default, color_hex)
VALUES
  ('New', 10, true, true, '#3b82f6'),
  ('Incomplete', 20, true, false, '#f59e0b'),
  ('Under Review', 30, true, false, '#8b5cf6'),
  ('Interview', 40, true, false, '#ec4899'),
  ('VAAD Review', 50, true, false, '#6366f1'),
  ('Accepted', 60, true, false, '#22c55e'),
  ('Rejected', 70, true, false, '#ef4444'),
  ('Waitlisted', 80, true, false, '#eab308'),
  ('Withdrawn', 90, true, false, '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- Seed Default VAAD Choices
INSERT INTO public.vaad_choices (name, label, display_order, color_hex, is_active)
VALUES
  ('Accept', 'Accept', 10, '#22c55e', true),
  ('Reject', 'Reject', 20, '#ef4444', true),
  ('Abstain', 'Abstain', 30, '#9ca3af', true),
  ('Pending', 'Pending', 40, '#f59e0b', true)
ON CONFLICT (name) DO NOTHING;

-- Seed Default Year and Sessions
INSERT INTO public.years (year_number, name, is_active)
VALUES (2026, '2026', true)
ON CONFLICT (year_number) DO NOTHING;

INSERT INTO public.sessions (year_id, name, code, is_active)
SELECT y.id, 'Session A', 'SESS-A', true
FROM public.years y WHERE y.year_number = 2026
ON CONFLICT DO NOTHING;

INSERT INTO public.sessions (year_id, name, code, is_active)
SELECT y.id, 'Session B', 'SESS-B', true
FROM public.years y WHERE y.year_number = 2026
ON CONFLICT DO NOTHING;
