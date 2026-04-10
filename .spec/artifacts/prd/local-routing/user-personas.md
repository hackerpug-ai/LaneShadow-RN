# User Personas - Complete Local Routing

**Version**: 1.0
**Status**: Draft
**Related PRD**: Main PRD v1.0
**Feature**: Mapbox Migration + Offline Routing

## Executive Summary

This document defines user personas for LaneShadow's Complete Local Routing feature. The personas are based on the core rider archetype from the V1 PRD, expanded with specific needs, pain points, and workflows related to offline map usage and route planning.

---

## Primary Persona: The Weekend Warrior

### Profile Summary

**Name**: Alex Chen
**Age**: 32
**Location**: San Francisco Bay Area
**Occupation**: Software Engineer
**Riding Experience**: 5 years, intermediate rider
**Bike**: 2022 BMW R 1250 GS (adventure touring)
**Riding Frequency**: 2-4 times per month, seasonal (Mar-Oct)

### Motivations

- **Escape the city**: Uses rides to decompress from work stress
- **Scenic discovery**: Prioritizes beautiful roads over fastest routes
- **Spontaneity**: Often decides to ride the morning-of or day-before
- **Social riding**: Occasionally rides with friends, wants to share good routes
- **Route experimentation**: Likes trying new roads, not just the same loop

### Technical Comfort

- **High**: Comfortable with apps, cloud services, and technology
- **Mobile-first**: Plans rides on phone, rarely uses desktop for this
- **Data-conscious**: Aware of data usage but has unlimited plan
- **Offline-aware**: Has experienced dead zones during rides (coastal mountains, Sierras)

### Pain Points (Current)

1. **Dead zone anxiety**: "I planned a route to Big Sur but had no signal half the time. Couldn't check if I was still on course or find alternatives when Highway 1 was closed."

2. **Last-minute plan changes**: "I drove 2 hours to the mountains and realized I forgot to download the route. Had to rely on paper notes I scribbled down."

3. **Re-planning friction**: "When I found a road closure, I had to drive to a signal spot, wait for Google Maps to load, and manually drag waypoints around the closure. Took 20 minutes."

4. **Data dependency**: "I love that LaneShadow finds scenic routes, but I'm hesitant to rely on it for remote areas. What if I'm in the Sierras and the app can't reach the server?"

5. **Storage management**: "I've downloaded offline maps in other apps but they take up huge space. I never know which regions I actually need until I'm already on the road."

### Needs for Offline Routing

1. **Pre-trip preparation**: "I want to download maps for my destination the night before, while I'm on WiFi. Don't make me think about which regions—I just say 'Lake Tahoe area' and it figures it out."

2. **Seamless fallback**: "If I lose signal, the app should keep working without me noticing. Routes I saved should still show, and I should be able to re-plan locally."

3. **Storage clarity**: "Show me exactly what's downloaded and how much space it uses. Let me delete old regions I won't visit again."

4. **Quality preservation**: "Offline routes shouldn't feel like a downgrade. I still want the AI's opinionated route suggestions, just calculated locally."

5. **Sync confidence**: "When I save a route at home, I need to know it'll be there when I'm 100 miles from cell service."

### User Journey: Planning a Remote Ride

**Scenario**: Alex wants to ride from SF to Lake Tahoe for the weekend, with a preference for scenic mountain roads.

**Current Flow (with pain)**:
1. Opens LaneShadow at home (Thursday evening)
2. Types "scenic ride to Tahoe, avoid highways, take the long way"
3. AI generates 3 route options with weather overlays
4. Selects the route through Gold Country (Highway 49)
5. **Pain point**: Worries about signal in the mountains—takes screenshots of the route
6. **Pain point**: Forgets to download offline maps from Google Maps
7. Saturday morning: rides to the mountains
8. **Pain point**: Hits a dead zone near Placerville—can't check route or weather
9. **Pain point**: Finds road construction—has to stop and wait for signal to re-route

**Ideal Flow (with Complete Local Routing)**:
1. Opens LaneShadow at home (Thursday evening)
2. Types "scenic ride to Tahoe, avoid highways, take the long way"
3. AI generates 3 route options with weather overlays
4. **New**: System prompts "Download maps for this route? (45MB)"
5. **New**: One-tap download—progress bar shows completion in background
6. **New**: "Route saved and ready for offline use. ✓"
7. Saturday morning: rides to the mountains
8. **New**: App automatically switches to offline mode—no interruption
9. **New**: Finds road construction—taps "Re-route locally" and gets alternative in 5 seconds
10. **New**: Continues ride with confidence, even with no signal

### Quote

> "I don't want to think about whether I have signal. I just want to get on the bike and know my app will handle the route, whether I'm in the city or the middle of nowhere."

---

## Secondary Persona: The Commuter-Turned-Explorer

### Profile Summary

**Name**: Jordan Martinez
**Age**: 28
**Location**: Los Angeles
**Occupation**: Teacher (summers off)
**Riding Experience**: 3 years, beginner-intermediate
**Bike**: 2021 Kawasaki Ninja 650 (sport)
**Riding Frequency**: Daily commute + weekend adventures in summer

### Motivations

- **Skill building**: Uses commuting to practice cornering and braking
- **Weekend adventures**: Summer = long rides to discover new areas
- **Budget-conscious**: Limited disposable income—optimizes for gas efficiency
- **Route variety**: Hates taking the same route twice, seeks novelty
- **Community**: Likes sharing routes on rider forums and social media

### Technical Comfort

- **Medium**: Comfortable with apps but not a power user
- **Budget-aware**: Has limited mobile data plan (2GB/month)
- **Offline-native: Used to offline navigation from Waze/Google Maps
- **Storage-constrained**: Phone has 32GB storage, always managing space

### Pain Points (Current)

1. **Data budget anxiety**: "I love LaneShadow but it burns through my data budget. I can't afford to plan routes every week if each one uses 50MB."

2. **Storage constraints**: "My phone is always full. If I download offline maps, I have to delete photos or apps. Make it worth the space."

3. **Discoverability friction**: "I want to explore new areas but I don't know which regions to download. I end up downloading the whole state and running out of space."

4. **Offline opacity**: "I downloaded maps once but couldn't tell if they were working. The app didn't show what was available offline versus what needed internet."

5. **Re-planning costs**: "When I changed my route mid-ride, it used more data to recalculate. Felt like I was being penalized for exploring."

### Needs for Offline Routing

1. **Data efficiency**: "Show me exactly how much data each operation uses. Let me pre-download everything on WiFi so I don't touch my mobile data."

2. **Smart storage**: "Don't make me guess which regions to download. Look at my saved routes and favorite roads, then suggest what I actually need."

3. **Transparency**: "Show me what's available offline with a clear indicator. A green dot on the map that says 'You're good here' would be perfect."

4. **Local re-planning**: "If I decide to extend my ride mid-day, let me re-route locally without going back to the server. Keep the data usage minimal."

5. **Cache value**: "If I download maps for one trip, make sure they're useful for future rides too. Don't make me re-download the same area next week."

### User Journey: Data-Conscious Multi-Day Trip

**Scenario**: Jordan is planning a 3-day weekend trip from LA to San Diego, with stops along the coast.

**Current Flow (with pain)**:
1. Opens LaneShadow on mobile data (Tuesday evening)
2. Plans route to San Diego—uses 30MB of data
3. **Pain point**: Checks data usage—already at 15% for the month
4. **Pain point**: Wants to plan alternative routes but hesitates due to data costs
5. **Pain point**: Doesn't download offline maps (unclear how, worries about space)
6. Thursday: departs on trip
7. **Pain point**: Each time she checks the app or re-routes, more data used
8. **Pain point**: Hits a dead zone in Malibu—app becomes unusable
9. **Pain point**: Has to switch to Google Maps (which has cached some data)

**Ideal Flow (with Complete Local Routing)**:
1. Opens LaneShadow on WiFi at home (Tuesday evening)
2. **New**: App suggests "Download maps for LA-San Diego corridor? Based on your saved routes."
3. **New**: Shows storage impact (80MB) and data saved (~200MB)
4. **New**: One-tap download—completes in background
5. Plans route to San Diego—uses 2MB of data (route geometry only)
6. **New**: "This route is fully available offline. ✓"
7. Plans 2 alternative routes—each uses <1MB (already have the maps)
8. **New**: Confidence that entire trip is covered
9. Thursday: departs on trip
10. **New**: App works seamlessly in Malibu dead zone
11. **New**: Decides to take detour to Joshua Tree—re-routes locally, no data used
12. **New**: Returns home with 95% of data budget remaining

### Quote

> "I want to explore without worrying about my data bill or storage space. Make the offline stuff invisible—just work when I need it, don't make me manage it like a file system."

---

## Tertiary Persona: The Route Curator

### Profile Summary

**Name**: Sam Rivera
**Age**: 45
**Location**: Portland, OR
**Occupation**: Civil Engineer
**Riding Experience**: 20 years, expert rider
**Bike**: 2020 Honda Africa Twin (adventure) + 2018 Ducati Multistrada (sport-touring)
**Riding Frequency**: Weekly year-round (rain or shine)

### Motivations

- **Route curation**: Maintains a personal library of 200+ favorite road segments
- **Route quality**: Obsesses over road surface, elevation profile, and corner quality
- **Trip planning**: Plans multi-day adventures with detailed itineraries
- **Community leadership**: Leads group rides, shares curated routes on forums
- **Technical optimization**: Wants the best tools and will configure them extensively

### Technical Comfort

- **Expert**: Former software developer, comfortable with advanced features
- **Power user**: Will read documentation, configure settings, automate workflows
- **Multi-device**: Uses phone for planning, tablet for trip review, desktop for deep research
- **Data hoarder**: Maintains personal GPX library, wants full control over data

### Pain Points (Current)

1. **Manual workflow fragmentation**: "I plan in LaneShadow, export to GPX, load into Calimoto for navigation, and screenshot weather from another app. It's ridiculous."

2. **No offline route library**: "I've saved 50 routes in LaneShadow but can't access them without internet. My GPX files on my phone are more reliable."

3. **Limited batch operations**: "I want to download maps for all my saved regions at once, not one-by-one. I have routes across 5 states."

4. **No advanced preferences**: "I want to set 'avoid gravel roads' as a global preference, not specify it every time. I want to weight curvature over distance."

5. **Data portability concerns**: "If LaneShadow shuts down or changes pricing, I lose my route library. Let me export everything."

### Needs for Offline Routing

1. **Batch operations**: "Let me select 10 routes and download all necessary maps in one batch. Show me total storage and time required."

2. **Persistent route library**: "My saved routes should be available offline, always. Sync when online, but never make me wait to access my library."

3. **Advanced preferences**: "Global routing defaults: avoid gravel, maximize curvature, prefer elevation gain. Save these per bike profile."

4. **Offline analytics**: "When I'm in the middle of nowhere, I still want to see elevation profiles, curvature scores, and surface quality. Don't strip features in offline mode."

5. **Export control**: "Let me batch-export my route library as GPX files. I want local backups and the ability to use other tools."

### User Journey: Multi-State Adventure Planning

**Scenario**: Sam is planning a 7-day Pacific Northwest tour covering WA, OR, and Northern CA.

**Current Flow (with pain)**:
1. Opens LaneShadow on desktop (research phase)
2. Plans 7 daily routes, saves each to library
3. **Pain point**: Can't batch-download maps—must use phone, one route at a time
4. **Pain point**: Unclear which regions are covered by the 7 routes
5. **Pain point**: Downloads overlap, wasting storage
6. **Pain point**: Has to manually export each route to GPX as backup
7. **Pain point**: No way to set global preferences—must specify "avoid gravel" for each of 7 routes
8. Trip begins: relies on patchwork of apps for navigation
9. **Pain point**: LaneShadow becomes unusable in remote areas of Olympic Peninsula
10. **Pain point**: Can't access saved routes or re-plan locally

**Ideal Flow (with Complete Local Routing)**:
1. Opens LaneShadow on desktop (research phase)
2. Plans 7 daily routes, saves each to library
3. **New**: "Download maps for all saved routes? (450MB, covers 3 states)"
4. **New**: Batch download with progress tracking and storage optimization (no overlaps)
5. **New**: All routes immediately available offline on all devices
6. **New**: Sets global preferences once—"Avoid gravel, maximize curvature" applies to all routes
7. **New**: Batch-export to GPX—"Your entire library is backed up locally"
8. Trip begins: LaneShadow is primary navigation tool
9. **New**: Works seamlessly in Olympic Peninsula dead zones
10. **New**: Decides to extend trip—re-plans locally using cached maps
11. **New**: Access to full route details (elevation, curvature, surface) even offline
12. **New**: Returns home, syncs new routes to cloud, exports GPX of entire trip

### Quote

> "I don't need hand-holding. I need power tools. Give me batch operations, global preferences, and full offline access to my entire route library. Don't make me babysit the app."

---

## Workflow Seeds for UI Design

### Seed 1: Smart Download Prompt

**Context**: User plans a route to a remote area

**UI Flow**:
1. User completes route planning
2. System detects route is outside downloaded areas
3. Modal appears: "Download maps for this route? (Estimated: 45MB)"
4. Storage indicator: "You have 2.3GB available"
5. Single-tap "Download" button
6. Progress bar in route attachment card
7. Success state: "Ready for offline use ✓"

**Acceptance Criteria**:
- Prompt only appears for routes >50 miles from downloaded areas
- Shows estimated storage before download
- Non-blocking—user can dismiss and download later
- Progress visible in multiple places (card, settings, notification)
- Download continues in background if user navigates away

### Seed 2: Offline Status Indicator

**Context**: User is viewing the map

**UI Flow**:
1. Top-right corner shows connectivity status
2. States:
   - **Green dot**: "Online—full features available"
   - **Yellow dot**: "Offline—cached routes only"
   - **Red dot**: "Offline—no maps for this region"
3. Tap indicator → expands to show:
   - Current connectivity status
   - Downloaded regions (list with storage)
   - "Download maps for current area" button
4. Yellow state → Show which features are limited:
   - "✓ Saved routes available"
   - "✓ Local re-routing available"
   - "✗ New route planning requires internet"

**Acceptance Criteria**:
- Status updates in real-time as connectivity changes
- Offline state is transparent, not hidden
- Clear indication of what works vs. what doesn't
- Quick path to resolve (download maps)

### Seed 3: Storage Management

**Context**: User is managing offline maps

**UI Flow**:
1. Settings → "Offline Maps"
2. Shows:
   - Total storage used: "245 MB"
   - List of downloaded regions:
     - "San Francisco Bay Area" (80 MB) — Last used: 2 days ago
     - "Lake Tahoe Area" (65 MB) — Last used: 3 weeks ago
     - "Los Angeles Metro" (100 MB) — Last used: 2 months ago
3. Swipe left on region → actions:
   - "Delete" (immediate, with undo toast)
   - "Update" (if newer data available)
4. "Smart Storage" toggle:
   - On: Automatically delete regions not used in 60 days
   - Off: Keep all downloaded regions
5. "Download All for Saved Routes" button
   - Shows estimated storage
   - Batch download with progress

**Acceptance Criteria**:
- Clear storage usage breakdown
- Easy deletion with undo (prevent accidents)
- Smart storage option for set-and-forget
- Batch operations for power users
- Last-used dates inform decisions

### Seed 4: Local Re-Planning

**Context**: User is offline, needs to re-route

**UI Flow**:
1. User is viewing saved route (offline)
2. Taps "Re-route" button
3. Sheet appears: "Re-route locally or wait for connection?"
4. Options:
   - "Re-route locally (fast, cached maps)"
   - "Wait for connection (full features, weather)"
5. User selects "Re-route locally"
6. Loading indicator: "Calculating alternative route..."
7. New route appears in 5-10 seconds
8. Badge on route: "Offline route—cached maps only"

**Acceptance Criteria**:
- Clear distinction between local vs. cloud routing
- Fast local calculation (<10 seconds)
- Visual indicator that route is offline-optimized
- Option to re-calculate with cloud when connection returns
- Graceful degradation—features removed, not broken

### Seed 5: Batch Operations

**Context**: Power user managing multiple routes

**UI Flow**:
1. Saved Routes screen
2. "Select" button (top-right)
3. User selects 5 routes
4. Bottom sheet appears:
   - "Download maps for 5 routes (230 MB)"
   - "Download" button
5. Download starts with progress:
   - "Downloading 3 of 5 regions..."
   - Overall progress bar
   - Individual route progress
6. Completion: "5 routes ready for offline use ✓"
7. Additional options:
   - "Export selected to GPX"
   - "Delete selected routes"
   - "Add all to favorites"

**Acceptance Criteria**:
- Multi-select for bulk operations
- Combined storage estimation
- Parallel downloads with progress tracking
- Multiple bulk operations available
- Undo available for destructive actions

---

## Success Metrics by Persona

### Weekend Warrior (Alex)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Offline pack adoption | >60% | Users who download maps for remote routes |
| Dead zone anxiety reduction | >80% | Survey: "I feel confident riding in areas with no signal" |
| Local re-plan usage | >30% | Offline re-calculations / total route views |
| Storage satisfaction | >75% | Survey: "Offline maps don't take up too much space" |

### Commuter-Explorer (Jordan)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Data savings | >200MB/month | Average data reduction per active user |
| Pre-trip download rate | >70% | Users who download on WiFi before trips |
| Storage optimization | >50% | Reduction in redundant map downloads |
| Transparency satisfaction | >80% | Survey: "I always know what's available offline" |

### Route Curator (Sam)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Batch operation usage | >40% | Power users who use multi-select |
| Offline route library access | >90% | Saved routes accessible offline |
| Export feature usage | >60% | Users who export routes to GPX |
| Advanced preference adoption | >50% | Users who set global routing defaults |

---

## Anti-Personas (Not Our Target)

### The Turn-by-Turn Navigator

**Who**: Riders who want real-time GPS navigation with voice prompts

**Why not**: LaneShadow is for route planning, not navigation. Export to Google Maps/Waze is the V1 solution.

### The Social Rider

**Who**: Riders who want to share location, track friends, and group ride coordination

**Why not**: Social features are V2+. Focus on individual route planning.

### The Data-Phobic

**Who**: Riders uncomfortable with apps, subscriptions, or data usage

**Why not**: LaneShadow requires comfort with technology. Offline features reduce but don't eliminate data needs.

### The Commuter

**Who**: Daily riders who want fastest route, traffic avoidance, and ETA optimization

**Why not**: LaneShadow focuses on scenic rides, not commuting. Use Google Maps/Waze for that.

---

## Research Gaps & Questions

1. **Storage tolerance**: What's the maximum storage users will allocate to offline maps? (Survey needed)

2. **Download behavior**: Do users prefer downloading per-route or by-region? (User testing needed)

3. **Offline expectations**: What features are "must-have" vs. "nice-to-have" in offline mode? (Interviews needed)

4. **Provider preference**: Do users care which routing provider (Google vs. Mapbox) calculates their routes? (A/B testing needed)

5. **Update frequency**: How often do users expect offline maps to update? (Survey needed)

---

## Next Steps

1. **Validate personas**: Conduct 5-8 user interviews with current LaneShadow users
2. **Prototype workflows**: Build clickable prototypes for key offline flows
3. **User test download flow**: Observe how users approach map downloads
4. **Measure storage behavior**: Track current offline map usage in similar apps
5. **Refine based on feedback**: Update personas with real user data
