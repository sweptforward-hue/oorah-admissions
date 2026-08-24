import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { UserWithVaadInfo } from '@/types/users'

export type AuthContext = {
  authUser: {
    id: string
    email?: string
  }
  user: UserWithVaadInfo
}

/**
 * Ensures user is authenticated and active.
 * If unauthenticated, redirects to /login.
 * If user.active === false, redirects to /access-denied?reason=deactivated.
 */
export async function requireUser(): Promise<AuthContext> {
  const supabase = createServerSupabaseClient()

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    redirect('/login')
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select(`
      *,
      vaad_members (
        id,
        user_id,
        is_active,
        can_contribute,
        can_vote,
        created_at,
        updated_at
      )
    `)
    .eq('auth_user_id', authUser.id)
    .single()

  // If user profile record not found by auth_user_id, try by email or id
  let profile = userData
  if (userError || !profile) {
    const { data: fallbackUser } = await supabase
      .from('users')
      .select(`
        *,
        vaad_members (
          id,
          user_id,
          is_active,
          can_contribute,
          can_vote,
          created_at,
          updated_at
        )
      `)
      .or(`id.eq.${authUser.id},email.eq.${authUser.email ?? ''}`)
      .single()

    profile = fallbackUser
  }

  if (!profile) {
    redirect('/login')
  }

  const vaadMemberData = Array.isArray(profile.vaad_members)
    ? profile.vaad_members[0]
    : profile.vaad_members

  const user: UserWithVaadInfo = {
    ...profile,
    vaad_member: vaadMemberData || null,
  }

  if (user.active === false) {
    redirect('/access-denied?reason=deactivated')
  }

  return {
    authUser: {
      id: authUser.id,
      email: authUser.email,
    },
    user,
  }
}

/**
 * Ensures user has at least one of the required roles.
 */
export async function requireRole(allowedRoles: string | string[]): Promise<AuthContext> {
  const ctx = await requireUser()
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

  if (!roles.includes(ctx.user.role)) {
    redirect('/access-denied')
  }

  return ctx
}

/**
 * Ensures user is an Admin.
 */
export async function requireAdmin(): Promise<AuthContext> {
  return requireRole('admin')
}

/**
 * Ensures user is an active VAAD member.
 */
export async function requireVaadMember(): Promise<AuthContext> {
  const ctx = await requireUser()

  const isVaad = ctx.user.vaad_member && ctx.user.vaad_member.is_active

  if (!isVaad) {
    redirect('/access-denied')
  }

  return ctx
}

/**
 * Ensures user is an active VAAD member with voting permission.
 */
export async function requireVaadVoter(): Promise<AuthContext> {
  const ctx = await requireVaadMember()

  if (!ctx.user.vaad_member?.can_vote) {
    redirect('/access-denied')
  }

  return ctx
}
