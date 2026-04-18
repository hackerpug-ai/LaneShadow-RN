# Cross-Platform Theme Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-source-of-truth theme module: Style Dictionary v4 compiles `tokens/semantic/semantic.tokens.json` into three sibling platform packages under `tokens/platforms/{swift,kotlin,typescript}/`, each containing generated constants + hand-written theming logic. Bootstrap iOS and Android apps consume the module end-to-end. RN cutover deferred.

**Architecture:** Three-layer pipeline — JSON source → SD codegen → per-platform module. iOS imports as Local Swift Package; Android includes as Gradle subproject from a relative path; TypeScript joins the existing pnpm workspace. Generated files are committed; CI fails on drift.

**Tech Stack:** Style Dictionary v4 (Node.js), Swift Package Manager (Swift 5.9+ / SwiftUI), Gradle KTS (com.android.library, Kotlin 1.9.24, Compose Compiler 1.5.14, Material3 BOM 2024.06.00), pnpm workspace (TypeScript 5.9), Node.js built-in `node:test`.

**Spec:** [`.spec/prds/native-rewrite/08e-cross-platform-theme-module.md`](./08e-cross-platform-theme-module.md)

---

## File Structure

### New files

| Path | Responsibility |
|---|---|
| `tokens/config/style-dictionary.config.js` | SD v4 config: source, three platform targets, custom formats |
| `tokens/config/formats/swift-tokens.js` | Custom format → nested Swift `enum Tokens { ... }` namespace |
| `tokens/config/formats/kotlin-tokens.js` | Custom format → nested Kotlin `object Tokens { ... }` namespace |
| `tokens/config/formats/typescript-tokens.js` | Custom format → `export const tokens = { ... } as const` |
| `tokens/config/formats/__tests__/swift-tokens.test.js` | `node:test` unit tests for Swift formatter |
| `tokens/config/formats/__tests__/kotlin-tokens.test.js` | `node:test` unit tests for Kotlin formatter |
| `tokens/config/formats/__tests__/typescript-tokens.test.js` | `node:test` unit tests for TS formatter |
| `tokens/scripts/build.js` | Invoke SD; ensures all three outputs are written |
| `tokens/scripts/check-drift.js` | Regenerate to `/tmp` + diff against committed; non-zero exit on diff |
| `tokens/platforms/swift/Package.swift` | SPM manifest for `LaneShadowTheme` library product |
| `tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift` | Generated namespaced enum constants |
| `tokens/platforms/swift/Sources/LaneShadowTheme/Theme.swift` | `struct Theme` + light/dark resolution + `Theme.shared` |
| `tokens/platforms/swift/Sources/LaneShadowTheme/ThemeEnvironment.swift` | `EnvironmentValues.theme` + `View.laneShadowTheme()` |
| `tokens/platforms/swift/Sources/LaneShadowTheme/DomainColors.swift` | Domain color groups (waypoint/enrichment/deviation) |
| `tokens/platforms/swift/Tests/LaneShadowThemeTests/ThemeTests.swift` | Swift unit tests |
| `tokens/platforms/kotlin/build.gradle.kts` | `com.android.library` module manifest |
| `tokens/platforms/kotlin/src/main/AndroidManifest.xml` | Minimal manifest for the library module |
| `tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/generated/Tokens.kt` | Generated namespaced object constants |
| `tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/LaneShadowTheme.kt` | Composable + `LocalLaneShadowTheme` + MaterialTheme wrapping |
| `tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/LaneShadowColors.kt` | `data class LaneShadowColors` + `ColorSet` |
| `tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/DomainColors.kt` | Domain color groups |
| `tokens/platforms/kotlin/src/test/kotlin/com/laneshadow/theme/ColorSetTest.kt` | JVM unit tests for ColorSet shape |
| `tokens/platforms/typescript/package.json` | `@laneshadow/theme` workspace package |
| `tokens/platforms/typescript/tsconfig.json` | TS config (matches `react-native/tsconfig.json` strictness) |
| `tokens/platforms/typescript/src/generated/tokens.ts` | Generated `tokens` const object |
| `tokens/platforms/typescript/src/index.ts` | `useTheme()` hook + re-exports |
| `tokens/platforms/typescript/src/types.ts` | Derived `Theme`, `ColorSet` types |

### Modified files

| Path | Change |
|---|---|
| `package.json` | Add `style-dictionary` dev dep; add `build:tokens`, `tokens:check-drift` scripts |
| `pnpm-workspace.yaml` | Add `tokens/platforms/typescript` package |
| `lefthook.yml` | Add `tokens:check-drift` job under `pre-commit` |
| `ios/LaneShadow.xcodeproj/project.pbxproj` | Add local SPM ref to `../tokens/platforms/swift`; remove placeholder `Theme.swift` ref |
| `ios/LaneShadow/App.swift` | Add `.laneShadowTheme()` modifier |
| `ios/LaneShadow/ContentView.swift` | Replace placeholder `Theme*` enums with `@Environment(\.theme)` consumption |
| `android/settings.gradle.kts` | `include(":theme")` + projectDir mapping |
| `android/app/build.gradle.kts` | `implementation(project(":theme"))` |
| `android/app/src/main/java/com/laneshadow/MainActivity.kt` | Wrap content in `LaneShadowTheme { }` |

### Deleted files

| Path | Reason |
|---|---|
| `ios/LaneShadow/Theme.swift` | Placeholder enums replaced by `LaneShadowTheme` package |

---

## Phase 1 — Codegen Foundation

### Task 1: Install Style Dictionary v4

**Files:**
- Modify: `/Users/justinrich/Projects/LaneShadow/package.json`

- [ ] **Step 1: Install style-dictionary as dev dependency**

```bash
cd /Users/justinrich/Projects/LaneShadow
pnpm add -D -w style-dictionary@^4.0.0
```

- [ ] **Step 2: Verify version installed**

```bash
node -e "console.log(require('style-dictionary/package.json').version)"
```
Expected: `4.x.x`

- [ ] **Step 3: Verify it can import in CommonJS context**

```bash
node -e "const SD = require('style-dictionary'); console.log(typeof SD.default || typeof SD)"
```
Expected: `function` (constructor)

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "deps: add style-dictionary v4 for token codegen"
```

---

### Task 2: Custom TypeScript formatter (RED → GREEN)

Start here because the TS formatter is the simplest type system to verify.

**Files:**
- Create: `/Users/justinrich/Projects/LaneShadow/tokens/config/formats/typescript-tokens.js`
- Test: `/Users/justinrich/Projects/LaneShadow/tokens/config/formats/__tests__/typescript-tokens.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tokens/config/formats/__tests__/typescript-tokens.test.js
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { formatTypeScript } = require('../typescript-tokens.js')

const sampleDict = {
  tokens: {
    semantic: {
      color: {
        light: {
          primary: {
            default: { $type: 'color', $value: '#B87333' },
            hover: { $type: 'color', $value: '#C58545' },
          },
        },
      },
      space: {
        md: { $type: 'dimension', $value: 12 },
      },
    },
  },
}

test('formatTypeScript emits as-const tokens object', () => {
  const out = formatTypeScript(sampleDict)
  assert.match(out, /\/\/ @generated by tokens\/scripts\/build\.js — do not edit/)
  assert.match(out, /export const tokens = \{/)
  assert.match(out, /primary: \{[\s\S]*default: ['"]#B87333['"]/)
  assert.match(out, /md: 12/)
  assert.match(out, /\} as const/)
})

test('formatTypeScript handles rgba color values', () => {
  const dict = {
    tokens: {
      semantic: {
        color: {
          dark: {
            onSurface: { default: { $type: 'color', $value: 'rgba(255,255,255,0.92)' } },
          },
        },
      },
    },
  }
  const out = formatTypeScript(dict)
  assert.match(out, /default: ['"]rgba\(255,255,255,0\.92\)['"]/)
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test tokens/config/formats/__tests__/typescript-tokens.test.js
```
Expected: FAIL — `Cannot find module '../typescript-tokens.js'`

- [ ] **Step 3: Implement minimal formatter**

```js
// tokens/config/formats/typescript-tokens.js
'use strict'

const HEADER = '// @generated by tokens/scripts/build.js — do not edit\n\n'

function isLeaf(node) {
  return node && typeof node === 'object' && '$value' in node
}

function emitValue(value) {
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return JSON.stringify(value)
  if (Array.isArray(value)) return JSON.stringify(value)
  if (value === null || value === undefined) return 'null'
  return JSON.stringify(value)
}

function emitNode(node, indent) {
  if (isLeaf(node)) {
    return emitValue(node.$value)
  }
  const lines = ['{']
  const keys = Object.keys(node)
  keys.forEach((key, i) => {
    const keyOut = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key)
    const child = emitNode(node[key], indent + '  ')
    const trail = i < keys.length - 1 ? ',' : ''
    lines.push(`${indent}  ${keyOut}: ${child}${trail}`)
  })
  lines.push(`${indent}}`)
  return lines.join('\n')
}

function formatTypeScript(dict) {
  const root = dict.tokens || dict
  return HEADER + 'export const tokens = ' + emitNode(root, '') + ' as const\n\nexport type Tokens = typeof tokens\n'
}

module.exports = { formatTypeScript }
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test tokens/config/formats/__tests__/typescript-tokens.test.js
```
Expected: PASS — both tests pass

- [ ] **Step 5: Commit**

```bash
git add tokens/config/formats/typescript-tokens.js tokens/config/formats/__tests__/typescript-tokens.test.js
git commit -m "feat(tokens): add TypeScript codegen formatter"
```

---

### Task 3: Custom Swift formatter (RED → GREEN)

**Files:**
- Create: `/Users/justinrich/Projects/LaneShadow/tokens/config/formats/swift-tokens.js`
- Test: `/Users/justinrich/Projects/LaneShadow/tokens/config/formats/__tests__/swift-tokens.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tokens/config/formats/__tests__/swift-tokens.test.js
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { formatSwift, parseColor } = require('../swift-tokens.js')

test('parseColor handles hex without alpha', () => {
  assert.deepEqual(parseColor('#B87333'), { red: 0xB8 / 255, green: 0x73 / 255, blue: 0x33 / 255, alpha: 1 })
})

test('parseColor handles 8-char hex with alpha', () => {
  const c = parseColor('#B87333FF')
  assert.equal(c.alpha, 1)
})

test('parseColor handles rgba', () => {
  const c = parseColor('rgba(255,255,255,0.92)')
  assert.equal(c.red, 1)
  assert.equal(c.alpha, 0.92)
})

test('formatSwift emits nested enum namespace with Color literal', () => {
  const dict = {
    tokens: {
      semantic: {
        color: {
          light: {
            primary: {
              default: { $type: 'color', $value: '#B87333' },
            },
          },
        },
        space: {
          md: { $type: 'dimension', $value: 12 },
        },
      },
    },
  }
  const out = formatSwift(dict)
  assert.match(out, /\/\/ @generated by tokens\/scripts\/build\.js — do not edit/)
  assert.match(out, /import SwiftUI/)
  assert.match(out, /public enum Tokens \{/)
  assert.match(out, /public enum Semantic \{/)
  assert.match(out, /public enum Color \{/)
  assert.match(out, /public enum Light \{/)
  assert.match(out, /public enum Primary \{/)
  assert.match(out, /public static let `default`: SwiftUI\.Color = SwiftUI\.Color\(red: 0\.7215686274509804, green: 0\.45098039215686275, blue: 0\.2/)
  assert.match(out, /public enum Space \{/)
  assert.match(out, /public static let md: CGFloat = 12/)
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test tokens/config/formats/__tests__/swift-tokens.test.js
```
Expected: FAIL — `Cannot find module '../swift-tokens.js'`

- [ ] **Step 3: Implement Swift formatter**

```js
// tokens/config/formats/swift-tokens.js
'use strict'

const HEADER = `// @generated by tokens/scripts/build.js — do not edit
//
// Source: tokens/semantic/semantic.tokens.json

import SwiftUI
import CoreGraphics

`

function pascalCase(s) {
  if (/^\d/.test(s)) return '_' + s.replace(/[^a-zA-Z0-9]/g, '_')
  return s.replace(/(^|[-_ ])(.)/g, (_, __, c) => c.toUpperCase())
}

function camelCase(s) {
  if (/^\d/.test(s)) return '_' + s.replace(/[^a-zA-Z0-9]/g, '_')
  const parts = s.split(/[-_ ]/)
  return parts[0] + parts.slice(1).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('')
}

const SWIFT_RESERVED = new Set([
  'default', 'class', 'struct', 'enum', 'func', 'let', 'var', 'if', 'else',
  'for', 'while', 'repeat', 'switch', 'case', 'break', 'continue', 'return',
  'public', 'private', 'internal', 'fileprivate', 'open', 'static', 'true', 'false',
])

function escapeIdent(name) {
  return SWIFT_RESERVED.has(name) ? '`' + name + '`' : name
}

function parseColor(value) {
  if (typeof value !== 'string') throw new Error('color value must be string: ' + JSON.stringify(value))
  const trimmed = value.trim()
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1)
    const expand = (h) => h.length === 3 ? h.split('').map((c) => c + c).join('') : h
    const norm = expand(hex)
    if (norm.length === 6) {
      return {
        red: parseInt(norm.slice(0, 2), 16) / 255,
        green: parseInt(norm.slice(2, 4), 16) / 255,
        blue: parseInt(norm.slice(4, 6), 16) / 255,
        alpha: 1,
      }
    }
    if (norm.length === 8) {
      return {
        red: parseInt(norm.slice(0, 2), 16) / 255,
        green: parseInt(norm.slice(2, 4), 16) / 255,
        blue: parseInt(norm.slice(4, 6), 16) / 255,
        alpha: parseInt(norm.slice(6, 8), 16) / 255,
      }
    }
  }
  const m = trimmed.match(/^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)$/)
  if (m) {
    return {
      red: parseFloat(m[1]) / 255,
      green: parseFloat(m[2]) / 255,
      blue: parseFloat(m[3]) / 255,
      alpha: m[4] !== undefined ? parseFloat(m[4]) : 1,
    }
  }
  throw new Error('Unsupported color value: ' + value)
}

function emitColor(value) {
  const c = parseColor(value)
  return `SwiftUI.Color(red: ${c.red}, green: ${c.green}, blue: ${c.blue}, opacity: ${c.alpha})`
}

function emitDimension(value) {
  return String(value)
}

function emitTypography(value) {
  // value: { fontSize, lineHeight, fontWeight }
  const weight = value.fontWeight
  const weightExpr = (
    weight === '100' ? '.ultraLight' :
    weight === '200' ? '.thin' :
    weight === '300' ? '.light' :
    weight === '400' || weight === 'normal' ? '.regular' :
    weight === '500' ? '.medium' :
    weight === '600' ? '.semibold' :
    weight === '700' || weight === 'bold' ? '.bold' :
    weight === '800' ? '.heavy' :
    weight === '900' ? '.black' :
    '.regular'
  )
  return `LaneShadowTypographyStyle(fontSize: ${value.fontSize}, lineHeight: ${value.lineHeight}, fontWeight: ${weightExpr})`
}

function emitElevation(value) {
  const off = value.shadowOffset || { width: 0, height: 0 }
  const color = value.shadowColor === 'transparent'
    ? 'SwiftUI.Color.clear'
    : emitColor(value.shadowColor)
  return `LaneShadowElevation(shadowColor: ${color}, offsetX: ${off.width}, offsetY: ${off.height}, opacity: ${value.shadowOpacity}, radius: ${value.shadowRadius}, elevation: ${value.elevation})`
}

function emitMotionEasing(value) {
  if (Array.isArray(value)) {
    return `LaneShadowEasing(c1x: ${value[0]}, c1y: ${value[1]}, c2x: ${value[2]}, c2y: ${value[3]})`
  }
  return JSON.stringify(value)
}

function leafValue(node) {
  const t = node.$type
  const v = node.$value
  if (t === 'color') return { type: 'SwiftUI.Color', expr: emitColor(v) }
  if (t === 'dimension') return { type: 'CGFloat', expr: emitDimension(v) }
  if (t === 'integer') return { type: 'Int', expr: String(v) }
  if (t === 'number') return { type: 'Double', expr: String(v) }
  if (t === 'opacity') return { type: 'Double', expr: String(v) }
  if (t === 'fontWeight') return { type: 'String', expr: JSON.stringify(v) }
  if (t === 'typography') return { type: 'LaneShadowTypographyStyle', expr: emitTypography(v) }
  if (t === 'shadow' || t === 'elevation') return { type: 'LaneShadowElevation', expr: emitElevation(v) }
  if (t === 'cubicBezier') return { type: 'LaneShadowEasing', expr: emitMotionEasing(v) }
  if (t === 'duration') return { type: 'Double', expr: String(v) }
  // Fallback: stringify
  return { type: 'String', expr: JSON.stringify(v) }
}

function isLeaf(node) {
  return node && typeof node === 'object' && '$value' in node
}

function emitNamespace(name, node, indent) {
  const lines = []
  const open = `${indent}public enum ${pascalCase(name)} {`
  lines.push(open)
  for (const [key, child] of Object.entries(node)) {
    if (isLeaf(child)) {
      const { type, expr } = leafValue(child)
      lines.push(`${indent}  public static let ${escapeIdent(camelCase(key))}: ${type} = ${expr}`)
    } else {
      lines.push(emitNamespace(key, child, indent + '  '))
    }
  }
  lines.push(`${indent}}`)
  return lines.join('\n')
}

function formatSwift(dict) {
  const root = dict.tokens || dict
  return HEADER + emitNamespace('Tokens', root, '') + '\n'
}

module.exports = { formatSwift, parseColor }
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test tokens/config/formats/__tests__/swift-tokens.test.js
```
Expected: PASS — all 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add tokens/config/formats/swift-tokens.js tokens/config/formats/__tests__/swift-tokens.test.js
git commit -m "feat(tokens): add Swift codegen formatter"
```

---

### Task 4: Custom Kotlin formatter (RED → GREEN)

**Files:**
- Create: `/Users/justinrich/Projects/LaneShadow/tokens/config/formats/kotlin-tokens.js`
- Test: `/Users/justinrich/Projects/LaneShadow/tokens/config/formats/__tests__/kotlin-tokens.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tokens/config/formats/__tests__/kotlin-tokens.test.js
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { formatKotlin, colorArgb } = require('../kotlin-tokens.js')

test('colorArgb produces 0xAARRGGBB int from hex', () => {
  assert.equal(colorArgb('#B87333'), 0xFFB87333)
})

test('colorArgb produces 0xAARRGGBB int from rgba', () => {
  assert.equal(colorArgb('rgba(255,255,255,0.5)'), 0x80FFFFFF)
})

test('formatKotlin emits nested object namespace with Color literal', () => {
  const dict = {
    tokens: {
      semantic: {
        color: {
          light: {
            primary: {
              default: { $type: 'color', $value: '#B87333' },
            },
          },
        },
        space: {
          md: { $type: 'dimension', $value: 12 },
        },
      },
    },
  }
  const out = formatKotlin(dict)
  assert.match(out, /\/\/ @generated by tokens\/scripts\/build\.js — do not edit/)
  assert.match(out, /package com\.laneshadow\.theme\.generated/)
  assert.match(out, /import androidx\.compose\.ui\.graphics\.Color/)
  assert.match(out, /import androidx\.compose\.ui\.unit\.dp/)
  assert.match(out, /public object Tokens \{/)
  assert.match(out, /public object Semantic \{/)
  assert.match(out, /public object Color \{/)
  assert.match(out, /public object Light \{/)
  assert.match(out, /public object Primary \{/)
  assert.match(out, /public val `default`: androidx\.compose\.ui\.graphics\.Color = androidx\.compose\.ui\.graphics\.Color\(0xFFB87333\)/)
  assert.match(out, /public val md: androidx\.compose\.ui\.unit\.Dp = 12\.dp/)
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test tokens/config/formats/__tests__/kotlin-tokens.test.js
```
Expected: FAIL — `Cannot find module '../kotlin-tokens.js'`

- [ ] **Step 3: Implement Kotlin formatter**

```js
// tokens/config/formats/kotlin-tokens.js
'use strict'

const HEADER = `// @generated by tokens/scripts/build.js — do not edit
//
// Source: tokens/semantic/semantic.tokens.json

@file:Suppress("MagicNumber", "TopLevelPropertyNaming", "ObjectPropertyNaming")
package com.laneshadow.theme.generated

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight

`

function pascalCase(s) {
  if (/^\d/.test(s)) return '_' + s.replace(/[^a-zA-Z0-9]/g, '_')
  return s.replace(/(^|[-_ ])(.)/g, (_, __, c) => c.toUpperCase())
}
function camelCase(s) {
  if (/^\d/.test(s)) return '_' + s.replace(/[^a-zA-Z0-9]/g, '_')
  const parts = s.split(/[-_ ]/)
  return parts[0] + parts.slice(1).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('')
}

const KOTLIN_HARD_KEYWORDS = new Set([
  'as', 'break', 'class', 'continue', 'do', 'else', 'false', 'for', 'fun',
  'if', 'in', 'interface', 'is', 'null', 'object', 'package', 'return',
  'super', 'this', 'throw', 'true', 'try', 'typealias', 'val', 'var', 'when', 'while',
  'default',
])
function escapeIdent(name) {
  return KOTLIN_HARD_KEYWORDS.has(name) ? '`' + name + '`' : name
}

function parseColorArgb(value) {
  if (typeof value !== 'string') throw new Error('color value must be string: ' + JSON.stringify(value))
  const trimmed = value.trim()
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1)
    const expand = (h) => h.length === 3 ? h.split('').map((c) => c + c).join('') : h
    const norm = expand(hex)
    if (norm.length === 6) return (0xFF000000 | parseInt(norm, 16)) >>> 0
    if (norm.length === 8) {
      const rgb = parseInt(norm.slice(0, 6), 16)
      const a = parseInt(norm.slice(6, 8), 16)
      return ((a << 24) | rgb) >>> 0
    }
  }
  const m = trimmed.match(/^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)$/)
  if (m) {
    const r = Math.round(parseFloat(m[1]))
    const g = Math.round(parseFloat(m[2]))
    const b = Math.round(parseFloat(m[3]))
    const a = m[4] !== undefined ? Math.round(parseFloat(m[4]) * 255) : 255
    return ((a << 24) | (r << 16) | (g << 8) | b) >>> 0
  }
  throw new Error('Unsupported color value: ' + value)
}

const colorArgb = parseColorArgb

function emitColor(value) {
  const argb = parseColorArgb(value)
  const hex = argb.toString(16).toUpperCase().padStart(8, '0')
  return `androidx.compose.ui.graphics.Color(0x${hex})`
}

function emitTypography(value) {
  const weight = value.fontWeight
  const weightExpr = (
    weight === '100' ? 'FontWeight.Thin' :
    weight === '200' ? 'FontWeight.ExtraLight' :
    weight === '300' ? 'FontWeight.Light' :
    weight === '400' || weight === 'normal' ? 'FontWeight.Normal' :
    weight === '500' ? 'FontWeight.Medium' :
    weight === '600' ? 'FontWeight.SemiBold' :
    weight === '700' || weight === 'bold' ? 'FontWeight.Bold' :
    weight === '800' ? 'FontWeight.ExtraBold' :
    weight === '900' ? 'FontWeight.Black' :
    'FontWeight.Normal'
  )
  return `TextStyle(fontSize = ${value.fontSize}.sp, lineHeight = ${value.lineHeight}.sp, fontWeight = ${weightExpr})`
}

function emitElevation(value) {
  // Kotlin/Compose: only the elevation field maps to Dp. Keep the rest in a data class for future use.
  return `LaneShadowElevation(elevation = ${value.elevation}.dp, offsetX = ${value.shadowOffset?.width ?? 0}.dp, offsetY = ${value.shadowOffset?.height ?? 0}.dp, opacity = ${value.shadowOpacity}f, radius = ${value.shadowRadius}.dp)`
}

function leafValue(node) {
  const t = node.$type
  const v = node.$value
  if (t === 'color') return { type: 'androidx.compose.ui.graphics.Color', expr: emitColor(v) }
  if (t === 'dimension') return { type: 'androidx.compose.ui.unit.Dp', expr: `${v}.dp` }
  if (t === 'integer') return { type: 'Int', expr: String(v) }
  if (t === 'number') return { type: 'Double', expr: `${v}` }
  if (t === 'opacity') return { type: 'Float', expr: `${v}f` }
  if (t === 'fontWeight') return { type: 'String', expr: JSON.stringify(v) }
  if (t === 'typography') return { type: 'androidx.compose.ui.text.TextStyle', expr: emitTypography(v) }
  if (t === 'shadow' || t === 'elevation') return { type: 'com.laneshadow.theme.LaneShadowElevation', expr: emitElevation(v) }
  if (t === 'cubicBezier') return { type: 'List<Double>', expr: 'listOf(' + v.join(', ') + ')' }
  if (t === 'duration') return { type: 'Int', expr: String(v) }
  return { type: 'String', expr: JSON.stringify(v) }
}

function isLeaf(node) {
  return node && typeof node === 'object' && '$value' in node
}

function emitNamespace(name, node, indent) {
  const lines = [`${indent}public object ${pascalCase(name)} {`]
  for (const [key, child] of Object.entries(node)) {
    if (isLeaf(child)) {
      const { type, expr } = leafValue(child)
      lines.push(`${indent}  public val ${escapeIdent(camelCase(key))}: ${type} = ${expr}`)
    } else {
      lines.push(emitNamespace(key, child, indent + '  '))
    }
  }
  lines.push(`${indent}}`)
  return lines.join('\n')
}

function formatKotlin(dict) {
  const root = dict.tokens || dict
  return HEADER + emitNamespace('Tokens', root, '') + '\n'
}

module.exports = { formatKotlin, colorArgb }
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test tokens/config/formats/__tests__/kotlin-tokens.test.js
```
Expected: PASS — all 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add tokens/config/formats/kotlin-tokens.js tokens/config/formats/__tests__/kotlin-tokens.test.js
git commit -m "feat(tokens): add Kotlin codegen formatter"
```

---

### Task 5: Style Dictionary config + build script

**Files:**
- Create: `/Users/justinrich/Projects/LaneShadow/tokens/config/style-dictionary.config.js`
- Create: `/Users/justinrich/Projects/LaneShadow/tokens/scripts/build.js`
- Modify: `/Users/justinrich/Projects/LaneShadow/package.json`

- [ ] **Step 1: Create the SD config**

```js
// tokens/config/style-dictionary.config.js
'use strict'

const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const PROJECT_ROOT = path.resolve(ROOT, '..')

module.exports = {
  source: [path.join(ROOT, 'semantic/*.tokens.json')],
  // SD v4 supports DTCG natively when the source uses $value/$type.
  preprocessors: ['tokens-studio'],
  platforms: {
    typescript: {
      buildPath: path.join(ROOT, 'platforms/typescript/src/generated/'),
      files: [{ destination: 'tokens.ts', format: 'laneshadow/typescript' }],
    },
    swift: {
      buildPath: path.join(ROOT, 'platforms/swift/Sources/LaneShadowTheme/Generated/'),
      files: [{ destination: 'Tokens.swift', format: 'laneshadow/swift' }],
    },
    kotlin: {
      buildPath: path.join(ROOT, 'platforms/kotlin/src/main/kotlin/com/laneshadow/theme/generated/'),
      files: [{ destination: 'Tokens.kt', format: 'laneshadow/kotlin' }],
    },
  },
}
```

- [ ] **Step 2: Create the build script**

```js
// tokens/scripts/build.js
#!/usr/bin/env node
'use strict'

const path = require('node:path')
const fs = require('node:fs')

async function main() {
  const StyleDictionaryMod = require('style-dictionary')
  const StyleDictionary = StyleDictionaryMod.default || StyleDictionaryMod
  const { formatTypeScript } = require('../config/formats/typescript-tokens.js')
  const { formatSwift } = require('../config/formats/swift-tokens.js')
  const { formatKotlin } = require('../config/formats/kotlin-tokens.js')
  const config = require('../config/style-dictionary.config.js')

  // We bypass SD's transform pipeline for value-shape generation:
  // our DTCG source is already in the right shape, and our formatters
  // walk the raw token tree directly. SD is used for orchestration:
  // source-loading + per-platform invocation + output writes.
  const sd = new StyleDictionary(config)

  // Register custom formats. They each accept the parsed token dictionary.
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

  await sd.hasInitialized
  await sd.cleanAllPlatforms()
  await sd.buildAllPlatforms()

  // Sanity check: assert each output exists.
  const outputs = [
    path.join(__dirname, '..', 'platforms/typescript/src/generated/tokens.ts'),
    path.join(__dirname, '..', 'platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift'),
    path.join(__dirname, '..', 'platforms/kotlin/src/main/kotlin/com/laneshadow/theme/generated/Tokens.kt'),
  ]
  for (const out of outputs) {
    if (!fs.existsSync(out)) {
      process.stderr.write('Missing expected output: ' + out + '\n')
      process.exit(1)
    }
    process.stdout.write('Wrote ' + path.relative(path.resolve(__dirname, '..', '..'), out) + '\n')
  }
}

main().catch((err) => {
  process.stderr.write((err && err.stack) || String(err))
  process.stderr.write('\n')
  process.exit(1)
})
```

- [ ] **Step 3: Add scripts to root `package.json`**

Edit `package.json`. Find the `"scripts"` block and add the two new entries (after `"tokens:validate"`):

```json
"build:tokens": "node tokens/scripts/build.js",
"tokens:check-drift": "node tokens/scripts/check-drift.js",
```

- [ ] **Step 4: Make output directories exist (so SD can write)**

```bash
mkdir -p tokens/platforms/typescript/src/generated
mkdir -p tokens/platforms/swift/Sources/LaneShadowTheme/Generated
mkdir -p tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/generated
```

- [ ] **Step 5: Install the DTCG preprocessor used in config**

```bash
pnpm add -D -w @tokens-studio/sd-transforms@^2.0.0
```

If install fails (package not found), fall back: remove the `preprocessors: ['tokens-studio']` line from `style-dictionary.config.js` and proceed — the custom formatters consume `dictionary.tokens` directly and don't depend on transformed values.

- [ ] **Step 6: Run the build end-to-end**

```bash
pnpm build:tokens
```
Expected output:
```
Wrote tokens/platforms/typescript/src/generated/tokens.ts
Wrote tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift
Wrote tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/generated/Tokens.kt
```

- [ ] **Step 7: Inspect a few generated lines for sanity**

```bash
head -20 tokens/platforms/typescript/src/generated/tokens.ts
head -20 tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift
head -20 tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/generated/Tokens.kt
```
Expected: each starts with the `@generated` header; TS has `export const tokens =`; Swift has `public enum Tokens`; Kotlin has `public object Tokens`.

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml tokens/config tokens/scripts/build.js tokens/platforms
git commit -m "feat(tokens): wire Style Dictionary v4 codegen for swift/kotlin/typescript"
```

---

### Task 6: Drift-check script

**Files:**
- Create: `/Users/justinrich/Projects/LaneShadow/tokens/scripts/check-drift.js`

- [ ] **Step 1: Write the drift-check script**

```js
// tokens/scripts/check-drift.js
#!/usr/bin/env node
'use strict'

const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
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

  const result = spawnSync('node', ['tokens/scripts/build.js'], { cwd: REPO_ROOT, stdio: 'inherit' })
  if (result.status !== 0) {
    process.stderr.write('Drift check failed: build:tokens did not exit cleanly.\n')
    process.exit(result.status || 1)
  }

  const after = snapshot()

  let drifted = false
  for (const rel of TARGETS) {
    if (before[rel] !== after[rel]) {
      drifted = true
      process.stderr.write('Drift detected in tokens/platforms/' + rel + '\n')
    }
  }
  if (drifted) {
    process.stderr.write('\nGenerated files are out of date. Run:\n  pnpm build:tokens && git add tokens/platforms\n')
    process.exit(1)
  }
  process.stdout.write('Token outputs are in sync with semantic.tokens.json.\n')
}

main()
```

- [ ] **Step 2: Run it once to verify clean state**

```bash
pnpm tokens:check-drift
```
Expected: `Token outputs are in sync with semantic.tokens.json.`

- [ ] **Step 3: Negative test — perturb a generated file and verify it fails**

```bash
echo "// drift" >> tokens/platforms/typescript/src/generated/tokens.ts
pnpm tokens:check-drift; echo "exit=$?"
```
Expected: `Drift detected in tokens/platforms/typescript/src/generated/tokens.ts` and `exit=1`.

- [ ] **Step 4: Re-build to restore clean state**

```bash
pnpm build:tokens
pnpm tokens:check-drift
```
Expected: clean exit.

- [ ] **Step 5: Commit**

```bash
git add tokens/scripts/check-drift.js
git commit -m "feat(tokens): add codegen drift detection script"
```

---

### Task 7: Lefthook drift gate

**Files:**
- Modify: `/Users/justinrich/Projects/LaneShadow/lefthook.yml`

- [ ] **Step 1: Add drift job under `pre-commit.jobs`**

Edit `lefthook.yml`. Insert this block after the existing `tokens:validate` job:

```yaml
    - name: tokens:check-drift
      glob: "tokens/**/*"
      run: pnpm tokens:check-drift
```

- [ ] **Step 2: Verify lefthook still loads**

```bash
pnpm exec lefthook validate
```
Expected: no error.

- [ ] **Step 3: Commit**

```bash
git add lefthook.yml
git commit -m "ci(tokens): add lefthook drift gate on token edits"
```

---

## Phase 2 — Swift Package

### Task 8: SPM manifest

**Files:**
- Create: `/Users/justinrich/Projects/LaneShadow/tokens/platforms/swift/Package.swift`

- [ ] **Step 1: Write the manifest**

```swift
// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "LaneShadowTheme",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(name: "LaneShadowTheme", targets: ["LaneShadowTheme"])
    ],
    targets: [
        .target(
            name: "LaneShadowTheme",
            path: "Sources/LaneShadowTheme"
        ),
        .testTarget(
            name: "LaneShadowThemeTests",
            dependencies: ["LaneShadowTheme"],
            path: "Tests/LaneShadowThemeTests"
        )
    ]
)
```

- [ ] **Step 2: Verify SPM can describe the package**

```bash
cd tokens/platforms/swift
swift package describe --type json | head -10
cd -
```
Expected: JSON output with `"name": "LaneShadowTheme"`. Note: `swift build` will fail until Theme.swift exists in next task — that's fine.

- [ ] **Step 3: Commit**

```bash
git add tokens/platforms/swift/Package.swift
git commit -m "feat(tokens-swift): add SPM manifest for LaneShadowTheme package"
```

---

### Task 9: Swift theming layer — Theme.swift, Environment, DomainColors

**Files:**
- Create: `/Users/justinrich/Projects/LaneShadow/tokens/platforms/swift/Sources/LaneShadowTheme/Theme.swift`
- Create: `/Users/justinrich/Projects/LaneShadow/tokens/platforms/swift/Sources/LaneShadowTheme/ThemeEnvironment.swift`
- Create: `/Users/justinrich/Projects/LaneShadow/tokens/platforms/swift/Sources/LaneShadowTheme/DomainColors.swift`
- Create: `/Users/justinrich/Projects/LaneShadow/tokens/platforms/swift/Sources/LaneShadowTheme/SupportTypes.swift`
- Create: `/Users/justinrich/Projects/LaneShadow/tokens/platforms/swift/Tests/LaneShadowThemeTests/ThemeTests.swift`

- [ ] **Step 1: Write the failing test**

```swift
// tokens/platforms/swift/Tests/LaneShadowThemeTests/ThemeTests.swift
import XCTest
import SwiftUI
@testable import LaneShadowTheme

final class ThemeTests: XCTestCase {
    func testSharedThemeExposesAllTokenCategories() {
        let theme = Theme.shared
        XCTAssertNotNil(theme.colors.primary.default)
        XCTAssertNotNil(theme.colors.surface.default)
        XCTAssertEqual(theme.space.md, 12)
        XCTAssertEqual(theme.radius.md, 8)
        XCTAssertNotNil(theme.type.body.md)
        XCTAssertNotNil(theme.elevation.level1)
        XCTAssertNotNil(theme.domain.waypointOnRoute.default)
    }

    func testColorSetExposesStateVariants() {
        let primary = Theme.shared.colors.primary
        XCTAssertNotNil(primary.default)
        XCTAssertNotNil(primary.hover)
        XCTAssertNotNil(primary.pressed)
        XCTAssertNotNil(primary.disabled)
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd tokens/platforms/swift
swift test 2>&1 | tail -20
cd -
```
Expected: FAIL — `'Theme' is undefined` (or similar).

- [ ] **Step 3: Write SupportTypes.swift**

```swift
// tokens/platforms/swift/Sources/LaneShadowTheme/SupportTypes.swift
import SwiftUI
import CoreGraphics

public struct LaneShadowTypographyStyle: Sendable {
    public let fontSize: CGFloat
    public let lineHeight: CGFloat
    public let fontWeight: Font.Weight

    public init(fontSize: CGFloat, lineHeight: CGFloat, fontWeight: Font.Weight) {
        self.fontSize = fontSize
        self.lineHeight = lineHeight
        self.fontWeight = fontWeight
    }

    public var font: Font {
        Font.system(size: fontSize, weight: fontWeight)
    }
}

public struct LaneShadowElevation: Sendable {
    public let shadowColor: Color
    public let offsetX: CGFloat
    public let offsetY: CGFloat
    public let opacity: Double
    public let radius: CGFloat
    public let elevation: CGFloat

    public init(shadowColor: Color, offsetX: CGFloat, offsetY: CGFloat, opacity: Double, radius: CGFloat, elevation: CGFloat) {
        self.shadowColor = shadowColor
        self.offsetX = offsetX
        self.offsetY = offsetY
        self.opacity = opacity
        self.radius = radius
        self.elevation = elevation
    }
}

public struct LaneShadowEasing: Sendable {
    public let c1x: Double
    public let c1y: Double
    public let c2x: Double
    public let c2y: Double

    public init(c1x: Double, c1y: Double, c2x: Double, c2y: Double) {
        self.c1x = c1x
        self.c1y = c1y
        self.c2x = c2x
        self.c2y = c2y
    }
}

public struct ColorSet: Sendable {
    public let `default`: Color
    public let hover: Color?
    public let pressed: Color?
    public let disabled: Color?
    public let focus: Color?

    public init(default defaultColor: Color, hover: Color? = nil, pressed: Color? = nil, disabled: Color? = nil, focus: Color? = nil) {
        self.default = defaultColor
        self.hover = hover
        self.pressed = pressed
        self.disabled = disabled
        self.focus = focus
    }
}
```

- [ ] **Step 4: Write Theme.swift**

```swift
// tokens/platforms/swift/Sources/LaneShadowTheme/Theme.swift
import SwiftUI
import CoreGraphics

#if canImport(UIKit)
import UIKit

private func dynamicColor(light: Color, dark: Color) -> Color {
    Color(uiColor: UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(dark) : UIColor(light)
    })
}
#else
private func dynamicColor(light: Color, dark: Color) -> Color { light }
#endif

private func cs(_ light: Tokens.Semantic.Color.Light.Type, _ dark: Tokens.Semantic.Color.Dark.Type, key: KeyPath<Tokens.Semantic.Color.Light.Type, ColorSetSource>) -> ColorSet {
    // Placeholder; concrete keypath construction happens inline in ThemeColors below.
    fatalError("not used")
}

public struct ThemeColors: Sendable {
    public let primary: ColorSet
    public let secondary: ColorSet
    public let tertiary: ColorSet
    public let success: ColorSet
    public let warning: ColorSet
    public let warningContainer: ColorSet
    public let onWarningContainer: ColorSet
    public let danger: ColorSet
    public let info: ColorSet
    public let surface: ColorSet
    public let surfaceVariant: ColorSet
    public let background: ColorSet
    public let onSurface: ColorSet
    public let onPrimary: ColorSet
    public let onSecondary: ColorSet
    public let secondaryContainer: ColorSet
    public let onSecondaryContainer: ColorSet
    public let border: ColorSet
    public let input: ColorSet
    public let ring: ColorSet
    public let card: ColorSet
    public let popover: ColorSet
    public let accent: ColorSet
    public let muted: ColorSet
    public let divider: ColorSet
    public let scrim: ColorSet
    public let routeSelected: ColorSet
    public let routeAlternate: ColorSet
}

public struct ThemeSpace: Sendable {
    public let xs: CGFloat
    public let sm: CGFloat
    public let md: CGFloat
    public let lg: CGFloat
    public let xl: CGFloat
    public let xxl: CGFloat
    public let xxxl: CGFloat
    public let xxxxl: CGFloat
}

public struct ThemeRadius: Sendable {
    public let none: CGFloat
    public let sm: CGFloat
    public let md: CGFloat
    public let lg: CGFloat
    public let xl: CGFloat
    public let xxl: CGFloat
    public let full: CGFloat
}

public struct ThemeTypeScale: Sendable {
    public let sm: LaneShadowTypographyStyle
    public let md: LaneShadowTypographyStyle
    public let lg: LaneShadowTypographyStyle
}

public struct ThemeType: Sendable {
    public let label: ThemeTypeScale
    public let body: ThemeTypeScale
    public let title: ThemeTypeScale
    public let heading: ThemeTypeScale
    public let display: ThemeTypeScale
}

public struct ThemeElevation: Sendable {
    public let level0: LaneShadowElevation
    public let level1: LaneShadowElevation
    public let level2: LaneShadowElevation
    public let level3: LaneShadowElevation
    public let level4: LaneShadowElevation
    public let level5: LaneShadowElevation
}

public struct Theme: Sendable {
    public let colors: ThemeColors
    public let space: ThemeSpace
    public let radius: ThemeRadius
    public let type: ThemeType
    public let elevation: ThemeElevation
    public let domain: DomainColors

    public static let shared: Theme = {
        // Resolves light/dark per call site via dynamicColor wrapper.
        // Token paths come from Generated/Tokens.swift (codegen).
        let L = Tokens.Semantic.Color.Light.self
        let D = Tokens.Semantic.Color.Dark.self
        let S = Tokens.Semantic.Space.self
        let R = Tokens.Semantic.Radius.self
        let T = Tokens.Semantic.Type.self
        let EL = Tokens.Semantic.Elevation.Light.self
        return Theme(
            colors: ThemeColors(
                primary: ColorSet(
                    default: dynamicColor(light: L.Primary.default, dark: D.Primary.default),
                    hover: dynamicColor(light: L.Primary.hover, dark: D.Primary.hover),
                    pressed: dynamicColor(light: L.Primary.pressed, dark: D.Primary.pressed),
                    disabled: dynamicColor(light: L.Primary.disabled, dark: D.Primary.disabled)
                ),
                secondary: ColorSet(
                    default: dynamicColor(light: L.Secondary.default, dark: D.Secondary.default),
                    hover: dynamicColor(light: L.Secondary.hover, dark: D.Secondary.hover),
                    pressed: dynamicColor(light: L.Secondary.pressed, dark: D.Secondary.pressed),
                    disabled: dynamicColor(light: L.Secondary.disabled, dark: D.Secondary.disabled)
                ),
                tertiary: ColorSet(
                    default: dynamicColor(light: L.Tertiary.default, dark: D.Tertiary.default),
                    hover: dynamicColor(light: L.Tertiary.hover, dark: D.Tertiary.hover),
                    pressed: dynamicColor(light: L.Tertiary.pressed, dark: D.Tertiary.pressed),
                    disabled: dynamicColor(light: L.Tertiary.disabled, dark: D.Tertiary.disabled)
                ),
                success: ColorSet(
                    default: dynamicColor(light: L.Success.default, dark: D.Success.default),
                    hover: dynamicColor(light: L.Success.hover, dark: D.Success.hover),
                    pressed: dynamicColor(light: L.Success.pressed, dark: D.Success.pressed),
                    disabled: dynamicColor(light: L.Success.disabled, dark: D.Success.disabled)
                ),
                warning: ColorSet(
                    default: dynamicColor(light: L.Warning.default, dark: D.Warning.default),
                    hover: dynamicColor(light: L.Warning.hover, dark: D.Warning.hover),
                    pressed: dynamicColor(light: L.Warning.pressed, dark: D.Warning.pressed),
                    disabled: dynamicColor(light: L.Warning.disabled, dark: D.Warning.disabled)
                ),
                warningContainer: ColorSet(
                    default: dynamicColor(light: L.WarningContainer.default, dark: D.WarningContainer.default),
                    hover: dynamicColor(light: L.WarningContainer.hover, dark: D.WarningContainer.hover),
                    pressed: dynamicColor(light: L.WarningContainer.pressed, dark: D.WarningContainer.pressed),
                    disabled: dynamicColor(light: L.WarningContainer.disabled, dark: D.WarningContainer.disabled)
                ),
                onWarningContainer: ColorSet(
                    default: dynamicColor(light: L.OnWarningContainer.default, dark: D.OnWarningContainer.default),
                    hover: dynamicColor(light: L.OnWarningContainer.hover, dark: D.OnWarningContainer.hover),
                    pressed: dynamicColor(light: L.OnWarningContainer.pressed, dark: D.OnWarningContainer.pressed),
                    disabled: dynamicColor(light: L.OnWarningContainer.disabled, dark: D.OnWarningContainer.disabled)
                ),
                danger: ColorSet(
                    default: dynamicColor(light: L.Danger.default, dark: D.Danger.default),
                    hover: dynamicColor(light: L.Danger.hover, dark: D.Danger.hover),
                    pressed: dynamicColor(light: L.Danger.pressed, dark: D.Danger.pressed),
                    disabled: dynamicColor(light: L.Danger.disabled, dark: D.Danger.disabled)
                ),
                info: ColorSet(
                    default: dynamicColor(light: L.Info.default, dark: D.Info.default),
                    hover: dynamicColor(light: L.Info.hover, dark: D.Info.hover),
                    pressed: dynamicColor(light: L.Info.pressed, dark: D.Info.pressed),
                    disabled: dynamicColor(light: L.Info.disabled, dark: D.Info.disabled)
                ),
                surface: ColorSet(
                    default: dynamicColor(light: L.Surface.default, dark: D.Surface.default),
                    hover: dynamicColor(light: L.Surface.hover, dark: D.Surface.hover),
                    pressed: dynamicColor(light: L.Surface.pressed, dark: D.Surface.pressed),
                    disabled: dynamicColor(light: L.Surface.disabled, dark: D.Surface.disabled)
                ),
                surfaceVariant: ColorSet(
                    default: dynamicColor(light: L.SurfaceVariant.default, dark: D.SurfaceVariant.default),
                    hover: dynamicColor(light: L.SurfaceVariant.hover, dark: D.SurfaceVariant.hover),
                    pressed: dynamicColor(light: L.SurfaceVariant.pressed, dark: D.SurfaceVariant.pressed),
                    disabled: dynamicColor(light: L.SurfaceVariant.disabled, dark: D.SurfaceVariant.disabled)
                ),
                background: ColorSet(
                    default: dynamicColor(light: L.Background.default, dark: D.Background.default),
                    hover: dynamicColor(light: L.Background.hover, dark: D.Background.hover),
                    pressed: dynamicColor(light: L.Background.pressed, dark: D.Background.pressed),
                    disabled: dynamicColor(light: L.Background.disabled, dark: D.Background.disabled)
                ),
                onSurface: ColorSet(
                    default: dynamicColor(light: L.OnSurface.default, dark: D.OnSurface.default),
                    hover: dynamicColor(light: L.OnSurface.hover, dark: D.OnSurface.hover),
                    pressed: dynamicColor(light: L.OnSurface.pressed, dark: D.OnSurface.pressed),
                    disabled: dynamicColor(light: L.OnSurface.disabled, dark: D.OnSurface.disabled)
                ),
                onPrimary: ColorSet(
                    default: dynamicColor(light: L.OnPrimary.default, dark: D.OnPrimary.default),
                    hover: dynamicColor(light: L.OnPrimary.hover, dark: D.OnPrimary.hover),
                    pressed: dynamicColor(light: L.OnPrimary.pressed, dark: D.OnPrimary.pressed),
                    disabled: dynamicColor(light: L.OnPrimary.disabled, dark: D.OnPrimary.disabled)
                ),
                onSecondary: ColorSet(
                    default: dynamicColor(light: L.OnSecondary.default, dark: D.OnSecondary.default),
                    hover: dynamicColor(light: L.OnSecondary.hover, dark: D.OnSecondary.hover),
                    pressed: dynamicColor(light: L.OnSecondary.pressed, dark: D.OnSecondary.pressed),
                    disabled: dynamicColor(light: L.OnSecondary.disabled, dark: D.OnSecondary.disabled)
                ),
                secondaryContainer: ColorSet(
                    default: dynamicColor(light: L.SecondaryContainer.default, dark: D.SecondaryContainer.default),
                    hover: dynamicColor(light: L.SecondaryContainer.hover, dark: D.SecondaryContainer.hover),
                    pressed: dynamicColor(light: L.SecondaryContainer.pressed, dark: D.SecondaryContainer.pressed),
                    disabled: dynamicColor(light: L.SecondaryContainer.disabled, dark: D.SecondaryContainer.disabled)
                ),
                onSecondaryContainer: ColorSet(
                    default: dynamicColor(light: L.OnSecondaryContainer.default, dark: D.OnSecondaryContainer.default),
                    hover: dynamicColor(light: L.OnSecondaryContainer.hover, dark: D.OnSecondaryContainer.hover),
                    pressed: dynamicColor(light: L.OnSecondaryContainer.pressed, dark: D.OnSecondaryContainer.pressed),
                    disabled: dynamicColor(light: L.OnSecondaryContainer.disabled, dark: D.OnSecondaryContainer.disabled)
                ),
                border: ColorSet(
                    default: dynamicColor(light: L.Border.default, dark: D.Border.default),
                    hover: dynamicColor(light: L.Border.hover, dark: D.Border.hover),
                    pressed: dynamicColor(light: L.Border.pressed, dark: D.Border.pressed),
                    disabled: dynamicColor(light: L.Border.disabled, dark: D.Border.disabled)
                ),
                input: ColorSet(
                    default: dynamicColor(light: L.Input.default, dark: D.Input.default),
                    hover: dynamicColor(light: L.Input.hover, dark: D.Input.hover),
                    pressed: dynamicColor(light: L.Input.pressed, dark: D.Input.pressed),
                    disabled: dynamicColor(light: L.Input.disabled, dark: D.Input.disabled)
                ),
                ring: ColorSet(
                    default: dynamicColor(light: L.Ring.default, dark: D.Ring.default),
                    hover: dynamicColor(light: L.Ring.hover, dark: D.Ring.hover),
                    pressed: dynamicColor(light: L.Ring.pressed, dark: D.Ring.pressed),
                    disabled: dynamicColor(light: L.Ring.disabled, dark: D.Ring.disabled)
                ),
                card: ColorSet(
                    default: dynamicColor(light: L.Card.default, dark: D.Card.default),
                    hover: dynamicColor(light: L.Card.hover, dark: D.Card.hover),
                    pressed: dynamicColor(light: L.Card.pressed, dark: D.Card.pressed),
                    disabled: dynamicColor(light: L.Card.disabled, dark: D.Card.disabled)
                ),
                popover: ColorSet(
                    default: dynamicColor(light: L.Popover.default, dark: D.Popover.default),
                    hover: dynamicColor(light: L.Popover.hover, dark: D.Popover.hover),
                    pressed: dynamicColor(light: L.Popover.pressed, dark: D.Popover.pressed),
                    disabled: dynamicColor(light: L.Popover.disabled, dark: D.Popover.disabled)
                ),
                accent: ColorSet(
                    default: dynamicColor(light: L.Accent.default, dark: D.Accent.default),
                    hover: dynamicColor(light: L.Accent.hover, dark: D.Accent.hover),
                    pressed: dynamicColor(light: L.Accent.pressed, dark: D.Accent.pressed),
                    disabled: dynamicColor(light: L.Accent.disabled, dark: D.Accent.disabled)
                ),
                muted: ColorSet(
                    default: dynamicColor(light: L.Muted.default, dark: D.Muted.default),
                    hover: dynamicColor(light: L.Muted.hover, dark: D.Muted.hover),
                    pressed: dynamicColor(light: L.Muted.pressed, dark: D.Muted.pressed),
                    disabled: dynamicColor(light: L.Muted.disabled, dark: D.Muted.disabled)
                ),
                divider: ColorSet(default: dynamicColor(light: L.Divider.default, dark: D.Divider.default)),
                scrim: ColorSet(default: dynamicColor(light: L.Scrim.default, dark: D.Scrim.default)),
                routeSelected: ColorSet(
                    default: dynamicColor(light: L.RouteSelected.default, dark: D.RouteSelected.default),
                    hover: dynamicColor(light: L.RouteSelected.hover, dark: D.RouteSelected.hover),
                    pressed: dynamicColor(light: L.RouteSelected.pressed, dark: D.RouteSelected.pressed)
                ),
                routeAlternate: ColorSet(default: dynamicColor(light: L.RouteAlternate.default, dark: D.RouteAlternate.default))
            ),
            space: ThemeSpace(
                xs: S.xs, sm: S.sm, md: S.md, lg: S.lg,
                xl: S.xl, xxl: S._2xl, xxxl: S._3xl, xxxxl: S._4xl
            ),
            radius: ThemeRadius(
                none: R.none, sm: R.sm, md: R.md, lg: R.lg,
                xl: R.xl, xxl: R._2xl, full: R.full
            ),
            type: ThemeType(
                label: ThemeTypeScale(sm: T.Label.sm, md: T.Label.md, lg: T.Label.lg),
                body: ThemeTypeScale(sm: T.Body.sm, md: T.Body.md, lg: T.Body.lg),
                title: ThemeTypeScale(sm: T.Title.sm, md: T.Title.md, lg: T.Title.lg),
                heading: ThemeTypeScale(sm: T.Heading.sm, md: T.Heading.md, lg: T.Heading.lg),
                display: ThemeTypeScale(sm: T.Display.sm, md: T.Display.md, lg: T.Display.lg)
            ),
            elevation: ThemeElevation(
                level0: EL._0, level1: EL._1, level2: EL._2,
                level3: EL._3, level4: EL._4, level5: EL._5
            ),
            domain: DomainColors.shared
        )
    }()
}

// Compatibility tag used by the old keypath helper above; not currently called.
public typealias ColorSetSource = Color
```

**Note:** the exact identifier names in `Tokens.Semantic.Color.Light.Primary.default` etc. depend on what the Swift formatter actually emits. After the codegen runs (Task 5 step 6), open `tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift` and confirm naming. Adjust this `Theme.swift` to match emitted casing — `pascalCase` for namespaces, `camelCase` for leaves, with backtick-escaping for `default`. Color groups whose leaves don't include some states (e.g. `Divider` only has `.default`) must be constructed with the matching `ColorSet` initializer.

- [ ] **Step 5: Write DomainColors.swift**

```swift
// tokens/platforms/swift/Sources/LaneShadowTheme/DomainColors.swift
import SwiftUI

#if canImport(UIKit)
import UIKit

private func dyn(_ light: Color, _ dark: Color) -> Color {
    Color(uiColor: UIColor { trait in
        trait.userInterfaceStyle == .dark ? UIColor(dark) : UIColor(light)
    })
}
#else
private func dyn(_ light: Color, _ dark: Color) -> Color { light }
#endif

public struct DomainColors: Sendable {
    public let waypointOnRoute: ColorSet
    public let waypointOffRoute: ColorSet
    public let waypointMixed: ColorSet
    public let enrichmentFast: ColorSet
    public let enrichmentExtended: ColorSet
    public let enrichmentCached: ColorSet
    public let deviationOriginalRoute: ColorSet
    public let deviationDetourPath: ColorSet
    public let deviationReconnectPoint: ColorSet
    public let locationPoiFill: ColorSet
    public let locationPoiRing: ColorSet
    public let locationPoiMuted: ColorSet
    public let locationPoiBg: ColorSet
    public let orange: ColorSet

    public static let shared: DomainColors = {
        let L = Tokens.Semantic.Color.Light.self
        let D = Tokens.Semantic.Color.Dark.self
        return DomainColors(
            waypointOnRoute: ColorSet(
                default: dyn(L.WaypointOnRoute.default, D.WaypointOnRoute.default),
                hover: dyn(L.WaypointOnRoute.hover, D.WaypointOnRoute.hover),
                pressed: dyn(L.WaypointOnRoute.pressed, D.WaypointOnRoute.pressed),
                disabled: dyn(L.WaypointOnRoute.disabled, D.WaypointOnRoute.disabled)
            ),
            waypointOffRoute: ColorSet(
                default: dyn(L.WaypointOffRoute.default, D.WaypointOffRoute.default),
                hover: dyn(L.WaypointOffRoute.hover, D.WaypointOffRoute.hover),
                pressed: dyn(L.WaypointOffRoute.pressed, D.WaypointOffRoute.pressed),
                disabled: dyn(L.WaypointOffRoute.disabled, D.WaypointOffRoute.disabled)
            ),
            waypointMixed: ColorSet(
                default: dyn(L.WaypointMixed.default, D.WaypointMixed.default),
                hover: dyn(L.WaypointMixed.hover, D.WaypointMixed.hover),
                pressed: dyn(L.WaypointMixed.pressed, D.WaypointMixed.pressed),
                disabled: dyn(L.WaypointMixed.disabled, D.WaypointMixed.disabled)
            ),
            enrichmentFast: ColorSet(
                default: dyn(L.EnrichmentFast.default, D.EnrichmentFast.default),
                hover: dyn(L.EnrichmentFast.hover, D.EnrichmentFast.hover),
                pressed: dyn(L.EnrichmentFast.pressed, D.EnrichmentFast.pressed),
                disabled: dyn(L.EnrichmentFast.disabled, D.EnrichmentFast.disabled)
            ),
            enrichmentExtended: ColorSet(
                default: dyn(L.EnrichmentExtended.default, D.EnrichmentExtended.default),
                hover: dyn(L.EnrichmentExtended.hover, D.EnrichmentExtended.hover),
                pressed: dyn(L.EnrichmentExtended.pressed, D.EnrichmentExtended.pressed),
                disabled: dyn(L.EnrichmentExtended.disabled, D.EnrichmentExtended.disabled)
            ),
            enrichmentCached: ColorSet(
                default: dyn(L.EnrichmentCached.default, D.EnrichmentCached.default),
                hover: dyn(L.EnrichmentCached.hover, D.EnrichmentCached.hover),
                pressed: dyn(L.EnrichmentCached.pressed, D.EnrichmentCached.pressed),
                disabled: dyn(L.EnrichmentCached.disabled, D.EnrichmentCached.disabled)
            ),
            deviationOriginalRoute: ColorSet(
                default: dyn(L.DeviationOriginalRoute.default, D.DeviationOriginalRoute.default),
                hover: dyn(L.DeviationOriginalRoute.hover, D.DeviationOriginalRoute.hover),
                pressed: dyn(L.DeviationOriginalRoute.pressed, D.DeviationOriginalRoute.pressed),
                disabled: dyn(L.DeviationOriginalRoute.disabled, D.DeviationOriginalRoute.disabled)
            ),
            deviationDetourPath: ColorSet(
                default: dyn(L.DeviationDetourPath.default, D.DeviationDetourPath.default),
                hover: dyn(L.DeviationDetourPath.hover, D.DeviationDetourPath.hover),
                pressed: dyn(L.DeviationDetourPath.pressed, D.DeviationDetourPath.pressed),
                disabled: dyn(L.DeviationDetourPath.disabled, D.DeviationDetourPath.disabled)
            ),
            deviationReconnectPoint: ColorSet(
                default: dyn(L.DeviationReconnectPoint.default, D.DeviationReconnectPoint.default),
                hover: dyn(L.DeviationReconnectPoint.hover, D.DeviationReconnectPoint.hover),
                pressed: dyn(L.DeviationReconnectPoint.pressed, D.DeviationReconnectPoint.pressed),
                disabled: dyn(L.DeviationReconnectPoint.disabled, D.DeviationReconnectPoint.disabled)
            ),
            locationPoiFill: ColorSet(
                default: dyn(L.LocationPoiFill.default, D.LocationPoiFill.default),
                hover: dyn(L.LocationPoiFill.hover, D.LocationPoiFill.hover),
                pressed: dyn(L.LocationPoiFill.pressed, D.LocationPoiFill.pressed),
                disabled: dyn(L.LocationPoiFill.disabled, D.LocationPoiFill.disabled)
            ),
            locationPoiRing: ColorSet(
                default: dyn(L.LocationPoiRing.default, D.LocationPoiRing.default),
                hover: dyn(L.LocationPoiRing.hover, D.LocationPoiRing.hover),
                pressed: dyn(L.LocationPoiRing.pressed, D.LocationPoiRing.pressed),
                disabled: dyn(L.LocationPoiRing.disabled, D.LocationPoiRing.disabled)
            ),
            locationPoiMuted: ColorSet(
                default: dyn(L.LocationPoiMuted.default, D.LocationPoiMuted.default),
                hover: dyn(L.LocationPoiMuted.hover, D.LocationPoiMuted.hover),
                pressed: dyn(L.LocationPoiMuted.pressed, D.LocationPoiMuted.pressed),
                disabled: dyn(L.LocationPoiMuted.disabled, D.LocationPoiMuted.disabled)
            ),
            locationPoiBg: ColorSet(
                default: dyn(L.LocationPoiBg.default, D.LocationPoiBg.default),
                hover: dyn(L.LocationPoiBg.hover, D.LocationPoiBg.hover),
                pressed: dyn(L.LocationPoiBg.pressed, D.LocationPoiBg.pressed),
                disabled: dyn(L.LocationPoiBg.disabled, D.LocationPoiBg.disabled)
            ),
            orange: ColorSet(
                default: dyn(L.Orange.default, D.Orange.default),
                hover: dyn(L.Orange.hover, D.Orange.hover),
                pressed: dyn(L.Orange.pressed, D.Orange.pressed),
                disabled: dyn(L.Orange.disabled, D.Orange.disabled)
            )
        )
    }()
}
```

- [ ] **Step 6: Write ThemeEnvironment.swift**

```swift
// tokens/platforms/swift/Sources/LaneShadowTheme/ThemeEnvironment.swift
import SwiftUI

private struct ThemeEnvironmentKey: EnvironmentKey {
    static let defaultValue: Theme = .shared
}

public extension EnvironmentValues {
    var theme: Theme {
        get { self[ThemeEnvironmentKey.self] }
        set { self[ThemeEnvironmentKey.self] = newValue }
    }
}

public extension View {
    /// Inject `Theme.shared` into the environment for this view tree.
    func laneShadowTheme(_ theme: Theme = .shared) -> some View {
        environment(\.theme, theme)
    }
}
```

- [ ] **Step 7: Run tests on macOS host (verifies type-checking and basic shape)**

```bash
cd tokens/platforms/swift
swift test 2>&1 | tail -30
cd -
```

If tests fail because of token-name mismatches between hand-written `Theme.swift` and codegen `Tokens.swift`, the engineer must:
1. Inspect `Generated/Tokens.swift` for the actual emitted identifier (e.g., `_2xl` vs `xxl` for keys like `2xl`)
2. Update `Theme.swift`/`DomainColors.swift` to use the emitted names
3. Re-run

Expected once aligned: `Test Suite 'All tests' passed at ...` with both tests green.

- [ ] **Step 8: Commit**

```bash
git add tokens/platforms/swift/Sources tokens/platforms/swift/Tests
git commit -m "feat(tokens-swift): add Theme + ThemeEnvironment + DomainColors with tests"
```

---

## Phase 3 — Kotlin Module

### Task 10: Gradle library manifest + AndroidManifest.xml

**Files:**
- Create: `/Users/justinrich/Projects/LaneShadow/tokens/platforms/kotlin/build.gradle.kts`
- Create: `/Users/justinrich/Projects/LaneShadow/tokens/platforms/kotlin/src/main/AndroidManifest.xml`

- [ ] **Step 1: Write build.gradle.kts**

```kotlin
// tokens/platforms/kotlin/build.gradle.kts
plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.laneshadow.theme"
    compileSdk = 34

    defaultConfig {
        minSdk = 26
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.14"
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.06.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.runtime:runtime")
    implementation("androidx.compose.foundation:foundation")

    testImplementation("junit:junit:4.13.2")
}
```

- [ ] **Step 2: Write minimal AndroidManifest.xml**

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" />
```

- [ ] **Step 3: Commit**

```bash
git add tokens/platforms/kotlin/build.gradle.kts tokens/platforms/kotlin/src/main/AndroidManifest.xml
git commit -m "feat(tokens-kotlin): add Android library manifest for theme module"
```

---

### Task 11: Kotlin theming layer — ColorSet, LaneShadowColors, DomainColors, LaneShadowTheme

**Files:**
- Create: `/Users/justinrich/Projects/LaneShadow/tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/SupportTypes.kt`
- Create: `/Users/justinrich/Projects/LaneShadow/tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/LaneShadowColors.kt`
- Create: `/Users/justinrich/Projects/LaneShadow/tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/DomainColors.kt`
- Create: `/Users/justinrich/Projects/LaneShadow/tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/LaneShadowTheme.kt`
- Create: `/Users/justinrich/Projects/LaneShadow/tokens/platforms/kotlin/src/test/kotlin/com/laneshadow/theme/ColorSetTest.kt`

- [ ] **Step 1: Write the failing test**

```kotlin
// tokens/platforms/kotlin/src/test/kotlin/com/laneshadow/theme/ColorSetTest.kt
package com.laneshadow.theme

import androidx.compose.ui.graphics.Color
import org.junit.Assert.assertEquals
import org.junit.Test

class ColorSetTest {
    @Test
    fun colorSet_defaultIsRequired_otherStatesOptional() {
        val cs = ColorSet(default = Color(0xFFB87333), hover = Color(0xFFC58545))
        assertEquals(Color(0xFFB87333), cs.default)
        assertEquals(Color(0xFFC58545), cs.hover)
        assertEquals(null, cs.pressed)
    }
}
```

- [ ] **Step 2: Write SupportTypes.kt**

```kotlin
// tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/SupportTypes.kt
package com.laneshadow.theme

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp

data class ColorSet(
    val default: Color,
    val hover: Color? = null,
    val pressed: Color? = null,
    val disabled: Color? = null,
    val focus: Color? = null,
)

data class LaneShadowElevation(
    val elevation: Dp,
    val offsetX: Dp,
    val offsetY: Dp,
    val opacity: Float,
    val radius: Dp,
)
```

- [ ] **Step 3: Write LaneShadowColors.kt**

```kotlin
// tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/LaneShadowColors.kt
package com.laneshadow.theme

import com.laneshadow.theme.generated.Tokens

data class LaneShadowColors(
    val primary: ColorSet,
    val secondary: ColorSet,
    val tertiary: ColorSet,
    val success: ColorSet,
    val warning: ColorSet,
    val warningContainer: ColorSet,
    val onWarningContainer: ColorSet,
    val danger: ColorSet,
    val info: ColorSet,
    val surface: ColorSet,
    val surfaceVariant: ColorSet,
    val background: ColorSet,
    val onSurface: ColorSet,
    val onPrimary: ColorSet,
    val onSecondary: ColorSet,
    val secondaryContainer: ColorSet,
    val onSecondaryContainer: ColorSet,
    val border: ColorSet,
    val input: ColorSet,
    val ring: ColorSet,
    val card: ColorSet,
    val popover: ColorSet,
    val accent: ColorSet,
    val muted: ColorSet,
    val divider: ColorSet,
    val scrim: ColorSet,
    val routeSelected: ColorSet,
    val routeAlternate: ColorSet,
) {
    companion object {
        fun light(): LaneShadowColors {
            val L = Tokens.Semantic.Color.Light
            return LaneShadowColors(
                primary = ColorSet(L.Primary.`default`, L.Primary.hover, L.Primary.pressed, L.Primary.disabled),
                secondary = ColorSet(L.Secondary.`default`, L.Secondary.hover, L.Secondary.pressed, L.Secondary.disabled),
                tertiary = ColorSet(L.Tertiary.`default`, L.Tertiary.hover, L.Tertiary.pressed, L.Tertiary.disabled),
                success = ColorSet(L.Success.`default`, L.Success.hover, L.Success.pressed, L.Success.disabled),
                warning = ColorSet(L.Warning.`default`, L.Warning.hover, L.Warning.pressed, L.Warning.disabled),
                warningContainer = ColorSet(L.WarningContainer.`default`, L.WarningContainer.hover, L.WarningContainer.pressed, L.WarningContainer.disabled),
                onWarningContainer = ColorSet(L.OnWarningContainer.`default`, L.OnWarningContainer.hover, L.OnWarningContainer.pressed, L.OnWarningContainer.disabled),
                danger = ColorSet(L.Danger.`default`, L.Danger.hover, L.Danger.pressed, L.Danger.disabled),
                info = ColorSet(L.Info.`default`, L.Info.hover, L.Info.pressed, L.Info.disabled),
                surface = ColorSet(L.Surface.`default`, L.Surface.hover, L.Surface.pressed, L.Surface.disabled),
                surfaceVariant = ColorSet(L.SurfaceVariant.`default`, L.SurfaceVariant.hover, L.SurfaceVariant.pressed, L.SurfaceVariant.disabled),
                background = ColorSet(L.Background.`default`, L.Background.hover, L.Background.pressed, L.Background.disabled),
                onSurface = ColorSet(L.OnSurface.`default`, L.OnSurface.hover, L.OnSurface.pressed, L.OnSurface.disabled),
                onPrimary = ColorSet(L.OnPrimary.`default`, L.OnPrimary.hover, L.OnPrimary.pressed, L.OnPrimary.disabled),
                onSecondary = ColorSet(L.OnSecondary.`default`, L.OnSecondary.hover, L.OnSecondary.pressed, L.OnSecondary.disabled),
                secondaryContainer = ColorSet(L.SecondaryContainer.`default`, L.SecondaryContainer.hover, L.SecondaryContainer.pressed, L.SecondaryContainer.disabled),
                onSecondaryContainer = ColorSet(L.OnSecondaryContainer.`default`, L.OnSecondaryContainer.hover, L.OnSecondaryContainer.pressed, L.OnSecondaryContainer.disabled),
                border = ColorSet(L.Border.`default`, L.Border.hover, L.Border.pressed, L.Border.disabled),
                input = ColorSet(L.Input.`default`, L.Input.hover, L.Input.pressed, L.Input.disabled),
                ring = ColorSet(L.Ring.`default`, L.Ring.hover, L.Ring.pressed, L.Ring.disabled),
                card = ColorSet(L.Card.`default`, L.Card.hover, L.Card.pressed, L.Card.disabled),
                popover = ColorSet(L.Popover.`default`, L.Popover.hover, L.Popover.pressed, L.Popover.disabled),
                accent = ColorSet(L.Accent.`default`, L.Accent.hover, L.Accent.pressed, L.Accent.disabled),
                muted = ColorSet(L.Muted.`default`, L.Muted.hover, L.Muted.pressed, L.Muted.disabled),
                divider = ColorSet(L.Divider.`default`),
                scrim = ColorSet(L.Scrim.`default`),
                routeSelected = ColorSet(L.RouteSelected.`default`, L.RouteSelected.hover, L.RouteSelected.pressed),
                routeAlternate = ColorSet(L.RouteAlternate.`default`),
            )
        }

        fun dark(): LaneShadowColors {
            val D = Tokens.Semantic.Color.Dark
            return LaneShadowColors(
                primary = ColorSet(D.Primary.`default`, D.Primary.hover, D.Primary.pressed, D.Primary.disabled),
                secondary = ColorSet(D.Secondary.`default`, D.Secondary.hover, D.Secondary.pressed, D.Secondary.disabled),
                tertiary = ColorSet(D.Tertiary.`default`, D.Tertiary.hover, D.Tertiary.pressed, D.Tertiary.disabled),
                success = ColorSet(D.Success.`default`, D.Success.hover, D.Success.pressed, D.Success.disabled),
                warning = ColorSet(D.Warning.`default`, D.Warning.hover, D.Warning.pressed, D.Warning.disabled),
                warningContainer = ColorSet(D.WarningContainer.`default`, D.WarningContainer.hover, D.WarningContainer.pressed, D.WarningContainer.disabled),
                onWarningContainer = ColorSet(D.OnWarningContainer.`default`, D.OnWarningContainer.hover, D.OnWarningContainer.pressed, D.OnWarningContainer.disabled),
                danger = ColorSet(D.Danger.`default`, D.Danger.hover, D.Danger.pressed, D.Danger.disabled),
                info = ColorSet(D.Info.`default`, D.Info.hover, D.Info.pressed, D.Info.disabled),
                surface = ColorSet(D.Surface.`default`, D.Surface.hover, D.Surface.pressed, D.Surface.disabled),
                surfaceVariant = ColorSet(D.SurfaceVariant.`default`, D.SurfaceVariant.hover, D.SurfaceVariant.pressed, D.SurfaceVariant.disabled),
                background = ColorSet(D.Background.`default`, D.Background.hover, D.Background.pressed, D.Background.disabled),
                onSurface = ColorSet(D.OnSurface.`default`, D.OnSurface.hover, D.OnSurface.pressed, D.OnSurface.disabled),
                onPrimary = ColorSet(D.OnPrimary.`default`, D.OnPrimary.hover, D.OnPrimary.pressed, D.OnPrimary.disabled),
                onSecondary = ColorSet(D.OnSecondary.`default`, D.OnSecondary.hover, D.OnSecondary.pressed, D.OnSecondary.disabled),
                secondaryContainer = ColorSet(D.SecondaryContainer.`default`, D.SecondaryContainer.hover, D.SecondaryContainer.pressed, D.SecondaryContainer.disabled),
                onSecondaryContainer = ColorSet(D.OnSecondaryContainer.`default`, D.OnSecondaryContainer.hover, D.OnSecondaryContainer.pressed, D.OnSecondaryContainer.disabled),
                border = ColorSet(D.Border.`default`, D.Border.hover, D.Border.pressed, D.Border.disabled),
                input = ColorSet(D.Input.`default`, D.Input.hover, D.Input.pressed, D.Input.disabled),
                ring = ColorSet(D.Ring.`default`, D.Ring.hover, D.Ring.pressed, D.Ring.disabled),
                card = ColorSet(D.Card.`default`, D.Card.hover, D.Card.pressed, D.Card.disabled),
                popover = ColorSet(D.Popover.`default`, D.Popover.hover, D.Popover.pressed, D.Popover.disabled),
                accent = ColorSet(D.Accent.`default`, D.Accent.hover, D.Accent.pressed, D.Accent.disabled),
                muted = ColorSet(D.Muted.`default`, D.Muted.hover, D.Muted.pressed, D.Muted.disabled),
                divider = ColorSet(D.Divider.`default`),
                scrim = ColorSet(D.Scrim.`default`),
                routeSelected = ColorSet(D.RouteSelected.`default`, D.RouteSelected.hover, D.RouteSelected.pressed),
                routeAlternate = ColorSet(D.RouteAlternate.`default`),
            )
        }
    }
}
```

- [ ] **Step 4: Write DomainColors.kt**

```kotlin
// tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/DomainColors.kt
package com.laneshadow.theme

import com.laneshadow.theme.generated.Tokens

data class DomainColors(
    val waypointOnRoute: ColorSet,
    val waypointOffRoute: ColorSet,
    val waypointMixed: ColorSet,
    val enrichmentFast: ColorSet,
    val enrichmentExtended: ColorSet,
    val enrichmentCached: ColorSet,
    val deviationOriginalRoute: ColorSet,
    val deviationDetourPath: ColorSet,
    val deviationReconnectPoint: ColorSet,
    val locationPoiFill: ColorSet,
    val locationPoiRing: ColorSet,
    val locationPoiMuted: ColorSet,
    val locationPoiBg: ColorSet,
    val orange: ColorSet,
) {
    companion object {
        fun light(): DomainColors {
            val L = Tokens.Semantic.Color.Light
            return DomainColors(
                waypointOnRoute = ColorSet(L.WaypointOnRoute.`default`, L.WaypointOnRoute.hover, L.WaypointOnRoute.pressed, L.WaypointOnRoute.disabled),
                waypointOffRoute = ColorSet(L.WaypointOffRoute.`default`, L.WaypointOffRoute.hover, L.WaypointOffRoute.pressed, L.WaypointOffRoute.disabled),
                waypointMixed = ColorSet(L.WaypointMixed.`default`, L.WaypointMixed.hover, L.WaypointMixed.pressed, L.WaypointMixed.disabled),
                enrichmentFast = ColorSet(L.EnrichmentFast.`default`, L.EnrichmentFast.hover, L.EnrichmentFast.pressed, L.EnrichmentFast.disabled),
                enrichmentExtended = ColorSet(L.EnrichmentExtended.`default`, L.EnrichmentExtended.hover, L.EnrichmentExtended.pressed, L.EnrichmentExtended.disabled),
                enrichmentCached = ColorSet(L.EnrichmentCached.`default`, L.EnrichmentCached.hover, L.EnrichmentCached.pressed, L.EnrichmentCached.disabled),
                deviationOriginalRoute = ColorSet(L.DeviationOriginalRoute.`default`, L.DeviationOriginalRoute.hover, L.DeviationOriginalRoute.pressed, L.DeviationOriginalRoute.disabled),
                deviationDetourPath = ColorSet(L.DeviationDetourPath.`default`, L.DeviationDetourPath.hover, L.DeviationDetourPath.pressed, L.DeviationDetourPath.disabled),
                deviationReconnectPoint = ColorSet(L.DeviationReconnectPoint.`default`, L.DeviationReconnectPoint.hover, L.DeviationReconnectPoint.pressed, L.DeviationReconnectPoint.disabled),
                locationPoiFill = ColorSet(L.LocationPoiFill.`default`, L.LocationPoiFill.hover, L.LocationPoiFill.pressed, L.LocationPoiFill.disabled),
                locationPoiRing = ColorSet(L.LocationPoiRing.`default`, L.LocationPoiRing.hover, L.LocationPoiRing.pressed, L.LocationPoiRing.disabled),
                locationPoiMuted = ColorSet(L.LocationPoiMuted.`default`, L.LocationPoiMuted.hover, L.LocationPoiMuted.pressed, L.LocationPoiMuted.disabled),
                locationPoiBg = ColorSet(L.LocationPoiBg.`default`, L.LocationPoiBg.hover, L.LocationPoiBg.pressed, L.LocationPoiBg.disabled),
                orange = ColorSet(L.Orange.`default`, L.Orange.hover, L.Orange.pressed, L.Orange.disabled),
            )
        }

        fun dark(): DomainColors {
            val D = Tokens.Semantic.Color.Dark
            return DomainColors(
                waypointOnRoute = ColorSet(D.WaypointOnRoute.`default`, D.WaypointOnRoute.hover, D.WaypointOnRoute.pressed, D.WaypointOnRoute.disabled),
                waypointOffRoute = ColorSet(D.WaypointOffRoute.`default`, D.WaypointOffRoute.hover, D.WaypointOffRoute.pressed, D.WaypointOffRoute.disabled),
                waypointMixed = ColorSet(D.WaypointMixed.`default`, D.WaypointMixed.hover, D.WaypointMixed.pressed, D.WaypointMixed.disabled),
                enrichmentFast = ColorSet(D.EnrichmentFast.`default`, D.EnrichmentFast.hover, D.EnrichmentFast.pressed, D.EnrichmentFast.disabled),
                enrichmentExtended = ColorSet(D.EnrichmentExtended.`default`, D.EnrichmentExtended.hover, D.EnrichmentExtended.pressed, D.EnrichmentExtended.disabled),
                enrichmentCached = ColorSet(D.EnrichmentCached.`default`, D.EnrichmentCached.hover, D.EnrichmentCached.pressed, D.EnrichmentCached.disabled),
                deviationOriginalRoute = ColorSet(D.DeviationOriginalRoute.`default`, D.DeviationOriginalRoute.hover, D.DeviationOriginalRoute.pressed, D.DeviationOriginalRoute.disabled),
                deviationDetourPath = ColorSet(D.DeviationDetourPath.`default`, D.DeviationDetourPath.hover, D.DeviationDetourPath.pressed, D.DeviationDetourPath.disabled),
                deviationReconnectPoint = ColorSet(D.DeviationReconnectPoint.`default`, D.DeviationReconnectPoint.hover, D.DeviationReconnectPoint.pressed, D.DeviationReconnectPoint.disabled),
                locationPoiFill = ColorSet(D.LocationPoiFill.`default`, D.LocationPoiFill.hover, D.LocationPoiFill.pressed, D.LocationPoiFill.disabled),
                locationPoiRing = ColorSet(D.LocationPoiRing.`default`, D.LocationPoiRing.hover, D.LocationPoiRing.pressed, D.LocationPoiRing.disabled),
                locationPoiMuted = ColorSet(D.LocationPoiMuted.`default`, D.LocationPoiMuted.hover, D.LocationPoiMuted.pressed, D.LocationPoiMuted.disabled),
                locationPoiBg = ColorSet(D.LocationPoiBg.`default`, D.LocationPoiBg.hover, D.LocationPoiBg.pressed, D.LocationPoiBg.disabled),
                orange = ColorSet(D.Orange.`default`, D.Orange.hover, D.Orange.pressed, D.Orange.disabled),
            )
        }
    }
}
```

- [ ] **Step 5: Write LaneShadowTheme.kt**

```kotlin
// tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/LaneShadowTheme.kt
package com.laneshadow.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.remember
import androidx.compose.ui.text.TextStyle
import com.laneshadow.theme.generated.Tokens

data class LaneShadowSpace(
    val xs: androidx.compose.ui.unit.Dp,
    val sm: androidx.compose.ui.unit.Dp,
    val md: androidx.compose.ui.unit.Dp,
    val lg: androidx.compose.ui.unit.Dp,
    val xl: androidx.compose.ui.unit.Dp,
    val xxl: androidx.compose.ui.unit.Dp,
    val xxxl: androidx.compose.ui.unit.Dp,
    val xxxxl: androidx.compose.ui.unit.Dp,
)

data class LaneShadowRadius(
    val none: androidx.compose.ui.unit.Dp,
    val sm: androidx.compose.ui.unit.Dp,
    val md: androidx.compose.ui.unit.Dp,
    val lg: androidx.compose.ui.unit.Dp,
    val xl: androidx.compose.ui.unit.Dp,
    val xxl: androidx.compose.ui.unit.Dp,
    val full: androidx.compose.ui.unit.Dp,
)

data class LaneShadowTypeScale(val sm: TextStyle, val md: TextStyle, val lg: TextStyle)

data class LaneShadowType(
    val label: LaneShadowTypeScale,
    val body: LaneShadowTypeScale,
    val title: LaneShadowTypeScale,
    val heading: LaneShadowTypeScale,
    val display: LaneShadowTypeScale,
)

data class LaneShadowThemeValues(
    val colors: LaneShadowColors,
    val space: LaneShadowSpace,
    val radius: LaneShadowRadius,
    val type: LaneShadowType,
    val domain: DomainColors,
)

val LocalLaneShadowTheme: ProvidableCompositionLocal<LaneShadowThemeValues> =
    compositionLocalOf { error("LaneShadowTheme not provided") }

private fun spaceValues(): LaneShadowSpace {
    val S = Tokens.Semantic.Space
    return LaneShadowSpace(
        xs = S.xs, sm = S.sm, md = S.md, lg = S.lg,
        xl = S.xl, xxl = S.`_2xl`, xxxl = S.`_3xl`, xxxxl = S.`_4xl`,
    )
}

private fun radiusValues(): LaneShadowRadius {
    val R = Tokens.Semantic.Radius
    return LaneShadowRadius(
        none = R.none, sm = R.sm, md = R.md, lg = R.lg,
        xl = R.xl, xxl = R.`_2xl`, full = R.full,
    )
}

private fun typeValues(): LaneShadowType {
    val T = Tokens.Semantic.Type
    return LaneShadowType(
        label = LaneShadowTypeScale(T.Label.sm, T.Label.md, T.Label.lg),
        body = LaneShadowTypeScale(T.Body.sm, T.Body.md, T.Body.lg),
        title = LaneShadowTypeScale(T.Title.sm, T.Title.md, T.Title.lg),
        heading = LaneShadowTypeScale(T.Heading.sm, T.Heading.md, T.Heading.lg),
        display = LaneShadowTypeScale(T.Display.sm, T.Display.md, T.Display.lg),
    )
}

private fun materialColorScheme(colors: LaneShadowColors, dark: Boolean): ColorScheme {
    val base = if (dark) darkColorScheme() else lightColorScheme()
    return base.copy(
        primary = colors.primary.default,
        onPrimary = colors.onPrimary.default,
        secondary = colors.secondary.default,
        onSecondary = colors.onSecondary.default,
        tertiary = colors.tertiary.default,
        background = colors.background.default,
        onBackground = colors.onSurface.default,
        surface = colors.surface.default,
        onSurface = colors.onSurface.default,
        surfaceVariant = colors.surfaceVariant.default,
        error = colors.danger.default,
    )
}

@Composable
fun LaneShadowTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val themeValues = remember(darkTheme) {
        val colors = if (darkTheme) LaneShadowColors.dark() else LaneShadowColors.light()
        val domain = if (darkTheme) DomainColors.dark() else DomainColors.light()
        LaneShadowThemeValues(
            colors = colors,
            space = spaceValues(),
            radius = radiusValues(),
            type = typeValues(),
            domain = domain,
        )
    }

    CompositionLocalProvider(LocalLaneShadowTheme provides themeValues) {
        MaterialTheme(
            colorScheme = materialColorScheme(themeValues.colors, darkTheme),
            content = content,
        )
    }
}
```

- [ ] **Step 6: Run JVM unit test**

```bash
cd android
./gradlew :theme:testDebugUnitTest 2>&1 | tail -30
cd -
```
**Note:** this requires Task 12 to have wired the `:theme` subproject in `android/settings.gradle.kts`. If you're running this task in isolation, Step 6 can be deferred until after Task 12 step 1.

Expected once wired: `BUILD SUCCESSFUL` and `ColorSetTest > colorSet_defaultIsRequired_otherStatesOptional PASSED`.

If compilation fails because of token-name mismatches (e.g., `_2xl` vs `xxl`), inspect `tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/generated/Tokens.kt` for the actually-emitted identifier and update the hand-written files to match.

- [ ] **Step 7: Commit**

```bash
git add tokens/platforms/kotlin/src
git commit -m "feat(tokens-kotlin): add LaneShadowTheme + colors + domain with tests"
```

---

## Phase 4 — TypeScript Workspace Package

### Task 12: TS package manifest + workspace registration

**Files:**
- Create: `/Users/justinrich/Projects/LaneShadow/tokens/platforms/typescript/package.json`
- Create: `/Users/justinrich/Projects/LaneShadow/tokens/platforms/typescript/tsconfig.json`
- Modify: `/Users/justinrich/Projects/LaneShadow/pnpm-workspace.yaml`

- [ ] **Step 1: Write package.json**

```json
{
  "name": "@laneshadow/theme",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": ">=18",
    "react-native": ">=0.74"
  },
  "devDependencies": {
    "typescript": "~5.9.2"
  }
}
```

- [ ] **Step 2: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-native",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "noEmit": true,
    "lib": ["ES2022", "DOM"]
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Add to pnpm-workspace.yaml**

Edit `pnpm-workspace.yaml` to add the new package. Final contents:

```yaml
packages:
  - server
  - react-native
  - tokens/platforms/typescript
```

- [ ] **Step 4: Install workspace deps**

```bash
pnpm install
```
Expected: workspace `@laneshadow/theme` shown in install output, no errors.

- [ ] **Step 5: Commit**

```bash
git add tokens/platforms/typescript/package.json tokens/platforms/typescript/tsconfig.json pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "feat(tokens-ts): register @laneshadow/theme as pnpm workspace"
```

---

### Task 13: TS theming layer — index.ts, types.ts

**Files:**
- Create: `/Users/justinrich/Projects/LaneShadow/tokens/platforms/typescript/src/index.ts`
- Create: `/Users/justinrich/Projects/LaneShadow/tokens/platforms/typescript/src/types.ts`

- [ ] **Step 1: Write types.ts**

```ts
// tokens/platforms/typescript/src/types.ts
import { tokens } from './generated/tokens'

export type Tokens = typeof tokens
export type ColorScheme = 'light' | 'dark'
export type ThemeColors = Tokens['semantic']['color']['light']
export type ThemeSpace = Tokens['semantic']['space']
export type ThemeRadius = Tokens['semantic']['radius']
export type ThemeType = Tokens['semantic']['type']

export interface Theme {
  scheme: ColorScheme
  colors: ThemeColors
  space: ThemeSpace
  radius: ThemeRadius
  type: ThemeType
}
```

- [ ] **Step 2: Write index.ts**

```ts
// tokens/platforms/typescript/src/index.ts
import { useColorScheme } from 'react-native'
import { tokens } from './generated/tokens'
import type { Theme, ColorScheme } from './types'

export { tokens }
export type { Theme, ColorScheme, ThemeColors, ThemeSpace, ThemeRadius, ThemeType, Tokens } from './types'

export function buildTheme(scheme: ColorScheme): Theme {
  return {
    scheme,
    colors: scheme === 'dark' ? (tokens.semantic.color.dark as never) : tokens.semantic.color.light,
    space: tokens.semantic.space,
    radius: tokens.semantic.radius,
    type: tokens.semantic.type,
  }
}

export function useTheme(): Theme {
  const scheme = (useColorScheme() ?? 'light') as ColorScheme
  return buildTheme(scheme)
}
```

- [ ] **Step 3: Type-check the package**

```bash
pnpm --filter @laneshadow/theme exec tsc --noEmit
```
Expected: clean exit (no diagnostics).

- [ ] **Step 4: Commit**

```bash
git add tokens/platforms/typescript/src/index.ts tokens/platforms/typescript/src/types.ts
git commit -m "feat(tokens-ts): add useTheme hook + theme types"
```

---

## Phase 5 — iOS App Integration

### Task 14: Wire local Swift Package into Xcode project

**Files:**
- Modify: `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow.xcodeproj/project.pbxproj`
- Delete: `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Theme.swift`

The project already references one local SPM (`ConvexMobile`). We add a second alongside it and remove the placeholder Theme file.

- [ ] **Step 1: Inspect existing local SPM block to copy its pattern**

```bash
grep -n -B1 -A6 "XCLocalSwiftPackageReference\|XCSwiftPackageProductDependency\|packageReferences" ios/LaneShadow.xcodeproj/project.pbxproj | head -60
```
Note the existing UUIDs and the structure of `packageReferences = (...)` and `packageProductDependencies = (...)` arrays in the relevant sections.

- [ ] **Step 2: Add `XCLocalSwiftPackageReference` for the new package**

Edit `ios/LaneShadow.xcodeproj/project.pbxproj`. Locate the `Begin XCLocalSwiftPackageReference section` block (or the equivalent `packageReferences` array on the root project object) and append:

```text
		AABBCC0000000000LANE0001 /* XCLocalSwiftPackageReference "../tokens/platforms/swift" */ = {
			isa = XCLocalSwiftPackageReference;
			relativePath = "../tokens/platforms/swift";
		};
```

Then ensure the root `PBXProject` object's `packageReferences = (...)` array includes the new UUID `AABBCC0000000000LANE0001` alongside the existing one.

- [ ] **Step 3: Add `XCSwiftPackageProductDependency` for `LaneShadowTheme`**

Append in the `Begin XCSwiftPackageProductDependency section` block:

```text
		AABBCC0000000000LANE0002 /* LaneShadowTheme */ = {
			isa = XCSwiftPackageProductDependency;
			productName = LaneShadowTheme;
		};
```

- [ ] **Step 4: Add a `PBXBuildFile` linking the product into the LaneShadow target**

Append in `Begin PBXBuildFile section`:

```text
		AABBCC0000000000LANE0003 /* LaneShadowTheme in Frameworks */ = {isa = PBXBuildFile; productRef = AABBCC0000000000LANE0002 /* LaneShadowTheme */; };
```

- [ ] **Step 5: Add the build file to the LaneShadow target's Frameworks build phase**

Locate `PBXFrameworksBuildPhase` for the `LaneShadow` target (UUID `657C760D587E8F66D83F50E2` per the existing project). Add `AABBCC0000000000LANE0003 /* LaneShadowTheme in Frameworks */` to the `files = (...)` list, alongside `Foundation.framework` and `ConvexMobile`.

- [ ] **Step 6: Add product to the target's `packageProductDependencies` array**

Find the `LaneShadow` PBXNativeTarget object. Locate `packageProductDependencies = (...)` (or add it if missing) and include `AABBCC0000000000LANE0002 /* LaneShadowTheme */`.

- [ ] **Step 7: Verify the project still parses**

```bash
xcodebuild -project ios/LaneShadow.xcodeproj -list 2>&1 | head -20
```
Expected: lists `LaneShadow` target without errors. If parse fails (`Could not parse project file`), restore from `git checkout` and try again with smaller incremental edits.

- [ ] **Step 8: Verify build still succeeds (placeholder Theme.swift remains; new SPM resolves but is not yet consumed)**

```bash
xcodebuild build -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'generic/platform=iOS Simulator' -quiet 2>&1 | tail -10
```
Expected: `BUILD SUCCEEDED`. SPM resolution shows `LaneShadowTheme` graph node. Existing `ThemeColor`/`ThemeSpacing`/`ThemeTypography` placeholders still in use.

- [ ] **Step 9: Commit (green — placeholder removal happens in Task 15 alongside the consumer migration)**

```bash
git add ios/LaneShadow.xcodeproj/project.pbxproj
git commit -m "ios: link LaneShadowTheme local SPM (consumer migration follows)"
```

`ios-typecheck` lefthook gate runs on this commit and must pass.

---

### Task 15: Migrate iOS bootstrap views to LaneShadowTheme + delete placeholder

**Files:**
- Modify: `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/App.swift`
- Modify: `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/ContentView.swift`
- Delete: `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Theme.swift`
- Modify: `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow.xcodeproj/project.pbxproj` (drop Theme.swift refs)

- [ ] **Step 1: Update App.swift to inject the theme**

```swift
// ios/LaneShadow/App.swift
import SwiftUI
import LaneShadowTheme

@main
struct LaneShadowApp: App {
    @State private var convexStore = ConvexStore()

    var body: some Scene {
        WindowGroup {
            ContentView(convexStore: convexStore)
                .laneShadowTheme()
        }
    }
}
```

- [ ] **Step 2: Update ContentView.swift to consume `@Environment(\.theme)`**

```swift
// ios/LaneShadow/ContentView.swift
import SwiftUI
import LaneShadowTheme

struct ContentView: View {
    @Bindable var convexStore: ConvexStore
    @Environment(\.theme) private var theme

    var body: some View {
        NavigationStack {
            VStack(spacing: theme.space.xl) {
                Text("LaneShadow")
                    .font(theme.type.title.lg.font)
                    .foregroundStyle(theme.colors.onSurface.default)

                Text("hello:get")
                    .font(theme.type.label.md.font)
                    .foregroundStyle(theme.colors.onSurface.default)

                Text(convexStore.helloValue)
                    .font(theme.type.body.md.font)
                    .foregroundStyle(theme.colors.onSurface.default)
                    .multilineTextAlignment(.center)
            }
            .padding(theme.space.xl)
            .background(theme.colors.background.default)
            .navigationTitle("LaneShadow")
            .navigationBarTitleDisplayMode(.inline)
            .task {
                convexStore.start()
            }
        }
    }
}

#Preview {
    ContentView(convexStore: ConvexStore.preview)
        .laneShadowTheme()
}
```

- [ ] **Step 3: Remove placeholder Theme.swift from disk and pbxproj**

3a. Delete the file:
```bash
rm ios/LaneShadow/Theme.swift
```

3b. Edit `ios/LaneShadow.xcodeproj/project.pbxproj` and remove four lines/entries referencing `Theme.swift`:
- The `PBXBuildFile` line for `Theme.swift in Sources` (UUID `DD57C9A9DFF55D3791E5EFBE`).
- The `PBXFileReference` line for `Theme.swift` (UUID `C8B685365036F2823497196E`).
- The `Theme.swift` entry in the `LaneShadow` `PBXGroup` `children = (...)` array.
- The `Theme.swift in Sources` entry in the LaneShadow target's `PBXSourcesBuildPhase`.

3c. Verify project parses:
```bash
xcodebuild -project ios/LaneShadow.xcodeproj -list 2>&1 | head -10
```
Expected: lists `LaneShadow` scheme cleanly.

- [ ] **Step 4: Build for simulator**

```bash
xcodebuild build -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'generic/platform=iOS Simulator' -quiet 2>&1 | tail -10
```
Expected: `BUILD SUCCEEDED`. (`ios-typecheck` lefthook gate runs the same command on commit.)

- [ ] **Step 5: Commit**

```bash
git add ios/LaneShadow/App.swift ios/LaneShadow/ContentView.swift ios/LaneShadow.xcodeproj/project.pbxproj
git rm ios/LaneShadow/Theme.swift
git commit -m "ios: migrate ContentView to LaneShadowTheme env, drop placeholder Theme.swift"
```

---

## Phase 6 — Android App Integration

### Task 16: Include `:theme` Gradle subproject + depend on it from `:app`

**Files:**
- Modify: `/Users/justinrich/Projects/LaneShadow/android/settings.gradle.kts`
- Modify: `/Users/justinrich/Projects/LaneShadow/android/app/build.gradle.kts`

- [ ] **Step 1: Update settings.gradle.kts**

Replace the contents with:

```kotlin
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "LaneShadowAndroid"
include(":app")
include(":theme")
project(":theme").projectDir = file("../tokens/platforms/kotlin")
```

- [ ] **Step 2: Update android/app/build.gradle.kts**

Find the `dependencies { ... }` block and add at the top:

```kotlin
    implementation(project(":theme"))
```

- [ ] **Step 3: Verify subproject is recognized**

```bash
cd android
./gradlew projects 2>&1 | tail -20
cd -
```
Expected: output lists both `+--- Project ':app'` and `+--- Project ':theme'`.

- [ ] **Step 4: Build the theme module standalone**

```bash
cd android
./gradlew :theme:assembleDebug 2>&1 | tail -20
cd -
```
Expected: `BUILD SUCCESSFUL`.

If compilation fails because of token-name mismatches, inspect `tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/generated/Tokens.kt` and update the hand-written `LaneShadowColors.kt` / `DomainColors.kt` / `LaneShadowTheme.kt` to use the actually-emitted identifiers.

- [ ] **Step 5: Commit**

```bash
git add android/settings.gradle.kts android/app/build.gradle.kts
git commit -m "android: include :theme subproject from tokens/platforms/kotlin and depend from :app"
```

---

### Task 17: Migrate MainActivity to wrap content in `LaneShadowTheme { }`

**Files:**
- Modify: `/Users/justinrich/Projects/LaneShadow/android/app/src/main/java/com/laneshadow/MainActivity.kt`

- [ ] **Step 1: Update MainActivity.kt**

```kotlin
// android/app/src/main/java/com/laneshadow/MainActivity.kt
package com.laneshadow

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.LocalLaneShadowTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            LaneShadowTheme {
                LaneShadowAppContent(deploymentId = BuildConfig.CONVEX_DEPLOYMENT)
            }
        }
    }
}

@Composable
private fun LaneShadowAppContent(deploymentId: String) {
    val theme = LocalLaneShadowTheme.current
    Surface(modifier = Modifier.fillMaxSize(), color = theme.colors.background.default) {
        Column(
            modifier = Modifier.fillMaxSize().padding(theme.space.xl),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "LaneShadow placeholder",
                style = theme.type.heading.md,
                color = theme.colors.onSurface.default,
            )
            Text(
                text = "hello:get value",
                style = theme.type.body.md,
                color = theme.colors.onSurface.default,
            )
            Text(
                text = if (deploymentId.isBlank()) "deployment: missing" else "deployment: $deploymentId",
                style = theme.type.body.sm,
                color = theme.colors.onSurface.default,
            )
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun LaneShadowAppContentPreview() {
    LaneShadowTheme {
        LaneShadowAppContent(deploymentId = "dev:quirky-panther-164")
    }
}
```

- [ ] **Step 2: Build the full app**

```bash
cd android
./gradlew :app:assembleDebug 2>&1 | tail -20
cd -
```
Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 3: Commit**

```bash
git add android/app/src/main/java/com/laneshadow/MainActivity.kt
git commit -m "android: wrap MainActivity content in LaneShadowTheme composable"
```

---

## Phase 7 — End-to-End Verification

### Task 18: Run all gates

- [ ] **Step 1: Token gates**

```bash
pnpm tokens:validate && pnpm tokens:check-drift
```
Expected: both exit 0 with success messages.

- [ ] **Step 2: Codegen unit tests**

```bash
node --test tokens/config/formats/__tests__/
```
Expected: all tests pass across all three formatter test files.

- [ ] **Step 3: Swift package tests**

```bash
cd tokens/platforms/swift && swift test 2>&1 | tail -10 && cd -
```
Expected: `Test Suite 'All tests' passed`.

- [ ] **Step 4: Kotlin module tests**

```bash
cd android && ./gradlew :theme:testDebugUnitTest 2>&1 | tail -10 && cd -
```
Expected: `BUILD SUCCESSFUL` with `ColorSetTest > ... PASSED`.

- [ ] **Step 5: TypeScript type-check (full repo)**

```bash
pnpm type-check:native
```
Expected: clean exit.

```bash
pnpm --filter @laneshadow/theme exec tsc --noEmit
```
Expected: clean exit.

- [ ] **Step 6: iOS build**

```bash
xcodebuild build -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | tail -10
```
Expected: `BUILD SUCCEEDED`.

- [ ] **Step 7: Android app build**

```bash
cd android && ./gradlew :app:assembleDebug 2>&1 | tail -10 && cd -
```
Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 8: RN unchanged check**

```bash
git diff HEAD~20 -- react-native/styles/theme.ts | wc -l
```
Expected: `0` (no changes to RN theme during this work).

- [ ] **Step 9: Final summary commit (no code changes; just a checkpoint marker)**

```bash
git commit --allow-empty -m "verify: cross-platform theme module gates green

- tokens:validate ✓
- tokens:check-drift ✓
- node --test (formatters) ✓
- swift test (LaneShadowTheme) ✓
- gradle :theme:test ✓
- pnpm type-check:native ✓
- xcodebuild iOS Simulator ✓
- gradle :app:assembleDebug ✓
- react-native/styles/theme.ts untouched ✓
"
```

---

## Self-Review Checklist (run before merge)

- [ ] All 18 tasks completed; `git log` shows ~17 commits + 1 checkpoint.
- [ ] No `TBD`/`TODO`/`FIXME` strings introduced under `tokens/`.
- [ ] No edits to `react-native/styles/theme.ts` (RN cutover is the next task, not this one).
- [ ] Generated files have `@generated` headers and pass `tokens:check-drift`.
- [ ] Bootstrap iOS app at `ios/LaneShadow/ContentView.swift` consumes only `@Environment(\.theme)` — no hard-coded colors or sizes.
- [ ] Bootstrap Android app at `android/app/src/main/java/com/laneshadow/MainActivity.kt` consumes only `LocalLaneShadowTheme.current` — no hard-coded colors.
- [ ] Lefthook drift gate fires on token edits without bypass.
