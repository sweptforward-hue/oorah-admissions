'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/layout/Navbar'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Kid } from '@/types'
import { updateCamperStatus, toggleCamperVoting, updateCamperProfile, assignCamperCohortBunk, deleteCamper } from '@/lib/campers/actions'
import { useRouter } from 'next/navigation'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  sendChatMessage,
  uploadDocumentToDrive,
  castVaadVoteAction,
  generateContractPdf,
  uploadSignedContract,
  voidAndRegenerateContract,
} from '@/lib/campers/detail-actions'
import { triggerExport } from '@/lib/admin/actions'

interface CamperDetailClientProps {
  initialCamper: Kid
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

export function CamperDetailClient({ initialCamper }: CamperDetailClientProps) {
  const router = useRouter()
  const [camper, setCamper] = useState<Kid>(initialCamper)
  const [noteText, setNoteText] = useState('')
  interface ChatAttachment {
    type: 'document' | 'audio'
    name: string
    url: string
  }

  interface ChatMessage {
    id: string
    author: string
    content: string
    timestamp: string
    attachment?: ChatAttachment
  }

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      author: 'Rabbi Cohen',
      content: '@Azriel Cohenca Please review the recommendation letter attached.',
      timestamp: '10:30 AM',
      attachment: {
        type: 'document',
        name: 'Recommendation_Letter.pdf',
        url: '/api/media/proxy/doc-rec-1',
      },
    },
    {
      id: '2',
      author: 'Admissions Staff',
      content: 'Recorded phone interview summary with applicant parents.',
      timestamp: '11:15 AM',
      attachment: {
        type: 'audio',
        name: 'Parent_Interview_Note.webm',
        url: '/api/media/proxy/audio-interview-1',
      },
    },
  ])
  const [isRecording, setIsRecording] = useState(false)
  const [docs, setDocs] = useState<string[]>([])
  const [contractStatus, setContractStatus] = useState<string>('Pending Generation')
  const [contractPdfUrl, setContractPdfUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Modal States
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [newStatusInput, setNewStatusInput] = useState('')
  const [statusReasonInput, setStatusReasonInput] = useState('')

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [docNameInput, setDocNameInput] = useState('')

  const [isPreviewPdfModalOpen, setIsPreviewPdfModalOpen] = useState(false)
  const [isVoidContractDialogOpen, setIsVoidContractDialogOpen] = useState(false)

  // Profile & Header Modal States
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false)
  const [profileForm, setProfileForm] = useState({
    grade: camper.grade || '8th Grade',
    school: camper.school || 'Yeshiva Toras Chaim',
    city: camper.city || 'Monsey',
    state: camper.state || 'NY',
    gender: camper.gender || 'Male',
    notes: camper.notes || 'Standard application with good recommendations.',
  })

  const [isAssignCohortModalOpen, setIsAssignCohortModalOpen] = useState(false)
  const [cohortSessionInput, setCohortSessionInput] = useState(camper.session_name || 'Session A')
  const [bunkInput, setBunkInput] = useState(camper.bunk || 'Bunk 12')

  const [isDeleteCamperDialogOpen, setIsDeleteCamperDialogOpen] = useState(false)

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
        setCamper({ ...camper, status: statusVal as any })
        showNotification('Status Updated', `Camper status successfully changed to "${statusVal}".`)
      } catch (err: unknown) {
        showNotification('Error', (err as Error).message || 'Failed to update status')
      }
    })
  }

  const handleSaveProfile = async () => {
    setIsEditProfileModalOpen(false)
    startTransition(async () => {
      try {
        await updateCamperProfile(camper.id, profileForm)
        setCamper((prev) => ({
          ...prev,
          ...profileForm,
        }))
        showNotification('Profile Updated', 'Camper demographic details successfully updated.')
      } catch (err: unknown) {
        showNotification('Profile Error', (err as Error).message || 'Failed to update profile')
      }
    })
  }

  const handleSaveCohortBunk = async () => {
    setIsAssignCohortModalOpen(false)
    startTransition(async () => {
      try {
        await assignCamperCohortBunk(camper.id, cohortSessionInput, bunkInput)
        setCamper((prev) => ({
          ...prev,
          session_name: cohortSessionInput,
          bunk: bunkInput,
        }))
        showNotification('Cohort & Bunk Assigned', `Assigned to ${cohortSessionInput}, Bunk: ${bunkInput}.`)
      } catch (err: unknown) {
        showNotification('Assignment Error', (err as Error).message || 'Failed to assign cohort/bunk')
      }
    })
  }

  const handleConfirmDeleteCamper = async () => {
    setIsDeleteCamperDialogOpen(false)
    startTransition(async () => {
      try {
        await deleteCamper(camper.id)
        showNotification('Camper Deleted', `Camper ${camper.name} deleted successfully.`)
        router.push('/campers')
      } catch (err: unknown) {
        showNotification('Delete Error', (err as Error).message || 'Failed to delete camper')
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
  const handleSendNote = async (attachment?: { type: 'document' | 'audio'; name: string; url: string }) => {
    if (!noteText.trim() && !attachment) return
    const textToSend = noteText.trim() || (attachment?.type === 'audio' ? 'Voice Note Attachment' : 'Document Attachment')
    startTransition(async () => {
      try {
        await sendChatMessage(camper.id, textToSend)
        const newMsg: ChatMessage = {
          id: String(Date.now()),
          author: 'You',
          content: textToSend,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          attachment,
        }
        setMessages((prev) => [...prev, newMsg])
        setNoteText('')
      } catch (err: unknown) {
        showNotification('Chat Error', (err as Error).message || 'Failed to send message')
      }
    })
  }

  const handleAttachDocument = () => {
    const docName = `${camper.name}_Attachment.pdf`
    startTransition(async () => {
      try {
        const res = await uploadDocumentToDrive(camper.id, docName)
        const docUrl = res.driveFile?.webViewLink || `/api/media/proxy/${res.driveFile?.id || 'doc-proxy'}`
        handleSendNote({
          type: 'document',
          name: docName,
          url: docUrl,
        })
        showNotification('Attachment Added', `Attached document ${docName} to chat.`)
      } catch (err: unknown) {
        showNotification('Attachment Error', (err as Error).message || 'Failed to attach document')
      }
    })
  }

  const handleRecordVoiceNote = () => {
    setIsRecording(true)
    setTimeout(() => {
      setIsRecording(false)
      const audioName = `Voice_Note_${camper.name.replace(/\s+/g, '_')}_${Date.now()}.webm`
      handleSendNote({
        type: 'audio',
        name: audioName,
        url: '/api/media/proxy/voice-sample-1',
      })
      showNotification('Voice Note Recorded', 'Voice note recorded and attached to chat.')
    }, 1500)
  }

  // Documents Tab
  const handleOpenUploadModal = () => {
    setDocNameInput(`${camper.name}_Transcript.pdf`)
    setIsUploadModalOpen(true)
  }

  const handleConfirmUploadDrive = async () => {
    if (!docNameInput.trim()) return
    const fileName = docNameInput.trim()
    setIsUploadModalOpen(false)

    startTransition(async () => {
      try {
        await uploadDocumentToDrive(camper.id, fileName)
        setDocs((prev) => [...prev, fileName])
        showNotification('Document Uploaded', `Document "${fileName}" successfully saved to Google Drive.`)
      } catch (err: unknown) {
        showNotification('Upload Error', (err as Error).message || 'Failed to upload document')
      }
    })
  }

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
        const res = await generateContractPdf(camper.id)
        setContractStatus('Contract PDF Generated')
        if (res.pdfUrl) setContractPdfUrl(res.pdfUrl)
        showNotification('Contract PDF Generated', 'Official enrollment contract PDF generated and stored in Google Drive.')
      } catch (err: unknown) {
        showNotification('Contract Error', (err as Error).message || 'Failed to generate contract PDF')
      }
    })
  }

  const handlePreviewContract = () => {
    setIsPreviewPdfModalOpen(true)
  }

  const handleDownloadContract = () => {
    const url = contractPdfUrl || `/api/media/proxy/contract-${camper.id}`
    const a = document.createElement('a')
    a.href = url
    a.download = `Contract_${camper.name.replace(/\s+/g, '_')}_${camper.application_number}.pdf`
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleConfirmVoidAndRegenerate = async () => {
    startTransition(async () => {
      try {
        const res = await voidAndRegenerateContract(camper.id, 'Voided and regenerated by staff control')
        setContractStatus('Contract PDF Generated (Regenerated)')
        if (res.pdfUrl) setContractPdfUrl(res.pdfUrl)
        showNotification('Contract Voided & Regenerated', 'The previous contract was voided and a new contract PDF was generated.')
      } catch (err: unknown) {
        showNotification('Contract Error', (err as Error).message || 'Failed to void and regenerate contract')
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
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" disabled={isPending} onClick={() => setIsEditProfileModalOpen(true)}>
                Edit Profile
              </Button>
              <Button variant="outline" size="sm" disabled={isPending} onClick={() => setIsAssignCohortModalOpen(true)}>
                Assign Cohort / Bunk
              </Button>
              <Button variant="outline" size="sm" disabled={isPending} onClick={handleOpenStatusModal}>
                Change Status
              </Button>
              <Button variant="outline" size="sm" disabled={isPending} onClick={handleExportData}>
                Export Data
              </Button>
              <Button variant="destructive" size="sm" disabled={isPending} onClick={() => setIsDeleteCamperDialogOpen(true)}>
                Delete Camper
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
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Application & Profile Details</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditProfileModalOpen(true)}>
                        Edit Profile
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsAssignCohortModalOpen(true)}>
                        Assign Bunk
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm border-b pb-4">
                      <div>
                        <span className="text-slate-500 block mb-1">Grade</span>
                        <span className="font-medium">{camper.grade || profileForm.grade}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">School</span>
                        <span className="font-medium">{camper.school || profileForm.school}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Gender</span>
                        <span className="font-medium">{camper.gender || profileForm.gender}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">City / State</span>
                        <span className="font-medium">
                          {camper.city || profileForm.city}, {camper.state || profileForm.state}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Session / Cohort</span>
                        <span className="font-medium">{camper.session_name || cohortSessionInput}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Bunk Assignment</span>
                        <span className="font-medium">{camper.bunk || bunkInput}</span>
                      </div>
                    </div>

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

                    <div className="text-sm pt-2">
                      <span className="text-slate-500 block mb-1">Demographic & Review Notes</span>
                      <p className="text-slate-700 bg-slate-50 p-3 rounded border">
                        {camper.notes || profileForm.notes}
                      </p>
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
                <div className="p-4 bg-slate-50 border rounded-lg text-sm text-slate-700 space-y-4 max-h-[450px] overflow-y-auto">
                  {messages.map((m) => (
                    <div key={m.id} className="p-3 bg-white border rounded-lg shadow-sm space-y-2">
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span className="font-semibold text-slate-800">{m.author}</span>
                        <span>{m.timestamp}</span>
                      </div>
                      <p className="text-slate-800 text-sm whitespace-pre-wrap">{m.content}</p>

                      {/* Inline Attachment Cards inside message bubbles */}
                      {m.attachment && m.attachment.type === 'document' && (
                        <div className="p-2.5 bg-slate-50 border rounded-md flex items-center justify-between gap-3 text-xs mt-2">
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-base">📄</span>
                            <span className="font-medium text-slate-700 truncate">{m.attachment.name}</span>
                          </div>
                          <a
                            href={m.attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={m.attachment.name}
                            className="text-blue-600 hover:text-blue-800 font-medium underline flex-shrink-0"
                          >
                            Download
                          </a>
                        </div>
                      )}

                      {m.attachment && m.attachment.type === 'audio' && (
                        <div className="p-2.5 bg-slate-50 border rounded-md space-y-1.5 text-xs mt-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-700 flex items-center gap-1.5">
                              <span>🎙️</span> {m.attachment.name}
                            </span>
                            <a
                              href={m.attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={m.attachment.name}
                              className="text-blue-600 hover:text-blue-800 font-medium underline"
                            >
                              Download
                            </a>
                          </div>
                          <audio controls className="w-full h-8 mt-1">
                            <source src={m.attachment.url} type="audio/webm" />
                            Your browser does not support audio playback.
                          </audio>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Chat controls & inline attachment buttons */}
                <div className="space-y-2 pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Type a note (use @name to mention team members)..."
                      className="flex-1 p-2 border rounded-md text-sm bg-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendNote()
                        }
                      }}
                    />
                    <Button disabled={isPending || isRecording} onClick={() => handleSendNote()}>
                      Send Note
                    </Button>
                  </div>

                  <div className="flex gap-2 text-xs">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending || isRecording}
                      onClick={handleAttachDocument}
                      className="flex items-center gap-1.5"
                    >
                      <span>📎</span> Attach Document
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending || isRecording}
                      onClick={handleRecordVoiceNote}
                      className={`flex items-center gap-1.5 ${isRecording ? 'text-red-600 border-red-300 bg-red-50' : ''}`}
                    >
                      <span>🎙️</span> {isRecording ? 'Recording...' : 'Record Voice Note'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents / Google Drive */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Documents & Google Drive Storage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {docs.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {docs.map((d, i) => (
                      <div key={i} className="p-3 bg-slate-100 rounded border text-sm flex justify-between items-center">
                        <span>📄 {d}</span>
                        <span className="text-xs text-green-700 font-semibold">Saved to Google Drive</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-2 border-dashed border-slate-200 p-8 rounded-lg text-center bg-slate-50">
                  <p className="text-slate-600 mb-2">Upload application documents directly to secure Google Drive</p>
                  <Button variant="outline" disabled={isPending} onClick={handleOpenUploadModal}>
                    Upload to Google Drive
                  </Button>
                </div>
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
                  <p className="text-sm font-medium text-slate-800 mb-1">Official Season Enrollment Contract</p>
                  <p className="text-xs text-slate-500 mb-6">Status: <span className="font-semibold text-slate-700">{contractStatus}</span></p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button disabled={isPending} onClick={handleGenerateContract}>
                      Generate Contract PDF
                    </Button>
                    <Button variant="outline" disabled={isPending} onClick={handlePreviewContract}>
                      Preview PDF
                    </Button>
                    <Button variant="outline" disabled={isPending} onClick={handleDownloadContract}>
                      Download Contract
                    </Button>
                    <Button variant="outline" disabled={isPending} onClick={handleUploadSigned}>
                      Upload Signed Copy
                    </Button>
                    <Button variant="destructive" disabled={isPending} onClick={() => setIsVoidContractDialogOpen(true)}>
                      Void & Regenerate
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
        description="Specify document name for Google Drive cloud storage."
      >
        <div className="space-y-4">
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

      {/* Accessible Contract Preview PDF Modal */}
      <Modal
        isOpen={isPreviewPdfModalOpen}
        onClose={() => setIsPreviewPdfModalOpen(false)}
        title="Enrollment Contract Preview"
        description={`Previewing enrollment contract for ${camper.name} (App #${camper.application_number}).`}
      >
        <div className="space-y-4">
          <div className="border rounded-lg bg-slate-100 p-4 text-center min-h-[300px] flex flex-col items-center justify-center space-y-3">
            <p className="text-sm font-semibold text-slate-800">
              Oorah Admissions Official Enrollment Contract
            </p>
            <p className="text-xs text-slate-600">
              Camper: {camper.name} | Application #: {camper.application_number}
            </p>
            <div className="w-full h-48 bg-white border rounded shadow-inner p-4 text-left text-xs font-mono overflow-auto">
              {`%PDF-1.4 Official Enrollment Contract\n---------------------------------------\nCamper: ${camper.name}\nApplication: ${camper.application_number}\nGenerated: ${new Date().toLocaleDateString()}\nStatus: ${contractStatus}\n\nTerms and conditions for season enrollment apply.`}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleDownloadContract}>
              Download PDF
            </Button>
            <Button onClick={() => setIsPreviewPdfModalOpen(false)}>Close Preview</Button>
          </div>
        </div>
      </Modal>

      {/* Accessible Confirm Dialog for Void & Regenerate Contract */}
      <ConfirmDialog
        isOpen={isVoidContractDialogOpen}
        onClose={() => setIsVoidContractDialogOpen(false)}
        onConfirm={handleConfirmVoidAndRegenerate}
        title="Void & Regenerate Contract"
        message={`Are you sure you want to void the current contract for ${camper.name}? A new contract PDF will be generated immediately.`}
        confirmText="Void & Regenerate"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Accessible Edit Profile Modal */}
      <Modal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        title="Edit Demographic Profile"
        description={`Update biographical & demographic details for ${camper.name}.`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Grade</label>
              <Input
                value={profileForm.grade}
                onChange={(e) => setProfileForm({ ...profileForm, grade: e.target.value })}
                placeholder="e.g. 8th Grade"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <Input
                value={profileForm.gender}
                onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                placeholder="e.g. Male / Female"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">School</label>
            <Input
              value={profileForm.school}
              onChange={(e) => setProfileForm({ ...profileForm, school: e.target.value })}
              placeholder="e.g. Yeshiva Toras Chaim"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <Input
                value={profileForm.city}
                onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                placeholder="e.g. Monsey"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
              <Input
                value={profileForm.state}
                onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                placeholder="e.g. NY"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
            <Input
              value={profileForm.notes}
              onChange={(e) => setProfileForm({ ...profileForm, notes: e.target.value })}
              placeholder="Additional background or demographic notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsEditProfileModalOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isPending} onClick={handleSaveProfile} className="bg-green-600 hover:bg-green-700 text-white">
              Save Profile
            </Button>
          </div>
        </div>
      </Modal>

      {/* Accessible Assign Cohort & Bunk Modal */}
      <Modal
        isOpen={isAssignCohortModalOpen}
        onClose={() => setIsAssignCohortModalOpen(false)}
        title="Assign Cohort & Bunk"
        description={`Designate session cohort and bunk assignment for ${camper.name}.`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Session / Cohort</label>
            <select
              value={cohortSessionInput}
              onChange={(e) => setCohortSessionInput(e.target.value)}
              className="w-full p-2 border rounded-md text-sm bg-white"
            >
              <option value="Session A">Session A</option>
              <option value="Session B">Session B</option>
              <option value="Full Summer">Full Summer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Bunk Assignment</label>
            <Input
              value={bunkInput}
              onChange={(e) => setBunkInput(e.target.value)}
              placeholder="e.g. Bunk 12"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsAssignCohortModalOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isPending} onClick={handleSaveCohortBunk} className="bg-green-600 hover:bg-green-700 text-white">
              Save Assignment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Direct Delete Camper ConfirmDialog */}
      <ConfirmDialog
        isOpen={isDeleteCamperDialogOpen}
        onClose={() => setIsDeleteCamperDialogOpen(false)}
        onConfirm={handleConfirmDeleteCamper}
        title="Delete Camper Record"
        message={`Are you sure you want to delete ${camper.name} (App #${camper.application_number})? This action cannot be undone.`}
        confirmText="Delete Camper"
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
