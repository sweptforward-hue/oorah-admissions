'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  getCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  CustomFieldDefinition,
} from '@/lib/custom-fields/actions'

const DEFAULT_FIELDS: CustomFieldDefinition[] = [
  { id: '1', name: 't_shirt_size', label: 'T-Shirt Size', field_type: 'dropdown', required: true, options: { entity_type: 'camper', choices: ['S', 'M', 'L', 'XL'] } },
  { id: '2', name: 'dietary_restrictions', label: 'Dietary Restrictions', field_type: 'text', required: false, options: { entity_type: 'camper' } },
  { id: '3', name: 'driver_license_verified', label: 'Driver License Verified', field_type: 'checkbox', required: true, options: { entity_type: 'staff' } },
]

export default function AdminCustomFieldsPage() {
  const [fields, setFields] = useState<CustomFieldDefinition[]>(DEFAULT_FIELDS)
  const [isPending, startTransition] = useTransition()

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null)

  // Form states
  const [label, setLabel] = useState('')
  const [fieldType, setFieldType] = useState('text')
  const [entityType, setEntityType] = useState<'camper' | 'staff'>('camper')
  const [required, setRequired] = useState(false)

  const loadData = async () => {
    try {
      const data = await getCustomFields()
      if (data && data.length > 0) {
        setFields(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const resetForm = () => {
    setLabel('')
    setFieldType('text')
    setEntityType('camper')
    setRequired(false)
  }

  const handleOpenAddModal = () => {
    resetForm()
    setIsAddOpen(true)
  }

  const handleOpenEditModal = (field: CustomFieldDefinition) => {
    setEditingField(field)
    setLabel(field.label || field.name)
    setFieldType(field.field_type)
    setEntityType(field.options?.entity_type || 'camper')
    setRequired(field.required)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return

    startTransition(async () => {
      try {
        await createCustomField({
          name: label,
          label: label.trim(),
          field_type: fieldType,
          required,
          entity_type: entityType,
        })
        await loadData()
        setIsAddOpen(false)
        resetForm()
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to create custom field')
      }
    })
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingField || !label.trim()) return

    startTransition(async () => {
      try {
        await updateCustomField(editingField.id, {
          label: label.trim(),
          field_type: fieldType,
          required,
          options: { ...editingField.options, entity_type: entityType },
        })
        await loadData()
        setEditingField(null)
        resetForm()
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to update custom field')
      }
    })
  }

  const handleDelete = async (id: string, fieldLabel: string) => {
    if (!confirm(`Are you sure you want to delete custom field "${fieldLabel}"? (Admin only)`)) return

    startTransition(async () => {
      try {
        await deleteCustomField(id)
        setFields(fields.filter(f => f.id !== id))
        await loadData()
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to delete custom field. Admin access required.')
      }
    })
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Custom Data Fields</h1>
          <p className="text-sm text-slate-500">Extend camper and staff schemas dynamically without DDL migrations</p>
        </div>
        <Button onClick={handleOpenAddModal}>+ Add Custom Field</Button>
      </div>

      <div className="space-y-4">
        {fields.map((f) => {
          const entType = f.options?.entity_type || 'camper'
          return (
            <Card key={f.id} className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  {f.label || f.name}
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700 uppercase">
                    {entType}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Type: {f.field_type} • Required: {f.required ? 'Yes' : 'No'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(f)}>
                  Configure
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDelete(f.id, f.label || f.name)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Add Custom Field</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Field Label</label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. T-Shirt Size"
                  className="w-full p-2 border rounded-md text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Entity Type</label>
                  <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value as 'camper' | 'staff')}
                    className="w-full p-2 border rounded-md text-sm"
                  >
                    <option value="camper">Camper</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Field Type</label>
                  <select
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                  >
                    <option value="text">Text</option>
                    <option value="dropdown">Dropdown</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="number">Number</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="req-add"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                />
                <label htmlFor="req-add" className="text-xs font-medium text-slate-700">Required Field</label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>Save Field</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingField && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Configure Custom Field</h2>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Field Label</label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Entity Type</label>
                  <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value as 'camper' | 'staff')}
                    className="w-full p-2 border rounded-md text-sm"
                  >
                    <option value="camper">Camper</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Field Type</label>
                  <select
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                  >
                    <option value="text">Text</option>
                    <option value="dropdown">Dropdown</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="number">Number</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="req-edit"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                />
                <label htmlFor="req-edit" className="text-xs font-medium text-slate-700">Required Field</label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingField(null)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>Update Field</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
