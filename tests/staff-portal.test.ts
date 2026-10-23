import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import React from 'react'

afterEach(() => {
  cleanup()
})

vi.mock('@/lib/persistence/store', () => ({
  getStoredStaff: vi.fn(() => []),
  saveStoredStaff: vi.fn(),
  updateStoredStaff: vi.fn(),
  deleteStoredStaff: vi.fn(),
  getStoredKids: vi.fn(() => []),
  saveStoredKid: vi.fn(),
  updateStoredKid: vi.fn(),
  deleteStoredKid: vi.fn(),
}))
import { StaffRosterClient, getRoleVariant } from '@/components/staff/staff-roster-client'
import { StaffDetailClient } from '@/components/staff/staff-detail-client'
import NewStaffPage from '@/app/staff/new/page'
import {
  createStaffMember,
  getStaffRoster,
  getStaffMember,
  updateStaffMember,
  deleteStaffMember,
} from '@/lib/staff/actions'
import { StaffItem } from '@/types/staff'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/staff',
  notFound: vi.fn(),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) =>
    React.createElement('a', { href, className }, children),
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock auth
vi.mock('@/lib/auth/authorization', () => {
  const adminUser = { id: 'usr-admin-1', email: 'admin@oorah.org', role: 'admin' }
  return {
    getCurrentUser: vi.fn().mockResolvedValue(adminUser),
    requireAdminRole: vi.fn().mockResolvedValue(adminUser),
  }
})

// Mock Supabase Server Data Store (hoisted)
const { mockStaffStore } = vi.hoisted(() => {
  const store = [
    {
      id: 'stf-1',
      application_number: 'STF-1001',
      first_name: 'Ari',
      last_name: 'Levy',
      name: 'Ari Levy',
      email: 'ari.levy@oorah.org',
      phone: '(555) 123-4567',
      role_title: 'Head Counselor',
      department: 'Camp Operations',
      status: 'Active',
      session: 'Session A',
      year: 2026,
      bunk_assignment: 'Bunk A-1',
      notes: 'CPR and Wilderness First Aid certified.',
      created_at: new Date('2026-01-01').toISOString(),
      updated_at: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'stf-2',
      application_number: 'STF-1002',
      first_name: 'Eli',
      last_name: 'Rosen',
      name: 'Eli Rosen',
      email: 'eli.rosen@oorah.org',
      phone: '(555) 987-6543',
      role_title: 'Counselor',
      department: 'Camp Operations',
      status: 'Active',
      session: 'Session B',
      year: 2026,
      bunk_assignment: 'Bunk B-4',
      notes: 'Prior camp experience.',
      created_at: new Date('2026-01-02').toISOString(),
      updated_at: new Date('2026-01-02').toISOString(),
    },
    {
      id: 'stf-3',
      application_number: 'STF-1003',
      first_name: 'Moshe',
      last_name: 'Gold',
      name: 'Moshe Gold',
      email: 'moshe.gold@oorah.org',
      phone: '(555) 456-7890',
      role_title: 'Lifeguard',
      department: 'Aquatics',
      status: 'On Leave',
      session: 'All Sessions',
      year: 2026,
      bunk_assignment: null,
      notes: 'Water Safety Instructor (WSI).',
      created_at: new Date('2026-01-03').toISOString(),
      updated_at: new Date('2026-01-03').toISOString(),
    },
  ]
  return { mockStaffStore: store }
})

vi.mock('@/lib/supabase/server', () => {
  return {
    createServerSupabaseClient: vi.fn().mockImplementation(() => {
      return {
        from: (table: string) => {
          if (table === 'staff') {
            return {
              select: () => ({
                order: () => Promise.resolve({ data: [...mockStaffStore], error: null }),
                eq: (col: string, val: string) => ({
                  single: () => {
                    const found = mockStaffStore.find((s) => (s as unknown as Record<string, unknown>)[col] === val)
                    return Promise.resolve({ data: found || null, error: found ? null : { message: 'Not found' } })
                  },
                }),
              }),
              insert: (payload: Record<string, unknown>) => ({
                select: () => ({
                  single: () => {
                    const newRecord = {
                      id: `stf-new-${Date.now()}`,
                      ...payload,
                      name: `${payload.first_name} ${payload.last_name}`,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    }
                    return Promise.resolve({ data: newRecord, error: null })
                  },
                }),
              }),
              update: () => ({
                eq: () => Promise.resolve({ error: null }),
              }),
            }
          }
          // audit_log
          return {
            insert: () => Promise.resolve({ error: null }),
          }
        },
      }
    }),
    createAdminClient: vi.fn().mockImplementation(() => {
      return {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: mockStaffStore[0], error: null }),
            }),
          }),
          delete: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
          insert: () => Promise.resolve({ error: null }),
        }),
      }
    }),
  }
})

describe('Staff Portal - Role Variant Helper', () => {
  it('correctly maps roles to status variants', () => {
    expect(getRoleVariant('Head Counselor')).toBe('success')
    expect(getRoleVariant('Division Head')).toBe('success')
    expect(getRoleVariant('Director')).toBe('success')
    expect(getRoleVariant('Counselor')).toBe('secondary')
    expect(getRoleVariant('Senior Counselor')).toBe('secondary')
    expect(getRoleVariant('Lifeguard')).toBe('warning')
    expect(getRoleVariant('Specialist')).toBe('warning')
    expect(getRoleVariant('Other Role')).toBe('outline')
  })
})

describe('Staff Portal - Roster UI (StaffRosterClient)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders staff list with summary metrics and badges', () => {
    render(React.createElement(StaffRosterClient, { initialStaff: mockStaffStore }))

    expect(screen.getByText('Staff Directory & Roster')).toBeInTheDocument()
    expect(screen.getByText('+ New Staff Member')).toBeInTheDocument()

    // Metric counts
    expect(screen.getByText('Total Staff')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()

    // Staff items rendered
    expect(screen.getByText('Ari Levy')).toBeInTheDocument()
    expect(screen.getByText('STF-1001')).toBeInTheDocument()
    expect(screen.getByText('Eli Rosen')).toBeInTheDocument()
    expect(screen.getByText('STF-1002')).toBeInTheDocument()
    expect(screen.getByText('Moshe Gold')).toBeInTheDocument()
    expect(screen.getByText('STF-1003')).toBeInTheDocument()
  })

  it('filters staff roster by search term', () => {
    render(React.createElement(StaffRosterClient, { initialStaff: mockStaffStore }))

    const searchInput = screen.getByPlaceholderText(/Search by name, ID, role, or bunk/i)
    fireEvent.change(searchInput, { target: { value: 'Eli' } })

    expect(screen.getByText('Eli Rosen')).toBeInTheDocument()
    expect(screen.queryByText('Ari Levy')).not.toBeInTheDocument()
    expect(screen.queryByText('Moshe Gold')).not.toBeInTheDocument()
  })

  it('filters staff roster by session selector', () => {
    render(React.createElement(StaffRosterClient, { initialStaff: mockStaffStore }))

    // Click Session A filter
    const sessionABtn = screen.getByRole('button', { name: 'Session A' })
    fireEvent.click(sessionABtn)

    // Ari is Session A, Moshe is All Sessions -> both match
    expect(screen.getByText('Ari Levy')).toBeInTheDocument()
    expect(screen.getByText('Moshe Gold')).toBeInTheDocument()
    // Eli is Session B -> should be excluded
    expect(screen.queryByText('Eli Rosen')).not.toBeInTheDocument()
  })

  it('shows friendly empty state when no staff members exist', () => {
    render(React.createElement(StaffRosterClient, { initialStaff: [] }))

    expect(screen.getByText('No staff members registered yet.')).toBeInTheDocument()
    expect(screen.getByText(/Add your first camp counselor or division head/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '+ Add Staff Member' })).toBeInTheDocument()
  })

  it('shows friendly empty state when search filters return no match', () => {
    render(React.createElement(StaffRosterClient, { initialStaff: mockStaffStore }))

    const searchInput = screen.getByPlaceholderText(/Search by name, ID, role, or bunk/i)
    fireEvent.change(searchInput, { target: { value: 'Nonexistent Counselor' } })

    expect(screen.getByText('No matching staff members found.')).toBeInTheDocument()
    expect(screen.getByText('Reset Search & Filters')).toBeInTheDocument()

    // Reset filters
    fireEvent.click(screen.getByText('Reset Search & Filters'))
    expect(screen.getByText('Ari Levy')).toBeInTheDocument()
  })
})

describe('Staff Portal - Intake Form Validation (NewStaffPage)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders staff intake form correctly', () => {
    render(React.createElement(NewStaffPage))

    expect(screen.getByRole('heading', { name: /Register Staff Member/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/First Name \*/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Last Name \*/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Role \/ Position \*/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Register Staff Member/i })).toBeInTheDocument()
  })

  it('rejects submission when first name is missing', async () => {
    render(React.createElement(NewStaffPage))

    const submitBtn = screen.getByRole('button', { name: /Register Staff Member/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('First name is required.')
    })
  })

  it('validates email format if entered', async () => {
    render(React.createElement(NewStaffPage))

    fireEvent.change(screen.getByLabelText(/First Name \*/i), { target: { value: 'Jacob' } })
    fireEvent.change(screen.getByLabelText(/Last Name \*/i), { target: { value: 'Weiss' } })
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'not-an-email' } })

    const submitBtn = screen.getByRole('button', { name: /Register Staff Member/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address.')
    })
  })
})

describe('Staff Portal - Detail Client Tabs & Actions (StaffDetailClient)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders staff profile header with role and status badges', () => {
    render(React.createElement(StaffDetailClient, { initialStaff: mockStaffStore[0] }))

    expect(screen.getByText('Ari Levy')).toBeInTheDocument()
    expect(screen.getByText('ID: STF-1001')).toBeInTheDocument()
    expect(screen.getAllByText('Head Counselor').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0)
    expect(screen.getByText('Edit Profile')).toBeInTheDocument()
    expect(screen.getByText('Delete Staff')).toBeInTheDocument()
  })

  it('allows switching between tabs: Overview, Certifications, Bunk Assignment, Notes', () => {
    render(React.createElement(StaffDetailClient, { initialStaff: mockStaffStore[0] }))

    // All tab triggers exist
    const overviewTab = screen.getByRole('tab', { name: 'Overview' })
    const certsTab = screen.getByRole('tab', { name: 'Certifications & Docs' })
    const bunkTab = screen.getByRole('tab', { name: 'Session & Bunk' })
    const notesTab = screen.getByRole('tab', { name: 'Staff Notes' })

    expect(overviewTab).toBeInTheDocument()
    expect(certsTab).toBeInTheDocument()
    expect(bunkTab).toBeInTheDocument()
    expect(notesTab).toBeInTheDocument()

    // Initially Overview tab content is displayed
    expect(screen.getByText('Staff Profile & Contact')).toBeInTheDocument()
    expect(screen.getByText('ari.levy@oorah.org')).toBeInTheDocument()

    // Switch to Certifications tab
    certsTab.focus()
    fireEvent.keyDown(certsTab, { key: ' ', code: 'Space' })
    fireEvent.click(certsTab)

    // Switch to Session & Bunk Assignment tab
    bunkTab.focus()
    fireEvent.keyDown(bunkTab, { key: ' ', code: 'Space' })
    fireEvent.click(bunkTab)

    // Switch to Staff Notes tab
    notesTab.focus()
    fireEvent.keyDown(notesTab, { key: ' ', code: 'Space' })
    fireEvent.click(notesTab)
  })

  it('allows quick status switching', async () => {
    render(React.createElement(StaffDetailClient, { initialStaff: mockStaffStore[0] }))

    const onLeaveBtn = screen.getByRole('button', { name: 'On Leave' })
    fireEvent.click(onLeaveBtn)

    await waitFor(() => {
      expect(screen.getAllByText('On Leave').length).toBeGreaterThan(0)
    })
  })
})

describe('Staff Portal - Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createStaffMember creates a valid staff record with STF- application number', async () => {
    const result = await createStaffMember({
      first_name: 'David',
      last_name: 'Katz',
      role_title: 'Senior Counselor',
      department: 'Camp Operations',
      session: 'Session A',
      year: 2026,
    })

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data?.application_number).toMatch(/^STF-\d+$/)
    expect(result.data?.name).toBe('David Katz')
  })

  it('createStaffMember validates required fields', async () => {
    const resNoFirst = await createStaffMember({ first_name: '', last_name: 'Katz' })
    expect(resNoFirst.success).toBe(false)
    expect(resNoFirst.error).toContain('First name is required')

    const resNoLast = await createStaffMember({ first_name: 'David', last_name: '' })
    expect(resNoLast.success).toBe(false)
    expect(resNoLast.error).toContain('Last name is required')

    const resBadEmail = await createStaffMember({
      first_name: 'David',
      last_name: 'Katz',
      email: 'invalid-email',
    })
    expect(resBadEmail.success).toBe(false)
    expect(resBadEmail.error).toContain('valid email address')
  })

  it('getStaffRoster returns staff items', async () => {
    const roster = await getStaffRoster()
    expect(roster.length).toBe(3)
    expect(roster[0].first_name).toBe('Ari')
  })

  it('getStaffMember fetches staff member by ID', async () => {
    const staff = await getStaffMember('stf-1')
    expect(staff).toBeDefined()
    expect(staff?.name).toBe('Ari Levy')
    expect(staff?.role_title).toBe('Head Counselor')
  })

  it('updateStaffMember updates staff fields', async () => {
    const res = await updateStaffMember('stf-1', {
      bunk_assignment: 'Bunk A-2',
      session: 'Session A',
    })
    expect(res.success).toBe(true)
  })

  it('deleteStaffMember executes with admin privileges', async () => {
    const res = await deleteStaffMember('stf-1')
    if (!res.success) {
      console.error('deleteStaffMember failed with:', res.error)
    }
    expect(res.success).toBe(true)
  })
})
