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
    const devAuth = request.cookies.get('oorah_dev_auth')?.value
    if (devAuth === 'admin' || devAuth === 'staff') {
      if (pathname.startsWith('/admin') && devAuth !== 'admin') {
        return NextResponse.redirect(new URL('/access-denied?reason=admin_required', request.url))
      }
      return response
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key'

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: (url: RequestInfo | URL, options?: RequestInit) => {
          const isDefaultLocal = supabaseUrl.includes('localhost:54321')
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), isDefaultLocal ? 1500 : 8000)
          return fetch(url, {
            ...options,
            signal: controller.signal,
          }).finally(() => clearTimeout(timeoutId))
        },
      },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Parameters<typeof response.cookies.set>[2] }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
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

      const isMasterAdmin = user.email?.toLowerCase() === 'azrielcohenca@gmail.com'
      const role = isMasterAdmin ? 'admin' : (dbUser?.role || 'staff')
      if (role !== 'admin') {
        return NextResponse.redirect(new URL('/access-denied?reason=admin_required', request.url))
      }
    }
  }

  return response
}

export const middleware = proxy
export default proxy

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
