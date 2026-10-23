-- Migration 10: Staff Directory and Universal Deletion
-- Establishes public.staff table distinct from public.users authentication accounts,
-- along with RLS policies, indexes, and deletion audit cascades.

CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    email VARCHAR(255),
    phone VARCHAR(50),
    role_title VARCHAR(100) NOT NULL DEFAULT 'Counselor',
    department VARCHAR(100) NOT NULL DEFAULT 'Camp Operations',
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    session VARCHAR(50) DEFAULT 'All Sessions',
    year INT NOT NULL DEFAULT 2026,
    bunk_assignment VARCHAR(100),
    notes TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performant search and session filtering
CREATE INDEX IF NOT EXISTS idx_staff_session ON public.staff(session);
CREATE INDEX IF NOT EXISTS idx_staff_status ON public.staff(status);
CREATE INDEX IF NOT EXISTS idx_staff_year ON public.staff(year);
CREATE INDEX IF NOT EXISTS idx_staff_name ON public.staff(last_name, first_name);

-- Enable Row Level Security (RLS)
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated staff and admins can read staff roster
DROP POLICY IF EXISTS "staff_select_policy" ON public.staff;
CREATE POLICY "staff_select_policy" ON public.staff
    FOR SELECT TO authenticated
    USING (true);

-- RLS Policy: Admins can insert, update, and delete staff records
DROP POLICY IF EXISTS "staff_admin_policy" ON public.staff;
CREATE POLICY "staff_admin_policy" ON public.staff
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

-- RLS Policy: Service role has full unrestricted access
DROP POLICY IF EXISTS "staff_service_role_policy" ON public.staff;
CREATE POLICY "staff_service_role_policy" ON public.staff
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Notify schema reload for PostgREST
NOTIFY pgrst, 'reload schema';
