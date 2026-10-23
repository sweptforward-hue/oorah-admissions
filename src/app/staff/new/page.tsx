'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Navbar } from '@/components/layout/Navbar'
import { createStaffMember } from '@/lib/staff/actions'

export default function NewStaffPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role_title: 'Counselor',
    department: 'Camp Operations',
    session: 'Session A',
    year: 2026,
    bunk_assignment: '',
    notes: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.first_name.trim()) {
      setError('First name is required.')
      return
    }

    if (!formData.last_name.trim()) {
      setError('Last name is required.')
      return
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        setError('Please enter a valid email address.')
        return
      }
    }

    setError(null)
    startTransition(async () => {
      const res = await createStaffMember(formData)
      if (res.success) {
        router.push('/staff')
      } else {
        setError(res.error || 'Failed to create staff member.')
      }
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Register Staff Member</h1>
            <p className="text-slate-500 mt-1">Operational staff intake and assignment</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/staff">Cancel</Link>
          </Button>
        </div>

        <Card className="border shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Staff Intake Details</CardTitle>
            <CardDescription>
              Register operational counselors, division heads, and specialists into camp rosters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div
                role="alert"
                className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md flex items-center gap-2"
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-slate-700 mb-1">
                    First Name *
                  </label>
                  <Input
                    id="first_name"
                    name="first_name"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="e.g. David"
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <Input
                    id="last_name"
                    name="last_name"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="e.g. Cohen"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="david.cohen@oorah.org"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(845) 555-0199"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="role_title" className="block text-sm font-medium text-slate-700 mb-1">
                    Role / Position *
                  </label>
                  <select
                    id="role_title"
                    name="role_title"
                    value={formData.role_title}
                    onChange={handleChange}
                    className="w-full h-9 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="Counselor">Counselor</option>
                    <option value="Senior Counselor">Senior Counselor</option>
                    <option value="Division Head">Division Head</option>
                    <option value="Head Counselor">Head Counselor</option>
                    <option value="Lifeguard">Lifeguard</option>
                    <option value="Specialist">Specialist</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-slate-700 mb-1">
                    Department
                  </label>
                  <Input
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Camp Operations"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="session" className="block text-sm font-medium text-slate-700 mb-1">
                    Assigned Session
                  </label>
                  <select
                    id="session"
                    name="session"
                    value={formData.session}
                    onChange={handleChange}
                    className="w-full h-9 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="Session A">Session A</option>
                    <option value="Session B">Session B</option>
                    <option value="All Sessions">All Sessions</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-slate-700 mb-1">
                    Season Year
                  </label>
                  <select
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full h-9 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value={2026}>Summer 2026</option>
                    <option value={2025}>Summer 2025</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="bunk_assignment" className="block text-sm font-medium text-slate-700 mb-1">
                    Bunk Assignment
                  </label>
                  <Input
                    id="bunk_assignment"
                    name="bunk_assignment"
                    value={formData.bunk_assignment}
                    onChange={handleChange}
                    placeholder="e.g. Bunk A-1"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
                  Intake Notes & Certifications
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="CPR/First Aid certified, 3 years prior summer camp experience."
                  className="w-full p-2 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" asChild type="button">
                  <Link href="/staff">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Registering...' : 'Register Staff Member'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
