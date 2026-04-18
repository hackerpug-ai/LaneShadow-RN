#!/usr/bin/env node

// Copy tokens/semantic/semantic.tokens.json into every platform's bundle path.
//
// Why: each native platform needs the JSON inside its package (Swift Package
// resources + Android assets). Canonical source stays at tokens/semantic/, and
// this script mirrors it. Lefthook enforces freshness pre-commit.

const fs = require('node:fs')
const path = require('node:path')

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const SOURCE = path.join(REPO_ROOT, 'tokens', 'semantic', 'semantic.tokens.json')

const TARGETS = [
  path.join(
    REPO_ROOT,
    'tokens',
    'platforms',
    'swift',
    'Sources',
    'LaneShadowTheme',
    'Resources',
    'semantic.tokens.json',
  ),
  path.join(
    REPO_ROOT,
    'tokens',
    'platforms',
    'kotlin',
    'src',
    'main',
    'assets',
    'semantic.tokens.json',
  ),
  path.join(
    REPO_ROOT,
    'tokens',
    'platforms',
    'kotlin',
    'src',
    'test',
    'resources',
    'semantic.tokens.json',
  ),
]

const args = process.argv.slice(2)
const checkOnly = args.includes('--check')

function main() {
  const source = fs.readFileSync(SOURCE, 'utf8')
  let drift = false
  for (const target of TARGETS) {
    const existing = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null
    if (existing === source) continue
    if (checkOnly) {
      drift = true
      process.stderr.write(`Out of sync: ${path.relative(REPO_ROOT, target)}\n`)
      continue
    }
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, source, 'utf8')
    process.stdout.write(`Wrote ${path.relative(REPO_ROOT, target)}\n`)
  }
  if (drift) {
    process.stderr.write(
      '\nBundled JSON copies are stale. Run:\n  pnpm tokens:sync && git add tokens/platforms\n',
    )
    process.exit(1)
  }
}

main()
