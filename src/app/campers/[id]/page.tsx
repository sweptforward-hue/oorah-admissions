import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  CamperDetailClient,
  CamperDocument,
  PhotoItem,
  VoiceNoteItem,
  TranscriptItem,
  ChatMessage,
} from '@/components/campers/camper-detail-client';
import { KidStatus } from '@/types';

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
      grade,
      school,
      city,
      state,
      session,
      notes,
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

  const raw = camperData as Record<string, unknown> & {
    statuses?: { name?: string } | Array<{ name?: string }>;
    first_name?: string;
    last_name?: string;
    name?: string;
    grade?: string;
    school?: string;
    city?: string;
    state?: string;
    session?: string;
    notes?: string;
    id: string;
    application_number?: string;
    voting_open?: boolean;
    created_at?: string;
    updated_at?: string;
  };

  const statusName = Array.isArray(raw.statuses) ? raw.statuses[0]?.name : raw.statuses?.name;

  const camper = {
    id: raw.id,
    application_number: raw.application_number || '',
    name: raw.name || (raw.first_name && raw.last_name ? `${raw.first_name} ${raw.last_name}` : 'Camper Record'),
    status: (statusName || 'New') as KidStatus,
    voting_open: raw.voting_open ?? true,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
    grade: raw.grade || '',
    school: raw.school || '',
    city: raw.city || '',
    state: raw.state || '',
    session: raw.session || '',
    notes: raw.notes || '',
  };

  const [fetchedDocsRes, fetchedPhotosRes, fetchedVoiceRes, fetchedTranscriptsRes, fetchedChatRes] = await Promise.all([
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
    supabase
      .from('chat_messages')
      .select('id, content, audio_url, created_at, users:author_id(full_name)')
      .eq('kid_id', id)
      .order('created_at', { ascending: true }),
  ]);

  const docsData = fetchedDocsRes.data || [];
  const photosData = fetchedPhotosRes.data || [];
  const voiceData = fetchedVoiceRes.data || [];
  const transcriptsData = fetchedTranscriptsRes.data || [];
  const chatData = fetchedChatRes.data || [];

  const initialDocuments: CamperDocument[] = docsData.map((d: Record<string, unknown>, idx: number) => {
    const driveId = d.drive_file_id ? String(d.drive_file_id) : undefined;
    return {
      id: String(d.id || `doc-${idx}`),
      name: String(d.name || d.filename || 'Document'),
      uploaded_at: String(d.uploaded_at || d.created_at || new Date().toISOString()),
      type: String(d.document_type || d.type || 'General'),
      drive_file_id: driveId,
      drive_url: driveId ? `https://drive.google.com/file/d/${driveId}/preview` : (d.drive_url ? String(d.drive_url) : undefined),
    };
  });

  const initialPhotos: PhotoItem[] = photosData.map((p: Record<string, unknown>, idx: number) => {
    const driveId = p.drive_file_id ? String(p.drive_file_id) : undefined;
    return {
      id: String(p.id || `photo-${idx}`),
      caption: String(p.caption || p.filename || 'Camper Photo'),
      created_at: String(p.created_at || new Date().toISOString()),
      drive_file_id: driveId,
      drive_url: driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000` : (p.drive_url ? String(p.drive_url) : undefined),
    };
  });

  const initialVoiceNotes: VoiceNoteItem[] = voiceData.map((v: Record<string, unknown>, idx: number) => {
    const driveId = v.drive_file_id ? String(v.drive_file_id) : undefined;
    return {
      id: String(v.id || `vn-${idx}`),
      title: String(v.title || v.filename || 'Voice Note'),
      duration_seconds: Number(v.duration_seconds ?? v.duration ?? 0),
      created_at: String(v.created_at || new Date().toISOString()),
      drive_file_id: driveId,
      drive_url: driveId ? `https://drive.google.com/uc?id=${driveId}&export=download` : (v.drive_url ? String(v.drive_url) : undefined),
    };
  });

  // Combine direct transcripts table and documents categorized as transcripts
  const docTranscripts = docsData.filter(
    (d: Record<string, unknown>) =>
      String(d.document_type || d.type || '').toLowerCase().includes('transcript')
  );
  const combinedTranscripts = [...transcriptsData, ...docTranscripts];

  const initialTranscripts: TranscriptItem[] = combinedTranscripts.map((t: Record<string, unknown>, idx: number) => {
    const driveId = t.drive_file_id ? String(t.drive_file_id) : undefined;
    return {
      id: String(t.id || `tr-${idx}`),
      title: String(t.title || t.name || t.filename || 'Academic Transcript'),
      created_at: String(t.created_at || new Date().toISOString()),
      drive_file_id: driveId,
      drive_url: driveId ? `https://drive.google.com/file/d/${driveId}/preview` : (t.drive_url ? String(t.drive_url) : undefined),
    };
  });

  const initialChatMessages: ChatMessage[] = chatData.map((c: Record<string, unknown>) => {
    const userObj = c.users as { full_name?: string } | null;
    const authorName = userObj?.full_name || 'Staff Member';
    const createdAt = c.created_at ? new Date(String(c.created_at)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    let attachment = undefined;
    if (c.audio_url) {
      attachment = {
        type: 'audio' as const,
        name: 'Voice Note Attachment',
        url: String(c.audio_url),
      };
    }
    return {
      id: String(c.id),
      author: authorName,
      content: String(c.content || ''),
      timestamp: createdAt,
      attachment,
    };
  });

  return (
    <CamperDetailClient
      initialCamper={camper}
      initialDocuments={initialDocuments}
      initialPhotos={initialPhotos}
      initialVoiceNotes={initialVoiceNotes}
      initialTranscripts={initialTranscripts}
      initialChatMessages={initialChatMessages}
    />
  );
}
