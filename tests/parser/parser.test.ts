/**
 * Parser Tests
 * Tests for M-Pesa CSV parser with various formats
 */

import { parseMpesaCSV } from '@/lib/monitoring/parser'
import fs from 'fs'
import path from 'path'

describe('M-Pesa CSV Parser', () => {
  describe('Safaricom V1 Format', () => {
    let sampleContent: string

    beforeAll(() => {
      const samplePath = path.join(
        process.cwd(),
        'tests',
        'parser',
        'samples',
        'safaricom-v1-sample.csv'
      )
      sampleContent = fs.readFileSync(samplePath, 'utf-8')
    })

    test('should parse Safaricom V1 format correctly', () => {
      const result = parseMpesaCSV(sampleContent)

      expect(result.success).toBe(true)
      expect(result.detectedFormat).toBe('safaricom-v1')
      expect(result.transactions.length).toBeGreaterThan(0)
      expect(result.confidence).toBeGreaterThan(0.9)
    })

    test('should correctly identify transaction directions', () => {
      const result = parseMpesaCSV(sampleContent)
      const transactions = result.transactions

      // Check that we have both incoming and outgoing transactions
      const hasIncoming = transactions.some((t) => t.direction === 'in')
      const hasOutgoing = transactions.some((t) => t.direction === 'out')

      expect(hasIncoming).toBe(true)
      expect(hasOutgoing).toBe(true)
    })

    test('should parse amounts correctly', () => {
      const result = parseMpesaCSV(sampleContent)
      const transactions = result.transactions

      // All transactions should have numeric amounts
      transactions.forEach((t) => {
        expect(typeof t.amount).toBe('number')
        expect(isNaN(t.amount)).toBe(false)
      })
    })

    test('should parse balances correctly', () => {
      const result = parseMpesaCSV(sampleContent)
      const transactions = result.transactions

      // Most transactions should have balance information
      const withBalance = transactions.filter((t) => t.balance !== null)
      expect(withBalance.length).toBeGreaterThan(0)
    })
  })

  describe('Safaricom V2 Format', () => {
    let sampleContent: string

    beforeAll(() => {
      const samplePath = path.join(
        process.cwd(),
        'tests',
        'parser',
        'samples',
        'safaricom-v2-sample.csv'
      )
      sampleContent = fs.readFileSync(samplePath, 'utf-8')
    })

    test('should parse Safaricom V2 format correctly', () => {
      const result = parseMpesaCSV(sampleContent)

      expect(result.success).toBe(true)
      expect(result.detectedFormat).toBe('safaricom-v2')
      expect(result.transactions.length).toBeGreaterThan(0)
      expect(result.confidence).toBeGreaterThan(0.9)
    })

    test('should preserve receipt numbers as transaction IDs', () => {
      const result = parseMpesaCSV(sampleContent)
      const transactions = result.transactions

      // Check that receipt numbers are used as IDs
      const hasReceiptIds = transactions.some((t) => t.id.startsWith('Q'))
      expect(hasReceiptIds).toBe(true)
    })
  })

  describe('Error Handling', () => {
    test('should handle empty CSV', () => {
      const result = parseMpesaCSV('')

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    test('should handle CSV with only headers', () => {
      const csvContent = 'Transaction Date,Details,Transaction Status,Paid In,Withdrawn,Balance'
      const result = parseMpesaCSV(csvContent)

      expect(result.success).toBe(false)
      expect(result.transactions.length).toBe(0)
    })

    test('should handle unknown format', () => {
      const csvContent = `Unknown Header,Another Header
Value1,Value2`
      const result = parseMpesaCSV(csvContent)

      expect(result.detectedFormat).toBe('unknown')
    })
  })

  describe('Confidence Scoring', () => {
    test('should return high confidence for valid data', () => {
      const samplePath = path.join(
        process.cwd(),
        'tests',
        'parser',
        'samples',
        'safaricom-v1-sample.csv'
      )
      const sampleContent = fs.readFileSync(samplePath, 'utf-8')
      const result = parseMpesaCSV(sampleContent)

      expect(result.confidence).toBeGreaterThan(0.9)
    })

    test('should return lower confidence for malformed data', () => {
      const malformedCsv = `Transaction Date,Details,Transaction Status,Paid In,Withdrawn,Balance
Invalid,Data,Here
More,Bad,Data
Good,01/15/2025,Completed,100,0,500`

      const result = parseMpesaCSV(malformedCsv)

      expect(result.confidence).toBeLessThan(0.9)
    })
  })
})
