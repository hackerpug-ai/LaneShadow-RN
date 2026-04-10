# PRD: Epic 4 Remediation - Complete Save & Reuse Favorite Roads

**Status**: Remediation Plan
**Date**: 2026-04-08
**Priority**: P0
**Type**: Feature Completion

---

## Overview

Epic 4 (Save & Reuse Favorite Roads) is **INCOMPLETE**. Phase 1-3 (US-040 through US-045) have completion markers, but critical gaps exist:

- **COMPLETED**: Backend infrastructure (schema, CRUD)
- **PARTIAL**: UI components built but NOT WIRED to map
- **MISSING**: Core routing features (US-046, US-047, US-048, US-049)

This PRD defines the remediation work required to complete Epic 4.

---

## Problem Statement

Users cannot currently use their favorite roads to influence route planning. The foundation exists (schema, CRUD, UI components), but the core value proposition is missing:

1. **No toggle** to include favorites in planning
2. **No integration** between favorites and planning graph
3. **No feedback** showing which favorites influenced routes
4. **No messaging** when favorites are too far to include
5. **Unwired components** - long-press and save sheet not connected

---

## Acceptance Criteria

### AC-1: Include Favorites Toggle
**GIVEN**: User is planning a ride
**WHEN**: User opens PlanRideSheet
**THEN**: "Include favorite roads" toggle is visible
**AND**: Toggle defaults to OFF
**AND**: Toggle state persists during planning session

### AC-2: Favorites Influence Route Planning
**GIVEN**: User has saved favorite roads
**WHEN**: User enables "Include favorite roads" toggle and plans a route
**THEN**: Planning graph receives favorite road geometries
**AND**: Generated routes prefer favorite segments when feasible
**AND**: Routes maintain acceptable quality (distance, time)

### AC-3: Favorites Proximity Filter
**GIVEN**: User has favorite roads
**WHEN**: Some favorites are >50km from route corridor
**THEN**: Distant favorites are excluded from planning
**AND**: Planning proceeds normally with nearby favorites

### AC-4: Favorite Inclusion Indicator
**GIVEN**: Route is generated with favorites enabled
**WHEN**: User views route options
**THEN**: Each route shows badge indicating count of included favorites
**AND**: Badge displays "0 favorites" when none included
**AND**: Badge is visible alongside weather badges

### AC-5: Favorite Exclusion Feedback
**GIVEN**: User has favorites >50km from route
**WHEN**: Route is generated
**THEN**: Info message indicates which favorites were too far
**AND**: Message lists excluded favorite names
**AND**: No message shown when all favorites included

### AC-6: Long-Press to Save Favorite
**GIVEN**: User is viewing home map with route
**WHEN**: User long-presses a route segment
**THEN**: Segment highlights with visual feedback
**AND**: Haptic feedback triggers
**AND**: SaveFavoriteSheet renders after 500ms

### AC-7: Save Favorite Sheet Integration
**GIVEN**: User has long-pressed a route segment
**WHEN**: SaveFavoriteSheet renders
**THEN**: Sheet captures segment geometry and bounds
**WHEN**: User enters name and taps Save
**THEN**: Favorite is created via favoriteRoads.insert
**AND**: Sheet dismisses with success feedback

---

## Quality Gates

### Functional
- [ ] All 7 acceptance criteria passing
- [ ] End-to-end flow works: save → plan → display feedback
- [ ] Favorites persist across app restarts

### Performance
- [ ] Favorites fetch doesn't block UI (<500ms)
- [ ] Planning with favorites adds <1s latency
- [ ] No N+1 queries when loading favorites list

### Accessibility
- [ ] Long-press has alternative trigger (VoiceOver/TalkBack)
- [ ] Toggle is reachable with assistive tech
- [ ] Favorite inclusion badge is accessible
- [ ] Touch targets meet 44×44px minimum

### Testing
- [ ] Integration test covers full user journey
- [ ] Unit tests for planning graph integration
- [ ] E2E test verifies save → plan → display flow

---

## Technical Requirements

### Backend (Convex)
1. **Modify `planRide` action** to accept `includeFavorites` boolean
2. **Fetch favorites** when toggle enabled via `favoriteRoads.listByOwner`
3. **Pass favorites to planning graph** as preferred segments
4. **Filter by distance** (50km threshold from route corridor)
5. **Return inclusion/exclusion lists** for UI feedback

### Frontend (React Native)
1. **Add toggle to PlanRideSheet** - state management, form integration
2. **Wire long-press gesture** to HomeMap route polylines
3. **Wire SaveFavoriteSheet** - capture geometry, call insert mutation
4. **Add inclusion badge** to RouteOptionCard
5. **Add exclusion message** component for distant favorites

### Planning Graph
1. **Accept favorites parameter** as preferred segments
2. **Use preferred segments** in route generation
3. **Track which favorites** were included in each route
4. **Handle empty favorites** gracefully (normal planning)

---

## Dependencies

### Completed Work (Leverage)
- US-040: `favorite_roads` table schema ✅
- US-041: `favoriteRoads` CRUD operations ✅
- US-042: Long-press gesture handler (component only) ⚠️
- US-043: SaveFavoriteSheet (component only) ⚠️
- US-044: FavoriteRoadCard with mini map ✅
- US-045: Favorite Roads settings section ✅

### New Work Required
- US-046: Implement "Include favorite roads" toggle
- US-047: Integrate favorites with planning graph
- US-048: Build favorite inclusion indicator
- US-049: Build "couldn't include" message
- US-050: Wire long-press to home map
- US-051: Wire SaveFavoriteSheet integration
- US-052: Add E2E test for full flow
- US-053: Accessibility verification

---

## Non-Functional Requirements

### Performance
- Favorites fetch: <500ms for 100 favorites
- Planning latency: +1s max when favorites enabled
- Map render: no degradation with long-press

### Reliability
- Graceful fallback when favorites API fails
- Planning works normally if favorites fetch errors
- No data loss when save operation fails

### Security
- Ownership checks on all favorite operations
- No cross-user data leakage
- Validate favorite geometry bounds

### Maintainability
- Follow existing patterns (savedRoutes, planRide)
- TDD workflow for all new features
- Code review before merge

---

## Success Metrics

- **0 of 7 ACs passing** → **7 of 7 ACs passing**
- **6.5-12.5 hours** estimated remaining work
- **E2E test** covers full user journey
- **Accessibility audit** passes WCAG 2.1 AA

---

## Out of Scope

- Favorite sharing (user-to-user)
- Favorite folders/collections
- Favorite import/export
- Analytics on favorite usage
- Route replay with favorites highlighted

---

## References

- Red-hat review: `.spec/reviews/red-hat-epic-4-final.md`
- Epic 4 summary: `.spec/tasks/epic-4/EPIC-4-SUMMARY-UPDATED.md`
- Task inventory: `.spec/tasks/epic-4/EPIC-4-INVENTORY-UPDATED.json`
