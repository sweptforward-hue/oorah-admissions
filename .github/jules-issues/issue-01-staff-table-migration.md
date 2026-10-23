---
issue_number: 1
title: "feat(staff): create public.staff table migration and RLS policies"
labels: ["julesuse Jules", "database", "staff"]
assignees: ["jules"]
---

## Task Prompt for Jules
Implement and verify PostgreSQL migration `10_staff_and_deletion.sql` for Oorah Admissions:
- Create `public.staff` table with columns: `id`, `application_number`, `first_name`, `last_name`, `name`, `email`, `phone`, `role_title`, `department`, `status`, `session`, `year`, `bunk_assignment`, `notes`, `user_id`, timestamps.
- Enable Row Level Security (RLS) with authenticated read policy and admin write policy.
- Ensure strict separation between operational Staff and authentication Users.
- Store visual verification screenshots in GitHub repository under `audit_evidence/`.
