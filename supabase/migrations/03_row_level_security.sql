-- Migration: 03_row_level_security.sql
-- Description: Implement comprehensive, least-privilege PostgreSQL Row Level Security (RLS) policies across all tables and helper functions.

-- Ensure all required tables exist before applying policies
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'staff',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number TEXT,
  name TEXT,
  status_id UUID,
  voting_open BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  color_hex TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kid_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  access_level TEXT DEFAULT 'read',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kid_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  old_status_id UUID REFERENCES public.statuses(id),
  new_status_id UUID REFERENCES public.statuses(id),
  changed_by UUID REFERENCES public.users(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.users(id),
  document_type TEXT,
  filename TEXT NOT NULL,
  mime_type TEXT,
  drive_file_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.users(id),
  filename TEXT NOT NULL,
  caption TEXT,
  drive_file_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.voice_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.users(id),
  filename TEXT NOT NULL,
  caption TEXT,
  duration INTEGER,
  drive_file_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  attachment_type TEXT,
  drive_file_id TEXT,
  filename TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vaad_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  is_active BOOLEAN DEFAULT true,
  can_contribute BOOLEAN DEFAULT true,
  can_vote BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vaad_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vaad_voting_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color_hex TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vaad_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  vaad_member_id UUID NOT NULL REFERENCES public.vaad_members(id) ON DELETE CASCADE,
  choice_id UUID REFERENCES public.vaad_choices(id),
  vote TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kid_id, vaad_member_id)
);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID REFERENCES public.kids(id) ON DELETE SET NULL,
  export_type TEXT,
  destination TEXT,
  status TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_by UUID REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.users(id),
  type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.custom_fields (
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

CREATE TABLE IF NOT EXISTS public.custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES public.custom_fields(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(field_id, entity_id)
);

CREATE TABLE IF NOT EXISTS public.years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_id UUID NOT NULL REFERENCES public.years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Helper Security Definer Functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
      AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_vaad_member()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.vaad_members vm
    JOIN public.users u ON vm.user_id = u.id
    WHERE u.id = auth.uid()
      AND u.active = true
      AND vm.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_vaad_voter()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.vaad_members vm
    JOIN public.users u ON vm.user_id = u.id
    WHERE u.id = auth.uid()
      AND u.active = true
      AND vm.is_active = true
      AND vm.can_vote = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- Enable Row Level Security across all public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kid_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaad_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaad_voting_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaad_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;


-- Drop all existing policies on these tables to ensure clean least-privilege state
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;


-- 1. users
CREATE POLICY "users_select_policy" ON public.users FOR SELECT USING (public.is_active_user());
CREATE POLICY "users_insert_policy" ON public.users FOR INSERT WITH CHECK (public.is_admin() OR auth.uid() = id);
CREATE POLICY "users_update_policy" ON public.users FOR UPDATE USING (public.is_admin() OR auth.uid() = id);
CREATE POLICY "users_delete_policy" ON public.users FOR DELETE USING (public.is_admin());

-- 2. kids
CREATE POLICY "kids_select_policy" ON public.kids FOR SELECT USING (public.is_active_user());
CREATE POLICY "kids_insert_policy" ON public.kids FOR INSERT WITH CHECK (public.is_active_user());
CREATE POLICY "kids_update_policy" ON public.kids FOR UPDATE USING (public.is_active_user());
CREATE POLICY "kids_delete_policy" ON public.kids FOR DELETE USING (public.is_admin());

-- 3. statuses
CREATE POLICY "statuses_select_policy" ON public.statuses FOR SELECT USING (public.is_active_user());
CREATE POLICY "statuses_all_admin_policy" ON public.statuses FOR ALL USING (public.is_admin());

-- 4. roles
CREATE POLICY "roles_select_policy" ON public.roles FOR SELECT USING (public.is_active_user());
CREATE POLICY "roles_all_admin_policy" ON public.roles FOR ALL USING (public.is_admin());

-- 5. kid_memberships
CREATE POLICY "kid_memberships_select_policy" ON public.kid_memberships FOR SELECT USING (public.is_active_user());
CREATE POLICY "kid_memberships_all_admin_policy" ON public.kid_memberships FOR ALL USING (public.is_admin());

-- 6. status_history
CREATE POLICY "status_history_select_policy" ON public.status_history FOR SELECT USING (public.is_active_user());
CREATE POLICY "status_history_insert_policy" ON public.status_history FOR INSERT WITH CHECK (public.is_active_user());
CREATE POLICY "status_history_update_policy" ON public.status_history FOR UPDATE USING (public.is_admin());
CREATE POLICY "status_history_delete_policy" ON public.status_history FOR DELETE USING (public.is_admin());

-- 7. documents
CREATE POLICY "documents_select_policy" ON public.documents FOR SELECT USING (public.is_active_user());
CREATE POLICY "documents_insert_policy" ON public.documents FOR INSERT WITH CHECK (public.is_active_user());
CREATE POLICY "documents_update_policy" ON public.documents FOR UPDATE USING (public.is_admin() OR uploaded_by = auth.uid());
CREATE POLICY "documents_delete_policy" ON public.documents FOR DELETE USING (public.is_admin() OR uploaded_by = auth.uid());

-- 8. photos
CREATE POLICY "photos_select_policy" ON public.photos FOR SELECT USING (public.is_active_user());
CREATE POLICY "photos_insert_policy" ON public.photos FOR INSERT WITH CHECK (public.is_active_user());
CREATE POLICY "photos_update_policy" ON public.photos FOR UPDATE USING (public.is_admin() OR uploaded_by = auth.uid());
CREATE POLICY "photos_delete_policy" ON public.photos FOR DELETE USING (public.is_admin() OR uploaded_by = auth.uid());

-- 9. voice_notes
CREATE POLICY "voice_notes_select_policy" ON public.voice_notes FOR SELECT USING (public.is_active_user());
CREATE POLICY "voice_notes_insert_policy" ON public.voice_notes FOR INSERT WITH CHECK (public.is_active_user());
CREATE POLICY "voice_notes_update_policy" ON public.voice_notes FOR UPDATE USING (public.is_admin() OR uploaded_by = auth.uid());
CREATE POLICY "voice_notes_delete_policy" ON public.voice_notes FOR DELETE USING (public.is_admin() OR uploaded_by = auth.uid());

-- 10. messages
CREATE POLICY "messages_select_policy" ON public.messages FOR SELECT USING (public.is_active_user());
CREATE POLICY "messages_insert_policy" ON public.messages FOR INSERT WITH CHECK (public.is_active_user() AND user_id = auth.uid());
CREATE POLICY "messages_update_policy" ON public.messages FOR UPDATE USING (public.is_admin() OR user_id = auth.uid());
CREATE POLICY "messages_delete_policy" ON public.messages FOR DELETE USING (public.is_admin() OR user_id = auth.uid());

-- 11. message_attachments
CREATE POLICY "message_attachments_select_policy" ON public.message_attachments FOR SELECT USING (public.is_active_user());
CREATE POLICY "message_attachments_insert_policy" ON public.message_attachments FOR INSERT WITH CHECK (public.is_active_user());
CREATE POLICY "message_attachments_update_policy" ON public.message_attachments FOR UPDATE USING (public.is_admin());
CREATE POLICY "message_attachments_delete_policy" ON public.message_attachments FOR DELETE USING (public.is_admin());

-- 12. vaad_members
CREATE POLICY "vaad_members_select_policy" ON public.vaad_members FOR SELECT USING (public.is_active_user());
CREATE POLICY "vaad_members_all_admin_policy" ON public.vaad_members FOR ALL USING (public.is_admin());

-- 13. vaad_choices
CREATE POLICY "vaad_choices_select_policy" ON public.vaad_choices FOR SELECT USING (public.is_active_user());
CREATE POLICY "vaad_choices_all_admin_policy" ON public.vaad_choices FOR ALL USING (public.is_admin());

-- 14. vaad_voting_choices
CREATE POLICY "vaad_voting_choices_select_policy" ON public.vaad_voting_choices FOR SELECT USING (public.is_active_user());
CREATE POLICY "vaad_voting_choices_all_admin_policy" ON public.vaad_voting_choices FOR ALL USING (public.is_admin());

-- 15. vaad_votes
CREATE POLICY "vaad_votes_select_policy" ON public.vaad_votes FOR SELECT USING (public.is_vaad_member() OR public.is_admin());
CREATE POLICY "vaad_votes_insert_policy" ON public.vaad_votes FOR INSERT WITH CHECK (
  public.is_admin() OR (
    public.is_vaad_voter() AND vaad_member_id IN (
      SELECT id FROM public.vaad_members WHERE user_id = auth.uid()
    )
  )
);
CREATE POLICY "vaad_votes_update_policy" ON public.vaad_votes FOR UPDATE USING (
  public.is_admin() OR (
    public.is_vaad_voter() AND vaad_member_id IN (
      SELECT id FROM public.vaad_members WHERE user_id = auth.uid()
    )
  )
);
CREATE POLICY "vaad_votes_delete_policy" ON public.vaad_votes FOR DELETE USING (public.is_admin());

-- 16. audit_log
CREATE POLICY "audit_log_select_policy" ON public.audit_log FOR SELECT USING (public.is_admin());
CREATE POLICY "audit_log_insert_policy" ON public.audit_log FOR INSERT WITH CHECK (public.is_active_user());

-- 17. exports
CREATE POLICY "exports_select_policy" ON public.exports FOR SELECT USING (public.is_admin() OR created_by = auth.uid());
CREATE POLICY "exports_insert_policy" ON public.exports FOR INSERT WITH CHECK (public.is_active_user());
CREATE POLICY "exports_update_policy" ON public.exports FOR UPDATE USING (public.is_admin() OR created_by = auth.uid());
CREATE POLICY "exports_delete_policy" ON public.exports FOR DELETE USING (public.is_admin());

-- 18. notifications
CREATE POLICY "notifications_select_policy" ON public.notifications FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "notifications_insert_policy" ON public.notifications FOR INSERT WITH CHECK (public.is_active_user());
CREATE POLICY "notifications_update_policy" ON public.notifications FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "notifications_delete_policy" ON public.notifications FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- 19. custom_fields and custom_field_values
CREATE POLICY "custom_fields_select_policy" ON public.custom_fields FOR SELECT USING (public.is_active_user());
CREATE POLICY "custom_fields_all_admin_policy" ON public.custom_fields FOR ALL USING (public.is_admin());

CREATE POLICY "custom_field_values_select_policy" ON public.custom_field_values FOR SELECT USING (public.is_active_user());
CREATE POLICY "custom_field_values_insert_policy" ON public.custom_field_values FOR INSERT WITH CHECK (public.is_active_user());
CREATE POLICY "custom_field_values_update_policy" ON public.custom_field_values FOR UPDATE USING (public.is_active_user());
CREATE POLICY "custom_field_values_delete_policy" ON public.custom_field_values FOR DELETE USING (public.is_admin());

-- 20. years
CREATE POLICY "years_select_policy" ON public.years FOR SELECT USING (public.is_active_user());
CREATE POLICY "years_all_admin_policy" ON public.years FOR ALL USING (public.is_admin());

-- 21. sessions
CREATE POLICY "sessions_select_policy" ON public.sessions FOR SELECT USING (public.is_active_user());
CREATE POLICY "sessions_all_admin_policy" ON public.sessions FOR ALL USING (public.is_admin());
