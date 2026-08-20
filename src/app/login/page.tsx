'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('Azrielcohenca@gmail.com')
  const [password, setPassword] = useState('••••••••••••')
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      router.push('/dashboard')
    }, 500)
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">🏕️</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Oorah Admissions Portal</h1>
          <p className="text-sm text-slate-600">Sign in to your staff or admin workspace</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-xs text-green-800">
                <strong>Master Admin preset:</strong> Azrielcohenca@gmail.com is configured with top-level system authority and RLS permissions.
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>
              <Link href="/help" className="text-xs text-center text-slate-500 hover:text-slate-800">
                Need assistance? Read admissions guide
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
