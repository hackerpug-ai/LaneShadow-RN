/* eslint-disable no-console */
/**
 * Bootstrap script (one-time) to extract the current RN semantic theme literals
 * from `react-native/styles/theme.ts` into W3C-DTCG-shaped JSON under `tokens/`.
 *
 * After UI-001, `tokens/**` is the source of truth. This script exists only to
 * avoid hand-copy errors during the initial lock-in.
 */

const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const REPO_ROOT = path.resolve(__dirname, '..')
const THEME_TS_PATH = path.join(REPO_ROOT, 'react-native/styles/theme.ts')
const OUT_PATH = path.join(REPO_ROOT, 'tokens/semantic/semantic.tokens.json')

function findIndexOrThrow(haystack, needle, fromIndex = 0) {
  const idx = haystack.indexOf(needle, fromIndex)
  if (idx === -1) throw new Error(`Could not find needle: ${needle}`)
  return idx
}

function sliceBalancedBraces(source, startIndex) {
  // startIndex should point at "{"
  if (source[startIndex] !== '{') {
    throw new Error(`Expected "{" at ${startIndex}`)
  }

  let i = startIndex
  let depth = 0
  let inSingle = false
  let inDouble = false
  let inTemplate = false
  let escaped = false

  for (; i < source.length; i++) {
    const ch = source[i]

    if (escaped) {
      escaped = false
      continue
    }
    if (ch === '\\') {
      escaped = true
      continue
    }

    if (!inDouble && !inTemplate && ch === "'" && !inSingle) {
      inSingle = true
      continue
    } else if (inSingle && ch === "'") {
      inSingle = false
      continue
    }

    if (!inSingle && !inTemplate && ch === '"' && !inDouble) {
      inDouble = true
      continue
    } else if (inDouble && ch === '"') {
      inDouble = false
      continue
    }

    if (!inSingle && !inDouble && ch === '`' && !inTemplate) {
      inTemplate = true
      continue
    } else if (inTemplate && ch === '`') {
      inTemplate = false
      continue
    }

    if (inSingle || inDouble || inTemplate) continue

    if (ch === '{') depth++
    if (ch === '}') depth--
    if (depth === 0) {
      return source.slice(startIndex, i + 1)
    }
  }

  throw new Error('Unbalanced braces while slicing object literal')
}

function extractObjectLiteral(source, startNeedle) {
  const declIdx = findIndexOrThrow(source, startNeedle)
  const braceIdx = findIndexOrThrow(source, '{', declIdx)
  return sliceBalancedBraces(source, braceIdx)
}

function dtcgWrap(value) {
  const isColor =
    typeof value === 'string' &&
    (value.startsWith('#') || value.startsWith('rgba(') || value.startsWith('rgb('))

  const type =
    typeof value === 'number'
      ? 'dimension'
      : isColor
        ? 'color'
        : typeof value === 'string'
          ? 'string'
          : 'object'

  return { $type: type, $value: value }
}

function toDtcgTree(node) {
  if (
    node === null ||
    typeof node === 'string' ||
    typeof node === 'number' ||
    typeof node === 'boolean'
  ) {
    return dtcgWrap(node)
  }
  if (Array.isArray(node)) {
    return dtcgWrap(node)
  }
  const out = {}
  for (const [k, v] of Object.entries(node)) {
    out[k] = toDtcgTree(v)
  }
  return out
}

function main() {
  const source = fs.readFileSync(THEME_TS_PATH, 'utf8')

  const spacingLiteral = extractObjectLiteral(source, 'export const SPACING')
  const radiusLiteral = extractObjectLiteral(source, 'export const BORDER_RADIUS')
  const lightSemanticLiteral = extractObjectLiteral(source, 'const lightSemanticTheme')
  const darkSemanticLiteral = extractObjectLiteral(source, 'const darkSemanticTheme')

  const sandbox = {
    SPACING: undefined,
    BORDER_RADIUS: undefined,
    lightSemanticTheme: undefined,
    darkSemanticTheme: undefined,
  }

  const bootstrapJs = `
    const SPACING = ${spacingLiteral};
    const BORDER_RADIUS = ${radiusLiteral};
    const createColorSet = (base, hover, pressed, disabled, focus) => ({
      default: base,
      ...(hover ? { hover } : {}),
      ...(pressed ? { pressed } : {}),
      ...(disabled ? { disabled } : {}),
      ...(focus ? { focus } : {}),
    });
    const lightSemanticTheme = ${lightSemanticLiteral};
    const darkSemanticTheme = ${darkSemanticLiteral};
    this.__out = { SPACING, BORDER_RADIUS, lightSemanticTheme, darkSemanticTheme };
  `

  vm.runInNewContext(bootstrapJs, sandbox, { timeout: 2000 })
  const { lightSemanticTheme, darkSemanticTheme } = sandbox.__out

  const tokens = {
    semantic: {
      color: {
        light: lightSemanticTheme.color,
        dark: darkSemanticTheme.color,
      },
      space: lightSemanticTheme.space,
      radius: lightSemanticTheme.radius,
      type: lightSemanticTheme.type,
      elevation: {
        light: lightSemanticTheme.elevation,
        dark: darkSemanticTheme.elevation,
      },
      motion: {
        duration: {
          instant: 0,
          fast: 120,
          normal: 200,
          slow: 300,
          slower: 400,
        },
        easing: {
          // Cubic-bezier control points.
          standard: [0.2, 0.0, 0.0, 1.0],
          emphasized: [0.2, 0.0, 0.0, 1.0],
          decelerate: [0.0, 0.0, 0.2, 1.0],
          accelerate: [0.4, 0.0, 1.0, 1.0],
          sharp: [0.4, 0.0, 0.6, 1.0],
        },
      },
      opacity: {
        0: 0,
        5: 0.05,
        10: 0.1,
        20: 0.2,
        30: 0.3,
        40: 0.4,
        50: 0.5,
        60: 0.6,
        70: 0.7,
        80: 0.8,
        90: 0.9,
        100: 1,
      },
    },
  }

  const dtcg = toDtcgTree(tokens)

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(dtcg, null, 2)}\n`, 'utf8')

  process.stdout.write(`Wrote ${path.relative(REPO_ROOT, OUT_PATH)}\n`)
}

main()
