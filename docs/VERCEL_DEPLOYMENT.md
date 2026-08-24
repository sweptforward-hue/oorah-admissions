# Vercel & Supabase Deployment Runbook

## Environment Variables Configuration
Ensure the following environment variables are set in your Vercel project settings:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_SERVICE_ACCOUNT_EMAIL=sa@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_ROOT_FOLDER_ID=your-root-folder-id
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## Database Deployment
Execute the migrations in order:
1. `supabase/migrations/01_canonical_schema.sql`
2. `supabase/migrations/02_atomic_vaad_rpc.sql`
3. `supabase/migrations/03_row_level_security.sql`
4. `supabase/migrations/04_seed_data.sql`
