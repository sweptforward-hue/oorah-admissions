1. **Understand requirements**: We need to create a dedicated Staff section (under Admin) to manage staff/users, roles, active/deactivated state, and VAAD permissions (VAAD membership, Can Contribute, Can Vote).
2. **Database schema**: The `public.users` table exists. The `public.vaad_members` table also exists. We need a way to view and manage users from `public.users` and their corresponding `vaad_members` row.
3. **Admin Staff List Page** (`/admin/users/page.tsx`):
   - Fetch users (public.users) and left join `vaad_members`.
   - List users with columns: Name, Email, Role, Active Status, VAAD Member (yes/no), Contribute (yes/no), Vote (yes/no).
   - Actions to Toggle Active state, edit roles, and toggle VAAD settings.
4. **Server Actions** (`src/lib/users/actions.ts`):
   - `updateUser(id, { name, role, active })`
   - `updateVaadPermissions(userId, { isVaadMember, canContribute, canVote })`
     - If `isVaadMember` is true, upsert into `vaad_members`.
     - If false, maybe set `is_active = false` in `vaad_members` or just delete it, or update it. `vaad_members` has `is_active`, `can_contribute`, `can_vote`.
5. **Tests**: Add tests for the new Staff page and actions.
