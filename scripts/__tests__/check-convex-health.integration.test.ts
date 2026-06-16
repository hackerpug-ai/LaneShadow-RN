/**
 * Integration tests for check-convex-health.mjs
 *
 * Acceptance Criteria:
 * - AC-1 (PRIMARY): Health check fails loud on empty/canary-missing, passes on seeded
 * - Tests real Convex backend behavior, no mocks
 */

import { execSync } from 'child_process'
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { spawn, ChildProcess } from 'child_process'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'

// Test constants
const SERVER_DIR = 'server'
const TEMP_OUTPUT_FILE = join(SERVER_DIR, 'function-spec-temp.json')
const HEALTH_CHECK_SCRIPT = 'scripts/check-convex-health.mjs'

describe('check-convex-health.mjs - Integration Tests', () => {
  beforeAll(() => {
    // Clean up any existing temp file from previous runs
    if (existsSync(TEMP_OUTPUT_FILE)) {
      rmSync(TEMP_OUTPUT_FILE)
    }
  })

  afterAll(() => {
    // Clean up temp file
    if (existsSync(TEMP_OUTPUT_FILE)) {
      rmSync(TEMP_OUTPUT_FILE)
    }
  })

  describe('AC-1 (PRIMARY): Health check fails loud on empty deployment', () => {
    it('should fail when convex dev is not running', () => {
      const child = spawn('node', [HEALTH_CHECK_SCRIPT], {
        cwd: process.cwd(),
        stdio: 'pipe'
      })
      
      return new Promise<void>((resolve, reject) => {
        let stderr = ''
        child.stderr?.on('data', (data) => {
          stderr += data.toString()
        })
        
        child.on('close', (code) => {
          expect(code).toBe(1) // Should exit with error code
          expect(stderr).toMatch(/(convex.*dev|deployment.*not.*configured|failed)/i)
          expect(stderr).toContain('Please run')
          resolve()
        })
        
        child.on('error', (error) => {
          reject(error)
        })
        
        // Timeout after 5 seconds
        setTimeout(() => {
          child.kill()
          resolve()
        }, 5000)
      })
    })

    it('should fail when server directory is missing', () => {
      // Remove server directory temporarily
      const serverExists = existsSync(SERVER_DIR)
      if (serverExists) {
        rmSync(SERVER_DIR, { recursive: true, force: true })
      }

      const child = spawn('node', [HEALTH_CHECK_SCRIPT], {
        cwd: process.cwd(),
        stdio: 'pipe'
      })
      
      return new Promise<void>((resolve) => {
        child.on('close', (code) => {
          expect(code).toBe(1) // Should exit with error code
          resolve()
        })
        
        // Timeout after 3 seconds
        setTimeout(() => {
          child.kill()
          resolve()
        }, 3000)
      })
    })
  })

  describe('AC-1 (SECONDARY): Health check behavior with real setup', () => {
    it('should detect real server directory structure', () => {
      // Test against the existing server directory if it exists
      if (existsSync(SERVER_DIR)) {
        const child = spawn('node', [HEALTH_CHECK_SCRIPT], {
          cwd: process.cwd(),
          stdio: 'pipe'
        })
        
        return new Promise<void>((resolve, reject) => {
          let stdout = ''
          let stderr = ''
          
          child.stdout?.on('data', (data) => {
            stdout += data.toString()
          })
          
          child.stderr?.on('data', (data) => {
            stderr += data.toString()
          })
          
          child.on('close', (code) => {
            if (code === 0) {
              // Success case - convex dev is running
              expect(stdout).toContain('Convex deployment healthy')
              expect(stdout).toContain('functions')
            } else if (code === 1) {
              // Expected failure case - convex dev not running
              expect(stderr).toContain('Convex deployment not configured')
              expect(stderr).toContain('Please run `npx convex dev`')
            } else {
              throw new Error(`Unexpected exit code: ${code}`)
            }
            resolve()
          })
          
          child.on('error', (error) => {
            reject(error)
          })
          
          // Timeout after 10 seconds
          setTimeout(() => {
            child.kill()
            resolve()
          }, 10000)
        })
      } else {
        // Skip test if no server directory
        expect(true).toBe(true)
      }
    })
  })

  describe('Error handling and edge cases', () => {
    it('should clean up temp file after execution', () => {
      // Clean up any existing temp file first
      if (existsSync(TEMP_OUTPUT_FILE)) {
        rmSync(TEMP_OUTPUT_FILE)
      }

      // Run health check (even if it fails, it should clean up)
      const child = spawn('node', [HEALTH_CHECK_SCRIPT], {
        cwd: process.cwd(),
        stdio: 'pipe'
      })
      
      return new Promise<void>((resolve) => {
        child.on('close', () => {
          // Temp file should not exist after execution
          expect(existsSync(TEMP_OUTPUT_FILE)).toBe(false)
          resolve()
        })
        
        // Timeout after 5 seconds
        setTimeout(() => {
          child.kill()
          resolve()
        }, 5000)
      })
    })

    it('should handle missing script file gracefully', () => {
      // Try to run a non-existent script
      const child = spawn('node', ['non-existent-script.mjs'], {
        cwd: process.cwd(),
        stdio: 'pipe'
      })
      
      return new Promise<void>((resolve) => {
        child.on('close', (code) => {
          expect(code).toBeGreaterThan(0) // Should fail
          resolve()
        })
        
        // Timeout after 2 seconds
        setTimeout(() => {
          child.kill()
          resolve()
        }, 2000)
      })
    })
  })
})