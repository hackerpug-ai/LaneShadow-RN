# App Routes

React Native app structure using Expo Router for navigation.

## Folder Structure

```
app/
├── _layout.tsx          # Root layout - providers and navigation setup
├── (auth)/              # Auth route group (unauthenticated users)
│   ├── _layout.tsx     # Auth layout
│   └── sign-in.tsx     # Sign-in screen placeholder
└── (app)/              # App route group (authenticated users)
    ├── _layout.tsx     # App layout
    └── index.tsx       # Home screen
```

## Route Groups

Route groups (folders starting with `()`) allow you to organize routes without affecting the URL structure.

- **`(auth)/`** - Unauthenticated screens (sign-in, sign-up, etc.)
- **`(app)/`** - Authenticated screens (home, profile, etc.)

## Adding Routes

### Add a new screen to the app

1. Create file: `app/(app)/myscreen.tsx`
2. Export a component:

```typescript
import { View } from 'react-native'
import { Text } from 'react-native-paper'

export const MyScreen = () => (
  <View>
    <Text>My Screen</Text>
  </View>
)

export default MyScreen
```

3. Access at: `/app/myscreen` (in the app stack)

### Add a new route group

1. Create folder: `app/(mygroup)/`
2. Add `_layout.tsx`:

```typescript
import { Stack } from 'expo-router'

export default function MyGroupLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
```

3. Add screens inside `(mygroup)/`

## Themes & Styling

All screens should use:
- **Paper Text** component: `import { Text } from 'react-native-paper'`
- **Semantic theme**: `import { useSemanticTheme } from '@/hooks/use-semantic-theme'`

See `/constants/theme.ts` and `README.md` at the project root for theming guide.

## Authentication

The template includes a no-auth placeholder. Replace the sign-in flow with your auth provider:

- WorkOS
- Firebase Auth
- Your custom auth API

Update `app/(auth)/sign-in.tsx` with your auth logic.

## Navigation

From any screen, use Expo Router for navigation:

```typescript
import { useRouter } from 'expo-router'

export const MyScreen = () => {
  const router = useRouter()
  
  return <Button onPress={() => router.push('/(app)/other')} />
}
```

**Route format**: `/(routeGroup)/screenName`

Example routes:
- `/(auth)/sign-in`
- `/(app)/`
- `/(app)/home`

## References

- [Expo Router Docs](https://expo.github.io/router/docs)
- [React Navigation Docs](https://reactnavigation.org)
