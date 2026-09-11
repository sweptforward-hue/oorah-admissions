'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/layout/Navbar'
import { Modal } from '@/components/ui/modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Kid, KidStatus } from '@/types'
import { updateCamperStatus, toggleCamperVoting } from '@/lib/campers/actions'
import {
  sendChatMessage,
  uploadDocumentToDrive,
  deleteDocumentAction,
  castVaadVoteAction,
  generateContractPdf,
  uploadSignedContract,
} from '@/lib/campers/detail-actions'
import { triggerExport } from '@/lib/admin/actions'

export interface CamperDocument {
  id: string
  kid_id: string
  name: string
  file_type: string
  file_size: number
  drive_file_id?: string
  uploader_id?: string
  document_type?: string
  created_at: string
}

interface CamperDetailClientProps {
  initialCamper: Kid
  initialDocuments?: CamperDocument[]
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'Accepted':
      return 'success'
    case 'Rejected':
    case 'Withdrawn':
      return 'destructive'
    case 'VAAD Review':
    case 'Interview':
    case 'Under Review':
      return 'warning'
    case 'New':
    case 'Incomplete':
    default:
      return 'secondary'
  }
}

export function CamperDetailClient({ initialCamper, initialDocuments = [] }: CamperDetailClientProps) {
  const [camper, setCamper] = useState<Kid>(initialCamper)
  const [noteText, setNoteText] = useState('')
  const [messages, setMessages] = useState<string[]>([
    'Rabbi Cohen: @Azriel Cohenca Please review the recommendation letter attached.',
  ])
  const [documents, setDocuments] = useState<CamperDocument[]>(initialDocuments)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [contractStatus, setContractStatus] = useState<string>('Pending Generation')
  const [isPending, startTransition] = useTransition()

  // Modal States
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [newStatusInput, setNewStatusInput] = useState('')
  const [statusReasonInput, setStatusReasonInput] = useState('')

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [docNameInput, setDocNameInput] = useState('')
  const [docCategoryInput, setDocCategoryInput] = useState('Application Forms')

  // Delete Confirm Dialog State
  const [docToDelete, setDocToDelete] = useState<CamperDocument | null>(null)

  const [notification, setNotification] = useState<{
    isOpen: boolean
    title: string
    message: string
  }>({
    isOpen: false,
    title: '',
    message: '',
  })

  const showNotification = (title: string, message: string) => {
    setNotification({ isOpen: true, title, message })
  }

  // Header Actions
  const handleOpenStatusModal = () => {
    setNewStatusInput(camper.status || 'Accepted')
    setStatusReasonInput('')
    setIsStatusModalOpen(true)
  }

  const handleConfirmStatusChange = async () => {
    if (!newStatusInput.trim()) return
    const statusVal = newStatusInput.trim()
    const reasonVal = statusReasonInput.trim() || 'Manual override'

    setIsStatusModalOpen(false)
    startTransition(async () => {
      try {
        await updateCamperStatus(camper.id, statusVal, reasonVal)
        setCamper({ ...camper, status: statusVal as KidStatus })
        showNotification('Status Updated', `Camper status successfully changed to "${statusVal}".`)
      } catch (err: unknown) {
        showNotification('Error', (err as Error).message || 'Failed to update status')
      }
    })
  }

  const handleExportData = async () => {
    startTransition(async () => {
      try {
        await triggerExport('CSV')
        showNotification('Export Triggered', `Data for ${camper.name} exported successfully.`)
      } catch (err: unknown) {
        showNotification('Export Error', (err as Error).message || 'Failed to export data')
      }
    })
  }

  // Chat Tab
  const handleSendNote = async () => {
    if (!noteText.trim()) return
    const textToSend = noteText.trim()
    startTransition(async () => {
      try {
        await sendChatMessage(camper.id, textToSend)
        setMessages((prev) => [...prev, `You: ${textToSend}`])
        setNoteText('')
      } catch (err: unknown) {
        showNotification('Chat Error', (err as Error).message || 'Failed to send note')
      }
    })
  }

  // Documents Tab
  const categories = ['All', 'Application Forms', 'Parent Questionnaire', 'Medical Forms', 'Transcripts']

  const handleOpenUploadModal = () => {
    setDocNameInput(`${camper.name}_Document.pdf`)
    setDocCategoryInput('Application Forms')
    setIsUploadModalOpen(true)
  }

  const handleConfirmUploadDrive = async () => {
    if (!docNameInput.trim()) return
    const fileName = docNameInput.trim()
    const categoryName = docCategoryInput
    setIsUploadModalOpen(false)

    startTransition(async () => {
      try {
        const result = await uploadDocumentToDrive(
          camper.id,
          fileName,
          undefined,
          'application/pdf',
          categoryName
        )
        if (result.document) {
          setDocuments((prev) => [result.document as unknown as CamperDocument, ...prev])
        } else {
          setDocuments((prev) => [
            {
              id: `temp_${Date.now()}`,
              kid_id: camper.id,
              name: fileName,
              file_type: 'application/pdf',
              file_size: 1024,
              drive_file_id: result.driveFile?.id,
              document_type: categoryName,
              created_at: new Date().toISOString(),
            },
            ...prev,
          ])
        }
        showNotification('Document Uploaded', `Document "${fileName}" successfully saved to Google Drive under category "${categoryName}".`)
      } catch (err: unknown) {
        showNotification('Upload Error', (err as Error).message || 'Failed to upload document')
      }
    })
  }

  const handleConfirmDeleteDocument = async () => {
    if (!docToDelete) return
    const doc = docToDelete
    setDocToDelete(null)

    startTransition(async () => {
      try {
        await deleteDocumentAction(doc.id, camper.id, doc.drive_file_id)
        setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
        showNotification('Document Deleted', `Document "${doc.name}" was permanently removed and recorded in the audit log.`)
      } catch (err: unknown) {
        showNotification('Delete Error', (err as Error).message || 'Failed to delete document')
      }
    })
  }

  const filteredDocuments = selectedCategory === 'All'
    ? documents
    : documents.filter((doc) => {
        const type = doc.document_type || 'General Document'
        return type.toLowerCase() === selectedCategory.toLowerCase()
      })

  // VAAD Tab
  const handleToggleVoting = async () => {
    const newVotingState = !camper.voting_open
    startTransition(async () => {
      try {
        await toggleCamperVoting(camper.id, newVotingState)
        setCamper({ ...camper, voting_open: newVotingState })
      } catch (err: unknown) {
        showNotification('VAAD Error', (err as Error).message || 'Failed to toggle voting state')
      }
    })
  }

  const handleVote = async (choiceLabel: 'Accept' | 'Reject' | 'Abstain' | 'Request Interview') => {
    startTransition(async () => {
      try {
        await castVaadVoteAction(camper.id, choiceLabel)
        showNotification('Vote Cast', `Recorded vote "${choiceLabel}" for ${camper.name}.`)
      } catch (err: unknown) {
        showNotification('Vote Error', (err as Error).message || 'Failed to submit vote')
      }
    })
  }

  // Contract Tab
  const handleGenerateContract = async () => {
    startTransition(async () => {
      try {
        await generateContractPdf(camper.id)
        setContractStatus('Contract PDF Generated')
        showNotification('Contract PDF Generated', 'Official enrollment contract PDF generated and stored in Google Drive.')
      } catch (err: unknown) {
        showNotification('Contract Error', (err as Error).message || 'Failed to generate contract PDF')
      }
    })
  }

  const handleUploadSigned = async () => {
    startTransition(async () => {
      try {
        await uploadSignedContract(camper.id)
        setContractStatus('Signed Contract Uploaded')
        showNotification('Signed Contract Uploaded', 'Signed contract uploaded and verified in Google Drive.')
      } catch (err: unknown) {
        showNotification('Upload Error', (err as Error).message || 'Failed to upload signed contract')
      }
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/campers" className="text-sm text-slate-500 hover:text-slate-900 mb-4 inline-block">
            &larr; Back to Admissions
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{camper.name}</h1>
                <Badge variant={getStatusVariant(camper.status as string)} className="text-sm px-3 py-1">
                  {camper.status}
                </Badge>
                {camper.voting_open ? (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">VAAD Open</span>
                ) : (
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">VAAD Closed</span>
                )}
              </div>
              <p className="text-slate-500 mt-1">Application #{camper.application_number}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" disabled={isPending} onClick={handleOpenStatusModal}>
                Change Status
              </Button>
              <Button variant="outline" disabled={isPending} onClick={handleExportData}>
                Export Data
              </Button>
            </div>
          </div>
        </div>

        {/* 9 Workstream Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6 flex flex-wrap justify-start h-auto bg-white p-1 rounded-lg border shadow-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chat">Chat (@mentions)</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="voice-notes">Voice Notes</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="vaad">VAAD Voting</TabsTrigger>
            <TabsTrigger value="contract">Contract</TabsTrigger>
            <TabsTrigger value="activity">Activity & Audit</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Application Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 block mb-1">Created Date</span>
                        <span className="font-medium">{new Date(camper.created_at).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Last Modified</span>
                        <span className="font-medium">{new Date(camper.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Custom Fields</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-600">
                    <p>Dynamic custom metadata defined by administrators will be populated here.</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Checklist</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="text-slate-700">Application Form</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="text-slate-700">Parent Questionnaire</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-amber-500">⏳</span>
                        <span className="text-slate-700">Official Transcript</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-slate-400">○</span>
                        <span className="text-slate-500">Medical Release & Contract</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Chat with @mentions */}
          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>Internal Team Chat & Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-slate-100 rounded-lg text-sm text-slate-700 space-y-2">
                  {messages.map((m, idx) => (
                    <div key={idx} className="border-b last:border-0 pb-1">
                      {m}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Type a note (use @name to mention team members)..."
                    className="flex-1 p-2 border rounded-md text-sm bg-white"
                  />
                  <Button disabled={isPending} onClick={handleSendNote}>
                    Send Note
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents / Google Drive */}
          <TabsContent value="documents">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>Documents & Google Drive Storage</CardTitle>
                <Button variant="outline" disabled={isPending} onClick={handleOpenUploadModal}>
                  Upload to Google Drive
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Category Filter Pills */}
                <div className="flex flex-wrap gap-2 pb-2 border-b">
                  {categories.map((cat) => {
                    const isActive = selectedCategory === cat
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  })}
                </div>

                {/* Documents List */}
                {filteredDocuments.length > 0 ? (
                  <div className="divide-y rounded-lg border bg-white overflow-hidden shadow-sm">
                    {filteredDocuments.map((doc) => {
                      const fileId = doc.drive_file_id || 'preview'
                      const viewUrl = `/api/media/proxy/${fileId}`
                      const downloadUrl = `/api/media/proxy/${fileId}?download=true`

                      return (
                        <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">📄</span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-slate-900 text-sm">{doc.name}</span>
                                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                                  {doc.document_type || 'General Document'}
                                </Badge>
                              </div>
                              <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                                <span>Saved to Google Drive</span>
                                <span>•</span>
                                <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                                {doc.file_size > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <a
                              href={viewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-slate-200 bg-white hover:bg-slate-100 h-8 px-3 transition-colors text-slate-700"
                            >
                              View / Open
                            </a>
                            <a
                              href={downloadUrl}
                              download={doc.name}
                              className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-slate-200 bg-white hover:bg-slate-100 h-8 px-3 transition-colors text-slate-700"
                            >
                              Download
                            </a>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-8 text-xs"
                              disabled={isPending}
                              onClick={() => setDocToDelete(doc)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 p-8 rounded-lg text-center bg-slate-50">
                    <p className="text-slate-600 text-sm mb-1">No documents found for category &quot;{selectedCategory}&quot;.</p>
                    <p className="text-xs text-slate-400">Upload application documents directly to secure Google Drive.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photos */}
          <TabsContent value="photos">
            <Card>
              <CardHeader>
                <CardTitle>Camper Photos</CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-center text-slate-500">
                Photo uploads will appear here.
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voice Notes */}
          <TabsContent value="voice-notes">
            <Card>
              <CardHeader>
                <CardTitle>Staff Voice Notes</CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-center text-slate-500">
                Audio recordings and transcription logs will appear here.
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transcript */}
          <TabsContent value="transcript">
            <Card>
              <CardHeader>
                <CardTitle>Academic Transcripts</CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-center text-slate-500">
                School report cards and transcript files will appear here.
              </CardContent>
            </Card>
          </TabsContent>

          {/* VAAD */}
          <TabsContent value="vaad">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>VAAD Admissions Voting</CardTitle>
                <Button variant="outline" size="sm" disabled={isPending} onClick={handleToggleVoting}>
                  {camper.voting_open ? 'Close Voting' : 'Reopen Voting'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-semibold text-amber-900">
                    Current Status: {camper.status} ({camper.voting_open ? 'Voting Open' : 'Voting Locked'})
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    disabled={isPending || !camper.voting_open}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleVote('Accept')}
                  >
                    Vote Accept
                  </Button>
                  <Button
                    disabled={isPending || !camper.voting_open}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => handleVote('Reject')}
                  >
                    Vote Reject
                  </Button>
                  <Button
                    disabled={isPending || !camper.voting_open}
                    variant="outline"
                    onClick={() => handleVote('Abstain')}
                  >
                    Vote Abstain
                  </Button>
                  <Button
                    disabled={isPending || !camper.voting_open}
                    variant="outline"
                    onClick={() => handleVote('Request Interview')}
                  >
                    Request Interview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contract */}
          <TabsContent value="contract">
            <Card>
              <CardHeader>
                <CardTitle>Camper Contract & E-Signature</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border border-slate-200 p-6 rounded-lg bg-slate-50 text-center">
                  <p className="text-sm text-slate-600 mb-2">Official Season Enrollment Contract</p>
                  <p className="text-xs text-slate-500 mb-4">Status: {contractStatus}</p>
                  <div className="flex justify-center gap-3">
                    <Button disabled={isPending} onClick={handleGenerateContract}>
                      Generate Contract PDF
                    </Button>
                    <Button variant="outline" disabled={isPending} onClick={handleUploadSigned}>
                      Upload Signed Copy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Full Audit History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-slate-600 border-b pb-2">
                  <span className="font-semibold">Status: {camper.status}</span> — Updated recently
                </div>
                <div className="text-xs text-slate-600 border-b pb-2">
                  <span className="font-semibold">Application created</span> (App #{camper.application_number}) — {new Date(camper.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Accessible Change Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Change Camper Status"
        description="Select a new status and enter a reason for audit tracking."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Status</label>
            <Input
              value={newStatusInput}
              onChange={(e) => setNewStatusInput(e.target.value)}
              placeholder="e.g. Accepted, Rejected, Interview, VAAD Review"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Override</label>
            <Input
              value={statusReasonInput}
              onChange={(e) => setStatusReasonInput(e.target.value)}
              placeholder="e.g. Approved by admissions committee"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isPending} onClick={handleConfirmStatusChange} className="bg-green-600 hover:bg-green-700 text-white">
              Update Status
            </Button>
          </div>
        </div>
      </Modal>

      {/* Accessible Upload Document Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Document to Google Drive"
        description="Specify document name and category for Google Drive cloud storage."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Document Category / Type</label>
            <select
              value={docCategoryInput}
              onChange={(e) => setDocCategoryInput(e.target.value)}
              className="w-full p-2 border rounded-md text-sm bg-white text-slate-900 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {categories.filter((c) => c !== 'All').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="General Document">General Document</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Document Name</label>
            <Input
              value={docNameInput}
              onChange={(e) => setDocNameInput(e.target.value)}
              placeholder="e.g. Camper_Transcript.pdf"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isPending} onClick={handleConfirmUploadDrive} className="bg-green-600 hover:bg-green-700 text-white">
              Upload Document
            </Button>
          </div>
        </div>
      </Modal>

      {/* Accessible Confirm Delete Document Dialog */}
      <ConfirmDialog
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        onConfirm={handleConfirmDeleteDocument}
        title="Delete Document"
        message={`Are you sure you want to delete "${docToDelete?.name}"? This will permanently remove the record from Supabase, trash the file in Google Drive, and log the deletion in audit logs.`}
        confirmText="Delete Document"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Accessible Notification Modal */}
      <Modal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        title={notification.title}
        description={notification.message}
      >
        <div className="flex justify-end pt-2">
          <Button onClick={() => setNotification({ ...notification, isOpen: false })}>
            OK
          </Button>
        </div>
      </Modal>
    </div>
  )
}
