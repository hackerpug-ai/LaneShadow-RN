---
stability: FEATURE_SPEC
last_validated: 2026-04-03
prd_version: 1.4.0
---

# UC-NLP: Conversational Planning

---

## UC-NLP-01: Start a planning conversation

**Description**: The Rider opens the app and sees the map with a chat input bar at the bottom. The chat input is always visible — it is the primary entry point for planning. The Rider types a plain-English ride description and sends it. This creates a new planning session (or continues the active one) and begins route generation.

**Acceptance Criteria**:
- ☐ Rider can see a chat input bar at the bottom of the map screen at all times (not hidden behind a tap or in a sheet)
- ☐ Rider can type a free-form ride description up to 500 characters in the chat input
- ☐ Rider can see suggestion chips above the input bar when no session is active (e.g., "2-hour loop", "scenic coastal", "avoid highways") to accelerate input
- ☐ Rider can tap the send button to submit the message and begin route generation
- ☐ Sending the first message in a new session creates the session automatically
- ☐ Chat input shows the Rider's current resolved location as placeholder context (e.g., "Near Asheville, NC")

---

## UC-NLP-02: Generate 2–3 alternative scenic routes as chat attachments

**Description**: After the Rider sends a planning message, the AI authors a route sketch using its knowledge of road networks — picking specific roads, highways, and landmarks — then validates each segment independently against Google Maps. Failed segments get specific feedback and surgical revision. The result: 2–3 distinct route alternatives that feel locally curated. The routes appear as attachments in the AI's chat response message AND as polylines on the map simultaneously.

**Acceptance Criteria**:
- ☐ System generates between 2 and 3 route alternatives from a valid planning message
- ☐ Routes appear as attachment cards embedded in the AI's response message in the chat thread
- ☐ All route alternatives render as distinct polylines on the map at the same time
- ☐ System displays inline planning progress indicators in the chat ("Reading your ride...", "Finding scenic roads...", "Checking weather...", "Building options...") while generating routes
- ☐ System completes route generation and displays results within 12 seconds for a valid description
- ☐ System responds conversationally with a fallback message if route generation fails or returns fewer than 2 results (see UC-NLP-11)

---

## UC-NLP-03: View and select route attachments

**Description**: Route alternatives appear as compact attachment cards within the AI's chat message. The map is the primary comparison surface — the Rider compares routes visually on the map. Tapping a route attachment card highlights that route's polyline on the map.

**Acceptance Criteria**:
- ☐ Rider can see each route alternative as an attachment card in the AI's chat response showing: route label, scenic score, distance, estimated ride duration, and weather summary badge
- ☐ System highlights the highest-ranked route as the default selection when results first appear
- ☐ Rider can tap any route attachment card to bring that route's polyline into focus on the map
- ☐ System sorts route alternatives by combined scenic + conditions score by default
- ☐ Route attachment cards are visible in the temporary message overlay and in the expanded chat history

---

## UC-NLP-04: Conditions-aware route ranking ("Best for today")

**Description**: The System evaluates each route alternative against current and forecast weather conditions and surfaces a ranked recommendation. The top-ranked route receives a "Best for today" badge on its attachment card — giving the Rider one clear answer when they don't want to compare manually.

**Acceptance Criteria**:
- ☐ System displays a "Best for today" badge on the route attachment card with the highest combined scenic and conditions score
- ☐ Rider can tap the "Best for today" badge to see a brief explanation of why the route was ranked first
- ☐ System factors rain probability, wind speed, and temperature comfort into the conditions score for each route
- ☐ System updates the ranking if the Rider changes the planned departure time via chat message (see UC-WX-06) and re-ranks routes accordingly
- ☐ Rider can see a numeric conditions score on each route attachment card

---

## UC-NLP-05: Switch to manual planning mode

**Description**: Some Riders prefer the traditional pin-drop workflow. The Rider can switch to manual planning mode via an action in the chat input bar without losing the context they have already provided.

**Acceptance Criteria**:
- ☐ Rider can tap a manual mode icon/action in the chat input bar to open the existing manual planning sheet
- ☐ System carries over routing preferences (e.g., avoid highways, prefer scenic roads) captured from the chat conversation into the manual planning sheet
- ☐ Rider can return to chat input from the manual planning sheet without losing their session history

---

## UC-NLP-06: AI-generated route descriptions and labels

**Description**: Each route alternative is given a distinctive name and a brief description generated by the AI based on the route's characteristics. These appear naturally in the AI's chat response message and on route attachment cards. Descriptions make routes feel curated rather than algorithmic.

**Acceptance Criteria**:
- ☐ System generates a distinct label (e.g., "Coastal Cruiser", "Mountain Loop") for each route alternative
- ☐ AI's chat response message includes descriptive text about the route options, highlighting notable features
- ☐ Rider can see the route label on the route attachment card
- ☐ System stores the AI-generated label and description with the route when the Rider saves it

---

## UC-NLP-07: Refine routes through follow-up messages

**Description**: The Rider sends a follow-up message in the same session to modify the current route set. Examples: "make it shorter", "avoid Highway 1", "add a stop at Big Sur", "what about going through the mountains instead?" The AI revises only the affected segments of the route sketch, keeping unchanged segments intact. "Avoid Highway 1" means the AI re-sketches just the coastal segment using an alternative road.

**Acceptance Criteria**:
- ☐ Rider can send a follow-up message after receiving route results without leaving the map view
- ☐ System interprets the message in context of the current session and active routes (e.g., "make it shorter" refers to the currently displayed routes)
- ☐ AI revises only the affected segments, keeping unchanged segments intact
- ☐ "Avoid X" constraints work by the AI routing around X in its sketch — no API flags needed
- ☐ System generates updated route alternatives that reflect the refinement request
- ☐ Previous route attachments remain visible in the chat history (scroll up in expanded view)
- ☐ New route attachments replace the active routes on the map
- ☐ System responds within 15 seconds for refinement requests
- ☐ System can handle preference changes ("avoid highways"), stop additions ("add a stop at Big Sur"), and constraint modifications ("make it shorter", "under 1 hour") as refinement types

---

## UC-NLP-08: View temporary AI message overlay on map

**Description**: When the AI responds, the message appears as a temporary overlay card on the map. The overlay is positioned to NOT block the route polylines or directions area — typically top-left or top area. After a few seconds or on rider interaction, the overlay minimizes. Full history is always available by expanding the chat.

**Acceptance Criteria**:
- ☐ AI response messages appear as overlay cards on the map, positioned at top-left or top area (not centered, not blocking route polylines)
- ☐ Overlay messages auto-dismiss after 5 seconds OR when the Rider taps the map
- ☐ Rider can tap the overlay to keep it visible (pin it)
- ☐ Rider can swipe the overlay to dismiss it immediately
- ☐ Route attachment cards are visible within the overlay (compact format)
- ☐ All messages are always accessible in the expanded chat view regardless of overlay dismissal

---

## UC-NLP-09: Manage chat sessions

**Description**: The Rider can start a new planning session, browse session history, and resume a previous session. Sessions work like ChatGPT threads — each session is an independent conversation about a ride plan.

**Acceptance Criteria**:
- ☐ Rider can tap a "New Session" button (top-right of map screen) to start a fresh planning conversation
- ☐ Starting a new session clears the map of previous route polylines and resets the chat input
- ☐ Rider can access session history via a slide-out sidebar (left swipe or hamburger menu button)
- ☐ Session sidebar shows each session's auto-generated title (from first message), date, and route count
- ☐ Rider can tap a session in the sidebar to resume it, restoring its routes on the map and chat history
- ☐ Sessions persist across app launches
- ☐ The most recent active session loads automatically when the app opens

---

## UC-NLP-10: Expand chat to full message history

**Description**: The Rider can expand the chat overlay into a full scrollable view showing the complete message history with all route attachments inline. This is how the Rider reviews the full conversation — including earlier route options, refinement messages, and system responses.

**Acceptance Criteria**:
- ☐ Rider can tap an expand affordance on the chat input area or overlay to open the full chat view
- ☐ Full chat view shows all messages in chronological order with rider messages and system responses visually distinct
- ☐ Route attachment cards appear inline within system messages and are tappable to highlight on the map
- ☐ Rider can collapse back to the minimal map-primary view
- ☐ Chat input remains accessible in both minimal and expanded views
- ☐ Expanded chat view does not fully obscure the map — the map remains partially visible or the view is dismissible

---

## UC-NLP-11: Error recovery in conversation

**Description**: When the AI encounters errors — low NLP confidence, route generation failure, weather API outage, or network timeout — it responds conversationally with helpful guidance rather than showing a modal error dialog. The Rider can simply send another message to retry.

**Acceptance Criteria**:
- ☐ System responds with a helpful message when NLP confidence is low (e.g., "I need a bit more detail — where are you starting from?")
- ☐ System responds with a retry suggestion when route generation fails (e.g., "I couldn't find routes matching that. Try being more specific about your start or end point.")
- ☐ System responds with a degradation notice when weather is unavailable (e.g., "Weather data isn't available right now — routes are ranked by scenicness only.")
- ☐ System responds with a connectivity message on network failure (e.g., "I'm having trouble connecting. Check your signal and try again.")
- ☐ System never shows raw error codes or modal error dialogs in the chat flow
- ☐ Rider can send another message to retry after any error — no special "retry" button needed
