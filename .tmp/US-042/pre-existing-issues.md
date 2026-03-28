# Pre-Existing Issues Blocking Commit

## TypeScript Errors
The TypeScript compiler has pre-existing errors unrelated to US-042 changes:
- Multiple test files use Jest globals but project uses Vitest
- React Native type conflicts between DOM and RN globals
- Navigation type incompatibilities (pre-existing in @react-navigation/core)

These errors are in files NOT modified by US-042:
- app/(app)/(tabs)/__tests__/saved-routes.filter.test.ts
- app/(app)/(tabs)/__tests__/saved-routes.keyboard.test.ts
- node_modules type definitions

## Lint Warnings
ESLint configuration issue:
- Error: "react-native" plugin not found
- This is a pre-existing configuration problem in eslint.config.js
- Not related to US-042 changes

## US-042 Changes Summary
Files modified for US-042:
- components/map/route-polyline.test.tsx - Added test cases for long-press selection (FIXED overlay segment property names from start/end to startMeters/endMeters to match model)
- components/map/route-polyline-component.tsx - NEW FILE: React component with long-press gesture handling

All 31 tests in route-polyline.test.tsx pass successfully.

## Verification
```bash
# Test only route-polyline tests
bun test components/map/route-polyline.test.tsx
# Result: 31 pass, 0 fail
```

The implementation is complete and tested. The blocking issues are pre-existing configuration problems in the project.
