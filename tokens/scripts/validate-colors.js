/* eslint-disable no-console */

const fs = require('node:fs')
const path = require('node:path')

const Ajv2020 = require('ajv/dist/2020')

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const TOKENS_DIR = path.join(REPO_ROOT, 'tokens')
const COLORS_FILE = path.join(TOKENS_DIR, 'semantic', 'colors.tokens.json')
const COLORS_SCHEMA = path.join(TOKENS_DIR, 'schema', 'colors.schema.json')

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

function main() {
  // Load schema
  const schema = JSON.parse(fs.readFileSync(COLORS_SCHEMA, 'utf8'))
  const ajv = new Ajv2020({ allErrors: true, strict: true })
  const validate = ajv.compile(schema)

  // Load colors file
  const data = JSON.parse(fs.readFileSync(COLORS_FILE, 'utf8'))
  const ok = validate(data)

  if (!ok) {
    console.error(`Invalid colors file: ${path.relative(REPO_ROOT, COLORS_FILE)}`)
    console.error(`${formatAjvErrors(validate.errors)}\n`)
    process.exit(1)
  }

  console.log('✓ colors.tokens.json is valid')
}

main()
