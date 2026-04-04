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

### Wireframe: Saved Routes List

```
┌─────────────────────────────────────────────────────────┐
│ Saved Routes                                    [⚙️]   │
├─────────────────────────────────────────────────────────┤
│ 🔍 Search routes...                                     │
│                                                         │
│ Filter: [All ▼]  Date: [All time ▼]  [Clear]          │
├─────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────┐   │
│ │ ⭐ Coastal Cruiser                    ⭐⭐⭐⭐⭐  │   │
│ │ 📍 Asheville → Wilmington                       │   │
│ │ 📅 Saved Oct 15, 2025  •  🛵 Ridden Oct 18      │   │
│ │ 42 mi • 2h 15m • Scenic: 9.2/10                 │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│ │ [🗺️ View]  [✏️ Rename]  [🗑️ Delete]  [Navigate]│   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Mountain Loop                            ⭐⭐⭐⭐  │   │
│ │ 📍 Asheville → Blowing Rock                     │   │
│ │ 📅 Saved Oct 10, 2025  •  📝 Has notes          │   │
│ │ 38 mi • 2h 05m • Scenic: 8.7/10                 │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│ │ [🗺️ View]  [✏️ Rename]  [🗑️ Delete]  [Navigate]│   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Valley Run                               (Unrated)│   │
│ │ 📍 Asheville → Mooresville                      │   │
│ │ 📅 Saved Sep 28, 2025  •  Planned (not ridden)  │   │
│ │ 35 mi • 1h 50m • Scenic: 8.1/10                 │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│ │ [🗺️ View]  [✏️ Rename]  [🗑️ Delete]  [Navigate]│   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘

───────────────────────────────────────────────────────────

Empty State (when no routes):

┌─────────────────────────────────────────────────────────┐
│ Saved Routes                                    [⚙️]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                                                         │
│                    🛵                                   │
│                                                         │
│           No saved routes yet                          │
│                                                         │
│      Plan your first ride and save it here!            │
│                                                         │
│         [Plan a Ride →]                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key Elements**:
- Search bar: Real-time filtering by route name
- Filter controls: Status (All/Planned/Ridden), Date range, Clear button
- Route cards: Thumbnail map, name, locations, date, status badges
- Ratings: Star display (5 stars or unrated)
- Quick actions: View, Rename, Delete, Navigate
- Empty state: Friendly CTA to start planning
- Status indicators: Ridden/Planned badges, note indicator

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

### Wireframe: Route Detail View

```
┌─────────────────────────────────────────────────────────┐
│ ← Back              Coastal Cruiser              [⋮]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    [Interactive Map]                   │
│                  (Route Polyline Display)               │
│                                                         │
│            🌤️ Weather overlays available               │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ ⭐ Scenic: 9.2/10  |  🌤️ Clear  |  💨 8-12 mph        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📍 Asheville, NC → Wilmington, NC                      │
│ 📏 42 miles  |  ⏱️ 2h 15m  |  ↗️ 2,400 ft elevation    │
│ 📅 Saved: Oct 15, 2025  |  🛵 Ridden: Oct 18, 2025     │
│                                                         │
│ 📝 Ocean views with light tailwinds. Perfect for       │
│    fall riding. Includes rest stop at Wrightsville     │
│    Beach.                                              │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Your Rating: ⭐⭐⭐⭐⭐ (5/5)                            │
│                                                         │
│ Your Notes:                                            │
│ "Amazing ride! Fall colors were peak. Stopped for       │
│  coffee at 10 AM. Would do again!"                     │
│                                                         │
│ [Edit Note]                                            │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Actions:                                                │
│ [✏️ Rename]  [🔄 Re-Plan]  [🧭 Navigate]  [🗑️ Delete]  │
│                                                         │
│ Status: [☑ Mark as Ridden]                             │
└─────────────────────────────────────────────────────────┘
```

**Key Elements**:
- Map: Full-width interactive map with route polyline
- Route info: Distance, duration, elevation, dates
- Weather summary: Quick overview of conditions
- Description: AI-generated or user-modified
- Rating section: Star rating control
- Notes: User notes with edit capability
- Action buttons: Rename, Re-plan, Navigate, Delete
- Status toggle: Mark as ridden
- Back navigation: Return to list

### Wireframe: Delete Confirmation Dialog

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              ⚠️ Delete Route?                           │
│                                                         │
│         Are you sure you want to delete                 │
│         "Coastal Cruiser"?                              │
│                                                         │
│         This action cannot be undone.                   │
│                                                         │
│                                                         │
│         [Cancel]           [Delete Route]               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key Elements**:
- Warning: Clear visual indicator of destructive action
- Route name: Confirmation of which route will be deleted
- Undo warning: Explicit statement that action is permanent
- Actions: Cancel (safe) vs Delete (destructive, distinct styling)

**Acceptance Criteria**:
- ☐ Rider can tap a rename control in the route detail view to edit the route name inline
- ☐ System updates the route name across the list view and detail view immediately after the Rider confirms the rename
- ☐ Rider can tap a delete control in the route detail view to initiate route deletion
- ☐ System presents a confirmation dialog before permanently deleting the route
- ☐ Rider can confirm deletion and see the route removed from the Saved Routes list and returned to the list screen

---

## UC-SR-05: Save a favorite road segment

**Description**: While viewing a route on the map, the Rider can long-press on any road segment to mark it as a favorite. Favorite roads represent the roads the Rider loves most and form the personalization core of LaneShadow. Each favorite segment is named and stored for future use.

### Wireframe: Save Favorite Road Segment

```
┌─────────────────────────────────────────────────────────┐
│ ← Back              Coastal Cruiser              [⋮]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    [Interactive Map]                   │
│                  (Route Polyline Display)               │
│                                                         │
│          ━━━━━━━━━━━━━━━━━━━━━━━━                      │
│              ╱    ╲                                    │
│     ╱─── Segment selected ──╲                          │
│          ╲    ╱                                       │
│               ╲                                        │
│                                                         │
│         ┌─────────────────┐                            │
│         │ Save as Favorite│                            │
│         └─────────────────┘                            │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                ┌───────────────────────────┐            │
│                │   Save as Favorite Road   │            │
│                ├───────────────────────────┤            │
│                │                           │            │
│                │  📍 Selected Segment      │            │
│                │  US-64 West, 2.3 mi       │            │
│                │  [Mini Map Preview]       │            │
│                │                           │            │
│                │  Name this road:          │            │
│                │  ┌─────────────────────┐  │            │
│                │  │                     │  │            │
│                │  └─────────────────────┘  │            │
│                │                           │            │
│                │  💡 Tip: Give it a name  │            │
│                │     that reminds you why │            │
│                │     you love it!         │            │
│                │                           │            │
│                │  [Cancel]    [Save]       │            │
│                └───────────────────────────┘            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key Elements**:
- Long-press gesture: Triggers favorite selection on any segment
- Visual feedback: Segment highlights when selected
- Action sheet: Slides up with save options
- Mini map: Preview of selected segment
- Name input: Text field for custom naming
- Helper text: Guidance on naming
- Actions: Cancel and Save buttons

### Wireframe: Favorite Roads List (Settings)

```
┌─────────────────────────────────────────────────────────┐
│ ← Settings       Favorite Roads                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Your favorite roads are automatically included          │
│ when you enable "Include favorite roads" in             │
│ route planning.                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────┐   │
│ │ 🛤️ Sunset Climb                                 │   │
│ │ 📍 US-64 West, 2.3 mi                           │   │
│ │ Saved Oct 15, 2025                               │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│ │ [🗺️ View on Map]  [✏️ Rename]  [🗑️ Remove]    │   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
│ ┌───────────────────────────────────────────────────┐   │
│ │ 🌊 Ocean Drive                                   │   │
│ │ 📍 NC-12 South, 5.1 mi                          │   │
│ │ Saved Sep 28, 2025                               │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│ │ [🗺️ View on Map]  [✏️ Rename]  [🗑️ Remove]    │   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
│ ┌───────────────────────────────────────────────────┐   │
│ │ 🌲 Forest Loop                                   │   │
│ │ 📍 Blue Ridge Pkwy, 3.8 mi                       │   │
│ │ Saved Sep 15, 2025                               │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│ │ [🗆️ View on Map]  [✏️ Rename]  [🗑️ Remove]    │   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key Elements**:
- Header: Settings navigation with back button
- Explanation: Context about how favorites work
- Favorite cards: Name, location/road, date saved, mini map preview
- Quick actions: View on map, Rename, Remove
- Scrollable list: All saved favorite roads

**Acceptance Criteria**:
- ☐ Rider can long-press on a polyline segment in the route map view to trigger the "Save as Favorite" action sheet
- ☐ Rider can enter a name for the favorite road segment in the action sheet before saving
- ☐ System saves the road segment with its name, geographic coordinates, and a preview of the segment on a mini map
- ☐ Rider can view all saved favorite roads in a dedicated Favorite Roads section in Settings
- ☐ System confirms the save with a toast and shows the segment name

---

## UC-SR-06: Auto-include favorite roads in route planning

**Description**: When planning a new route, the Rider can enable an "Include my favorite roads" toggle that instructs the AI planning pipeline to bias route generation toward the Rider's saved favorite road segments. Routes that include a favorite segment show an indicator so the Rider knows their preferences were honored.

### Wireframe: Include Favorites in Planning

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│ ┌───────────────────────────────────────────────────┐   │
│ │ 🤖 Agent: I found 3 great routes...              │   │
│ │                                                 │   │
│ │ ┌───────────────────────────────────────────┐  │   │
│ │ │ ⭐ Best  🌤️ Clear                      │  │   │
│ │ │ Coastal Cruiser • 42 mi • 2h 15m         │  │   │
│ │ │ 💚 Includes your favorites!              │  │   │
│ │ └───────────────────────────────────────────┘  │   │
│ │                                                 │   │
│ │ ┌───────────────────────────────────────────┐  │   │
│ │ │ 🌧️ Light rain                            │  │   │
│ │ │ Mountain Loop • 38 mi • 2h 05m           │  │   │
│ │ └───────────────────────────────────────────┘  │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ [+ Session]  📍 Near Asheville, NC     [Manual]  [⚙️]  │
├─────────────────────────────────────────────────────────┤
│ ☑ Include my favorite roads (3)                        │
│ [Add more preferences...]                         [Send>]│
└─────────────────────────────────────────────────────────┘

───────────────────────────────────────────────────────────

Session Settings Panel:

┌─────────────────────────────────────────────────────────┐
│ Session Settings                              [Close ×]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Route Preferences:                                     │
│                                                         │
│ ☑ Include my favorite roads (3)                        │
│    🛤️ Sunset Climb, 🌊 Ocean Drive, 🌲 Forest Loop     │
│                                                         │
│ ☐ Avoid highways                                       │
│ ☐ Prefer scenic roads                                  │
│ ☐ Minimize elevation gain                              │
│                                                         │
│ Departure Time:                                        │
│ 🕐 Leaving now → [Change]                               │
│                                                         │
│ Favorite Roads:                                         │
│ 💚 Your favorites are included in this session         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key Elements**:
- Toggle: "Include my favorite roads" checkbox in chat input area
- Badge indicator: "Includes your favorites!" on route cards
- Session settings: Panel for managing preferences
- Favorite count: Shows how many favorites will be included
- Favorite list: Displays which roads are included
- Departure time: Integrated with session settings

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

### Wireframe: Re-Plan from Saved Route

```
┌─────────────────────────────────────────────────────────┐
│ ← Back              Coastal Cruiser              [⋮]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    [Interactive Map]                   │
│                  (Route Polyline Display)               │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ ⭐ Scenic: 9.2/10  |  🌤️ Clear  |  💨 8-12 mph        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📍 Asheville, NC → Wilmington, NC                      │
│ 📏 42 miles  |  ⏱️ 2h 15m  |  ↗️ 2,400 ft elevation    │
│ 📅 Saved: Oct 15, 2025  |  🛵 Ridden: Oct 18, 2025     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Actions:                                                │
│ [✏️ Rename]  [🔄 Re-Plan]  [🧭 Navigate]  [🗑️ Delete]  │
└─────────────────────────────────────────────────────────┘

                         ↓ [Tap Re-Plan]

┌─────────────────────────────────────────────────────────┐
│                                                         │
│ ┌───────────────────────────────────────────────────┐   │
│ │ 🔄 New Planning Session                          │   │
│ │                                                 │   │
│ │ Starting from: "Coastal Cruiser" (saved route)  │   │
│ │                                                 │   │
│ │ Original plan: 42 mi • 2h 15m • Asheville→Wilm │   │
│ │                                                 │   │
│ │ ┌─────────────────────────────────────────────┐ │   │
│ │ │ ⭐ Saved Route                             │ │   │
│ │ │ Coastal Cruiser • 42 mi • 2h 15m           │ │   │
│ │ │ Loaded from your saved routes              │ │   │
│ │ └─────────────────────────────────────────────┘ │   │
│ │                                                 │   │
│ │ How would you like to modify this route?        │   │
│ │                                                 │   │
│ │ 💡 Try:                                         │   │
│ │ "Same route but avoid the rain section"         │   │
│ │ "Add a stop at Big Sur"                         │   │
│ │ "Make it 10 miles shorter"                      │   │
│ │ "What if I leave at 3pm instead?"               │   │
│ │                                                 │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ [+ Session]  📍 Near Asheville, NC           [Manual]  │
├─────────────────────────────────────────────────────────┤
│ [Refine this route...]                            [Send>]│
└─────────────────────────────────────────────────────────┘
```

**Key Elements**:
- Re-plan button: Prominent action in route detail view
- Session header: Clear indication this is a new session
- Context loading: Shows which saved route is the starting point
- Original route card: Displayed as first attachment
- Suggested refinements: Quick-start prompts for common modifications
- Chat input: Pre-loaded with context, ready for refinement
- Original preserved: Saved route remains unchanged

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
