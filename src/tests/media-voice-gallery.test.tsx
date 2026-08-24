import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { validateFileSize, validateMimeType, validateMediaFile } from '@/lib/media/validation';
import { AudioPlayer } from '@/components/ui/audio-player';
import { VoiceRecorder } from '@/components/ui/voice-recorder';
import { PhotoGallery } from '@/components/kids/photo-gallery';
import { DocumentManager } from '@/components/kids/document-manager';

describe('Media Validation Utilities', () => {
  test('validates file size within 25MB limit', () => {
    const validSize = 20 * 1024 * 1024; // 20MB
    const invalidSize = 30 * 1024 * 1024; // 30MB

    expect(validateFileSize(validSize).valid).toBe(true);
    expect(validateFileSize(invalidSize).valid).toBe(false);
    expect(validateFileSize(invalidSize).error).toContain('exceeds the strict 25MB limit');
  });

  test('validates MIME types for audio, image, and document categories', () => {
    expect(validateMimeType('audio/webm', 'audio').valid).toBe(true);
    expect(validateMimeType('audio/mp3', 'audio').valid).toBe(true);
    expect(validateMimeType('image/jpeg', 'image').valid).toBe(true);
    expect(validateMimeType('application/pdf', 'document').valid).toBe(true);

    expect(validateMimeType('application/x-executable', 'all').valid).toBe(false);
    expect(validateMimeType('image/png', 'audio').valid).toBe(false);
  });

  test('validateMediaFile handles size and extension fallback', () => {
    const validFile = { size: 1000, type: 'audio/webm', name: 'recording.webm' };
    const oversizedFile = { size: 30 * 1024 * 1024, type: 'audio/webm', name: 'large.webm' };
    const invalidTypeFile = { size: 1000, type: 'application/exe', name: 'test.exe' };

    expect(validateMediaFile(validFile, 'audio').valid).toBe(true);
    expect(validateMediaFile(oversizedFile, 'audio').valid).toBe(false);
    expect(validateMediaFile(invalidTypeFile, 'audio').valid).toBe(false);
  });
});

describe('AudioPlayer Component', () => {
  test('renders audio player controls, speed selector, and duration indicators', () => {
    render(<AudioPlayer src="test.mp3" title="Test Voice Note" durationInSeconds={120} />);

    expect(screen.getByText('Test Voice Note')).toBeInTheDocument();
    expect(screen.getByLabelText('Play audio')).toBeInTheDocument();
    expect(screen.getByLabelText('Playback speed selector')).toBeInTheDocument();
    expect(screen.getByText('2:00')).toBeInTheDocument();
  });

  test('allows changing playback speed', () => {
    render(<AudioPlayer src="test.mp3" durationInSeconds={60} />);

    const speedSelect = screen.getByLabelText('Playback speed selector') as HTMLSelectElement;
    fireEvent.change(speedSelect, { target: { value: '1.5' } });
    expect(speedSelect.value).toBe('1.5');
  });
});

describe('VoiceRecorder Component', () => {
  test('renders initial state with Start Recording button', () => {
    render(<VoiceRecorder onUpload={vi.fn()} />);

    expect(screen.getByText('Record Voice Note')).toBeInTheDocument();
    expect(screen.getByText('Start Recording')).toBeInTheDocument();
  });
});

describe('PhotoGallery Component', () => {
  test('renders upload form and photo gallery header', async () => {
    render(<PhotoGallery kidId="1" />);

    expect(screen.getByText('Upload Camper Photo')).toBeInTheDocument();
    expect(screen.getByLabelText('Custom Photo Caption')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Camper Photo Gallery/i)).toBeInTheDocument();
    });
  });
});

describe('DocumentManager Component', () => {
  test('renders document upload form and document category selector', async () => {
    render(<DocumentManager kidId="1" />);

    expect(screen.getByText('Upload Application Document')).toBeInTheDocument();
    expect(screen.getByLabelText('Document Category')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Uploaded Documents & Forms/i)).toBeInTheDocument();
    });
  });
});
