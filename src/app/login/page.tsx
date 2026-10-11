'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createBrowserClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  const [emailLoading, setEmailLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    return params.get('error_description') || params.get('error') || null
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)

    // Check for OAuth hash parameters (implicit flow)
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const hashError = hashParams.get('error_description') || hashParams.get('error')
      if (hashError) {
        queueMicrotask(() => setError(hashError))
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search)
        }
      } else if (hashParams.get('access_token')) {
        const accessToken = hashParams.get('access_token')!
        const refreshToken = hashParams.get('refresh_token') || ''
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(({ error: setSessionError }) => {
          if (setSessionError) {
            setError(setSessionError.message)
          } else {
            if (window.history && window.history.replaceState) {
              window.history.replaceState(null, '', window.location.pathname + window.location.search)
            }
            const next = params.get('next') || '/dashboard'
            router.push(next)
            router.refresh()
          }
        }).catch((err: unknown) => {
          setError((err as Error).message || 'Failed to establish session')
        })
      }
    }

    // 3. Listen for auth state changes (e.g. if OAuth finishes on client)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        const next = params.get('next') || '/dashboard'
        router.push(next)
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please provide both email and password.')
      return
    }

    setEmailLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) {
          setError(signUpError.message)
        } else {
          setMessage('Account created! Please check your email for confirmation or sign in.')
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) {
          setError(signInError.message)
        } else {
          const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
          const next = searchParams?.get('next') || '/dashboard'
          router.push(next)
          router.refresh()
        }
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Authentication failed')
    } finally {
      setEmailLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setLoadingProvider(provider)
    setError(null)
    setMessage(null)

    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    const nextDestination = searchParams?.get('next') || '/dashboard'

    const options: {
      redirectTo: string
    } = {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextDestination)}`,
    }

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider,
      options,
    })
    if (signInError) {
      setError(signInError.message)
      setLoadingProvider(null)
    }
  }

  const handleDevBypass = (role: 'admin' | 'staff') => {
    document.cookie = `oorah_dev_auth=${role}; path=/; max-age=86400; SameSite=Lax`
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">🏕️</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Oorah Admissions Portal</h1>
          <p className="text-sm text-slate-600">Secure staff & administration access</p>
        </div>

        <Card className="shadow-md border-slate-200">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>
              Sign in with your email or Google account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
                {error}
              </div>
            )}
            {message && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-700">
                {message}
              </div>
            )}

            {/* Email / Password Sign In */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Email</label>
                <Input
                  type="email"
                  placeholder="name@oorah.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={emailLoading || loadingProvider !== null}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={emailLoading || loadingProvider !== null}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-colors shadow-sm"
                disabled={emailLoading || loadingProvider !== null}
              >
                {emailLoading
                  ? isSignUp
                    ? 'Creating Account...'
                    : 'Signing In...'
                  : isSignUp
                  ? 'Sign Up with Email'
                  : 'Sign In with Email'}
              </Button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError(null)
                    setMessage(null)
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {isSignUp
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up with email"}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-semibold">Or continue with</span>
              </div>
            </div>

            {/* Social OAuth Buttons */}
            <div className="space-y-3">
              {/* Google Sign In with drive.file scope */}
              <Button
                variant="outline"
                type="button"
                className="w-full h-11 flex items-center justify-center gap-3 text-sm font-medium border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
                onClick={() => handleOAuthSignIn('google')}
                disabled={loadingProvider !== null || emailLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                {loadingProvider === 'google' ? 'Connecting to Google...' : 'Sign In with Google'}
              </Button>

              {/* GitHub OAuth */}
              <Button
                variant="outline"
                type="button"
                className="w-full h-11 flex items-center justify-center gap-3 text-sm font-medium border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
                onClick={() => handleOAuthSignIn('github')}
                disabled={loadingProvider !== null || emailLoading}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
                {loadingProvider === 'github' ? 'Connecting to GitHub...' : 'Continue with GitHub'}
              </Button>
            </div>

            {/* Dev Mode Quick Sign-In */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-semibold">Dev & Testing Bypass</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                type="button"
                className="w-full h-10 text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 transition-colors shadow-sm"
                onClick={() => handleDevBypass('admin')}
              >
                ⚡ Sign In as Admin
              </Button>
              <Button
                variant="outline"
                type="button"
                className="w-full h-10 text-xs font-semibold bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100 transition-colors shadow-sm"
                onClick={() => handleDevBypass('staff')}
              >
                👤 Sign In as Staff
              </Button>
            </div>

            <div className="p-3 bg-slate-50 border rounded-lg text-xs text-slate-500 space-y-1">
              <div className="font-semibold text-slate-700">Google Authentication Note:</div>
              <p>
                Staff sign-in uses standard Google authentication (profile & email) with zero verification barriers. Document and contract storage is securely handled via the backend service integration scoped to <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">drive.file</code>.
              </p>
            </div>
          </CardContent>
          <CardFooter className="justify-center border-t pt-4">
            <Link href="/help" className="text-xs text-slate-500 hover:text-slate-800">
              Need technical support or access credentials? View User Guide
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
