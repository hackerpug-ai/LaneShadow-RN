// Mock environment variables for testing
process.env.WORKOS_API_KEY = 'test_workos_key'
process.env.WORKOS_CLIENT_ID = 'test_client_id'

// Global test utilities
global.console = {
  ...console,
  error: jest.fn(), // Suppress error logs in tests
  warn: jest.fn(),
}
