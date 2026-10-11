'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const adminNavLinks = [
  { name: 'Overview', href: '/admin' },
  { name: 'Campers', href: '/admin/campers' },
  { name: 'Staff', href: '/admin/staff' },
  { name: 'Users', href: '/admin/users' },
  { name: 'Years', href: '/admin/years' },
  { name: 'Sessions', href: '/admin/sessions' },
  { name: 'Statuses', href: '/admin/statuses' },
  { name: 'VAAD Members', href: '/admin/vaad-members' },
  { name: 'VAAD Choices', href: '/admin/vaad-choices' },
  { name: 'Custom Fields', href: '/admin/custom-fields' },
  { name: 'Exports', href: '/admin/exports' },
  { name: 'Storage', href: '/admin/storage' },
  { name: 'Audit Log', href: '/admin/audit-log' },
  { name: 'Help', href: '/admin/help' },
]

export function AdminSubNav() {
  const pathname = usePathname()

  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-16 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 overflow-x-auto">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-400 mr-4 shrink-0">
            <span>⚙️</span>
            <span>Admin Control Panel</span>
          </div>
          <nav className="flex space-x-1 sm:space-x-2 items-center overflow-x-auto py-2 text-xs font-medium">
            {adminNavLinks.map((link) => {
              const isActive = link.href === '/admin'
                ? pathname === '/admin'
                : pathname?.startsWith(link.href)

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-red-500/20 text-red-300 font-semibold border border-red-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}
