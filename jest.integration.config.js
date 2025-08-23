const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest for integration tests
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/app/**/layout.tsx',
    '!src/app/**/loading.tsx',
    '!src/app/**/not-found.tsx',
    '!src/app/**/error.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/integration/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.integration.{test,spec}.{js,jsx,ts,tsx}',
  ],
  // Longer timeout for integration tests
  testTimeout: 30000,
  // Run integration tests serially to avoid conflicts
  maxWorkers: 1,
  // Setup and teardown for integration tests
  globalSetup: '<rootDir>/jest.integration.setup.js',
  globalTeardown: '<rootDir>/jest.integration.teardown.js',
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)