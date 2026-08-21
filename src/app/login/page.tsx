'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createBrowserClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createBrowserClient()
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setLoadingProvider(provider)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
    if (error) {
      setError(error.message)
      setLoadingProvider(null)
    }
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
              Sign in with your verified organizational account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">
                {error}
              </div>
            )}

            {/* Social OAuth Buttons */}
            <div className="space-y-3">
              <Button
                variant="outline"
                type="button"
                className="w-full h-12 flex items-center justify-center gap-3 text-sm font-medium border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
                onClick={() => handleOAuthSignIn('google')}
                disabled={loadingProvider !== null}
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
                {loadingProvider === 'google' ? 'Connecting to Google...' : 'Continue with Google'}
              </Button>

              <Button
                variant="outline"
                type="button"
                className="w-full h-12 flex items-center justify-center gap-3 text-sm font-medium border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
                onClick={() => handleOAuthSignIn('github')}
                disabled={loadingProvider !== null}
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

            <div className="p-3 bg-slate-50 border rounded-lg text-xs text-slate-500 space-y-1">
              <div className="font-semibold text-slate-700">Account Access Note:</div>
              <p>
                Staff and administrators must log in with their assigned Google or GitHub email to inherit their corresponding database roles and permissions.
              </p>
            </div>
          </CardContent>
          <CardFooter className="justify-center border-t pt-4">
            <Link href="/help" className="text-xs text-slate-500 hover:text-slate-800">
              Need assistance? Read the admissions guide
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
