-- Migration 09: Client Categories
-- Table and policies for applicant classifications and client categories

CREATE TABLE IF NOT EXISTS public.client_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50),
    description TEXT,
    color VARCHAR(30) NOT NULL DEFAULT '#3b82f6',
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.client_categories ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
DROP POLICY IF EXISTS "client_categories_select_policy" ON public.client_categories;
CREATE POLICY "client_categories_select_policy" ON public.client_categories
    FOR SELECT TO authenticated
    USING (true);

-- Allow full access for admin users
DROP POLICY IF EXISTS "client_categories_admin_policy" ON public.client_categories;
CREATE POLICY "client_categories_admin_policy" ON public.client_categories
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Allow full access for service role
DROP POLICY IF EXISTS "client_categories_service_role" ON public.client_categories;
CREATE POLICY "client_categories_service_role" ON public.client_categories
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Add optional client_category_id reference on kids table if not exists
ALTER TABLE public.kids ADD COLUMN IF NOT EXISTS client_category_id UUID REFERENCES public.client_categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_kids_client_category_id ON public.kids(client_category_id);

-- Initial default categories if table is empty
INSERT INTO public.client_categories (name, code, description, color, is_active, sort_order)
VALUES
    ('General Camper', 'GEN', 'Standard admissions applicant', '#3b82f6', true, 1),
    ('Scholarship Candidate', 'SCHOL', 'Applicant applying for financial assistance', '#10b981', true, 2),
    ('Oorah Family', 'OORAH_FAM', 'Children of staff, alumni, or affiliated families', '#8b5cf6', true, 3),
    ('Priority Placement', 'PRIORITY', 'Priority placement consideration', '#f59e0b', true, 4)
ON CONFLICT (name) DO NOTHING;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
