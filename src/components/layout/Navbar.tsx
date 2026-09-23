'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { getCurrentUser } from '@/lib/auth/authorization'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  avatarUrl?: string
}

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [unreadCount] = useState(0)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadUserProfile() {
      try {
        const supabase = createBrowserClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (authUser) {
          const isMasterAdmin = authUser.email?.toLowerCase() === 'azrielcohenca@gmail.com'
          const { data: dbUser } = await supabase
            .from('users')
            .select('name, role')
            .eq('id', authUser.id)
            .single()

          if (isMounted) {
            setUser({
              id: authUser.id,
              name: dbUser?.name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
              email: authUser.email || '',
              role: isMasterAdmin ? 'admin' : (dbUser?.role || 'staff'),
              avatarUrl: authUser.user_metadata?.avatar_url,
            })
          }
        } else {
          // Check server authorization helper
          const serverUser = await getCurrentUser()
          if (serverUser && isMounted) {
            setUser({
              id: serverUser.id,
              name: serverUser.full_name || (serverUser as { name?: string }).name || serverUser.email.split('@')[0],
              email: serverUser.email,
              role: serverUser.role,
            })
          }
        }
      } catch {
        // Unauthenticated or offline
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadUserProfile()

    return () => {
      isMounted = false
    }
  }, [])

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      const supabase = createBrowserClient()
      await supabase.auth.signOut()
    } catch {
      // Ignore signOut network errors
    }
    document.cookie = 'oorah_dev_auth=; path=/; max-age=0;'
    router.push('/login')
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Campers', href: '/campers' },
    { name: 'Session A', href: '/session-a/campers' },
    { name: 'Session B', href: '/session-b/campers' },
    ...(user?.role === 'admin' ? [{ name: 'Admin', href: '/admin' }] : []),
    { name: 'Help', href: '/help' },
  ]

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-green-700 tracking-tight flex items-center gap-2">
                <span>🏕️</span>
                <span>Oorah Admissions</span>
              </Link>
            </div>
            <div className="hidden md:ml-8 md:flex md:space-x-6 items-center">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href))
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors ${
                      isActive
                        ? 'border-green-600 text-green-700 font-semibold'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {link.name}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification indicator */}
            <Link
              href="/dashboard#notifications"
              className="relative p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
              title="Notifications"
              aria-label="Notifications"
            >
              <span className="text-lg">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>

            {loading ? (
              <div className="h-8 w-24 bg-slate-100 animate-pulse rounded"></div>
            ) : user ? (
              <>
                <div className="flex items-center space-x-2 border-l pl-4">
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-8 w-8 rounded-full border border-gray-200 object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center font-bold text-sm">
                      {getInitials(user.name)}
                    </div>
                  )}
                  <div className="hidden sm:block text-xs">
                    <div className="font-semibold text-gray-800">{user.name}</div>
                    <div className="text-gray-500 capitalize">
                      {user.role === 'admin' ? 'Master Admin' : 'Staff Member'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="text-xs text-gray-500 hover:text-red-600 font-medium ml-2 cursor-pointer transition-colors"
                  title="Sign out of your session"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-xs font-semibold bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
