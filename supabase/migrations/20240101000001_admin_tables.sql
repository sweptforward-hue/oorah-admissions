-- Statuses
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

-- VAAD Members
CREATE TABLE IF NOT EXISTS public.vaad_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  can_contribute BOOLEAN DEFAULT true,
  can_vote BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Seed default statuses
INSERT INTO public.statuses (name, display_order, active, is_default)
VALUES
  ('New', 10, true, true),
  ('Incomplete', 20, true, false),
  ('Under Review', 30, true, false),
  ('Interview', 40, true, false),
  ('VAAD Review', 50, true, false),
  ('Accepted', 60, true, false),
  ('Rejected', 70, true, false),
  ('Waitlisted', 80, true, false),
  ('Withdrawn', 90, true, false)
ON CONFLICT DO NOTHING;
-- Add RLS to Statuses and VAAD Members
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaad_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to statuses" ON public.statuses FOR SELECT USING (true);
CREATE POLICY "Allow admin full access to statuses" ON public.statuses FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "Allow public read access to vaad members" ON public.vaad_members FOR SELECT USING (true);
CREATE POLICY "Allow admin full access to vaad members" ON public.vaad_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);
