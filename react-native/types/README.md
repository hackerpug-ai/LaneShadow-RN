# Types Directory

## Overview

This directory contains all shared TypeScript types for the Hummingbird project. All types are **inferred from the Convex schema** to ensure a single source of truth.

## Architecture

### Single Source of Truth: Convex Schema

```
convex/schema.ts (source)
    ↓ (Convex generates types)
convex/_generated/dataModel.d.ts
    ↓ (we infer from)
types/schema.ts (derived types)
    ↓ (barrel export)
types/index.ts
```

**Key Principle**: The Convex schema validators (`v` from `convex/values`) are the single source of truth. All TypeScript types are derived from them.

## Type Inference Patterns

### Document Types

```typescript
import type { Doc } from '../convex/_generated/dataModel'

// Direct document type from Convex
export type User = Doc<'users'>
export type Child = Doc<'children'>
```

### Enum Types (from literal unions)

```typescript
// Extract enum from a field's union type
export type UserRole = RoleAssignment['role']
// Result: 'admin' | 'director' | 'lead_teacher' | ...

export type UserStatus = User['status']
// Result: 'active' | 'invited'
```

### Nested Object Types

```typescript
// Extract nested optional object types
export type QuietHours = NonNullable<NonNullable<School['settings']>['quietHours']>

// Extract array element types
export type MontessoriDomain = NonNullable<MediaAsset['domains']>[number]

// Extract attachment types
export type StorageAttachment = NonNullable<Announcement['attachments']>[number]
```

### ID Types

```typescript
import type { Id } from '../convex/_generated/dataModel'

// Create convenient ID aliases
export type UserId = Id<'users'>
export type ChildId = Id<'children'>
export type StorageId = Id<'_storage'>
```

## Usage

### In React Components

```typescript
import type { User, UserRole, UserId } from '@/types'

interface UserProfileProps {
  user: User
  role: UserRole
  onUpdate: (userId: UserId) => void
}

export const UserProfile = ({ user, role, onUpdate }: UserProfileProps) => {
  // TypeScript knows exact shape of user from Convex schema
  return <Text>{user.first} {user.last}</Text>
}
```

### In Convex Functions

```typescript
import { query } from './_generated/server'
import { v } from 'convex/values'
import type { User, UserRole } from '../types'

export const getUser = query({
  args: { userId: v.id('users') },
  returns: v.object({
    /* user fields */
  }),
  handler: async (ctx, args): Promise<User | null> => {
    return await ctx.db.get(args.userId)
  },
})
```

## Benefits

✅ **Single Source of Truth**: Schema changes automatically propagate to all types  
✅ **No Manual Duplication**: Enums and types are extracted, not redefined  
✅ **Type Safety**: TypeScript enforces exact database schema  
✅ **Maintainability**: Changes only need to be made in `convex/schema.ts`  
✅ **Simplicity**: No extra schema validators needed beyond Convex `v`  

## Files

- **`schema.ts`**: All inferred types from Convex schema
- **`index.ts`**: Barrel export of all types
- **`theme.ts`**: UI theme types (separate concern)

## Validation Strategy

### Schema Validation (Convex)

```typescript
// convex/schema.ts
users: defineTable({
  email: v.string(),
  status: v.union(v.literal('active'), v.literal('invited')),
  // ... Convex validates these automatically
})
```

### Business Logic Validation (Mutations)

```typescript
// convex/users.ts
export const createUser = mutation({
  args: { email: v.string() },
  returns: v.id('users'),
  handler: async (ctx, args) => {
    // Business logic validation as needed
    if (!args.email.includes('@')) {
      throw new Error('Invalid email format')
    }
    
    return await ctx.db.insert('users', { ...args })
  },
})
```

## Adding New Types

When you add a new table to `convex/schema.ts`:

1. Run `npx convex dev` to regenerate types
2. Add document type export in `types/schema.ts`:
   ```typescript
   export type MyNewTable = Doc<'myNewTable'>
   ```
3. Extract any enum types:
   ```typescript
   export type MyNewStatus = MyNewTable['status']
   ```
4. Add to barrel export in `types/index.ts`

That's it! The types automatically stay in sync with your schema.

## Migration Notes

**Before** (manual enum duplication):
```typescript
export type UserRole = 'admin' | 'director' | 'lead_teacher' | ...
```

**After** (inferred from schema):
```typescript
export type UserRole = RoleAssignment['role']
```

This ensures that if you add a new role to the Convex schema, TypeScript will automatically know about it everywhere.

---

**Last Updated**: 2025-10-11  
**Sprint**: 01 - Convex Schema Foundation

