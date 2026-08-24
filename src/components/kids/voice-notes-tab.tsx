'use client';

import React, { useState, useEffect } from 'react';
import { Mic, Calendar, User, FileAudio, ExternalLink } from 'lucide-react';
import { VoiceRecorder } from '@/components/ui/voice-recorder';
import { AudioPlayer } from '@/components/ui/audio-player';
import { Button } from '@/components/ui/button';
import { VoiceNoteRecord, getVoiceNotesForKid, uploadVoiceNote } from '@/lib/media/storage';

interface VoiceNotesTabProps {
  kidId: string;
}

export function VoiceNotesTab({ kidId }: VoiceNotesTabProps) {
  const [voiceNotes, setVoiceNotes] = useState<VoiceNoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadVoiceNotes();
  }, [kidId]);

  const loadVoiceNotes = async () => {
    setLoading(true);
    try {
      const records = await getVoiceNotesForKid(kidId);
      setVoiceNotes(records);
    } catch (err: unknown) {
      console.error('Error loading voice notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadVoiceNote = async (blob: Blob, caption: string, duration: number) => {
    setIsUploading(true);
    try {
      const result = await uploadVoiceNote(kidId, blob, caption, duration);
      if (result.success && result.data) {
        setVoiceNotes((prev) => [result.data!, ...prev]);
      } else {
        throw new Error(result.error || 'Failed to upload voice note');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HTML5 Voice Recorder */}
      <VoiceRecorder onUpload={handleUploadVoiceNote} isUploading={isUploading} />

      {/* Voice Notes History & Custom Audio Players */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center justify-between">
          <span>Camper Voice Notes & Recordings ({voiceNotes.length})</span>
        </h4>

        {loading ? (
          <div className="p-6 text-center text-slate-500">Loading voice notes...</div>
        ) : voiceNotes.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500">
            No voice notes recorded yet. Use the voice recorder above to record audio notes.
          </div>
        ) : (
          <div className="space-y-4">
            {voiceNotes.map((note) => (
              <div
                key={note.id}
                className="p-4 border border-slate-200 rounded-xl bg-white shadow-xs space-y-3 hover:border-slate-300 transition-colors"
              >
                {/* Header Metadata */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <FileAudio className="h-4 w-4 text-green-600" />
                    <span>{note.caption || note.filename}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 text-slate-400" />
                      {note.uploader_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {new Date(note.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Custom Audio Player */}
                <AudioPlayer
                  src={note.audio_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'}
                  durationInSeconds={note.duration}
                  title={`Voice Note by ${note.uploader_name}`}
                />

                {/* Storage Offload Reference */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span className="font-mono text-slate-400">
                    Google Drive ID: {note.drive_file_id}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 p-0"
                    onClick={() => alert(`Offloaded to Google Drive (ID: ${note.drive_file_id})`)}
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>View in Drive</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
