import { createClient } from '@/lib/supabase/server'

export type ExportStatus = 'queued' | 'processing' | 'completed' | 'failed'

export interface ExportJob {
  id: string
  export_type: string
  status: ExportStatus
  destination: string
  started_at: string
  completed_at?: string | null
  error_message?: string | null
  created_by?: string | null
  retry_count?: number
  max_retries?: number
}

// In-memory queue for testing/fallback environments where public.exports table isn't active
const memoryQueue: Map<string, ExportJob> = new Map()

export async function createExportJob(
  exportType: string,
  destination: string,
  userId?: string
): Promise<ExportJob> {
  const jobId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const now = new Date().toISOString()

  const job: ExportJob = {
    id: jobId,
    export_type: exportType,
    status: 'queued',
    destination,
    started_at: now,
    created_by: userId,
    retry_count: 0,
    max_retries: 3,
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('exports')
      .insert({
        export_type: exportType,
        destination,
        status: 'queued',
        created_by: userId,
        started_at: now,
      })
      .select()
      .single()

    if (!error && data) {
      return { ...data, retry_count: 0, max_retries: 3 } as ExportJob
    }
  } catch (err) {
    // Supabase optional fallback
  }

  memoryQueue.set(jobId, job)
  return job
}

export async function updateJobStatus(
  jobId: string,
  status: ExportStatus,
  errorMessage?: string | null
): Promise<ExportJob> {
  const now = new Date().toISOString()
  const updates: Partial<ExportJob> = {
    status,
    completed_at: status === 'completed' || status === 'failed' ? now : null,
    error_message: errorMessage || null,
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('exports')
      .update(updates)
      .eq('id', jobId)
      .select()
      .single()

    if (!error && data) {
      return data as ExportJob
    }
  } catch (err) {
    // Fallback
  }

  const existing = memoryQueue.get(jobId)
  if (existing) {
    const updated = { ...existing, ...updates }
    memoryQueue.set(jobId, updated)
    return updated
  }

  return {
    id: jobId,
    export_type: 'unknown',
    status,
    destination: 'unknown',
    started_at: now,
    completed_at: updates.completed_at,
    error_message: errorMessage,
    retry_count: 0,
    max_retries: 3,
  }
}

export async function processExportJob<T>(
  jobId: string,
  executor: () => Promise<T>
): Promise<{ success: boolean; result?: T; error?: string }> {
  await updateJobStatus(jobId, 'processing')

  try {
    const result = await executor()
    await updateJobStatus(jobId, 'completed')
    return { success: true, result }
  } catch (err: any) {
    const errMsg = err?.message || 'Export task execution failed'
    await updateJobStatus(jobId, 'failed', errMsg)
    return { success: false, error: errMsg }
  }
}

export async function retryFailedJob<T>(
  jobId: string,
  executor: () => Promise<T>
): Promise<{ success: boolean; job: ExportJob; result?: T; error?: string }> {
  let job = memoryQueue.get(jobId)

  if (!job) {
    try {
      const supabase = await createClient()
      const { data } = await supabase.from('exports').select().eq('id', jobId).single()
      if (data) {
        job = { ...data, retry_count: (data.retry_count || 0), max_retries: 3 }
      }
    } catch (e) {
      // Fallback
    }
  }

  if (!job) {
    throw new Error(`Export job ${jobId} not found`)
  }

  const currentRetries = (job.retry_count || 0) + 1
  const maxRetries = job.max_retries || 3

  if (currentRetries > maxRetries) {
    const failedJob = await updateJobStatus(
      jobId,
      'failed',
      `Exceeded maximum retries limit (${maxRetries})`
    )
    return {
      success: false,
      job: failedJob,
      error: `Exceeded maximum retries limit (${maxRetries})`,
    }
  }

  job.retry_count = currentRetries
  job.status = 'queued'
  memoryQueue.set(jobId, job)

  await updateJobStatus(jobId, 'queued')
  const processRes = await processExportJob(jobId, executor)

  const updatedJob = memoryQueue.get(jobId) || job
  return {
    success: processRes.success,
    job: updatedJob,
    result: processRes.result,
    error: processRes.error,
  }
}

export function getMemoryJob(jobId: string): ExportJob | undefined {
  return memoryQueue.get(jobId)
}
