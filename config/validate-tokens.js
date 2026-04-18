/* eslint-disable no-console */

const fs = require('node:fs')
const path = require('node:path')

const AJV = require('ajv')

const REPO_ROOT = path.resolve(__dirname, '..')
const SCHEMA_PATH = path.join(REPO_ROOT, 'tokens/schema/laneshadow-tokens.schema.json')

function listJsonFiles(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listJsonFiles(full))
    else if (entry.isFile() && full.endsWith('.json')) out.push(full)
  }
  return out
}

function main() {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'))
  const ajv = new AJV({ allErrors: true, strict: false })
  const validate = ajv.compile(schema)

  const tokenDir = path.join(REPO_ROOT, 'tokens')
  const jsonFiles = listJsonFiles(tokenDir).filter(
    (p) => !p.includes(`${path.sep}schema${path.sep}`),
  )

  let hadError = false
  for (const filePath of jsonFiles) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    const ok = validate(data)
    if (!ok) {
      hadError = true
      process.stderr.write(`Invalid tokens file: ${path.relative(REPO_ROOT, filePath)}\n`)
      process.stderr.write(`${JSON.stringify(validate.errors, null, 2)}\n`)
    }
  }

  if (hadError) process.exit(1)
  process.stdout.write(`Validated ${jsonFiles.length} token JSON file(s).\n`)
}

main()
