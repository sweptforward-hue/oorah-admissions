-- Migration 07: Schema alignment with canonical columns
-- Adds voting_open to public.kids and can_contribute to public.vaad_members

ALTER TABLE public.kids ADD COLUMN IF NOT EXISTS voting_open BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.vaad_members ADD COLUMN IF NOT EXISTS can_contribute BOOLEAN NOT NULL DEFAULT false;
