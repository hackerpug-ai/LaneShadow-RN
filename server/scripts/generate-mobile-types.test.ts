import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { generateMobileTypes, parseConvexApiTypes } from './generate-mobile-types'

describe('generate-mobile-types', () => {
  it('test_scriptReadsConvexTypesFromGeneratedApi', () => {
    const result = parseConvexApiTypes()
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
})
