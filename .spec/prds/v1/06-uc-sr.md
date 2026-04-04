---
stability: FEATURE_SPEC
last_validated: 2026-04-03
prd_version: 1.1.0
---

# UC-SR: Saved Routes & Favorites

---

## UC-SR-01: Save a planned route

**Description**: After reviewing route results, the Rider can save a route to their personal library with a single tap. The saved route retains all planning context: the AI-generated name, description, weather data, scenic score, and map polyline. Saving is the gateway to all SR use cases.

**Acceptance Criteria**:
- ☐ Rider can tap a "Save Route" action on a route attachment card in the chat or from the route detail view to add the route to their library
- ☐ System saves the route with its AI-generated name, description, polyline, scenic score, and weather snapshot
- ☐ Rider can see a confirmation toast after saving that names the saved route
- ☐ System prevents duplicate saves of the same route if the Rider taps "Save Route" more than once
- ☐ Rider can access the saved route in the Saved Routes list immediately after saving without navigating to another screen first

---

## UC-SR-02: Browse saved routes list

**Description**: The Rider navigates to the Saved Routes tab and sees a scrollable list of all their saved routes in reverse-chronological order. Each card shows enough context to recognize a route without opening it. An empty state with a planning CTA appears if no routes have been saved yet.

**Acceptance Criteria**:
- ☐ Rider can navigate to a Saved Routes tab to view all previously saved routes
- ☐ Rider can see each route card displaying the route name, date saved, start and end locations, distance, and a thumbnail map preview
- ☐ System sorts saved routes newest-first by default
- ☐ System displays an empty state with a "Plan your first ride" call-to-action when no routes have been saved
- ☐ Rider can tap any route card to open the full route detail view with map and weather overlays

---

## UC-SR-03: Search and filter saved routes

**Description**: As a Rider's library grows, they need to find specific routes without scrolling through the full list. This use case covers real-time name search and date-range filtering to narrow the list to the routes that matter right now.

**Acceptance Criteria**:
- ☐ Rider can type in a search bar above the routes list to filter routes by name in real time
- ☐ System filters the displayed routes as the Rider types, showing only routes whose names match the input
- ☐ Rider can select a date filter (e.g., "Last week", "Last month", "Last 3 months") to narrow routes by when they were saved
- ☐ Rider can clear all active filters with a single "Clear" control to return to the full unfiltered list
- ☐ System displays a "No results" empty state with a suggestion to clear filters when search or date filter returns zero routes

---

## UC-SR-04: Rename or delete a saved route

**Description**: The Rider can update the name of a saved route to something personally meaningful, or permanently delete routes they no longer want. Both actions are accessible from the route detail view to avoid accidental triggers in the list.

**Acceptance Criteria**:
- ☐ Rider can tap a rename control in the route detail view to edit the route name inline
- ☐ System updates the route name across the list view and detail view immediately after the Rider confirms the rename
- ☐ Rider can tap a delete control in the route detail view to initiate route deletion
- ☐ System presents a confirmation dialog before permanently deleting the route
- ☐ Rider can confirm deletion and see the route removed from the Saved Routes list and returned to the list screen

---

## UC-SR-05: Save a favorite road segment

**Description**: While viewing a route on the map, the Rider can long-press on any road segment to mark it as a favorite. Favorite roads represent the roads the Rider loves most and form the personalization core of LaneShadow. Each favorite segment is named and stored for future use.

**Acceptance Criteria**:
- ☐ Rider can long-press on a polyline segment in the route map view to trigger the "Save as Favorite" action sheet
- ☐ Rider can enter a name for the favorite road segment in the action sheet before saving
- ☐ System saves the road segment with its name, geographic coordinates, and a preview of the segment on a mini map
- ☐ Rider can view all saved favorite roads in a dedicated Favorite Roads section in Settings
- ☐ System confirms the save with a toast and shows the segment name

---

## UC-SR-06: Auto-include favorite roads in route planning

**Description**: When planning a new route, the Rider can enable an "Include my favorite roads" toggle that instructs the AI planning pipeline to bias route generation toward the Rider's saved favorite road segments. Routes that include a favorite segment show an indicator so the Rider knows their preferences were honored.

**Acceptance Criteria**:
- ☐ Rider can mention favorite roads in a chat message (e.g., "include my favorite roads") or toggle "Include favorite roads" in session settings before generating routes
- ☐ System passes saved favorite road segments to the route generation pipeline as preferred corridors when the toggle is enabled
- ☐ Rider can see a "Includes your favorites" indicator on any route card that incorporates one or more saved segments
- ☐ System displays a "couldn't include [Favorite Name] — too far from this route" message on routes where a favorite segment was geographically incompatible
- ☐ Rider can remove a favorite road segment from the Favorite Roads settings section, and it will no longer be included in future route generation

---

## UC-SR-07: Rate a route and add notes

**Description**: After riding a saved route, the Rider can record their experience with a 1–5 star rating and optional text notes. Ratings and notes appear on the route card in the list view and make it easy to remember which routes are worth repeating and why.

**Acceptance Criteria**:
- ☐ Rider can tap a star rating control in the route detail view to assign a 1–5 star rating to a saved route
- ☐ System displays the rating on the saved route card in the list view immediately after the Rider saves it
- ☐ Rider can tap an "Add note" control to write and save a free-form text note on the route
- ☐ Rider can edit or delete an existing note from the route detail view
- ☐ System displays a note indicator icon on route cards in the list view when a text note has been added
- ☐ Rider can filter the saved routes list to show only routes with a rating of 4 stars or higher

---

## UC-SR-08: Re-plan from a saved route

**Description**: The Rider can use a saved route as the starting point for a new planning conversation. This opens a new chat session pre-loaded with the saved route's context, allowing the Rider to refine it for today's conditions or preferences.

**Acceptance Criteria**:
- ☐ Rider can tap "Re-plan this route" from the saved route detail view
- ☐ System starts a new chat session with the saved route's original planning context pre-loaded
- ☐ The saved route appears as the first attachment in the new session
- ☐ Rider can then refine via conversation (e.g., "same route but avoid the rain section", "add a stop at Big Sur")
- ☐ The original saved route is not modified — re-planning creates new route alternatives

---

## UC-SR-09: Mark a route as ridden

**Description**: After completing a ride, the Rider can mark a saved route as "ridden" to build ride history. This is a manual toggle — V1 does not include GPS-based ride recording.

**Acceptance Criteria**:
- ☐ Rider can tap a "Mark as Ridden" toggle on the saved route detail view
- ☐ System adds a "Ridden" badge and the date ridden to the route card in the list view
- ☐ Rider can filter saved routes by "Ridden" vs "Planned" status
- ☐ Rider can unmark a route as ridden if they toggled it by mistake

---

## UC-SR-10: Export route to navigation app

**Description**: Since V1 does not include turn-by-turn navigation, the Rider can export a selected route to Google Maps or Waze for navigation. This is the V1 workaround for the lack of built-in navigation.

**Acceptance Criteria**:
- ☐ Rider can tap "Navigate" on a route attachment card in chat or on a saved route detail view
- ☐ System opens Google Maps (default) or Waze (based on installed apps / preference) with the route waypoints
- ☐ System constructs a deep-link URL from the route's origin, destination, and intermediate waypoints
- ☐ Rider sees a brief confirmation toast before the handoff (e.g., "Opening in Google Maps...")
- ☐ If neither Google Maps nor Waze is installed, System displays a message with the route coordinates for manual entry
