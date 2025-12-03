#!/usr/bin/env node

/**
 * API Testing Script
 * Demonstrates how to use the monitoring APIs
 * 
 * Usage: node scripts/test-monitoring-api.js
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000'

/**
 * Helper to make API requests
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  console.log(`\n📡 ${options.method || 'GET'} ${endpoint}`)

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Success:', JSON.stringify(data, null, 2))
    } else {
      console.log('❌ Error:', JSON.stringify(data, null, 2))
    }

    return { ok: response.ok, data }
  } catch (error) {
    console.error('❌ Request failed:', error.message)
    return { ok: false, error }
  }
}

/**
 * Test Metrics API
 */
async function testMetricsAPI() {
  console.log('\n' + '='.repeat(60))
  console.log('TESTING METRICS API')
  console.log('='.repeat(60))

  // Get 7-day metrics
  await apiRequest('/api/metrics?days=7')

  // Get 30-day metrics
  await apiRequest('/api/metrics?days=30')

  // Test invalid input
  await apiRequest('/api/metrics?days=500')
}

/**
 * Test Pricing API
 */
async function testPricingAPI() {
  console.log('\n' + '='.repeat(60))
  console.log('TESTING PRICING API')
  console.log('='.repeat(60))

  // Get pricing variant for user
  const { data: variantData } = await apiRequest('/api/pricing')
  const variantId = variantData?.variant?.id

  // Get all active variants
  await apiRequest('/api/pricing?action=variants')

  // Record exposure
  if (variantId) {
    await apiRequest('/api/pricing', {
      method: 'POST',
      body: JSON.stringify({
        action: 'exposure',
        variantId,
      }),
    })
  }

  // Record conversion
  if (variantId) {
    await apiRequest('/api/pricing', {
      method: 'POST',
      body: JSON.stringify({
        action: 'conversion',
        variantId,
        revenue: 300,
      }),
    })
  }

  // Get A/B test results
  await apiRequest('/api/pricing?action=results')
}

/**
 * Test Subscription API
 */
async function testSubscriptionAPI() {
  console.log('\n' + '='.repeat(60))
  console.log('TESTING SUBSCRIPTION API')
  console.log('='.repeat(60))

  // Get all tiers
  await apiRequest('/api/subscription')

  // Get specific tier
  await apiRequest('/api/subscription?id=pro-monthly')

  // Subscribe
  await apiRequest('/api/subscription', {
    method: 'POST',
    body: JSON.stringify({
      action: 'subscribe',
      tierId: 'pro-monthly',
      userId: 'test-user-123',
      fromPaidAnalysis: true,
    }),
  })

  // Upgrade
  await apiRequest('/api/subscription', {
    method: 'POST',
    body: JSON.stringify({
      action: 'upgrade',
      tierId: 'pro-yearly',
      userId: 'test-user-123',
    }),
  })

  // Cancel
  await apiRequest('/api/subscription', {
    method: 'POST',
    body: JSON.stringify({
      action: 'cancel',
      userId: 'test-user-123',
    }),
  })
}

/**
 * Generate sample data for testing
 */
async function generateSampleData() {
  console.log('\n' + '='.repeat(60))
  console.log('GENERATING SAMPLE DATA')
  console.log('='.repeat(60))

  // In a real implementation, you would call your internal functions here
  // For this demo, we'll simulate by making API calls
  
  console.log('\n📊 Simulating user activity...')
  
  // Simulate multiple pricing exposures and some conversions
  for (let i = 0; i < 10; i++) {
    const { data } = await apiRequest('/api/pricing')
    const variantId = data?.variant?.id
    
    // 30% conversion rate simulation
    if (variantId && Math.random() < 0.3) {
      await apiRequest('/api/pricing', {
        method: 'POST',
        body: JSON.stringify({
          action: 'conversion',
          variantId,
          revenue: data.variant.price,
        }),
      })
    }
  }

  console.log('\n✅ Sample data generated')
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n🚀 Starting API Tests...\n')

  // Check if server is running
  try {
    const response = await fetch(API_BASE)
    if (!response.ok && response.status !== 404) {
      throw new Error('Server not responding')
    }
  } catch (error) {
    console.error('\n❌ Cannot connect to server at', API_BASE)
    console.error('Please ensure the Next.js development server is running:')
    console.error('  yarn dev')
    process.exit(1)
  }

  // Generate some sample data first
  await generateSampleData()

  // Run tests
  await testMetricsAPI()
  await testPricingAPI()
  await testSubscriptionAPI()

  console.log('\n' + '='.repeat(60))
  console.log('✅ ALL TESTS COMPLETED')
  console.log('='.repeat(60))
  console.log('\nTo view metrics in your application:')
  console.log('  1. Open http://localhost:3000/api/metrics?days=7')
  console.log('  2. Open http://localhost:3000/api/pricing?action=results')
  console.log('  3. Open http://localhost:3000/api/subscription')
  console.log('')
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error('\n❌ Test suite failed:', error)
    process.exit(1)
  })
}

module.exports = {
  apiRequest,
  testMetricsAPI,
  testPricingAPI,
  testSubscriptionAPI,
  generateSampleData,
  runAllTests,
}
