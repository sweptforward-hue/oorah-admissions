/**
 * RFC 4180 Streaming CSV Generator with UTF-8 BOM encoding for Excel compatibility.
 */

// UTF-8 Byte Order Mark (BOM): \uFEFF
export const UTF8_BOM = '\uFEFF'

/**
 * Escapes a single cell field according to RFC 4180 rules.
 * - If field contains quotes, commas, or newlines (\n or \r), wrap in double quotes.
 * - Any double quotes inside field are escaped as double-double quotes ("").
 */
export function escapeCSVField(val: any): string {
  if (val === null || val === undefined) {
    return ''
  }

  let str = typeof val === 'object' ? JSON.stringify(val) : String(val)

  const needsQuotes = str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')

  if (str.includes('"')) {
    str = str.replace(/"/g, '""')
  }

  if (needsQuotes) {
    return `"${str}"`
  }

  return str
}

/**
 * Formats a single CSV row with CRLF (\r\n) ending as per RFC 4180.
 */
export function formatCSVRow(fields: any[]): string {
  return fields.map(escapeCSVField).join(',') + '\r\n'
}

/**
 * Creates a Web ReadableStream emitting UTF-8 encoded CSV chunks with BOM header.
 */
export function createCSVStream(
  headers: string[],
  rowsGenerator: AsyncIterable<Record<string, any>> | Iterable<Record<string, any>>,
  options: { includeBOM?: boolean } = { includeBOM: true }
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  return new ReadableStream<Uint8Array>(({
    async start(controller) {
      if (options.includeBOM !== false) {
        controller.enqueue(encoder.encode(UTF8_BOM))
      }

      // Enqueue header row
      controller.enqueue(encoder.encode(formatCSVRow(headers)))

      try {
        for await (const row of rowsGenerator) {
          const rowFields = headers.map((header) => row[header] ?? row[headerToKey(header)] ?? '')
          controller.enqueue(encoder.encode(formatCSVRow(rowFields)))
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  }))
}

/**
 * Converts headers and array of records into a full RFC 4180 CSV string with BOM.
 */
export async function generateCSVString(
  headers: string[],
  rows: Record<string, any>[],
  options: { includeBOM?: boolean } = { includeBOM: true }
): Promise<string> {
  let result = options.includeBOM !== false ? UTF8_BOM : ''
  result += formatCSVRow(headers)

  for (const row of rows) {
    const fields = headers.map((header) => row[header] ?? row[headerToKey(header)] ?? '')
    result += formatCSVRow(fields)
  }

  return result
}

/**
 * Helper to standardise key mapping
 */
function headerToKey(header: string): string {
  const map: Record<string, string> = {
    ID: 'id',
    'Application Number': 'application_number',
    Name: 'name',
    'Status ID': 'status_id',
    'Voting Open': 'voting_open',
    'Created At': 'created_at',
    'Updated At': 'updated_at',
  }
  return map[header] || header.toLowerCase().replace(/\s+/g, '_')
}
