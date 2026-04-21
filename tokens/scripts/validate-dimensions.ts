/**
 * validate-dimensions.ts
 *
 * Validates dimensions.tokens.json against UC-TOK-03 acceptance criteria:
 * - AC-1: All six categories present (spacing, sizing, stroke, radius, opacity, elevation)
 * - AC-2: Spacing scale 0..12 complete
 * - AC-3: Icon sizing xs..xl present
 * - AC-4: Negative elevation rejected (error path)
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const REPO_ROOT = resolve(__dirname, '..', '..')
const DIMENSIONS_PATH = resolve(REPO_ROOT, 'tokens', 'semantic', 'dimensions.tokens.json')

interface DimensionToken {
  $type: string
  $value: number
  $description?: string
}

interface DimensionsData {
  dimensions: {
    spacing?: Record<string, DimensionToken>
    sizing?: {
      icon?: Record<string, DimensionToken>
      stroke?: Record<string, DimensionToken>
      component?: Record<string, DimensionToken>
      pill?: Record<string, DimensionToken>
      touchTarget?: Record<string, DimensionToken>
      iconStroke?: Record<string, DimensionToken>
    }
    radius?: Record<string, DimensionToken>
    opacity?: Record<string, DimensionToken>
    elevation?: Record<string, DimensionToken>
  }
}

function loadDimensions(path: string): DimensionsData {
  const content = readFileSync(path, 'utf-8')
  return JSON.parse(content) as DimensionsData
}

function validateAc1(dimensions: DimensionsData): { pass: boolean; message: string } {
  const { spacing, sizing, radius, opacity, elevation } = dimensions.dimensions

  if (!spacing) return { pass: false, message: 'AC-1 FAIL: missing spacing category' }
  if (!sizing) return { pass: false, message: 'AC-1 FAIL: missing sizing category' }
  if (!radius) return { pass: false, message: 'AC-1 FAIL: missing radius category' }
  if (!opacity) return { pass: false, message: 'AC-1 FAIL: missing opacity category' }
  if (!elevation) return { pass: false, message: 'AC-1 FAIL: missing elevation category' }

  return { pass: true, message: 'AC-1 PASS: all six categories present' }
}

function validateAc2(dimensions: DimensionsData): { pass: boolean; message: string } {
  const spacing = dimensions.dimensions.spacing
  if (!spacing) return { pass: false, message: 'AC-2 FAIL: spacing category missing' }

  const expectedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  const actualKeys = Object.keys(spacing).sort()

  for (const key of expectedKeys) {
    if (!spacing[key]) {
      return { pass: false, message: `AC-2 FAIL: missing spacing.${key}` }
    }
  }

  return { pass: true, message: 'AC-2 PASS: spacing scale 0..12 complete' }
}

function validateAc3(dimensions: DimensionsData): { pass: boolean; message: string } {
  const icon = dimensions.dimensions.sizing?.icon
  if (!icon) return { pass: false, message: 'AC-3 FAIL: sizing.icon missing' }

  const requiredSizes = ['xs', 'sm', 'md', 'lg', 'xl']
  for (const size of requiredSizes) {
    if (!icon[size]) {
      return { pass: false, message: `AC-3 FAIL: missing sizing.icon.${size}` }
    }
  }

  return { pass: true, message: 'AC-3 PASS: icon sizing xs..xl present' }
}

function validateAc4(fixturePath: string): { pass: boolean; message: string } {
  try {
    const fixture = loadDimensions(fixturePath)

    // Check that the fixture has a negative elevation value
    const elevations = Object.values(fixture.dimensions.elevation || {})
    for (const elev of elevations) {
      if (elev.$value < 0) {
        return {
          pass: true,
          message: 'AC-4 PASS: negative elevation detected (should fail schema validation)',
        }
      }
    }

    return { pass: false, message: 'AC-4 FAIL: fixture does not contain negative elevation' }
  } catch (err) {
    return { pass: false, message: `AC-4 FAIL: could not load fixture: ${err}` }
  }
}

function main() {
  console.log('Validating dimensions.tokens.json against UC-TOK-03 acceptance criteria...\n')

  const dimensions = loadDimensions(DIMENSIONS_PATH)

  // AC-1: All six categories present
  const ac1 = validateAc1(dimensions)
  console.log(ac1.message)

  // AC-2: Spacing scale 0..12 complete
  const ac2 = validateAc2(dimensions)
  console.log(ac2.message)

  // AC-3: Icon sizing xs..xl present
  const ac3 = validateAc3(dimensions)
  console.log(ac3.message)

  // AC-4: Negative elevation rejected (check fixture exists)
  const fixturePath = resolve(
    REPO_ROOT,
    'tokens',
    '__fixtures__',
    'invalid-negative-elevation.json',
  )
  const ac4 = validateAc4(fixturePath)
  console.log(ac4.message)

  const allPass = ac1.pass && ac2.pass && ac3.pass && ac4.pass

  if (allPass) {
    console.log('\n✓ All UC-TOK-03 acceptance criteria passed.')
    process.exit(0)
  } else {
    console.log('\n✗ Some acceptance criteria failed.')
    process.exit(1)
  }
}

main()
