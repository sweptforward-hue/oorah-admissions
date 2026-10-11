'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  getDriveStorageConfig,
  updateDriveFolder,
  testDriveConnection,
  checkDriveFolderHealthAction,
} from '@/lib/admin/actions'

interface ConnectionStatus {
  success: boolean
  message: string
  user?: { displayName?: string; emailAddress?: string }
}

interface FolderHealthStatus {
  success: boolean
  message: string
  folder?: { id: string; name: string; mimeType: string; trashed?: boolean }
}

export default function AdminStoragePage() {
  const [folderId, setFolderId] = useState<string>('')
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [healthStatus, setHealthStatus] = useState<FolderHealthStatus | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let isMounted = true
    getDriveStorageConfig()
      .then((config) => {
        if (!isMounted) return
        setFolderId(config.folderId)
        setConnectionStatus(config.connection)
        setHealthStatus(config.folderHealth)
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        alert((err as Error).message || 'Failed to load storage configuration')
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handleUpdateFolder = () => {
    const newFolder = prompt('Enter Google Drive Root Folder ID:', folderId)
    if (newFolder === null) return
    const trimmed = newFolder.trim()

    startTransition(async () => {
      try {
        await updateDriveFolder(trimmed)
        setFolderId(trimmed)
        if (trimmed) {
          const health = await checkDriveFolderHealthAction(trimmed)
          setHealthStatus(health)
        } else {
          setHealthStatus({ success: false, message: 'No folder ID configured.' })
        }
        alert('Root admissions folder updated.')
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to update folder')
      }
    })
  }

  const handleTestConnection = () => {
    startTransition(async () => {
      try {
        const res = await testDriveConnection()
        setConnectionStatus(res)
        alert(res.message || 'Connection test completed.')
      } catch (err: unknown) {
        alert((err as Error).message || 'Connection test failed')
      }
    })
  }

  const handleCheckHealth = () => {
    if (!folderId) {
      alert('Please configure a Root Folder ID first.')
      return
    }

    startTransition(async () => {
      try {
        const health = await checkDriveFolderHealthAction(folderId)
        setHealthStatus(health)
        alert(health.message)
      } catch (err: unknown) {
        alert((err as Error).message || 'Health check failed')
      }
    })
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Google Drive & Document Storage</h1>
        <p className="text-sm text-slate-500">Loading Google Drive API integration status...</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Google Drive & Document Storage</h1>
      <p className="text-sm text-slate-500">Configure direct cloud storage integration for heavy admissions files</p>

      <Card>
        <CardHeader>
          <CardTitle>Google Drive Integration & Health Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          {/* Service Account Connection */}
          <div className="border-b pb-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800">OAuth Service Connection</div>
                <div className="text-xs text-slate-500">
                  Backend service account connection (API v3)
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={isPending}>
                {isPending ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>
            {connectionStatus && (
              <div className="text-xs">
                {connectionStatus.success ? (
                  <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                    Connected: {connectionStatus.message}
                  </span>
                ) : (
                  <span className="text-rose-600 font-medium flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
                    Disconnected: {connectionStatus.message}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Root Admissions Folder ID */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800">Root Admissions Folder ID</div>
                <div className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded mt-1 inline-block">
                  {folderId || 'Not configured'}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCheckHealth} disabled={isPending || !folderId}>
                  Check Health
                </Button>
                <Button variant="default" size="sm" onClick={handleUpdateFolder} disabled={isPending}>
                  Update Folder
                </Button>
              </div>
            </div>

            {/* Folder Health Result */}
            {healthStatus && (
              <div className="mt-3 p-3 rounded-md bg-slate-50 border text-xs space-y-1">
                <div className="font-medium text-slate-700">Folder Health Status:</div>
                {healthStatus.success ? (
                  <div className="text-emerald-700 flex items-center gap-1.5 font-medium">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                    {healthStatus.message}
                  </div>
                ) : (
                  <div className="text-amber-700 flex items-center gap-1.5 font-medium">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                    {healthStatus.message}
                  </div>
                )}
                {healthStatus.folder && (
                  <div className="text-slate-500 text-2xs mt-1">
                    Folder Name: <span className="font-semibold text-slate-700">{healthStatus.folder.name}</span> | ID:{' '}
                    <span className="font-mono text-slate-700">{healthStatus.folder.id}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
