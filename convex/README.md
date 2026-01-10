# Convex Backend - React Native Template

Serverless backend for the React Native + Convex template.

## Quick Start

```bash
# Start Convex development
pnpm dev

# View database dashboard
npx convex dashboard

# Run a query
npx convex run users:list
```

## Structure

```
convex/
├── _generated/        # Auto-generated TypeScript types (ignore)
├── schema.ts          # Database schema (define tables here)
├── z.ts              # Zod wrappers (zQuery, zMutation, zAction)
├── users.ts          # Example API (users queries/mutations)
└── README.md         # This file
```

## Zod-First Pattern

All data models are defined in `/models` using **Zod first**, then translated to Convex validators.

### Define a Model

**Step 1: Create model in `/models/mymodel.ts`**

```typescript
import { z } from 'zod'
import { zodOutputToConvex } from 'convex-helpers/server/zod'

export const MyModelZ = z.object({
  title: z.string().min(1),
  count: z.number().int().positive(),
})

export type MyModel = z.infer<typeof MyModelZ>
export const MyModelV = zodOutputToConvex(MyModelZ)
```

**Step 2: Add to schema in `convex/schema.ts`**

```typescript
import { MyModelV } from '@/models/mymodel'

export default defineSchema({
  myModels: defineTable(MyModelV).index('by_title', ['title']),
})
```

**Step 3: Write Zod-validated functions in `convex/mymodels.ts`**

```typescript
import { z } from 'zod'
import { zQuery, zMutation } from './z'
import { MyModelZ } from '@/models/mymodel'

export const list = zQuery({
  args: {},
  returns: z.array(MyModelZ),
  handler: async (ctx) => {
    return await ctx.db.query('myModels').collect()
  },
})

export const create = zMutation({
  args: MyModelZ,
  returns: z.object({ id: z.string() }),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('myModels', args)
    return { id }
  },
})
```

## Using Zod-Wrapped Functions

Import `zQuery`, `zMutation`, and `zAction` from `./z.ts` and define functions with Zod schemas:

```typescript
import { z } from 'zod'
import { zQuery, zMutation, zAction, zid } from './z'

// Queries - read-only, fast, parallel
export const getUser = zQuery({
  args: { userId: zid('users') },
  returns: z.object({ id: z.string(), name: z.string() }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    return user ? { id: user._id, name: user.name } : null
  },
})

// Mutations - writes to database
export const updateUser = zMutation({
  args: { userId: zid('users'), name: z.string() },
  returns: z.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { name: args.name })
  },
})

// Actions - can call external APIs, cross-runtimes
export const sendEmail = zAction({
  args: { email: z.string().email() },
  returns: z.object({ sent: z.boolean() }),
  handler: async (ctx, args) => {
    // Can use external APIs here
    return { sent: true }
  },
})
```

### Function Types

| Type | Runtime | Use For | DB Access |
|------|---------|---------|-----------|
| **Query** | V8 | Read-only operations, fast | ✅ Read only |
| **Mutation** | V8 | Write to database | ✅ Full access |
| **Action** | Node.js | External APIs, cross-runtime | ❌ Cannot access DB directly |

## Key References

- **Zod**: https://zod.dev
- **Convex Helpers (zCustomQuery/zMutation)**: https://stack.convex.dev/typescript-zod-function-validation
- **Convex Docs**: https://docs.convex.dev
- **Project Models**: See `/models/README.md`
