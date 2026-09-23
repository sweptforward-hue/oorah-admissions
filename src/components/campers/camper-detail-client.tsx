'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui'
import { Modal } from '@/components/ui/modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  updateCamperStatus,
  toggleCamperVoting,
  updateCamperProfile,
  assignCamperCohortBunk,
  deleteCamper,
} from '@/lib/campers/actions'
import {
  sendChatMessage,
  uploadDocumentToDrive,
  uploadCamperDocument,
  deleteDocumentAction,
  castVaadVoteAction,
  generateContractPdf,
  uploadSignedContract,
  voidAndRegenerateContract,
  uploadCamperPhoto,
  deletePhotoAction,
  uploadCamperVoiceNote,
  deleteVoiceNoteAction,
  uploadCamperTranscript,
  deleteTranscriptAction,
} from '@/lib/campers/detail-actions'
import { triggerExport } from '@/lib/admin/actions'
import { KidStatus } from '@/types/campers'

export type { KidStatus }

export interface CamperDocument {
  id: string
  name: string
  uploaded_at: string
  type: string
  drive_file_id?: string
  drive_url?: string
}

export interface PhotoItem {
  id: string
  caption?: string
  created_at: string
  drive_file_id?: string
  drive_url?: string
}

export interface VoiceNoteItem {
  id: string
  title: string
  duration_seconds?: number
  created_at: string
  drive_file_id?: string
  drive_url?: string
}

export interface TranscriptItem {
  id: string
  title: string
  created_at: string
  drive_file_id?: string
  drive_url?: string
}

export interface CamperDetailProps {
  initialCamper: {
    id: string
    name: string
    application_number: string
    status: KidStatus
    voting_open: boolean
    created_at: string
    updated_at: string
    grade?: string
    school?: string
    city?: string
    state?: string
    gender?: string
    notes?: string
    session?: string
  }
  initialDocuments?: CamperDocument[]
  initialPhotos?: PhotoItem[]
  initialVoiceNotes?: VoiceNoteItem[]
  initialTranscripts?: TranscriptItem[]
}

export function CamperDetailClient({
  initialCamper,
  initialDocuments = [],
  initialPhotos = [],
  initialVoiceNotes = [],
  initialTranscripts = [],
}: CamperDetailProps) {
  const router = useRouter()
  const [camper, setCamper] = useState(initialCamper)
  const [documents, setDocuments] = useState<CamperDocument[]>(initialDocuments)
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos)
  const [voiceNotes, setVoiceNotes] = useState<VoiceNoteItem[]>(initialVoiceNotes)
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>(initialTranscripts)

  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState('overview')

  // Notification Modal State
  const [notification, setNotification] = useState<{
    isOpen: boolean
    title: string
    description: string
  }>({
    isOpen: false,
    title: '',
    description: '',
  })

  const showNotification = (title: string, description: string) => {
    setNotification({ isOpen: true, title, description })
  }

  // Header & Profile Modal States
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [statusVal, setStatusVal] = useState<KidStatus>(camper.status)
  const [reasonVal, setReasonVal] = useState('')

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
  const [cohortSessionInput, setCohortSessionInput] = useState(camper.session || 'Session A')
  const [bunkInput, setBunkInput] = useState('Bunk 12')
  const [isDeleteCamperDialogOpen, setIsDeleteCamperDialogOpen] = useState(false)

  // Chat State
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
  const [isChatRecording, setIsChatRecording] = useState(false)

  // Contract Tab States
  const [contractStatus, setContractStatus] = useState('Pending Generation')
  const [contractPdfUrl, setContractPdfUrl] = useState<string | null>(null)
  const [isPreviewPdfModalOpen, setIsPreviewPdfModalOpen] = useState(false)
  const [isVoidContractDialogOpen, setIsVoidContractDialogOpen] = useState(false)

  // Documents Tab States
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploadDocFile, setUploadDocFile] = useState<File | null>(null)
  const [categoryName, setCategoryName] = useState('General Document')
  const [docToDelete, setDocToDelete] = useState<CamperDocument | null>(null)

  // Photos Tab States
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoCaption, setPhotoCaption] = useState('')
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoItem | null>(null)

  // Voice Notes Tab States
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [audioMeterLevel, setAudioMeterLevel] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const [playingVoiceNoteId, setPlayingVoiceNoteId] = useState<string | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const [isVoiceUploadModalOpen, setIsVoiceUploadModalOpen] = useState(false)
  const [voiceFile, setVoiceFile] = useState<File | null>(null)
  const [voiceTitle, setVoiceTitle] = useState('')

  // Transcripts Tab States
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false)
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null)
  const [replacingTranscriptId, setReplacingTranscriptId] = useState<string | null>(null)

  // Header Handlers
  const handleOpenStatusModal = () => {
    setStatusVal(camper.status)
    setReasonVal('')
    setIsStatusModalOpen(true)
  }

  const handleConfirmStatusChange = async () => {
    setIsStatusModalOpen(false)
    startTransition(async () => {
      try {
        const res = await updateCamperStatus(camper.id, statusVal, reasonVal)
        if (!res.success) {
          showNotification('Status Error', res.error || 'Failed to update status')
          return
        }
        setCamper({ ...camper, status: statusVal as KidStatus })
        showNotification('Status Updated', `Camper status successfully changed to "${statusVal}".`)
      } catch (err: unknown) {
        showNotification('Status Error', (err as Error).message || 'Failed to update status')
      }
    })
  }

  const handleSaveProfile = async () => {
    setIsEditProfileModalOpen(false)
    startTransition(async () => {
      try {
        const res = await updateCamperProfile(camper.id, profileForm)
        if (!res.success) {
          showNotification('Profile Error', res.error || 'Failed to update profile')
          return
        }
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
        const res = await assignCamperCohortBunk(camper.id, cohortSessionInput, bunkInput)
        if (!res.success) {
          showNotification('Assignment Error', res.error || 'Failed to assign cohort/bunk')
          return
        }
        setCamper((prev) => ({
          ...prev,
          session: cohortSessionInput,
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
        const res = await deleteCamper(camper.id)
        if (!res.success) {
          showNotification('Delete Error', res.error || 'Failed to delete camper')
          return
        }
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

  // Chat Tab Handlers
  const handleSendNote = async (attachment?: { type: 'document' | 'audio'; name: string; url: string }) => {
    if (!noteText.trim() && !attachment) return
    const textToSend = noteText.trim() || (attachment?.type === 'audio' ? 'Voice Note Attachment' : 'Document Attachment')
    startTransition(async () => {
      try {
        const res = await sendChatMessage(camper.id, textToSend)
        if (!res.success) {
          showNotification('Chat Error', res.error || 'Failed to send note')
          return
        }
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
        if (!res.success) {
          showNotification('Attachment Error', res.error || 'Failed to attach document')
          return
        }
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

  const handleRecordVoiceNoteChat = () => {
    setIsChatRecording(true)
    setTimeout(() => {
      setIsChatRecording(false)
      const audioName = `Voice_Note_${camper.name.replace(/\s+/g, '_')}_${Date.now()}.webm`
      handleSendNote({
        type: 'audio',
        name: audioName,
        url: '/api/media/proxy/voice-sample-1',
      })
      showNotification('Voice Note Recorded', 'Voice note recorded and attached to chat.')
    }, 1500)
  }

  // Contract Tab Handlers
  const handleGenerateContract = async () => {
    startTransition(async () => {
      try {
        const res = await generateContractPdf(camper.id)
        if (!res.success) {
          showNotification('Contract Error', res.error || 'Failed to generate contract PDF')
          return
        }
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
    setIsVoidContractDialogOpen(false)
    startTransition(async () => {
      try {
        const res = await voidAndRegenerateContract(camper.id, 'Voided and regenerated by staff control')
        if (!res.success) {
          showNotification('Contract Error', res.error || 'Failed to void and regenerate contract')
          return
        }
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
        const res = await uploadSignedContract(camper.id)
        if (!res.success) {
          showNotification('Upload Error', res.error || 'Failed to upload signed contract')
          return
        }
        setContractStatus('Signed Contract Uploaded')
        showNotification('Signed Contract Uploaded', 'Signed contract uploaded and verified in Google Drive.')
      } catch (err: unknown) {
        showNotification('Upload Error', (err as Error).message || 'Failed to upload signed contract')
      }
    })
  }

  // Documents Tab Handlers
  const handleOpenUploadModal = () => {
    setUploadDocFile(null)
    setCategoryName('General Document')
    setIsUploadModalOpen(true)
  }

  const handleConfirmUploadDrive = async () => {
    setIsUploadModalOpen(false)
    startTransition(async () => {
      try {
        const filename = uploadDocFile ? uploadDocFile.name : `Document_${Date.now()}.pdf`
        const result = await uploadCamperDocument(
          camper.id,
          filename,
          undefined,
          'application/pdf',
          categoryName
        )
        if (!result.success) {
          showNotification('Upload Error', result.error || 'Failed to upload document')
          return
        }
        if (result.document) {
          setDocuments((prev) => [result.document as unknown as CamperDocument, ...prev])
        } else {
          setDocuments((prev) => [
            {
              id: `doc-${Date.now()}`,
              name: filename,
              uploaded_at: new Date().toISOString(),
              type: categoryName,
              drive_url: result.driveFile?.webViewLink || 'https://drive.google.com',
            },
            ...prev,
          ])
        }
        showNotification('Document Uploaded', `Document "${filename}" was saved to Google Drive.`)
      } catch (err: unknown) {
        showNotification('Upload Error', (err as Error).message || 'Failed to upload document to Drive')
      }
    })
  }

  const handleConfirmDeleteDoc = async () => {
    if (!docToDelete) return
    const doc = docToDelete
    setDocToDelete(null)

    startTransition(async () => {
      try {
        const res = await deleteDocumentAction(doc.id, camper.id, doc.drive_file_id)
        if (!res.success) {
          showNotification('Delete Error', res.error || 'Failed to delete document')
          return
        }
        setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
        showNotification('Document Deleted', `Document "${doc.name}" was permanently removed.`)
      } catch (err: unknown) {
        showNotification('Delete Error', (err as Error).message || 'Failed to delete document')
      }
    })
  }

  // Photos Tab Handlers
  const handleConfirmPhotoUpload = async () => {
    if (!photoFile) return
    setIsPhotoModalOpen(false)
    const filename = photoFile.name

    startTransition(async () => {
      try {
        const res = await uploadCamperPhoto(
          camper.id,
          filename,
          undefined,
          photoFile.type || 'image/jpeg',
          photoCaption
        )
        if (!res.success) {
          showNotification('Photo Upload Error', res.error || 'Failed to upload photo')
          return
        }
        const newPhoto: PhotoItem = {
          id: res.photo?.id || `photo-${Date.now()}`,
          caption: photoCaption || filename,
          created_at: new Date().toISOString(),
          drive_url: photoPreview || res.driveFile?.webViewLink || '',
        }
        setPhotos((prev) => [newPhoto, ...prev])
        showNotification('Photo Uploaded', `Photo "${filename}" uploaded to Google Drive.`)
      } catch (err: unknown) {
        showNotification('Photo Upload Error', (err as Error).message || 'Failed to upload photo')
      }
    })
  }

  const handleDeletePhoto = async (photoId: string) => {
    startTransition(async () => {
      try {
        const res = await deletePhotoAction(photoId, camper.id)
        if (!res.success) {
          showNotification('Delete Error', res.error || 'Failed to delete photo')
          return
        }
        setPhotos((prev) => prev.filter((p) => p.id !== photoId))
        showNotification('Photo Deleted', 'Photo has been removed.')
      } catch (err: unknown) {
        showNotification('Delete Error', (err as Error).message || 'Failed to delete photo')
      }
    })
  }

  // Voice Notes Handlers
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const audioCtx = new AudioContextClass()
        audioContextRef.current = audioCtx
        const analyser = audioCtx.createAnalyser()
        const source = audioCtx.createMediaStreamSource(stream)
        source.connect(analyser)
      } catch (e) {
        console.warn('AudioContext level visualization not supported', e)
      }

      const chunks: BlobPart[] = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' })
        setRecordedBlob(audioBlob)
        setRecordedAudioUrl(URL.createObjectURL(audioBlob))
        stream.getTracks().forEach((track) => track.stop())
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {})
        }
      }

      recorder.start()
      setIsRecording(true)
      setRecordingSeconds(0)

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
        setAudioMeterLevel(Math.min(100, Math.floor(Math.random() * 60 + 20)))
      }, 1000)
    } catch {
      showNotification('Microphone Error', 'Microphone access denied or unavailable.')
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
      setAudioMeterLevel(0)
    }
  }

  const handleSaveRecordedVoiceNote = async () => {
    if (!recordedBlob) return
    setIsRecordModalOpen(false)
    const title = `Voice Note (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
    const durationSec = recordingSeconds

    startTransition(async () => {
      try {
        const res = await uploadCamperVoiceNote(
          camper.id,
          `${title}.webm`,
          undefined,
          'audio/webm',
          durationSec
        )
        if (!res.success) {
          showNotification('Voice Note Error', res.error || 'Failed to save voice note')
          return
        }
        const newVoiceNote: VoiceNoteItem = {
          id: res.voiceNote?.id || `voice-${Date.now()}`,
          title,
          duration_seconds: durationSec,
          created_at: new Date().toISOString(),
          drive_url: recordedAudioUrl || '',
        }
        setVoiceNotes((prev) => [newVoiceNote, ...prev])
        showNotification('Voice Note Saved', 'Voice recording uploaded to Google Drive.')
      } catch (err: unknown) {
        showNotification('Voice Note Error', (err as Error).message || 'Failed to save voice note')
      }
    })
  }

  const handleConfirmVoiceUpload = async () => {
    if (!voiceFile) return
    setIsVoiceUploadModalOpen(false)
    const filename = voiceTitle || voiceFile.name

    startTransition(async () => {
      try {
        const res = await uploadCamperVoiceNote(
          camper.id,
          filename,
          undefined,
          voiceFile.type || 'audio/mp3',
          120
        )
        if (!res.success) {
          showNotification('Upload Error', res.error || 'Failed to upload audio file')
          return
        }
        const newVoiceNote: VoiceNoteItem = {
          id: res.voiceNote?.id || `voice-${Date.now()}`,
          title: filename,
          duration_seconds: 120,
          created_at: new Date().toISOString(),
          drive_url: URL.createObjectURL(voiceFile),
        }
        setVoiceNotes((prev) => [newVoiceNote, ...prev])
        showNotification('Audio Uploaded', `File "${filename}" uploaded to Google Drive.`)
      } catch (err: unknown) {
        showNotification('Upload Error', (err as Error).message || 'Failed to upload audio file')
      }
    })
  }

  const handleTogglePlayVoiceNote = (vn: VoiceNoteItem) => {
    if (playingVoiceNoteId === vn.id) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
      }
      setPlayingVoiceNoteId(null)
      return
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
    }

    const audioUrl = vn.drive_url || `/api/media/proxy/${vn.drive_file_id || 'sample'}`
    const audio = new Audio(audioUrl)
    currentAudioRef.current = audio

    audio.onended = () => {
      setPlayingVoiceNoteId(null)
    }

    audio.onerror = () => {
      setPlayingVoiceNoteId(null)
      showNotification('Audio Error', 'Audio file playback failed.')
    }

    audio.play().then(() => {
      setPlayingVoiceNoteId(vn.id)
    }).catch(() => {
      setPlayingVoiceNoteId(null)
    })
  }

  const handleDeleteVoiceNote = async (voiceNoteId: string) => {
    startTransition(async () => {
      try {
        const res = await deleteVoiceNoteAction(voiceNoteId, camper.id)
        if (!res.success) {
          showNotification('Delete Error', res.error || 'Failed to delete voice note')
          return
        }
        setVoiceNotes((prev) => prev.filter((v) => v.id !== voiceNoteId))
        showNotification('Voice Note Deleted', 'Voice note removed.')
      } catch (err: unknown) {
        showNotification('Delete Error', (err as Error).message || 'Failed to delete voice note')
      }
    })
  }

  // Transcripts Tab Handlers
  const handleOpenTranscriptUpload = (replaceId?: string) => {
    setReplacingTranscriptId(replaceId || null)
    setTranscriptFile(null)
    setIsTranscriptModalOpen(true)
  }

  const handleConfirmTranscriptUpload = async () => {
    setIsTranscriptModalOpen(false)
    const title = transcriptFile ? transcriptFile.name : `Transcript_${new Date().getFullYear()}.pdf`

    startTransition(async () => {
      try {
        if (replacingTranscriptId) {
          const delRes = await deleteTranscriptAction(replacingTranscriptId, camper.id)
          if (!delRes.success) {
            showNotification('Transcript Error', delRes.error || 'Failed to delete existing transcript')
            return
          }
          setTranscripts((prev) => prev.filter((t) => t.id !== replacingTranscriptId))
        }

        const res = await uploadCamperTranscript(
          camper.id,
          title,
          undefined,
          transcriptFile?.type || 'application/pdf'
        )
        if (!res.success) {
          showNotification('Transcript Error', res.error || 'Failed to upload transcript')
          return
        }

        const newTranscript: TranscriptItem = {
          id: res.transcript?.id || `transcript-${Date.now()}`,
          title,
          created_at: new Date().toISOString(),
          drive_url: res.driveFile?.webViewLink || 'https://drive.google.com',
        }
        setTranscripts((prev) => [newTranscript, ...prev])
        showNotification(
          replacingTranscriptId ? 'Transcript Replaced' : 'Transcript Uploaded',
          `Transcript "${title}" saved to Google Drive.`
        )
      } catch (err: unknown) {
        showNotification('Transcript Error', (err as Error).message || 'Failed to upload transcript')
      }
    })
  }

  const handleDeleteTranscript = async (transcriptId: string) => {
    startTransition(async () => {
      try {
        const res = await deleteTranscriptAction(transcriptId, camper.id)
        if (!res.success) {
          showNotification('Delete Error', res.error || 'Failed to delete transcript')
          return
        }
        setTranscripts((prev) => prev.filter((t) => t.id !== transcriptId))
        showNotification('Transcript Deleted', 'Transcript removed.')
      } catch (err: unknown) {
        showNotification('Delete Error', (err as Error).message || 'Failed to delete transcript')
      }
    })
  }

  // VAAD Tab Handlers
  const handleToggleVoting = async () => {
    const newVotingState = !camper.voting_open
    startTransition(async () => {
      try {
        const res = await toggleCamperVoting(camper.id, newVotingState)
        if (!res.success) {
          showNotification('VAAD Error', res.error || 'Failed to toggle voting state')
          return
        }
        setCamper({ ...camper, voting_open: newVotingState })
      } catch (err: unknown) {
        showNotification('VAAD Error', (err as Error).message || 'Failed to toggle voting state')
      }
    })
  }

  const handleVote = async (choiceLabel: 'Accept' | 'Reject' | 'Abstain' | 'Request Interview') => {
    startTransition(async () => {
      try {
        const res = await castVaadVoteAction(camper.id, choiceLabel)
        if (!res.success) {
          showNotification('Vote Error', res.error || 'Failed to submit vote')
          return
        }
        showNotification('Vote Cast', `Recorded vote "${choiceLabel}" for ${camper.name}.`)
      } catch (err: unknown) {
        showNotification('Vote Error', (err as Error).message || 'Failed to submit vote')
      }
    })
  }

  const handleDownloadDriveFile = (driveId?: string, name?: string) => {
    const downloadUrl = driveId ? `/api/media/proxy/${driveId}` : '#'
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = name || 'file'
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    showNotification('Download Started', `Downloading "${name || 'file'}"...`)
  }

  const categories = ['All', 'Application', 'Parent', 'Medical', 'Transcripts']
  const filteredDocuments = selectedCategory === 'All'
    ? documents
    : documents.filter((doc) => doc.type.toLowerCase().includes(selectedCategory.toLowerCase()))

  return (
    <div className="space-y-6">
      {/* Header Profile Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{camper.name}</h1>
                <Badge variant="outline">{camper.status}</Badge>
              </div>
              <p className="text-sm text-slate-500 mt-1">App #{camper.application_number}</p>
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
        </CardContent>
      </Card>

      {/* Workspace Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 md:grid-cols-7 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="voice">Voice Notes</TabsTrigger>
          <TabsTrigger value="transcripts">Transcripts</TabsTrigger>
          <TabsTrigger value="vaad">VAAD</TabsTrigger>
          <TabsTrigger value="contract">Contract</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <span className="font-medium">{camper.session || cohortSessionInput}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Bunk Assignment</span>
                      <span className="font-medium">{bunkInput}</span>
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
                  <CardTitle>Status Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between items-center border-b pb-3">
                    <span className="text-slate-500">Current Status</span>
                    <span className="font-semibold text-slate-900">{camper.status}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-3">
                    <span className="text-slate-500">VAAD Voting</span>
                    <span className="font-semibold text-slate-900">
                      {camper.voting_open ? 'Open' : 'Locked'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Contract Phase</span>
                    <span className="font-semibold text-slate-900">{contractStatus}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Chat Tab */}
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
                    <Button disabled={isPending || isChatRecording} onClick={() => handleSendNote()}>
                      Send Note
                    </Button>
                  </div>

                  <div className="flex gap-2 text-xs">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending || isChatRecording}
                      onClick={handleAttachDocument}
                      className="flex items-center gap-1.5"
                    >
                      <span>📎</span> Attach Document
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending || isChatRecording}
                      onClick={handleRecordVoiceNoteChat}
                      className={`flex items-center gap-1.5 ${isChatRecording ? 'text-red-600 border-red-300 bg-red-50' : ''}`}
                    >
                      <span>🎙️</span> {isChatRecording ? 'Recording...' : 'Record Voice Note'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle>Documents & Attachments</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Store and organize applicant records securely in Google Drive.
                  </p>
                </div>
                <Button disabled={isPending} onClick={handleOpenUploadModal}>
                  Upload to Google Drive
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 pb-2 border-b">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="divide-y border rounded-lg overflow-hidden">
                  {filteredDocuments.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                      No documents found for category &ldquo;{selectedCategory}&rdquo;.
                    </div>
                  ) : (
                    filteredDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">📄</span>
                          <div>
                            <span className="font-semibold text-sm text-slate-800 block">
                              {doc.name}
                            </span>
                            <div className="flex gap-2 items-center text-xs text-slate-400 mt-0.5">
                              <Badge variant="secondary">{doc.type}</Badge>
                              <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {doc.drive_url && (
                            <a
                              href={doc.drive_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border rounded hover:bg-slate-100"
                            >
                              View
                            </a>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadDriveFile(doc.drive_file_id, doc.name)}
                          >
                            Download
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isPending}
                            onClick={() => setDocToDelete(doc)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle>Camper Photo Gallery</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">Applicant headshots and family photos stored in Google Drive.</p>
                </div>
                <Button
                  disabled={isPending}
                  onClick={() => {
                    setPhotoFile(null)
                    setPhotoPreview(null)
                    setPhotoCaption('')
                    setIsPhotoModalOpen(true)
                  }}
                >
                  + Upload Photo
                </Button>
              </CardHeader>
              <CardContent>
                {photos.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500 border rounded-lg">
                    No photos uploaded for this applicant yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photos.map((photo) => (
                      <div key={photo.id} className="border rounded-lg overflow-hidden group relative bg-slate-50">
                        <div className="aspect-square bg-slate-200 flex items-center justify-center overflow-hidden">
                          {photo.drive_url ? (
                            <img
                              src={photo.drive_url}
                              alt={photo.caption || 'Camper photo'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <span className="text-4xl">📷</span>
                          )}
                        </div>
                        <div className="p-2.5 space-y-1">
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {photo.caption || 'Untitled Photo'}
                          </p>
                          <span className="text-[10px] text-slate-400 block">
                            {new Date(photo.created_at).toLocaleDateString()}
                          </span>
                          <div className="flex justify-between items-center pt-2 border-t">
                            <button
                              onClick={() => setLightboxPhoto(photo)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              View Lightbox
                            </button>
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-1.5 text-xs"
                                onClick={() => handleDownloadDriveFile(photo.drive_file_id, photo.caption || 'photo')}
                              >
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-6 px-1.5 text-xs"
                                disabled={isPending}
                                onClick={() => handleDeletePhoto(photo.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voice Notes Tab */}
          <TabsContent value="voice">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle>In-Browser Voice Notes</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Record audio interviews and parent phone notes directly via browser microphone.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    disabled={isPending}
                    onClick={() => {
                      setRecordingSeconds(0)
                      setRecordedAudioUrl(null)
                      setRecordedBlob(null)
                      setIsRecordModalOpen(true)
                    }}
                  >
                    ● Record Voice Note
                  </Button>
                  <Button
                    variant="outline"
                    disabled={isPending}
                    onClick={() => {
                      setVoiceFile(null)
                      setVoiceTitle('')
                      setIsVoiceUploadModalOpen(true)
                    }}
                  >
                    + Upload Audio File
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {voiceNotes.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500 border rounded-lg">
                    No voice notes recorded or uploaded yet.
                  </div>
                ) : (
                  <div className="divide-y border rounded-lg">
                    {voiceNotes.map((vn) => {
                      const isPlaying = playingVoiceNoteId === vn.id
                      return (
                        <div key={vn.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                          <div className="flex items-center gap-3">
                            <Button
                              size="sm"
                              variant={isPlaying ? 'destructive' : 'outline'}
                              className="w-9 h-9 rounded-full p-0 flex items-center justify-center text-sm"
                              onClick={() => handleTogglePlayVoiceNote(vn)}
                            >
                              {isPlaying ? '⏸' : '▶'}
                            </Button>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{vn.title}</p>
                              <div className="flex gap-2 text-xs text-slate-400 mt-0.5">
                                <span>{new Date(vn.created_at).toLocaleDateString()}</span>
                                {vn.duration_seconds && <span>• {vn.duration_seconds}s</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadDriveFile(vn.drive_file_id, vn.title)}
                            >
                              Download
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isPending}
                              onClick={() => handleDeleteVoiceNote(vn.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transcripts Tab */}
          <TabsContent value="transcripts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle>School Transcripts</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">Academic report cards and official school transcripts.</p>
                </div>
                <Button disabled={isPending} onClick={() => handleOpenTranscriptUpload()}>
                  + Upload Transcript
                </Button>
              </CardHeader>
              <CardContent>
                {transcripts.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500 border rounded-lg">
                    No transcripts uploaded yet.
                  </div>
                ) : (
                  <div className="divide-y border rounded-lg">
                    {transcripts.map((t) => (
                      <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🎓</span>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{t.title}</p>
                            <span className="text-xs text-slate-400 block mt-0.5">
                              Uploaded {new Date(t.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {t.drive_url && (
                            <a
                              href={t.drive_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border rounded hover:bg-slate-100"
                            >
                              View Transcript
                            </a>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadDriveFile(t.drive_file_id, t.title)}
                          >
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => handleOpenTranscriptUpload(t.id)}
                          >
                            Replace
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isPending}
                            onClick={() => handleDeleteTranscript(t.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* VAAD Review Tab */}
          <TabsContent value="vaad">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle>VAAD Committee Review & Decision</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Atomic voting system requiring 2-of-3 committee consensus for admissions acceptance.
                  </p>
                </div>
                <Button variant="outline" disabled={isPending} onClick={handleToggleVoting}>
                  {camper.voting_open ? 'Close Voting' : 'Reopen Voting'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-slate-50 border rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                      Voting Status
                    </span>
                    <span className="text-lg font-bold text-slate-900">
                      {camper.voting_open ? 'Voting Open' : 'Voting Locked'}
                    </span>
                  </div>
                  <Badge variant={camper.voting_open ? 'default' : 'secondary'}>
                    {camper.voting_open ? 'Ballots Active' : 'Decision Finalized'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <span className="text-sm font-medium text-slate-700 block">Cast Official Committee Ballot:</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                      variant="outline"
                      disabled={isPending || !camper.voting_open}
                      onClick={() => handleVote('Abstain')}
                    >
                      Vote Abstain
                    </Button>
                    <Button
                      variant="outline"
                      disabled={isPending || !camper.voting_open}
                      onClick={() => handleVote('Request Interview')}
                    >
                      Request Interview
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contract Tab */}
          <TabsContent value="contract">
            <Card>
              <CardHeader>
                <CardTitle>Enrollment Contract Lifecycle</CardTitle>
                <p className="text-xs text-slate-500 mt-1">
                  Generate official binary enrollment contracts and manage signed parent copies.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-slate-50 border rounded-lg flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                      Contract State
                    </span>
                    <span className="text-lg font-bold text-slate-900">{contractStatus}</span>
                  </div>
                  <Badge variant="outline">{camper.status}</Badge>
                </div>

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
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Accessible Status Change Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Override Camper Status"
        description={`Update application status for ${camper.name} (App #${camper.application_number}).`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Status</label>
            <select
              value={statusVal}
              onChange={(e) => setStatusVal(e.target.value as KidStatus)}
              className="w-full p-2 border rounded-md text-sm bg-white"
            >
              <option value="Pending">Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Accepted">Accepted</option>
              <option value="Waitlisted">Waitlisted</option>
              <option value="Rejected">Rejected</option>
              <option value="Contract Sent">Contract Sent</option>
              <option value="Enrolled">Enrolled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Reason</label>
            <Input
              value={reasonVal}
              onChange={(e) => setReasonVal(e.target.value)}
              placeholder="e.g. Approved per Admissions Director review"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isPending} onClick={handleConfirmStatusChange}>
              Update Status
            </Button>
          </div>
        </div>
      </Modal>

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

      {/* Accessible Upload Document Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Document to Google Drive"
        description={`Add attachments to ${camper.name}'s admissions dossier.`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full p-2 border rounded-md text-sm bg-white"
            >
              <option value="Application">Application</option>
              <option value="Parent">Parent</option>
              <option value="Medical">Medical</option>
              <option value="Transcripts">Transcripts</option>
              <option value="General Document">General Document</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select File</label>
            <input
              type="file"
              onChange={(e) => e.target.files && setUploadDocFile(e.target.files[0])}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 hover:file:bg-slate-200"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isPending} onClick={handleConfirmUploadDrive}>
              Upload Document
            </Button>
          </div>
        </div>
      </Modal>

      {/* Accessible Photo Upload Modal */}
      <Modal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        title="Upload Camper Photo"
        description={`Upload a headshot or picture for ${camper.name}.`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Caption / Description</label>
            <Input
              value={photoCaption}
              onChange={(e) => setPhotoCaption(e.target.value)}
              placeholder="e.g. Camper Official Headshot 2026"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Image File</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setPhotoFile(file)
                  setPhotoPreview(URL.createObjectURL(file))
                }
              }}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 hover:file:bg-slate-200"
            />
          </div>
          {photoPreview && (
            <div className="aspect-video w-full rounded-md overflow-hidden bg-slate-100 flex items-center justify-center border">
              <img src={photoPreview} alt="Preview" className="h-full object-contain" />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsPhotoModalOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isPending || !photoFile} onClick={handleConfirmPhotoUpload}>
              Upload Photo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Accessible Photo Lightbox Modal */}
      {lightboxPhoto && (
        <Modal
          isOpen={!!lightboxPhoto}
          onClose={() => setLightboxPhoto(null)}
          title={lightboxPhoto.caption || 'Camper Photo'}
          description={`Uploaded on ${new Date(lightboxPhoto.created_at).toLocaleDateString()}`}
        >
          <div className="space-y-4 flex flex-col items-center">
            <div className="w-full max-h-[70vh] flex items-center justify-center bg-black/90 rounded-lg overflow-hidden p-2">
              {lightboxPhoto.drive_url ? (
                <img
                  src={lightboxPhoto.drive_url}
                  alt={lightboxPhoto.caption || 'Full view'}
                  className="max-h-[65vh] object-contain rounded"
                />
              ) : (
                <span className="text-white text-sm">Image preview unavailable</span>
              )}
            </div>
            <div className="flex justify-end w-full gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadDriveFile(lightboxPhoto.drive_file_id, lightboxPhoto.caption || 'photo')}
              >
                Download Photo
              </Button>
              <Button size="sm" onClick={() => setLightboxPhoto(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Accessible In-Browser Audio Recording Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => {
          if (isRecording) handleStopRecording()
          setIsRecordModalOpen(false)
        }}
        title="Record Voice Note"
        description="Speak into your microphone to record staff observations or interview summaries."
      >
        <div className="space-y-6 text-center py-4">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-100 text-red-600 scale-110 animate-pulse border-2 border-red-400'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span className="text-3xl">🎙️</span>
            </div>
            <div className="text-2xl font-mono font-bold text-slate-800">
              {Math.floor(recordingSeconds / 60)
                .toString()
                .padStart(2, '0')}
              :{(recordingSeconds % 60).toString().padStart(2, '0')}
            </div>
            {isRecording && (
              <div className="w-full max-w-xs bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-red-500 h-full transition-all duration-300"
                  style={{ width: `${audioMeterLevel}%` }}
                />
              </div>
            )}
          </div>

          <div className="flex justify-center gap-3">
            {isRecording ? (
              <Button variant="destructive" onClick={handleStopRecording}>
                Stop Recording
              </Button>
            ) : (
              <Button onClick={handleStartRecording} className="bg-red-600 hover:bg-red-700 text-white">
                ● Start Recording
              </Button>
            )}
          </div>

          {recordedAudioUrl && !isRecording && (
            <div className="pt-4 border-t space-y-3">
              <span className="text-xs font-semibold text-slate-600 block">Preview Recording:</span>
              <audio controls className="w-full h-10">
                <source src={recordedAudioUrl} type="audio/webm" />
              </audio>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                if (isRecording) handleStopRecording()
                setIsRecordModalOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button disabled={!recordedBlob || isRecording || isPending} onClick={handleSaveRecordedVoiceNote}>
              Save Voice Note
            </Button>
          </div>
        </div>
      </Modal>

      {/* Accessible Upload Audio File Modal */}
      <Modal
        isOpen={isVoiceUploadModalOpen}
        onClose={() => setIsVoiceUploadModalOpen(false)}
        title="Upload Audio Recording"
        description="Upload an existing MP3, WAV, or WebM audio file."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Recording Title</label>
            <Input
              value={voiceTitle}
              onChange={(e) => setVoiceTitle(e.target.value)}
              placeholder="e.g. Rabbi Cohen Parent Interview 09-12-2026"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Audio File</label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => e.target.files && setVoiceFile(e.target.files[0])}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 hover:file:bg-slate-200"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsVoiceUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isPending || !voiceFile} onClick={handleConfirmVoiceUpload}>
              Upload Audio File
            </Button>
          </div>
        </div>
      </Modal>

      {/* Accessible Transcript Upload/Replace Modal */}
      <Modal
        isOpen={isTranscriptModalOpen}
        onClose={() => setIsTranscriptModalOpen(false)}
        title={replacingTranscriptId ? 'Replace School Transcript' : 'Upload School Transcript'}
        description={`Upload academic records for ${camper.name}.`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Transcript Document (PDF)</label>
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => e.target.files && setTranscriptFile(e.target.files[0])}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 hover:file:bg-slate-200"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsTranscriptModalOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isPending || !transcriptFile} onClick={handleConfirmTranscriptUpload}>
              {replacingTranscriptId ? 'Replace Transcript' : 'Upload Transcript'}
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

      {/* Accessible Document Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        onConfirm={handleConfirmDeleteDoc}
        title="Delete Document"
        message={`Are you sure you want to delete "${docToDelete?.name}"? This file will be permanently removed from Google Drive.`}
        confirmText="Delete Document"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Accessible Notification Modal */}
      <Modal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        title={notification.title}
        description={notification.description}
      >
        <div className="flex justify-end pt-2">
          <Button onClick={() => setNotification({ ...notification, isOpen: false })}>Close</Button>
        </div>
      </Modal>
    </div>
  )
}
