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

  let camper: Kid | null = null;

  if (error || !camperData) {
    camper = {
      id,
      application_number: id === "1" ? "1042" : id === "2" ? "1043" : id === "3" ? "1044" : "1045",
      name: id === "1" ? "John Smith" : id === "2" ? "Sarah Cohen" : id === "3" ? "David Levy" : "New Camper",
      status: (id === "1" ? "VAAD Review" : id === "2" ? "Accepted" : id === "3" ? "Incomplete" : "New") as KidStatus,
      voting_open: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = camperData as any;
    const statusName = Array.isArray(raw.statuses) ? raw.statuses[0]?.name : raw.statuses?.name;

    camper = {
      id: raw.id,
      application_number: raw.application_number || '1042',
      name: raw.name || (raw.first_name && raw.last_name ? `${raw.first_name} ${raw.last_name}` : 'Camper Record'),
      status: (statusName || 'New') as KidStatus,
      voting_open: raw.voting_open ?? true,
      created_at: raw.created_at || new Date().toISOString(),
      updated_at: raw.updated_at || new Date().toISOString(),
    };
  }

  if (!camper) return notFound();

  const clientCamper = {
    ...camper,
    voting_open: camper.voting_open ?? true,
  };

  const { data: docsData } = await supabase
    .from('documents')
    .select('*')
    .eq('kid_id', id)
    .order('created_at', { ascending: false });

  const fallbackDocs = [
    {
      id: 'doc-demo-1',
      kid_id: id,
      name: `${camper.name}_Application_Form.pdf`,
      file_type: 'application/pdf',
      file_size: 154200,
      drive_file_id: 'drive_demo_app_1',
      document_type: 'Application Forms',
      created_at: camper.created_at,
    },
    {
      id: 'doc-demo-2',
      kid_id: id,
      name: `${camper.name}_Parent_Questionnaire.pdf`,
      file_type: 'application/pdf',
      file_size: 84300,
      drive_file_id: 'drive_demo_parent_2',
      document_type: 'Parent Questionnaire',
      created_at: camper.created_at,
    },
  ];

  const initialDocuments = docsData && docsData.length > 0 ? docsData : fallbackDocs;

  return <CamperDetailClient initialCamper={clientCamper} initialDocuments={initialDocuments} />;
}
