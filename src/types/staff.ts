export type StaffRole =
  | 'Counselor'
  | 'Senior Counselor'
  | 'Division Head'
  | 'Head Counselor'
  | 'Lifeguard'
  | 'Specialist'
  | 'Director'
  | string

export type StaffStatus = 'Active' | 'On Leave' | 'Archived' | string

export interface StaffItem {
  id: string
  application_number: string
  first_name: string
  last_name: string
  name: string
  email: string | null
  phone: string | null
  role_title: string
  department: string
  status: string
  session: string | null
  year: number
  bunk_assignment: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
