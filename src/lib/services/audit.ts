/* eslint-disable @typescript-eslint/no-explicit-any */
import { mockDb } from '../vaad/queries'

export interface AuditLogEntry {
  id: string
  user_id?: string | null
  actor?: string | null
  action: string
  entity_type: string
  entity_id?: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
  user?: {
    id: string
    name: string | null
    email: string
  } | null
}

export interface AuditLogFilters {
  actor?: string
  startDate?: string
  endDate?: string
  entityType?: string
  action?: string
  page?: number
  pageSize?: number
}

export interface AuditLogResult {
  logs: AuditLogEntry[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

const isTest = process.env.NODE_ENV === 'test'

/**
 * Log an audit event into the append-only audit_log table.
 */
export async function logAuditEvent(
  supabase: any,
  params: {
    userId?: string | null
    action: string
    entityType: string
    entityId?: string | null
    metadata?: Record<string, unknown> | null
  }
): Promise<AuditLogEntry> {
  const newEntry: AuditLogEntry = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `audit-${Date.now()}-${Math.random()}`,
    user_id: params.userId || null,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId || null,
    metadata: params.metadata || null,
    created_at: new Date().toISOString(),
  }

  if (isTest) {
    mockDb.auditLogs.unshift(newEntry)
    return newEntry
  }

  if (supabase) {
    const { data, error } = await supabase
      .from('audit_log')
      .insert({
        user_id: params.userId || null,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId || null,
        metadata: params.metadata || null,
      })
      .select('*, user:users(id, name, email)')
      .single()

    if (error) {
      console.error('Failed to log audit event:', error)
    } else if (data) {
      return {
        ...data,
        actor: data.user ? (data.user.name || data.user.email) : 'System',
      }
    }
  }

  return newEntry
}

/**
 * Fetch filtered and paginated audit logs from database (or mockDb in tests).
 */
export async function getAuditLogs(
  supabase: any,
  filters: AuditLogFilters = {}
): Promise<AuditLogResult> {
  const page = Math.max(1, filters.page || 1)
  const pageSize = Math.max(1, filters.pageSize || 10)

  if (isTest) {
    let logs: AuditLogEntry[] = [...mockDb.auditLogs]

    if (filters.actor && filters.actor.trim() !== '') {
      const actorLower = filters.actor.toLowerCase().trim()
      logs = logs.filter((log) => {
        const actorName = (log.actor || log.user?.name || log.user?.email || log.user_id || '').toLowerCase()
        return actorName.includes(actorLower)
      })
    }

    if (filters.entityType && filters.entityType !== 'all') {
      logs = logs.filter((log) => log.entity_type === filters.entityType)
    }

    if (filters.action && filters.action !== 'all') {
      logs = logs.filter((log) => log.action === filters.action)
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime()
      logs = logs.filter((log) => new Date(log.created_at).getTime() >= start)
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate)
      end.setHours(23, 59, 59, 999)
      const endTime = end.getTime()
      logs = logs.filter((log) => new Date(log.created_at).getTime() <= endTime)
    }

    const totalCount = logs.length
    const totalPages = Math.ceil(totalCount / pageSize) || 1
    const startIndex = (page - 1) * pageSize
    const paginatedLogs = logs.slice(startIndex, startIndex + pageSize)

    return {
      logs: paginatedLogs,
      totalCount,
      page,
      pageSize,
      totalPages,
    }
  }

  if (!supabase) {
    return { logs: [], totalCount: 0, page: 1, pageSize, totalPages: 1 }
  }

  let query = supabase
    .from('audit_log')
    .select('*, user:users!left(id, name, email)', { count: 'exact' })

  if (filters.entityType && filters.entityType !== 'all') {
    query = query.eq('entity_type', filters.entityType)
  }

  if (filters.action && filters.action !== 'all') {
    query = query.eq('action', filters.action)
  }

  if (filters.startDate) {
    query = query.gte('created_at', new Date(filters.startDate).toISOString())
  }

  if (filters.endDate) {
    const end = new Date(filters.endDate)
    end.setHours(23, 59, 59, 999)
    query = query.lte('created_at', end.toISOString())
  }

  if (filters.actor && filters.actor.trim() !== '') {
    const actorSearch = `%${filters.actor.trim()}%`
    query = query.or(`action.ilike.${actorSearch},user.name.ilike.${actorSearch},user.email.ilike.${actorSearch}`)
  }

  query = query.order('created_at', { ascending: false })

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query.range(from, to)

  if (error) {
    console.error('Error fetching audit logs:', error)
    return { logs: [], totalCount: 0, page: 1, pageSize, totalPages: 1 }
  }

  const mappedLogs: AuditLogEntry[] = (data || []).map((entry: any) => ({
    ...entry,
    actor: entry.user ? (entry.user.name || entry.user.email) : (entry.user_id || 'System'),
  }))

  const totalCount = count ?? mappedLogs.length
  const totalPages = Math.ceil(totalCount / pageSize) || 1

  return {
    logs: mappedLogs,
    totalCount,
    page,
    pageSize,
    totalPages,
  }
}
