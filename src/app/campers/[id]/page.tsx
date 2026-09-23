import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CamperDetailClient, CamperDocument } from '@/components/campers/camper-detail-client';
import { Kid, KidStatus } from '@/types';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CamperDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321'
  );

  let camper: Kid | null = null;
  let docsData: Array<Record<string, unknown>> | null = null;

  if (!hasSupabaseConfig) {
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
      const raw = camperData as Record<string, unknown> & {
        statuses?: { name?: string } | Array<{ name?: string }>;
        first_name?: string;
        last_name?: string;
        name?: string;
        id: string;
        application_number?: string;
        voting_open?: boolean;
        created_at?: string;
        updated_at?: string;
      };
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

    const { data: fetchedDocs } = await supabase
      .from('documents')
      .select('*')
      .eq('kid_id', id)
      .order('created_at', { ascending: false });

    docsData = fetchedDocs;
  }

  if (!camper) return notFound();

  const clientCamper = {
    ...camper,
    voting_open: camper.voting_open ?? true,
  };

  const fallbackDocs: CamperDocument[] = [
    {
      id: 'doc-demo-1',
      name: `${camper.name}_Application_Form.pdf`,
      uploaded_at: camper.created_at,
      type: 'Application Forms',
      drive_file_id: 'drive_demo_app_1',
      drive_url: 'https://drive.google.com',
    },
    {
      id: 'doc-demo-2',
      name: `${camper.name}_Parent_Questionnaire.pdf`,
      uploaded_at: camper.created_at,
      type: 'Parent Questionnaire',
      drive_file_id: 'drive_demo_parent_2',
      drive_url: 'https://drive.google.com',
    },
  ];

  const initialDocuments: CamperDocument[] = docsData && docsData.length > 0
    ? docsData.map((d: Record<string, unknown>, idx: number) => ({
        id: String(d.id || `doc-${idx}`),
        name: String(d.name || d.filename || 'Document'),
        uploaded_at: String(d.uploaded_at || d.created_at || '2025-01-01T00:00:00Z'),
        type: String(d.document_type || d.type || 'General'),
        drive_file_id: d.drive_file_id ? String(d.drive_file_id) : undefined,
        drive_url: d.drive_url ? String(d.drive_url) : undefined,
      }))
    : fallbackDocs;

  return <CamperDetailClient initialCamper={clientCamper} initialDocuments={initialDocuments} />;
}
