/**
 * Pricing API endpoint with A/B testing support
 * GET /api/pricing - Get pricing variant for user
 * POST /api/pricing/exposure - Record pricing exposure
 * POST /api/pricing/conversion - Record pricing conversion
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  selectABVariant,
  recordABExposure,
  recordABConversion,
  getABTestResults,
  getActiveABVariants,
} from '@/lib/monitoring/metrics-store'

/**
 * GET /api/pricing
 * Returns a pricing variant for the user
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    // If requesting AB test results
    if (action === 'results') {
      const results = getABTestResults()
      return NextResponse.json({
        success: true,
        results,
      })
    }

    // If requesting all active variants
    if (action === 'variants') {
      const variants = getActiveABVariants()
      return NextResponse.json({
        success: true,
        variants,
      })
    }

    // Select a variant for the user
    const variant = selectABVariant()

    // Record exposure (user saw this price)
    recordABExposure(variant.id)

    return NextResponse.json({
      success: true,
      variant: {
        id: variant.id,
        name: variant.name,
        price: variant.price,
        description: variant.description,
      },
    })
  } catch (error) {
    console.error('Error in pricing endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to get pricing', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/pricing
 * Record a conversion event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { variantId, revenue, action } = body

    if (action === 'conversion') {
      if (!variantId || typeof revenue !== 'number') {
        return NextResponse.json(
          { error: 'variantId and revenue are required for conversion tracking' },
          { status: 400 }
        )
      }

      recordABConversion(variantId, revenue)

      return NextResponse.json({
        success: true,
        message: 'Conversion recorded',
      })
    }

    if (action === 'exposure') {
      if (!variantId) {
        return NextResponse.json(
          { error: 'variantId is required for exposure tracking' },
          { status: 400 }
        )
      }

      recordABExposure(variantId)

      return NextResponse.json({
        success: true,
        message: 'Exposure recorded',
      })
    }

    return NextResponse.json({ error: 'Invalid action. Use "conversion" or "exposure"' }, {
      status: 400,
    })
  } catch (error) {
    console.error('Error recording pricing event:', error)
    return NextResponse.json(
      { error: 'Failed to record pricing event', details: error.message },
      { status: 500 }
    )
  }
}
