'use client'

import React, { useState, useEffect, useTransition } from 'react'
import {
  Tag,
  Plus,
  Edit2,
  Archive,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Sliders,
  Info,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import {
  getAllClientCategories,
  createClientCategory,
  updateClientCategory,
  deleteClientCategory,
  ClientCategory,
} from '@/lib/client-categories/actions'

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#64748b', // Slate
]

export default function AdminClientCategoriesPage() {
  const [categories, setCategories] = useState<ClientCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    color: '#3b82f6',
    sort_order: 1,
    is_active: true,
  })

  const loadData = async () => {
    try {
      setLoading(true)
      setErrorMessage(null)
      const data = await getAllClientCategories()
      setCategories(data || [])
    } catch (err: unknown) {
      console.error('Failed to load client categories:', err)
      setErrorMessage((err as Error).message || 'Failed to load client categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCreate = () => {
    setModalMode('create')
    setEditingId(null)
    setFormData({
      name: '',
      code: '',
      description: '',
      color: '#3b82f6',
      sort_order: (categories.length + 1) * 10,
      is_active: true,
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (category: ClientCategory) => {
    setModalMode('edit')
    setEditingId(category.id)
    setFormData({
      name: category.name,
      code: category.code || '',
      description: category.description || '',
      color: category.color || '#3b82f6',
      sort_order: category.sort_order ?? 0,
      is_active: category.is_active,
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Category Name is required.')
      return
    }

    startTransition(async () => {
      try {
        setErrorMessage(null)
        if (modalMode === 'create') {
          const created = await createClientCategory({
            name: formData.name.trim(),
            code: formData.code.trim() || undefined,
            description: formData.description.trim() || undefined,
            color: formData.color,
          })
          setCategories((prev) => [...prev, created])
        } else if (modalMode === 'edit' && editingId) {
          const updated = await updateClientCategory(editingId, {
            name: formData.name.trim(),
            code: formData.code.trim() || undefined,
            description: formData.description.trim() || undefined,
            color: formData.color,
            is_active: formData.is_active,
            sort_order: formData.sort_order,
          })
          setCategories((prev) =>
            prev.map((c) => (c.id === editingId ? { ...c, ...updated } : c))
          )
        }
        setIsModalOpen(false)
      } catch (err: unknown) {
        console.error('Failed to save category:', err)
        alert((err as Error).message || 'Failed to save category')
      }
    })
  }

  const handleToggleStatus = async (category: ClientCategory) => {
    const nextStatus = !category.is_active
    startTransition(async () => {
      try {
        await updateClientCategory(category.id, { is_active: nextStatus })
        setCategories((prev) =>
          prev.map((c) => (c.id === category.id ? { ...c, is_active: nextStatus } : c))
        )
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to update status')
      }
    })
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return

    startTransition(async () => {
      try {
        await deleteClientCategory(id)
        setCategories((prev) => prev.filter((c) => c.id !== id))
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to delete category')
      }
    })
  }

  const activeCount = categories.filter((c) => c.is_active).length
  const archivedCount = categories.length - activeCount

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
              Admin Configuration
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Client Categories
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure applicant classifications, scholarship tiers, and cohort tags
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading || isPending}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <Info className="w-4 h-4 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Categories
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{categories.length}</div>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Active Categories
            </div>
            <div className="text-2xl font-bold text-green-700 mt-1">{activeCount}</div>
          </div>
          <div className="p-2.5 bg-green-50 text-green-600 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Archived
            </div>
            <div className="text-2xl font-bold text-slate-500 mt-1">{archivedCount}</div>
          </div>
          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-lg">
            <Archive className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
            <p className="text-sm">Loading client categories...</p>
          </div>
        ) : categories.length === 0 ? (
          /* Clean Empty State */
          <div className="p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
              <Tag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No client categories found</h3>
            <p className="text-sm text-slate-500 mt-1 text-center">
              Client categories help segment applicants by custom tags such as scholarship candidates,
              staff families, or priority programs.
            </p>
            <div className="mt-6">
              <Button
                onClick={handleOpenCreate}
                className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create First Category
              </Button>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[80px]">Color</TableHead>
                <TableHead className="min-w-[180px]">Category Name</TableHead>
                <TableHead className="w-[120px]">Code</TableHead>
                <TableHead className="min-w-[260px]">Description</TableHead>
                <TableHead className="w-[100px] text-center">Order</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[160px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow
                  key={category.id}
                  className={!category.is_active ? 'bg-slate-50/60 opacity-75' : ''}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-4 h-4 rounded-full border border-black/10 shadow-sm"
                        style={{ backgroundColor: category.color || '#3b82f6' }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900">
                    {category.name}
                  </TableCell>
                  <TableCell>
                    {category.code ? (
                      <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {category.code}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {category.description || <span className="text-slate-400 italic">None</span>}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs text-slate-500">
                    {category.sort_order ?? 0}
                  </TableCell>
                  <TableCell>
                    {category.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Archived</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(category)}
                        disabled={isPending}
                        className="h-8 px-2 text-slate-700 hover:text-slate-900"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(category)}
                        disabled={isPending}
                        className="h-8 px-2 text-slate-700 hover:text-slate-900"
                        title={category.is_active ? 'Archive Category' : 'Activate Category'}
                      >
                        {category.is_active ? (
                          <Archive className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(category.id, category.name)}
                        disabled={isPending}
                        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Add Client Category' : 'Edit Client Category'}
        description="Configure client classification details, badge styling, and priority ordering."
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Category Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Scholarship Candidate"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Short Code
              </label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. SCHOL"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Sort Order
              </label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this classification criteria..."
              rows={2}
              className="w-full text-sm border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Color selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Badge Color
            </label>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-7 h-7 rounded-full border border-black/10 shadow-inner shrink-0"
                style={{ backgroundColor: formData.color }}
              />
              <Input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="font-mono text-xs uppercase w-32"
                placeholder="#3b82f6"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: hex })}
                  className={`w-6 h-6 rounded-full border transition-transform ${
                    formData.color.toLowerCase() === hex.toLowerCase()
                      ? 'scale-125 ring-2 ring-offset-2 ring-slate-800'
                      : 'hover:scale-110 border-black/10'
                  }`}
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              ))}
            </div>
          </div>

          {modalMode === 'edit' && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <input
                type="checkbox"
                id="is_active_toggle"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="is_active_toggle" className="text-sm font-medium text-slate-700">
                Active status (uncheck to archive)
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              {isPending ? 'Saving...' : modalMode === 'create' ? 'Create Category' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
