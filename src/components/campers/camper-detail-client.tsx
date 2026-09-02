'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/layout/Navbar'
import { Kid } from '@/types'
import { updateCamperStatus, toggleCamperVoting } from '@/lib/campers/actions'
import {
  sendChatMessage,
  uploadDocumentToDrive,
  castVaadVoteAction,
  generateContractPdf,
  uploadSignedContract,
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
  const [camper, setCamper] = useState<Kid>(initialCamper)
  const [noteText, setNoteText] = useState('')
  const [messages, setMessages] = useState<string[]>([
    'Rabbi Cohen: @Azriel Cohenca Please review the recommendation letter attached.'
  ])
  const [docs, setDocs] = useState<string[]>([])
  const [contractStatus, setContractStatus] = useState<string>('Pending Generation')
  const [isPending, startTransition] = useTransition()

  // Header Actions
  const handleStatusChange = async () => {
    const newStatus = prompt('Enter new status (e.g. Accepted, Rejected, Interview):')
    if (!newStatus) return
    const reason = prompt('Enter reason for manual override:')
    if (!reason) return

    startTransition(async () => {
      try {
        await updateCamperStatus(camper.id, newStatus, reason)
        setCamper({ ...camper, status: newStatus as any })
        alert(`Status updated to ${newStatus}`)
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to update status')
      }
    })
  }

  const handleExportData = async () => {
    startTransition(async () => {
      try {
        await triggerExport('CSV')
        alert(`Data for ${camper.name} exported successfully.`)
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to export data')
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
        setMessages(prev => [...prev, `You: ${textToSend}`])
        setNoteText('')
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to send note')
      }
    })
  }

  // Documents Tab
  const handleUploadDrive = async () => {
    const fileName = prompt('Enter document name to upload to Google Drive:', `${camper.name}_Transcript.pdf`)
    if (!fileName) return

    startTransition(async () => {
      try {
        await uploadDocumentToDrive(camper.id, fileName)
        setDocs(prev => [...prev, fileName])
        alert(`Document "${fileName}" uploaded to Google Drive.`)
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to upload document')
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
        alert((err as Error).message || 'Failed to toggle voting state')
      }
    })
  }

  const handleVote = async (choiceLabel: 'Accept' | 'Reject' | 'Abstain' | 'Request Interview') => {
    startTransition(async () => {
      try {
        await castVaadVoteAction(camper.id, choiceLabel)
        alert(`Recorded vote "${choiceLabel}" for ${camper.name}.`)
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to submit vote')
      }
    })
  }

  // Contract Tab
  const handleGenerateContract = async () => {
    startTransition(async () => {
      try {
        await generateContractPdf(camper.id)
        setContractStatus('Contract PDF Generated')
        alert('Contract PDF generated successfully.')
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to generate contract PDF')
      }
    })
  }

  const handleUploadSigned = async () => {
    startTransition(async () => {
      try {
        await uploadSignedContract(camper.id)
        setContractStatus('Signed Contract Uploaded')
        alert('Signed contract uploaded and verified.')
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to upload signed contract')
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
              <Button variant="outline" disabled={isPending} onClick={handleStatusChange}>
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
                <div className="space-y-2">
                  {messages.map((m, idx) => (
                    <div key={idx} className="p-4 bg-slate-100 rounded-lg text-sm text-slate-700">
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
                  <Button variant="outline" disabled={isPending} onClick={handleUploadDrive}>
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
    </div>
  )
}
