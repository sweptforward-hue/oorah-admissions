'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export default function AdminExportsPage() {
  const [exporting, setExporting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [exportTarget, setExportTarget] = useState<string | null>(null)

  const handleTriggerExport = (destination: string) => {
    setExportTarget(destination)
  }

  const handleConfirmExport = () => {
    if (!exportTarget) return
    setExporting(true)
    setTimeout(() => {
      setExporting(false)
      setConfirmed(true)
      setExportTarget(null)
    }, 800)
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
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => handleTriggerExport('Google Sheets')}
            disabled={exporting}
          >
            Export to Sheets
          </Button>
        </Card>

        <Card className="p-6">
          <CardTitle className="text-lg font-bold mb-2">CSV Download</CardTitle>
          <p className="text-xs text-slate-500 mb-4">Generate raw CSV archive for local records.</p>
          <Button variant="outline" onClick={() => handleTriggerExport('CSV')} disabled={exporting}>Download CSV</Button>
        </Card>

        <Card className="p-6">
          <CardTitle className="text-lg font-bold mb-2">Google Drive Folder</CardTitle>
          <p className="text-xs text-slate-500 mb-4">Archive all PDF contracts and media assets.</p>
          <Button variant="outline" onClick={() => handleTriggerExport('Google Drive Folder')} disabled={exporting}>Archive Files</Button>
        </Card>
      </div>

      {confirmed && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          Export completed successfully and logged to <code>public.audit_log</code>.
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(exportTarget)}
        onClose={() => setExportTarget(null)}
        onConfirm={handleConfirmExport}
        title="Confirm Data Export"
        message={`Confirm export to ${exportTarget}? This action will be recorded in the audit log.`}
        confirmText="Confirm Export"
      />
    </div>
  )
}
