---
stability: FEATURE_SPEC
last_validated: 2026-03-04
prd_version: 1.0.0
functional_group: POST
---

# Use Cases: Post-Ride Experience (POST)

Enable riders to rate, annotate, and track their ride history.

| ID | Title | Description |
|----|-------|-------------|
| UC-POST-01 | Route Rating | Rate completed routes with 1-5 stars |
| UC-POST-02 | Ride Notes | Add notes and comments to saved routes |
| UC-POST-03 | Ride History | Track which routes have been ridden and browse history |

---

## UC-POST-01: Route Rating

**Description**: After completing a ride, allow riders to rate the route to help remember which routes were best.

**Schema Extension Needed**:
- Add `rating` field to `saved_routes` table (1-5 integer, nullable)

**Acceptance Criteria**:
- [ ] Rider can rate a saved route with 1-5 stars from detail view
- [ ] Rider can see existing rating displayed on route cards in list view
- [ ] Rider can change rating after initial submission
- [ ] System displays average rating in route summary (for future re-rides)
- [ ] Rider can filter saved routes by rating (4+ stars, etc.)

---

## UC-POST-02: Ride Notes

**Description**: Allow riders to add personal notes to routes documenting conditions, tips, or memories.

**Schema Extension Needed**:
- Add `notes` field to `saved_routes` table (text, nullable)

**Acceptance Criteria**:
- [ ] Rider can add a text note to any saved route
- [ ] Rider can view notes in route detail view
- [ ] Rider can edit or delete notes
- [ ] System displays note indicator on route cards that have notes
- [ ] Rider can search routes by note content

---

## UC-POST-03: Ride History

**Description**: Track which routes have been completed and provide a dedicated history view.

**Schema Extension Needed**:
- Add `ridden_at` field to `saved_routes` table (timestamp, nullable)
- Add `status` field to `saved_routes` table (enum: 'planned' | 'ridden')

**Acceptance Criteria**:
- [ ] Rider can mark a route as "ridden" from detail view
- [ ] Rider can set the date the route was ridden
- [ ] Rider can view a filtered "Ride History" showing only completed rides
- [ ] Rider can see ride count and total distance stats on history screen
- [ ] System displays "ridden" badge on route cards for completed routes
- [ ] Rider can unmark a route as ridden (change back to planned)
