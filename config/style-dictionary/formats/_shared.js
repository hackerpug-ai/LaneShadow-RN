function toPlain(node) {
  if (!node || typeof node !== 'object') return node
  if (Object.hasOwn(node, 'value')) return node.value

  if (Array.isArray(node)) return node.map(toPlain)

  const out = {}
  for (const [k, v] of Object.entries(node)) out[k] = toPlain(v)
  return out
}

function toSwiftLiteral(value) {
  if (value === null) return 'nil'
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number') return Number.isInteger(value) ? `${value}` : `${value}`
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (Array.isArray(value)) return `[${value.map(toSwiftLiteral).join(', ')}]`
  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([k, v]) => `${JSON.stringify(k)}: ${toSwiftLiteral(v)}`)
      .join(', ')
    return `[${entries}]`
  }
  return JSON.stringify(String(value))
}

function toKotlinLiteral(value) {
  if (value === null) return 'null'
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return `${value}`
    return `${value}`
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (Array.isArray(value)) return `listOf(${value.map(toKotlinLiteral).join(', ')})`
  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([k, v]) => `${JSON.stringify(k)} to ${toKotlinLiteral(v)}`)
      .join(', ')
    return `mapOf(${entries})`
  }
  return JSON.stringify(String(value))
}

function toTypescriptLiteral(value) {
  return JSON.stringify(value, null, 2)
}

function isValidJsIdentifier(name) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)
}

function swiftIdentifier(name) {
  // Swift allows backticks for reserved words and unusual names.
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) return name
  return `\`${name}\``
}

function kotlinIdentifier(name) {
  // Kotlin allows backticks, but most of our keys are simple camelCase.
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) return name
  return `\`${name}\``
}

module.exports = {
  toPlain,
  toSwiftLiteral,
  toKotlinLiteral,
  toTypescriptLiteral,
  isValidJsIdentifier,
  swiftIdentifier,
  kotlinIdentifier,
}
