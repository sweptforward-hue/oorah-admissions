import Link from 'next/link'

export default function AdminDashboard() {
  const sections = [
    { name: 'Users', path: '/admin/users', description: 'Manage users and roles' },
    { name: 'Roles', path: '/admin/roles', description: 'Configure custom roles' },
    { name: 'Permissions', path: '/admin/permissions', description: 'Manage access levels' },
    { name: 'VAAD Members', path: '/admin/vaad-members', description: 'Configure VAAD users and permissions' },
    { name: 'VAAD Choices', path: '/admin/vaad-choices', description: 'Configure voting choices' },
    { name: 'Statuses', path: '/admin/statuses', description: 'Manage application statuses' },
    { name: 'Audit Log', path: '/admin/audit-log', description: 'View system activity' },
    { name: 'Export Data', path: '/admin/export', description: 'Google Drive and Sheets export' },
    { name: 'Settings', path: '/admin/settings', description: 'System configuration' }
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Control Center</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map(section => (
          <Link
            key={section.path}
            href={section.path}
            className="block p-6 border rounded-lg hover:shadow-md transition-shadow bg-white"
          >
            <h2 className="text-xl font-semibold mb-2">{section.name}</h2>
            <p className="text-gray-600">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
