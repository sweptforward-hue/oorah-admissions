import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AdminStoragePage() {
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
              <div className="text-xs text-slate-500">1A2B3C4D5E6F7G8H9I0J</div>
            </div>
            <Button variant="outline" size="sm">Update Folder</Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-800">OAuth Service Connection</div>
              <div className="text-xs text-green-600">● Connected (Google Cloud Platform)</div>
            </div>
            <Button variant="outline" size="sm">Test Connection</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
