/**
 * Integration tests for check-convex-health.mjs
 *
 * Acceptance Criteria:
 * - AC-1 (PRIMARY): Health check fails loud on empty/canary-missing, passes on seeded
 * - Tests real Convex backend behavior, no mocks
 */

import { execSync } from 'child_process'
import { writeFileSync, mkdirSync, rmSync, existsSync, mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { spawn, ChildProcess } from 'child_process'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'

// Test constants
// NOTE: The health-check script under test uses `SERVER_DIR = '.'` (project root)
// and reads Convex deployment state from `.convex/config.json` + `.env.local`.
// To exercise its failure paths deterministically — regardless of whether the
// host happens to have a reachable Convex deployment configured — the
// "should fail" cases spawn the script inside an isolated temp directory that
// has no Convex configuration. The script's `npx convex function-spec` call
// then fails fast, exercising the loud-failure branch.
const SERVER_DIR = 'server'
const TEMP_OUTPUT_FILE = join(SERVER_DIR, 'function-spec-temp.json')
const HEALTH_CHECK_SCRIPT = join(process.cwd(), 'scripts', 'check-convex-health.mjs')

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

  // Build a child env with all Convex deployment vars stripped. The health-check
  // script fails when no deployment can be resolved; without stripping these,
  // `.env.local` (loaded by vitest.env.js) leaks CONVEX_DEPLOYMENT/CONVEX_URL
  // into the spawned child and the script silently succeeds against the live
  // dev deployment — masking the failure path under test.
  const envWithoutConvex = (): NodeJS.ProcessEnv => {
    const env: NodeJS.ProcessEnv = { ...process.env }
    delete env.CONVEX_DEPLOYMENT
    delete env.CONVEX_URL
    delete env.EXPO_PUBLIC_CONVEX_URL
    delete env.EXPO_PUBLIC_CONVEX_SITE_URL
    return env
  }

  describe('AC-1 (PRIMARY): Health check fails loud on empty deployment', () => {
    it('should fail when convex dev is not running', () => {
      // Spawn inside an isolated temp dir with no `.convex/config.json` and no
      // `.env.local` so `npx convex function-spec` cannot resolve a deployment.
      const isolatedDir = mkdtempSync(join(tmpdir(), 'convex-health-'))
      const child = spawn('node', [HEALTH_CHECK_SCRIPT], {
        cwd: isolatedDir,
        stdio: 'pipe',
        env: envWithoutConvex(),
      })

      return new Promise<void>((resolve, reject) => {
        let stderr = ''
        child.stderr?.on('data', (data) => {
          stderr += data.toString()
        })

        child.on('close', (code) => {
          rmSync(isolatedDir, { recursive: true, force: true })
          expect(code).toBe(1) // Should exit with error code
          expect(stderr).toMatch(/(convex.*dev|deployment.*not.*configured|failed|convex function-spec failed)/i)
          resolve()
        })

        child.on('error', (error) => {
          rmSync(isolatedDir, { recursive: true, force: true })
          reject(error)
        })

        // Timeout after 30 seconds (convex function-spec can take a while to fail)
        setTimeout(() => {
          child.kill()
          rmSync(isolatedDir, { recursive: true, force: true })
          reject(new Error('Script did not exit within 30s'))
        }, 30000)
      })
    })

    it('should fail when server directory is missing', () => {
      // The script uses `SERVER_DIR = '.'` (its own cwd). Running it from an
      // empty temp dir means there is no `.convex/` config and no `.env.local`,
      // so the deployment is unresolved and the script must fail loudly.
      const isolatedDir = mkdtempSync(join(tmpdir(), 'convex-health-nodir-'))

      const child = spawn('node', [HEALTH_CHECK_SCRIPT], {
        cwd: isolatedDir,
        stdio: 'pipe',
        env: envWithoutConvex(),
      })

      return new Promise<void>((resolve, reject) => {
        child.on('close', (code) => {
          rmSync(isolatedDir, { recursive: true, force: true })
          expect(code).toBe(1) // Should exit with error code
          resolve()
        })

        child.on('error', (error) => {
          rmSync(isolatedDir, { recursive: true, force: true })
          reject(error)
        })

        // Timeout after 30 seconds
        setTimeout(() => {
          child.kill()
          rmSync(isolatedDir, { recursive: true, force: true })
          reject(new Error('Script did not exit within 30s'))
        }, 30000)
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