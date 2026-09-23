import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CamperDetailClient } from '@/components/campers/camper-detail-client';
import { Kid, KidStatus } from '@/types';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CamperDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const supabase = await createClient();

  const { data: camperData, error } = await supabase
    .from('kids')
    .select(`
      id,
      application_number,
      first_name,
      last_name,
      name,
      voting_open,
      created_at,
      updated_at,
      statuses ( name )
    `)
    .eq('id', id)
    .single();

  if (error || !camperData) {
    return notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = camperData as any;
  const statusName = Array.isArray(raw.statuses) ? raw.statuses[0]?.name : raw.statuses?.name;

  const camper: Kid = {
    id: raw.id,
    application_number: raw.application_number || `APP-${raw.id.slice(0, 5)}`,
    name: raw.name || (raw.first_name && raw.last_name ? `${raw.first_name} ${raw.last_name}` : 'Camper Record'),
    status: (statusName || 'New') as KidStatus,
    voting_open: raw.voting_open ?? true,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
  };

  const clientCamper = {
    ...camper,
    voting_open: camper.voting_open ?? true,
  };

  const { data: docsData } = await supabase
    .from('documents')
    .select('*')
    .eq('kid_id', id)
    .order('created_at', { ascending: false });

  const initialDocuments = docsData || [];

  return <CamperDetailClient initialCamper={clientCamper} initialDocuments={initialDocuments} />;
}
