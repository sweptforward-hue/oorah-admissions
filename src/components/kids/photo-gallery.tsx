'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, ZoomIn, X, Calendar, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhotoRecord, getPhotosForKid, uploadPhoto } from '@/lib/media/storage';
import { validateMediaFile } from '@/lib/media/validation';

interface PhotoGalleryProps {
  kidId: string;
}

export function PhotoGallery({ kidId }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPhotoForZoom, setSelectedPhotoForZoom] = useState<PhotoRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadPhotos();
  }, [kidId]);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const records = await getPhotosForKid(kidId);
      setPhotos(records);
    } catch (err: unknown) {
      console.error('Error loading photos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validation = validateMediaFile(file, 'image');
      if (!validation.valid) {
        setErrorMessage(validation.error || 'Invalid photo file');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setErrorMessage(null);

    try {
      const result = await uploadPhoto(kidId, selectedFile, caption.trim());
      if (result.success && result.data) {
        setPhotos((prev) => [result.data!, ...prev]);
        setSelectedFile(null);
        setCaption('');
      } else {
        setErrorMessage(result.error || 'Failed to upload photo');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2 border-b pb-3">
          <ImageIcon className="h-5 w-5 text-green-600" />
          <span>Upload Camper Photo</span>
        </h3>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="photo-file" className="text-xs font-medium text-slate-700">
                Select Photo (JPG, PNG, WebP, GIF max 25MB)
              </label>
              <input
                id="photo-file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="photo-caption" className="text-xs font-medium text-slate-700">
                Custom Photo Caption
              </label>
              <input
                id="photo-caption"
                type="text"
                placeholder="e.g. Portrait photo for admissions record"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full text-sm p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!selectedFile || uploading}
              className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-md flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              <span>{uploading ? 'Uploading...' : 'Upload Photo'}</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Gallery Grid */}
      <div>
        <h4 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wider">
          Camper Photo Gallery ({photos.length})
        </h4>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading photos...</div>
        ) : photos.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500">
            No photos uploaded yet. Use the upload box above to add pictures.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={photo.image_url}
                    alt={photo.caption || photo.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedPhotoForZoom(photo)}
                      className="bg-white/90 text-slate-900 hover:bg-white text-xs font-medium flex items-center gap-1.5 shadow-md"
                    >
                      <ZoomIn className="h-4 w-4" />
                      <span>Zoom / View</span>
                    </Button>
                  </div>
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <p className="text-sm font-medium text-slate-900 line-clamp-2">
                    {photo.caption || photo.filename}
                  </p>
                  <div className="text-xs text-slate-500 flex items-center justify-between border-t pt-2">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 text-slate-400" />
                      {photo.uploader_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {new Date(photo.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox / Zoom Modal */}
      {selectedPhotoForZoom && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-semibold text-slate-900 truncate">
                {selectedPhotoForZoom.caption || selectedPhotoForZoom.filename}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSelectedPhotoForZoom(null)}
                className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-900"
                aria-label="Close photo view"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-950 flex items-center justify-center">
              <img
                src={selectedPhotoForZoom.image_url}
                alt={selectedPhotoForZoom.caption || selectedPhotoForZoom.filename}
                className="max-h-[65vh] w-auto object-contain rounded-md"
              />
            </div>

            <div className="p-4 bg-white border-t flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-xs text-slate-600">
              <div>
                <span className="font-semibold text-slate-800">Caption: </span>
                <span>{selectedPhotoForZoom.caption || 'No caption provided.'}</span>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span>
                  <strong>Uploader:</strong> {selectedPhotoForZoom.uploader_name}
                </span>
                <span>
                  <strong>Uploaded:</strong>{' '}
                  {new Date(selectedPhotoForZoom.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
