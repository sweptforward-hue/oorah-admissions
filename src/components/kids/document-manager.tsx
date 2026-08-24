'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Upload, Download, ExternalLink, Calendar, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentRecord, getDocumentsForKid, uploadDocument } from '@/lib/media/storage';
import { validateMediaFile } from '@/lib/media/validation';

interface DocumentManagerProps {
  kidId: string;
}

export function DocumentManager({ kidId }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState('Application Form');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [kidId]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const records = await getDocumentsForKid(kidId);
      setDocuments(records);
    } catch (err: unknown) {
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validation = validateMediaFile(file, 'document');
      if (!validation.valid) {
        setErrorMessage(validation.error || 'Invalid document file');
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
      const result = await uploadDocument(kidId, selectedFile, documentType);
      if (result.success && result.data) {
        setDocuments((prev) => [result.data!, ...prev]);
        setSelectedFile(null);
      } else {
        setErrorMessage(result.error || 'Failed to upload document');
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
          <FileText className="h-5 w-5 text-green-600" />
          <span>Upload Application Document</span>
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
              <label htmlFor="doc-category" className="text-xs font-medium text-slate-700">
                Document Category
              </label>
              <select
                id="doc-category"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full text-sm p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
              >
                <option value="Application Form">Application Form</option>
                <option value="Parent Questionnaire">Parent Questionnaire</option>
                <option value="Transcript">Official Transcript / Report Card</option>
                <option value="Medical Form">Medical / Release Form</option>
                <option value="Contract">Signed Contract</option>
                <option value="Other">Other Document</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="doc-file" className="text-xs font-medium text-slate-700">
                Select File (PDF, DOCX, TXT max 25MB)
              </label>
              <input
                id="doc-file"
                type="file"
                accept=".pdf,.doc,.docx,.txt,.rtf"
                onChange={handleFileChange}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-slate-500">
              Binary payloads offloaded directly to secure Google Drive storage.
            </span>
            <Button
              type="submit"
              disabled={!selectedFile || uploading}
              className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-md flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              <span>{uploading ? 'Uploading to Drive...' : 'Upload Document'}</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Document List */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
          Uploaded Documents & Forms ({documents.length})
        </h4>

        {loading ? (
          <div className="p-6 text-center text-slate-500">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500">
            No documents uploaded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-green-50 rounded-lg text-green-700 shrink-0 mt-0.5">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">{doc.filename}</span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                        {doc.document_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-400" />
                        Uploaded by {doc.uploader_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                      <span className="font-mono text-slate-400">
                        Drive ID: {doc.drive_file_id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs text-slate-700 hover:text-slate-900 flex items-center gap-1"
                    onClick={() => alert(`Opening ${doc.filename} from Google Drive reference (${doc.drive_file_id})`)}
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
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
