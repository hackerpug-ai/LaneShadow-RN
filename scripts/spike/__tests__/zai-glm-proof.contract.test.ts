import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const CLI_PATH = resolve(__dirname, '../zai-glm-proof.ts')
const WORKTREE_ROOT = resolve(__dirname, '../../../')

/**
 * Focused contract tests for the z.ai GLM-5.2 proof CLI (scripts/spike/zai-glm-proof.ts).
 *
 * These tests verify the CLI's argument/env/error CONTRACT without mocking the
 * real provider path inside the CLI itself. The CLI imports createZaiProvider /
 * zaiStructuredComplete directly; these tests only exercise the shell around that
 * import (missing key -> exit 1, valid setup -> provider path is reached).
 *
 * Strategy:
 *   - Run the CLI as a subprocess with `npx tsx` so the real module graph loads.
 *   - For the "missing key" test: pass Z_AI_API_KEY as empty string in the
 *     subprocess env. The CLI's loadDotEnvLocal respects existing process.env
 *     values (won't overwrite), so the env loader returns undefined for the key.
 *     All other required env vars are inherited from process.env so env.ts
 *     doesn't crash on unrelated missing vars.
 *   - For the "real API" test: skip if Z_AI_API_KEY is absent (same pattern as
 *     the integration test -- never mock the provider).
 */

const Z_AI_API_KEY_FROM_ENV =
  process.env.Z_AI_API_KEY ??
  (() => {
    const envPath = resolve(WORKTREE_ROOT, '.env.local')
    if (!existsSync(envPath)) return undefined
    const m = /^Z_AI_API_KEY=(.+)$/m.exec(readFileSync(envPath, 'utf8'))
    return m?.[1]?.trim().replace(/^["']|["']$/g, '')
  })()

describe('zai-glm-proof CLI contract', () => {
  describe('error contract: missing Z_AI_API_KEY', () => {
    it('exits with code 1 and a clear error when Z_AI_API_KEY is absent', () => {
      // Pass Z_AI_API_KEY as empty string so the CLI's loadDotEnvLocal doesn't
      // overwrite it (it only sets keys not already in process.env). All other
      // env vars are inherited so env.ts doesn't crash on unrelated required vars.
      const result = spawnSync('npx', ['tsx', CLI_PATH], {
        cwd: WORKTREE_ROOT,
        env: {
          ...process.env,
          Z_AI_API_KEY: '',
        },
        encoding: 'utf8',
        timeout: 30_000,
      })

      expect(result.status).toBe(1)
      expect(result.stderr).toContain('Z_AI_API_KEY')
    })
  })

  describe('real provider path (skipped without key)', () => {
    if (!Z_AI_API_KEY_FROM_ENV) {
      it.skip('SKIP: Z_AI_API_KEY is absent -- real provider test requires live z.ai API', () => {})
      return
    }

    it('exits 0 and prints a non-empty structured result with path', () => {
      const result = spawnSync('npx', ['tsx', CLI_PATH], {
        cwd: WORKTREE_ROOT,
        env: { ...process.env },
        encoding: 'utf8',
        timeout: 120_000,
      })

      expect(result.status).toBe(0)

      // Extract the full JSON object from stdout (pretty-printed with null, 2)
      const jsonStart = result.stdout.indexOf('{')
      const jsonEnd = result.stdout.lastIndexOf('}')
      expect(jsonStart).toBeGreaterThanOrEqual(0)
      expect(jsonEnd).toBeGreaterThan(jsonStart)

      const jsonStr = result.stdout.slice(jsonStart, jsonEnd + 1)
      const parsed = JSON.parse(jsonStr)
      expect(parsed.ok).toBe(true)
      expect(['structured', 'text-fallback']).toContain(parsed.path)
      expect(parsed.summary.length).toBeGreaterThanOrEqual(1)
      expect(['high', 'medium', 'low']).toContain(parsed.confidence)
    }, 120_000)
  })
})
