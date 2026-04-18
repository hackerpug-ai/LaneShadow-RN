#!/usr/bin/env node

const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const PLATFORMS_DIR = path.join(REPO_ROOT, 'tokens', 'platforms')
const TARGETS = [
  'typescript/src/generated/tokens.ts',
  'swift/Sources/LaneShadowTheme/Generated/Tokens.swift',
  'kotlin/src/main/kotlin/com/laneshadow/theme/generated/Tokens.kt',
]

function snapshot() {
  const snap = {}
  for (const rel of TARGETS) {
    const abs = path.join(PLATFORMS_DIR, rel)
    snap[rel] = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null
  }
  return snap
}

function main() {
  const before = snapshot()

  const result = spawnSync('node', ['tokens/scripts/build.js'], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  })
  if (result.status !== 0) {
    process.stderr.write('Drift check failed: build:tokens did not exit cleanly.\n')
    process.exit(result.status || 1)
  }

  const after = snapshot()

  let drifted = false
  for (const rel of TARGETS) {
    if (before[rel] !== after[rel]) {
      drifted = true
      process.stderr.write(`Drift detected in tokens/platforms/${rel}\n`)
    }
  }
  if (drifted) {
    process.stderr.write(
      '\nGenerated files are out of date. Run:\n  pnpm build:tokens && git add tokens/platforms\n',
    )
    process.exit(1)
  }
  process.stdout.write('Token outputs are in sync with semantic.tokens.json.\n')
}

main()
