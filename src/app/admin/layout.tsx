import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 overflow-x-auto">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-gray-900">
                  OORAH ADMISSIONS
                </Link>
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">Admin</span>
              </div>
              <nav className="ml-8 flex space-x-4 items-center">
                <Link href="/admin" className="text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Dashboard</Link>
                <Link href="/admin/campers" className="text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Campers</Link>
                <Link href="/admin/staff" className="text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Staff</Link>
                <Link href="/admin/users" className="text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Users</Link>
                <Link href="/admin/years" className="text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Years</Link>
                <Link href="/admin/sessions" className="text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Sessions</Link>
                <Link href="/admin/statuses" className="text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Statuses</Link>
                <Link href="/admin/vaad-choices" className="text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Voting</Link>
                <Link href="/admin/custom-fields" className="text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Custom Fields</Link>
                <Link href="/admin/exports" className="text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Exports</Link>
                <Link href="/admin/storage" className="text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Storage</Link>
                <Link href="/admin/audit-log" className="text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Audit Log</Link>
                <Link href="/admin/help" className="text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">Help</Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
