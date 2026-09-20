import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()
  let dbStatus = 'unconfigured'
  let dbLatencyMs: number | null = null

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createServerSupabaseClient()
      const dbStart = Date.now()
      const { error } = await supabase.from('years').select('id').limit(1)
      dbLatencyMs = Date.now() - dbStart
      dbStatus = error ? `error: ${error.message}` : 'healthy'
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    dbStatus = `exception: ${message}`
  }

  const responseTimeMs = Date.now() - startTime

  return NextResponse.json(
    {
      status: 'ok',
      service: 'oorah-admissions',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
        server: {
          status: 'healthy',
          responseTimeMs,
        },
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  )
}
