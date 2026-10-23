import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  CamperDetailClient,
  CamperDocument,
  PhotoItem,
  VoiceNoteItem,
  TranscriptItem,
  ChatMessage,
  ChatAttachment,
} from '@/components/campers/camper-detail-client';
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

  const camper: Kid = {
    id: raw.id,
    application_number: raw.application_number || '',
    name: raw.name || (raw.first_name && raw.last_name ? `${raw.first_name} ${raw.last_name}` : 'Camper Record'),
    status: (statusName || 'New') as KidStatus,
    voting_open: raw.voting_open ?? true,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
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
      .select('id, content, audio_url, attachment_url, attachment_type, attachment_name, duration_seconds, tagged_users, metadata, created_at, users(name, full_name, email)')
      .eq('kid_id', id)
      .order('created_at', { ascending: true }),
  ]);

  const docsData = fetchedDocsRes.data || null;
  const photosData = fetchedPhotosRes.data || null;
  const voiceData = fetchedVoiceRes.data || null;
  const transcriptsData = fetchedTranscriptsRes.data || null;
  const chatData = fetchedChatRes.data || null;

  if (!camper) return notFound();

  const clientCamper = {
    ...camper,
    voting_open: camper.voting_open ?? true,
  };

  const initialDocuments: CamperDocument[] = (docsData || []).map((d: Record<string, unknown>, idx: number) => {
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

  const initialPhotos: PhotoItem[] = (photosData || []).map((p: Record<string, unknown>, idx: number) => {
    const driveId = p.drive_file_id ? String(p.drive_file_id) : undefined;
    return {
      id: String(p.id || `photo-${idx}`),
      caption: String(p.caption || p.filename || 'Camper Photo'),
      created_at: String(p.created_at || new Date().toISOString()),
      drive_file_id: driveId,
      drive_url: driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000` : (p.drive_url ? String(p.drive_url) : undefined),
    };
  });

  const initialVoiceNotes: VoiceNoteItem[] = (voiceData || []).map((v: Record<string, unknown>, idx: number) => {
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
  const docTranscripts = (docsData || []).filter(
    (d: Record<string, unknown>) =>
      String(d.document_type || d.type || '').toLowerCase().includes('transcript')
  );
  const combinedTranscripts = [...(transcriptsData || []), ...docTranscripts];

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

  const initialChatMessages: ChatMessage[] = (chatData || []).map((msg: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userObj = Array.isArray(msg.users) ? msg.users[0] : (msg.users as any);
    const authorName = userObj?.full_name || userObj?.name || userObj?.email?.split('@')[0] || 'Team Member';
    
    let attachment: ChatAttachment | undefined = undefined;
    if (msg.attachment_url) {
      attachment = {
        type: msg.attachment_type === 'audio' ? 'audio' : 'document',
        name: String(msg.attachment_name || (msg.attachment_type === 'audio' ? 'Voice Note' : 'Document')),
        url: String(msg.attachment_url),
        durationSeconds: msg.duration_seconds ? Number(msg.duration_seconds) : undefined,
      };
    } else if (msg.audio_url) {
      attachment = {
        type: 'audio',
        name: String(msg.attachment_name || 'Voice Note Attachment'),
        url: String(msg.audio_url),
        durationSeconds: msg.duration_seconds ? Number(msg.duration_seconds) : undefined,
      };
    } else if (msg.metadata && typeof msg.metadata === 'object' && (msg.metadata as any).attachment) {
      attachment = (msg.metadata as any).attachment;
    }

    const taggedUsers = Array.isArray(msg.tagged_users)
      ? (msg.tagged_users as string[])
      : (msg.metadata && typeof msg.metadata === 'object' && Array.isArray((msg.metadata as any).tagged_users))
      ? (msg.metadata as any).tagged_users
      : undefined;

    return {
      id: String(msg.id),
      author: authorName,
      content: String(msg.content || ''),
      timestamp: msg.created_at ? new Date(String(msg.created_at)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      attachment,
      tagged_users: taggedUsers,
    };
  });

  return (
    <CamperDetailClient
      initialCamper={clientCamper}
      initialDocuments={initialDocuments}
      initialPhotos={initialPhotos}
      initialVoiceNotes={initialVoiceNotes}
      initialTranscripts={initialTranscripts}
      initialChatMessages={initialChatMessages}
    />
  );
}
