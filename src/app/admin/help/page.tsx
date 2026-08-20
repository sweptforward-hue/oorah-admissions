import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function AdminHelpPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Center Reference</h1>
      <p className="text-slate-600 mb-6">Overview of administrator privileges, Master Admin account safeguards, and configuration rules.</p>

      <Card>
        <CardHeader>
          <CardTitle>Master Admin Authority & Safeguards</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 space-y-2 leading-relaxed">
          <p>
            The Master Admin account (<code>Azrielcohenca@gmail.com</code>) is protected directly in PostgreSQL via the <code>protect_master_admin_trigger</code>.
            It cannot be deleted, downgraded from the admin role, or deactivated by any API operation.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Fields Architecture</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 space-y-2 leading-relaxed">
          <p>
            Custom fields are modeled as dynamic metadata entities (<code>custom_fields</code> & <code>custom_field_values</code>) so that schema modifications are decoupled from PostgreSQL DDL table alterations.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Trail Integrity</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 space-y-2 leading-relaxed">
          <p>
            Manual status overrides, camper deletions, and export operations are logged in <code>public.audit_log</code> with actor attribution, timestamp, and metadata.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
