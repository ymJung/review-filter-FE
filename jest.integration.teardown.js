/**
 * Global teardown for integration tests
 * This runs once after all integration tests complete
 */

module.exports = async () => {
  console.log('🧹 Cleaning up integration test environment...')
  
  try {
    // Clean up any test data
    console.log('🗑️  Cleaning up test data...')
    
    // Stop Firebase emulators if we started them
    // In a real setup, you might stop emulators here:
    // execSync('firebase emulators:stop', { stdio: 'inherit' })
    
    // Clean up environment variables
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST
    delete process.env.FIRESTORE_EMULATOR_HOST
    delete process.env.FIREBASE_STORAGE_EMULATOR_HOST
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    
    console.log('✅ Integration test cleanup complete')
  } catch (error) {
    console.error('❌ Failed to cleanup integration test environment:', error)
    // Don't throw here as it might mask test failures
  }
}