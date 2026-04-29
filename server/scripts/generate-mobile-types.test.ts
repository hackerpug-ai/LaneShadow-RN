import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { generateMobileTypes, parseConvexApiTypes } from './generate-mobile-types'

describe('generate-mobile-types', () => {
  it('test_scriptReadsConvexTypesFromGeneratedApi', () => {
    const result = parseConvexApiTypes(undefined, { allowSchemaFallback: true })
    expect(result.moduleImports.length).toBeGreaterThan(0)
    expect(result.tables.users).toBeDefined()
    expect(result.tables.users.fields.email.type).toBe('string')
    expect(result.tables.community_waypoint_mentions.fields.lat.optional).toBe(true)
  })

  it('test_swiftCodableStructsGenerated', () => {
    const result = generateMobileTypes()
    expect(
      result.swiftOutputPath.endsWith('ios/LaneShadow/Generated/ConvexTypes.generated.swift'),
    ).toBe(true)
    expect(result.swiftSource).toContain('public struct UsersDocument: Codable')
    expect(result.swiftSource).toContain('public let email: String')
    expect(result.swiftSource).toContain('public let planInput: RoutePlansPlanInput')
    expect(result.swiftSource).toContain('public struct SessionMessagesDocument: Codable')
    expect(result.swiftSource).toContain('public let kind: String')
    expect(result.swiftSource).toContain('public let lat: Double?')
  })

  it('test_kotlinSerializableDataClassesGenerated', () => {
    const result = generateMobileTypes()
    expect(
      result.kotlinOutputPath.endsWith(
        'android/app/src/main/java/com/laneshadow/generated/ConvexTypes.kt',
      ),
    ).toBe(true)
    expect(result.kotlinSource).toContain('@Serializable')
    expect(result.kotlinSource).toContain('data class UsersDocument(')
    expect(result.kotlinSource).toContain('val email: String,')
    expect(result.kotlinSource).toContain('val planInput: RoutePlansPlanInput,')
    expect(result.kotlinSource).toContain('data class SessionMessagesDocument(')
    expect(result.kotlinSource).toContain('val kind: String,')
    expect(result.kotlinSource).toContain('val lat: Double? = null,')
  })

  it('test_npmScriptWiredToCodegen', () => {
    const rootPath = path.resolve(process.cwd(), 'package.json')
    const serverPath = path.resolve(process.cwd(), '../package.json')
    const firstPath = existsSync(rootPath) ? rootPath : serverPath
    const firstPackageJson = JSON.parse(readFileSync(firstPath, 'utf8')) as {
      scripts?: Record<string, string>
    }
    const packageJson =
      firstPackageJson.scripts?.['server:codegen'] === undefined && existsSync(serverPath)
        ? (JSON.parse(readFileSync(serverPath, 'utf8')) as { scripts?: Record<string, string> })
        : firstPackageJson
    expect(packageJson.scripts?.['server:codegen']).toBe(
      'npx tsx server/scripts/generate-mobile-types.ts',
    )
  })

  it('test_usesGeneratedDataModelWithoutSchemaSource', () => {
    const fixtureDir = mkdtempSync(path.join(os.tmpdir(), 'mobile-types-generated-'))
    const generatedDir = path.join(fixtureDir, 'convex', '_generated')
    const apiPath = path.join(generatedDir, 'api.d.ts')
    const dataModelPath = path.join(generatedDir, 'dataModel.d.ts')
    mkdirSync(generatedDir, { recursive: true })

    writeFileSync(
      apiPath,
      'import type { DataModel } from "./dataModel.js";\nexport declare const api: unknown;\n',
      'utf8',
    )
    writeFileSync(
      dataModelPath,
      [
        'export type DataModel = {',
        '  users: {',
        '    document: {',
        '      email: string;',
        '      profile?: {',
        '        displayName: string;',
        '      };',
        '      tags: string[];',
        '      location: { lat: number; lng?: number } | null;',
        '    };',
        '  };',
        '};',
        '',
      ].join('\n'),
      'utf8',
    )

    const parsed = parseConvexApiTypes(apiPath)
    expect(parsed.tables.users.fields.email.type).toBe('string')
    expect(parsed.tables.users.fields.profile.optional).toBe(true)
    expect(parsed.tables.users.fields.tags.type).toBe('array')
    expect(parsed.tables.users.fields.location.optional).toBe(true)
  })

  it('test_throwsWhenGeneratedDataModelRequiresSchemaResolution', () => {
    const fixtureDir = mkdtempSync(path.join(os.tmpdir(), 'mobile-types-schema-derived-'))
    const generatedDir = path.join(fixtureDir, 'convex', '_generated')
    const convexDir = path.join(fixtureDir, 'convex')
    const apiPath = path.join(generatedDir, 'api.d.ts')
    const dataModelPath = path.join(generatedDir, 'dataModel.d.ts')
    mkdirSync(generatedDir, { recursive: true })
    mkdirSync(convexDir, { recursive: true })

    writeFileSync(
      apiPath,
      'import type { DataModel } from "./dataModel.js";\nexport declare const api: unknown;\n',
      'utf8',
    )
    writeFileSync(
      dataModelPath,
      [
        'import type { DataModelFromSchemaDefinition } from "convex/server";',
        'import schema from "../schema.js";',
        'export type DataModel = DataModelFromSchemaDefinition<typeof schema>;',
        '',
      ].join('\n'),
      'utf8',
    )
    writeFileSync(
      path.join(convexDir, 'schema.ts'),
      'export default { users: { document: { shouldNotBeRead: true } } } as const;\n',
      'utf8',
    )

    expect(() => parseConvexApiTypes(apiPath)).toThrowError(
      /depends on schema\.js and cannot be parsed from generated declarations only/,
    )
  })
})
