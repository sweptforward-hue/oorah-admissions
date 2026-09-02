-- Migration 01: Canonical Schema for Oorah Admissions Platform
-- Defines all 19 core tables, constraints, indexes, and triggers

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Statuses Table
CREATE TABLE IF NOT EXISTS public.statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL DEFAULT 'admissions',
    color VARCHAR(30) NOT NULL DEFAULT '#6B7280',
    sort_order INT NOT NULL DEFAULT 0,
    is_terminal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'staff',
    active BOOLEAN NOT NULL DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Kids Table
CREATE TABLE IF NOT EXISTS public.kids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20),
    date_of_birth DATE,
    city VARCHAR(100),
    state VARCHAR(50),
    grade VARCHAR(20),
    school VARCHAR(255),
    status_id UUID REFERENCES public.statuses(id) ON DELETE RESTRICT,
    session VARCHAR(50),
    year INT NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    notes TEXT,
    voting_open BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. VAAD Choices
CREATE TABLE IF NOT EXISTS public.vaad_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(30) NOT NULL DEFAULT '#6B7280',
    action VARCHAR(50) NOT NULL DEFAULT 'none',
    sort_order INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. VAAD Members
CREATE TABLE IF NOT EXISTS public.vaad_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    can_vote BOOLEAN NOT NULL DEFAULT true,
    can_contribute BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. VAAD Votes
CREATE TABLE IF NOT EXISTS public.vaad_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    choice_id UUID NOT NULL REFERENCES public.vaad_choices(id) ON DELETE RESTRICT,
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(kid_id, voter_id)
);

-- 7. Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    audio_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Documents
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    drive_file_id VARCHAR(255),
    uploader_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Voice Notes
CREATE TABLE IF NOT EXISTS public.voice_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    drive_file_id VARCHAR(255),
    uploader_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Photos
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
    caption TEXT,
    drive_file_id VARCHAR(255),
    uploader_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Transcripts
CREATE TABLE IF NOT EXISTS public.transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    uploader_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Status History
CREATE TABLE IF NOT EXISTS public.status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
    old_status_id UUID REFERENCES public.statuses(id),
    new_status_id UUID NOT NULL REFERENCES public.statuses(id),
    changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Audit Log
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Exports
CREATE TABLE IF NOT EXISTS public.exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'queued',
    format VARCHAR(50) NOT NULL,
    file_url TEXT,
    requested_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. Custom Field Definitions
CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL DEFAULT 'text',
    options JSONB,
    required BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. Custom Field Values
CREATE TABLE IF NOT EXISTS public.custom_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
    value JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(kid_id, field_id)
);

-- 17. Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    start_date DATE,
    end_date DATE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. Years
CREATE TABLE IF NOT EXISTS public.years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 19. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
