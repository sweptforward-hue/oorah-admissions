'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export function Navbar() {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Simulated notification count for demonstration/active user
    setUnreadCount(2)
  }, [])

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Campers', href: '/campers' },
    { name: 'Session A', href: '/session-a/campers' },
    { name: 'Session B', href: '/session-b/campers' },
    { name: 'Admin', href: '/admin' },
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
            >
              <span className="text-lg">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>

            <div className="flex items-center space-x-2 border-l pl-4">
              <div className="h-8 w-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center font-bold text-sm">
                AC
              </div>
              <div className="hidden sm:block text-xs">
                <div className="font-semibold text-gray-800">Azriel Cohenca</div>
                <div className="text-gray-500">Master Admin</div>
              </div>
            </div>

            <Link
              href="/login"
              className="text-xs text-gray-500 hover:text-gray-700 ml-2"
            >
              Switch Account
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
