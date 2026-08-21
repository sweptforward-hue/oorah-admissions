import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Admissions & Platform Guide</h1>
        <p className="text-slate-600 mb-8">Standard operating procedures and workflow instructions for staff and VAAD members.</p>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">1. Camper Admissions Lifecycle</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 space-y-2 leading-relaxed">
              <p>Every camper record moves through explicit pipeline stages:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>New / Incomplete</strong>: Initial registration created. Awaiting parent questionnaire and school transcripts.</li>
                <li><strong>Under Review</strong>: Staff evaluating background and bunk compatibility.</li>
                <li><strong>Interview</strong>: Scheduled or conducted interview with parents and child.</li>
                <li><strong>VAAD Review</strong>: Placed into the voting queue. Active voting members cast choices.</li>
                <li><strong>Accepted</strong>: Triggered automatically upon receiving 2/3 Accept votes or manual admin override.</li>
                <li><strong>Waitlisted / Rejected / Withdrawn</strong>: Terminal or secondary states.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">2. VAAD Voting Rules & Status Automation</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 space-y-2 leading-relaxed">
              <p>
                The VAAD committee operates on configurable voting choices managed in the Admin control center.
                Votes are atomically recorded in PostgreSQL via the <code>submit_vaad_vote</code> RPC function.
                When a camper accumulates 2 Accept votes from distinct active voters, the system automatically advances the camper status to Accepted and creates an audit trail entry.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">3. Multi-Session Management (Session A & Session B)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 space-y-2 leading-relaxed">
              <p>
                Campers and staff are assigned to Sessions under designated fiscal/operational Years.
                Use the top navigation to switch between Session A and Session B rosters.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">4. Document & Google Drive Storage</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 space-y-2 leading-relaxed">
              <p>
                Contracts, transcripts, and photo assets are securely stored in Google Drive folders, with metadata and access tokens linked in Supabase.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">5. Support & Issue Reporting</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 space-y-2 leading-relaxed">
              <p>
                If you encounter any technical issues or need assistance, please send an email to{' '}
                <a href="mailto:rachelli.cohenca@gmail.com" className="text-blue-600 underline font-medium">
                  rachelli.cohenca@gmail.com
                </a>{' '}
                with a description of your issue.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
