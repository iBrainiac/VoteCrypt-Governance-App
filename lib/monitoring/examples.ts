/**
 * Example usage of the monitoring and metrics system
 * This file demonstrates how to integrate metrics tracking into your application
 */

import {
  recordUpload,
  recordParseSuccess,
  recordParseFailure,
  recordFreeToPayConversion,
  recordPaidToSubConversion,
  recordPayment,
  recordRefund,
  recordChurn,
  updateCAC,
  updateLTV,
  getQuickMetrics,
  selectABVariant,
  recordABConversion,
  getABTestResults,
  getActiveSubscriptionTiers,
} from '@/lib/monitoring/metrics-store'

import { parseMpesaCSV } from '@/lib/monitoring/parser'

/**
 * Example 1: File Upload and Parsing Flow
 */
export async function handleFileUpload(file: File) {
  // Record the upload event
  recordUpload()

  // Read file content
  const content = await file.text()

  // Parse the CSV
  const parseResult = parseMpesaCSV(content)

  if (parseResult.success) {
    // Record successful parse
    recordParseSuccess()

    console.log('Parse successful!')
    console.log(`Detected format: ${parseResult.detectedFormat}`)
    console.log(`Confidence: ${(parseResult.confidence * 100).toFixed(1)}%`)
    console.log(`Transactions found: ${parseResult.transactions.length}`)

    return {
      success: true,
      transactions: parseResult.transactions,
      preview: parseResult.transactions.slice(0, 10),
      metadata: {
        format: parseResult.detectedFormat,
        confidence: parseResult.confidence,
        totalTransactions: parseResult.transactions.length,
      },
    }
  } else {
    // Record parse failure with reason
    const primaryError = parseResult.errors[0] || 'Unknown error'
    const errorExcerpt = content.substring(0, 200) // First 200 chars as example

    recordParseFailure(primaryError, errorExcerpt)

    console.error('Parse failed:', parseResult.errors)

    return {
      success: false,
      errors: parseResult.errors,
    }
  }
}

/**
 * Example 2: A/B Testing Price Selection
 */
export async function getPriceForUser() {
  // Select a pricing variant based on configured weights
  const variant = selectABVariant()

  console.log(`Showing price variant: ${variant.name}`)
  console.log(`Price: KSh ${variant.price}`)

  // The exposure is automatically recorded by selectABVariant
  // Store the variant ID with the user session so we can track conversion later

  return {
    variantId: variant.id,
    variantName: variant.name,
    price: variant.price,
    description: variant.description,
  }
}

/**
 * Example 3: Payment Flow with Timing
 */
export async function handlePaymentFlow(
  userId: string,
  variantId: string,
  price: number
) {
  const startTime = Date.now()

  try {
    // Simulate payment processing (replace with actual Daraja STK push)
    await processPayment(userId, price)

    // Calculate payment duration in seconds
    const durationSeconds = (Date.now() - startTime) / 1000

    // Record successful payment with duration
    recordPayment(durationSeconds)

    // Record free to paid conversion
    recordFreeToPayConversion()

    // Record A/B test conversion with revenue
    recordABConversion(variantId, price)

    console.log(`Payment successful! Took ${durationSeconds.toFixed(1)}s`)

    return {
      success: true,
      duration: durationSeconds,
    }
  } catch (error) {
    console.error('Payment failed:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Example 4: Subscription Upgrade
 */
export async function upgradeToSubscription(userId: string, tierId: string) {
  // Get subscription tier details
  const tiers = getActiveSubscriptionTiers()
  const selectedTier = tiers.find((t) => t.id === tierId)

  if (!selectedTier) {
    throw new Error('Invalid subscription tier')
  }

  console.log(`Upgrading to ${selectedTier.name}`)
  console.log(`Price: KSh ${selectedTier.price}/${selectedTier.interval}`)

  // Process subscription (replace with actual implementation)
  await createSubscription(userId, selectedTier)

  // Record paid to subscription conversion
  recordPaidToSubConversion()

  return {
    success: true,
    tier: selectedTier,
  }
}

/**
 * Example 5: Refund Processing
 */
export async function processRefund(userId: string, paymentId: string) {
  // Process the refund (replace with actual implementation)
  await issueRefund(paymentId)

  // Record refund in metrics
  recordRefund()

  console.log('Refund processed')

  return {
    success: true,
  }
}

/**
 * Example 6: Churn Tracking
 */
export async function handleSubscriptionCancellation(userId: string) {
  // Cancel subscription (replace with actual implementation)
  await cancelSubscription(userId)

  // Record churn
  recordChurn()

  console.log('Subscription canceled - churn recorded')

  return {
    success: true,
  }
}

/**
 * Example 7: Updating Economics Metrics (typically done in a cron job)
 */
export async function updateEconomicsMetrics() {
  // Calculate CAC (Customer Acquisition Cost)
  const totalMarketingSpend = await getTotalMarketingSpend()
  const newCustomers = await getNewCustomersCount()
  const cac = newCustomers > 0 ? totalMarketingSpend / newCustomers : 0

  updateCAC(cac)

  // Calculate LTV (Lifetime Value)
  const averageRevenue = await getAverageRevenuePerCustomer()
  const averageLifetime = await getAverageCustomerLifetime() // in months
  const ltv = averageRevenue * averageLifetime

  updateLTV(ltv)

  console.log(`Updated CAC: KSh ${cac.toFixed(2)}`)
  console.log(`Updated LTV: KSh ${ltv.toFixed(2)}`)

  return { cac, ltv }
}

/**
 * Example 8: Fetching Metrics Dashboard Data
 */
export async function getMetricsDashboard(days: number = 7) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const metrics = getQuickMetrics(startDate, endDate)

  console.log('=== Metrics Dashboard ===')
  console.log(`Period: ${metrics.periodStart.toLocaleDateString()} - ${metrics.periodEnd.toLocaleDateString()}`)
  console.log(`\nUploads per day: ${metrics.uploadsPerDay.toFixed(1)}`)
  console.log(`Parse success rate: ${metrics.parseSuccessRate.toFixed(1)}%`)
  console.log(`Free → Paid conversion: ${metrics.freeToPaydRate.toFixed(1)}%`)
  console.log(`Paid → Subscription: ${metrics.paidToSubRate.toFixed(1)}%`)
  console.log(`Average payment time: ${metrics.averagePaymentTime.toFixed(1)}s`)
  console.log(`\nCAC: KSh ${metrics.cac.toFixed(2)}`)
  console.log(`LTV: KSh ${metrics.ltv.toFixed(2)}`)
  console.log(`Churn rate: ${metrics.churnRate.toFixed(1)}%`)

  if (metrics.parsingErrorReasons.length > 0) {
    console.log('\n=== Top Parsing Errors ===')
    metrics.parsingErrorReasons.slice(0, 5).forEach((error) => {
      console.log(`${error.reason}: ${error.count} occurrences`)
    })
  }

  return metrics
}

/**
 * Example 9: Viewing A/B Test Results
 */
export function getABTestDashboard() {
  const results = getABTestResults()

  console.log('=== A/B Test Results ===')

  results.forEach((result) => {
    console.log(`\n${result.variantName} (${result.variantId})`)
    console.log(`  Exposures: ${result.exposures}`)
    console.log(`  Conversions: ${result.conversions}`)
    console.log(`  Conversion Rate: ${result.conversionRate.toFixed(2)}%`)
    console.log(`  Total Revenue: KSh ${result.revenue.toFixed(2)}`)
    console.log(`  ARPU: KSh ${result.averageRevenuePerUser.toFixed(2)}`)
  })

  // Determine winner
  const winner = results.reduce((best, current) =>
    current.conversionRate > best.conversionRate ? current : best
  )

  console.log(`\n🏆 Best performing variant: ${winner.variantName}`)

  return results
}

// Mock implementations (replace with actual implementations)
async function processPayment(userId: string, amount: number): Promise<void> {
  // Implement actual Daraja STK Push here
  await new Promise((resolve) => setTimeout(resolve, 2000))
}

async function createSubscription(userId: string, tier: any): Promise<void> {
  // Implement subscription creation
  await new Promise((resolve) => setTimeout(resolve, 1000))
}

async function issueRefund(paymentId: string): Promise<void> {
  // Implement refund logic
  await new Promise((resolve) => setTimeout(resolve, 1000))
}

async function cancelSubscription(userId: string): Promise<void> {
  // Implement subscription cancellation
  await new Promise((resolve) => setTimeout(resolve, 1000))
}

async function getTotalMarketingSpend(): Promise<number> {
  // Fetch from database or analytics
  return 50000 // KSh 50,000
}

async function getNewCustomersCount(): Promise<number> {
  // Fetch from database
  return 250
}

async function getAverageRevenuePerCustomer(): Promise<number> {
  // Calculate from database
  return 1200 // KSh 1,200
}

async function getAverageCustomerLifetime(): Promise<number> {
  // Calculate from database
  return 12 // 12 months
}
