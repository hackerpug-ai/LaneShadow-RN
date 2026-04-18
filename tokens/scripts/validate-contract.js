/* eslint-disable no-console */

const fs = require('node:fs')
const path = require('node:path')

const Ajv2020 = require('ajv/dist/2020')

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const TOKENS_DIR = path.join(REPO_ROOT, 'tokens')
const SCHEMA_PATH = path.join(TOKENS_DIR, 'schema', 'laneshadow-tokens.schema.json')

function listJsonFiles(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listJsonFiles(full))
    else if (entry.isFile() && full.endsWith('.json')) out.push(full)
  }
  return out
}

function formatAjvErrors(errors) {
  return (errors ?? [])
    .map((e) => {
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

function loadSchema() {
  return JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'))
}

function validateAllTokenFiles(validate) {
  const jsonFiles = listJsonFiles(TOKENS_DIR).filter(
    (p) => !p.includes(`${path.sep}schema${path.sep}`),
  )

  let hadError = false
  for (const filePath of jsonFiles) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    const ok = validate(data)
    if (!ok) {
      hadError = true
      process.stderr.write(`Invalid tokens file: ${path.relative(REPO_ROOT, filePath)}\n`)
      process.stderr.write(`${formatAjvErrors(validate.errors)}\n`)
      process.stderr.write('\n')
    }
  }

  if (hadError) return { ok: false, jsonFiles }
  process.stdout.write(`Validated ${jsonFiles.length} token JSON file(s).\n`)
  return { ok: true, jsonFiles }
}

function assertDeliberateMutationFails(validate, filePath) {
  const original = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const mutated = JSON.parse(JSON.stringify(original))

  // Deliberate contract violation: color tokens must be strings.
  mutated.semantic.color.light.primary.default.$value = 123

  const ok = validate(mutated)
  if (ok) {
    throw new Error(
      'Deliberate mutation unexpectedly passed validation; expected schema violation for semantic.color.light.primary.default.$value',
    )
  }

  const namedField = '/semantic/color/light/primary/default/$value'
  const errorsText = formatAjvErrors(validate.errors)
  if (!errorsText.includes(namedField)) {
    throw new Error(
      `Deliberate mutation failed validation, but error did not include named field ${namedField}.\nErrors:\n${errorsText}`,
    )
  }
}

function main() {
  const schema = loadSchema()
  const ajv = new Ajv2020({ allErrors: true, strict: true })
  const validate = ajv.compile(schema)

  const { ok, jsonFiles } = validateAllTokenFiles(validate)
  if (!ok) process.exit(1)

  const semanticFile = jsonFiles.find((p) => p.endsWith(`${path.sep}semantic.tokens.json`))
  if (!semanticFile) {
    process.stderr.write(
      'Expected tokens file tokens/semantic/semantic.tokens.json to exist for contract validation.\n',
    )
    process.exit(1)
  }

  try {
    assertDeliberateMutationFails(validate, semanticFile)
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`)
    process.exit(1)
  }

  process.stdout.write('Deliberate mutation check: ok (failed as expected).\n')
}

main()
