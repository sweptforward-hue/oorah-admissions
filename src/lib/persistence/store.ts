import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), '.data')

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    } catch {}
  }
}

function readJson<T>(filename: string, defaultValue: T): T {
  ensureDir()
  const filePath = path.join(DATA_DIR, filename)
  if (!fs.existsSync(filePath)) {
    return defaultValue
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return defaultValue
  }
}

function writeJson<T>(filename: string, data: T): void {
  ensureDir()
  const filePath = path.join(DATA_DIR, filename)
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error(`Failed to write to persistent store ${filename}:`, err)
  }
}

export interface PersistentKid {
  id: string
  name: string
  application_number: string
  status_id?: string
  status?: string
  voting_open?: boolean
  created_at: string
  updated_at: string
}

export interface PersistentStaff {
  id: string
  application_number: string
  first_name: string
  last_name: string
  name: string
  email?: string | null
  phone?: string | null
  role_title: string
  department: string
  status: string
  session: string
  year: number
  bunk_assignment?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

// Campers Store
export function getStoredCampers(): PersistentKid[] {
  return readJson<PersistentKid[]>('campers.json', [])
}

export function saveStoredCamper(camper: PersistentKid): void {
  const all = getStoredCampers()
  const existingIdx = all.findIndex((c) => c.id === camper.id || c.application_number === camper.application_number)
  if (existingIdx >= 0) {
    all[existingIdx] = { ...all[existingIdx], ...camper, updated_at: new Date().toISOString() }
  } else {
    all.unshift(camper)
  }
  writeJson('campers.json', all)
}

export function deleteStoredCamper(id: string): void {
  const all = getStoredCampers().filter((c) => c.id !== id && c.application_number !== id)
  writeJson('campers.json', all)
}

// Staff Store
export function getStoredStaff(): PersistentStaff[] {
  return readJson<PersistentStaff[]>('staff.json', [])
}

export function saveStoredStaff(staff: PersistentStaff): void {
  const all = getStoredStaff()
  const existingIdx = all.findIndex((s) => s.id === staff.id || s.application_number === staff.application_number)
  if (existingIdx >= 0) {
    all[existingIdx] = { ...all[existingIdx], ...staff, updated_at: new Date().toISOString() }
  } else {
    all.unshift(staff)
  }
  writeJson('staff.json', all)
}

export function updateStoredStaff(id: string, updates: Partial<PersistentStaff>): boolean {
  const all = getStoredStaff()
  const idx = all.findIndex((s) => s.id === id || s.application_number === id)
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...updates, updated_at: new Date().toISOString() }
    writeJson('staff.json', all)
    return true
  }
  return false
}

export function deleteStoredStaff(id: string): void {
  const all = getStoredStaff().filter((s) => s.id !== id && s.application_number !== id)
  writeJson('staff.json', all)
}
