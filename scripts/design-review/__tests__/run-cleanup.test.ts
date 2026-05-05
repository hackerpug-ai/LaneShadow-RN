#!/usr/bin/env -S pnpm tsx

import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

async function main() {
  console.log('Testing stale design-review cleanup helper...')

  const module = await import('../run.ts')
  if (typeof module.clearDesignReviewOutputs !== 'function') {
    console.error('❌ clearDesignReviewOutputs function not exported')
    process.exit(1)
  }

  const rootDir = mkdtempSync(join(tmpdir(), 'design-review-cleanup-'))
  const designReviewDir = join(rootDir, '.design-review')
  mkdirSync(join(designReviewDir, 'captures'), { recursive: true })
  mkdirSync(join(designReviewDir, 'evals', 'visual'), { recursive: true })

  const staleFiles = [
    join(designReviewDir, 'captures', 'test-screen.entry.light.png'),
    join(designReviewDir, 'manifest.json'),
    join(designReviewDir, 'report.json'),
    join(designReviewDir, 'report.html'),
  ]

  for (const file of staleFiles) {
    writeFileSync(file, 'stale')
  }

  await module.clearDesignReviewOutputs(rootDir)

  const survivors = staleFiles.filter((file) => existsSync(file))
  if (survivors.length > 0) {
    console.error('❌ Expected stale design-review outputs to be removed')
    console.error('Still present:', survivors)
    process.exit(1)
  }

  console.log('✅ clearDesignReviewOutputs removes stale captures and reports')
}

main().catch((error) => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})
