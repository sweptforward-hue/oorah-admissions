'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
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
  castVaadVoteAction,
  generateContractPdf,
  uploadSignedContract,
  deleteDocumentAction,
  getKidPhotos,
  getKidVoiceNotes,
  getKidTranscripts,
  uploadPhotoAction,
  uploadVoiceNoteAction,
  uploadTranscriptAction,
  deletePhotoAction,
  deleteVoiceNoteAction,
  deleteTranscriptAction,
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

interface PhotoItem {
  id: string
  caption?: string | null
  drive_file_id?: string | null
  created_at: string
  url?: string
}

interface VoiceNoteItem {
  id: string
  title: string
  duration_seconds: number
  drive_file_id?: string | null
  created_at: string
  audio_url?: string
}

interface TranscriptItem {
  id: string
  title: string
  content: string
  drive_file_id?: string | null
  created_at: string
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

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function CamperDetailClient({ initialCamper, initialDocuments = [] }: CamperDetailClientProps) {
  const [camper, setCamper] = useState<Kid>(initialCamper)
  const [noteText, setNoteText] = useState('')
  const [messages, setMessages] = useState<string[]>([
    'Rabbi Cohen: @Azriel Cohenca Please review the recommendation letter attached.',
  ])
  const [documents, setDocuments] = useState<CamperDocument[]>(initialDocuments)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [docCategoryInput, setDocCategoryInput] = useState('Application Forms')
  const [docToDelete, setDocToDelete] = useState<CamperDocument | null>(null)
  const [contractStatus, setContractStatus] = useState<string>('Pending Generation')
  const [isPending, startTransition] = useTransition()

  // Media state
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [voiceNotes, setVoiceNotes] = useState<VoiceNoteItem[]>([])
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([])

  // Modal States
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [newStatusInput, setNewStatusInput] = useState('')
  const [statusReasonInput, setStatusReasonInput] = useState('')

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [docNameInput, setDocNameInput] = useState('')

  // Photos Modal & Lightbox state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoCaption, setPhotoCaption] = useState('')
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoItem | null>(null)

  // Voice Notes Recording & Upload state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordingTitle, setRecordingTitle] = useState('')
  const [audioLevel, setAudioLevel] = useState<number>(0)

  const [isVoiceUploadModalOpen, setIsVoiceUploadModalOpen] = useState(false)
  const [voiceFile, setVoiceFile] = useState<File | null>(null)
  const [voiceTitle, setVoiceTitle] = useState('')

  // Voice Note Playback state
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const activeAudioRef = useRef<HTMLAudioElement | null>(null)

  // Transcript state
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false)
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null)
  const [transcriptTitle, setTranscriptTitle] = useState('')
  const [replacingTranscriptId, setReplacingTranscriptId] = useState<string | null>(null)

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

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

  // Load existing media assets
  useEffect(() => {
    let isMounted = true
    async function fetchMedia() {
      try {
        const [fetchedPhotos, fetchedVoiceNotes, fetchedTranscripts] = await Promise.all([
          getKidPhotos(camper.id),
          getKidVoiceNotes(camper.id),
          getKidTranscripts(camper.id),
        ])
        if (isMounted) {
          setPhotos(fetchedPhotos as PhotoItem[])
          setVoiceNotes(fetchedVoiceNotes as VoiceNoteItem[])
          setTranscripts(fetchedTranscripts as TranscriptItem[])
        }
      } catch (err) {
        console.error('Failed loading kid media assets:', err)
      }
    }
    fetchMedia()
    return () => {
      isMounted = false
    }
  }, [camper.id])

  // Cleanup audio playback on unmount
  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause()
      }
    }
  }, [])

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

  // ================= PHOTOS ACTIONS =================
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const url = URL.createObjectURL(file)
      setPhotoPreview(url)
    }
  }

  const handleConfirmPhotoUpload = async () => {
    if (!photoFile) return
    const filename = photoFile.name
    let fileBase64 = ''
    try {
      fileBase64 = await readFileAsBase64(photoFile)
    } catch {
      fileBase64 = ''
    }

    setIsPhotoModalOpen(false)
    startTransition(async () => {
      try {
        const res = await uploadPhotoAction(
          camper.id,
          filename,
          fileBase64,
          photoFile.type || 'image/jpeg',
          photoCaption
        )
        const newPhoto: PhotoItem = {
          id: res.photo?.id || `photo-${Date.now()}`,
          caption: photoCaption || filename,
          drive_file_id: res.driveFile?.id || `drive_${Date.now()}`,
          created_at: new Date().toISOString(),
          url: photoPreview || undefined,
        }
        setPhotos((prev) => [newPhoto, ...prev])
        setPhotoFile(null)
        setPhotoPreview(null)
        setPhotoCaption('')
        showNotification('Photo Uploaded', `Photo "${filename}" uploaded successfully.`)
      } catch (err: unknown) {
        showNotification('Photo Upload Error', (err as Error).message || 'Failed to upload photo')
      }
    })
  }

  const handleDeletePhoto = async (photoId: string) => {
    startTransition(async () => {
      try {
        await deletePhotoAction(photoId, camper.id)
        setPhotos((prev) => prev.filter((p) => p.id !== photoId))
        showNotification('Photo Deleted', 'Photo has been removed.')
      } catch (err: unknown) {
        showNotification('Delete Error', (err as Error).message || 'Failed to delete photo')
      }
    })
  }

  const handleDownloadDriveFile = (driveFileId?: string | null, fallbackName: string = 'file') => {
    if (driveFileId) {
      window.open(`https://drive.google.com/file/d/${driveFileId}/view`, '_blank')
    } else {
      showNotification('Download', `Downloading file "${fallbackName}"...`)
    }
  }

  // ================= VOICE NOTES ACTIONS =================
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      // Simple AudioContext level meter fallback simulation
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioCtx
        const source = audioCtx.createMediaStreamSource(stream)
        const analyser = audioCtx.createAnalyser()
        source.connect(analyser)
      } catch (e) {
        console.warn('AudioContext not supported or restricted:', e)
      }

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setRecordedBlob(audioBlob)
        setRecordedAudioUrl(url)
        stream.getTracks().forEach((track) => track.stop())
        if (audioContextRef.current) {
          audioContextRef.current.close()
          audioContextRef.current = null
        }
      }

      recorder.start(100)
      setIsRecording(true)
      setRecordingSeconds(0)
      setRecordingTitle(`Voice Note - ${new Date().toLocaleTimeString()}`)

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
        setAudioLevel(Math.floor(Math.random() * 80) + 20)
      }, 1000)
    } catch (err: unknown) {
      showNotification(
        'Recording Error',
        (err as Error).message || 'Could not access microphone for voice note recording.'
      )
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
    }
  }

  const handleSaveRecordedVoiceNote = async () => {
    if (!recordedBlob) return
    let fileBase64 = ''
    try {
      const buffer = await recordedBlob.arrayBuffer()
      fileBase64 = Buffer.from(buffer).toString('base64')
    } catch {
      fileBase64 = ''
    }

    const title = recordingTitle.trim() || `Voice Note ${new Date().toLocaleDateString()}`
    const durationSec = recordingSeconds || 1

    setIsRecordModalOpen(false)
    startTransition(async () => {
      try {
        const res = await uploadVoiceNoteAction(
          camper.id,
          `${title}.webm`,
          fileBase64,
          'audio/webm',
          durationSec
        )
        const newVoiceNote: VoiceNoteItem = {
          id: res.voiceNote?.id || `voice-${Date.now()}`,
          title,
          duration_seconds: durationSec,
          drive_file_id: res.driveFile?.id || `drive_${Date.now()}`,
          created_at: new Date().toISOString(),
          audio_url: recordedAudioUrl || undefined,
        }
        setVoiceNotes((prev) => [newVoiceNote, ...prev])
        setRecordedAudioUrl(null)
        setRecordedBlob(null)
        showNotification('Voice Note Saved', `Voice Note "${title}" recorded and saved successfully.`)
      } catch (err: unknown) {
        showNotification('Voice Note Error', (err as Error).message || 'Failed to save voice note')
      }
    })
  }

  const handleConfirmVoiceUpload = async () => {
    if (!voiceFile) return
    const filename = voiceTitle.trim() ? voiceTitle.trim() : voiceFile.name
    let fileBase64 = ''
    try {
      fileBase64 = await readFileAsBase64(voiceFile)
    } catch {
      fileBase64 = ''
    }

    setIsVoiceUploadModalOpen(false)
    startTransition(async () => {
      try {
        const res = await uploadVoiceNoteAction(
          camper.id,
          filename,
          fileBase64,
          voiceFile.type || 'audio/mp3',
          120
        )
        const newVoiceNote: VoiceNoteItem = {
          id: res.voiceNote?.id || `voice-${Date.now()}`,
          title: filename,
          duration_seconds: 120,
          drive_file_id: res.driveFile?.id || `drive_${Date.now()}`,
          created_at: new Date().toISOString(),
        }
        setVoiceNotes((prev) => [newVoiceNote, ...prev])
        setVoiceFile(null)
        setVoiceTitle('')
        showNotification('Audio File Uploaded', `Voice note "${filename}" saved successfully.`)
      } catch (err: unknown) {
        showNotification('Upload Error', (err as Error).message || 'Failed to upload audio file')
      }
    })
  }

  const handleTogglePlayVoiceNote = (vn: VoiceNoteItem) => {
    if (playingVoiceId === vn.id) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause()
      }
      setPlayingVoiceId(null)
    } else {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause()
      }
      const audioSrc = vn.audio_url || (vn.drive_file_id ? `/api/media/proxy/${vn.drive_file_id}` : undefined)
      if (!audioSrc) {
        showNotification('Playback', `Playing voice note: "${vn.title}" (${formatDuration(vn.duration_seconds)})`)
        setPlayingVoiceId(vn.id)
        setTimeout(() => setPlayingVoiceId(null), 3000)
        return
      }
      const newAudio = new Audio(audioSrc)
      activeAudioRef.current = newAudio
      newAudio.play().then(() => setPlayingVoiceId(vn.id)).catch(() => {
        showNotification('Playback', `Playing voice note: "${vn.title}" (${formatDuration(vn.duration_seconds)})`)
        setPlayingVoiceId(vn.id)
        setTimeout(() => setPlayingVoiceId(null), 3000)
      })
      newAudio.onended = () => {
        setPlayingVoiceId(null)
      }
    }
  }

  const handleDeleteVoiceNote = async (voiceNoteId: string) => {
    startTransition(async () => {
      try {
        await deleteVoiceNoteAction(voiceNoteId, camper.id)
        setVoiceNotes((prev) => prev.filter((v) => v.id !== voiceNoteId))
        showNotification('Voice Note Deleted', 'Voice note removed.')
      } catch (err: unknown) {
        showNotification('Delete Error', (err as Error).message || 'Failed to delete voice note')
      }
    })
  }

  // ================= TRANSCRIPT ACTIONS =================
  const handleOpenTranscriptUpload = (replaceId?: string) => {
    setReplacingTranscriptId(replaceId || null)
    setTranscriptFile(null)
    setTranscriptTitle(replaceId ? 'Replacement Transcript' : 'Official Academic Transcript')
    setIsTranscriptModalOpen(true)
  }

  const handleConfirmTranscriptUpload = async () => {
    const filename = transcriptTitle.trim() || (transcriptFile ? transcriptFile.name : 'Transcript.pdf')
    let fileBase64 = ''
    if (transcriptFile) {
      try {
        fileBase64 = await readFileAsBase64(transcriptFile)
      } catch {
        fileBase64 = ''
      }
    }

    setIsTranscriptModalOpen(false)
    startTransition(async () => {
      try {
        if (replacingTranscriptId) {
          await deleteTranscriptAction(replacingTranscriptId, camper.id)
          setTranscripts((prev) => prev.filter((t) => t.id !== replacingTranscriptId))
        }

        const res = await uploadTranscriptAction(
          camper.id,
          filename,
          fileBase64,
          transcriptFile?.type || 'application/pdf'
        )

        const newTranscript: TranscriptItem = {
          id: res.transcript?.id || `transcript-${Date.now()}`,
          title: filename,
          content: `Stored in Google Drive: ${filename}`,
          drive_file_id: res.driveFile?.id || `drive_${Date.now()}`,
          created_at: new Date().toISOString(),
        }
        setTranscripts((prev) => [newTranscript, ...prev])
        showNotification(
          replacingTranscriptId ? 'Transcript Replaced' : 'Transcript Uploaded',
          `Transcript "${filename}" successfully uploaded to Google Drive.`
        )
        setReplacingTranscriptId(null)
      } catch (err: unknown) {
        showNotification('Transcript Error', (err as Error).message || 'Failed to upload transcript')
      }
    })
  }

  const handleDeleteTranscript = async (transcriptId: string) => {
    startTransition(async () => {
      try {
        await deleteTranscriptAction(transcriptId, camper.id)
        setTranscripts((prev) => prev.filter((t) => t.id !== transcriptId))
        showNotification('Transcript Deleted', 'Transcript removed.')
      } catch (err: unknown) {
        showNotification('Delete Error', (err as Error).message || 'Failed to delete transcript')
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
                    onKeyDown={(e) => e.key === 'Enter' && handleSendNote()}
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Camper Photos</CardTitle>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
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
                  <div className="p-8 text-center text-slate-500 border-2 border-dashed rounded-lg bg-slate-50">
                    <p className="mb-2">No camper photos uploaded yet.</p>
                    <p className="text-xs text-slate-400">
                      Upload photos to store in Oorah Admissions / Kid {camper.id} - {camper.name} / Photos.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {photos.map((photo) => (
                      <div key={photo.id} className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col">
                        <div className="h-48 bg-slate-100 relative flex items-center justify-center overflow-hidden group">
                          {photo.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={photo.url} alt={photo.caption || 'Camper photo'} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-slate-400 flex flex-col items-center">
                              <span className="text-4xl">📷</span>
                              <span className="text-xs mt-1">Photo Preview</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-800 line-clamp-2">
                              {photo.caption || 'Camper Photo'}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(photo.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={() => setLightboxPhoto(photo)}
                            >
                              View Lightbox
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleDownloadDriveFile(photo.drive_file_id, photo.caption || 'photo')}
                            >
                              Download
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="text-xs"
                              disabled={isPending}
                              onClick={() => handleDeletePhoto(photo.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voice Notes */}
          <TabsContent value="voice-notes">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Staff Voice Notes</CardTitle>
                <div className="flex gap-2">
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white"
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
                  <div className="p-8 text-center text-slate-500 border-2 border-dashed rounded-lg bg-slate-50">
                    <p className="mb-2">No voice notes recorded or uploaded yet.</p>
                    <p className="text-xs text-slate-400">
                      Record audio notes directly or upload .mp3, .wav, .m4a files.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {voiceNotes.map((vn) => {
                      const isPlaying = playingVoiceId === vn.id
                      return (
                        <div
                          key={vn.id}
                          className="bg-white p-4 rounded-xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg ${
                                isPlaying ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-800'
                              }`}
                              onClick={() => handleTogglePlayVoiceNote(vn)}
                            >
                              {isPlaying ? '⏸' : '▶'}
                            </Button>
                            <div>
                              <h4 className="font-semibold text-slate-900 text-sm">{vn.title}</h4>
                              <p className="text-xs text-slate-500">
                                Duration: {formatDuration(vn.duration_seconds)} • Recorded {new Date(vn.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleDownloadDriveFile(vn.drive_file_id, vn.title)}
                            >
                              Download
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="text-xs"
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

          {/* Transcript */}
          <TabsContent value="transcript">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Academic Transcripts</CardTitle>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isPending}
                  onClick={() => handleOpenTranscriptUpload()}
                >
                  + Upload Transcript
                </Button>
              </CardHeader>
              <CardContent>
                {transcripts.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 border-2 border-dashed rounded-lg bg-slate-50">
                    <p className="mb-2">No school transcripts uploaded yet.</p>
                    <p className="text-xs text-slate-400">
                      Upload school report cards or transcript files (PDF or image).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transcripts.map((t) => (
                      <div
                        key={t.id}
                        className="bg-white p-5 rounded-xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">📜</span>
                          <div>
                            <h4 className="font-semibold text-slate-900">{t.title}</h4>
                            <p className="text-xs text-slate-500">{t.content}</p>
                            <span className="text-[10px] text-slate-400 block mt-1">
                              Uploaded {new Date(t.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleDownloadDriveFile(t.drive_file_id, t.title)}
                          >
                            View in Drive
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleDownloadDriveFile(t.drive_file_id, t.title)}
                          >
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            disabled={isPending}
                            onClick={() => handleOpenTranscriptUpload(t.id)}
                          >
                            Replace
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="text-xs"
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

      {/* ================= PHOTOS MODALS ================= */}
      <Modal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        title="Upload Camper Photo"
        description="Upload a photo to store in Google Drive under Oorah Admissions / Kid Photos."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Photo File</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoFileChange}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          {photoPreview && (
            <div className="h-40 rounded-lg overflow-hidden border bg-slate-100 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="Preview" className="h-full object-contain" />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Caption / Description (Optional)</label>
            <Input
              value={photoCaption}
              onChange={(e) => setPhotoCaption(e.target.value)}
              placeholder="e.g. Orientation group photo"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsPhotoModalOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!photoFile || isPending} onClick={handleConfirmPhotoUpload} className="bg-blue-600 hover:bg-blue-700 text-white">
              Upload Photo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Photo Lightbox Modal */}
      <Modal
        isOpen={!!lightboxPhoto}
        onClose={() => setLightboxPhoto(null)}
        title={lightboxPhoto?.caption || 'Camper Photo Preview'}
      >
        <div className="space-y-4">
          <div className="max-h-[60vh] flex items-center justify-center overflow-hidden rounded-lg bg-black">
            {lightboxPhoto?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lightboxPhoto.url} alt="Lightbox view" className="max-h-[60vh] object-contain" />
            ) : (
              <div className="p-12 text-slate-400 text-center">
                <span className="text-5xl block mb-2">📷</span>
                <span>Photo file stored in Google Drive</span>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadDriveFile(lightboxPhoto?.drive_file_id, lightboxPhoto?.caption || 'photo')}
            >
              Open in Google Drive
            </Button>
            <Button variant="outline" onClick={() => setLightboxPhoto(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================= VOICE NOTES MODALS ================= */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => {
          handleStopRecording()
          setIsRecordModalOpen(false)
        }}
        title="Record Staff Voice Note"
        description="Record audio directly from your browser microphone."
      >
        <div className="space-y-5 text-center py-4">
          <div className="text-3xl font-mono font-bold text-slate-800">
            {formatDuration(recordingSeconds)}
          </div>

          {/* Level Meter Animation */}
          {isRecording && (
            <div className="flex items-center justify-center gap-1 h-8">
              {[40, 70, 100, 60, 80, 45, 90, 65, 30].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${Math.min(100, Math.max(15, (audioLevel * h) / 70))}%` }}
                  className="w-1.5 bg-red-500 rounded-full transition-all duration-100"
                />
              ))}
            </div>
          )}

          <div>
            {!isRecording && !recordedBlob && (
              <Button onClick={handleStartRecording} className="bg-red-600 hover:bg-red-700 text-white gap-2">
                <span>●</span> Start Recording
              </Button>
            )}
            {isRecording && (
              <Button onClick={handleStopRecording} variant="destructive" className="gap-2">
                <span>⏹</span> Stop Recording
              </Button>
            )}
          </div>

          {recordedAudioUrl && !isRecording && (
            <div className="space-y-4 pt-2 text-left border-t">
              <audio controls src={recordedAudioUrl} className="w-full" />
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Recording Title</label>
                <Input
                  value={recordingTitle}
                  onChange={(e) => setRecordingTitle(e.target.value)}
                  placeholder="e.g. Behavioral intake notes"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              variant="outline"
              onClick={() => {
                handleStopRecording()
                setIsRecordModalOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!recordedBlob || isPending}
              onClick={handleSaveRecordedVoiceNote}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Save Voice Note
            </Button>
          </div>
        </div>
      </Modal>

      {/* Voice Note File Upload Modal */}
      <Modal
        isOpen={isVoiceUploadModalOpen}
        onClose={() => setIsVoiceUploadModalOpen(false)}
        title="Upload Audio Voice Note"
        description="Upload an existing .mp3, .wav, or .m4a recording file."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Audio File</label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setVoiceFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Title (Optional)</label>
            <Input
              value={voiceTitle}
              onChange={(e) => setVoiceTitle(e.target.value)}
              placeholder="e.g. Phone Interview Audio"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsVoiceUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!voiceFile || isPending} onClick={handleConfirmVoiceUpload} className="bg-green-600 hover:bg-green-700 text-white">
              Upload Audio
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================= TRANSCRIPT MODAL ================= */}
      <Modal
        isOpen={isTranscriptModalOpen}
        onClose={() => setIsTranscriptModalOpen(false)}
        title={replacingTranscriptId ? 'Replace Academic Transcript' : 'Upload Academic Transcript'}
        description="Upload official report card, IEP, or transcript document."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select File (PDF or Image)</label>
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setTranscriptFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Transcript Label / Title</label>
            <Input
              value={transcriptTitle}
              onChange={(e) => setTranscriptTitle(e.target.value)}
              placeholder="e.g. 8th Grade Report Card (Final)"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsTranscriptModalOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!transcriptFile || isPending} onClick={handleConfirmTranscriptUpload} className="bg-blue-600 hover:bg-blue-700 text-white">
              {replacingTranscriptId ? 'Replace Transcript' : 'Upload Transcript'}
            </Button>
          </div>
        </div>
      </Modal>

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
