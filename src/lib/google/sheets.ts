import { getAccessToken } from './drive'

export interface ExportData {
  kids?: Record<string, any>[]
  users?: Record<string, any>[]
  statusHistory?: Record<string, any>[]
  vaadVotes?: Record<string, any>[]
  chatTranscripts?: Record<string, any>[]
  documents?: Record<string, any>[]
  auditLogs?: Record<string, any>[]
}

export const REQUIRED_TAB_NAMES = [
  'Kids',
  'Users',
  'Status History',
  'VAAD Votes',
  'Chat Transcripts',
  'Documents',
  'Audit Logs',
] as const

export type TabName = (typeof REQUIRED_TAB_NAMES)[number]

export const TAB_HEADERS: Record<TabName, string[]> = {
  Kids: ['ID', 'Application Number', 'Name', 'Status ID', 'Voting Open', 'Created At', 'Updated At'],
  Users: ['ID', 'Email', 'Name', 'Role', 'Active', 'Created At', 'Updated At'],
  'Status History': ['ID', 'Kid ID', 'Old Status ID', 'New Status ID', 'Changed By', 'Reason', 'Created At'],
  'VAAD Votes': ['ID', 'Kid ID', 'VAAD Member ID', 'Vote', 'Notes', 'Created At', 'Updated At'],
  'Chat Transcripts': ['ID', 'Kid ID', 'User ID', 'Body', 'Created At', 'Updated At'],
  Documents: ['ID', 'Kid ID', 'Uploaded By', 'Document Type', 'Filename', 'MIME Type', 'Drive File ID', 'Created At'],
  'Audit Logs': ['ID', 'User ID', 'Action', 'Entity Type', 'Entity ID', 'Metadata', 'Created At'],
}

export function buildSheetPayload(title: string, data: ExportData = {}) {
  const sheets = REQUIRED_TAB_NAMES.map((tabName, index) => {
    const headers = TAB_HEADERS[tabName]
    const rowsData = getRowsDataForTab(tabName, data)

    return {
      properties: {
        sheetId: index,
        title: tabName,
      },
      data: [
        {
          startRow: 0,
          startColumn: 0,
          rowData: [
            // Header Row
            {
              values: headers.map((h) => ({
                userEnteredValue: { stringValue: h },
                userEnteredFormat: { textFormat: { bold: true } },
              })),
            },
            // Data Rows
            ...rowsData.map((row) => ({
              values: headers.map((h) => {
                const val = row[h] ?? row[headerToKey(h)] ?? ''
                return {
                  userEnteredValue:
                    typeof val === 'number'
                      ? { numberValue: val }
                      : typeof val === 'boolean'
                      ? { boolValue: val }
                      : { stringValue: typeof val === 'object' ? JSON.stringify(val) : String(val) },
                }
              }),
            })),
          ],
        },
      ],
    }
  })

  return {
    properties: {
      title,
    },
    sheets,
  }
}

function getRowsDataForTab(tabName: TabName, data: ExportData): Record<string, any>[] {
  switch (tabName) {
    case 'Kids':
      return data.kids || []
    case 'Users':
      return data.users || []
    case 'Status History':
      return data.statusHistory || []
    case 'VAAD Votes':
      return data.vaadVotes || []
    case 'Chat Transcripts':
      return data.chatTranscripts || []
    case 'Documents':
      return data.documents || []
    case 'Audit Logs':
      return data.auditLogs || []
    default:
      return []
  }
}

function headerToKey(header: string): string {
  const map: Record<string, string> = {
    ID: 'id',
    'Application Number': 'application_number',
    Name: 'name',
    'Status ID': 'status_id',
    'Voting Open': 'voting_open',
    'Created At': 'created_at',
    'Updated At': 'updated_at',
    Email: 'email',
    Role: 'role',
    Active: 'active',
    'Kid ID': 'kid_id',
    'Old Status ID': 'old_status_id',
    'New Status ID': 'new_status_id',
    'Changed By': 'changed_by',
    Reason: 'reason',
    'VAAD Member ID': 'vaad_member_id',
    Vote: 'vote',
    Notes: 'notes',
    'User ID': 'user_id',
    Body: 'body',
    'Uploaded By': 'uploaded_by',
    'Document Type': 'document_type',
    Filename: 'filename',
    'MIME Type': 'mime_type',
    'Drive File ID': 'drive_file_id',
    Action: 'action',
    'Entity Type': 'entity_type',
    'Entity ID': 'entity_id',
    Metadata: 'metadata',
  }
  return map[header] || header.toLowerCase().replace(/ /g, '_')
}

export async function createGoogleSpreadsheet(title: string, data: ExportData): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const token = await getAccessToken()

  if (token === 'mock-access-token') {
    const mockId = `sheet_${Date.now()}`
    return {
      spreadsheetId: mockId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${mockId}/edit`,
    }
  }

  const payload = buildSheetPayload(title, data)

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Google Sheets export failed: ${res.status} ${errText}`)
  }

  const result = await res.json()
  return {
    spreadsheetId: result.spreadsheetId,
    spreadsheetUrl: result.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${result.spreadsheetId}/edit`,
  }
}
