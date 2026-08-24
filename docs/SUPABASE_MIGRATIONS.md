# Supabase Migrations & Database Management Runbook

This runbook describes how to execute migrations, maintain schema integrity, manage Row Level Security (RLS) policies, and perform backups for the **Oorah Admissions** Supabase Postgres database.

---

## 🏗️ Schema Overview

The database uses PostgreSQL with Supabase extensions. Primary schemas and tables include:

- `public.users`: Internal user profiles, linked to `auth.users(id)`.
- `public.campers` / `public.kids`: Applicant records, application numbers, status references.
- `public.statuses`: Application workflow stages (e.g. New, Under Review, VAAD Review, Accepted, Rejected).
- `public.status_history`: Complete audit log of status transitions (actor, timestamps, manual/automatic).
- `public.vaad_members`: User permissions for VAAD membership (`can_contribute`, `can_vote`).
- `public.vaad_choices`: Extensible vote options (e.g. Accept, Reject, Further Review).
- `public.vaad_votes`: Persistent record of cast VAAD votes.
- `public.messages` / `public.voice_notes` / `public.documents`: Metadata for communications and external Google Drive files.

---

## 📜 Migration Execution Order

All migrations are stored in the `supabase/migrations/` directory. When initializing a new environment, execute them in sequential order:

1. `20240101000000_init_admin.sql`: User profiles and core tables.
2. `20240101000001_admin_tables.sql`: System settings, statuses, and custom field schema.
3. `20240101000002_campers.sql`: Camper records, application numbering, status linkages.
4. `20240101000002_extra_features.sql`: Activity logs, message metadata, file storage maps.
5. `06_vaad.sql`: VAAD members, choices, votes, and the server-side `submit_vaad_vote` RPC function.
6. `20240101000003_seed_master_admin.sql`: Default admin provisioning and initial status records.

---

## 🛠️ Applying Migrations via Supabase CLI

### Local Development Setup

```bash
# Start local Supabase container stack
npx supabase start

# Apply pending migrations to local instance
npx supabase db reset
```

### Applying Migrations to Remote Production Instance

```bash
# Link local repository to remote Supabase project
npx supabase link --project-ref <your-project-ref>

# Push pending SQL migrations to remote production database
npx supabase db push
```

---

## 🔒 Row Level Security (RLS) & Atomic RPC Functions

- **Server-Side Automatic Acceptance:**
  The `submit_vaad_vote` RPC function enforces voting rules inside PostgreSQL inside a single ACID transaction:
  1. Validates that `auth.uid()` belongs to an active VAAD member with `can_vote = true`.
  2. Ensures the user has not previously voted on the target applicant (`UNIQUE (kid_id, vaad_member_id)`).
  3. Records the vote in `public.vaad_votes`.
  4. Counts total `Accept` votes for the applicant.
  5. If total `Accept` votes >= 2, automatically updates applicant status to `Accepted` in `public.campers` and inserts a record into `public.status_history`.

---

## 💾 Database Backup & Restore Procedure

1. **Daily Automated Backups:** Supabase automatically creates daily point-in-time backups.
2. **Manual CLI Dump:**
   ```bash
   # Export production database schema and data
   npx supabase db dump --project-ref <your-project-ref> -f backup_$(date +%Y%m%d).sql
   ```
