import { describe, it, expect, vi } from 'vitest'
import { GET } from '@/app/api/health/route'

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }),
      })),
    })),
  })),
}))

describe('DevOps Health Check Endpoint (/api/health)', () => {
  it('returns healthy status with system telemetry', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key'

    const response = await GET()
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.status).toBe('ok')
    expect(json.service).toBe('oorah-admissions')
    expect(json.checks.server.status).toBe('healthy')
    expect(json.checks.database.status).toBe('healthy')
    expect(typeof json.uptime).toBe('number')
  })
})
