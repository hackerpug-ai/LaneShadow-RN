#!/usr/bin/env tsx
/**
 * check-colorset.ts - Verify every ColorSet has both light and dark values
 *
 * UC-TOK-02 AC-2: Every ColorSet has light + dark parseable color strings
 *
 * Usage: node tokens/scripts/check-colorset.ts tokens/semantic/colors.tokens.json
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

interface ColorSet {
  light: string
  dark: string
  [key: string]: string | undefined
}

// Check if value looks like it should be a ColorSet (has light or dark key)
function isPotentialColorSet(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>
  const hasLight = 'light' in obj && typeof obj.light === 'string'
  const hasDark = 'dark' in obj && typeof obj.dark === 'string'

  // Consider it a potential ColorSet if it has at least one of the keys
  return hasLight || hasDark
}

function walkColorSets(
  obj: unknown,
  path: string[],
  errors: string[],
  checkCount: { value: number },
): void {
  if (typeof obj !== 'object' || obj === null) {
    return
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      walkColorSets(obj[i], [...path, `[${i}]`], errors, checkCount)
    }
    return
  }

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = [...path, key]

    if (key === '$comment' || key === '$schema') {
      // Skip metadata
      continue
    }

    if (isPotentialColorSet(value)) {
      checkCount.value++

      const colorSet = value as Record<string, string>

      if (!colorSet.light || typeof colorSet.light !== 'string') {
        errors.push(`${currentPath.join('.')}: missing or invalid 'light' key`)
      }

      if (!colorSet.dark || typeof colorSet.dark !== 'string') {
        errors.push(`${currentPath.join('.')}: missing or invalid 'dark' key`)
      }
    } else {
      walkColorSets(value, currentPath, errors, checkCount)
    }
  }
}

function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.error('Usage: check-colorset.ts <colors.tokens.json>')
    process.exit(1)
  }

  const filePath = resolve(args[0]!)
  let content: string
  try {
    content = readFileSync(filePath, 'utf-8')
  } catch (err) {
    console.error(`Failed to read ${filePath}: ${err}`)
    process.exit(1)
  }

  let data: unknown
  try {
    data = JSON.parse(content)
  } catch (err) {
    console.error(`Failed to parse JSON: ${err}`)
    process.exit(1)
  }

  const errors: string[] = []
  const checkCount = { value: 0 }

  walkColorSets(data, [], errors, checkCount)

  console.log(`Checked ${checkCount.value} ColorSet(s)`)

  if (errors.length > 0) {
    console.error('\n❌ ColorSet validation failed:\n')
    for (const error of errors) {
      console.error(`  - ${error}`)
    }
    console.error(`\n${errors.length} error(s) found`)
    process.exit(1)
  }

  console.log('✅ All ColorSets have both light and dark values')
  process.exit(0)
}

main()
