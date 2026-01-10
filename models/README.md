# Data Models

This directory contains all shared data models using **Zod-first** approach.

## Pattern: Zod-First with Derived Convex Validators

All models define:
1. **Zod Schema** (e.g., `UserZ`) - Source of truth for data shape
2. **TypeScript Type** (e.g., `User`) - Inferred from Zod for app code
3. **Convex Validator** (e.g., `UserV`) - Derived from Zod using `zodOutputToConvex()`

### Example: User Model

```typescript
// models/users.ts
import { z } from 'zod'
import { zodOutputToConvex } from 'convex-helpers/server/zod'

// 1. Define Zod schema
export const UserZ = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  createdAt: z.number(),
})

// 2. Export TS type
export type User = z.infer<typeof UserZ>

// 3. Derive Convex validator
export const UserV = zodOutputToConvex(UserZ)
```

## Usage

### In Database Schema (convex/schema.ts)

```typescript
import { defineSchema, defineTable } from 'convex/server'
import { UserV } from '@/models/users'

export default defineSchema({
  users: defineTable(UserV).index('by_email', ['email']),
})
```

### In Zod-Validated Functions (convex/users.ts)

```typescript
import { z } from 'zod'
import { zQuery, zMutation } from './z'
import { UserZ } from '@/models/users'

export const create = zMutation({
  args: UserZ.pick({ email: true, name: true }),
  returns: z.object({ id: z.string() }),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('users', { ...args, createdAt: Date.now() })
    return { id }
  },
})
```

### In Application Code

```typescript
import type { User } from '@/models/users'

const user: User = {
  email: 'user@example.com',
  name: 'John Doe',
  createdAt: Date.now(),
}
```

## Adding New Models

1. Create file: `models/mymodel.ts`
2. Define Zod schema: `export const MyModelZ = z.object({ ... })`
3. Export TS type: `export type MyModel = z.infer<typeof MyModelZ>`
4. Export Convex validator: `export const MyModelV = zodOutputToConvex(MyModelZ)`
5. Use in `convex/schema.ts` and `convex/*.ts` functions
