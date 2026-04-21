#!/usr/bin/env tsx
/**
 * check-contrast.ts - WCAG AA contrast verification for surface/content pairs
 *
 * UC-TOK-02 AC-4: WCAG AA contrast on surface/content pairs
 * - Body text (normal): ≥ 4.5:1
 * - Large text (18px+ or 14px+ bold): ≥ 3:1
 *
 * Usage: node tokens/scripts/check-contrast.ts tokens/semantic/colors.tokens.json
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

interface ColorSet {
  light: string
  dark: string
  [key: string]: string | undefined
}

interface ColorsData {
  color: {
    surface: Record<string, ColorSet>
    content: Record<string, ColorSet>
  }
}

interface ContrastPair {
  foreground: string
  background: string
  mode: 'light' | 'dark'
  ratio: number
  passes: boolean
  category: 'body' | 'large'
}

// Parse hex color to RGB
function parseHex(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '')

  if (cleanHex.length === 3) {
    return {
      r: Number.parseInt(cleanHex[0]! + cleanHex[0]!, 16),
      g: Number.parseInt(cleanHex[1]! + cleanHex[1]!, 16),
      b: Number.parseInt(cleanHex[2]! + cleanHex[2]!, 16),
    }
  }

  if (cleanHex.length === 6) {
    return {
      r: Number.parseInt(cleanHex.slice(0, 2), 16),
      g: Number.parseInt(cleanHex.slice(2, 4), 16),
      b: Number.parseInt(cleanHex.slice(4, 6), 16),
    }
  }

  throw new Error(`Invalid hex color: ${hex}`)
}

// Parse rgba() to RGB (ignoring alpha for contrast calculation)
function parseRgba(rgba: string): { r: number; g: number; b: number } {
  const match = rgba.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/)
  if (!match) {
    throw new Error(`Invalid rgba color: ${rgba}`)
  }

  return {
    r: Number.parseInt(match[1]!, 10),
    g: Number.parseInt(match[2]!, 10),
    b: Number.parseInt(match[3]!, 10),
  }
}

// Parse any color string to RGB
function parseColor(color: string): { r: number; g: number; b: number } {
  if (color.startsWith('#')) {
    return parseHex(color)
  }

  if (color.startsWith('rgb')) {
    return parseRgba(color)
  }

  throw new Error(`Unsupported color format: ${color}`)
}

// Calculate relative luminance (WCAG 2.0)
function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255
    return sRGB <= 0.03928 ? sRGB / 12.92 : ((sRGB + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

// Calculate contrast ratio (WCAG 2.0)
function contrastRatio(fg: string, bg: string): number {
  const fgRgb = parseColor(fg)
  const bgRgb = parseColor(bg)

  const fgLum = luminance(fgRgb.r, fgRgb.g, fgRgb.b)
  const bgLum = luminance(bgRgb.r, bgRgb.g, bgRgb.b)

  const lighter = Math.max(fgLum, bgLum)
  const darker = Math.min(fgLum, bgLum)

  return (lighter + 0.05) / (darker + 0.05)
}

// Check if contrast ratio meets WCAG AA standards
function checkContrast(ratio: number): { body: boolean; large: boolean } {
  return {
    body: ratio >= 4.5,
    large: ratio >= 3.0,
  }
}

function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.error('Usage: check-contrast.ts <colors.tokens.json>')
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

  let data: ColorsData
  try {
    data = JSON.parse(content) as ColorsData
  } catch (err) {
    console.error(`Failed to parse JSON: ${err}`)
    process.exit(1)
  }

  if (!data.color?.surface || !data.color?.content) {
    console.error('Invalid colors.tokens.json structure: missing color.surface or color.content')
    process.exit(1)
  }

  const pairs: ContrastPair[] = []
  const failures: ContrastPair[] = []

  // Define critical surface/content pairs to check
  const criticalPairs: Array<{
    surfaceKey: string
    contentKey: string
    description: string
  }> = [
    {
      surfaceKey: 'primary',
      contentKey: 'primary',
      description: 'Primary text on primary surface',
    },
    {
      surfaceKey: 'primary',
      contentKey: 'secondary',
      description: 'Secondary text on primary surface',
    },
    {
      surfaceKey: 'primary',
      contentKey: 'tertiary',
      description: 'Tertiary text on primary surface',
    },
    { surfaceKey: 'card', contentKey: 'primary', description: 'Primary text on card' },
    { surfaceKey: 'card', contentKey: 'secondary', description: 'Secondary text on card' },
  ]

  for (const { surfaceKey, contentKey, description } of criticalPairs) {
    const surface = data.color.surface[surfaceKey]
    const content = data.color.content[contentKey]

    if (!surface || !content) {
      console.error(`Missing token pair: surface.${surfaceKey} / content.${contentKey}`)
      process.exit(1)
    }

    for (const mode of ['light', 'dark'] as const) {
      const bgColor = surface[mode]
      const fgColor = content[mode]

      if (!bgColor || !fgColor) {
        console.error(`Missing ${mode} value for surface.${surfaceKey} or content.${contentKey}`)
        process.exit(1)
      }

      const ratio = contrastRatio(fgColor, bgColor)
      const passes = checkContrast(ratio)

      const pair: ContrastPair = {
        foreground: fgColor,
        background: bgColor,
        mode,
        ratio,
        passes: passes.body && passes.large,
        category: passes.body ? 'body' : 'large',
      }

      pairs.push(pair)

      if (!passes.body) {
        failures.push(pair)
      }
    }
  }

  // Report results
  console.log(`\nChecked ${pairs.length} surface/content contrast pair(s)\n`)

  for (const pair of pairs) {
    const status = pair.passes ? '✅' : '❌'
    const category = pair.category === 'body' ? 'AA Body + Large' : 'AA Large only'
    console.log(`${status} [${pair.mode.toUpperCase()}] ${pair.ratio.toFixed(2)}:1 (${category})`)
    console.log(`    ${pair.foreground} on ${pair.background}`)
  }

  if (failures.length > 0) {
    console.error(`\n❌ ${failures.length} pair(s) fail WCAG AA body text threshold (4.5:1)\n`)
    console.error('Failed pairs:')
    for (const failure of failures) {
      console.error(
        `  [${failure.mode.toUpperCase()}] ${failure.ratio.toFixed(2)}:1 - ${failure.foreground} on ${failure.background}`,
      )
    }
    console.error('\nWCAG AA Requirements:')
    console.error('  - Body text (normal): ≥ 4.5:1')
    console.error('  - Large text (18px+ or 14px+ bold): ≥ 3.0:1')
    process.exit(1)
  }

  console.log('\n✅ All critical surface/content pairs meet WCAG AA standards')
  process.exit(0)
}

main()
