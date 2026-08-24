import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const pathname = request.nextUrl.pathname

  // Protected route prefixes
  const isProtected =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/kids') ||
    pathname.startsWith('/vaad') ||
    pathname.startsWith('/dashboard')

  if (!isProtected) {
    return response
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key'

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Parameters<typeof response.cookies.set>[2] }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Fetch user profile from database to check active status and role
  const { data: dbUser } = await supabase
    .from('users')
    .select('id, role, active')
    .or(`auth_user_id.eq.${authUser.id},id.eq.${authUser.id},email.eq.${authUser.email ?? ''}`)
    .maybeSingle()

  if (dbUser && dbUser.active === false) {
    const deactivatedUrl = request.nextUrl.clone()
    deactivatedUrl.pathname = '/access-denied'
    deactivatedUrl.searchParams.set('reason', 'deactivated')
    return NextResponse.redirect(deactivatedUrl)
  }

  if (pathname.startsWith('/admin') && dbUser && dbUser.role !== 'admin') {
    const accessDeniedUrl = request.nextUrl.clone()
    accessDeniedUrl.pathname = '/access-denied'
    return NextResponse.redirect(accessDeniedUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/kids/:path*',
    '/vaad/:path*',
    '/dashboard/:path*',
    '/dashboard',
  ],
}
