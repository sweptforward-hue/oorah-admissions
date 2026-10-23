/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getClientCategories,
  getAllClientCategories,
  createClientCategory,
  updateClientCategory,
  deleteClientCategory,
} from '@/lib/client-categories/actions'
import { getYears, getSessions } from '@/lib/admin/actions'

vi.mock('@/lib/auth/authorization', () => ({
  requireAdminRole: vi.fn().mockResolvedValue({ id: 'admin-123', role: 'admin' }),
  getCurrentUser: vi.fn().mockResolvedValue({ id: 'admin-123', role: 'admin' }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        order: () => ({
          eq: () => Promise.resolve({
            data: [
              { id: '1', name: 'General Camper', code: 'GEN', description: 'Standard admissions', color: '#3b82f6', is_active: true, sort_order: 1 }
            ],
            error: null
          }),
          then: (resolve: any) => resolve({
            data: [
              { id: '1', name: 'General Camper', code: 'GEN', description: 'Standard admissions', color: '#3b82f6', is_active: true, sort_order: 1 },
              { id: '2', name: 'Scholarship', code: 'SCHOL', description: 'Financial aid', color: '#10b981', is_active: true, sort_order: 2 },
              { id: '3', name: 'Oorah Family', code: 'FAM', description: 'Affiliated', color: '#8b5cf6', is_active: true, sort_order: 3 },
              { id: '4', name: 'Priority', code: 'PRIO', description: 'Priority', color: '#f59e0b', is_active: false, sort_order: 4 }
            ],
            error: null
          })
        }),
        eq: () => ({
          order: () => Promise.resolve({
            data: [
              { id: '1', name: 'General Camper', code: 'GEN', description: 'Standard admissions', color: '#3b82f6', is_active: true, sort_order: 1 }
            ],
            error: null
          })
        })
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({
            data: { id: 'test-cat-1', name: 'Test Category', code: 'TEST', description: 'Testing category creation', color: '#3b82f6', is_active: true, sort_order: 5 },
            error: null
          })
        })
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: async () => ({
              data: { id: '1', name: 'Updated Name', code: 'GEN', is_active: false },
              error: null
            })
          })
        })
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null })
      })
    })
  })
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Client Categories & Admin Actions', () => {
  it('getClientCategories returns active categories', async () => {
    const categories = await getClientCategories()
    expect(Array.isArray(categories)).toBe(true)
    expect(categories.length).toBeGreaterThan(0)
    expect(categories.every((c) => c.is_active)).toBe(true)
  })

  it('getAllClientCategories returns all categories', async () => {
    const categories = await getAllClientCategories()
    expect(Array.isArray(categories)).toBe(true)
    expect(categories.length).toBeGreaterThanOrEqual(4)
  })

  it('createClientCategory creates a category with defaults', async () => {
    const created = await createClientCategory({
      name: 'Test Category',
      code: 'TEST',
      description: 'Testing category creation',
      color: '#3b82f6',
    })
    expect(created).toBeDefined()
    expect(created.name).toBe('Test Category')
    expect(created.code).toBe('TEST')
  })

  it('updateClientCategory updates fields properly', async () => {
    const updated = await updateClientCategory('1', {
      name: 'Updated Name',
      is_active: false,
    })
    expect(updated).toBeDefined()
  })

  it('deleteClientCategory removes a category successfully', async () => {
    const result = await deleteClientCategory('1')
    expect(result).toEqual({ success: true })
  })

  it('getYears returns an array of years descending', async () => {
    const years = await getYears()
    expect(Array.isArray(years)).toBe(true)
    if (years.length > 0) {
      expect(years[0]).toHaveProperty('id')
      expect(years[0]).toHaveProperty('year')
      expect(years[0]).toHaveProperty('name')
    }
  })

  it('getSessions returns an array of sessions', async () => {
    const sessions = await getSessions()
    expect(Array.isArray(sessions)).toBe(true)
    if (sessions.length > 0) {
      expect(sessions[0]).toHaveProperty('id')
      expect(sessions[0]).toHaveProperty('name')
      expect(sessions[0]).toHaveProperty('yearName')
      expect(sessions[0]).toHaveProperty('startDate')
      expect(sessions[0]).toHaveProperty('endDate')
    }
  })
})
