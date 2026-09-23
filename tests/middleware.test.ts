import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '@/proxy'

const mockGetUser = vi.fn()
const mockFromSelect = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((url, key) => {
    return {
      auth: {
        getUser: mockGetUser,
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: mockFromSelect,
          })),
        })),
      })),
    }
  }),
}))

describe('Edge Middleware Security & Access Control', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects unauthenticated request to /admin to /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const request = new NextRequest('http://localhost:3000/admin/users')
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/login')
  })

  it('redirects unauthenticated request to /admin even if user_role=admin cookie is spoofed', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const request = new NextRequest('http://localhost:3000/admin/users', {
      headers: {
        cookie: 'user_role=admin',
      },
    })
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/login')
  })

  it('redirects deactivated user to /access-denied?reason=deactivated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-deactivated-123', email: 'deactivated@oorah.org' } },
      error: null,
    })
    mockFromSelect.mockResolvedValue({
      data: { role: 'admin', active: false },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/admin/users')
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/access-denied?reason=deactivated'
    )
  })

  it('redirects authenticated non-admin user accessing /admin to /access-denied?reason=admin_required', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-staff-123', email: 'staff@oorah.org' } },
      error: null,
    })
    mockFromSelect.mockResolvedValue({
      data: { role: 'staff', active: true },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/admin/users')
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/access-denied?reason=admin_required'
    )
  })

  it('allows authenticated active admin user accessing /admin', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-admin-123', email: 'admin@oorah.org' } },
      error: null,
    })
    mockFromSelect.mockResolvedValue({
      data: { role: 'admin', active: true },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/admin/users')
    const response = await middleware(request)

    // Allowed requests proceed without redirection (not 307 redirect to login or access-denied)
    expect(response.headers.get('location')).toBeNull()
    expect(response.status).toBe(200)
  })
})
