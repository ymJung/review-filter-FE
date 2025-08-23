/**
 * Global teardown for E2E tests
 * This runs once after all E2E tests complete
 */

async function globalTeardown() {
  console.log('🧹 Cleaning up E2E test environment...')
  
  // Clean up any global test data
  // Stop any services if needed
  
  console.log('✅ E2E test cleanup complete')
}

export default globalTeardown