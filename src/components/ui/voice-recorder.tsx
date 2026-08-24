'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Upload, AlertCircle } from 'lucide-react';
import { Button } from './button';
import { validateMediaFile } from '@/lib/media/validation';

interface VoiceRecorderProps {
  onUpload: (blob: Blob, caption: string, duration: number) => Promise<void>;
  isUploading?: boolean;
}

export function VoiceRecorder({ onUpload, isUploading = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preview player state
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Browser does not support microphone audio recording.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const recordedBlob = new Blob(audioChunksRef.current, { type: mimeType });

        // Validate size and mime type
        const validation = validateMediaFile(
          {
            size: recordedBlob.size,
            type: recordedBlob.type,
            name: 'voice_recording.webm',
          },
          'audio'
        );

        if (!validation.valid) {
          setErrorMessage(validation.error || 'Invalid recording');
          setAudioBlob(null);
          setAudioUrl(null);
        } else {
          setAudioBlob(recordedBlob);
          const url = URL.createObjectURL(recordedBlob);
          setAudioUrl(url);
        }

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200); // collect 200ms chunks
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      console.error('Microphone error:', err);
      setErrorMessage('Microphone access was denied or failed. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleDiscard = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setCaption('');
    setErrorMessage(null);
    setIsPreviewPlaying(false);
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current) return;
    if (isPreviewPlaying) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      previewAudioRef.current
        .play()
        .then(() => setIsPreviewPlaying(true))
        .catch((err) => console.error('Preview error:', err));
    }
  };

  const handleUploadClick = async () => {
    if (!audioBlob) return;
    setErrorMessage(null);

    // Final validation check before triggering upload
    const validation = validateMediaFile(
      {
        size: audioBlob.size,
        type: audioBlob.type,
        name: 'voice_recording.webm',
      },
      'audio'
    );

    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid recording');
      return;
    }

    try {
      await onUpload(audioBlob, caption.trim(), recordingTime);
      handleDiscard();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload voice note';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Mic className="h-5 w-5 text-green-600" />
          <span>Record Voice Note</span>
        </h3>
        {isRecording && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-mono font-medium animate-pulse">
            <span className="h-2 w-2 rounded-full bg-red-600"></span>
            <span>Recording: {formatTimer(recordingTime)}</span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!audioBlob ? (
        <div className="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-300">
          {!isRecording ? (
            <div className="text-center space-y-3">
              <p className="text-xs text-slate-500">
                Click start to capture notes directly in browser (Max 25MB)
              </p>
              <Button
                type="button"
                onClick={startRecording}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2 rounded-lg flex items-center gap-2 shadow-sm"
              >
                <Mic className="h-4 w-4" />
                <span>Start Recording</span>
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-sm font-semibold text-slate-700 font-mono">
                {formatTimer(recordingTime)}
              </p>
              <Button
                type="button"
                onClick={stopRecording}
                variant="destructive"
                className="font-medium px-5 py-2 rounded-lg flex items-center gap-2 shadow-sm"
              >
                <Square className="h-4 w-4 fill-current" />
                <span>Stop Recording</span>
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Playback Preview & Caption Input before upload */
        <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Preview Voice Note ({formatTimer(recordingTime)})
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDiscard}
              className="text-slate-500 hover:text-red-600 h-8 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Discard
            </Button>
          </div>

          {audioUrl && (
            <div className="flex items-center gap-3 bg-white p-3 rounded-md border border-slate-200">
              <audio
                ref={previewAudioRef}
                src={audioUrl}
                onEnded={() => setIsPreviewPlaying(false)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={togglePreviewPlay}
                className="h-8 w-8 rounded-full border-green-600 text-green-700 hover:bg-green-50 shrink-0"
                aria-label={isPreviewPlaying ? 'Pause preview' : 'Play preview'}
              >
                {isPreviewPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </Button>
              <div className="text-xs text-slate-600 font-medium flex-1">
                Voice recording preview ready for upload
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="voice-note-caption" className="text-xs font-medium text-slate-700">
              Caption / Context Notes
            </label>
            <input
              id="voice-note-caption"
              type="text"
              placeholder="e.g. Call with parents regarding transportation details..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full text-sm p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="button"
              onClick={handleUploadClick}
              disabled={isUploading}
              className="bg-green-600 hover:bg-green-700 text-white font-medium text-sm px-4 py-2 rounded-md flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              <span>{isUploading ? 'Uploading to Drive...' : 'Save & Upload Voice Note'}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
