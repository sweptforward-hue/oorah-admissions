# Production & Staging Seed Bootstrapping Runbook

This runbook describes the procedure for bootstrapping initial system configuration, master admin users, status options, and VAAD board assignments in new production or staging environments.

---

## 🚀 Overview

Bootstrapping establishes the foundational records required for system operation before admissions staff begin using the web application:

1. Master Admin User Account
2. Configurable Application Statuses
3. Default VAAD Board Members & Permissions
4. Operational Camp Sessions & Custom Fields

---

## 👤 Step 1: Bootstrap Master Admin User

To provision the initial Master Admin user:

1. Sign up/Create the initial user in Supabase Auth via the web UI or SQL console:
   - Email: `admin@oorah.org`
2. Update the user role in `public.users` table:

```sql
-- Assign master admin role in public.users
INSERT INTO public.users (id, auth_user_id, email, name, role, active)
VALUES (
  gen_random_uuid(),
  '<supabase-auth-user-uuid>',
  'admin@oorah.org',
  'Azriel Cohenca',
  'admin',
  true
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  active = true;
```

---

## 📊 Step 2: Seed Configurable Statuses

Execute the status initialization script in `supabase/migrations/20240101000001_admin_tables.sql` or run the following SQL:

```sql
INSERT INTO public.statuses (id, name, description, display_order, is_default, active)
VALUES
  (gen_random_uuid(), 'New', 'Newly submitted application', 1, true, true),
  (gen_random_uuid(), 'Incomplete', 'Missing required forms or materials', 2, false, true),
  (gen_random_uuid(), 'Under Review', 'Staff reviewing application materials', 3, false, true),
  (gen_random_uuid(), 'Interview', 'Scheduled for admissions interview', 4, false, true),
  (gen_random_uuid(), 'VAAD Review', 'Submitted to VAAD board for voting', 5, false, true),
  (gen_random_uuid(), 'Accepted', 'Approved for admission', 6, false, true),
  (gen_random_uuid(), 'Rejected', 'Application declined', 7, false, true),
  (gen_random_uuid(), 'Waitlisted', 'Placed on admissions waitlist', 8, false, true)
ON CONFLICT (name) DO NOTHING;
```

---

## 🗳️ Step 3: Seed VAAD Board Members

Establish the three active VAAD board members in `public.vaad_members`:

```sql
-- Ensure VAAD members exist in public.users, then grant permissions
INSERT INTO public.vaad_members (user_id, is_active, can_contribute, can_vote)
SELECT id, true, true, true
FROM public.users
WHERE email IN ('david.cohen@oorah.org', 'sarah.levy@oorah.org', 'michael.klein@oorah.org')
ON CONFLICT (user_id) DO UPDATE SET
  is_active = true,
  can_contribute = true,
  can_vote = true;
```

---

## 🧪 Step 4: Seed Development & Staging Demo Dataset (Optional)

In non-production development and testing environments, populate initial applicants (`public.campers`):

```sql
INSERT INTO public.campers (application_number, name, status_id)
SELECT '1042', 'John Smith', id FROM public.statuses WHERE name = 'VAAD Review'
ON CONFLICT (application_number) DO NOTHING;

INSERT INTO public.campers (application_number, name, status_id)
SELECT '1043', 'Sarah Cohen', id FROM public.statuses WHERE name = 'Accepted'
ON CONFLICT (application_number) DO NOTHING;
```

---

## ✅ Verification Checklist

- [ ] Log into the application as Master Admin (`admin@oorah.org`).
- [ ] Navigate to `/admin/users` and confirm staff roles and VAAD member checkboxes are correctly rendered.
- [ ] Navigate to `/admin/statuses` and verify default status choices.
- [ ] Create a test applicant on `/campers/new` and confirm page creation.
