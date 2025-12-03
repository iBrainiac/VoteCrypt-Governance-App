# PesaScope Monitoring & Analytics

This document describes the monitoring, A/B testing, parser CI, and subscription features implemented for the PesaScope application.

## Overview

The implementation includes:

1. **Metrics Monitoring API** - Track key business and technical metrics
2. **Parser CI** - Automated testing for M-Pesa CSV parser
3. **A/B Pricing Harness** - Experiment with different pricing strategies
4. **Subscription Bridging** - Manage subscription tiers and conversions

## API Endpoints

### Metrics API

**GET /api/metrics**

Get quick metrics for monitoring application performance.

Query Parameters:
- `days` (optional): Number of days to analyze (default: 7, max: 365)

Response:
```json
{
  "success": true,
  "metrics": {
    "uploadsPerDay": 12.5,
    "parseSuccessRate": 95.2,
    "freeToPaydRate": 8.3,
    "paidToSubRate": 4.5,
    "refundRate": 0.5,
    "averagePaymentTime": 45.2,
    "parsingErrorReasons": [
      {
        "reason": "header_mismatch",
        "count": 3,
        "examples": ["..."]
      }
    ],
    "cac": 200,
    "ltv": 1500,
    "churnRate": 2.1,
    "periodStart": "2025-01-01T00:00:00.000Z",
    "periodEnd": "2025-01-08T00:00:00.000Z",
    "totalUploads": 87,
    "totalPayments": 7
  }
}
```

### Pricing API

**GET /api/pricing**

Get a pricing variant for A/B testing.

Query Parameters:
- `action` (optional): 
  - `results` - Get A/B test results
  - `variants` - Get all active variants

Response (default):
```json
{
  "success": true,
  "variant": {
    "id": "price-300",
    "name": "Standard Price",
    "price": 300,
    "description": "KSh 300 one-time payment"
  }
}
```

**POST /api/pricing**

Record pricing events (exposure or conversion).

Request Body:
```json
{
  "action": "conversion",
  "variantId": "price-300",
  "revenue": 300
}
```

or

```json
{
  "action": "exposure",
  "variantId": "price-300"
}
```

### Subscription API

**GET /api/subscription**

Get available subscription tiers.

Query Parameters:
- `id` (optional): Get specific tier by ID

Response:
```json
{
  "success": true,
  "tiers": [
    {
      "id": "pro-monthly",
      "name": "Pro Monthly",
      "price": 500,
      "interval": "monthly",
      "features": [
        "Full historical analysis",
        "KRA-ready exports",
        "Advanced insights",
        "Priority support"
      ],
      "active": true
    }
  ]
}
```

**POST /api/subscription**

Create or manage subscriptions.

Request Body (subscribe):
```json
{
  "action": "subscribe",
  "tierId": "pro-monthly",
  "userId": "user123",
  "fromPaidAnalysis": true
}
```

Actions:
- `subscribe` - Create new subscription
- `upgrade` - Upgrade to higher tier
- `downgrade` - Downgrade to lower tier
- `cancel` - Cancel subscription

## Monitoring Metrics

### Key Metrics Tracked

1. **uploads/day** - Daily upload volume
2. **parse success %** - Percentage of successfully parsed files
3. **free→paid %** - Conversion rate from free to paid
4. **paid→sub %** - Conversion rate from one-time payment to subscription
5. **refunds** - Number of refunds issued
6. **average payment time** - Average time to complete payment
7. **parsing error reasons** - Categorized parsing failures with examples
8. **CAC** - Customer Acquisition Cost
9. **LTV** - Lifetime Value
10. **churn** - Customer churn rate

### Using the Metrics Store

```typescript
import {
  recordUpload,
  recordParseSuccess,
  recordParseFailure,
  recordFreeToPayConversion,
  recordPayment,
  getQuickMetrics,
} from '@/lib/monitoring/metrics-store'

// Record events
recordUpload()
recordParseSuccess()
recordParseFailure('header_mismatch', 'example CSV excerpt')
recordFreeToPayConversion()
recordPayment(45) // Payment took 45 seconds

// Get metrics
const metrics = getQuickMetrics(
  new Date('2025-01-01'),
  new Date('2025-01-08')
)
```

## Parser CI

### Test Suite

The parser test suite validates M-Pesa CSV parsing across multiple formats:

- Safaricom V1 format
- Safaricom V2 format
- Generic CSV format
- Error handling
- Confidence scoring

### Running Tests

```bash
# Run all tests
yarn test

# Run parser tests only
yarn test:parser

# Run with coverage
yarn test:coverage

# Watch mode
yarn test:watch
```

### CI Pipeline

The GitHub Actions workflow (`.github/workflows/parser-ci.yml`) runs automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Changes to parser code or tests

Quality Gates:
- Parse success rate: ≥95%
- Confidence score: ≥0.9
- All format variants supported

### Sample CSV Files

Sample files for testing are located in `tests/parser/samples/`:
- `safaricom-v1-sample.csv`
- `safaricom-v2-sample.csv`

## A/B Testing

### Default Variants

Three pricing variants are configured by default:

1. **Standard Price** (price-300)
   - Price: KSh 300
   - Weight: 50% of traffic

2. **Discounted Price** (price-250)
   - Price: KSh 250
   - Weight: 30% of traffic

3. **Premium Price** (price-350)
   - Price: KSh 350
   - Weight: 20% of traffic
   - Status: Inactive by default

### Usage Example

```typescript
import {
  selectABVariant,
  recordABExposure,
  recordABConversion,
  getABTestResults,
} from '@/lib/monitoring/metrics-store'

// Select variant for user
const variant = selectABVariant()

// Show price to user
console.log(`Price: KSh ${variant.price}`)

// Record exposure (automatically done by selectABVariant)

// On successful payment
recordABConversion(variant.id, variant.price)

// View results
const results = getABTestResults()
```

## Subscription Management

### Default Tiers

1. **Free**
   - Price: KSh 0/month
   - Features: 30-day snapshot, Single Aha insight, Preview rows

2. **Pro Monthly**
   - Price: KSh 500/month
   - Features: Full analysis, KRA exports, Advanced insights, Priority support

3. **Pro Yearly**
   - Price: KSh 5,000/year
   - Features: All Pro features + 2 months free

### Subscription Bridging

The system tracks conversions from one-time payments to subscriptions:

```typescript
import {
  recordPaidToSubConversion,
} from '@/lib/monitoring/metrics-store'

// When user upgrades from one-time payment to subscription
recordPaidToSubConversion()
```

## Implementation Notes

### Data Storage

The current implementation uses in-memory storage for metrics and configuration. For production:

1. Replace `metricsStore` with PostgreSQL or similar database
2. Implement persistence for:
   - Daily metrics
   - Parse error tracking
   - A/B test results
   - Subscription records

### Performance Considerations

- Metrics queries are optimized for date ranges
- In-memory storage is suitable for MVP/testing
- For production, implement database indexes on date fields
- Consider caching frequently accessed metrics

### Security

- All API endpoints should be protected with authentication in production
- Rate limiting should be implemented
- Sensitive metrics should only be accessible to authorized users

## Monitoring Dashboard (Future)

Consider implementing a dashboard to visualize:

- Real-time metrics
- A/B test results with statistical significance
- Parser success rates over time
- Subscription funnel analytics
- Revenue metrics (MRR, ARR, churn)

## Environment Variables

No additional environment variables are required for the current implementation. For production:

```env
# Database
DATABASE_URL=postgresql://...

# Redis (for caching)
REDIS_URL=redis://...

# Analytics
ANALYTICS_API_KEY=...
```

## Testing

Run the full test suite:

```bash
yarn test
```

Run specific test suites:

```bash
yarn test:parser        # Parser tests only
yarn test:coverage      # With coverage report
```

## Contributing

When adding new metrics or features:

1. Update types in `lib/monitoring/types.ts`
2. Add tracking functions in `lib/monitoring/metrics-store.ts`
3. Update API endpoints as needed
4. Add tests for new functionality
5. Update this documentation

## License

Same as the main project.
