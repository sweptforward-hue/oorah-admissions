'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface CustomFieldItem {
  id: string
  name: string
  entityType: 'camper' | 'staff'
  fieldType: string
  isRequired: boolean
}

export default function AdminCustomFieldsPage() {
  const [fields, setFields] = useState<CustomFieldItem[]>([
    { id: '1', name: 'T-Shirt Size', entityType: 'camper', fieldType: 'dropdown', isRequired: true },
    { id: '2', name: 'Dietary Restrictions', entityType: 'camper', fieldType: 'text', isRequired: false },
    { id: '3', name: 'Driver License Verified', entityType: 'staff', fieldType: 'checkbox', isRequired: true },
  ])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Custom Data Fields</h1>
          <p className="text-sm text-slate-500">Extend camper and staff schemas dynamically without DDL migrations</p>
        </div>
        <Button>+ Add Custom Field</Button>
      </div>

      <div className="space-y-4">
        {fields.map((f) => (
          <Card key={f.id} className="p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                {f.name}
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700 uppercase">{f.entityType}</span>
              </h3>
              <p className="text-xs text-slate-500">Type: {f.fieldType} • Required: {f.isRequired ? 'Yes' : 'No'}</p>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
