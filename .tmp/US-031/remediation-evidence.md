# US-031 Remediation Evidence

## Fix Applied
Replaced non-null assertion (`!`) on `scheduledDeletionId` with an explicit guard that throws `ConvexError` on inconsistent state.

## File Changed
`convex/db/savedRoutes.ts:71-74`

## Before
```typescript
if (doc.deletedAt !== undefined) {
  return { scheduledDeletionId: doc.scheduledDeletionId! }
}
```

## After
```typescript
if (doc.deletedAt !== undefined) {
  if (!doc.scheduledDeletionId) {
    throw new ConvexError('Route is in an inconsistent state: soft-deleted without scheduledDeletionId')
  }
  return { scheduledDeletionId: doc.scheduledDeletionId }
}
```

## Test Results
- `bun test convex/db/__tests__/savedRoutes.softDelete.test.ts`: 14 pass, 0 fail
