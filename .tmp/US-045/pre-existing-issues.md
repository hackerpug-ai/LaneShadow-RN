# US-045 Pre-Existing Issues

## Test Infrastructure Issues

### React Native Test Import Errors
**Issue**: All React Native component tests fail with:
```
error: Unexpected typeof
    at /Users/justinrich/Projects/LaneShadow/node_modules/.pnpm/react-native@0.81.5_@babel+core@7.28.4_@types+react@19.1.17_react+19.1.0/node_modules/react-native/index.js:27:8
```

**Affected Tests**:
- components/ui/__tests__/favorite-road-card.test.tsx
- components/ui/__tests__/save-favorite-sheet.test.tsx
- components/settings/__tests__/favorite-roads-section.test.tsx (NEW)
- All other React Native component tests

**Root Cause**: The vitest test environment is configured for Node.js (`environment: 'node'` in vitest.config.ts) but React Native components require a different environment setup (jsdom or happy-dom with React Native mocks).

**Status**: PRE-EXISTING - Not introduced by US-045 implementation

### TypeScript Type Errors in Test Files
**Issue**: Multiple test files have TypeScript errors related to jest types not being found:
```
error TS2708: Cannot use namespace 'jest' as a value.
error TS2582: Cannot find name 'describe'. Do you need to install type definitions for a test runner?
```

**Affected Files**:
- app/(app)/(tabs)/__tests__/saved-routes.filter.test.ts
- app/(app)/(tabs)/__tests__/saved-routes.keyboard.test.ts
- app/(app)/(tabs)/__tests__/saved-routes.swipe.test.ts
- app/(app)/(tabs)/__tests__/saved-routes.test.ts

**Status**: PRE-EXISTING - Not introduced by US-045 implementation

## Convex API Generation Issue

**Issue**: The `convex/_generated/api.d.ts` file does not include the `favoriteRoads` module, even though:
1. The `convex/db/favoriteRoads.ts` file exists with exported functions
2. The functions follow the correct Convex pattern (query, mutation exports)

**Workaround**: The implementation uses string references (`'db.favoriteRoads:list'`) instead of the proper API reference (`api.db.favoriteRoads.list`).

**Status**: PRE-EXISTING - The favoriteRoads module was created in US-041 but never added to the generated API

**Resolution Required**: Run `npx convex dev` to regenerate the API types, or add the module to the Convex configuration manually.

## ESLint Configuration Issue

**Issue**: ESLint fails with:
```
ESLint: 9.37.0
A configuration object specifies rule "react-native/no-inline-styles", but could not find plugin "react-native".
```

**Status**: PRE-EXISTING - ESLint configuration issue

## Implementation Notes

### What Was Implemented
1. **FavoriteRoadsSection Component** (`components/settings/favorite-roads-section.tsx`)
   - Displays list of favorite roads using FavoriteRoadCard
   - Shows loading skeleton while fetching
   - Shows empty state when no favorites exist
   - Implements delete functionality via favoriteRoads.remove mutation
   - Uses semantic theme throughout (no hardcoded values)

2. **Settings Integration** (`app/(app)/(tabs)/settings.tsx`)
   - Added FavoriteRoadsSection import
   - Rendered section after existing settings content

3. **Test File** (`components/settings/__tests__/favorite-roads-section.test.tsx`)
   - Follows TDD principles (tests written first)
   - Covers all acceptance criteria:
     - AC1: Section visible with header
     - AC2: Shows FavoriteRoadCard for each favorite
     - AC3: Shows empty state when no favorites
     - AC4: Delete functionality
   - Uses proper mocking patterns consistent with existing tests

### Known Limitations
1. Tests cannot run due to pre-existing React Native test infrastructure issues
2. Convex API references use string workaround until API is regenerated
3. Full type checking cannot run due to pre-existing TypeScript errors in test files

### Files Modified
- `app/(app)/(tabs)/settings.tsx` (MODIFY) - Added FavoriteRoadsSection
- `components/settings/favorite-roads-section.tsx` (NEW) - Section component
- `components/settings/__tests__/favorite-roads-section.test.tsx` (NEW) - Tests

### Next Steps
1. Fix React Native test infrastructure (project-wide issue)
2. Regenerate Convex API to include favoriteRoads module
3. Fix ESLint configuration
4. Fix TypeScript type errors in test files
5. Run tests once infrastructure is fixed
