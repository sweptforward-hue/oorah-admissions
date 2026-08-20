-- Campers (Kids) table
CREATE TABLE IF NOT EXISTS public.kids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number TEXT NOT NULL,
  name TEXT NOT NULL,
  status_id UUID REFERENCES public.statuses(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add RLS to Kids table
ALTER TABLE public.kids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access to kids" ON public.kids FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access to kids" ON public.kids FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access to kids" ON public.kids FOR UPDATE TO authenticated USING (true);
