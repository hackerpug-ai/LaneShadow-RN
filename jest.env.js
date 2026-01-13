/**
 * Jest environment setup - runs before tests
 * Sets NODE_ENV=test to disable LangSmith tracing during tests
 */
process.env.NODE_ENV = 'test'
