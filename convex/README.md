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
├── users.ts          # Example API (users queries/mutations)
└── README.md         # This file
```

## Convex Validator-First Pattern (`v` Everywhere)

All data models are defined in `/models` using **Convex `v` validators** directly.

### Define a Model

**Step 1: Create model in `/models/mymodel.ts`**

```typescript
import { Infer, v } from 'convex/values'

export const MY_MODEL_FIELDS = {
  title: v.string(),
  count: v.number(),
} as const

export const myModelValidator = v.object(MY_MODEL_FIELDS)
export type MyModel = Infer<typeof myModelValidator>
```

**Step 2: Add to schema in `convex/schema.ts`**

```typescript
import { myModelValidator } from '../models/mymodel'

export default defineSchema({
  myModels: defineTable(myModelValidator).index('by_title', ['title']),
})
```

**Step 3: Write functions using `query`/`mutation`/`action` + `v`**

```typescript
import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('myModels'),
      _creationTime: v.number(),
      title: v.string(),
      count: v.number(),
    })
  ),
  handler: async (ctx) => {
    return await ctx.db.query('myModels').collect()
  },
})

export const create = mutation({
  args: { title: v.string(), count: v.number() },
  returns: v.object({ id: v.id('myModels') }),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('myModels', args)
    return { id }
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

- **Convex Docs**: https://docs.convex.dev
- **Project Models**: See `/models/README.md`
