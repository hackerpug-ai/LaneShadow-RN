# Route Overlay Bug - Logging Added

## Problem
Routes not showing on map after entering addresses and pressing "Go".

## Logging Added for Debugging

### Frontend (app/(app)/(tabs)/index.tsx)
1. **usePlanRide hook values** - Logs the reactive state from usePlanRide hook
   - isPlanning, isComplete, isFailed, status
   - planResult structure (type, keys, full JSON)
   - activePlan details

2. **planResult in useEffect** - Logs when plan completion effect runs
   - planResult structure validation
   - Options array presence and length
   - First option details

3. **polylines useMemo** - Logs when polylines are being generated
   - Whether routeOptions exists
   - Options length
   - Selected route ID

### Frontend (hooks/use-plan-ride.ts)
1. **activePlan.result extraction** - Logs the raw result from the database query
   - Result type and keys
   - Whether options array exists
   - First option structure
   - Full JSON dump of result

### Backend (convex/db/routePlans.ts)
1. **getActivePlanHandler** - Logs what the query returns from the database
   - Plan ID, status, acknowledged flag
   - Whether result field exists
   - Result type and structure
   - Options array validation

### Backend (convex/actions/agent/planRide.ts)
1. **executePlanHandler** - Logs when writing the completed result to DB
   - Result keys being written
   - Options array presence and length
   - First option map structure

## How to Test
1. Open the app and go to the map view
2. Enter a start address (or use current location)
3. Enter an end address
4. Press "Plan Ride"
5. Check the logs (frontend console and backend Convex logs)

## Expected Log Flow
1. Frontend: `startPlan called` → Backend: plan created
2. Backend: `executePlanHandler` runs → agent processes
3. Backend: `Writing completed result to DB` with result structure
4. Backend: `getActivePlan` returns completed plan with result
5. Frontend: `usePlanRide hook values` shows isComplete=true and planResult
6. Frontend: `planResult received in useEffect` with options array
7. Frontend: `polylines useMemo` with routeOptions present
8. Map should render polylines

## What to Look For
- Is `planResult` actually populated when `isComplete` is true?
- Does `planResult.options` exist and is it an array?
- Do the options have the expected structure (map, legs, etc.)?
- Is `state.routeOptions` being set in the reducer?
- Are polylines being generated from the routeOptions?

If any step shows missing/incorrect data, that's where the bug is.
