import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const { pathname } = request.nextUrl

  const protectedPrefixes = [
    '/admin',
    '/dashboard',
    '/campers',
    '/kids',
    '/session-a',
    '/session-b',
  ]

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  if (isProtected) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key'

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }: { name: string; value: string }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: Record<string, unknown> }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (pathname.startsWith('/admin')) {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key'
      const adminSupabase = createServerClient(supabaseUrl, serviceKey, {
        cookies: {
          getAll() {
            return []
          },
          setAll() {},
        },
      })

      const { data: dbUser } = await adminSupabase
        .from('users')
        .select('role, active')
        .eq('id', user.id)
        .single()

      if (dbUser && dbUser.active === false) {
        return NextResponse.redirect(new URL('/access-denied?reason=deactivated', request.url))
      }

      const role = dbUser?.role || 'staff'
      if (role !== 'admin') {
        return NextResponse.redirect(new URL('/access-denied?reason=admin_required', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/dashboard',
    '/campers/:path*',
    '/kids/:path*',
    '/session-a/:path*',
    '/session-b/:path*',
  ],
}

export { proxy as middleware }
