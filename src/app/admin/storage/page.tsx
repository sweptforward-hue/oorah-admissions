'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { updateDriveFolder, testDriveConnection } from '@/lib/admin/actions'
import { createBrowserClient } from '@/lib/supabase/client'

export default function AdminStoragePage() {
  const [folderId, setFolderId] = useState('1A2B3C4D5E6F7G8H9I0J')
  const [isPending, startTransition] = useTransition()
  const [isAuthorizing, setIsAuthorizing] = useState(false)

  const handleUpdateFolder = () => {
    const newFolder = prompt('Enter new Google Drive Root Folder ID:', folderId)
    if (!newFolder || newFolder.trim() === '') return

    startTransition(async () => {
      try {
        await updateDriveFolder(newFolder.trim())
        setFolderId(newFolder.trim())
        alert('Root admissions folder updated and recorded in audit log.')
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to update folder')
      }
    })
  }

  const handleTestConnection = () => {
    startTransition(async () => {
      try {
        const res = await testDriveConnection()
        alert(res.message || 'Connection verified successfully.')
      } catch (err: unknown) {
        alert((err as Error).message || 'Connection test failed')
      }
    })
  }

  const handleAuthorizeGoogleDrive = async () => {
    try {
      setIsAuthorizing(true)
      const supabase = createBrowserClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/admin/storage`,
          scopes: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      if (error) {
        alert(`OAuth error: ${error.message}`)
        setIsAuthorizing(false)
      }
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to initiate Google Drive OAuth')
      setIsAuthorizing(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Google Drive & Document Storage</h1>
      <p className="text-sm text-slate-500">Configure direct cloud storage integration for heavy files</p>

      <Card>
        <CardHeader>
          <CardTitle>Google Drive Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <div className="font-semibold text-slate-800">Root Admissions Folder ID</div>
              <div className="text-xs text-slate-500">{folderId}</div>
            </div>
            <Button variant="outline" size="sm" onClick={handleUpdateFolder} disabled={isPending}>
              Update Folder
            </Button>
          </div>

          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <div className="font-semibold text-slate-800">OAuth 2.0 Google Drive Access</div>
              <div className="text-xs text-slate-500">
                Grant OAuth 2.0 read, write, and store permissions for admissions documents & media
              </div>
            </div>
            <Button
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleAuthorizeGoogleDrive}
              disabled={isAuthorizing}
            >
              {isAuthorizing ? 'Connecting...' : 'Authorize with Google (Read/Write/Store)'}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-800">OAuth Service Connection</div>
              <div className="text-xs text-green-600">● Connected (Google Cloud Platform)</div>
            </div>
            <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={isPending}>
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
