# Fix: Routes Not Showing on Map After Planning

**Created**: 2026-04-01T12:00:05Z
**Mode**: Quick
**Implementer**: react-native-ui-implementer
**Reviewer**: react-native-ui-reviewer
**Status**: ✅ COMPLETED

## Problem
Entering a start and end address in the map view and pressing go does not result in seeing routes overlay on the map.

## Acceptance Criteria
User can manually test by entering addresses and verifying routes appear on the map.

## Root Cause
The `useEffect` hook handling plan completion had `acknowledgePlan` in its dependency array. This caused the effect to re-run unnecessarily when the callback was recreated, potentially clearing the plan result before routes were displayed.

## Solution
Removed `acknowledgePlan` from the effect's dependency array and used a ref instead. This ensures the effect only runs when `isComplete` or `planResult` changes, not when the callback reference changes.

## Files Modified
- `/Users/justinrich/Projects/LaneShadow/app/(app)/(tabs)/index.tsx`

## Review Verdict: **PASS**

### Critical Issues
None identified.

### Important Issues
None identified.

### Considerations
- Minor inconsistency: another useEffect in the same file still uses `acknowledgePlan` directly (line 362), though this doesn't cause issues
- Could add a comment explaining the ref pattern for future maintainability

## Verification
The fix passes TypeScript type checking. The change is minimal and focused on the specific issue.
