/**
 * Global setup for E2E tests
 * This runs once before all E2E tests
 */

import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...')
  
  // Start the development server if not already running
  // This is handled by the webServer config in playwright.config.ts
  
  // Set up any global test data or configurations
  console.log('📦 E2E test environment ready')
}

export default globalSetup