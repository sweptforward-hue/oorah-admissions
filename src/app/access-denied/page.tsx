import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <span className="text-5xl">🚫</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-3">Access Restricted</h1>
          <p className="text-sm text-slate-600">You do not have permission to view this section.</p>
        </div>

        <Card className="border-red-200 shadow-sm">
          <CardHeader className="bg-red-50/50 border-b border-red-100 pb-4">
            <CardTitle className="text-lg text-red-900 flex items-center gap-2">
              <span>🔒</span> Authorization Required
            </CardTitle>
            <CardDescription className="text-red-700/80 text-xs">
              This area is restricted to administrators or authorized staff members.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6 text-sm text-slate-700">
            <div className="p-3 bg-slate-50 border rounded-lg text-xs space-y-1">
              <div className="font-semibold text-slate-800">Possible reasons for restriction:</div>
              <ul className="list-disc pl-4 text-slate-600 space-y-1">
                <li>Your account does not possess the <code>admin</code> role.</li>
                <li>Your staff profile is currently set to deactivated.</li>
                <li>You attempted to access an admin-only management route directly.</li>
              </ul>
            </div>
            <p className="text-xs text-slate-500">
              If you believe this is an error or need your permissions updated, please reach out to the Master Administrator.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 border-t pt-4">
            <Button asChild className="w-full">
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/login">Switch Account</Link>
            </Button>
            <Button variant="ghost" asChild className="w-full text-xs text-slate-500 hover:text-slate-800">
              <Link href="/help">Admissions Help & Support</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
