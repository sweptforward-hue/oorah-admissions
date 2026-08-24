import { redirect } from 'next/navigation'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function CamperPageRedirect({ params }: PageProps) {
  const resolvedParams = await params
  redirect(`/kids/${resolvedParams.id}`)
}
