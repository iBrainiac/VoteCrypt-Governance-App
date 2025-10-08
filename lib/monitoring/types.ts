/**
 * Monitoring and metrics types for PesaScope application
 */

export interface MetricData {
  timestamp: Date
  value: number
  metadata?: Record<string, any>
}

export interface DailyMetrics {
  date: string
  uploadsCount: number
  parseSuccessCount: number
  parseFailureCount: number
  freeToPayCount: number
  paidToSubCount: number
  refundsCount: number
  totalPaymentTime: number // in seconds
  paymentCount: number
  cac: number // Customer Acquisition Cost
  ltv: number // Lifetime Value
  churnCount: number
}

export interface ParseErrorReason {
  reason: string
  count: number
  examples: string[]
}

export interface QuickMetrics {
  // Core conversion metrics
  uploadsPerDay: number
  parseSuccessRate: number // percentage
  freeToPaydRate: number // percentage
  paidToSubRate: number // percentage
  refundRate: number // percentage
  averagePaymentTime: number // in seconds
  
  // Error tracking
  parsingErrorReasons: ParseErrorReason[]
  
  // Economics
  cac: number
  ltv: number
  churnRate: number // percentage
  
  // Metadata
  periodStart: Date
  periodEnd: Date
  totalUploads: number
  totalPayments: number
}

export interface ABTestVariant {
  id: string
  name: string
  price: number
  description: string
  active: boolean
  weight: number // for traffic distribution
}

export interface ABTestResult {
  variantId: string
  variantName: string
  exposures: number
  conversions: number
  conversionRate: number
  revenue: number
  averageRevenuePerUser: number
}

export interface SubscriptionTier {
  id: string
  name: string
  price: number
  interval: 'monthly' | 'yearly'
  features: string[]
  active: boolean
}

export interface SubscriptionMetrics {
  activeSubscriptions: number
  newSubscriptions: number
  canceledSubscriptions: number
  upgrades: number
  downgrades: number
  mrr: number // Monthly Recurring Revenue
  churnRate: number
}
