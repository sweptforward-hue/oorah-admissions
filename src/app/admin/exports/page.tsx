'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { triggerExport } from '@/lib/admin/actions'

export default function AdminExportsPage() {
  const [exporting, setExporting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [lastDestination, setLastDestination] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleExport = async (destination: 'Sheets' | 'CSV' | 'Drive Archive') => {
    if (!window.confirm(`Confirm export to ${destination}? This action will be audited.`)) return
    setExporting(true)
    startTransition(async () => {
      try {
        await triggerExport(destination)
        setLastDestination(destination)
        setConfirmed(true)
      } catch (err: unknown) {
        alert((err as Error).message || 'Export failed')
      } finally {
        setExporting(false)
      }
    })
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Data Exports</h1>
        <p className="text-sm text-slate-500">Export admission rosters and financial metadata with audit logging</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <CardTitle className="text-lg font-bold mb-2">Google Sheets Sync</CardTitle>
          <p className="text-xs text-slate-500 mb-4">Export active roster to Google Drive Sheet spreadsheet.</p>
          <Button onClick={() => handleExport('Sheets')} disabled={exporting || isPending}>
            Export to Sheets
          </Button>
        </Card>

        <Card className="p-6">
          <CardTitle className="text-lg font-bold mb-2">CSV Download</CardTitle>
          <p className="text-xs text-slate-500 mb-4">Generate raw CSV archive for local records.</p>
          <Button variant="outline" onClick={() => handleExport('CSV')} disabled={exporting || isPending}>
            Download CSV
          </Button>
        </Card>

        <Card className="p-6">
          <CardTitle className="text-lg font-bold mb-2">Google Drive Folder</CardTitle>
          <p className="text-xs text-slate-500 mb-4">Archive all PDF contracts and media assets.</p>
          <Button variant="outline" onClick={() => handleExport('Drive Archive')} disabled={exporting || isPending}>
            Archive Files
          </Button>
        </Card>
      </div>

      {confirmed && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          Export to <strong>{lastDestination}</strong> completed successfully and logged to <code>public.audit_log</code> & <code>public.exports</code>.
        </div>
      )}
    </div>
  )
}
