import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin')) {
    // Check role cookie or authorization parameters
    const roleCookie = request.cookies.get('user_role')?.value
    if (roleCookie && roleCookie !== 'admin') {
      return NextResponse.redirect(new URL('/access-denied?reason=admin_required', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
