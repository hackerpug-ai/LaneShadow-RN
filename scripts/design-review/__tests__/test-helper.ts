/**
 * test-helper.ts
 *
 * Test utilities for design-report tests
 */

import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { EvalResult, Manifest, VisualIssue } from '../merge-report'

export interface TestFixture {
  tempDir: string
  manifestPath: string
  evalsDir: string
  reportJsonPath: string
  reportHtmlPath: string
  codeMapPath: string
}

/**
 * Create a temporary test fixture directory
 */
export function createTestFixture(): TestFixture {
  const tempDir = join(tmpdir(), `design-review-test-${Date.now()}`)
  const manifestPath = join(tempDir, 'manifest.json')
  const evalsDir = join(tempDir, 'evals')
  const reportJsonPath = join(tempDir, 'report.json')
  const reportHtmlPath = join(tempDir, 'report.html')
  const codeMapPath = join(tempDir, 'component-code-map.json')

  mkdirSync(evalsDir, { recursive: true })

  return {
    tempDir,
    manifestPath,
    evalsDir,
    reportJsonPath,
    reportHtmlPath,
    codeMapPath,
  }
}

/**
 * Clean up test fixture directory
 */
export function cleanupTestFixture(fixture: TestFixture): void {
  try {
    rmSync(fixture.tempDir, { recursive: true, force: true })
  } catch (error) {
    console.warn(`Failed to cleanup test fixture: ${error}`)
  }
}

/**
 * Create a minimal manifest for testing
 */
export function createTestManifest(overrides?: Partial<Manifest>): Manifest {
  return {
    entries: [
      {
        id: 'test-screen-1',
        screen: 'auth-screen',
        state: 'email-entry',
        theme: 'light',
        captured: '/captures/auth-screen.email-entry.light.png',
        captured_metadata: '/captures/auth-screen.email-entry.light.metadata.json',
        reference: '/refs/auth-screen/email-entry.light.png',
        annotations: '/refs/auth-screen/email-entry.light.annotations.json',
      },
      {
        id: 'test-screen-2',
        screen: 'auth-screen',
        state: 'password-entry',
        theme: 'light',
        captured: '/captures/auth-screen.password-entry.light.png',
        captured_metadata: '/captures/auth-screen.password-entry.light.metadata.json',
        reference: '/refs/auth-screen/password-entry.light.png',
        annotations: '/refs/auth-screen/password-entry.light.annotations.json',
      },
    ],
    generated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create test visual issues
 */
export function createTestIssues(overrides?: Partial<VisualIssue>[]): VisualIssue[] {
  const defaults: VisualIssue[] = [
    {
      component: '.mol-form-field',
      passed: false,
      issue_type: 'spacing',
      observed: { padding: '16px' },
      expected: { padding: '12px (expected: var(--space-3))' },
      severity: 'med',
      confidence: 0.85,
      fix_hint: 'Replace hardcoded padding with --space-3 token',
    },
    {
      component: '.mol-brand-badge',
      passed: false,
      issue_type: 'color',
      observed: { color: '#000000' },
      expected: { color: '#4A5568 (expected: var(--color-gray-700))' },
      severity: 'high',
      confidence: 0.92,
      fix_hint: 'Use --color-gray-700 token for brand badge text',
    },
    {
      component: '.atom-phase-dot',
      passed: false,
      issue_type: 'typography',
      observed: { 'font-size': '14px' },
      expected: { 'font-size': '12px (expected: var(--font-size-xs))' },
      severity: 'low',
      confidence: 0.75,
      fix_hint: 'Use --font-size-xs for phase dot',
    },
  ]

  if (overrides) {
    return overrides.map((override, index) => ({
      ...defaults[index % defaults.length],
      ...override,
    }))
  }

  return defaults
}

/**
 * Write manifest to test fixture
 */
export function writeManifest(fixture: TestFixture, manifest: Manifest): void {
  writeFileSync(fixture.manifestPath, JSON.stringify(manifest, null, 2))
}

/**
 * Write eval result to test fixture
 */
export function writeEvalResult(fixture: TestFixture, result: EvalResult): void {
  const filePath = join(fixture.evalsDir, `${result.entry_id}.json`)
  writeFileSync(filePath, JSON.stringify(result, null, 2))
}

/**
 * Write component code map to test fixture
 */
export function writeCodeMap(fixture: TestFixture, codeMap: Record<string, string>): void {
  writeFileSync(fixture.codeMapPath, JSON.stringify(codeMap, null, 2))
}

/**
 * Write annotation file to test fixture
 */
export function writeAnnotationFile(
  fixture: TestFixture,
  screen: string,
  state: string,
  theme: string,
  annotations: { bounding_box?: { x: number; y: number; width: number; height: number } },
): void {
  const annotationsPath = join(
    fixture.tempDir,
    'refs',
    screen,
    `${state}.${theme}.annotations.json`,
  )
  mkdirSync(join(fixture.tempDir, 'refs', screen), { recursive: true })
  writeFileSync(annotationsPath, JSON.stringify(annotations, null, 2))
}
