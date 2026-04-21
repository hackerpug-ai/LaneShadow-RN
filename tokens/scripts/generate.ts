#!/usr/bin/env tsx

/**
 * UC-TOK-05 Token Generation Pipeline
 *
 * Generates Swift, Kotlin, and TypeScript platform outputs from semantic tokens.
 * Emits:
 * - tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift
 * - tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt
 * - tokens/platforms/web/tokens.ts
 * - tokens/platforms/web/mapbox.ts
 *
 * Source: tokens/semantic/*.json + tokens/icons/*.svg + tokens/fonts/manifest.json
 *
 * Generated files include a do-not-edit header and input hash for drift detection.
 */

import * as crypto from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'

interface ColorToken {
  light: string
  dark: string
}

interface TypographyToken {
  family: string
  size: number
  lineHeight: number
  weight: string
  letterSpacing: number
}

interface DimensionToken {
  $value: number
  $description?: string
}

interface MotionDuration {
  $value: number
}

interface MotionEasing {
  $value: number[]
}

interface MotionRecipe {
  duration: string
  easing: string
  iteration: string
}

interface SemanticTokens {
  typography?: {
    opinion?: Record<string, TypographyToken>
    ui?: Record<string, Record<string, TypographyToken>>
    instrument?: Record<string, TypographyToken>
  }
  color?: {
    surface?: Record<string, ColorToken>
    content?: Record<string, ColorToken>
    signal?: Record<string, ColorToken | Record<string, ColorToken>>
    role?: Record<string, Record<string, ColorToken>>
    weather?: Record<string, Record<string, ColorToken>>
    route?: Record<string, ColorToken>
    status?: Record<string, Record<string, ColorToken>>
    border?: Record<string, ColorToken>
    action?: Record<string, Record<string, ColorToken>>
  }
  dimensions?: {
    spacing?: Record<string, DimensionToken>
    sizing?: {
      touchTarget?: Record<string, DimensionToken>
      icon?: Record<string, DimensionToken>
      stroke?: Record<string, DimensionToken>
      component?: Record<string, DimensionToken>
      pill?: Record<string, DimensionToken>
      iconStroke?: Record<string, DimensionToken>
    }
    radius?: Record<string, DimensionToken>
    opacity?: Record<string, DimensionToken>
    elevation?: Record<string, DimensionToken>
  }
  motion?: {
    duration?: Record<string, MotionDuration>
    easing?: Record<string, MotionEasing>
    [key: string]: MotionRecipe | MotionDuration | MotionEasing | undefined
  }
}

interface IconManifest {
  icons: string[]
}

interface MapboxTokens {
  map: {
    style: {
      light: { $value: string; $description: string }
      dark: { $value: string; $description: string }
    }
  }
}

interface FontManifest {
  fonts: Array<{
    family: string
    role: string
    weights: number[]
  }>
}

// Paths
const ROOT = path.resolve(__dirname, '..')
const SEMANTIC_DIR = path.join(ROOT, 'semantic')
const ICONS_DIR = path.join(ROOT, 'icons')
const FONTS_MANIFEST = path.join(ROOT, 'fonts', 'manifest.json')
const PLATFORMS_DIR = path.join(ROOT, 'platforms')

const SWIFT_OUTPUT = path.join(
  PLATFORMS_DIR,
  'swift',
  'Sources',
  'LaneShadowTheme',
  'Generated',
  'Tokens.swift',
)
const KOTLIN_OUTPUT = path.join(
  PLATFORMS_DIR,
  'kotlin',
  'src',
  'main',
  'java',
  'com',
  'laneshadow',
  'theme',
  'generated',
  'Tokens.kt',
)
const TS_OUTPUT = path.join(PLATFORMS_DIR, 'web', 'tokens.ts')
const MAPBOX_OUTPUT = path.join(PLATFORMS_DIR, 'web', 'mapbox.ts')

// Load all semantic token files
function loadSemanticTokens(): SemanticTokens {
  const tokens: SemanticTokens = {}

  const tokenFiles = [
    'typography.tokens.json',
    'colors.tokens.json',
    'dimensions.tokens.json',
    'motion.tokens.json',
    'icons.json',
    'mapbox.tokens.json',
  ]

  for (const file of tokenFiles) {
    const filePath = path.join(SEMANTIC_DIR, file)
    if (fs.existsSync(filePath)) {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      // Merge content, preserving the mapbox key
      if (file === 'mapbox.tokens.json') {
        tokens.mapbox = content.map
      } else {
        Object.assign(tokens, content)
      }
    }
  }

  return tokens
}

// Load icon manifest (list of SVG files)
function loadIconManifest(): string[] {
  const iconsJsonPath = path.join(SEMANTIC_DIR, 'icons.json')
  if (fs.existsSync(iconsJsonPath)) {
    const manifest = JSON.parse(fs.readFileSync(iconsJsonPath, 'utf-8')) as IconManifest
    return manifest.icons || []
  }

  // Fallback: scan icons directory
  if (fs.existsSync(ICONS_DIR)) {
    return fs
      .readdirSync(ICONS_DIR)
      .filter((f) => f.endsWith('.svg'))
      .map((f) => f.replace('.svg', ''))
  }

  return []
}

// Load font manifest
function loadFontManifest(): FontManifest {
  const content = fs.readFileSync(FONTS_MANIFEST, 'utf-8')
  return JSON.parse(content)
}

// Generate input hash for drift detection
function generateInputHash(tokens: SemanticTokens, icons: string[], fonts: FontManifest): string {
  const data = JSON.stringify({ tokens, icons, fonts }) + icons.sort().join(',')
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 8)
}

// Parse color string to hex/rgba
function parseColorString(color: string): string {
  if (color.startsWith('#')) {
    return color
  }
  if (color.startsWith('rgb')) {
    return color
  }
  return color
}

// Map font family role to native font names
function mapFontFamily(role: string): string {
  const map: Record<string, string> = {
    opinion: 'Newsreader',
    ui: 'Geist',
    instrument: 'JetBrainsMono',
  }
  return map[role] || 'Geist' // Default to Geist if unknown
}

// Map weight string to numeric value
function mapWeight(weight: string): number {
  return parseInt(weight, 10)
}

// ============================================================================
// SWIFT EMITTER
// ============================================================================

function emitSwift(
  tokens: SemanticTokens,
  icons: string[],
  fonts: FontManifest,
  inputHash: string,
): string {
  const lines: string[] = []

  // Header
  lines.push('// GENERATED by tokens/scripts/generate.ts — do not edit by hand')
  lines.push(`// input-hash: ${inputHash}`)
  lines.push('')
  lines.push('import NativeTheme')
  lines.push('')
  lines.push('enum LaneShadowTheme {')

  // Colors
  if (tokens.color) {
    lines.push('  enum color {')

    // Helper to flatten color groups and handle nested structures
    const processColorGroup = (groupName: string, group: Record<string, any>, parentPath = '') => {
      const entries = Object.entries(group)

      // First, separate leaf tokens from nested groups
      const leafTokens: Array<{ name: string; token: ColorToken }> = []
      const nestedGroups: Array<{ name: string; group: Record<string, any> }> = []

      for (const [name, value] of Object.entries(group)) {
        if (typeof value === 'object' && 'light' in value && 'dark' in value) {
          leafTokens.push({ name, token: value as ColorToken })
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          nestedGroups.push({ name, group: value })
        }
      }

      // If we have both leaf tokens and nested groups at the same level,
      // we need to handle this specially
      if (leafTokens.length > 0 && nestedGroups.length > 0) {
        // This is a mixed group like "role" which has both direct tokens and nested groups
        // Emit as an enum with nested enums
        lines.push(`    enum ${groupName} {`)

        // Emit leaf tokens
        for (const { name, token } of leafTokens) {
          const swiftName = name === 'default' ? '`default`' : name
          const light = parseColorString(token.light)
          const dark = parseColorString(token.dark)
          lines.push(`      static let ${swiftName} = ColorSet(`)
          lines.push(`        light: parseColorString("${light}"),`)
          lines.push(`        dark:  parseColorString("${dark}")`)
          lines.push(`      )`)
        }

        // Recursively process nested groups
        for (const { name: subName, group: subGroup } of nestedGroups) {
          processColorGroup(subName, subGroup as Record<string, any>, groupName)
        }

        lines.push(`    }`)
      } else if (leafTokens.length > 0 && nestedGroups.length === 0) {
        // Simple flat group with only leaf tokens
        lines.push(`    enum ${groupName} {`)
        for (const { name, token } of leafTokens) {
          const swiftName = name === 'default' ? '`default`' : name
          const light = parseColorString(token.light)
          const dark = parseColorString(token.dark)
          lines.push(`      static let ${swiftName} = ColorSet(`)
          lines.push(`        light: parseColorString("${light}"),`)
          lines.push(`        dark:  parseColorString("${dark}")`)
          lines.push(`      )`)
        }
        lines.push(`    }`)
      } else if (leafTokens.length === 0 && nestedGroups.length > 0) {
        // Only nested groups - this shouldn't happen with our color structure
        // But handle it by recursing
        for (const { name: subName, group: subGroup } of nestedGroups) {
          processColorGroup(subName, subGroup as Record<string, any>, groupName)
        }
      }
    }

    for (const [groupName, group] of Object.entries(tokens.color)) {
      if (typeof group === 'object' && !Array.isArray(group)) {
        processColorGroup(groupName, group as Record<string, any>)
      }
    }

    lines.push('  }')
  }

  // Typography
  if (tokens.typography) {
    lines.push('  enum typography {')

    const emitTypographyToken = (name: string, token: TypographyToken) => {
      const family = mapFontFamily(token.family)
      const weight = mapWeight(token.weight)
      const lineHeightRatio = (token.lineHeight / token.size).toFixed(2)

      lines.push(`    static let ${name} = TypographyStyle(`)
      lines.push(`      family: .${family.toLowerCase()},`)
      lines.push(
        `      weight: .${weight < 500 ? 'regular' : weight < 600 ? 'medium' : 'semibold'},`,
      )
      lines.push(`      size: ${token.size}, lineHeight: ${lineHeightRatio}`)
      lines.push(`    )`)
    }

    const typo = tokens.typography
    if (typo.opinion) {
      for (const [name, token] of Object.entries(typo.opinion)) {
        emitTypographyToken(`opinion${name.charAt(0).toUpperCase() + name.slice(1)}`, token)
      }
    }
    if (typo.ui) {
      for (const [category, variants] of Object.entries(typo.ui)) {
        for (const [size, token] of Object.entries(variants)) {
          emitTypographyToken(
            `ui${category.charAt(0).toUpperCase() + category.slice(1)}${size.charAt(0).toUpperCase() + size.slice(1)}`,
            token,
          )
        }
      }
    }
    if (typo.instrument) {
      for (const [name, token] of Object.entries(typo.instrument)) {
        emitTypographyToken(`instrument${name.charAt(0).toUpperCase() + name.slice(1)}`, token)
      }
    }

    lines.push('  }')
  }

  // Dimensions (spacing)
  if (tokens.dimensions?.spacing) {
    lines.push('  enum spacing {')
    lines.push('    static let values: [Int: CGFloat] = [')

    for (const [key, value] of Object.entries(tokens.dimensions.spacing)) {
      if (value.$value !== undefined) {
        lines.push(`      ${key}: ${value.$value},`)
      }
    }

    lines.push('    ]')
    lines.push('  }')
  }

  // Icons
  if (icons.length > 0) {
    lines.push('  enum icon {')
    lines.push('    enum name: String, CaseIterable {')

    for (const icon of icons) {
      // Convert kebab-case to camelCase
      const camelCase = icon.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      lines.push(`      case ${camelCase} = "${icon}"`)
    }

    lines.push('    }')
    lines.push('  }')
  }

  lines.push('}')
  return lines.join('\n')
}

// ============================================================================
// KOTLIN EMITTER
// ============================================================================

function emitKotlin(
  tokens: SemanticTokens,
  icons: string[],
  fonts: FontManifest,
  inputHash: string,
): string {
  const lines: string[] = []

  // Header
  lines.push('// GENERATED by tokens/scripts/generate.ts — do not edit by hand')
  lines.push(`// input-hash: ${inputHash}`)
  lines.push('')
  lines.push('package com.laneshadow.theme.generated')
  lines.push('')
  lines.push('import androidx.compose.ui.graphics.Color')
  lines.push('')
  lines.push('object LaneShadowTheme {')

  // Colors
  if (tokens.color) {
    lines.push('  object color {')

    const emitColorGroup = (groupName: string, group: Record<string, any>) => {
      lines.push(`    object ${groupName.capitalize()} {`)

      for (const [name, value] of Object.entries(group)) {
        if (typeof value === 'object' && 'light' in value && 'dark' in value) {
          const colorToken = value as ColorToken
          const lightHex = colorToken.light.replace('#', '0xFF')
          const darkHex = colorToken.dark.replace('#', '0xFF')
          lines.push(`      val ${name} = Color(${lightHex})`)
        } else if (typeof value === 'object') {
          emitColorGroup(name, value)
        }
      }

      lines.push(`    }`)
    }

    for (const [groupName, group] of Object.entries(tokens.color)) {
      if (typeof group === 'object' && !Array.isArray(group)) {
        emitColorGroup(groupName, group as Record<string, any>)
      }
    }

    lines.push('  }')
  }

  // Icons enum
  if (icons.length > 0) {
    lines.push('  enum class IconName(val value: String) {')

    for (const icon of icons) {
      // Convert kebab-case to PascalCase
      const pascalCase = icon
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
      lines.push(`    ${pascalCase}("${icon}"),`)
    }

    lines.push('    ;')
    lines.push('  }')
  }

  lines.push('}')
  return lines.join('\n')
}

// ============================================================================
// TYPESCRIPT EMITTER
// ============================================================================

function emitTypeScript(
  tokens: SemanticTokens,
  icons: string[],
  fonts: FontManifest,
  inputHash: string,
): string {
  const lines: string[] = []

  // Header
  lines.push('// GENERATED by tokens/scripts/generate.ts — do not edit by hand')
  lines.push(`// input-hash: ${inputHash}`)
  lines.push('')
  lines.push('export const tokens = {')

  // Colors
  if (tokens.color) {
    lines.push('  color: {')

    const emitColorGroup = (group: Record<string, any>, indent: number) => {
      const padding = '  '.repeat(indent)

      for (const [name, value] of Object.entries(group)) {
        if (typeof value === 'object' && 'light' in value && 'dark' in value) {
          const colorToken = value as ColorToken
          lines.push(`${padding}${name}: {`)
          lines.push(`${padding}  light: "${colorToken.light}",`)
          lines.push(`${padding}  dark: "${colorToken.dark}"`)
          lines.push(`${padding}},`)
        } else if (typeof value === 'object') {
          lines.push(`${padding}${name}: {`)
          emitColorGroup(value, indent + 1)
          lines.push(`${padding}},`)
        }
      }
    }

    emitColorGroup(tokens.color, 2)
    lines.push('  },')
  }

  // Typography
  if (tokens.typography) {
    lines.push('  typography: {')

    const emitTypographyToken = (name: string, token: TypographyToken, indent: number) => {
      const padding = '  '.repeat(indent)
      lines.push(`${padding}${name}: {`)
      lines.push(`${padding}  family: "${mapFontFamily(token.family)}",`)
      lines.push(`${padding}  weight: ${token.weight},`)
      lines.push(`${padding}  size: ${token.size},`)
      lines.push(`${padding}  lineHeight: ${(token.lineHeight / token.size).toFixed(2)}`)
      lines.push(`${padding}},`)
    }

    const typo = tokens.typography
    if (typo.opinion) {
      lines.push('    opinion: {')
      for (const [name, token] of Object.entries(typo.opinion)) {
        emitTypographyToken(name, token, 3)
      }
      lines.push('    },')
    }
    if (typo.ui) {
      lines.push('    ui: {')
      for (const [category, variants] of Object.entries(typo.ui)) {
        lines.push(`      ${category}: {`)
        for (const [size, token] of Object.entries(variants)) {
          emitTypographyToken(size, token, 4)
        }
        lines.push('      },')
      }
      lines.push('    },')
    }
    if (typo.instrument) {
      lines.push('    instrument: {')
      for (const [name, token] of Object.entries(typo.instrument)) {
        emitTypographyToken(name, token, 3)
      }
      lines.push('    },')
    }

    lines.push('  },')
  }

  // Icons
  if (icons.length > 0) {
    lines.push('  icon: {')
    lines.push('    name: [')
    for (const icon of icons) {
      lines.push(`      "${icon}",`)
    }
    lines.push('    ]')
    lines.push('  },')
  }

  lines.push('} as const;')
  lines.push('')
  lines.push('export type Tokens = typeof tokens;')

  return lines.join('\n')
}

// ============================================================================
// MAPBOX STYLE URL EMITTER
// ============================================================================

function emitMapboxTS(tokens: SemanticTokens, inputHash: string): string {
  const lines: string[] = []

  lines.push('// GENERATED by tokens/scripts/generate.ts — do not edit by hand')
  lines.push(`// input-hash: ${inputHash}`)
  lines.push('')
  lines.push('export const mapboxStyleUrls = {')

  if (tokens.mapbox?.style) {
    const style = tokens.mapbox.style
    lines.push(`  light: "${style.light.$value}", // ${style.light.$description}`)
    lines.push(`  dark: "${style.dark.$value}", // ${style.dark.$description}`)
  }

  lines.push('} as const;')
  lines.push('')
  lines.push('export type MapboxStyleUrls = typeof mapboxStyleUrls;')

  return lines.join('\n')
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('🔧 Generating platform tokens from semantic sources...')

  // Load inputs
  const tokens = loadSemanticTokens()
  const icons = loadIconManifest()
  const fonts = loadFontManifest()

  console.log(`  📦 Loaded ${Object.keys(tokens).length} token groups`)
  console.log(`  🎨 Loaded ${icons.length} icons`)
  console.log(`  🔤 Loaded ${fonts.fonts.length} font families`)

  // Generate hash
  const inputHash = generateInputHash(tokens, icons, fonts)
  console.log(`  🔐 Input hash: ${inputHash}`)

  // Ensure output directories exist
  fs.mkdirSync(path.dirname(SWIFT_OUTPUT), { recursive: true })
  fs.mkdirSync(path.dirname(KOTLIN_OUTPUT), { recursive: true })
  fs.mkdirSync(path.dirname(TS_OUTPUT), { recursive: true })
  fs.mkdirSync(path.dirname(MAPBOX_OUTPUT), { recursive: true })

  // Emit Swift
  console.log('  📱 Emitting Swift tokens...')
  const swift = emitSwift(tokens, icons, fonts, inputHash)
  fs.writeFileSync(SWIFT_OUTPUT, `${swift}\n`)

  // Emit Kotlin
  console.log('  🤖 Emitting Kotlin tokens...')
  const kotlin = emitKotlin(tokens, icons, fonts, inputHash)
  fs.writeFileSync(KOTLIN_OUTPUT, `${kotlin}\n`)

  // Emit TypeScript
  console.log('  🌐 Emitting TypeScript tokens...')
  const ts = emitTypeScript(tokens, icons, fonts, inputHash)
  fs.writeFileSync(TS_OUTPUT, `${ts}\n`)

  // Emit Mapbox URLs
  console.log('  🗺️  Emitting Mapbox style URLs...')
  const mapbox = emitMapboxTS(tokens, inputHash)
  fs.writeFileSync(MAPBOX_OUTPUT, `${mapbox}\n`)

  console.log('✅ Token generation complete!')
  console.log('')
  console.log('Generated files:')
  console.log(`  - ${SWIFT_OUTPUT}`)
  console.log(`  - ${KOTLIN_OUTPUT}`)
  console.log(`  - ${TS_OUTPUT}`)
  console.log(`  - ${MAPBOX_OUTPUT}`)
}

// String extension for capitalize
declare global {
  interface String {
    capitalize(): string
  }
}

String.prototype.capitalize = function (): string {
  return this.charAt(0).toUpperCase() + this.slice(1)
}

// Run
main()
