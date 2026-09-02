import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key'

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }: { name: string; value: string }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) =>
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

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
