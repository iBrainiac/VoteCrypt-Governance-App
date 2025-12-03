/**
 * M-Pesa CSV Parser
 * Handles multiple M-Pesa CSV formats
 */

export interface ParsedTransaction {
  id: string
  date: string
  amount: number
  balance: number | null
  direction: 'in' | 'out' | 'transfer'
  counterparty: string | null
  narrative: string | null
  rawRow: Record<string, any>
}

export interface ParseResult {
  success: boolean
  transactions: ParsedTransaction[]
  confidence: number
  detectedFormat: string
  errors: string[]
}

/**
 * Parse M-Pesa CSV data
 */
export function parseMpesaCSV(csvContent: string): ParseResult {
  const lines = csvContent.trim().split('\n')

  if (lines.length < 2) {
    return {
      success: false,
      transactions: [],
      confidence: 0,
      detectedFormat: 'unknown',
      errors: ['CSV file is empty or has no data rows'],
    }
  }

  // Detect CSV format by examining headers
  const headerLine = lines[0]
  const format = detectFormat(headerLine)

  if (format === 'unknown') {
    return {
      success: false,
      transactions: [],
      confidence: 0,
      detectedFormat: 'unknown',
      errors: ['Unable to detect M-Pesa CSV format from headers'],
    }
  }

  // Parse rows based on detected format
  const transactions: ParsedTransaction[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    try {
      const transaction = parseRow(lines[i], format)
      if (transaction) {
        transactions.push(transaction)
      }
    } catch (error) {
      errors.push(`Error parsing row ${i + 1}: ${error.message}`)
    }
  }

  // Calculate confidence score
  const confidence = calculateConfidence(transactions, errors, lines.length - 1)

  return {
    success: transactions.length > 0,
    transactions,
    confidence,
    detectedFormat: format,
    errors,
  }
}

/**
 * Detect CSV format from header line
 */
function detectFormat(headerLine: string): string {
  const headers = headerLine.toLowerCase()

  // Safaricom M-Pesa format 1
  if (
    headers.includes('transaction date') &&
    headers.includes('details') &&
    headers.includes('transaction status')
  ) {
    return 'safaricom-v1'
  }

  // Safaricom M-Pesa format 2
  if (
    headers.includes('receipt no') &&
    headers.includes('completion time') &&
    headers.includes('transaction type')
  ) {
    return 'safaricom-v2'
  }

  // Generic format with basic fields
  if (headers.includes('date') && headers.includes('amount')) {
    return 'generic'
  }

  return 'unknown'
}

/**
 * Parse a single row based on format
 */
function parseRow(line: string, format: string): ParsedTransaction | null {
  const cells = parseCSVLine(line)

  if (cells.length === 0) return null

  switch (format) {
    case 'safaricom-v1':
      return parseSafaricomV1Row(cells)
    case 'safaricom-v2':
      return parseSafaricomV2Row(cells)
    case 'generic':
      return parseGenericRow(cells)
    default:
      return null
  }
}

/**
 * Parse CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  cells.push(current.trim())
  return cells
}

/**
 * Parse Safaricom V1 format row
 * Expected columns: Transaction Date, Details, Transaction Status, Paid In, Withdrawn, Balance
 */
function parseSafaricomV1Row(cells: string[]): ParsedTransaction | null {
  if (cells.length < 6) return null

  const date = cells[0]
  const narrative = cells[1]
  const status = cells[2]
  const paidIn = parseFloat(cells[3]?.replace(/[^0-9.-]/g, '') || '0')
  const withdrawn = parseFloat(cells[4]?.replace(/[^0-9.-]/g, '') || '0')
  const balance = parseFloat(cells[5]?.replace(/[^0-9.-]/g, '') || '0')

  let amount: number
  let direction: 'in' | 'out' | 'transfer'

  if (paidIn > 0) {
    amount = paidIn
    direction = 'in'
  } else if (withdrawn > 0) {
    amount = -withdrawn
    direction = 'out'
  } else {
    amount = 0
    direction = 'transfer'
  }

  return {
    id: `${date}-${narrative}-${amount}`.replace(/[^a-zA-Z0-9-]/g, ''),
    date,
    amount,
    balance: balance || null,
    direction,
    counterparty: extractCounterparty(narrative),
    narrative,
    rawRow: {
      date,
      narrative,
      status,
      paidIn,
      withdrawn,
      balance,
    },
  }
}

/**
 * Parse Safaricom V2 format row
 * Expected columns: Receipt No, Completion Time, Details, Transaction Status, Paid In, Withdrawn, Balance, Balance Confirmed
 */
function parseSafaricomV2Row(cells: string[]): ParsedTransaction | null {
  if (cells.length < 7) return null

  const receiptNo = cells[0]
  const date = cells[1]
  const narrative = cells[2]
  const paidIn = parseFloat(cells[4]?.replace(/[^0-9.-]/g, '') || '0')
  const withdrawn = parseFloat(cells[5]?.replace(/[^0-9.-]/g, '') || '0')
  const balance = parseFloat(cells[6]?.replace(/[^0-9.-]/g, '') || '0')

  let amount: number
  let direction: 'in' | 'out' | 'transfer'

  if (paidIn > 0) {
    amount = paidIn
    direction = 'in'
  } else if (withdrawn > 0) {
    amount = -withdrawn
    direction = 'out'
  } else {
    amount = 0
    direction = 'transfer'
  }

  return {
    id: receiptNo || `${date}-${narrative}`.replace(/[^a-zA-Z0-9-]/g, ''),
    date,
    amount,
    balance: balance || null,
    direction,
    counterparty: extractCounterparty(narrative),
    narrative,
    rawRow: {
      receiptNo,
      date,
      narrative,
      paidIn,
      withdrawn,
      balance,
    },
  }
}

/**
 * Parse generic format row
 */
function parseGenericRow(cells: string[]): ParsedTransaction | null {
  if (cells.length < 2) return null

  const date = cells[0]
  const amount = parseFloat(cells[1]?.replace(/[^0-9.-]/g, '') || '0')
  const narrative = cells[2] || ''
  const balance = cells[3] ? parseFloat(cells[3].replace(/[^0-9.-]/g, '') || '0') : null

  return {
    id: `${date}-${amount}`.replace(/[^a-zA-Z0-9-]/g, ''),
    date,
    amount,
    balance,
    direction: amount >= 0 ? 'in' : 'out',
    counterparty: extractCounterparty(narrative),
    narrative,
    rawRow: {
      date,
      amount,
      narrative,
      balance,
    },
  }
}

/**
 * Extract counterparty from narrative
 */
function extractCounterparty(narrative: string): string | null {
  if (!narrative) return null

  // Common patterns for counterparty extraction
  const patterns = [
    /from\s+([A-Z\s]+)/i,
    /to\s+([A-Z\s]+)/i,
    /([A-Z\s]+)\s+has\s+sent/i,
    /paid\s+to\s+([A-Z\s]+)/i,
  ]

  for (const pattern of patterns) {
    const match = narrative.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return null
}

/**
 * Calculate confidence score
 */
function calculateConfidence(
  transactions: ParsedTransaction[],
  errors: string[],
  totalRows: number
): number {
  if (totalRows === 0) return 0

  const successRate = transactions.length / totalRows
  const errorPenalty = Math.min(errors.length / totalRows, 0.3)

  return Math.max(0, Math.min(1, successRate - errorPenalty))
}
