import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'

export default function AdminDashboard() {
  const sections = [
    { name: 'Campers', path: '/admin/campers', description: 'Manage applicant records & admissions' },
    { name: 'Staff Directory', path: '/admin/staff', description: 'Staff members, roles, and assignments' },
    { name: 'Users & Permissions', path: '/admin/users', description: 'User accounts, permissions, and roles' },
    { name: 'Camp Years', path: '/admin/years', description: 'Academic and summer camp seasons' },
    { name: 'Sessions', path: '/admin/sessions', description: 'Configure Session A, B, and dates' },
    { name: 'Statuses', path: '/admin/statuses', description: 'Application workflow and status pipeline' },
    { name: 'VAAD Members', path: '/admin/vaad-members', description: 'Configure committee voting members' },
    { name: 'VAAD Choices', path: '/admin/vaad-choices', description: 'Configure voting ballots and decisions' },
    { name: 'Custom Fields', path: '/admin/custom-fields', description: 'Design custom application form fields' },
    { name: 'Export Data', path: '/admin/exports', description: 'CSV, Excel, Google Drive and Sheets export' },
    { name: 'Storage & Drive', path: '/admin/storage', description: 'Google Drive and admissions file storage' },
    { name: 'Audit Log', path: '/admin/audit-log', description: 'View system activity and security audit logs' },
    { name: 'Admin Help', path: '/admin/help', description: 'Administrative documentation and user guides' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Control Center</h1>
          <p className="text-slate-500 mt-1">Configure admission workflows, committee members, and integrations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map(section => (
            <Link
              key={section.path}
              href={section.path}
              className="block p-6 border border-slate-200 rounded-xl hover:shadow-md hover:border-green-300 transition-all bg-white group"
            >
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-green-700 transition-colors mb-2">
                {section.name}
              </h2>
              <p className="text-sm text-slate-600">{section.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
