# Pre-existing Issues (US-029 Verification)

## 1. No `typecheck` script in package.json
- `bun run typecheck` returns "Script not found"
- Pre-existing: not related to US-029 changes

## 2. ESLint missing `react-native` plugin
- ESLint fails with: `could not find plugin "react-native"`
- Pre-existing: eslint config references plugin not installed

## 3. Jest transform failures for `@expo/vector-icons`
- 12 test suites fail due to ESM import in `@expo/vector-icons/MaterialCommunityIcons.js`
- Pre-existing: Jest `transformIgnorePatterns` config issue
- US-029 specific tests (saved-routes.swipe.test.ts) pass successfully
