'use client'

import { useState, useTransition } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { updateDriveFolder, testDriveConnection } from '@/lib/admin/actions'

export default function AdminStoragePage() {
  const [folderId, setFolderId] = useState('1A2B3C4D5E6F7G8H9I0J')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleUpdateFolder = async () => {
    const newFolder = prompt('Enter new Root Google Drive Folder ID:', folderId)
    if (!newFolder || newFolder.trim() === folderId) return

    startTransition(async () => {
      try {
        await updateDriveFolder(newFolder.trim())
        setFolderId(newFolder.trim())
        setStatusMessage(`Updated storage root folder ID to "${newFolder.trim()}". Action recorded in audit log.`)
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to update folder')
      }
    })
  }

  const handleTestConnection = async () => {
    startTransition(async () => {
      try {
        const res = await testDriveConnection()
        setStatusMessage(res.message)
      } catch (err: unknown) {
        alert((err as Error).message || 'Connection test failed')
      }
    })
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Google Drive & Document Storage</h1>
      <p className="text-sm text-slate-500">Configure direct cloud storage integration for heavy files</p>

      {statusMessage && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
          {statusMessage}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Google Drive Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <div className="font-semibold text-slate-800">Root Admissions Folder ID</div>
              <div className="text-xs text-slate-500 font-mono">{folderId}</div>
            </div>
            <Button variant="outline" size="sm" disabled={isPending} onClick={handleUpdateFolder}>
              Update Folder
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-800">OAuth Service Connection</div>
              <div className="text-xs text-green-600">● Connected (Google Cloud Platform)</div>
            </div>
            <Button variant="outline" size="sm" disabled={isPending} onClick={handleTestConnection}>
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
