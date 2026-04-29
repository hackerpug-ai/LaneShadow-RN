import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

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

export type ParseConvexApiTypesOptions = {
  allowSchemaFallback?: boolean
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

function isOptionalSymbol(symbol: ts.Symbol): boolean {
  return (symbol.flags & ts.SymbolFlags.Optional) !== 0
}

function toFieldSchemaFromType(
  checker: ts.TypeChecker,
  type: ts.Type,
  seen: Set<number>,
): FieldSchema {
  if (type.isIntersection()) {
    const parts = type.types
    const hasStringPart = parts.some((inner) => (inner.flags & ts.TypeFlags.StringLike) !== 0)
    const hasTableBrand = parts.some((inner) => checker.typeToString(inner).includes('__tableName'))
    if (hasStringPart && hasTableBrand) {
      return { type: 'id', optional: false }
    }
    const scalarPart = parts.find(
      (inner) =>
        (inner.flags & ts.TypeFlags.StringLike) !== 0 ||
        (inner.flags & ts.TypeFlags.NumberLike) !== 0 ||
        (inner.flags & ts.TypeFlags.BooleanLike) !== 0 ||
        (inner.flags & ts.TypeFlags.BigIntLike) !== 0,
    )
    if (scalarPart) {
      return toFieldSchemaFromType(checker, scalarPart, seen)
    }
  }

  if (type.isUnion()) {
    const nonNullishTypes = type.types.filter(
      (inner) =>
        (inner.flags & ts.TypeFlags.Null) === 0 && (inner.flags & ts.TypeFlags.Undefined) === 0,
    )
    const hasNullish = nonNullishTypes.length !== type.types.length
    if (nonNullishTypes.length === 1) {
      const innerField = toFieldSchemaFromType(checker, nonNullishTypes[0] as ts.Type, seen)
      return { ...innerField, optional: innerField.optional || hasNullish }
    }
    if (
      nonNullishTypes.length > 0 &&
      nonNullishTypes.every((inner) => (inner.flags & ts.TypeFlags.StringLiteral) !== 0)
    ) {
      return { type: 'string', optional: hasNullish }
    }
    if (
      nonNullishTypes.length > 0 &&
      nonNullishTypes.every(
        (inner) =>
          (inner.flags & ts.TypeFlags.NumberLike) !== 0 ||
          (inner.flags & ts.TypeFlags.BigIntLike) !== 0,
      )
    ) {
      return { type: 'number', optional: hasNullish }
    }
    if (
      nonNullishTypes.length > 0 &&
      nonNullishTypes.every((inner) => (inner.flags & ts.TypeFlags.BooleanLike) !== 0)
    ) {
      return { type: 'boolean', optional: hasNullish }
    }
    return { type: 'any', optional: hasNullish }
  }

  if (checker.isArrayType(type) || checker.isTupleType(type)) {
    const typeId = (type as ts.Type & { id?: number }).id
    if (typeof typeId === 'number') {
      if (seen.has(typeId)) return { type: 'any', optional: false }
      seen.add(typeId)
    }
    const refType = type as ts.TypeReference
    const itemType = checker.getTypeArguments(refType)[0] ?? checker.getAnyType()
    return {
      type: 'array',
      optional: false,
      items: toFieldSchemaFromType(checker, itemType, seen),
    }
  }

  if (type.flags & ts.TypeFlags.StringLike) {
    return { type: 'string', optional: false }
  }
  if (type.flags & ts.TypeFlags.NumberLike) {
    return { type: 'number', optional: false }
  }
  if (type.flags & ts.TypeFlags.BooleanLike) {
    return { type: 'boolean', optional: false }
  }
  if (type.flags & ts.TypeFlags.BigIntLike) {
    return { type: 'number', optional: false }
  }

  const typeString = checker.typeToString(type)
  if (typeString.startsWith('Id<') || typeString === 'Id') {
    return { type: 'id', optional: false }
  }
  if (typeString === 'ArrayBuffer' || typeString === 'Uint8Array') {
    return { type: 'bytes', optional: false }
  }

  const properties = checker.getPropertiesOfType(type)
  if (properties.length > 0) {
    const typeId = (type as ts.Type & { id?: number }).id
    if (typeof typeId === 'number') {
      if (seen.has(typeId)) return { type: 'any', optional: false }
      seen.add(typeId)
    }
    const fields: Record<string, FieldSchema> = {}
    for (const property of properties) {
      const declaration =
        property.valueDeclaration ?? property.declarations?.[0] ?? type.symbol?.declarations?.[0]
      if (!declaration) {
        continue
      }
      const propertyType = checker.getTypeOfSymbolAtLocation(property, declaration)
      const propertyField = toFieldSchemaFromType(checker, propertyType, seen)
      fields[property.name] = {
        ...propertyField,
        optional: propertyField.optional || isOptionalSymbol(property),
      }
    }
    return { type: 'object', optional: false, fields }
  }

  return { type: 'any', optional: false }
}

function hasSchemaBasedDataModel(dataModelSource: ts.SourceFile): boolean {
  return dataModelSource.text.includes('DataModelFromSchemaDefinition<typeof schema>')
}

function extractTableSchemasFromGeneratedTypes(
  apiPath: string,
  options: ParseConvexApiTypesOptions = {},
): Record<string, TableSchema> {
  const { allowSchemaFallback = false } = options
  const dataModelPath = path.resolve(path.dirname(apiPath), 'dataModel.d.ts')
  const schemaTsPath = path.resolve(path.dirname(dataModelPath), '..', 'schema.ts')
  const programRoots = allowSchemaFallback
    ? [apiPath, dataModelPath, schemaTsPath]
    : [apiPath, dataModelPath]
  const program = ts.createProgram(programRoots, {
    allowJs: false,
    checkJs: false,
    strict: false,
    strictNullChecks: true,
    skipLibCheck: true,
    noEmit: true,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    target: ts.ScriptTarget.ESNext,
  })
  const checker = program.getTypeChecker()
  const dataModelSource = program.getSourceFile(dataModelPath)
  if (!dataModelSource) {
    throw new Error(`Missing generated Convex data model declaration at ${dataModelPath}`)
  }
  if (hasSchemaBasedDataModel(dataModelSource) && !allowSchemaFallback) {
    throw new Error(
      `Generated data model at ${dataModelPath} depends on schema.js and cannot be parsed from generated declarations only. Run with allowSchemaFallback=true to permit schema-derived extraction.`,
    )
  }
  const dataModelAlias = dataModelSource.statements.find(
    (statement): statement is ts.TypeAliasDeclaration =>
      ts.isTypeAliasDeclaration(statement) && statement.name.text === 'DataModel',
  )
  if (!dataModelAlias) {
    throw new Error(
      `Invalid Convex generated data model file at ${dataModelPath}: missing DataModel`,
    )
  }

  const dataModelType = checker.getApparentType(checker.getTypeFromTypeNode(dataModelAlias.type))
  const tableSchemas: Record<string, TableSchema> = {}

  for (const tableSymbol of checker.getPropertiesOfType(dataModelType)) {
    const tableDeclaration =
      tableSymbol.valueDeclaration ?? tableSymbol.declarations?.[0] ?? dataModelAlias
    const tableType = checker.getTypeOfSymbolAtLocation(tableSymbol, tableDeclaration)
    const documentSymbol = tableType.getProperty('document')
    if (!documentSymbol) {
      continue
    }
    const documentDeclaration =
      documentSymbol.valueDeclaration ?? documentSymbol.declarations?.[0] ?? tableDeclaration
    const documentType = checker.getTypeOfSymbolAtLocation(documentSymbol, documentDeclaration)
    const documentSchema = toFieldSchemaFromType(checker, documentType, new Set())
    tableSchemas[tableSymbol.name] = {
      name: tableSymbol.name,
      fields: documentSchema.fields ?? {},
    }
  }

  return tableSchemas
}

export function parseConvexApiTypes(
  apiPath = path.resolve(resolveServerDir(process.cwd()), 'convex/_generated/api.d.ts'),
  options: ParseConvexApiTypesOptions = {},
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

  const tables = extractTableSchemasFromGeneratedTypes(apiPath, options)
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
    properties.push(`    public let ${fieldName}: ${propertyType}`)
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
  const parsedApi = parseConvexApiTypes(path.resolve(serverDir, 'convex/_generated/api.d.ts'), {
    allowSchemaFallback: true,
  })

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
