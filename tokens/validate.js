const fs = require('node:fs')
const path = require('node:path')

const Ajv2020 = require('ajv/dist/2020')

const repoRoot = path.resolve(__dirname, '..')
const schemaPath = path.join(__dirname, 'theme.schema.json')
const documentPath = path.join(__dirname, 'theme.json')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function compareShapes(left, right, trail = []) {
  const leftIsObject = left && typeof left === 'object' && !Array.isArray(left)
  const rightIsObject = right && typeof right === 'object' && !Array.isArray(right)

  if (!leftIsObject || !rightIsObject) {
    return []
  }

  const leftKeys = Object.keys(left).sort()
  const rightKeys = Object.keys(right).sort()
  const issues = []

  if (leftKeys.join(',') !== rightKeys.join(',')) {
    issues.push(`${trail.join('.') || 'root'} -> ${leftKeys.join(',')} !== ${rightKeys.join(',')}`)
  }

  for (const key of leftKeys) {
    if (!(key in right)) {
      continue
    }
    issues.push(...compareShapes(left[key], right[key], [...trail, key]))
  }

  return issues
}

function main() {
  const schema = readJson(schemaPath)
  const document = readJson(documentPath)

  const ajv = new Ajv2020({ allErrors: true, strict: false })
  const validate = ajv.compile(schema)
  const valid = validate(document)

  if (!valid) {
    process.stderr.write('theme.json failed schema validation.\n')
    process.stderr.write(`${JSON.stringify(validate.errors, null, 2)}\n`)
    process.exit(1)
  }

  const parityIssues = compareShapes(document.color.light, document.color.dark, ['color'])
  if (parityIssues.length > 0) {
    process.stderr.write('theme.json failed light/dark parity validation.\n')
    process.stderr.write(`${parityIssues.join('\n')}\n`)
    process.exit(1)
  }

  process.stdout.write(
    `Validated ${path.relative(repoRoot, documentPath)} against ${path.relative(repoRoot, schemaPath)}.\n`,
  )
}

main()
