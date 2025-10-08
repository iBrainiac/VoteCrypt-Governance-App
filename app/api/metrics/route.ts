/**
 * Metrics API endpoint
 * GET /api/metrics - Get quick metrics for monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { getQuickMetrics } from '@/lib/monitoring/metrics-store'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const daysParam = searchParams.get('days') || '7'
    const days = parseInt(daysParam, 10)

    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Invalid days parameter. Must be between 1 and 365.' },
        { status: 400 }
      )
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const metrics = getQuickMetrics(startDate, endDate)

    return NextResponse.json({
      success: true,
      metrics,
    })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics', details: error.message },
      { status: 500 }
    )
  }
}
