# US-037 Pre-existing Issues

## TypeScript errors (pre-existing)
- File: `components/map/route-polyline.test.tsx` line 109
- Multiple syntax errors (TS1005, TS1136, TS1109, etc.)
- Verified pre-existing via `git stash` test before my changes

## ESLint failure (pre-existing)
- ESLint: 9.39.4 cannot find plugin "react-native" (eslint-plugin-react-native missing or misconfigured)
- Error: `A configuration object specifies rule "react-native/no-inline-styles", but could not find plugin "react-native"`
- Verified pre-existing via `git stash` test before my changes

## Not caused by US-037 changes
Both failures exist on HEAD before my changes were applied.
