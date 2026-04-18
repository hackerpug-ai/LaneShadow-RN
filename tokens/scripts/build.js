#!/usr/bin/env node

const path = require('node:path')
const fs = require('node:fs')

const TOKENS_DIR = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(TOKENS_DIR, '..')

async function main() {
  // SD v4 is pure ESM; load via dynamic import from this CJS script.
  const StyleDictionaryMod = await import('style-dictionary')
  const StyleDictionary = StyleDictionaryMod.default || StyleDictionaryMod
  const { formatTypeScript } = require('../config/formats/typescript-tokens.js')
  const { formatSwift } = require('../config/formats/swift-tokens.js')
  const { formatKotlin } = require('../config/formats/kotlin-tokens.js')
  const config = require('../config/style-dictionary.config.js')

  const sd = new StyleDictionary(config)

  // Custom formats — they receive `dictionary.tokens` (the nested DTCG tree)
  // and emit platform-specific source files.
  sd.registerFormat({
    name: 'laneshadow/typescript',
    format: ({ dictionary }) => formatTypeScript({ tokens: dictionary.tokens }),
  })
  sd.registerFormat({
    name: 'laneshadow/swift',
    format: ({ dictionary }) => formatSwift({ tokens: dictionary.tokens }),
  })
  sd.registerFormat({
    name: 'laneshadow/kotlin',
    format: ({ dictionary }) => formatKotlin({ tokens: dictionary.tokens }),
  })

  // SD v4 has an async init step.
  if (sd.hasInitialized) await sd.hasInitialized
  await sd.cleanAllPlatforms()
  await sd.buildAllPlatforms()

  const outputs = [
    path.join(TOKENS_DIR, 'platforms/typescript/src/generated/tokens.ts'),
    path.join(TOKENS_DIR, 'platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift'),
    path.join(
      TOKENS_DIR,
      'platforms/kotlin/src/main/kotlin/com/laneshadow/theme/generated/Tokens.kt',
    ),
  ]
  for (const out of outputs) {
    if (!fs.existsSync(out)) {
      process.stderr.write(`Missing expected output: ${out}\n`)
      process.exit(1)
    }
    process.stdout.write(`Wrote ${path.relative(REPO_ROOT, out)}\n`)
  }
}

main().catch((err) => {
  process.stderr.write(err?.stack || String(err))
  process.stderr.write('\n')
  process.exit(1)
})
