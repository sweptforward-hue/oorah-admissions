import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/auth/callback/route'

const mockExchangeCodeForSession = vi.fn()
const mockCookieSet = vi.fn()
const mockCookieGet = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((url, key, options) => {
    // Execute setAll callback if provided during mock initialization
    if (options?.cookies?.setAll) {
      options.cookies.setAll([{ name: 'sb-access-token', value: 'token-123', options: {} }])
    }
    return {
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession,
      },
    }
  }),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [{ name: 'test-cookie', value: '123' }],
    get: mockCookieGet,
    set: mockCookieSet,
  })),
}))

describe('OAuth PKCE Callback Route Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exchanges authorization code and redirects to default /dashboard', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null })

    const request = new Request('http://localhost:3000/auth/callback?code=valid-pkce-code')
    const response = await GET(request)

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('valid-pkce-code')
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')
    expect(mockCookieSet).toHaveBeenCalledWith('sb-access-token', 'token-123', {})
  })

  it('redirects to next parameter (/admin/storage) after successful PKCE exchange', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null })

    const request = new Request('http://localhost:3000/auth/callback?code=drive-code&next=/admin/storage')
    const response = await GET(request)

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('drive-code')
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/admin/storage')
  })

  it('redirects to /login with error if OAuth provider returned error parameter', async () => {
    const request = new Request(
      'http://localhost:3000/auth/callback?error=access_denied&error_description=User%20denied%20consent'
    )
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/login?error=User%20denied%20consent'
    )
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled()
  })

  it('redirects to /login with error if authorization code is missing', async () => {
    const request = new Request('http://localhost:3000/auth/callback')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/login?error=Missing%20authorization%20code'
    )
  })

  it('redirects to /login with error if code exchange fails', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      error: { message: 'Invalid PKCE code verifier' },
    })

    const request = new Request('http://localhost:3000/auth/callback?code=invalid-code')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/login?error=Invalid%20PKCE%20code%20verifier'
    )
  })
})
