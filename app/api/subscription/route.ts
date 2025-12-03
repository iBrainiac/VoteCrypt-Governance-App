/**
 * Subscription API endpoint
 * GET /api/subscription - Get available subscription tiers
 * POST /api/subscription - Create or update subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getActiveSubscriptionTiers,
  getSubscriptionTier,
  recordPaidToSubConversion,
} from '@/lib/monitoring/metrics-store'

/**
 * GET /api/subscription
 * Returns available subscription tiers
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tierId = searchParams.get('id')

    // Get specific tier
    if (tierId) {
      const tier = getSubscriptionTier(tierId)
      if (!tier) {
        return NextResponse.json({ error: 'Subscription tier not found' }, { status: 404 })
      }
      return NextResponse.json({
        success: true,
        tier,
      })
    }

    // Get all active tiers
    const tiers = getActiveSubscriptionTiers()
    return NextResponse.json({
      success: true,
      tiers,
    })
  } catch (error) {
    console.error('Error fetching subscription tiers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription tiers', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/subscription
 * Create or update a subscription
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, tierId, userId, fromPaidAnalysis } = body

    if (action === 'subscribe') {
      if (!tierId || !userId) {
        return NextResponse.json(
          { error: 'tierId and userId are required for subscription' },
          { status: 400 }
        )
      }

      const tier = getSubscriptionTier(tierId)
      if (!tier) {
        return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 404 })
      }

      // Record paid to subscription conversion if upgrading from one-time payment
      if (fromPaidAnalysis) {
        recordPaidToSubConversion()
      }

      // In production, this would create a subscription record in the database
      // For now, we'll just return success
      return NextResponse.json({
        success: true,
        message: 'Subscription created',
        subscription: {
          userId,
          tierId: tier.id,
          tierName: tier.name,
          price: tier.price,
          interval: tier.interval,
          startDate: new Date().toISOString(),
          status: 'active',
        },
      })
    }

    if (action === 'upgrade' || action === 'downgrade') {
      if (!tierId || !userId) {
        return NextResponse.json(
          { error: 'tierId and userId are required for subscription change' },
          { status: 400 }
        )
      }

      const tier = getSubscriptionTier(tierId)
      if (!tier) {
        return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 404 })
      }

      // In production, update the subscription record
      return NextResponse.json({
        success: true,
        message: `Subscription ${action}d`,
        subscription: {
          userId,
          tierId: tier.id,
          tierName: tier.name,
          price: tier.price,
          interval: tier.interval,
          updatedDate: new Date().toISOString(),
        },
      })
    }

    if (action === 'cancel') {
      if (!userId) {
        return NextResponse.json({ error: 'userId is required for cancellation' }, {
          status: 400,
        })
      }

      // In production, update the subscription status to canceled
      return NextResponse.json({
        success: true,
        message: 'Subscription canceled',
        subscription: {
          userId,
          status: 'canceled',
          canceledDate: new Date().toISOString(),
        },
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "subscribe", "upgrade", "downgrade", or "cancel"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing subscription:', error)
    return NextResponse.json(
      { error: 'Failed to process subscription', details: error.message },
      { status: 500 }
    )
  }
}
