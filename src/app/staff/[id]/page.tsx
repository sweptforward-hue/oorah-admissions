import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { getStaffMember } from '@/lib/staff/actions'
import { StaffDetailClient } from '@/components/staff/staff-detail-client'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function StaffDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  const { id } = resolvedParams

  const staff = await getStaffMember(id)

  if (!staff) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <StaffDetailClient initialStaff={staff} />
    </div>
  )
}
