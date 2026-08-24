export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/webm',
  'audio/wav',
  'audio/mp3',
  'audio/mpeg',
  'audio/ogg',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
  'audio/aac',
];

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/rtf',
];

export function validateFileSize(sizeInBytes: number): { valid: boolean; error?: string } {
  if (sizeInBytes > MAX_FILE_SIZE_BYTES) {
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeInMB} MB) exceeds the strict 25MB limit.`,
    };
  }
  return { valid: true };
}

export function validateMimeType(
  mimeType: string,
  category: 'audio' | 'image' | 'document' | 'all' = 'all'
): { valid: boolean; error?: string } {
  const normalizedMime = mimeType.toLowerCase().trim();

  let allowedList: string[] = [];
  if (category === 'audio') {
    allowedList = ALLOWED_AUDIO_MIME_TYPES;
  } else if (category === 'image') {
    allowedList = ALLOWED_IMAGE_MIME_TYPES;
  } else if (category === 'document') {
    allowedList = ALLOWED_DOCUMENT_MIME_TYPES;
  } else {
    allowedList = [
      ...ALLOWED_AUDIO_MIME_TYPES,
      ...ALLOWED_IMAGE_MIME_TYPES,
      ...ALLOWED_DOCUMENT_MIME_TYPES,
    ];
  }

  // Handle fallback matching or missing types in webm recordings
  const isAllowed = allowedList.some((type) => normalizedMime.startsWith(type) || normalizedMime === type);

  if (!isAllowed) {
    return {
      valid: false,
      error: `Invalid file type (${mimeType || 'unknown'}). Allowed formats for ${category}: ${allowedList.join(', ')}`,
    };
  }

  return { valid: true };
}

export function validateMediaFile(
  file: { size: number; type: string; name?: string },
  category: 'audio' | 'image' | 'document' | 'all' = 'all'
): { valid: boolean; error?: string } {
  const sizeValidation = validateFileSize(file.size);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  // Infer mime type if type is empty from filename extension
  let mimeType = file.type;
  if (!mimeType && file.name) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'webm') mimeType = 'audio/webm';
    else if (ext === 'mp3') mimeType = 'audio/mp3';
    else if (ext === 'wav') mimeType = 'audio/wav';
    else if (ext === 'm4a') mimeType = 'audio/m4a';
    else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    else if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'webp') mimeType = 'image/webp';
    else if (ext === 'pdf') mimeType = 'application/pdf';
    else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === 'doc') mimeType = 'application/msword';
    else if (ext === 'txt') mimeType = 'text/plain';
  }

  const mimeValidation = validateMimeType(mimeType, category);
  if (!mimeValidation.valid) {
    return mimeValidation;
  }

  return { valid: true };
}
