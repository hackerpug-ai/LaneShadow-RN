#!/usr/bin/env tsx
/**
 * check-parse.ts - Verify all color strings are parseColorString-compatible
 *
 * UC-TOK-02 AC-3: parseColorString round-trips all values
 *
 * Accepts: #RGB, #RRGGBB, #RRGGBBAA, rgb(...), rgba(...), "transparent", "clear"
 *
 * Usage: node tokens/scripts/check-parse.ts tokens/semantic/colors.tokens.json
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

interface ColorSet {
  light: string
  dark: string
  [key: string]: string | undefined
}

type ColorValue = string | ColorSet

// Patterns from native-theme parseColorString implementation
const HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/
const RGBA_PATTERN =
  /^rgba?\(\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?\s*(?:,\s*\d+(\.\d+)?\s*)?\)$/
const TRANSPARENT_PATTERN = /^(transparent|clear)$/

function isParseableColorString(str: string): boolean {
  return HEX_PATTERN.test(str) || RGBA_PATTERN.test(str) || TRANSPARENT_PATTERN.test(str)
}

function isColorSet(value: unknown): value is ColorSet {
  return (
    typeof value === 'object' &&
    value !== null &&
    'light' in value &&
    'dark' in value &&
    typeof (value as ColorSet).light === 'string' &&
    typeof (value as ColorSet).dark === 'string'
  )
}

function walkColorStrings(
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
      walkColorStrings(obj[i], [...path, `[${i}]`], errors, checkCount)
    }
    return
  }

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = [...path, key]

    if (key === '$comment' || key === '$schema') {
      // Skip metadata
      continue
    }

    if (isColorSet(value)) {
      // Check light value
      checkCount.value++
      if (!isParseableColorString(value.light)) {
        errors.push(
          `${currentPath.join('.')}.light: "${value.light}" is not a valid parseColorString format`,
        )
      }

      // Check dark value
      checkCount.value++
      if (!isParseableColorString(value.dark)) {
        errors.push(
          `${currentPath.join('.')}.dark: "${value.dark}" is not a valid parseColorString format`,
        )
      }
    } else {
      walkColorStrings(value, currentPath, errors, checkCount)
    }
  }
}

function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.error('Usage: check-parse.ts <colors.tokens.json>')
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

  walkColorStrings(data, [], errors, checkCount)

  console.log(`Checked ${checkCount.value} color string(s)`)

  if (errors.length > 0) {
    console.error('\n❌ Color string validation failed:\n')
    for (const error of errors) {
      console.error(`  - ${error}`)
    }
    console.error(`\n${errors.length} error(s) found`)
    console.error('\nAccepted formats:')
    console.error('  - Hex: #RGB, #RRGGBB, #RRGGBBAA')
    console.error('  - RGB/RGBA: rgb(r,g,b), rgba(r,g,b,a)')
    console.error('  - Keywords: transparent, clear')
    process.exit(1)
  }

  console.log('✅ All color strings are parseColorString-compatible')
  process.exit(0)
}

main()
