# React Native + Convex Template

A production-ready React Native starter template with Expo Router, React Native Paper, Convex backend, and Zod-first data modeling.

## Quick Start

### Prerequisites

- **Node.js** 18+ and **pnpm** 8+
- **Expo Go** app (on phone or simulator)
- **Convex account** (free tier available)

### Getting Started

#### Step 1: Create a New Convex Project

Create a new Convex deployment for your project:

```bash
# Install Convex CLI (if not already installed)
npm install -g convex

# OR use pnpm
pnpm add -g convex

# Create a new Convex project
# This will prompt you to sign in and create a project
convex project create

# The CLI will output your project URL, e.g.:
# Convex URL: https://your-project.convex.cloud
```

**Alternative: Use an existing Convex project**

If you already have a Convex project, get the URL from [dashboard.convex.dev](https://dashboard.convex.dev)

#### Step 2: Environment Variables

Create `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add:

```bash
# Required: Your Convex deployment URL
# Get this from: https://dashboard.convex.dev
# Format: https://your-project.convex.cloud
EXPO_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

**Environment Variables Reference:**

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `EXPO_PUBLIC_CONVEX_URL` | ✅ Yes | Convex deployment URL | `https://your-project.convex.cloud` |

⚠️ **Important Notes:**
- Variables prefixed with `EXPO_PUBLIC_` are exposed to the frontend
- Never commit `.env.local` to git (it's in `.gitignore`)
- The Convex URL must start with `https://`
- For local development, use the development deployment URL (not production)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example .env.local

# 3. Update EXPO_PUBLIC_CONVEX_URL in .env.local
# Get your Convex URL from: https://dashboard.convex.dev

# 4. Start development
pnpm dev
```

This will:
- Start Convex dev server on localhost
- Start Expo on localhost (scan QR with Expo Go)
- Hot reload on file changes

### First Run

- Navigate to `/(auth)/sign-in` screen
- Click "Continue" (placeholder - add your auth provider)
- See home screen with template info

## Project Structure

```
react-native-convex-template/
├── app/                      # Expo Router screens & layouts
│   ├── (auth)/              # Auth route group
│   └── (app)/               # App route group
├── components/              # React Native Paper UI kit
│   └── ui/                  # Generic UI components
├── convex/                  # Convex backend
│   ├── schema.ts            # Database schema
│   ├── z.ts                 # Zod wrappers (zQuery, zMutation)
│   ├── users.ts             # Example queries/mutations
│   └── README.md            # Backend guide
├── models/                  # Zod-first data models
│   ├── users.ts             # Example: User model
│   └── README.md            # Modeling guide
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities
├── types/                   # TypeScript types
├── constants/              # Constants (theme, etc.)
└── README.md               # This file
```

## Architecture

### Frontend (React Native)

- **Expo Router** for navigation
- **React Native Paper** for UI components
- **Semantic theme** hook for consistent styling
- **Convex React** for data fetching/mutations
- **Zustand** for state management

### Backend (Convex)

- **Serverless functions** (queries, mutations, actions)
- **Relational database** (managed)
- **TypeScript-first** with full type safety
- **Zod validation** with derived Convex validators

## Data Modeling (Zod-First Pattern)

### Step 1: Define Zod Schema

Create `models/mymodel.ts`:

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

### Step 2: Add to Convex Schema

Update `convex/schema.ts`:

```typescript
import { MyModelV } from '@/models/mymodel'

export default defineSchema({
  myModels: defineTable(MyModelV).index('by_title', ['title']),
})
```

### Step 3: Write Zod-Validated Functions

Create `convex/mymodels.ts`:

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

### Step 4: Use in Frontend

```typescript
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'

export const MyComponent = () => {
  const items = useQuery(api.mymodels.list)
  const create = useMutation(api.mymodels.create)
  
  return (
    <>
      {items?.map(item => <Text key={item._id}>{item.title}</Text>)}
      <Button onPress={() => create({ title: 'New', count: 1 })} />
    </>
  )
}
```

See [models/README.md](./models/README.md) for detailed guide.

## Convex Backend

All backend logic lives in `convex/`:

- **`schema.ts`** - Database schema (tables and indexes)
- **`z.ts`** - Zod wrapper helpers (zQuery, zMutation, zAction)
- **`users.ts`** - Example API (demo queries/mutations)

### Using Zod-Wrapped Functions

```typescript
import { z } from 'zod'
import { zQuery, zMutation, zAction, zid } from './z'

// Read data
export const getUser = zQuery({
  args: { userId: zid('users') },
  returns: z.object({ id: z.string(), name: z.string() }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    return user ? { id: user._id, name: user.name } : null
  },
})

// Write data
export const updateUser = zMutation({
  args: { userId: zid('users'), name: z.string() },
  returns: z.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { name: args.name })
  },
})

// Call external APIs
export const sendNotification = zAction({
  args: { userId: zid('users'), message: z.string() },
  returns: z.object({ sent: z.boolean() }),
  handler: async (ctx, args) => {
    // Can use external APIs here
    return { sent: true }
  },
})
```

See [convex/README.md](./convex/README.md) for full guide.

## Theming & Styling

All components use **semantic theming** with React Native Paper:

```typescript
import { View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '@/hooks/use-semantic-theme'

export const MyComponent = () => {
  const { semantic } = useSemanticTheme()
  
  return (
    <View style={{ 
      padding: semantic.space.lg,
      backgroundColor: semantic.color.surface.default 
    }}>
      <Text 
        variant="titleMedium"
        style={{ color: semantic.color.onSurface.default }}
      >
        Hello World
      </Text>
    </View>
  )
}
```

**Key rules:**
- ✅ Use `Text` from `react-native-paper` (not React Native)
- ✅ Use `useSemanticTheme()` hook for colors/spacing/radius
- ✅ Use Paper's built-in text variants: `titleLarge`, `bodyMedium`, `labelSmall`, etc.
- ❌ Never hardcode colors, spacing, or font sizes

See project root for full theming guide.

## Folder Organization

| Folder | Purpose |
|--------|---------|
| `app/` | Expo Router screens and layouts |
| `components/ui/` | Reusable UI components (Paper-based) |
| `convex/` | Backend functions and schema |
| `models/` | Zod-first data models |
| `hooks/` | Custom React hooks |
| `lib/` | Utility functions and helpers |
| `types/` | Shared TypeScript types |
| `constants/` | Constants (theme, config, etc.) |

## Available Scripts

```bash
# Development
pnpm dev              # Start Convex + Expo

# Testing & Quality
pnpm test             # Run Jest tests
pnpm test:watch       # Watch mode
pnpm lint             # ESLint
pnpm lint:fix         # Fix linting
pnpm type-check       # TypeScript check

# Building
pnpm start            # Expo start
pnpm ios              # Run on iOS simulator
pnpm android          # Run on Android emulator
pnpm web              # Run in browser
```

## Authentication

The template includes a **no-auth placeholder**. Add your auth provider:

**Option 1: WorkOS**
```typescript
// app/(auth)/sign-in.tsx
import { WorkOSAuthKit } from '@workos-inc/authkit-react'

export const SignInScreen = () => {
  // Implement WorkOS sign-in
}
```

**Option 2: Firebase**
```typescript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'

export const SignInScreen = () => {
  // Implement Firebase sign-in
}
```

**Option 3: Custom API**
```typescript
export const SignInScreen = () => {
  const handleSignIn = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    // Store token and navigate
  }
}
```

## Code Quality Standards

- **TypeScript strict mode** enabled
- **ESLint** for code quality
- **Prettier** for formatting
- **Named exports only** (no default exports)
- **Semantic theme** for all styling
- **Zod validation** for all data

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [Expo Router](https://expo.github.io/router)
- [React Native Paper](https://reactnativepaper.com)
- [Convex Docs](https://docs.convex.dev)
- [Zod Validation](https://zod.dev)
- [Convex + Zod Integration](https://stack.convex.dev/typescript-zod-function-validation)

## Troubleshooting

### "Cannot find module @/convex/_generated/api"

Run `pnpm dev` to start Convex, which auto-generates types.

### Convex client not connecting

Check `EXPO_PUBLIC_CONVEX_URL` in `.env.local`. Get it from https://dashboard.convex.dev

### StyleSheet errors

Ensure:
- Using `Text` from `react-native-paper` (not React Native)
- Using `useSemanticTheme()` hook for all colors/spacing
- Not using hardcoded values (#RRGGBB, pixel sizes, etc.)

## Next Steps

1. **Add authentication** - Replace sign-in placeholder with your auth provider
2. **Create data models** - Add your first Zod model in `models/`
3. **Build Convex API** - Add queries/mutations in `convex/`
4. **Design screens** - Create app screens in `app/(app)/`
5. **Deploy** - Deploy frontend (Expo) and backend (Convex)

## License

MIT

## Contributing

PRs welcome! Follow the code standards documented above.
