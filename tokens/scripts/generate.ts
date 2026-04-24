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
    status?: Record<string, ColorToken | Record<string, ColorToken>>
    border?: Record<string, ColorToken>
    action?: Record<string, Record<string, ColorToken>>
    map?: Record<string, ColorToken>
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
  mapbox?: MapboxTokens['map']
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

type ThemeScalar = string | number
type ThemeGroup = Record<string, ThemeScalar>

interface ThemeModeFile {
  [group: string]: unknown
}

interface ThemeModes {
  light: ThemeModeFile
  dark: ThemeModeFile
}

type KotlinColorNode = Record<string, KotlinColorNode | ColorToken>

// Paths
const ROOT = path.resolve(__dirname, '..')
const SEMANTIC_DIR = path.join(ROOT, 'semantic')
const ICONS_DIR = path.join(ROOT, 'icons')
const FONTS_MANIFEST = path.join(ROOT, 'fonts', 'manifest.json')
const PLATFORMS_DIR = path.join(ROOT, 'platforms')
const THEME_TOKENS_DIR = path.resolve(ROOT, '..', '.spec', 'design', 'system', 'tokens')
const THEME_LIGHT_PATH = path.join(THEME_TOKENS_DIR, 'theme.light.json')
const THEME_DARK_PATH = path.join(THEME_TOKENS_DIR, 'theme.dark.json')

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

type ThemeTokenValue = string | number

interface ThemeColorSource {
  surface: Record<string, ThemeTokenValue>
  border: Record<string, ThemeTokenValue>
  signal: Record<string, ThemeTokenValue>
  action: Record<string, ThemeTokenValue>
  status: Record<string, ThemeTokenValue>
  map: Record<string, ThemeTokenValue>
}

function loadThemeColors(name: 'light' | 'dark'): ThemeColorSource {
  const filePath = path.join(THEME_TOKENS_DIR, `theme.${name}.json`)
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ThemeColorSource
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function toSwiftIdentifier(name: string): string {
  if (name === 'default') return '`default`'
  return name.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase())
}

function setNestedColorToken(
  root: Record<string, any>,
  pathSegments: string[],
  token: ColorToken,
): void {
  let cursor = root
  for (const segment of pathSegments.slice(0, -1)) {
    cursor[segment] ??= {}
    cursor = cursor[segment]
  }
  const leafKey = pathSegments[pathSegments.length - 1]
  if (cursor[leafKey] === undefined) {
    cursor[leafKey] = token
  }
}

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
    if (!fs.existsSync(filePath)) {
      if (file === 'mapbox.tokens.json') {
        throw new Error(`Required semantic token file is missing: ${path.relative(ROOT, filePath)}`)
      }
      continue
    }

    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    // Merge content, preserving the mapbox key
    if (file === 'mapbox.tokens.json') {
      tokens.mapbox = content.map
    } else {
      Object.assign(tokens, content)
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

function generateKotlinInputHash(
  tokens: SemanticTokens,
  icons: string[],
  fonts: FontManifest,
): string {
  const hash = crypto.createHash('sha256')
  hash.update(JSON.stringify({ tokens, icons, fonts }))
  for (const filePath of [THEME_LIGHT_PATH, THEME_DARK_PATH]) {
    hash.update(filePath)
    hash.update(fs.readFileSync(filePath, 'utf-8'))
  }
  return hash.digest('hex').substring(0, 8)
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

// Convert a color string to Kotlin Compose Color constructor arg
function toKotlinColorArgs(color: string): string {
  if (color.startsWith('#')) {
    return color.replace('#', '0xFF')
  }
  const rgbaMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/)
  if (rgbaMatch) {
    const r = (parseInt(rgbaMatch[1], 10) / 255).toFixed(3)
    const g = (parseInt(rgbaMatch[2], 10) / 255).toFixed(3)
    const b = (parseInt(rgbaMatch[3], 10) / 255).toFixed(3)
    const a = rgbaMatch[4] ?? '1.0'
    return `${r}f, ${g}f, ${b}f, ${a}f`
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

function toTypeScriptKey(value: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value) ? value : JSON.stringify(value)
}

function camelCaseName(value: string): string {
  return value.replace(/-([a-zA-Z0-9])/g, (_, char: string) => char.toUpperCase())
}

function pascalCaseName(value: string): string {
  const camel = camelCaseName(value)
  return camel.charAt(0).toUpperCase() + camel.slice(1)
}

function loadThemeModes(): ThemeModes {
  return {
    light: JSON.parse(fs.readFileSync(THEME_LIGHT_PATH, 'utf-8')) as ThemeModeFile,
    dark: JSON.parse(fs.readFileSync(THEME_DARK_PATH, 'utf-8')) as ThemeModeFile,
  }
}

function themeGroup(mode: ThemeModeFile, groupName: string): ThemeGroup {
  const group = mode[groupName]
  if (!group || typeof group !== 'object' || Array.isArray(group)) {
    return {}
  }
  return group as ThemeGroup
}

function isColorToken(value: KotlinColorNode | ColorToken): value is ColorToken {
  return typeof value === 'object' && value !== null && 'light' in value && 'dark' in value
}

function upsertColorToken(
  tree: KotlinColorNode,
  pathParts: string[],
  light: string,
  dark: string,
): void {
  let current = tree
  for (const part of pathParts.slice(0, -1)) {
    const existing = current[part]
    if (!existing || isColorToken(existing)) {
      current[part] = {}
    }
    current = current[part] as KotlinColorNode
  }
  current[pathParts[pathParts.length - 1]] = { light, dark }
}

function mergeKotlinColorTrees(target: KotlinColorNode, source: KotlinColorNode): KotlinColorNode {
  for (const [name, value] of Object.entries(source)) {
    if (isColorToken(value)) {
      target[name] = value
      continue
    }

    const existing = target[name]
    if (!existing || isColorToken(existing)) {
      target[name] = {}
    }
    mergeKotlinColorTrees(target[name] as KotlinColorNode, value)
  }

  return target
}

function semanticColorsToKotlinTree(value: Record<string, any> | undefined): KotlinColorNode {
  const tree: KotlinColorNode = {}
  if (!value) return tree

  for (const [name, entry] of Object.entries(value)) {
    const normalizedName = camelCaseName(name)
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) continue
    if ('light' in entry && 'dark' in entry) {
      tree[normalizedName] = { light: entry.light, dark: entry.dark }
      continue
    }
    tree[normalizedName] = semanticColorsToKotlinTree(entry as Record<string, any>)
  }

  return tree
}

function hasColorTokenPath(tree: KotlinColorNode, pathParts: string[]): boolean {
  let current: KotlinColorNode | ColorToken | undefined = tree
  for (const part of pathParts) {
    if (!current || isColorToken(current)) {
      return false
    }
    current = current[part]
  }
  return current !== undefined
}

function buildKotlinColorTree(tokens: SemanticTokens, theme: ThemeModes): KotlinColorNode {
  const tree = semanticColorsToKotlinTree(tokens.color as Record<string, any> | undefined)
  const groups = [
    'surface',
    'content',
    'border',
    'signal',
    'action',
    'role',
    'status',
    'weather',
    'route',
  ]

  for (const groupName of groups) {
    const lightGroup = themeGroup(theme.light, groupName)
    const darkGroup = themeGroup(theme.dark, groupName)
    const overlayTree: KotlinColorNode = {}

    for (const [rawKey, lightValue] of Object.entries(lightGroup)) {
      const darkValue = darkGroup[rawKey]
      if (typeof lightValue !== 'string' || typeof darkValue !== 'string') continue

      let pathParts: string[]
      if (groupName === 'action') {
        const [variant, state = 'default'] = rawKey.split('-', 2)
        pathParts = [groupName, variant, camelCaseName(state)]
      } else if (groupName === 'role') {
        pathParts = [groupName, rawKey, 'default']
      } else if (groupName === 'weather') {
        const [variant, state] = rawKey.split('-', 2)
        pathParts = [groupName, variant, camelCaseName(state ?? 'default')]
      } else if (groupName === 'status') {
        if (rawKey === 'recording') {
          pathParts = [groupName, rawKey]
        } else {
          const [variant, state] = rawKey.split('-', 2)
          pathParts = [groupName, variant, camelCaseName(state ?? 'default')]
        }
      } else {
        pathParts = [groupName, camelCaseName(rawKey)]
      }

      upsertColorToken(overlayTree, pathParts, lightValue, darkValue)
    }

    mergeKotlinColorTrees(tree, overlayTree)
  }

  // The drift report is authoritative for this missing Copper token until the semantic source carries it.
  if (!hasColorTokenPath(tree, ['surface', 'scrimSoft'])) {
    upsertColorToken(tree, ['surface', 'scrimSoft'], 'rgba(34,24,16,0.18)', 'rgba(10,6,3,0.28)')
  }

  return tree
}

function hasDirectColorLeaves(node: KotlinColorNode): boolean {
  return Object.values(node).some((value) => isColorToken(value))
}

function emitKotlinColorMembers(
  lines: string[],
  node: KotlinColorNode,
  indent: string,
  mode: 'light' | 'dark',
): void {
  for (const [name, value] of Object.entries(node)) {
    if (isColorToken(value)) {
      lines.push(`${indent}val ${camelCaseName(name)} = Color(${toKotlinColorArgs(value[mode])})`)
      continue
    }

    lines.push(`${indent}object ${pascalCaseName(name)} {`)
    emitKotlinColorMembers(lines, value, `${indent}  `, mode)
    if (mode === 'light' && hasDirectColorLeaves(value)) {
      lines.push(`${indent}  object dark {`)
      emitKotlinColorMembers(lines, value, `${indent}    `, 'dark')
      lines.push(`${indent}  }`)
    }
    lines.push(`${indent}}`)
  }
}

interface SvgPathSpec {
  pathData: string
  fill: boolean
  stroke: boolean
}

function attr(source: string, name: string): string | undefined {
  return source.match(new RegExp(`${name}="([^"]+)"`))?.[1]
}

function hasPaint(value: string | undefined, fallback: string | undefined): boolean {
  const resolved = value ?? fallback
  return !!resolved && resolved !== 'none' && resolved !== '#00000000'
}

function pointsToPath(points: string, close: boolean): string {
  const nums = [...points.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => m[0])
  const pairs: Array<[string, string]> = []
  for (let i = 0; i < nums.length - 1; i += 2) {
    pairs.push([nums[i], nums[i + 1]])
  }
  if (pairs.length === 0) {
    return ''
  }
  const [first, ...rest] = pairs
  const commands = [`M${first[0]} ${first[1]}`, ...rest.map(([px, py]) => `L${px} ${py}`)]
  if (close) commands.push('Z')
  return commands.join(' ')
}

function numberAttr(source: string, name: string): number | undefined {
  const value = attr(source, name)
  if (value === undefined) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function svgPathSpecs(icon: string): SvgPathSpec[] {
  const source = fs.readFileSync(path.join(ICONS_DIR, `${icon}.svg`), 'utf-8')
  const rootTag = source.match(/<svg\b[^>]*>/)?.[0] ?? ''
  const rootFill = attr(rootTag, 'fill')
  const rootStroke = attr(rootTag, 'stroke')
  const specs: SvgPathSpec[] = []
  const elementPattern = /<(path|line|circle|polygon|polyline)\b([^>]*)\/?>/g

  for (const match of source.matchAll(elementPattern)) {
    const element = match[1]
    const attrs = match[2]
    const fill = hasPaint(attr(attrs, 'fill'), rootFill)
    const stroke = hasPaint(attr(attrs, 'stroke'), rootStroke)
    let pathData: string | undefined

    if (element === 'path') {
      pathData = attr(attrs, 'd')
    } else if (element === 'line') {
      const x1 = attr(attrs, 'x1')
      const y1 = attr(attrs, 'y1')
      const x2 = attr(attrs, 'x2')
      const y2 = attr(attrs, 'y2')
      if (x1 && y1 && x2 && y2) {
        pathData = `M${x1} ${y1} L${x2} ${y2}`
      }
    } else if (element === 'circle') {
      const cx = numberAttr(attrs, 'cx')
      const cy = numberAttr(attrs, 'cy')
      const r = numberAttr(attrs, 'r')
      if (cx !== undefined && cy !== undefined && r !== undefined) {
        pathData = `M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy}`
      }
    } else if (element === 'polygon' || element === 'polyline') {
      const points = attr(attrs, 'points')
      if (points) pathData = pointsToPath(points, element === 'polygon')
    }

    if (pathData && (fill || stroke)) {
      specs.push({ pathData, fill, stroke })
    }
  }

  return specs
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
  const lightTheme = loadThemeColors('light')
  const darkTheme = loadThemeColors('dark')

  // Header
  lines.push('// GENERATED by tokens/scripts/generate.ts — do not edit by hand')
  lines.push(`// input-hash: ${inputHash}`)
  lines.push('')
  lines.push('import NativeTheme')
  lines.push('import CoreGraphics')
  lines.push('')

  if (icons.length > 0) {
    lines.push('public enum IconName: String, CaseIterable, Hashable, Sendable {')
    for (const icon of icons) {
      const camelCase = icon.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      lines.push(`  case ${camelCase} = "${icon}"`)
    }
    lines.push('}')
    lines.push('')
    lines.push('public struct IconPathSpec: Sendable {')
    lines.push('  public let pathData: String')
    lines.push('  public let fill: Bool')
    lines.push('  public let stroke: Bool')
    lines.push('  public init(pathData: String, fill: Bool, stroke: Bool) {')
    lines.push('    self.pathData = pathData')
    lines.push('    self.fill = fill')
    lines.push('    self.stroke = stroke')
    lines.push('  }')
    lines.push('}')
    lines.push('')
    lines.push('public enum IconCatalog {')
    lines.push('  public static func pathSpecs(for name: IconName) -> [IconPathSpec] {')
    lines.push('    switch name {')
    for (const icon of icons) {
      const camelCase = icon.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      const specs = svgPathSpecs(icon)
      lines.push(`    case .${camelCase}:`)
      lines.push('      return [')
      for (const spec of specs) {
        lines.push(
          `        IconPathSpec(pathData: ${JSON.stringify(spec.pathData)}, fill: ${spec.fill ? 'true' : 'false'}, stroke: ${spec.stroke ? 'true' : 'false'}),`,
        )
      }
      lines.push('      ]')
    }
    lines.push('    }')
    lines.push('  }')
    lines.push('}')
    lines.push('')
  }

  lines.push('public enum LaneShadowTheme {')

  // Colors — emit as dynamic colors using dyn() + parseColorString()
  const swiftColors = cloneJson(tokens.color ?? {})

  const swiftColorFallbacks: Array<{ path: string[]; light: string; dark: string }> = [
    {
      path: ['surface', 'scrim-soft'],
      light: 'rgba(34,24,16,0.18)',
      dark: 'rgba(10,6,3,0.28)',
    },
    {
      path: ['surface', 'map'],
      light: String(lightTheme.surface.map),
      dark: String(darkTheme.surface.map),
    },
    {
      path: ['border', 'glass'],
      light: String(lightTheme.border.glass),
      dark: String(darkTheme.border.glass),
    },
    {
      path: ['signal', 'hover'],
      light: String(lightTheme.signal.hover),
      dark: String(darkTheme.signal.hover),
    },
    {
      path: ['action', 'primary', 'disabled'],
      light: String(lightTheme.action['primary-disabled']),
      dark: String(darkTheme.action['primary-disabled']),
    },
    {
      path: ['status', 'info', 'tint'],
      light: String(lightTheme.status['info-tint']),
      dark: String(darkTheme.status['info-tint']),
    },
    {
      path: ['status', 'success', 'tint'],
      light: String(lightTheme.status['success-tint']),
      dark: String(darkTheme.status['success-tint']),
    },
    {
      path: ['status', 'warning', 'tint'],
      light: String(lightTheme.status['warning-tint']),
      dark: String(darkTheme.status['warning-tint']),
    },
    {
      path: ['status', 'error', 'tint'],
      light: String(lightTheme.status['error-tint']),
      dark: String(darkTheme.status['error-tint']),
    },
    {
      path: ['status', 'recording'],
      light: String(lightTheme.status.recording),
      dark: String(darkTheme.status.recording),
    },
    {
      path: ['map', 'paper'],
      light: String(lightTheme.map.paper),
      dark: String(darkTheme.map.paper),
    },
    {
      path: ['map', 'contour'],
      light: String(lightTheme.map.contour),
      dark: String(darkTheme.map.contour),
    },
    {
      path: ['map', 'contourFaint'],
      light: String(lightTheme.map['contour-faint']),
      dark: String(darkTheme.map['contour-faint']),
    },
  ]

  for (const entry of swiftColorFallbacks) {
    setNestedColorToken(swiftColors, entry.path, { light: entry.light, dark: entry.dark })
  }

  if (Object.keys(swiftColors).length > 0) {
    lines.push('  public enum color {')

    const processColorGroup = (groupName: string, group: Record<string, any>) => {
      const leafTokens: Array<{ name: string; token: ColorToken }> = []
      const nestedGroups: Array<{ name: string; group: Record<string, any> }> = []

      for (const [name, value] of Object.entries(group)) {
        if (typeof value === 'object' && 'light' in value && 'dark' in value) {
          leafTokens.push({ name, token: value as ColorToken })
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          nestedGroups.push({ name, group: value })
        }
      }

      lines.push(`    public enum ${groupName} {`)

      for (const { name, token } of leafTokens) {
        const swiftName = toSwiftIdentifier(name)
        lines.push(
          `      public static let ${swiftName} = dyn(parseColorString("${token.light}"), parseColorString("${token.dark}"))`,
        )
      }

      for (const { name: subName, group: subGroup } of nestedGroups) {
        processColorGroup(subName, subGroup as Record<string, any>)
      }

      lines.push(`    }`)
    }

    for (const [groupName, group] of Object.entries(swiftColors)) {
      if (typeof group === 'object' && !Array.isArray(group)) {
        processColorGroup(groupName, group as Record<string, any>)
      }
    }

    lines.push('  }')
  }

  // Typography — use TypographyStyle(fontSize:lineHeight:fontWeight:)
  if (tokens.typography) {
    lines.push('  enum typography {')

    const emitTypographyToken = (name: string, token: TypographyToken) => {
      const weight = mapWeight(token.weight)
      const swiftWeight =
        weight < 400
          ? 'ultraLight'
          : weight < 500
            ? 'light'
            : weight < 600
              ? 'medium'
              : weight < 700
                ? 'semibold'
                : weight < 800
                  ? 'bold'
                  : weight < 900
                    ? 'heavy'
                    : 'black'

      lines.push(`    static let ${name} = TypographyStyle(`)
      lines.push(`      fontSize: ${token.size},`)
      lines.push(`      lineHeight: ${token.lineHeight},`)
      lines.push(`      fontWeight: .${swiftWeight}`)
      lines.push(`    )`)
    }

    const typo = tokens.typography
    const isToken = (v: any): v is TypographyToken =>
      typeof v === 'object' && v !== null && typeof v.size === 'number'

    if (typo.opinion) {
      for (const [name, token] of Object.entries(typo.opinion)) {
        if (name.startsWith('$') || !isToken(token)) continue
        emitTypographyToken(`opinion${name.charAt(0).toUpperCase() + name.slice(1)}`, token)
      }
    }
    if (typo.ui) {
      for (const [category, variants] of Object.entries(typo.ui)) {
        if (category.startsWith('$') || typeof variants !== 'object' || !variants) continue
        for (const [size, token] of Object.entries(variants)) {
          if (size.startsWith('$') || !isToken(token)) continue
          emitTypographyToken(
            `ui${category.charAt(0).toUpperCase() + category.slice(1)}${size.charAt(0).toUpperCase() + size.slice(1)}`,
            token,
          )
        }
      }
    }
    if (typo.instrument) {
      for (const [name, token] of Object.entries(typo.instrument)) {
        if (name.startsWith('$') || !isToken(token)) continue
        emitTypographyToken(`instrument${name.charAt(0).toUpperCase() + name.slice(1)}`, token)
      }
    }

    lines.push('  }')
  }

  // Dimensions (spacing) — individual static lets to avoid complex dictionary literal
  if (tokens.dimensions?.spacing) {
    lines.push('  enum spacing {')
    for (const [key, value] of Object.entries(tokens.dimensions.spacing)) {
      if (value.$value !== undefined) {
        lines.push(`    static let s${key}: CGFloat = ${value.$value}`)
      }
    }
    lines.push('  }')
  }

  if (tokens.dimensions?.sizing?.stroke) {
    lines.push('  enum sizing {')
    lines.push('    enum stroke {')
    for (const key of ['sm', 'md', 'lg']) {
      const token = tokens.dimensions.sizing.stroke[key]
      if (token?.$value !== undefined) {
        lines.push(`      static let ${key}: CGFloat = ${token.$value}`)
      }
    }
    lines.push('    }')
    lines.push('  }')
  }

  if (tokens.mapbox?.style) {
    lines.push('  enum map {')
    lines.push('    enum style {')
    lines.push(
      `      static let light: String = ${JSON.stringify(tokens.mapbox.style.light.$value)}`,
    )
    lines.push(`      static let dark: String = ${JSON.stringify(tokens.mapbox.style.dark.$value)}`)
    lines.push('    }')
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
  const themeModes = loadThemeModes()
  const colorTree = buildKotlinColorTree(tokens, themeModes)
  const mapLight = themeGroup(themeModes.light, 'map')
  const mapDark = themeGroup(themeModes.dark, 'map')

  // Header
  lines.push('// GENERATED by tokens/scripts/generate.ts — do not edit by hand')
  lines.push(`// input-hash: ${inputHash}`)
  lines.push('')
  lines.push('package com.laneshadow.theme.generated')
  lines.push('')
  lines.push('import androidx.compose.ui.graphics.Color')
  lines.push('import androidx.compose.ui.text.TextStyle')
  lines.push('import androidx.compose.ui.text.font.FontWeight')
  lines.push('import androidx.compose.ui.unit.dp')
  lines.push('import androidx.compose.ui.unit.sp')
  lines.push('import com.laneshadow.theme.LaneShadowFontFamilies')
  lines.push('')
  lines.push('object LaneShadowTheme {')

  // Colors
  if (Object.keys(colorTree).length > 0) {
    lines.push('  object color {')
    for (const [groupName, group] of Object.entries(colorTree)) {
      if (isColorToken(group)) continue
      lines.push(`    object ${pascalCaseName(groupName)} {`)
      emitKotlinColorMembers(lines, group, '      ', 'light')
      if (hasDirectColorLeaves(group)) {
        lines.push('      object dark {')
        emitKotlinColorMembers(lines, group, '        ', 'dark')
        lines.push('      }')
      }
      lines.push('    }')
    }
    lines.push('  }')
  }

  if (Object.keys(mapLight).length > 0) {
    lines.push('  object map {')
    for (const [name, value] of Object.entries(mapLight)) {
      if (typeof value === 'string') {
        lines.push(`    val ${camelCaseName(name)} = Color(${toKotlinColorArgs(value)})`)
      }
    }
    if (Object.keys(mapDark).length > 0) {
      lines.push('    object dark {')
      for (const [name, value] of Object.entries(mapDark)) {
        if (typeof value === 'string') {
          lines.push(`      val ${camelCaseName(name)} = Color(${toKotlinColorArgs(value)})`)
        }
      }
      lines.push('    }')
    }
    if (!tokens.mapbox?.style) {
      throw new Error(
        'Required mapbox style tokens are missing from tokens/semantic/mapbox.tokens.json',
      )
    }
    lines.push('    object style {')
    lines.push(`      const val light = "${tokens.mapbox.style.light.$value}"`)
    lines.push(`      const val dark = "${tokens.mapbox.style.dark.$value}"`)
    lines.push('    }')
    lines.push('  }')
  }

  // Typography
  if (tokens.typography) {
    lines.push('  object typography {')

    const emitTypographyToken = (name: string, token: TypographyToken) => {
      const weight = mapWeight(token.weight)
      const family =
        token.family === 'opinion'
          ? 'LaneShadowFontFamilies.newsreader'
          : token.family === 'instrument'
            ? 'LaneShadowFontFamilies.jetBrainsMono'
            : 'LaneShadowFontFamilies.geist'
      const kotlinWeight =
        weight < 200
          ? 'Thin'
          : weight < 300
            ? 'ExtraLight'
            : weight < 400
              ? 'Light'
              : weight < 500
                ? 'Normal'
                : weight < 600
                  ? 'Medium'
                  : weight < 700
                    ? 'SemiBold'
                    : weight < 800
                      ? 'Bold'
                      : weight < 900
                        ? 'ExtraBold'
                        : 'Black'

      lines.push(`      val ${name} = TextStyle(`)
      lines.push(`        fontSize = ${token.size}.sp,`)
      lines.push(`        lineHeight = ${token.lineHeight}.sp,`)
      lines.push(`        fontWeight = FontWeight.${kotlinWeight},`)
      lines.push(`        letterSpacing = ${token.letterSpacing}.sp,`)
      lines.push(`        fontFamily = ${family},`)
      lines.push('      )')
    }

    const typo = tokens.typography
    const isToken = (v: any): v is TypographyToken =>
      typeof v === 'object' && v !== null && typeof v.size === 'number'

    if (typo.opinion) {
      lines.push('    object opinion {')
      for (const [name, token] of Object.entries(typo.opinion)) {
        if (name.startsWith('$') || !isToken(token)) continue
        emitTypographyToken(name, token)
      }
      lines.push('    }')
    }
    if (typo.ui) {
      lines.push('    object ui {')
      for (const [category, variants] of Object.entries(typo.ui)) {
        if (category.startsWith('$') || typeof variants !== 'object' || !variants) continue
        lines.push(`    object ${category} {`)
        for (const [size, token] of Object.entries(variants)) {
          if (size.startsWith('$') || !isToken(token)) continue
          emitTypographyToken(size, token)
        }
        lines.push('    }')
      }
      lines.push('    }')
    }
    if (typo.instrument) {
      lines.push('    object instrument {')
      for (const [name, token] of Object.entries(typo.instrument)) {
        if (name.startsWith('$') || !isToken(token)) continue
        emitTypographyToken(name, token)
      }
      lines.push('    }')
    }

    lines.push('  }')
  }

  // Dimensions required by native atom contracts.
  if (
    tokens.dimensions?.sizing?.icon ||
    tokens.dimensions?.sizing?.iconStroke ||
    tokens.dimensions?.sizing?.stroke
  ) {
    const iconSize = tokens.dimensions.sizing.icon ?? {}
    const strokeSize = tokens.dimensions.sizing.stroke ?? {}
    const iconStroke = tokens.dimensions.sizing.iconStroke ?? {}
    lines.push('  object sizing {')
    lines.push('    object icon {')
    for (const key of ['xs', 'sm', 'md', 'lg', 'xl']) {
      const token = iconSize[key]
      if (token?.$value !== undefined) {
        lines.push(`      val ${key} = ${token.$value}.dp`)
      }
    }
    lines.push('    }')
    if (Object.keys(strokeSize).length > 0) {
      lines.push('    object stroke {')
      for (const key of ['sm', 'md', 'lg']) {
        const token = strokeSize[key]
        if (token?.$value !== undefined) {
          lines.push(`      val ${key} = ${token.$value}.dp`)
        }
      }
      lines.push('    }')
    }
    lines.push('  }')
    lines.push('  object icon {')
    lines.push('    object stroke {')
    lines.push(`      val width = ${iconStroke.width?.$value ?? 1.5}.dp`)
    lines.push('    }')
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
        const key = toTypeScriptKey(name)
        if (typeof value === 'object' && 'light' in value && 'dark' in value) {
          const colorToken = value as ColorToken
          lines.push(`${padding}${key}: {`)
          lines.push(`${padding}  light: '${colorToken.light}',`)
          lines.push(`${padding}  dark: '${colorToken.dark}'`)
          lines.push(`${padding}},`)
        } else if (typeof value === 'object') {
          lines.push(`${padding}${key}: {`)
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
      lines.push(`${padding}${toTypeScriptKey(name)}: {`)
      lines.push(`${padding}  family: '${mapFontFamily(token.family)}',`)
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
        lines.push(`      ${toTypeScriptKey(category)}: {`)
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
      lines.push(`      '${icon}',`)
    }
    lines.push('    ]')
    lines.push('  },')
  }

  lines.push('} as const')
  lines.push('')
  lines.push('export type Tokens = typeof tokens')

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
    lines.push(`  light: '${style.light.$value}', // ${style.light.$description}`)
    lines.push(`  dark: '${style.dark.$value}', // ${style.dark.$description}`)
  }

  lines.push('} as const')
  lines.push('')
  lines.push('export type MapboxStyleUrls = typeof mapboxStyleUrls')

  return lines.join('\n')
}

// ============================================================================
// BUNDLED V1 JSON EMITTER (for Theme.swift runtime consumption)
// ============================================================================

const BUNDLED_JSON_OUTPUT = path.join(SEMANTIC_DIR, 'semantic.tokens.json')
const BUNDLED_JSON_SPM_OUTPUT = path.join(
  PLATFORMS_DIR,
  'swift',
  'Sources',
  'LaneShadowTheme',
  'Resources',
  'semantic.tokens.json',
)
const BUNDLED_JSON_ANDROID_OUTPUT = path.join(
  PLATFORMS_DIR,
  'kotlin',
  'src',
  'main',
  'assets',
  'semantic.tokens.json',
)

function dimToken(value: number): { $type: string; $value: number } {
  return { $type: 'dimension', $value: value }
}

function strToken(value: string): { $type: string; $value: string } {
  return { $type: 'string', $value: value }
}

function numToken(value: number): { $type: string; $value: number } {
  return { $type: 'number', $value: value }
}

function easingToken(value: number[]): { $type: string; $value: number[] } {
  return { $type: 'cubicBezier', $value: value }
}

function emitBundledJSON(tokens: SemanticTokens): object {
  const v2Colors = tokens.color ?? {}
  const v2Dims = tokens.dimensions ?? {}
  const v2Motion = tokens.motion ?? {}
  const v2Typo = tokens.typography ?? {}

  // --- V2 COLOR FLATTENER ---
  // Flatten nested V2 color categories to { "category.name": { light, dark } }
  const flatColors: Record<string, { light: string; dark: string }> = {}
  const flatten = (obj: Record<string, any>, prefix: string) => {
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith('$')) continue
      const key = prefix ? `${prefix}.${k}` : k
      if (typeof v === 'object' && 'light' in v && 'dark' in v) {
        flatColors[key] = v as { light: string; dark: string }
      } else if (typeof v === 'object' && !Array.isArray(v)) {
        flatten(v, key)
      }
    }
  }
  flatten(v2Colors as any, '')

  // Helper: build ColorStatesDef from light/dark pair
  const colorState = (
    light: string,
    dark: string,
  ): { default: { $type: string; $value: string } } => ({
    default: { $type: 'color', $value: light },
  })

  // Helper: build ColorStatesDef with hover/pressed from V2 action states
  const colorStateWithStates = (
    defLight: string,
    defDark: string,
    hoverLight?: string,
    hoverDark?: string,
    pressedLight?: string,
    pressedDark?: string,
  ) => {
    const s: Record<string, any> = { default: { $type: 'color', $value: defLight } }
    if (hoverLight) s.hover = { $type: 'color', $value: hoverLight }
    if (pressedLight) s.pressed = { $type: 'color', $value: pressedLight }
    return s
  }

  // Build light/dark color dicts
  const lightColors: Record<string, any> = {}
  const darkColors: Record<string, any> = {}

  const addColor = (v1Key: string, v2Key: string, hoverV2Key?: string, pressedV2Key?: string) => {
    const c = flatColors[v2Key]
    if (!c) return
    const hover = hoverV2Key ? flatColors[hoverV2Key] : undefined
    const pressed = pressedV2Key ? flatColors[pressedV2Key] : undefined
    lightColors[v1Key] = colorStateWithStates(
      c.light,
      c.dark,
      hover?.light,
      hover?.dark,
      pressed?.light,
      pressed?.dark,
    )
    darkColors[v1Key] = colorStateWithStates(
      c.dark,
      c.dark,
      hover?.dark,
      hover?.dark,
      pressed?.dark,
      pressed?.dark,
    )
  }

  // Map V2 colors → V1 keys
  addColor('primary', 'signal.default')
  addColor('secondary', 'surface.inset')
  addColor('tertiary', 'status.info.default')
  addColor('success', 'status.success.default')
  addColor('warning', 'status.warning.default')
  addColor('warningContainer', 'signal.whisper')
  addColor('onWarningContainer', 'content.primary')
  addColor('danger', 'status.error.default')
  addColor('info', 'status.info.default')
  addColor('surface', 'surface.primary')
  addColor('surfaceVariant', 'surface.card')
  addColor('background', 'surface.primary')
  addColor('onSurface', 'content.primary')
  addColor('onPrimary', 'content.onSignal')
  addColor('onSecondary', 'content.secondary')
  addColor('secondaryContainer', 'signal.tint')
  addColor('onSecondaryContainer', 'content.primary')
  addColor('border', 'border.default')
  addColor('input', 'surface.inset')
  addColor('ring', 'border.focus')
  addColor('card', 'surface.card')
  addColor('popover', 'surface.card')
  addColor('accent', 'action.primary.default', 'action.primary.hover', 'action.primary.pressed')
  addColor('orange', 'signal.default')
  addColor('muted', 'surface.inset')
  addColor('divider', 'border.subtle')
  addColor('scrim', 'surface.scrim')
  addColor('routeSelected', 'route.best')
  addColor('routeAlternate', 'route.alt1')

  // Domain colors (location, waypoint, enrichment, deviation)
  addColor('locationPoiFill', 'signal.default')
  addColor('locationPoiRing', 'signal.pressed')
  addColor('locationPoiMuted', 'signal.whisper')
  addColor('locationPoiBg', 'surface.card')
  addColor('waypointOnRoute', 'route.best')
  addColor('waypointOffRoute', 'route.alt2')
  addColor('waypointMixed', 'weather.clear.default')
  addColor('enrichmentFast', 'weather.rain.default')
  addColor('enrichmentExtended', 'weather.storm.default')
  addColor('enrichmentCached', 'status.success.default')
  addColor('deviationOriginalRoute', 'route.alt1')
  addColor('deviationDetourPath', 'route.alt2')
  addColor('deviationReconnectPoint', 'status.info.default')

  // --- SPACE ---
  const spacing = v2Dims.spacing ?? {}
  const spaceMap: Record<string, string> = {
    xs: '2',
    sm: '3',
    md: '4',
    lg: '5',
    xl: '7',
    '2xl': '8',
    '3xl': '10',
    '4xl': '12',
  }
  const space: Record<string, any> = {}
  for (const [v1Key, v2Key] of Object.entries(spaceMap)) {
    const t = spacing[v2Key]
    if (t) space[v1Key] = dimToken(t.$value)
  }

  // --- RADIUS ---
  const v2Radius = v2Dims.radius ?? {}
  const radius: Record<string, any> = {}
  const radiusMap: Record<string, string> = {
    none: 'none',
    sm: 'sm',
    md: 'md',
    lg: 'lg',
    xl: 'xl',
  }
  for (const [v1Key, v2Key] of Object.entries(radiusMap)) {
    const t = v2Radius[v2Key]
    if (t) radius[v1Key] = dimToken(t.$value)
  }
  radius['2xl'] = dimToken(32)
  radius.full = dimToken(9999)

  // --- TYPOGRAPHY (type) ---
  // Schema requires integer values for fontSize and lineHeight
  const intDimToken = (value: number): { $type: string; $value: number } => ({
    $type: 'dimension',
    $value: Math.round(value),
  })

  const typeStyle = (
    token: TypographyToken,
  ): {
    fontSize: { $type: string; $value: number }
    lineHeight: { $type: string; $value: number }
    fontWeight: { $type: string; $value: string }
  } => ({
    fontSize: intDimToken(token.size),
    lineHeight: intDimToken(token.lineHeight),
    fontWeight: strToken(token.weight),
  })

  const typeVariants = (sm: TypographyToken, md: TypographyToken, lg: TypographyToken) => ({
    sm: typeStyle(sm),
    md: typeStyle(md),
    lg: typeStyle(lg),
  })

  const type: Record<string, any> = {}
  if (v2Typo.ui) {
    if (v2Typo.ui.label) {
      type.label = typeVariants(v2Typo.ui.label.sm, v2Typo.ui.label.md, v2Typo.ui.label.lg)
    }
    if (v2Typo.ui.body) {
      type.body = typeVariants(v2Typo.ui.body.sm, v2Typo.ui.body.md, v2Typo.ui.body.lg)
    }
    if (v2Typo.ui.title) {
      type.title = typeVariants(v2Typo.ui.title.sm, v2Typo.ui.title.md, v2Typo.ui.title.lg)
    }
  }
  if (v2Typo.opinion) {
    // heading: synthesize from opinion tokens
    type.heading = typeVariants(v2Typo.opinion.sm, v2Typo.opinion.md, v2Typo.opinion.lg)
    // display: synthesize from opinion tokens
    type.display = typeVariants(v2Typo.opinion.md, v2Typo.opinion.lg, v2Typo.opinion.xl)
  }

  // --- ELEVATION ---
  // V2 has numeric z-index values; V1 needs full shadow specs
  // Synthesize shadow properties from elevation level
  const elevationLevel = (level: number) => {
    if (level === 0) {
      return {
        shadowColor: strToken('transparent'),
        shadowOffset: {
          width: dimToken(0),
          height: dimToken(0),
        },
        shadowOpacity: dimToken(0),
        shadowRadius: dimToken(0),
        elevation: dimToken(0),
      }
    }
    return {
      shadowColor: strToken('#000000'),
      shadowOffset: {
        width: dimToken(0),
        height: dimToken(level),
      },
      shadowOpacity: dimToken(0.15 + level * 0.03),
      shadowRadius: dimToken(level * 3),
      elevation: dimToken(level),
    }
  }

  const elevation = {
    light: {
      '0': elevationLevel(0),
      '1': elevationLevel(1),
      '2': elevationLevel(2),
      '3': elevationLevel(3),
      '4': elevationLevel(4),
      '5': elevationLevel(5),
      '8': elevationLevel(8),
    },
    dark: {
      '0': elevationLevel(0),
      '1': elevationLevel(1),
      '2': elevationLevel(2),
      '3': elevationLevel(3),
      '4': elevationLevel(4),
      '5': elevationLevel(5),
      '8': elevationLevel(8),
    },
  }

  // --- MOTION ---
  const v2Durations = v2Motion.duration ?? {}
  const v2Easings = v2Motion.easing ?? {}
  const motion = {
    duration: {
      instant: dimToken(v2Durations.instant?.$value ?? 0),
      fast: dimToken(v2Durations.fast?.$value ?? 120),
      normal: dimToken(200),
      slow: dimToken(v2Durations.slow?.$value ?? 300),
      slower: dimToken(v2Durations.deliberate?.$value ?? 400),
      fade: dimToken(300),
      highlight: dimToken(500),
    },
    easing: {
      standard: easingToken(v2Easings.standard?.$value ?? [0.4, 0, 0.2, 1]),
      emphasized: easingToken(v2Easings.emphasized?.$value ?? [0.2, 0, 0, 1]),
      decelerate: easingToken(v2Easings.decelerated?.$value ?? [0, 0, 0.2, 1]),
      accelerate: easingToken(v2Easings.accelerated?.$value ?? [0.4, 0, 1, 1]),
      sharp: easingToken([0.4, 0, 0.6, 1]),
    },
  }

  // --- OPACITY ---
  const v2Opacity = v2Dims.opacity ?? {}
  const opacity: Record<string, any> = {
    // Numeric steps
    '0': numToken(0),
    '5': numToken(0.05),
    '10': numToken(0.1),
    '20': numToken(0.2),
    '30': numToken(0.3),
    '40': numToken(0.4),
    '50': numToken(0.5),
    '60': numToken(0.6),
    '70': numToken(0.7),
    '80': numToken(0.8),
    '90': numToken(0.9),
    '100': numToken(1),
    // Semantic names
    disabled: numToken(v2Opacity.disabled?.$value ?? 0.5),
    overlay: numToken(v2Opacity.overlay?.$value ?? 0.5),
    shadow: numToken(0.15),
    shadowPrimary: numToken(0.4),
    actionIdle: numToken(0.2),
    actionPressed: numToken(0.3),
    border: numToken(0.3),
    container: numToken(0.15),
    pressed: numToken(0.7),
    pressedStrong: numToken(0.8),
    surface: numToken(0.85),
  }

  // --- BORDER WIDTH ---
  const v2Stroke = v2Dims.sizing?.stroke ?? {}
  const borderWidth: Record<string, any> = {
    hairline: dimToken(0.5),
    thin: dimToken(v2Stroke.sm?.$value ?? 1),
    normal: dimToken(v2Stroke.md?.$value ?? 2),
    thick: dimToken(v2Stroke.lg?.$value ?? 3),
  }

  // --- CONTROL ---
  const control: Record<string, any> = {
    minHeight: dimToken(v2Dims.sizing?.component?.buttonHeight?.$value ?? 44),
    minTouchTarget: dimToken(v2Dims.sizing?.touchTarget?.ios?.$value ?? 44),
  }

  // --- HIT SLOP ---
  const hitSlop: Record<string, any> = {
    all: dimToken(4),
    small: dimToken(4),
    medium: dimToken(8),
    large: dimToken(12),
  }

  // --- ICON SIZE ---
  const v2IconSize = v2Dims.sizing?.icon ?? {}
  const iconSize: Record<string, any> = {
    xsmall: dimToken(v2IconSize.xs?.$value ?? 12),
    small: dimToken(v2IconSize.sm?.$value ?? 16),
    medium: dimToken(v2IconSize.md?.$value ?? 20),
    large: dimToken(v2IconSize.lg?.$value ?? 24),
    xlarge: dimToken(v2IconSize.xl?.$value ?? 32),
  }

  // --- SHADOW (flat dimension tokens — matches Swift SemanticTokens.shadow: [String: DimensionToken]) ---
  const shadow: Record<string, any> = {
    xsmall: dimToken(2),
    small: dimToken(4),
    medium: dimToken(8),
    large: dimToken(16),
    xlarge: dimToken(24),
  }

  // --- SIZE (general component sizes) ---
  const size: Record<string, any> = {
    xsmall: dimToken(16),
    small: dimToken(24),
    medium: dimToken(32),
    large: dimToken(48),
    xlarge: dimToken(64),
  }

  // --- STROKE WIDTH ---
  const strokeWidth: Record<string, any> = {
    hairline: dimToken(0.5),
    thin: dimToken(1),
    normal: dimToken(1.5),
    thick: dimToken(2),
  }

  // --- TOUCH TARGET ---
  const touchTarget: Record<string, any> = {
    minTouchTarget: dimToken(v2Dims.sizing?.touchTarget?.ios?.$value ?? 44),
  }

  return {
    semantic: {
      color: { light: lightColors, dark: darkColors },
      space,
      radius,
      type,
      elevation,
      motion,
      opacity,
      borderWidth,
      control,
      hitSlop,
      iconSize,
      shadow,
      size,
      strokeWidth,
      touchTarget,
    },
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
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
  const kotlinInputHash = generateKotlinInputHash(tokens, icons, fonts)
  console.log(`  🔐 Input hash: ${inputHash}`)
  console.log(`  🤖 Kotlin input hash: ${kotlinInputHash}`)

  // Ensure output directories exist
  fs.mkdirSync(path.dirname(SWIFT_OUTPUT), { recursive: true })
  fs.mkdirSync(path.dirname(KOTLIN_OUTPUT), { recursive: true })
  fs.mkdirSync(path.dirname(TS_OUTPUT), { recursive: true })
  fs.mkdirSync(path.dirname(MAPBOX_OUTPUT), { recursive: true })
  fs.mkdirSync(path.dirname(BUNDLED_JSON_OUTPUT), { recursive: true })
  fs.mkdirSync(path.dirname(BUNDLED_JSON_SPM_OUTPUT), { recursive: true })
  fs.mkdirSync(path.dirname(BUNDLED_JSON_ANDROID_OUTPUT), { recursive: true })

  // Emit Swift
  console.log('  📱 Emitting Swift tokens...')
  const swift = emitSwift(tokens, icons, fonts, inputHash)
  fs.writeFileSync(SWIFT_OUTPUT, `${swift}\n`)
  try {
    const { execFileSync } = await import('node:child_process')
    execFileSync('swiftformat', [SWIFT_OUTPUT], {
      cwd: ROOT,
      stdio: 'pipe',
    })
  } catch {
    // SwiftFormat not available — output remains valid, but hooks may reformat it later.
  }

  // Emit Kotlin
  console.log('  🤖 Emitting Kotlin tokens...')
  const kotlin = emitKotlin(tokens, icons, fonts, kotlinInputHash)
  fs.writeFileSync(KOTLIN_OUTPUT, `${kotlin}\n`)

  // Emit TypeScript
  console.log('  🌐 Emitting TypeScript tokens...')
  const ts = emitTypeScript(tokens, icons, fonts, inputHash)
  fs.writeFileSync(TS_OUTPUT, `${ts}\n`)

  // Emit Mapbox URLs
  console.log('  🗺️  Emitting Mapbox style URLs...')
  const mapbox = emitMapboxTS(tokens, inputHash)
  fs.writeFileSync(MAPBOX_OUTPUT, `${mapbox}\n`)

  // Emit bundled V1 JSON for Theme.swift runtime
  console.log('  📋 Emitting bundled V1 JSON for native runtime...')
  const bundledJson = emitBundledJSON(tokens)
  let bundledJsonStr = `${JSON.stringify(bundledJson, null, 2)}\n`
  // Collapse short numeric arrays (e.g. cubic-bezier values) to single lines for biome compliance
  bundledJsonStr = bundledJsonStr.replace(
    /\[\n\s+(\d+\.?\d*)(,\n\s+(\d+\.?\d*)){1,5}\n\s+\]/g,
    (match) => {
      const nums = [...match.matchAll(/\d+\.?\d*/g)].map((m) => m[0])
      return `[${nums.join(', ')}]`
    },
  )
  fs.writeFileSync(BUNDLED_JSON_OUTPUT, bundledJsonStr)
  fs.writeFileSync(BUNDLED_JSON_SPM_OUTPUT, bundledJsonStr)
  fs.writeFileSync(BUNDLED_JSON_ANDROID_OUTPUT, bundledJsonStr)

  // Format TS outputs with biome for consistent style
  try {
    const { execSync } = await import('node:child_process')
    execSync('pnpm exec biome format --write tokens/platforms/web/', {
      cwd: ROOT,
      stdio: 'pipe',
    })
  } catch {
    // Biome not available — outputs are still valid, just may not match lint exactly
  }

  console.log('✅ Token generation complete!')
  console.log('')
  console.log('Generated files:')
  console.log(`  - ${SWIFT_OUTPUT}`)
  console.log(`  - ${KOTLIN_OUTPUT}`)
  console.log(`  - ${TS_OUTPUT}`)
  console.log(`  - ${MAPBOX_OUTPUT}`)
  console.log(`  - ${BUNDLED_JSON_OUTPUT}`)
  console.log(`  - ${BUNDLED_JSON_SPM_OUTPUT}`)
  console.log(`  - ${BUNDLED_JSON_ANDROID_OUTPUT}`)
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
