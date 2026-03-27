# Pre-existing Issues

## TypeScript
- `components/map/route-polyline.test.tsx:109` - syntax error exists before US-019 changes
- Verified via `git stash && tsc --noEmit` - same error present without changes

## ESLint
- Missing `react-native` plugin in eslint.config.js - pre-existing configuration issue
- Verified same error occurs on stashed (no-changes) state
