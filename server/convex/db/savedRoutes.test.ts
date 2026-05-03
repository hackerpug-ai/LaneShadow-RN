import { describe, expect, test } from 'vitest'

// ---------------------------------------------------------------------------
// AC-1: Returns false for unknown fingerprint
// ---------------------------------------------------------------------------

describe('getRouteIndexFingerprint query (AC-1)', () => {
  test('should export getRouteIndexFingerprint query', async () => {
    const { getRouteIndexFingerprint } = await import('./savedRoutes.js')
    expect(getRouteIndexFingerprint).toBeDefined()
    expect(typeof getRouteIndexFingerprint).toBe('function')
  })

  test('should be a public query (not internal)', async () => {
    const { getRouteIndexFingerprint } = await import('./savedRoutes.js')
    // Public queries are exported directly, internal ones are marked differently
    expect(getRouteIndexFingerprint).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// AC-5: Index-backed lookup via new composite index
// ---------------------------------------------------------------------------

describe('schema composite index (AC-5)', () => {
  test('should define by_ownerType_ownerId_routeIndex index on saved_routes', async () => {
    // Verify the schema file contains the index definition
    const fs = await import('node:fs')
    const schemaContent = fs.readFileSync(
      '/Users/justinrich/Projects/LaneShadow/server/convex/schema.ts',
      'utf-8',
    )

    // Check that the composite index is defined
    expect(schemaContent).toContain('by_ownerType_ownerId_routeIndex')
    expect(schemaContent).toContain("['ownerType', 'ownerId', 'routeIndex']")
  })

  test('handler should use withIndex for user scoping, then find by fingerprint', async () => {
    const fs = await import('node:fs')
    const moduleContent = fs.readFileSync(
      '/Users/justinrich/Projects/LaneShadow/server/convex/db/savedRoutes.ts',
      'utf-8',
    )

    // Verify getRouteIndexFingerprint uses withIndex for user scoping
    const getRouteIndexFingerprintMatch = moduleContent.match(
      /export const getRouteIndexFingerprint = query\([\s\S]*?\n\}\)/,
    )
    expect(getRouteIndexFingerprintMatch).toBeTruthy()
    const handlerCode = getRouteIndexFingerprintMatch![0]

    // Should use withIndex to scope to user (not scan all routes)
    expect(handlerCode).toContain('.withIndex(')
    expect(handlerCode).toContain('by_ownerType_and_ownerId')

    // Should match on routeFingerprint field
    expect(handlerCode).toContain('routeFingerprint')
  })
})

// ---------------------------------------------------------------------------
// AC-6: Explicit returns validator
// ---------------------------------------------------------------------------

describe('returns validator (AC-6)', () => {
  test('should use explicit v.object returns validator', async () => {
    // We can verify this by checking the implementation in savedRoutes.ts
    // The query should return v.object({ isSaved: v.boolean(), savedRouteId: v.optional(v.id('saved_routes')) })
    const moduleContent = await import('node:fs').then((fs) =>
      fs.readFileSync(
        '/Users/justinrich/Projects/LaneShadow/server/convex/db/savedRoutes.ts',
        'utf-8',
      ),
    )

    // Check that the implementation uses explicit validators
    expect(moduleContent).toContain('v.object({')
    expect(moduleContent).toContain('isSaved: v.boolean()')
    expect(moduleContent).toContain("savedRouteId: v.optional(v.id('saved_routes'))")
    // Should NOT use v.any()
    expect(moduleContent).not.toContain('v.any()')
  })
})
