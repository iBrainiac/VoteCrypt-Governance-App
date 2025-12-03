/**
 * In-memory metrics store for tracking application metrics
 * For production, this should be replaced with a persistent storage solution
 */

import {
  DailyMetrics,
  ParseErrorReason,
  QuickMetrics,
  ABTestResult,
  ABTestVariant,
  SubscriptionMetrics,
  SubscriptionTier,
} from './types'

// In-memory storage - replace with database in production
const metricsStore: Map<string, DailyMetrics> = new Map()
const parseErrorsStore: Map<string, number> = new Map()
const parseErrorExamples: Map<string, string[]> = new Map()
const abTestVariants: Map<string, ABTestVariant> = new Map()
const abTestResults: Map<string, ABTestResult> = new Map()
const subscriptionTiers: Map<string, SubscriptionTier> = new Map()

// Initialize default AB test variants
const initializeDefaultVariants = () => {
  const defaultVariants: ABTestVariant[] = [
    {
      id: 'price-300',
      name: 'Standard Price',
      price: 300,
      description: 'KSh 300 one-time payment',
      active: true,
      weight: 50,
    },
    {
      id: 'price-250',
      name: 'Discounted Price',
      price: 250,
      description: 'KSh 250 one-time payment',
      active: true,
      weight: 30,
    },
    {
      id: 'price-350',
      name: 'Premium Price',
      price: 350,
      description: 'KSh 350 one-time payment',
      active: false,
      weight: 20,
    },
  ]

  defaultVariants.forEach((variant) => {
    if (!abTestVariants.has(variant.id)) {
      abTestVariants.set(variant.id, variant)
    }
  })
}

// Initialize default subscription tiers
const initializeDefaultSubscriptionTiers = () => {
  const defaultTiers: SubscriptionTier[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: 'monthly',
      features: ['30-day snapshot', 'Single Aha insight', 'Preview rows'],
      active: true,
    },
    {
      id: 'pro-monthly',
      name: 'Pro Monthly',
      price: 500,
      interval: 'monthly',
      features: [
        'Full historical analysis',
        'KRA-ready exports',
        'Advanced insights',
        'Priority support',
      ],
      active: true,
    },
    {
      id: 'pro-yearly',
      name: 'Pro Yearly',
      price: 5000,
      interval: 'yearly',
      features: [
        'Full historical analysis',
        'KRA-ready exports',
        'Advanced insights',
        'Priority support',
        '2 months free',
      ],
      active: true,
    },
  ]

  defaultTiers.forEach((tier) => {
    if (!subscriptionTiers.has(tier.id)) {
      subscriptionTiers.set(tier.id, tier)
    }
  })
}

// Initialize defaults
initializeDefaultVariants()
initializeDefaultSubscriptionTiers()

/**
 * Get or create daily metrics for a specific date
 */
const getDailyMetrics = (date: string): DailyMetrics => {
  if (!metricsStore.has(date)) {
    metricsStore.set(date, {
      date,
      uploadsCount: 0,
      parseSuccessCount: 0,
      parseFailureCount: 0,
      freeToPayCount: 0,
      paidToSubCount: 0,
      refundsCount: 0,
      totalPaymentTime: 0,
      paymentCount: 0,
      cac: 0,
      ltv: 0,
      churnCount: 0,
    })
  }
  return metricsStore.get(date)!
}

/**
 * Record an upload event
 */
export const recordUpload = (date: string = new Date().toISOString().split('T')[0]): void => {
  const metrics = getDailyMetrics(date)
  metrics.uploadsCount++
}

/**
 * Record a successful parse
 */
export const recordParseSuccess = (
  date: string = new Date().toISOString().split('T')[0]
): void => {
  const metrics = getDailyMetrics(date)
  metrics.parseSuccessCount++
}

/**
 * Record a parse failure with reason
 */
export const recordParseFailure = (
  reason: string,
  example?: string,
  date: string = new Date().toISOString().split('T')[0]
): void => {
  const metrics = getDailyMetrics(date)
  metrics.parseFailureCount++

  // Track error reasons
  parseErrorsStore.set(reason, (parseErrorsStore.get(reason) || 0) + 1)

  // Track examples
  if (example) {
    const examples = parseErrorExamples.get(reason) || []
    if (examples.length < 5) {
      // Keep max 5 examples
      examples.push(example)
      parseErrorExamples.set(reason, examples)
    }
  }
}

/**
 * Record a free to paid conversion
 */
export const recordFreeToPayConversion = (
  date: string = new Date().toISOString().split('T')[0]
): void => {
  const metrics = getDailyMetrics(date)
  metrics.freeToPayCount++
}

/**
 * Record a paid to subscription conversion
 */
export const recordPaidToSubConversion = (
  date: string = new Date().toISOString().split('T')[0]
): void => {
  const metrics = getDailyMetrics(date)
  metrics.paidToSubCount++
}

/**
 * Record a refund
 */
export const recordRefund = (date: string = new Date().toISOString().split('T')[0]): void => {
  const metrics = getDailyMetrics(date)
  metrics.refundsCount++
}

/**
 * Record a payment with its duration
 */
export const recordPayment = (
  durationSeconds: number,
  date: string = new Date().toISOString().split('T')[0]
): void => {
  const metrics = getDailyMetrics(date)
  metrics.totalPaymentTime += durationSeconds
  metrics.paymentCount++
}

/**
 * Update CAC (Customer Acquisition Cost)
 */
export const updateCAC = (
  cac: number,
  date: string = new Date().toISOString().split('T')[0]
): void => {
  const metrics = getDailyMetrics(date)
  metrics.cac = cac
}

/**
 * Update LTV (Lifetime Value)
 */
export const updateLTV = (
  ltv: number,
  date: string = new Date().toISOString().split('T')[0]
): void => {
  const metrics = getDailyMetrics(date)
  metrics.ltv = ltv
}

/**
 * Record churn
 */
export const recordChurn = (date: string = new Date().toISOString().split('T')[0]): void => {
  const metrics = getDailyMetrics(date)
  metrics.churnCount++
}

/**
 * Get quick metrics for a date range
 */
export const getQuickMetrics = (startDate: Date, endDate: Date): QuickMetrics => {
  const metrics: DailyMetrics[] = []

  // Get all metrics in range
  const start = new Date(startDate)
  const end = new Date(endDate)

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split('T')[0]
    const dailyMetrics = metricsStore.get(dateKey)
    if (dailyMetrics) {
      metrics.push(dailyMetrics)
    }
  }

  // Aggregate metrics
  const totalUploads = metrics.reduce((sum, m) => sum + m.uploadsCount, 0)
  const totalParseSuccess = metrics.reduce((sum, m) => sum + m.parseSuccessCount, 0)
  const totalParseFailure = metrics.reduce((sum, m) => sum + m.parseFailureCount, 0)
  const totalFreeToPayConversions = metrics.reduce((sum, m) => sum + m.freeToPayCount, 0)
  const totalPaidToSubConversions = metrics.reduce((sum, m) => sum + m.paidToSubCount, 0)
  const totalRefunds = metrics.reduce((sum, m) => sum + m.refundsCount, 0)
  const totalPaymentTime = metrics.reduce((sum, m) => sum + m.totalPaymentTime, 0)
  const totalPayments = metrics.reduce((sum, m) => sum + m.paymentCount, 0)
  const totalChurn = metrics.reduce((sum, m) => sum + m.churnCount, 0)

  // Calculate averages and rates
  const dayCount = Math.max(1, metrics.length)
  const totalParses = totalParseSuccess + totalParseFailure

  const parseSuccessRate = totalParses > 0 ? (totalParseSuccess / totalParses) * 100 : 0

  const freeToPaydRate = totalUploads > 0 ? (totalFreeToPayConversions / totalUploads) * 100 : 0

  const paidToSubRate =
    totalFreeToPayConversions > 0
      ? (totalPaidToSubConversions / totalFreeToPayConversions) * 100
      : 0

  const refundRate = totalPayments > 0 ? (totalRefunds / totalPayments) * 100 : 0

  const averagePaymentTime = totalPayments > 0 ? totalPaymentTime / totalPayments : 0

  const churnRate = totalPayments > 0 ? (totalChurn / totalPayments) * 100 : 0

  // Get latest CAC and LTV
  const latestMetrics = metrics.length > 0 ? metrics[metrics.length - 1] : null
  const cac = latestMetrics?.cac || 0
  const ltv = latestMetrics?.ltv || 0

  // Get parsing error reasons
  const parsingErrorReasons: ParseErrorReason[] = Array.from(parseErrorsStore.entries()).map(
    ([reason, count]) => ({
      reason,
      count,
      examples: parseErrorExamples.get(reason) || [],
    })
  )

  return {
    uploadsPerDay: totalUploads / dayCount,
    parseSuccessRate,
    freeToPaydRate,
    paidToSubRate,
    refundRate,
    averagePaymentTime,
    parsingErrorReasons,
    cac,
    ltv,
    churnRate,
    periodStart: startDate,
    periodEnd: endDate,
    totalUploads,
    totalPayments,
  }
}

/**
 * AB Testing Functions
 */

/**
 * Get active AB test variants
 */
export const getActiveABVariants = (): ABTestVariant[] => {
  return Array.from(abTestVariants.values()).filter((v) => v.active)
}

/**
 * Select a variant based on weights
 */
export const selectABVariant = (): ABTestVariant => {
  const activeVariants = getActiveABVariants()

  if (activeVariants.length === 0) {
    throw new Error('No active AB test variants')
  }

  const totalWeight = activeVariants.reduce((sum, v) => sum + v.weight, 0)
  let random = Math.random() * totalWeight

  for (const variant of activeVariants) {
    random -= variant.weight
    if (random <= 0) {
      return variant
    }
  }

  return activeVariants[0] // Fallback
}

/**
 * Record AB test exposure
 */
export const recordABExposure = (variantId: string): void => {
  const variant = abTestVariants.get(variantId)
  if (!variant) return

  let result = abTestResults.get(variantId)
  if (!result) {
    result = {
      variantId: variant.id,
      variantName: variant.name,
      exposures: 0,
      conversions: 0,
      conversionRate: 0,
      revenue: 0,
      averageRevenuePerUser: 0,
    }
    abTestResults.set(variantId, result)
  }

  result.exposures++
}

/**
 * Record AB test conversion
 */
export const recordABConversion = (variantId: string, revenue: number): void => {
  const result = abTestResults.get(variantId)
  if (!result) return

  result.conversions++
  result.revenue += revenue
  result.conversionRate = (result.conversions / result.exposures) * 100
  result.averageRevenuePerUser = result.revenue / result.conversions
}

/**
 * Get AB test results
 */
export const getABTestResults = (): ABTestResult[] => {
  return Array.from(abTestResults.values())
}

/**
 * Add or update AB test variant
 */
export const upsertABVariant = (variant: ABTestVariant): void => {
  abTestVariants.set(variant.id, variant)
}

/**
 * Subscription Functions
 */

/**
 * Get all subscription tiers
 */
export const getSubscriptionTiers = (): SubscriptionTier[] => {
  return Array.from(subscriptionTiers.values())
}

/**
 * Get active subscription tiers
 */
export const getActiveSubscriptionTiers = (): SubscriptionTier[] => {
  return Array.from(subscriptionTiers.values()).filter((t) => t.active)
}

/**
 * Add or update subscription tier
 */
export const upsertSubscriptionTier = (tier: SubscriptionTier): void => {
  subscriptionTiers.set(tier.id, tier)
}

/**
 * Get subscription tier by ID
 */
export const getSubscriptionTier = (id: string): SubscriptionTier | undefined => {
  return subscriptionTiers.get(id)
}

// Export stores for testing purposes
export const __test__ = {
  metricsStore,
  parseErrorsStore,
  parseErrorExamples,
  abTestVariants,
  abTestResults,
  subscriptionTiers,
}
