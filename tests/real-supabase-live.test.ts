/**
 * Real Supabase Live Integration Test Suite
 *
 * This test suite executes REAL, non-mocked queries directly against the
 * live production Supabase instance (https://poqsbceyjkwnfdcfcnvq.supabase.co).
 * Verifies live connectivity, schema integrity, relational joins, and active datasets.
 */

import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://poqsbceyjkwnfdcfcnvq.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcXNiY2V5amt3bmZkY2ZjbnZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwOTc1MzUsImV4cCI6MjEwMjY3MzUzNX0.yrfoN0cuVNtX_vqylaYP16pN-_2ae-ikPhwVWtL3BGA'

describe('Real Live Supabase Integration Suite', () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  it('connects to live Supabase and fetches real campers from kids table', async () => {
    const { data: kids, error } = await supabase
      .from('kids')
      .select('id, name, application_number, status_id, voting_open')
      .order('name')

    expect(error).toBeNull()
    expect(Array.isArray(kids)).toBe(true)
    expect(kids!.length).toBeGreaterThanOrEqual(17)

    const johnSmith = kids!.find(k => k.name === 'John Smith')
    expect(johnSmith).toBeDefined()
    expect(johnSmith!.application_number).toBe('1042')
  })

  it('fetches real workflow statuses from statuses table', async () => {
    const { data: statuses, error } = await supabase
      .from('statuses')
      .select('*')
      .order('display_order')

    expect(error).toBeNull()
    expect(Array.isArray(statuses)).toBe(true)
    expect(statuses!.length).toBe(9)

    const statusNames = statuses!.map(s => s.name)
    expect(statusNames).toContain('New')
    expect(statusNames).toContain('Accepted')
    expect(statusNames).toContain('Rejected')
    expect(statusNames).toContain('Interview')
    expect(statusNames).toContain('VAAD Review')
    expect(statusNames).toContain('Waitlisted')
  })

  it('executes a real relational join between kids and statuses', async () => {
    const { data: joined, error } = await supabase
      .from('kids')
      .select('id, name, statuses(id, name, display_order)')
      .eq('name', 'John Smith')
      .single()

    expect(error).toBeNull()
    expect(joined).toBeDefined()
    expect(joined!.name).toBe('John Smith')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = joined!.statuses as any
    expect(status).toBeDefined()
    expect(status.name).toBe('VAAD Review')
  })

  it('fetches real operational years from years table', async () => {
    const { data: years, error } = await supabase
      .from('years')
      .select('*')

    expect(error).toBeNull()
    expect(Array.isArray(years)).toBe(true)
    expect(years!.length).toBeGreaterThanOrEqual(1)

    const summer2025 = years!.find(y => y.name === 'Summer 2025')
    expect(summer2025).toBeDefined()
    expect(summer2025!.is_active).toBe(true)
  })

  it('fetches real camp sessions with relational foreign-key to years', async () => {
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('id, name, start_date, end_date, years(name)')
      .order('name')

    expect(error).toBeNull()
    expect(Array.isArray(sessions)).toBe(true)
    expect(sessions!.length).toBeGreaterThanOrEqual(2)

    const sessionNames = sessions!.map(s => s.name)
    expect(sessionNames).toContain('Session A')
    expect(sessionNames).toContain('Session B')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionA = sessions!.find(s => s.name === 'Session A') as any
    expect(sessionA.years.name).toBe('Summer 2025')
  })

  it('fetches real VAAD voting choices from vaad_voting_choices table', async () => {
    const { data: choices, error } = await supabase
      .from('vaad_voting_choices')
      .select('*')
      .order('display_order')

    expect(error).toBeNull()
    expect(Array.isArray(choices)).toBe(true)
    expect(choices!.length).toBe(4)

    const choiceNames = choices!.map(c => c.name)
    expect(choiceNames).toEqual(['Accept', 'Reject', 'Abstain', 'Pending'])
  })

  it('fetches real custom fields configured in public.custom_fields', async () => {
    const { data: fields, error } = await supabase
      .from('custom_fields')
      .select('*')

    expect(error).toBeNull()
    expect(Array.isArray(fields)).toBe(true)
    expect(fields!.length).toBeGreaterThanOrEqual(3)

    const fieldNames = fields!.map(f => f.name)
    expect(fieldNames).toContain('T-Shirt Size')
    expect(fieldNames).toContain('Dietary Restrictions')
    expect(fieldNames).toContain('Driver License Verified')
  })
})
