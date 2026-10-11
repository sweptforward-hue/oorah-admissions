'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { updateDriveFolder, testDriveConnection, getDriveStorageConfig } from '@/lib/admin/actions'

export default function AdminStoragePage() {
  const [folderId, setFolderId] = useState('1A2B3C4D5E6F7G8H9I0J')
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const [driveInfo, setDriveInfo] = useState<{
    success: boolean
    message: string
    user?: { displayName?: string; emailAddress?: string }
    storageQuota?: { limit?: string; usage?: string; usageInDrive?: string }
  } | null>(null)

  useEffect(() => {
    let isMounted = true
    getDriveStorageConfig()
      .then((res) => {
        if (!isMounted) return
        if (res.folderId) {
          setFolderId(res.folderId)
        }
        setDriveInfo(res.connection)
        setIsLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Failed to load drive config:', err)
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

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
        setDriveInfo(res)
        if (res.success) {
          alert(res.message || 'Connection verified successfully.')
        } else {
          alert(res.message || 'Connection test failed.')
        }
      } catch (err: unknown) {
        alert((err as Error).message || 'Connection test failed')
      }
    })
  }

  const formatBytes = (bytesStr?: string) => {
    if (!bytesStr) return 'N/A'
    const bytes = parseInt(bytesStr, 10)
    if (isNaN(bytes)) return bytesStr
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
              <div className="text-xs text-slate-500 font-mono mt-0.5">{folderId}</div>
            </div>
            <Button variant="outline" size="sm" onClick={handleUpdateFolder} disabled={isPending || isLoading}>
              Update Folder
            </Button>
          </div>

          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <div className="font-semibold text-slate-800 font-medium">Google Drive Connection Status</div>
              <div className="text-xs flex items-center gap-2 mt-1">
                {isLoading ? (
                  <span className="text-slate-400">Checking connection...</span>
                ) : driveInfo?.success ? (
                  <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span> Connected (Google Drive API v3)
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500 inline-block"></span> {driveInfo?.message || 'Disconnected'}
                  </span>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={isPending || isLoading}>
              {isPending ? 'Verifying...' : 'Test Connection'}
            </Button>
          </div>

          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <div className="font-semibold text-slate-800 font-medium">Service Account User</div>
              <div className="text-xs text-slate-600 font-mono mt-0.5">
                {isLoading ? 'Loading...' : driveInfo?.user?.emailAddress || driveInfo?.user?.displayName || 'Not Configured'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-800 font-medium">Storage Quota & Usage</div>
              <div className="text-xs text-slate-600 mt-0.5 space-y-0.5">
                {isLoading ? (
                  'Loading...'
                ) : driveInfo?.storageQuota ? (
                  <div>
                    Used: <span className="font-mono">{formatBytes(driveInfo.storageQuota.usage)}</span>
                    {driveInfo.storageQuota.limit && (
                      <> / Total Limit: <span className="font-mono">{formatBytes(driveInfo.storageQuota.limit)}</span></>
                    )}
                  </div>
                ) : (
                  'Quota information unavailable'
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
