# Quick Start Guide - Monitoring & Analytics

This guide will help you quickly get started with the monitoring, A/B testing, parser CI, and subscription features.

## Prerequisites

- Node.js 18+ installed
- Yarn package manager
- Next.js development server running

## Installation

1. **Install dependencies** (if not already installed):
   ```bash
   yarn install
   ```

2. **Start the development server**:
   ```bash
   yarn dev
   ```

   The server will start at `http://localhost:3000`

## Quick Test

### 1. Test the APIs

Run the API test script to verify everything is working:

```bash
node scripts/test-monitoring-api.js
```

This will:
- Generate sample data
- Test all API endpoints
- Show example requests and responses

### 2. Manual API Testing

You can also test endpoints manually in your browser or with curl:

**Get Metrics**:
```bash
curl http://localhost:3000/api/metrics?days=7
```

**Get Pricing Variant**:
```bash
curl http://localhost:3000/api/pricing
```

**Get Subscription Tiers**:
```bash
curl http://localhost:3000/api/subscription
```

### 3. View A/B Test Results

```bash
curl http://localhost:3000/api/pricing?action=results
```

## Integration Examples

### Example 1: Track File Upload and Parse

```typescript
import { handleFileUpload } from '@/lib/monitoring/examples'

async function onFileSelect(file: File) {
  const result = await handleFileUpload(file)
  
  if (result.success) {
    console.log('Parsed transactions:', result.transactions.length)
    console.log('Parse confidence:', result.metadata.confidence)
  } else {
    console.error('Parse errors:', result.errors)
  }
}
```

### Example 2: Show Dynamic Pricing

```typescript
import { getPriceForUser } from '@/lib/monitoring/examples'

async function displayPricing() {
  const pricing = await getPriceForUser()
  
  // Show price to user
  document.getElementById('price').textContent = `KSh ${pricing.price}`
  
  // Store variant ID for conversion tracking
  sessionStorage.setItem('pricingVariant', pricing.variantId)
}
```

### Example 3: Track Payment Conversion

```typescript
import { handlePaymentFlow } from '@/lib/monitoring/examples'

async function processPayment(userId: string) {
  const variantId = sessionStorage.getItem('pricingVariant')
  const price = parseInt(sessionStorage.getItem('price'))
  
  const result = await handlePaymentFlow(userId, variantId, price)
  
  if (result.success) {
    console.log('Payment completed in', result.duration, 'seconds')
  }
}
```

### Example 4: Subscription Upgrade

```typescript
import { upgradeToSubscription } from '@/lib/monitoring/examples'

async function handleUpgrade(userId: string) {
  const result = await upgradeToSubscription(userId, 'pro-monthly')
  
  if (result.success) {
    console.log('Upgraded to:', result.tier.name)
  }
}
```

## Running Tests

### Unit Tests

Run the parser tests:

```bash
yarn test:parser
```

Run all tests:

```bash
yarn test
```

Run tests with coverage:

```bash
yarn test:coverage
```

### CI Pipeline

The parser CI automatically runs on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

View the workflow: `.github/workflows/parser-ci.yml`

## Monitoring Dashboard

### View Metrics

The metrics API provides comprehensive analytics:

```typescript
import { getMetricsDashboard } from '@/lib/monitoring/examples'

async function showDashboard() {
  const metrics = await getMetricsDashboard(30) // Last 30 days
  
  console.log('Uploads per day:', metrics.uploadsPerDay)
  console.log('Parse success rate:', metrics.parseSuccessRate, '%')
  console.log('Free to paid conversion:', metrics.freeToPaydRate, '%')
  console.log('CAC:', metrics.cac)
  console.log('LTV:', metrics.ltv)
}
```

### A/B Test Dashboard

```typescript
import { getABTestDashboard } from '@/lib/monitoring/examples'

function showABResults() {
  const results = getABTestDashboard()
  // Results are logged to console
  // Returns array of variant results
}
```

## Key Features

### 1. Metrics Tracked

- **uploads/day** - Daily upload volume
- **parse success %** - Parsing accuracy
- **free→paid %** - Conversion funnel
- **paid→sub %** - Subscription upgrades
- **refunds** - Refund tracking
- **average payment time** - Payment performance
- **parsing error reasons** - Error categorization
- **CAC** - Customer acquisition cost
- **LTV** - Lifetime value
- **churn** - Customer retention

### 2. A/B Pricing

Three default variants:
- Standard: KSh 300 (50% traffic)
- Discounted: KSh 250 (30% traffic)
- Premium: KSh 350 (20% traffic, inactive)

Tracks:
- Exposures per variant
- Conversions per variant
- Revenue per variant
- Conversion rates

### 3. Parser CI

- Automated testing on PR/push
- Multiple CSV format support
- Confidence scoring
- Quality gates (≥95% success rate)

### 4. Subscription Management

Three tiers:
- **Free**: KSh 0/month
- **Pro Monthly**: KSh 500/month
- **Pro Yearly**: KSh 5,000/year (2 months free)

Features:
- Subscribe/upgrade/downgrade/cancel
- Conversion tracking
- MRR calculation

## API Reference

### Metrics API

**Endpoint**: `GET /api/metrics`

**Parameters**:
- `days` (optional): Number of days (1-365, default: 7)

**Response**:
```json
{
  "success": true,
  "metrics": { ... }
}
```

### Pricing API

**Endpoints**:
- `GET /api/pricing` - Get variant
- `GET /api/pricing?action=variants` - List variants
- `GET /api/pricing?action=results` - Get results
- `POST /api/pricing` - Record event

**POST Body**:
```json
{
  "action": "conversion",
  "variantId": "price-300",
  "revenue": 300
}
```

### Subscription API

**Endpoints**:
- `GET /api/subscription` - List tiers
- `GET /api/subscription?id=pro-monthly` - Get tier
- `POST /api/subscription` - Manage subscription

**POST Body**:
```json
{
  "action": "subscribe",
  "tierId": "pro-monthly",
  "userId": "user123",
  "fromPaidAnalysis": true
}
```

## Environment Setup

For production deployment, configure:

```env
# Database (replace in-memory store)
DATABASE_URL=postgresql://...

# Redis (optional, for caching)
REDIS_URL=redis://...

# API Base URL
NEXT_PUBLIC_API_URL=https://your-domain.com
```

## Next Steps

1. **Integrate with your UI**: Use the example functions in your components
2. **Set up database**: Replace in-memory store with PostgreSQL
3. **Configure analytics**: Set up dashboards for monitoring
4. **Customize variants**: Adjust A/B test variants and weights
5. **Add authentication**: Protect API endpoints

## Documentation

- Full documentation: `MONITORING.md`
- Example code: `lib/monitoring/examples.ts`
- Test script: `scripts/test-monitoring-api.js`
- Parser tests: `tests/parser/parser.test.ts`

## Support

For issues or questions:
1. Check `MONITORING.md` for detailed documentation
2. Review example code in `lib/monitoring/examples.ts`
3. Run the test script to verify setup
4. Check test results with `yarn test:parser`

## License

Same as the main project.
