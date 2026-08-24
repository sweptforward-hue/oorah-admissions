import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '../src/middleware'

// Mocks for supabase & server
const mockGetUser = vi.fn()
const mockFromSelect = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: () => ({
      select: () => ({
        or: () => ({
          maybeSingle: mockFromSelect,
        }),
      }),
    }),
  }),
}))

const mockServerGetUser = vi.fn()
const mockServerFromSelect = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: () => ({
    auth: {
      getUser: mockServerGetUser,
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: mockServerFromSelect,
        }),
        or: () => ({
          single: mockServerFromSelect,
        }),
      }),
    }),
  }),
}))

const mockRedirect = vi.fn()
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url)
    throw new Error(`REDIRECT:${url}`)
  },
}))

import {
  requireUser,
  requireRole,
  requireAdmin,
  requireVaadMember,
  requireVaadVoter,
} from '../src/lib/auth/authorization'

describe('Middleware & Authorization Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Edge Middleware (src/middleware.ts)', () => {
    it('redirects unauthenticated users to /login on protected routes', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No user') })

      const req = new NextRequest('http://localhost:3000/dashboard')
      const res = await middleware(req)

      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toBe('http://localhost:3000/login')
    })

    it('redirects deactivated users (active === false) to /access-denied?reason=deactivated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'test@example.com' } }, error: null })
      mockFromSelect.mockResolvedValue({ data: { id: 'u1', role: 'staff', active: false } })

      const req = new NextRequest('http://localhost:3000/kids/1042')
      const res = await middleware(req)

      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toBe('http://localhost:3000/access-denied?reason=deactivated')
    })

    it('redirects non-admin users attempting to access /admin routes', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u2', email: 'staff@example.com' } }, error: null })
      mockFromSelect.mockResolvedValue({ data: { id: 'u2', role: 'staff', active: true } })

      const req = new NextRequest('http://localhost:3000/admin/users')
      const res = await middleware(req)

      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toBe('http://localhost:3000/access-denied')
    })

    it('allows active admin users to access /admin routes', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'admin1', email: 'admin@example.com' } }, error: null })
      mockFromSelect.mockResolvedValue({ data: { id: 'admin1', role: 'admin', active: true } })

      const req = new NextRequest('http://localhost:3000/admin/users')
      const res = await middleware(req)

      expect(res.status).toBe(200)
    })

    it('allows active authenticated users to access /dashboard', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'u3', email: 'user@example.com' } }, error: null })
      mockFromSelect.mockResolvedValue({ data: { id: 'u3', role: 'staff', active: true } })

      const req = new NextRequest('http://localhost:3000/dashboard')
      const res = await middleware(req)

      expect(res.status).toBe(200)
    })
  })

  describe('Centralized Authorization Functions (src/lib/auth/authorization.ts)', () => {
    it('requireUser redirects to /login if auth user is missing', async () => {
      mockServerGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') })

      await expect(requireUser()).rejects.toThrow('REDIRECT:/login')
      expect(mockRedirect).toHaveBeenCalledWith('/login')
    })

    it('requireUser redirects deactivated users to /access-denied?reason=deactivated', async () => {
      mockServerGetUser.mockResolvedValue({ data: { user: { id: 'user-deactive', email: 'deactive@example.com' } }, error: null })
      mockServerFromSelect.mockResolvedValue({
        data: { id: 'user-deactive', email: 'deactive@example.com', role: 'staff', active: false, vaad_members: null },
      })

      await expect(requireUser()).rejects.toThrow('REDIRECT:/access-denied?reason=deactivated')
      expect(mockRedirect).toHaveBeenCalledWith('/access-denied?reason=deactivated')
    })

    it('requireUser returns AuthContext for active user', async () => {
      mockServerGetUser.mockResolvedValue({ data: { user: { id: 'user-active', email: 'active@example.com' } }, error: null })
      mockServerFromSelect.mockResolvedValue({
        data: { id: 'user-active', email: 'active@example.com', role: 'staff', active: true, vaad_members: null },
      })

      const ctx = await requireUser()
      expect(ctx.user.id).toBe('user-active')
      expect(ctx.user.active).toBe(true)
    })

    it('requireRole passes for matching role and redirects for non-matching role', async () => {
      mockServerGetUser.mockResolvedValue({ data: { user: { id: 'u-role', email: 'staff@example.com' } }, error: null })
      mockServerFromSelect.mockResolvedValue({
        data: { id: 'u-role', email: 'staff@example.com', role: 'staff', active: true, vaad_members: null },
      })

      const ctx = await requireRole(['staff', 'admin'])
      expect(ctx.user.role).toBe('staff')

      await expect(requireRole('admin')).rejects.toThrow('REDIRECT:/access-denied')
      expect(mockRedirect).toHaveBeenCalledWith('/access-denied')
    })

    it('requireAdmin enforces admin role', async () => {
      mockServerGetUser.mockResolvedValue({ data: { user: { id: 'admin-user', email: 'admin@example.com' } }, error: null })
      mockServerFromSelect.mockResolvedValue({
        data: { id: 'admin-user', email: 'admin@example.com', role: 'admin', active: true, vaad_members: null },
      })

      const ctx = await requireAdmin()
      expect(ctx.user.role).toBe('admin')
    })

    it('requireVaadMember checks active vaad_member status', async () => {
      mockServerGetUser.mockResolvedValue({ data: { user: { id: 'v1', email: 'vaad@example.com' } }, error: null })
      mockServerFromSelect.mockResolvedValue({
        data: {
          id: 'v1',
          email: 'vaad@example.com',
          role: 'staff',
          active: true,
          vaad_members: [{ id: 'vm1', user_id: 'v1', is_active: true, can_contribute: true, can_vote: false }],
        },
      })

      const ctx = await requireVaadMember()
      expect(ctx.user.vaad_member?.is_active).toBe(true)
    })

    it('requireVaadVoter checks can_vote permission', async () => {
      // Non-voter
      mockServerGetUser.mockResolvedValue({ data: { user: { id: 'v1', email: 'vaad@example.com' } }, error: null })
      mockServerFromSelect.mockResolvedValue({
        data: {
          id: 'v1',
          email: 'vaad@example.com',
          role: 'staff',
          active: true,
          vaad_members: [{ id: 'vm1', user_id: 'v1', is_active: true, can_contribute: true, can_vote: false }],
        },
      })

      await expect(requireVaadVoter()).rejects.toThrow('REDIRECT:/access-denied')

      // Voter
      mockServerGetUser.mockResolvedValue({ data: { user: { id: 'v2', email: 'voter@example.com' } }, error: null })
      mockServerFromSelect.mockResolvedValue({
        data: {
          id: 'v2',
          email: 'voter@example.com',
          role: 'staff',
          active: true,
          vaad_members: [{ id: 'vm2', user_id: 'v2', is_active: true, can_contribute: true, can_vote: true }],
        },
      })

      const ctx = await requireVaadVoter()
      expect(ctx.user.vaad_member?.can_vote).toBe(true)
    })
  })
})
