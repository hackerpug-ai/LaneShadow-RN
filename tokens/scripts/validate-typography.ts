#!/usr/bin/env tsx
/**
 * Typography token validator for UC-TOK-01.
 *
 * Validates typography.tokens.json against typography.schema.json, which
 * references native-theme common.schema.json constraints for dimension
 * and fontWeight validation.
 *
 * Usage:
 *   node tokens/scripts/validate-typography.ts                    # Validate canonical file
 *   node tokens/scripts/validate-typography.ts --fixture <path>   # Validate fixture file
 */

import fs from 'node:fs'
import path from 'node:path'
import Ajv2020 from 'ajv/dist/2020'

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const TOKENS_DIR = path.join(REPO_ROOT, 'tokens')
const SEMANTIC_DIR = path.join(TOKENS_DIR, 'semantic')
const SCHEMA_PATH = path.join(TOKENS_DIR, 'schema', 'typography.schema.json')
const CANONICAL_PATH = path.join(SEMANTIC_DIR, 'typography.tokens.json')

interface TypographyStyle {
  family: 'opinion' | 'ui' | 'instrument'
  size: number
  lineHeight: number
  weight: string
  letterSpacing?: number
}

interface TypographyTokens {
  typography: {
    opinion: {
      xl: TypographyStyle
      lg: TypographyStyle
      md: TypographyStyle
      sm: TypographyStyle
    }
    ui: {
      title: {
        lg: TypographyStyle
        md: TypographyStyle
        sm: TypographyStyle
      }
      body: {
        lg: TypographyStyle
        md: TypographyStyle
        sm: TypographyStyle
      }
      label: {
        lg: TypographyStyle
        md: TypographyStyle
        sm: TypographyStyle
      }
    }
    instrument: {
      lg: TypographyStyle
      md: TypographyStyle
      sm: TypographyStyle
      xs: TypographyStyle
    }
  }
}

function loadSchema() {
  const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf-8')
  return JSON.parse(schemaContent)
}

function loadTokens(filePath: string): TypographyTokens {
  const content = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(content)
}

function formatAjvErrors(errors: unknown[]): string {
  return (errors ?? [])
    .map((e: any) => {
      const instancePath = e.instancePath || '(root)'
      const message = e.message || 'invalid'
      const extra =
        e.keyword === 'required' && e.params && e.params.missingProperty
          ? ` (missing: ${e.params.missingProperty})`
          : ''
      return `${instancePath}: ${message}${extra}`
    })
    .join('\n')
}

function validateTypography(filePath: string): { ok: boolean; errors?: string } {
  const schema = loadSchema()
  const ajv = new Ajv2020({ allErrors: true, strict: false })
  const validate = ajv.compile(schema)

  const tokens = loadTokens(filePath)
  const valid = validate(tokens)

  if (!valid) {
    return {
      ok: false,
      errors: formatAjvErrors(validate.errors ?? []),
    }
  }

  return { ok: true }
}

function assertRoleCoverage(tokens: TypographyTokens): { ok: boolean; errors?: string } {
  const missing: string[] = []

  // Check opinion family
  if (!tokens.typography.opinion) missing.push('typography.opinion')
  else {
    if (!tokens.typography.opinion.xl) missing.push('typography.opinion.xl')
    if (!tokens.typography.opinion.lg) missing.push('typography.opinion.lg')
    if (!tokens.typography.opinion.md) missing.push('typography.opinion.md')
    if (!tokens.typography.opinion.sm) missing.push('typography.opinion.sm')
  }

  // Check ui family
  if (!tokens.typography.ui) missing.push('typography.ui')
  else {
    if (!tokens.typography.ui.title) missing.push('typography.ui.title')
    else {
      if (!tokens.typography.ui.title.lg) missing.push('typography.ui.title.lg')
      if (!tokens.typography.ui.title.md) missing.push('typography.ui.title.md')
      if (!tokens.typography.ui.title.sm) missing.push('typography.ui.title.sm')
    }
    if (!tokens.typography.ui.body) missing.push('typography.ui.body')
    else {
      if (!tokens.typography.ui.body.lg) missing.push('typography.ui.body.lg')
      if (!tokens.typography.ui.body.md) missing.push('typography.ui.body.md')
      if (!tokens.typography.ui.body.sm) missing.push('typography.ui.body.sm')
    }
    if (!tokens.typography.ui.label) missing.push('typography.ui.label')
    else {
      if (!tokens.typography.ui.label.lg) missing.push('typography.ui.label.lg')
      if (!tokens.typography.ui.label.md) missing.push('typography.ui.label.md')
      if (!tokens.typography.ui.label.sm) missing.push('typography.ui.label.sm')
    }
  }

  // Check instrument family
  if (!tokens.typography.instrument) missing.push('typography.instrument')
  else {
    if (!tokens.typography.instrument.lg) missing.push('typography.instrument.lg')
    if (!tokens.typography.instrument.md) missing.push('typography.instrument.md')
    if (!tokens.typography.instrument.sm) missing.push('typography.instrument.sm')
    if (!tokens.typography.instrument.xs) missing.push('typography.instrument.xs')
  }

  if (missing.length > 0) {
    return {
      ok: false,
      errors: `Missing required role coverage:\n${missing.map((m) => `  - ${m}`).join('\n')}`,
    }
  }

  return { ok: true }
}

function main() {
  const args = process.argv.slice(2)
  let targetPath = CANONICAL_PATH
  let isFixture = false

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--fixture' && i + 1 < args.length) {
      targetPath = path.resolve(REPO_ROOT, args[i + 1])
      isFixture = true
      break
    }
  }

  if (!fs.existsSync(targetPath)) {
    process.stderr.write(`Error: File not found: ${targetPath}\n`)
    process.exit(1)
  }

  // Schema validation
  const schemaResult = validateTypography(targetPath)
  if (!schemaResult.ok) {
    process.stderr.write(`Validation failed for: ${path.relative(REPO_ROOT, targetPath)}\n`)
    process.stderr.write(`${schemaResult.errors}\n`)
    process.exit(1)
  }

  // Role coverage validation (only for canonical file)
  if (!isFixture) {
    const tokens = loadTokens(targetPath)
    const coverageResult = assertRoleCoverage(tokens)
    if (!coverageResult.ok) {
      process.stderr.write(`Role coverage validation failed:\n`)
      process.stderr.write(`${coverageResult.errors}\n`)
      process.exit(1)
    }
  }

  process.stdout.write(`Validated: ${path.relative(REPO_ROOT, targetPath)}\n`)
  if (!isFixture) {
    process.stdout.write('Role coverage: ok (all required roles present)\n')
  }
}

main()
