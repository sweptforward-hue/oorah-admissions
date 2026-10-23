'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui'
import { Modal } from '@/components/ui/modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { StaffItem, updateStaffMember, deleteStaffMember } from '@/lib/staff/actions'
import { getRoleVariant } from '@/components/staff/staff-roster-client'

export interface StaffDetailClientProps {
  initialStaff: StaffItem
}

interface StaffDoc {
  id: string
  title: string
  issuer: string
  date: string
  status: string
}

export function StaffDetailClient({ initialStaff }: StaffDetailClientProps) {
  const router = useRouter()
  const [staff, setStaff] = useState<StaffItem>(initialStaff)
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState('overview')

  // Notification state
  const [notification, setNotification] = useState<{
    isOpen: boolean
    title: string
    description: string
  }>({
    isOpen: false,
    title: '',
    description: '',
  })

  const showNotification = (title: string, description: string) => {
    setNotification({ isOpen: true, title, description })
  }

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    first_name: staff.first_name,
    last_name: staff.last_name,
    role_title: staff.role_title,
    department: staff.department,
    email: staff.email || '',
    phone: staff.phone || '',
    session: staff.session || 'Session A',
    year: staff.year || 2026,
    bunk_assignment: staff.bunk_assignment || '',
    notes: staff.notes || '',
  })

  // Cohort & Bunk tab state
  const [cohortSession, setCohortSession] = useState(staff.session || 'Session A')
  const [cohortBunk, setCohortBunk] = useState(staff.bunk_assignment || '')
  const [isSavingCohort, setIsSavingCohort] = useState(false)

  // Notes tab state
  const [notesText, setNotesText] = useState(staff.notes || '')
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  // Certifications list state
  const [certifications, setCertifications] = useState<StaffDoc[]>([])
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false)
  const [docForm, setDocForm] = useState({
    title: '',
    issuer: '',
  })

  // Delete Confirmation State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Status Change Handler
  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === staff.status) return
    const prevStatus = staff.status
    // Optimistic update
    setStaff((prev) => ({ ...prev, status: newStatus }))

    startTransition(async () => {
      const res = await updateStaffMember(staff.id, { status: newStatus })
      if (res.success) {
        showNotification('Status Updated', `Staff status changed to ${newStatus}.`)
      } else {
        setStaff((prev) => ({ ...prev, status: prevStatus }))
        showNotification('Status Update Failed', res.error || 'Failed to update status.')
      }
    })
  }

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editForm.first_name.trim() || !editForm.last_name.trim()) {
      showNotification('Validation Error', 'First and last name are required.')
      return
    }

    if (editForm.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(editForm.email.trim())) {
        showNotification('Validation Error', 'Please enter a valid email address.')
        return
      }
    }

    startTransition(async () => {
      const fullName = `${editForm.first_name.trim()} ${editForm.last_name.trim()}`
      const res = await updateStaffMember(staff.id, {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        role_title: editForm.role_title.trim(),
        department: editForm.department.trim(),
        email: editForm.email.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        session: editForm.session,
        year: editForm.year,
        bunk_assignment: editForm.bunk_assignment.trim() || undefined,
        notes: editForm.notes.trim() || undefined,
      })

      if (res.success) {
        setStaff((prev) => ({
          ...prev,
          first_name: editForm.first_name.trim(),
          last_name: editForm.last_name.trim(),
          name: fullName,
          role_title: editForm.role_title.trim(),
          department: editForm.department.trim(),
          email: editForm.email.trim() || null,
          phone: editForm.phone.trim() || null,
          session: editForm.session,
          year: editForm.year,
          bunk_assignment: editForm.bunk_assignment.trim() || null,
          notes: editForm.notes.trim() || null,
        }))
        setCohortSession(editForm.session)
        setCohortBunk(editForm.bunk_assignment.trim())
        setNotesText(editForm.notes.trim())
        setIsEditModalOpen(false)
        showNotification('Profile Saved', 'Staff member profile successfully updated.')
      } else {
        showNotification('Save Error', res.error || 'Failed to update staff profile.')
      }
    })
  }

  // Save Cohort & Bunk
  const handleSaveCohortBunk = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingCohort(true)

    startTransition(async () => {
      const res = await updateStaffMember(staff.id, {
        session: cohortSession,
        bunk_assignment: cohortBunk.trim() || undefined,
      })

      setIsSavingCohort(false)
      if (res.success) {
        setStaff((prev) => ({
          ...prev,
          session: cohortSession,
          bunk_assignment: cohortBunk.trim() || null,
        }))
        showNotification(
          'Assignment Saved',
          `Assigned to ${cohortSession}${cohortBunk.trim() ? `, Bunk ${cohortBunk.trim()}` : ''}.`
        )
      } else {
        showNotification('Assignment Error', res.error || 'Failed to save cohort assignment.')
      }
    })
  }

  // Save Notes
  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingNotes(true)

    startTransition(async () => {
      const res = await updateStaffMember(staff.id, {
        notes: notesText.trim() || undefined,
      })

      setIsSavingNotes(false)
      if (res.success) {
        setStaff((prev) => ({
          ...prev,
          notes: notesText.trim() || null,
        }))
        setIsEditingNotes(false)
        showNotification('Notes Updated', 'Supervision and evaluation notes updated.')
      } else {
        showNotification('Notes Error', res.error || 'Failed to update notes.')
      }
    })
  }

  // Add Certification Document
  const handleAddCertification = (e: React.FormEvent) => {
    e.preventDefault()
    if (!docForm.title.trim()) return

    const newDoc: StaffDoc = {
      id: `doc-${Date.now()}`,
      title: docForm.title.trim(),
      issuer: docForm.issuer.trim() || 'Verified Agency',
      date: new Date().toLocaleDateString(),
      status: 'Verified',
    }

    setCertifications((prev) => [newDoc, ...prev])
    setDocForm({ title: '', issuer: '' })
    setIsUploadDocModalOpen(false)
    showNotification('Document Added', `${newDoc.title} added to staff profile.`)
  }

  // Delete Staff Handler
  const handleDeleteStaff = async () => {
    startTransition(async () => {
      const res = await deleteStaffMember(staff.id)
      if (res.success) {
        router.push('/staff')
      } else {
        showNotification('Delete Failed', res.error || 'Admin privileges required to delete staff.')
      }
    })
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/staff" className="text-sm font-semibold text-green-700 hover:underline">
              &larr; Back to Staff Directory
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500 font-mono">ID: {staff.application_number}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">{staff.name}</h1>
          <p className="text-sm text-slate-500">
            {staff.role_title} &bull; {staff.department} &bull; Season {staff.year}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getRoleVariant(staff.role_title)}>
            {staff.role_title}
          </Badge>
          <Badge variant={staff.status === 'Active' ? 'success' : staff.status === 'On Leave' ? 'warning' : 'secondary'}>
            {staff.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
            Edit Profile
          </Button>
          <Button variant="destructive" size="sm" disabled={isPending} onClick={() => setIsDeleteDialogOpen(true)}>
            Delete Staff
          </Button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border p-1 rounded-lg">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Certifications & Docs</TabsTrigger>
          <TabsTrigger value="assignment">Session & Bunk</TabsTrigger>
          <TabsTrigger value="notes">Staff Notes</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Staff Profile & Contact</CardTitle>
                <CardDescription>Operational camp personnel details and status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 block text-xs">Email Address</span>
                    <span className="font-medium text-slate-800">{staff.email || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Phone Number</span>
                    <span className="font-medium text-slate-800">{staff.phone || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Department</span>
                    <span className="font-medium text-slate-800">{staff.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Position / Role</span>
                    <span className="font-medium text-slate-800">{staff.role_title}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <span className="text-slate-500 block text-xs mb-2 font-medium">Quick Status Switch</span>
                  <div className="flex gap-2">
                    {['Active', 'On Leave', 'Archived'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleStatusChange(st)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          staff.status === st
                            ? 'bg-green-600 text-white border-green-600 font-semibold shadow-sm'
                            : 'bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cohort Allocation</CardTitle>
                <CardDescription>Camp session and bunk info</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs">Season</span>
                  <span className="font-semibold text-slate-800">Summer {staff.year}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Assigned Cohort</span>
                  <span className="font-semibold text-slate-800">{staff.session || 'All Sessions'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Bunk Assignment</span>
                  <span className="font-semibold text-slate-800">{staff.bunk_assignment || 'Unassigned'}</span>
                </div>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setActiveTab('assignment')}
                  >
                    Change Assignment &rarr;
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Certifications & Docs */}
        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Certifications & Verification Documents</CardTitle>
                <CardDescription>CPR licenses, lifeguard badges, and clearances</CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsUploadDocModalOpen(true)}>
                + Upload Certification
              </Button>
            </CardHeader>
            <CardContent>
              {certifications.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <span className="text-4xl block mb-3">📄</span>
                  <p className="font-medium text-slate-700">No certifications uploaded yet.</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Upload CPR certifications, lifeguard licenses, and background clearances for this staff member.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setIsUploadDocModalOpen(true)}
                  >
                    + Add Certification
                  </Button>
                </div>
              ) : (
                <div className="divide-y border rounded-md">
                  {certifications.map((doc) => (
                    <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="font-medium text-slate-900">{doc.title}</div>
                        <div className="text-xs text-slate-500">
                          Issued by {doc.issuer} &bull; Recorded on {doc.date}
                        </div>
                      </div>
                      <Badge variant="success">{doc.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Session & Bunk Assignment */}
        <TabsContent value="assignment">
          <Card>
            <CardHeader>
              <CardTitle>Session & Bunk Allocation</CardTitle>
              <CardDescription>Assign or update camp session and bunk quarters</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveCohortBunk} className="space-y-4 max-w-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="assign-session" className="block text-xs font-semibold text-slate-700 mb-1">
                      Assigned Session
                    </label>
                    <select
                      id="assign-session"
                      value={cohortSession}
                      onChange={(e) => setCohortSession(e.target.value)}
                      className="w-full border border-slate-300 rounded-md p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      <option value="Session A">Session A</option>
                      <option value="Session B">Session B</option>
                      <option value="All Sessions">All Sessions</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="assign-bunk" className="block text-xs font-semibold text-slate-700 mb-1">
                      Bunk Assignment
                    </label>
                    <Input
                      id="assign-bunk"
                      value={cohortBunk}
                      placeholder="e.g. Bunk A-1"
                      onChange={(e) => setCohortBunk(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" disabled={isSavingCohort || isPending}>
                    {isSavingCohort ? 'Saving...' : 'Save Assignment'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Staff Notes */}
        <TabsContent value="notes">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Staff Supervision Notes</CardTitle>
                <CardDescription>Evaluation notes, performance reviews, and comments</CardDescription>
              </div>
              {!isEditingNotes && (
                <Button size="sm" variant="outline" onClick={() => setIsEditingNotes(true)}>
                  {staff.notes ? 'Edit Notes' : '+ Add Note'}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditingNotes ? (
                <form onSubmit={handleSaveNotes} className="space-y-4">
                  <textarea
                    rows={4}
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Enter counselor supervision notes or performance feedback..."
                    className="w-full border border-slate-300 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNotesText(staff.notes || '')
                        setIsEditingNotes(false)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={isSavingNotes || isPending}>
                      {isSavingNotes ? 'Saving...' : 'Save Notes'}
                    </Button>
                  </div>
                </form>
              ) : staff.notes ? (
                <div className="p-4 bg-slate-50 border rounded-md text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {staff.notes}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <span className="text-4xl block mb-3">📝</span>
                  <p className="font-medium text-slate-700">No supervision notes recorded.</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Record evaluations, counselor certifications, or bunk notes for this staff member.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setIsEditingNotes(true)}
                  >
                    + Add Notes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Profile: ${staff.name}`}
          description="Update staff contact information and operational position"
        >
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">First Name *</label>
                <Input
                  required
                  value={editForm.first_name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, first_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Last Name *</label>
                <Input
                  required
                  value={editForm.last_name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, last_name: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Role Title</label>
                <select
                  value={editForm.role_title}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, role_title: e.target.value }))}
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
                <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
                <Input
                  value={editForm.department}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, department: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Session</label>
                <select
                  value={editForm.session}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, session: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="Session A">Session A</option>
                  <option value="Session B">Session B</option>
                  <option value="All Sessions">All Sessions</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Bunk Assignment</label>
                <Input
                  value={editForm.bunk_assignment}
                  placeholder="e.g. Bunk A-1"
                  onChange={(e) => setEditForm((prev) => ({ ...prev, bunk_assignment: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Supervision Notes</label>
              <textarea
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                Save Profile
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Upload Certification Modal */}
      {isUploadDocModalOpen && (
        <Modal
          isOpen={isUploadDocModalOpen}
          onClose={() => setIsUploadDocModalOpen(false)}
          title="Upload Staff Certification"
          description="Record a professional license, CPR badge, or safety clearance"
        >
          <form onSubmit={handleAddCertification} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Certification Name *
              </label>
              <Input
                required
                placeholder="e.g. Red Cross CPR / AED Certification"
                value={docForm.title}
                onChange={(e) => setDocForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Issuing Organization
              </label>
              <Input
                placeholder="e.g. American Red Cross"
                value={docForm.issuer}
                onChange={(e) => setDocForm((prev) => ({ ...prev, issuer: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsUploadDocModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Certification
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Staff Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteStaff}
        title="Delete Staff Record"
        message={`Are you sure you want to delete ${staff.name}? This action requires administrator permissions and will be logged in the immutable audit trail.`}
        confirmText="Delete Staff Member"
        variant="destructive"
      />

      {/* Notification Modal */}
      <Modal
        isOpen={notification.isOpen}
        onClose={() => setNotification((prev) => ({ ...prev, isOpen: false }))}
        title={notification.title}
        description={notification.description}
      >
        <div className="mt-6 flex justify-end">
          <Button onClick={() => setNotification((prev) => ({ ...prev, isOpen: false }))}>
            OK
          </Button>
        </div>
      </Modal>
    </div>
  )
}
