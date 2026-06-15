#!/usr/bin/env -S pnpm tsx

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildManifest } from '../build-manifest.ts'

async function main() {
  console.log('Testing buildManifest screen filtering...')

  const fixtureRoot = mkdtempSync(join(tmpdir(), 'design-review-manifest-filter-'))
  const capturesDir = join(fixtureRoot, 'captures')
  const refsDir = join(fixtureRoot, 'refs')
  const outputPath = join(fixtureRoot, 'manifest.json')

  mkdirSync(capturesDir, { recursive: true })
  mkdirSync(join(refsDir, 'idle-screen'), { recursive: true })
  mkdirSync(join(refsDir, 'test-screen'), { recursive: true })

  const writeCapture = (screen: string, state: string, theme: string) => {
    writeFileSync(join(capturesDir, `${screen}.${state}.${theme}.png`), 'png')
    writeFileSync(
      join(capturesDir, `${screen}.${state}.${theme}.json`),
      JSON.stringify({ screen, state, theme }),
    )
    writeFileSync(join(refsDir, screen, `${state}.${theme}.png`), 'png')
    writeFileSync(
      join(refsDir, screen, `${state}.annotations.json`),
      JSON.stringify({ screen, state, theme, components: [] }),
    )
  }

  writeCapture('idle-screen', 'default', 'light')
  writeCapture('test-screen', 'entry', 'light')

  process.env.DESIGN_REVIEW_SCREENS = 'idle-screen'

  try {
    const manifest = await buildManifest({ capturesDir, refsDir, outputPath })
    const screens = manifest.entries.map((entry) => entry.screen)

    if (screens.length !== 1 || screens[0] !== 'idle-screen') {
      console.error('❌ Expected manifest to include only idle-screen entries')
      console.error('Actual screens:', screens)
      process.exit(1)
    }

    console.log('✅ buildManifest filters captures by DESIGN_REVIEW_SCREENS')
  } finally {
    delete process.env.DESIGN_REVIEW_SCREENS
    rmSync(fixtureRoot, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})
