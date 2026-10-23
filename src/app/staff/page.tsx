import { Navbar } from '@/components/layout/Navbar'
import { getStaffRoster } from '@/lib/staff/actions'
import { StaffRosterClient } from '@/components/staff/staff-roster-client'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams?: Promise<{
    session?: string
    search?: string
  }>
}

export default async function StaffRosterPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined
  const staff = await getStaffRoster({
    session: params?.session,
    search: params?.search,
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <StaffRosterClient initialStaff={staff} />
      </div>
    </div>
  )
}
