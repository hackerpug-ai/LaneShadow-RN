# Wireframes Added to LaneShadow V1 PRD

## Overview
ASCII wireframes have been added to all UI-focused use cases in the LaneShadow V1 PRD to provide visual guidance for the implementation team.

## Wireframes by Use Case

### UC-AG: Agentic Conversational Planning (04-uc-agentic.md)

1. **Chat Input Bar** (UC-AG-01)
   - Shows always-visible chat input with suggestion chips
   - Location context display and session controls
   - Map background with route overlays

2. **Route Attachment Cards** (UC-AG-02)
   - Agent response with embedded route cards
   - Weather badges, scenic scores, distances
   - Multiple route alternatives in compact format

3. **AI Message Overlay** (UC-AG-08)
   - Temporary overlay card on map
   - Route cards with tappable polylines
   - Dismiss controls and auto-dismiss behavior

4. **Session Sidebar** (UC-AG-09)
   - Slide-out sidebar showing all sessions
   - Session cards with titles, dates, status
   - New session button and resume functionality

5. **Full Chat History View** (UC-AG-10)
   - Expanded panel with scrollable message history
   - Rider/Agent message bubbles
   - Inline route attachments
   - Map background partially visible

### UC-WX: Weather & Conditions (05-uc-wx.md)

1. **Weather Badges on Route Cards** (UC-WX-04)
   - Compact weather badges on route comparison cards
   - Icons for clear, rain, wind conditions
   - Color-coded severity indicators

2. **Weather Overlay Controls** (UC-WX-01)
   - Toggle panel for wind, rain, temperature overlays
   - Color legend for wind speed bands
   - Active state indicators
   - Route segment coloring visualization

3. **Weather Timeline Panel** (UC-WX-05)
   - Expandable panel with hourly breakdown
   - Temperature, wind, rain probability per hour
   - Worst condition highlighting
   - Peak conditions summary

4. **Departure Time Adjustment** (UC-WX-06)
   - Chat interface showing time change request
   - Re-ranked routes with updated "Best for [time]" badges
   - Weather warnings for problematic conditions
   - Departure time indicator in header

### UC-SR: Saved Routes & Favorites (06-uc-sr.md)

1. **Saved Routes List** (UC-SR-02)
   - Scrollable list of route cards
   - Search and filter controls
   - Route cards with thumbnails, ratings, status badges
   - Empty state with CTA

2. **Route Detail View** (UC-SR-04)
   - Full-width interactive map
   - Route information summary
   - Rating control and notes section
   - Action buttons (Rename, Re-Plan, Navigate, Delete)

3. **Delete Confirmation Dialog** (UC-SR-04)
   - Warning dialog with route name
   - Cancel and Delete actions
   - Clear destructive action indication

4. **Save Favorite Road Segment** (UC-SR-05)
   - Long-press gesture on map segment
   - Action sheet with mini map preview
   - Name input field for custom naming

5. **Favorite Roads List** (UC-SR-05)
   - Settings screen with all favorite roads
   - Road cards with names, locations, dates
   - View, rename, remove actions

6. **Include Favorites in Planning** (UC-SR-06)
   - Toggle control in chat input area
   - "Includes your favorites!" badge on route cards
   - Session settings panel with preferences
   - Favorite count and list display

7. **Re-Plan from Saved Route** (UC-SR-08)
   - Route detail view with Re-Plan button
   - New planning session with saved route context
   - Suggested refinement prompts
   - Original route preserved

## Design Principles

All wireframes follow these principles:

1. **Clarity**: Simple ASCII art that's easy to understand
2. **Consistency**: Uniform styling across all wireframes
3. **Key Elements**: Each wireframe includes a description of critical components
4. **Layout**: Shows header, content, footer structure
5. **Interactivity**: Indicates tappable elements and navigation flows
6. **Context**: Shows how screens relate to each other

## Implementation Guidance

Wireframes provide:
- Screen layout structure
- Component placement
- Navigation element locations
- Key interactive elements
- Visual hierarchy

Wireframes do NOT dictate:
- Exact colors (use design tokens)
- Precise spacing (use spacing scale)
- Final typography (use type scale)
- Animation details (handled by skill)

## Next Steps

Implementation team should:
1. Review wireframes alongside acceptance criteria
2. Identify reusable components across wireframes
3. Map wireframes to actual component implementations
4. Use design tokens for colors, spacing, typography
5. Follow React development patterns in REACT-RULES.md
