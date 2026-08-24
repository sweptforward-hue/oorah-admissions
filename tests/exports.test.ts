import { describe, it, expect, vi } from 'vitest'
import {
  escapeCSVField,
  formatCSVRow,
  generateCSVString,
  createCSVStream,
  UTF8_BOM,
} from '@/lib/exports/csv'
import {
  buildSheetPayload,
  buildAutoFitRequests,
  createMultiTabSpreadsheet,
  REQUIRED_TAB_NAMES,
  ExportData,
} from '@/lib/google/sheets'
import {
  createExportJob,
  updateJobStatus,
  processExportJob,
  retryFailedJob,
} from '@/lib/exports/jobs'

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: new Error('Mock error fallback') }),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Mock error fallback') }),
          }),
        }),
      }),
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
  }),
}))

describe('RFC 4180 Streaming CSV Service', () => {
  it('escapes fields properly according to RFC 4180 rules', () => {
    expect(escapeCSVField('Simple Text')).toBe('Simple Text')
    expect(escapeCSVField('Text with, comma')).toBe('"Text with, comma"')
    expect(escapeCSVField('Text with "quotes"')).toBe('"Text with ""quotes"""')
    expect(escapeCSVField('Text with\nnewline')).toBe('"Text with\nnewline"')
  })

  it('formats CSV rows with CRLF \\r\\n endings', () => {
    const row = formatCSVRow(['Header 1', 'Header, 2', 'Header "3"'])
    expect(row).toBe('Header 1,"Header, 2","Header ""3"""\r\n')
  })

  it('generates full CSV string with UTF-8 BOM prefix', async () => {
    const headers = ['ID', 'Name', 'Notes']
    const data = [
      { id: '1', name: 'John Doe', notes: 'First entry, clean' },
      { id: '2', name: 'Jane "Smith" Doe', notes: 'Line 1\nLine 2' },
    ]
    const csv = await generateCSVString(headers, data)
    expect(csv.startsWith(UTF8_BOM)).toBe(true)
    expect(csv).toContain('ID,Name,Notes\r\n')
    expect(csv).toContain('1,John Doe,"First entry, clean"\r\n')
    expect(csv).toContain('2,"Jane ""Smith"" Doe","Line 1\nLine 2"\r\n')
  })

  it('streams CSV chunks via ReadableStream', async () => {
    const headers = ['ID', 'Status']
    const data = [{ id: '101', status: 'Accepted' }]
    const stream = createCSVStream(headers, data)
    const reader = stream.getReader()
    const decoder = new TextDecoder('utf-8', { ignoreBOM: true })
    let result = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      result += decoder.decode(value, { stream: true })
    }
    result += decoder.decode()

    expect(result.charCodeAt(0)).toBe(0xFEFF)
    expect(result).toContain('ID,Status\r\n')
    expect(result).toContain('101,Accepted\r\n')
  })
})

describe('Multi-Tab Google Sheets Export Engine', () => {
  it('builds payload containing exactly the required 7 tabs', () => {
    const mockData: ExportData = {
      kids: [{ id: 'k1', application_number: 'APP001', name: 'Kid One' }],
      users: [{ id: 'u1', email: 'test@example.com', name: 'Test User' }],
    }

    const payload = buildSheetPayload('Oorah Roster Export', mockData)
    expect(payload.properties.title).toBe('Oorah Roster Export')
    expect(payload.sheets).toHaveLength(7)

    const sheetTitles = payload.sheets.map((s) => s.properties.title)
    expect(sheetTitles).toEqual(REQUIRED_TAB_NAMES)

    // Check frozen row count
    payload.sheets.forEach((sheet) => {
      expect(sheet.properties.gridProperties.frozenRowCount).toBe(1)
    })
  })

  it('generates column auto-fit requests for each tab', () => {
    const requests = buildAutoFitRequests()
    expect(requests).toHaveLength(7)
    requests.forEach((req, idx) => {
      expect(req.autoResizeDimensions.dimensions.sheetId).toBe(idx)
      expect(req.autoResizeDimensions.dimensions.dimension).toBe('COLUMNS')
    })
  })

  it('creates multi-tab spreadsheet specification', async () => {
    const result = await createMultiTabSpreadsheet('Test Export', {})
    expect(result.spreadsheetId).toBeDefined()
    expect(result.spreadsheetUrl).toContain('https://docs.google.com/spreadsheets/d/')
    expect(result.payload.sheets).toHaveLength(7)
  })
})

describe('Async Export Job Tracker & Retry Queue', () => {
  it('tracks async export job lifecycle (queued -> processing -> completed)', async () => {
    const job = await createExportJob('Google Sheets', 'Drive Folder')
    expect(job.status).toBe('queued')

    const processRes = await processExportJob(job.id, async () => {
      return { url: 'https://docs.google.com/sheets/123' }
    })

    expect(processRes.success).toBe(true)
    expect(processRes.result?.url).toBe('https://docs.google.com/sheets/123')
  })

  it('handles job failures and allows automatic retries', async () => {
    const job = await createExportJob('CSV', 'Local Download')

    // First run fails
    const firstRun = await processExportJob(job.id, async () => {
      throw new Error('Network timeout')
    })
    expect(firstRun.success).toBe(false)
    expect(firstRun.error).toBe('Network timeout')

    // Retry succeeds
    const retryRes = await retryFailedJob(job.id, async () => {
      return 'OK'
    })
    expect(retryRes.success).toBe(true)
    expect(retryRes.job.status).toBe('completed')
    expect(retryRes.job.retry_count).toBe(1)
  })

  it('stops retrying when max_retries limit is exceeded', async () => {
    const job = await createExportJob('CSV', 'Local Download')

    // Fail first run
    await processExportJob(job.id, async () => {
      throw new Error('Fail')
    })

    // Retry 3 times (reaching max limit)
    await retryFailedJob(job.id, async () => { throw new Error('Fail 1') })
    await retryFailedJob(job.id, async () => { throw new Error('Fail 2') })
    await retryFailedJob(job.id, async () => { throw new Error('Fail 3') })

    // 4th retry attempt should be blocked
    const maxRetryResult = await retryFailedJob(job.id, async () => { return 'OK' })
    expect(maxRetryResult.success).toBe(false)
    expect(maxRetryResult.error).toContain('Exceeded maximum retries limit')
  })
})
