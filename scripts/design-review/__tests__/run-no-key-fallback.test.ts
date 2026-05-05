#!/usr/bin/env -S pnpm tsx

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

async function main() {
  console.log('Testing no-key design-review fallback...')

  const module = await import('../run.ts')
  if (typeof module.writeAutomationFallbackEvals !== 'function') {
    console.error('❌ writeAutomationFallbackEvals helper not exported')
    process.exit(1)
  }

  const rootDir = mkdtempSync(join(tmpdir(), 'design-review-no-key-'))
  const manifestPath = join(rootDir, 'manifest.json')
  const evalsDir = join(rootDir, 'evals')

  const manifest = {
    entries: [
      {
        id: 'idle-screen.default.light',
        screen: 'idle-screen',
        state: 'default',
        theme: 'light',
      },
    ],
    generated_at: new Date().toISOString(),
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

  try {
    await module.writeAutomationFallbackEvals({
      manifestPath,
      outputDir: evalsDir,
      reason: 'ANTHROPIC_API_KEY environment variable is required',
    })

    const evalPath = join(evalsDir, 'idle-screen.default.light.json')
    if (!existsSync(evalPath)) {
      console.error('❌ Expected fallback eval output to be written')
      process.exit(1)
    }

    const evalResult = JSON.parse(readFileSync(evalPath, 'utf-8'))
    const firstIssue = evalResult.issues?.[0]

    if (evalResult.screen !== 'idle-screen') {
      console.error('❌ Expected fallback eval to preserve manifest screen')
      process.exit(1)
    }

    if (firstIssue?.severity !== 'med' || firstIssue?.issue_type !== 'missing') {
      console.error('❌ Expected fallback eval to emit a medium-severity missing issue')
      process.exit(1)
    }

    console.log('✅ Fallback eval output is scoped and reportable')
  } finally {
    rmSync(rootDir, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})
