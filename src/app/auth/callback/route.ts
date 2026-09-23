import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  if (error) {
    console.error('OAuth callback error from provider:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    )
  }

  if (code) {
    const cookieStore = await cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key'

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
              })
            )
          } catch {
            // Ignored when invoked in edge response context
          }
        },
      },
    })

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Supabase exchangeCodeForSession error:', exchangeError)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      )
    }

    if (data?.user) {
      const userEmail = data.user.email || ''
      const isMasterAdmin = userEmail.toLowerCase() === 'azrielcohenca@gmail.com'

      // Synchronize authenticated user with public.users
      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, role, active')
          .eq('id', data.user.id)
          .single()

        if (!existingUser) {
          await supabase.from('users').insert({
            id: data.user.id,
            email: userEmail,
            name:
              data.user.user_metadata?.full_name ||
              data.user.user_metadata?.name ||
              userEmail.split('@')[0],
            role: isMasterAdmin ? 'admin' : 'staff',
            active: true,
          })
        } else if (isMasterAdmin && existingUser.role !== 'admin') {
          await supabase
            .from('users')
            .update({ role: 'admin', active: true })
            .eq('id', data.user.id)
        }
      } catch (dbErr) {
        console.warn('Could not sync user profile to public.users:', dbErr)
      }
    }
  }

  // Redirect to requested next destination (defaulting to /dashboard)
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
