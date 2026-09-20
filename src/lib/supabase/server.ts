import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key'

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })
}

export function createServerSupabaseClient() {
  // Synchronous fallback or wrapper using cookies store when possible
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key'

  try {
    // In server component or server action context
    const cookieStore = cookies() as unknown as {
      getAll?: () => Array<{ name: string; value: string }>
      set?: (name: string, value: string, options?: Record<string, unknown>) => void
    }
    if (cookieStore && typeof cookieStore.getAll === 'function') {
      return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll ? cookieStore.getAll() : []
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                if (cookieStore.set) cookieStore.set(name, value, options)
              })
            } catch {
              // Ignore if called from Server Component
            }
          },
        },
      })
    }
  } catch {
    // Fallback if cookies() is not available (e.g. static rendering or background task)
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
  })
}
