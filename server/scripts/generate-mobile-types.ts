import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import schema from '../convex/schema'

type ValidatorLike = {
  kind: string
  fields?: Record<string, ValidatorLike>
  members?: ValidatorLike[]
  value?: unknown
  element?: ValidatorLike
  isOptional?: boolean
}

export type FieldSchema = {
  type: string
  optional: boolean
  fields?: Record<string, FieldSchema>
  items?: FieldSchema
}

export type TableSchema = {
  name: string
  fields: Record<string, FieldSchema>
}

export type ParsedConvexApiTypes = {
  apiPath: string
  moduleImports: string[]
  tables: Record<string, TableSchema>
}

export type GenerateMobileTypesResult = {
  swiftOutputPath: string
  kotlinOutputPath: string
  swiftSource: string
  kotlinSource: string
  tableNames: string[]
}

function resolveServerDir(cwd: string): string {
  return cwd.endsWith(`${path.sep}server`) ? cwd : path.resolve(cwd, 'server')
}

function resolveRepoRoot(cwd: string): string {
  const serverDir = resolveServerDir(cwd)
  return path.dirname(serverDir)
}

function toPascalCase(input: string): string {
  return input
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function toSchemaField(validator: ValidatorLike): FieldSchema {
  if (validator.kind === 'object') {
    const fields: Record<string, FieldSchema> = {}
    for (const [fieldName, fieldValidator] of Object.entries(validator.fields ?? {})) {
      fields[fieldName] = toSchemaField(fieldValidator)
    }
    return { type: 'object', optional: validator.isOptional === true, fields }
  }

  if (validator.kind === 'array') {
    const items = validator.element
      ? toSchemaField(validator.element)
      : { type: 'any', optional: false }
    return { type: 'array', optional: validator.isOptional === true, items }
  }

  if (validator.kind === 'union') {
    const members = validator.members ?? []
    const nonNullMembers = members.filter((member) => member.kind !== 'null')
    if (
      nonNullMembers.length > 0 &&
      nonNullMembers.every(
        (member) => member.kind === 'literal' && typeof member.value === 'string',
      )
    ) {
      return {
        type: 'string',
        optional: validator.isOptional === true || members.some((member) => member.kind === 'null'),
      }
    }
    if (nonNullMembers.length === 1) {
      const inner = toSchemaField(nonNullMembers[0] as ValidatorLike)
      return {
        ...inner,
        optional:
          inner.optional ||
          validator.isOptional === true ||
          members.some((member) => member.kind === 'null'),
      }
    }
    return { type: 'any', optional: validator.isOptional === true }
  }

  if (validator.kind === 'id') {
    return { type: 'id', optional: validator.isOptional === true }
  }

  if (validator.kind === 'float64' || validator.kind === 'int64') {
    return { type: 'number', optional: validator.isOptional === true }
  }

  if (validator.kind === 'literal') {
    const valueType = typeof validator.value
    if (valueType === 'string') {
      return { type: 'string', optional: validator.isOptional === true }
    }
    if (valueType === 'number') {
      return { type: 'number', optional: validator.isOptional === true }
    }
    if (valueType === 'boolean') {
      return { type: 'boolean', optional: validator.isOptional === true }
    }
  }

  if (validator.kind === 'string' || validator.kind === 'boolean' || validator.kind === 'bytes') {
    return { type: validator.kind, optional: validator.isOptional === true }
  }

  return { type: 'any', optional: validator.isOptional === true }
}

function extractTableSchemas(): Record<string, TableSchema> {
  const tableSchemas: Record<string, TableSchema> = {}
  const tableEntries = Object.entries(
    (schema as unknown as { tables: Record<string, { validator: ValidatorLike }> }).tables,
  )

  for (const [tableName, tableDef] of tableEntries) {
    const tableValidator = tableDef.validator
    if (!tableValidator || tableValidator.kind !== 'object') {
      continue
    }
    const fields: Record<string, FieldSchema> = {}
    for (const [fieldName, fieldValidator] of Object.entries(tableValidator.fields ?? {})) {
      fields[fieldName] = toSchemaField(fieldValidator)
    }
    tableSchemas[tableName] = { name: tableName, fields }
  }

  return tableSchemas
}

export function parseConvexApiTypes(
  apiPath = path.resolve(resolveServerDir(process.cwd()), 'convex/_generated/api.d.ts'),
): ParsedConvexApiTypes {
  const sourceText = readFileSync(apiPath, 'utf8')
  const sourceFile = ts.createSourceFile(apiPath, sourceText, ts.ScriptTarget.Latest, true)

  const moduleImports: string[] = []
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) {
      continue
    }
    if (!ts.isStringLiteral(statement.moduleSpecifier)) {
      continue
    }
    moduleImports.push(statement.moduleSpecifier.text)
  }

  if (!sourceText.includes('export declare const api:')) {
    throw new Error(
      `Invalid Convex generated API file at ${apiPath}: missing api export declaration`,
    )
  }

  const tables = extractTableSchemas()
  return { apiPath, moduleImports, tables }
}

function swiftTypeForField(field: FieldSchema, nestedTypeName: string): string {
  if (field.type === 'object') return nestedTypeName
  if (field.type === 'array') {
    const itemType = field.items ? swiftTypeForField(field.items, nestedTypeName) : 'String'
    return `[${itemType}]`
  }
  if (field.type === 'string' || field.type === 'id' || field.type === 'bytes') return 'String'
  if (field.type === 'number') return 'Double'
  if (field.type === 'boolean') return 'Bool'
  return 'String'
}

function kotlinTypeForField(field: FieldSchema, nestedTypeName: string): string {
  if (field.type === 'object') return nestedTypeName
  if (field.type === 'array') {
    const itemType = field.items ? kotlinTypeForField(field.items, nestedTypeName) : 'String'
    return `List<${itemType}>`
  }
  if (field.type === 'string' || field.type === 'id' || field.type === 'bytes') return 'String'
  if (field.type === 'number') return 'Double'
  if (field.type === 'boolean') return 'Boolean'
  return 'String'
}

function renderSwiftStruct(
  typeName: string,
  fields: Record<string, FieldSchema>,
  parentName: string,
): string {
  const nestedStructs: string[] = []
  const properties: string[] = []

  for (const [fieldName, fieldSchema] of Object.entries(fields)) {
    const nestedTypeName = `${parentName}${toPascalCase(fieldName)}`
    if (fieldSchema.type === 'object' && fieldSchema.fields) {
      nestedStructs.push(renderSwiftStruct(nestedTypeName, fieldSchema.fields, nestedTypeName))
    }
    if (
      fieldSchema.type === 'array' &&
      fieldSchema.items?.type === 'object' &&
      fieldSchema.items.fields
    ) {
      nestedStructs.push(
        renderSwiftStruct(nestedTypeName, fieldSchema.items.fields, nestedTypeName),
      )
    }
    const baseType = swiftTypeForField(fieldSchema, nestedTypeName)
    const propertyType = fieldSchema.optional ? `${baseType}?` : baseType
    properties.push(`  public let ${fieldName}: ${propertyType}`)
  }

  return `${nestedStructs.join('\n\n')}${nestedStructs.length > 0 ? '\n\n' : ''}public struct ${typeName}: Codable {\n${properties.join('\n')}\n}`
}

function renderKotlinDataClass(
  typeName: string,
  fields: Record<string, FieldSchema>,
  parentName: string,
): string {
  const nestedClasses: string[] = []
  const properties: string[] = []

  for (const [fieldName, fieldSchema] of Object.entries(fields)) {
    const nestedTypeName = `${parentName}${toPascalCase(fieldName)}`
    if (fieldSchema.type === 'object' && fieldSchema.fields) {
      nestedClasses.push(renderKotlinDataClass(nestedTypeName, fieldSchema.fields, nestedTypeName))
    }
    if (
      fieldSchema.type === 'array' &&
      fieldSchema.items?.type === 'object' &&
      fieldSchema.items.fields
    ) {
      nestedClasses.push(
        renderKotlinDataClass(nestedTypeName, fieldSchema.items.fields, nestedTypeName),
      )
    }
    const baseType = kotlinTypeForField(fieldSchema, nestedTypeName)
    const propertyType = fieldSchema.optional ? `${baseType}?` : baseType
    const suffix = fieldSchema.optional ? ' = null,' : ','
    properties.push(`  val ${fieldName}: ${propertyType}${suffix}`)
  }

  return `${nestedClasses.join('\n\n')}${nestedClasses.length > 0 ? '\n\n' : ''}@Serializable\ndata class ${typeName}(\n${properties.join('\n')}\n)`
}

function generateSwiftSource(tables: Record<string, TableSchema>): string {
  const structs = Object.entries(tables)
    .map(([tableName, table]) =>
      renderSwiftStruct(
        `${toPascalCase(tableName)}Document`,
        table.fields,
        `${toPascalCase(tableName)}`,
      ),
    )
    .join('\n\n')

  return `// Generated by server/scripts/generate-mobile-types.ts. Do not edit.\nimport Foundation\n\n${structs}\n`
}

function generateKotlinSource(tables: Record<string, TableSchema>): string {
  const classes = Object.entries(tables)
    .map(([tableName, table]) =>
      renderKotlinDataClass(
        `${toPascalCase(tableName)}Document`,
        table.fields,
        `${toPascalCase(tableName)}`,
      ),
    )
    .join('\n\n')

  return `// Generated by server/scripts/generate-mobile-types.ts. Do not edit.\npackage com.laneshadow.generated\n\nimport kotlinx.serialization.Serializable\n\n${classes}\n`
}

export function generateMobileTypes(rootDir = process.cwd()): GenerateMobileTypesResult {
  const repoRoot = resolveRepoRoot(rootDir)
  const serverDir = resolveServerDir(rootDir)
  const parsedApi = parseConvexApiTypes(path.resolve(serverDir, 'convex/_generated/api.d.ts'))

  const swiftSource = generateSwiftSource(parsedApi.tables)
  const kotlinSource = generateKotlinSource(parsedApi.tables)

  const swiftOutputPath = path.resolve(
    repoRoot,
    'ios/LaneShadow/Generated/ConvexTypes.generated.swift',
  )
  const kotlinOutputPath = path.resolve(
    repoRoot,
    'android/app/src/main/java/com/laneshadow/generated/ConvexTypes.kt',
  )

  mkdirSync(path.dirname(swiftOutputPath), { recursive: true })
  mkdirSync(path.dirname(kotlinOutputPath), { recursive: true })
  writeFileSync(swiftOutputPath, swiftSource)
  writeFileSync(kotlinOutputPath, kotlinSource)

  return {
    swiftOutputPath,
    kotlinOutputPath,
    swiftSource,
    kotlinSource,
    tableNames: Object.keys(parsedApi.tables),
  }
}

if (process.argv[1]?.endsWith('generate-mobile-types.ts')) {
  generateMobileTypes()
}
