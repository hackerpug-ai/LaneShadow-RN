import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'

const loadFirstEnvFile = (): void => {
  const rootDir = path.resolve(__dirname)
  const candidates: Array<string> = ['.env.test.local', '.env.test', '.env.local', '.env'].map(
    (p) => path.join(rootDir, p)
  )

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate, override: false })
      return
    }
  }
}

loadFirstEnvFile()

// Global test utilities
global.console = {
  ...console,
  error: jest.fn(), // Suppress error logs in tests
  warn: jest.fn(),
}
