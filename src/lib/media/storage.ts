import { validateMediaFile } from './validation';

export interface VoiceNoteRecord {
  id: string;
  kid_id: string;
  uploaded_by: string;
  uploader_name: string;
  filename: string;
  caption: string;
  duration: number; // in seconds
  drive_file_id: string;
  audio_url?: string;
  created_at: string;
}

export interface PhotoRecord {
  id: string;
  kid_id: string;
  uploaded_by: string;
  uploader_name: string;
  filename: string;
  caption: string;
  drive_file_id: string;
  image_url: string;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  kid_id: string;
  uploaded_by: string;
  uploader_name: string;
  document_type: string;
  filename: string;
  mime_type: string;
  drive_file_id: string;
  drive_url: string;
  created_at: string;
}

// In-memory mock storage for local demo / fallback state
const mockVoiceNotes: Record<string, VoiceNoteRecord[]> = {
  '1': [
    {
      id: 'vn-1',
      kid_id: '1',
      uploaded_by: 'usr-1',
      uploader_name: 'Sarah Cohen',
      filename: 'parent_call_transportation.webm',
      caption: 'Call with parents regarding transportation arrangements',
      duration: 134,
      drive_file_id: 'gdrive-vn-101',
      audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'vn-2',
      kid_id: '1',
      uploaded_by: 'usr-2',
      uploader_name: 'Rabbi Azriel',
      filename: 'interview_notes.mp3',
      caption: 'Initial interview notes & recommendation summary',
      duration: 85,
      drive_file_id: 'gdrive-vn-102',
      audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ],
};

const mockPhotos: Record<string, PhotoRecord[]> = {
  '1': [
    {
      id: 'ph-1',
      kid_id: '1',
      uploaded_by: 'usr-1',
      uploader_name: 'Sarah Cohen',
      filename: 'camper_portrait.jpg',
      caption: 'Recent passport-style application photo',
      drive_file_id: 'gdrive-ph-201',
      image_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
    {
      id: 'ph-2',
      kid_id: '1',
      uploaded_by: 'usr-3',
      uploader_name: 'David Levy',
      filename: 'recommendation_photo.jpg',
      caption: 'Family gathering recommendation photo',
      drive_file_id: 'gdrive-ph-202',
      image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ],
};

const mockDocuments: Record<string, DocumentRecord[]> = {
  '1': [
    {
      id: 'doc-1',
      kid_id: '1',
      uploaded_by: 'usr-1',
      uploader_name: 'Sarah Cohen',
      document_type: 'Application Form',
      filename: 'John_Smith_Application.pdf',
      mime_type: 'application/pdf',
      drive_file_id: 'gdrive-doc-301',
      drive_url: '#',
      created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    },
    {
      id: 'doc-2',
      kid_id: '1',
      uploaded_by: 'usr-2',
      uploader_name: 'Rabbi Azriel',
      document_type: 'Transcript',
      filename: 'John_Smith_ReportCard_2025.pdf',
      mime_type: 'application/pdf',
      drive_file_id: 'gdrive-doc-302',
      drive_url: '#',
      created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    },
  ],
};

/**
 * Offload audio/binary file payload to Google Drive (simulated) and save metadata record to Postgres
 */
export async function uploadVoiceNote(
  kidId: string,
  file: File | Blob,
  caption: string,
  durationInSeconds: number,
  uploaderName: string = 'Current Staff User'
): Promise<{ success: boolean; data?: VoiceNoteRecord; error?: string }> {
  // Validate file
  const validation = validateMediaFile(
    {
      size: file.size,
      type: file.type,
      name: (file as File).name || 'voicenote.webm',
    },
    'audio'
  );

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Simulate offloading binary payload to Google Drive & getting drive_file_id
  const driveFileId = `gdrive-vn-${Date.now()}`;
  const filename = (file as File).name || `voice_note_${Date.now()}.webm`;

  // Create object URL for local playback preview/persistent play during session
  let audioUrl = '';
  if (typeof window !== 'undefined') {
    audioUrl = URL.createObjectURL(file);
  }

  const newRecord: VoiceNoteRecord = {
    id: `vn-${Date.now()}`,
    kid_id: kidId,
    uploaded_by: 'usr-current',
    uploader_name: uploaderName,
    filename,
    caption,
    duration: Math.round(durationInSeconds),
    drive_file_id: driveFileId,
    audio_url: audioUrl,
    created_at: new Date().toISOString(),
  };

  if (!mockVoiceNotes[kidId]) {
    mockVoiceNotes[kidId] = [];
  }
  mockVoiceNotes[kidId].unshift(newRecord);

  return { success: true, data: newRecord };
}

export async function getVoiceNotesForKid(kidId: string): Promise<VoiceNoteRecord[]> {
  return mockVoiceNotes[kidId] || [];
}

/**
 * Upload Photo
 */
export async function uploadPhoto(
  kidId: string,
  file: File,
  caption: string,
  uploaderName: string = 'Current Staff User'
): Promise<{ success: boolean; data?: PhotoRecord; error?: string }> {
  const validation = validateMediaFile(file, 'image');
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const driveFileId = `gdrive-ph-${Date.now()}`;
  let imageUrl = '';
  if (typeof window !== 'undefined') {
    imageUrl = URL.createObjectURL(file);
  } else {
    imageUrl = 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80';
  }

  const newRecord: PhotoRecord = {
    id: `ph-${Date.now()}`,
    kid_id: kidId,
    uploaded_by: 'usr-current',
    uploader_name: uploaderName,
    filename: file.name,
    caption,
    drive_file_id: driveFileId,
    image_url: imageUrl,
    created_at: new Date().toISOString(),
  };

  if (!mockPhotos[kidId]) {
    mockPhotos[kidId] = [];
  }
  mockPhotos[kidId].unshift(newRecord);

  return { success: true, data: newRecord };
}

export async function getPhotosForKid(kidId: string): Promise<PhotoRecord[]> {
  return mockPhotos[kidId] || [];
}

/**
 * Upload Document
 */
export async function uploadDocument(
  kidId: string,
  file: File,
  documentType: string = 'Application Form',
  uploaderName: string = 'Current Staff User'
): Promise<{ success: boolean; data?: DocumentRecord; error?: string }> {
  const validation = validateMediaFile(file, 'document');
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const driveFileId = `gdrive-doc-${Date.now()}`;
  const newRecord: DocumentRecord = {
    id: `doc-${Date.now()}`,
    kid_id: kidId,
    uploaded_by: 'usr-current',
    uploader_name: uploaderName,
    document_type: documentType,
    filename: file.name,
    mime_type: file.type || 'application/pdf',
    drive_file_id: driveFileId,
    drive_url: '#',
    created_at: new Date().toISOString(),
  };

  if (!mockDocuments[kidId]) {
    mockDocuments[kidId] = [];
  }
  mockDocuments[kidId].unshift(newRecord);

  return { success: true, data: newRecord };
}

export async function getDocumentsForKid(kidId: string): Promise<DocumentRecord[]> {
  return mockDocuments[kidId] || [];
}
