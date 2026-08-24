# Vercel Production Deployment Runbook

This runbook outlines the procedure for deploying the **Oorah Admissions Management System** to production on Vercel.

---

## 🚀 Prerequisites

1. **Vercel Account:** Organization or Team access on Vercel.
2. **Git Repository:** Connected GitHub/GitLab repository.
3. **Configured Infrastructure:**
   - Active Supabase project with database migrations applied.
   - Active Google Cloud Service Account with Google Drive & Sheets API permissions.

---

## 📋 Step 1: Environment Variables Setup

Configure the following environment variables in Vercel under **Project Settings > Environment Variables** for **Production** and **Preview** environments.

| Variable Name | Required | Description | Example / Format |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase Project URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase Anonymous Client Key | `eyJhbGciOiJIUzI1Ni...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase Admin Service Role Key | `eyJhbGciOiJIUzI1Ni...` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Yes | Service Account Email | `admissions-sa@project.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | Yes | Service Account Private Key | `"-----BEGIN PRIVATE KEY-----\n..."` |
| `GOOGLE_PROJECT_ID` | Yes | GCP Project ID | `oorah-admissions-prod` |
| `NEXT_PUBLIC_APP_URL` | Yes | Production Application URL | `https://admissions.oorah.org` |

> ⚠️ **Important:** Ensure newline characters (`\n`) in `GOOGLE_PRIVATE_KEY` are either properly escaped as string literals or entered directly as formatted multiline strings in the Vercel dashboard.

---

## ⚙️ Step 2: Build & Framework Settings

In Vercel **Project Settings > General**:

- **Framework Preset:** `Next.js`
- **Node.js Version:** `20.x` or higher
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm ci`

---

## 🛠️ Step 3: Deployment Pipeline & Branch Strategy

1. **Production Branch:** `main` (or `master`) triggers automatic production deployments.
2. **Preview Deployments:** Pull Requests (PRs) trigger automatic preview deployments with isolated preview URLs.

To trigger a manual CLI deployment:

```bash
# Install Vercel CLI
npm install -g vercel

# Link project
vercel link

# Deploy to Preview
vercel

# Deploy to Production
vercel --prod
```

---

## 🔍 Step 4: Post-Deployment Verification

After deployment completes:

1. **Runtime Env Check:** Access the health check or login page (`https://admissions.oorah.org/login`). If any environment variable is missing, `src/lib/env.ts` will fail closed and log the missing configuration.
2. **Authentication Flow:** Verify Google OAuth / Email sign-in functions as expected.
3. **Database Connectivity:** Verify applicant records display on the main dashboard (`/campers`).
4. **VAAD Voting Verification:** Test a sample vote submission to ensure Supabase RPC executes successfully.
