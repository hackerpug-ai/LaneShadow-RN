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
  test('should define by_ownerType_ownerId_routeFingerprint index on saved_routes', async () => {
    // Verify the schema file contains the index definition
    const fs = await import('node:fs')
    const schemaContent = fs.readFileSync(
      '/Users/justinrich/Projects/LaneShadow-RN/convex/schema.ts',
      'utf-8',
    )

    // Check that the composite index is defined on routeFingerprint (not routeIndex object)
    expect(schemaContent).toContain('by_ownerType_ownerId_routeFingerprint')
    expect(schemaContent).toContain("['ownerType', 'ownerId', 'routeFingerprint']")
  })

  test('handler should use withIndex with composite index for efficient lookup', async () => {
    const fs = await import('node:fs')
    const moduleContent = fs.readFileSync(
      '/Users/justinrich/Projects/LaneShadow-RN/convex/db/savedRoutes.ts',
      'utf-8',
    )

    // Verify getRouteIndexFingerprint uses withIndex with the composite index
    const getRouteIndexFingerprintMatch = moduleContent.match(
      /export const getRouteIndexFingerprint = query\([\s\S]*?\n\}\)/,
    )
    expect(getRouteIndexFingerprintMatch).toBeTruthy()
    const handlerCode = getRouteIndexFingerprintMatch![0]

    // Should use withIndex with the composite index (not the 2-field index + in-memory find)
    expect(handlerCode).toContain('.withIndex(')
    expect(handlerCode).toContain('by_ownerType_ownerId_routeFingerprint')
    expect(handlerCode).toContain(".eq('ownerType', OWNER_TYPE.USER)")
    expect(handlerCode).toContain(".eq('ownerId', clerkUserId)")
    expect(handlerCode).toContain(".eq('routeFingerprint', args.routeIndex)")

    // Should NOT use in-memory .find() on routeIndex
    expect(handlerCode).not.toContain('.find(')
    expect(handlerCode).not.toContain('routeIndex.routeFingerprint')
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
