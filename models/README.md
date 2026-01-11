# Data Models

This directory contains all shared data models using a **Convex validator-first** approach.

## Pattern: `v` First (Models are Convex Validators)

All models define:
1. **Field validators** (e.g., `USER_FIELDS`) - source of truth
2. **Convex object validator** (e.g., `userValidator`) - used in schema + server functions
3. **TypeScript type** (e.g., `User`) - inferred from validator via `Infer<typeof ...>`

### Example: User Model

```typescript
// models/users.ts
import { Infer, v } from 'convex/values'

export const USER_FIELDS = {
  email: v.string(),
  name: v.string(),
  createdAt: v.number(),
} as const

export const userValidator = v.object(USER_FIELDS)
export type User = Infer<typeof userValidator>
```

## Usage

### In Database Schema (convex/schema.ts)

```typescript
import { defineSchema, defineTable } from 'convex/server'
import { userValidator } from '../models/users'

export default defineSchema({
  users: defineTable(userValidator).index('by_email', ['email']),
})
```

### In Server Functions (convex/*.ts)

```typescript
import { v } from 'convex/values'
import { mutation } from './_generated/server'

export const create = mutation({
  args: { email: v.string(), name: v.string() },
  returns: v.object({ id: v.id('users') }),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('users', { ...args, createdAt: Date.now() })
    return { id }
  },
})
```

### In Application Code

```typescript
import type { User } from './users'

const user: User = {
  email: 'user@example.com',
  name: 'John Doe',
  createdAt: Date.now(),
}
```

## Adding New Models

1. Create file: `models/mymodel.ts`
2. Define field validators: `export const MY_MODEL_FIELDS = { ... } as const`
3. Export object validator: `export const myModelValidator = v.object(MY_MODEL_FIELDS)`
4. Export TS type: `export type MyModel = Infer<typeof myModelValidator>`
5. Use in `convex/schema.ts` and `convex/*.ts` functions
