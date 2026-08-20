-- Extra features schema changes

-- 1. Mentions & Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.users(id),
    type TEXT NOT NULL, -- e.g., 'mention'
    entity_type TEXT,
    entity_id UUID,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- 2. Master Admin Protection
-- Master admin receives its authority through the canonical database role architecture.
-- We will use a trigger to prevent removing or downgrading Azrielcohenca@gmail.com
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

CREATE TRIGGER protect_master_admin_trigger
BEFORE UPDATE OR DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.protect_master_admin();

-- 3. Kids table additions for VAAD voting control
-- Assuming kids table exists or will exist (as per 01-database.md)
CREATE TABLE IF NOT EXISTS public.kids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number TEXT,
    name TEXT,
    status_id UUID,
    voting_open BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.kids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to kids" ON public.kids FOR SELECT USING (true);
CREATE POLICY "Allow admin access to kids" ON public.kids FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- 4. Status History & Audit Log
CREATE TABLE IF NOT EXISTS public.status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
    old_status_id UUID,
    new_status_id UUID,
    changed_by UUID REFERENCES public.users(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to status_history" ON public.status_history FOR SELECT USING (true);
CREATE POLICY "Allow admin insert to status_history" ON public.status_history FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow admin read access to audit_log" ON public.audit_log FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Allow any authenticated insert to audit_log" ON public.audit_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Custom Fields
CREATE TABLE IF NOT EXISTS public.custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- 'camper', 'staff', etc.
    name TEXT NOT NULL,
    field_type TEXT NOT NULL, -- 'text', 'number', 'dropdown', etc.
    description TEXT,
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    options JSONB, -- For dropdown/multi-select
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access" ON public.custom_fields FOR SELECT USING (true);
CREATE POLICY "Allow admin full access" ON public.custom_fields FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.custom_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES public.custom_fields(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL,
    value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(field_id, entity_id)
);
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access" ON public.custom_field_values FOR SELECT USING (true);
CREATE POLICY "Allow write access based on entity" ON public.custom_field_values FOR ALL USING (true); -- simplify for now

-- 6. Years & Sessions
CREATE TABLE IF NOT EXISTS public.years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to years" ON public.years FOR SELECT USING (true);
CREATE POLICY "Allow admin access to years" ON public.years FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_id UUID NOT NULL REFERENCES public.years(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to sessions" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Allow admin access to sessions" ON public.sessions FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- 7. Messages (Chat System with Mentions)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow users to post messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Exports History
CREATE TABLE IF NOT EXISTS public.exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_type TEXT,
    status TEXT,
    destination TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_by UUID REFERENCES public.users(id)
);
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow admin access to exports" ON public.exports FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));
