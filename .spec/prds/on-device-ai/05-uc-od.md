---
stability: FEATURE_SPEC
last_validated: 2026-04-06
prd_version: 1.0.0
functional_group: OD
---

# UC-OD: On-Device Intelligence

---

## UC-OD-01: Parse route planning intent from natural language

**Description**: The on-device LLM receives a text utterance (from voice transcription or typed input) and outputs a structured PlanInput JSON matching the V1 schema. This is the same task currently performed by the cloud pi core agent, but running locally.

**Acceptance Criteria**:
- ☐ System can parse a ride description into structured PlanInput JSON with start, end, preferences, and constraints
- ☐ System can extract duration ("2 hours"), distance ("50 miles"), style ("scenic", "coastal", "mountain"), and avoidances ("no freeway", "avoid tolls") from natural language
- ☐ System achieves >= 90% accuracy on a benchmark of 200 motorcycle ride descriptions
- ☐ System completes intent parsing within 800ms on iPhone 12 (CoreML) and within 1500ms on Snapdragon 8 Gen 1 (XNNPACK)
- ☐ System includes the rider's current GPS location as implicit start point when no start is specified
- ☐ System outputs a confidence score with the parsed intent for fallback decisions

---

## UC-OD-02: Parse refinement requests

**Description**: The Rider sends a follow-up that modifies the current route: "make it shorter", "avoid Highway 1", "add a stop at Big Sur". The on-device LLM interprets this in context of the active session and outputs a delta to the existing PlanInput.

**Acceptance Criteria**:
- ☐ System can parse preference changes ("avoid highways"), stop additions ("add a stop at Big Sur"), and constraint modifications ("make it shorter", "under 1 hour")
- ☐ System interprets refinements relative to the active route context (not from scratch)
- ☐ System outputs a delta JSON that can be merged with the existing PlanInput
- ☐ System maintains a 3-turn context window for conversational continuity (pre-ride only; mid-ride is single-command)

---

## UC-OD-03: Parse POI search queries

**Description**: The Rider asks for nearby points of interest. The LLM parses the request into a structured query that the Spatialite database can answer.

**Acceptance Criteria**:
- ☐ System can parse POI queries into structured JSON with category, radius, and scope (nearby / along route / ahead)
- ☐ System maps natural language categories to OSM tags: "gas" --> fuel, "food"/"lunch" --> restaurant|cafe, "viewpoint"/"scenic" --> viewpoint, "camping" --> camp_site
- ☐ System extracts distance constraints: "within 20 miles", "nearby" (default 10mi), "coming up" (ahead on route)
- ☐ System distinguishes between "near me" (radius from current position) and "along my route" (buffer around route geometry)

---

## UC-OD-04: Parse hazard reports

**Description**: The Rider reports a road hazard via voice. The LLM extracts the hazard type and associates it with the current GPS position.

**Acceptance Criteria**:
- ☐ System can parse hazard reports into {type, subtype, severity} from natural language
- ☐ System recognizes hazard types: gravel, pothole, debris, accident, flooding, construction, animal
- ☐ System infers severity from context: "bad pothole" = high, "some gravel" = low
- ☐ System automatically attaches current GPS coordinates and timestamp
- ☐ System handles terse input: "pothole" alone is a valid report (type=pothole, severity=medium, coords=current)

---

## UC-OD-05: Format database results into natural language

**Description**: After a local database query returns results, the on-device LLM formats them into a concise natural language response optimized for TTS delivery during a ride.

**Acceptance Criteria**:
- ☐ System formats POI results as: "{Name}, {distance} {direction}" (e.g., "Shell, 8 miles ahead on your right")
- ☐ System formats weather results as: "{Condition} for the next {distance/time}" (e.g., "Clear for the next 60 miles")
- ☐ System formats distance results as: "{Place}, {distance} ahead" (e.g., "Ojai, 12 miles ahead")
- ☐ System formats fuel range results as: "{Answer} — {detail}" (e.g., "Yes — 28 miles to Shell, you have 40 miles range")
- ☐ System generates responses within the word limits: 8 words for navigation, 15 words for information
- ☐ System completes response formatting within 500ms

---

## UC-OD-06: Generate route descriptions and names

**Description**: Given route metadata (distance, elevation, road types, POIs along route), the LLM generates a distinctive name and brief description. This is the same enrichRoute task from V1, but running locally.

**Acceptance Criteria**:
- ☐ System generates a distinctive route label from route characteristics (e.g., "Coastal Cruiser", "Mountain Loop", "Valley Run")
- ☐ System generates a 1-2 sentence route description highlighting notable features
- ☐ System does not repeat the route name in the description
- ☐ System stores the label and description with the route when saved

---

## UC-OD-07: Generate post-ride journal entry

**Description**: After a ride ends, the LLM generates a draft journal entry from the ride data: route taken, distance, duration, stops, POIs visited, hazards logged, and weather encountered.

**Acceptance Criteria**:
- ☐ System auto-generates a 2-4 sentence ride summary when a ride completes
- ☐ System incorporates: route name, distance, duration, notable POIs, hazards logged, weather conditions
- ☐ Rider can approve the draft with one tap, edit it, add a voice note, or discard it
- ☐ System appends voice note transcription to the AI draft when the Rider records one
- ☐ System stores the journal entry with the saved route
