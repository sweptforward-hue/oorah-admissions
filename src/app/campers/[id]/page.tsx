import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  CamperDetailClient,
  CamperDocument,
  PhotoItem,
  VoiceNoteItem,
  TranscriptItem,
} from '@/components/campers/camper-detail-client';
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
  let photosData: Array<Record<string, unknown>> | null = null;
  let voiceData: Array<Record<string, unknown>> | null = null;
  let transcriptsData: Array<Record<string, unknown>> | null = null;

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

    const [fetchedDocsRes, fetchedPhotosRes, fetchedVoiceRes, fetchedTranscriptsRes] = await Promise.all([
      supabase
        .from('documents')
        .select('*')
        .eq('kid_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('photos')
        .select('*')
        .eq('kid_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('voice_notes')
        .select('*')
        .eq('kid_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('transcripts')
        .select('*')
        .eq('kid_id', id)
        .order('created_at', { ascending: false }),
    ]);

    docsData = fetchedDocsRes.data || null;
    photosData = fetchedPhotosRes.data || null;
    voiceData = fetchedVoiceRes.data || null;
    transcriptsData = fetchedTranscriptsRes.data || null;
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
      drive_url: 'https://drive.google.com/file/d/drive_demo_app_1/preview',
    },
    {
      id: 'doc-demo-2',
      name: `${camper.name}_Parent_Questionnaire.pdf`,
      uploaded_at: camper.created_at,
      type: 'Parent Questionnaire',
      drive_file_id: 'drive_demo_parent_2',
      drive_url: 'https://drive.google.com/file/d/drive_demo_parent_2/preview',
    },
  ];

  const fallbackPhotos: PhotoItem[] = [
    {
      id: 'photo-demo-1',
      caption: `${camper.name} - Official Headshot`,
      created_at: camper.created_at,
      drive_file_id: 'photo_demo_headshot_1',
      drive_url: 'https://drive.google.com/thumbnail?id=photo_demo_headshot_1&sz=w1000',
    },
    {
      id: 'photo-demo-2',
      caption: `${camper.name} - Family Group Photo`,
      created_at: camper.created_at,
      drive_file_id: 'photo_demo_family_2',
      drive_url: 'https://drive.google.com/thumbnail?id=photo_demo_family_2&sz=w1000',
    },
  ];

  const fallbackVoiceNotes: VoiceNoteItem[] = [
    {
      id: 'voice-demo-1',
      title: 'Parent Intake Phone Interview',
      duration_seconds: 145,
      created_at: camper.created_at,
      drive_file_id: 'voice_demo_interview_1',
      drive_url: 'https://drive.google.com/uc?id=voice_demo_interview_1&export=download',
    },
  ];

  const fallbackTranscripts: TranscriptItem[] = [
    {
      id: 'transcript-demo-1',
      title: `${camper.name}_Academic_Report_Card_2024.pdf`,
      created_at: camper.created_at,
      drive_file_id: 'transcript_demo_school_1',
      drive_url: 'https://drive.google.com/file/d/transcript_demo_school_1/preview',
    },
  ];

  const initialDocuments: CamperDocument[] = docsData && docsData.length > 0
    ? docsData.map((d: Record<string, unknown>, idx: number) => {
        const driveId = d.drive_file_id ? String(d.drive_file_id) : undefined;
        return {
          id: String(d.id || `doc-${idx}`),
          name: String(d.name || d.filename || 'Document'),
          uploaded_at: String(d.uploaded_at || d.created_at || '2025-01-01T00:00:00Z'),
          type: String(d.document_type || d.type || 'General'),
          drive_file_id: driveId,
          drive_url: driveId ? `https://drive.google.com/file/d/${driveId}/preview` : (d.drive_url ? String(d.drive_url) : undefined),
        };
      })
    : fallbackDocs;

  const initialPhotos: PhotoItem[] = photosData && photosData.length > 0
    ? photosData.map((p: Record<string, unknown>, idx: number) => {
        const driveId = p.drive_file_id ? String(p.drive_file_id) : undefined;
        return {
          id: String(p.id || `photo-${idx}`),
          caption: String(p.caption || p.filename || 'Camper Photo'),
          created_at: String(p.created_at || new Date().toISOString()),
          drive_file_id: driveId,
          drive_url: driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000` : (p.drive_url ? String(p.drive_url) : undefined),
        };
      })
    : fallbackPhotos;

  const initialVoiceNotes: VoiceNoteItem[] = voiceData && voiceData.length > 0
    ? voiceData.map((v: Record<string, unknown>, idx: number) => {
        const driveId = v.drive_file_id ? String(v.drive_file_id) : undefined;
        return {
          id: String(v.id || `vn-${idx}`),
          title: String(v.title || v.filename || 'Voice Note'),
          duration_seconds: Number(v.duration_seconds ?? v.duration ?? 0),
          created_at: String(v.created_at || new Date().toISOString()),
          drive_file_id: driveId,
          drive_url: driveId ? `https://drive.google.com/uc?id=${driveId}&export=download` : (v.drive_url ? String(v.drive_url) : undefined),
        };
      })
    : fallbackVoiceNotes;

  // Combine direct transcripts table and documents categorized as transcripts
  const docTranscripts = (docsData || []).filter(
    (d: Record<string, unknown>) =>
      String(d.document_type || d.type || '').toLowerCase().includes('transcript')
  );
  const combinedTranscripts = [...(transcriptsData || []), ...docTranscripts];

  const initialTranscripts: TranscriptItem[] = combinedTranscripts.length > 0
    ? combinedTranscripts.map((t: Record<string, unknown>, idx: number) => {
        const driveId = t.drive_file_id ? String(t.drive_file_id) : undefined;
        return {
          id: String(t.id || `tr-${idx}`),
          title: String(t.title || t.name || t.filename || 'Academic Transcript'),
          created_at: String(t.created_at || new Date().toISOString()),
          drive_file_id: driveId,
          drive_url: driveId ? `https://drive.google.com/file/d/${driveId}/preview` : (t.drive_url ? String(t.drive_url) : undefined),
        };
      })
    : fallbackTranscripts;

  return (
    <CamperDetailClient
      initialCamper={clientCamper}
      initialDocuments={initialDocuments}
      initialPhotos={initialPhotos}
      initialVoiceNotes={initialVoiceNotes}
      initialTranscripts={initialTranscripts}
    />
  );
}
