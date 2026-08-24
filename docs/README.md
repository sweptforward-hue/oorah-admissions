# Oorah Admissions System — Operations & Deployment Runbooks

Welcome to the production deployment and operational runbooks documentation for the **Oorah Admissions Management System**.

## 📚 Runbook Index

1. **[Vercel Production Deployment Runbook](./DEPLOYMENT.md)**
   - Step-by-step instructions for deploying the Next.js App Router application on Vercel.
   - Production build settings, custom domain mapping, environment variable management, and zero-downtime deployment pipelines.

2. **[Supabase Migrations & Database Management Runbook](./SUPABASE_MIGRATIONS.md)**
   - Supabase project initialization, CLI migration workflow, and SQL migration execution order.
   - Row Level Security (RLS) policy enforcement, database indexing, transaction integrity, and automated backups.

3. **[Google Cloud Platform IAM & Service Account Runbook](./GOOGLE_CLOUD_IAM.md)**
   - GCP Project setup, enabling Google Drive & Google Sheets APIs.
   - Service account creation, JSON key management, permission scopes, and organization-wide Drive folder delegation.

4. **[Seed Bootstrapping & Initial Configuration Runbook](./SEED_BOOTSTRAPPING.md)**
   - Initial bootstrapping for staging and production environments.
   - Master Admin account provisioning, default status configuration, initial VAAD board assignment, and demo dataset population.

---

## 🔒 Security & Compliance Summary

- **Fail-Closed Configuration:** All application environment variables are strictly validated at runtime via `src/lib/env.ts`. Missing or malformed keys fail closed on application startup.
- **Transactional Integrity:** VAAD 2-of-3 automatic acceptance is enforced via server-side PostgreSQL RPC transactions (`submit_vaad_vote`).
- **Least-Privilege Storage:** Sensitive documents, photos, and voice notes are stored as references pointing to external Google Drive storage rather than raw database blobs.
