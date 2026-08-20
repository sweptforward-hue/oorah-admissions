-- Users table extension (since Supabase manages auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'staff',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VAAD Voting Choices
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

-- Seed defaults for choices
INSERT INTO public.vaad_voting_choices (name, display_order, color_hex)
VALUES
  ('Accept', 10, '#22c55e'),
  ('Reject', 20, '#ef4444'),
  ('Abstain', 30, '#9ca3af'),
  ('Pending', 40, '#f59e0b')
ON CONFLICT DO NOTHING;
-- Add RLS to VAAD Choices
ALTER TABLE public.vaad_voting_choices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to vaad choices" ON public.vaad_voting_choices FOR SELECT USING (true);

CREATE POLICY "Allow admin full access to vaad choices" ON public.vaad_voting_choices FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);
