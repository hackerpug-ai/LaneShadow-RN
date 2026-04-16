# UC-09: Turn-by-Turn Navigation Use Cases

**Parity Goal**: Replace Expo Location + React Native hooks with native Mapbox Navigation SDK (Android/iOS)

**Current State**: React Native app exports routes to external navigation apps (UC-NAV-EXPORT state in useRideFlow.ts)

**Target State**: Native turn-by-turn navigation with voice guidance, background tracking, and real-time metrics

---

## UC-NAV-01: Start Navigation

**Description**: User initiates turn-by-turn navigation for a selected route. The system verifies GPS accuracy, launches foreground navigation service, and displays the map view with voice instructions enabled.

**Preconditions**:
- User has selected a route (from ROUTE_DETAILS state)
- Route geometry is cached locally (from Convex route plan)
- Location permissions are granted

**Main Flow**:
1. User taps "Start Navigation" on route details screen
2. System verifies GPS lock (accuracy < 10m required)
3. System launches foreground service (Android) or background location task (iOS)
4. Mapbox Navigation SDK initializes with route geometry
5. Navigation screen displays with:
   - Map view centered on user location
   - Route overlay with upcoming turns
   - Distance to destination
   - Estimated time of arrival
6. First voice instruction plays (e.g., "Head north on Main Street")
7. Navigation session ID recorded in local database

**Acceptance Criteria - Android**:

```gherkin
Given user has selected a route with valid geometry
When user taps "Start Navigation"
And GPS accuracy is < 10m
Then MapboxNavigationLauncher is launched with route coordinates
And ForegroundService is created with notification showing "Navigating to [destination]"
And FusedLocationProviderClient is set to PRIORITY_HIGH_ACCURACY
And navigation screen displays map with route overlay
And first voice instruction plays via TextToSpeech
And navigation session is saved to Room database with status="ACTIVE"
```

```gherkin
Given user has selected a route
When user taps "Start Navigation"
And GPS accuracy is > 10m or no GPS lock
Then system displays "Acquiring GPS signal..." loading state
And retries GPS verification every 2 seconds for up to 30 seconds
And after 30s without lock, shows error with "Retry" and "Cancel" options
```

**Acceptance Criteria - iOS**:

```gherkin
Given user has selected a route with valid geometry
When user taps "Start Navigation"
And CLLocationManager has accuracy < 10m
Then NavigationViewController is presented with route coordinates
And "location" background mode is activated via Info.plist
And AVSpeechSynthesizer is configured for voice instructions
And navigation screen displays map with route overlay
And first voice instruction plays
And navigation session is saved to SwiftData with status="ACTIVE"
```

**Technical Notes**:
- Android: Use `MapboxNavigationLauncher` from `com.mapbox.navigation:android:2.x`
- iOS: Use `NavigationViewController` from `MapboxNavigation` framework
- Route geometry from `route.map.overviewGeometry.value` (useActiveSessionRoute hook)
- Foreground service notification ID: `laneshadow://navigation/active`

---

## UC-NAV-02: Follow Route with Voice Instructions

**Description**: System provides voice and visual guidance at key waypoints (500m and 100m before turns, plus complex maneuvers). User can mute/unmute voice instructions.

**Preconditions**:
- Navigation is active (UC-NAV-01 completed)
- GPS lock maintained
- Route progress > 0%

**Main Flow**:
1. Mapbox SDK detects upcoming instruction based on route coordinates
2. At 500m before turn: System announces "In 500 meters, turn left onto Oak Street"
3. Turn card displays on screen with maneuver icon and street name
4. At 100m before turn: System announces "Turn left onto Oak Street"
5. User taps mute icon: Voice instructions are disabled
6. User taps unmute icon: Voice instructions resume
7. For complex maneuvers (highway exits, roundabouts): Enhanced instructions with lane guidance

**Acceptance Criteria - Android**:

```gherkin
Given navigation is active
When MapboxNavigationSDK triggers instruction milestone at 500m
Then TextToSpeech speaks announcement with distance and street name
And turn card displays on screen with maneuver icon (left/right/u-turn)
And distance countdown updates every 100m
```

```gherkin
Given navigation is active
When user taps mute button
Then TextToSpeech is silenced
And mute icon changes to unmute
And subsequent instruction milestones are suppressed (no audio)
And visual turn cards still display
```

```gherkin
Given navigation is active and voice is muted
When user taps unmute button
Then TextToSpeech is resumed
And next instruction milestone plays audio
```

```gherkin
Given navigation approaches complex maneuver (highway exit, roundabout)
When instruction milestone is triggered
Then enhanced announcement plays with lane guidance
Example: "Take the exit on the right toward Downtown, stay in right lane"
And turn card displays lane guidance visual
```

**Acceptance Criteria - iOS**:

```gherkin
Given navigation is active
When MapboxNavigationSDK triggers instruction milestone at 500m
Then AVSpeechSynthesizer speaks announcement with distance and street name
And turn card displays on screen with maneuver icon
And distance countdown updates in real-time
```

```gherkin
Given navigation is active
When user taps mute button
Then AVSpeechSynthesizer is paused
And subsequent instructions are suppressed
And visual turn cards continue to display
```

**Technical Notes**:
- Android: `VoiceInstructionsPlayer` from Mapbox Navigation SDK
- iOS: `AVSpeechSynthesizer` with `AVSpeechUtterance`
- Milestone distances: 500m (advance notice), 100m (immediate)
- Complex maneuvers: Detect via `Instruction.highComplexity` flag in route data

---

## UC-NAV-03: Route Deviation Detection

**Description**: System detects when user deviates from route (distance > 50m from route line) and triggers rerouting. Rerouting uses cached route geometry or fetches new route from Convex if offline.

**Preconditions**:
- Navigation is active
- GPS lock maintained
- User has not reached destination

**Main Flow**:
1. User's GPS position diverges from route line
2. Mapbox SDK detects deviation when distance > 50m for 5+ seconds
3. System announces "You've left the route. Recalculating..."
4. Rerouting request initiated:
   - If online: Fetch new route from Convex with current location + destination
   - If offline: Use Mapbox offline routing with cached tiles
5. New route calculated and displayed
6. System announces "Route updated. Continue for X miles"
7. Navigation resumes with new route

**Acceptance Criteria - Android**:

```gherkin
Given navigation is active
When user's position is > 50m from route line for 5+ seconds
Then MapboxNavigationSDK triggers offRoute event
And TextToSpeech announces "You've left the route. Recalculating..."
And rerouting request is sent to Convex API
Or if offline, MapboxOfflineRouter calculates new route
```

```gherkin
Given rerouting is in progress
When new route is calculated successfully
Then navigation resumes with new route
And TextToSpeech announces "Route updated. Continue for [distance] miles"
And map displays updated route overlay
And remaining distance and ETA are recalculated
```

```gherkin
Given rerouting is in progress
When rerouting fails (network error, timeout, no valid route)
Then error dialog displays: "Unable to recalculate route. Continue to original route or end navigation?"
And user can tap "Continue" (ignore deviation) or "End Navigation"
And if "Continue" is selected, system resumes tracking original route
And if "End Navigation" is selected, navigation session is closed
```

**Acceptance Criteria - iOS**:

```gherkin
Given navigation is active
When user's position is > 50m from route line for 5+ seconds
Then MapboxNavigationSDK enters rerouting state
And AVSpeechSynthesizer announces "You've left the route. Recalculating..."
And rerouting request is sent to Convex API
Or if offline, offline routing calculates new path
```

**Technical Notes**:
- Deviation threshold: 50m (configurable via `NavigationOptions.offRouteThreshold`)
- Rerouting timeout: 10 seconds
- Offline fallback: Mapbox offline tiles must be pre-downloaded for route region
- Convex API: `api.db.routePlans.calculateRoute` with current GPS coordinates

---

## UC-NAV-04: Real-Time Metrics

**Description**: Navigation screen displays real-time metrics: speedometer, distance remaining, ETA, and curvature score (if route includes curvature data). Metrics update every 1 second.

**Preconditions**:
- Navigation is active
- GPS lock maintained with accuracy < 20m

**Main Flow**:
1. System calculates current speed from GPS coordinates
2. Distance remaining updated from route progress
3. ETA recalculated based on current speed and remaining distance
4. Curvature score displayed if route has curvature data (from Convex)
5. Metrics update every 1 second via location callback
6. Speedometer color-codes: green (< speed limit), yellow (within 5mph of limit), red (> speed limit)

**Acceptance Criteria - Android**:

```gherkin
Given navigation is active
When GPS location updates (every 1 second)
Then speedometer displays current speed in mph
And distance remaining displays in miles (e.g., "3.2 miles remaining")
And ETA displays time (e.g., "Arrive at 10:45 AM")
And curvature score displays if available (e.g., "Curvature: 7.2/10")
And all metrics update within 100ms of GPS callback
```

```gherkin
Given navigation is active and speed limit data is available
When current speed is < speed limit
Then speedometer displays in green color
When current speed is within 5mph of speed limit
Then speedometer displays in yellow color
When current speed exceeds speed limit
Then speedometer displays in red color
```

**Acceptance Criteria - iOS**:

```gherkin
Given navigation is active
When CLLocationManager updates location (every 1 second)
Then speedometer displays current speed in mph
And distance remaining displays in miles
And ETA displays arrival time
And curvature score displays if available
And all metrics update in real-time
```

**Technical Notes**:
- Speed calculation: `location.speed` (m/s) converted to mph
- ETA calculation: `remainingDistance / currentSpeed` with 5min rolling average
- Curvature data: From `route.curvatureScore` field in Convex route plan
- Speed limit data: From Mapbox Navigation SDK `speedLimit` property

---

## UC-NAV-05: Pause/Resume Navigation

**Description**: User pauses navigation (e.g., for a stop) and resumes later. GPS tracking continues in background but voice instructions are muted.

**Preconditions**:
- Navigation is active

**Main Flow**:
1. User taps "Pause" button on navigation screen
2. Voice instructions are muted
3. Map view remains visible with current location
4. Route overlay dims to indicate paused state
5. User taps "Resume" button
6. Voice instructions unmuted
7. Navigation resumes from current location
8. System announces "Resuming navigation. Continue for X miles"

**Acceptance Criteria - Android**:

```gherkin
Given navigation is active
When user taps "Pause" button
Then TextToSpeech is muted
And route overlay on map is dimmed (alpha reduced to 0.3)
And pause button changes to "Resume"
And foreground service notification shows "Navigation paused"
And GPS tracking continues in background
```

```gherkin
Given navigation is paused
When user taps "Resume" button
Then TextToSpeech is unmuted
And route overlay returns to full opacity
And TextToSpeech announces "Resuming navigation. Continue for [distance] miles"
And foreground service notification shows "Navigating to [destination]"
```

**Acceptance Criteria - iOS**:

```gherkin
Given navigation is active
When user taps "Pause" button
Then AVSpeechSynthesizer is paused
And route overlay is dimmed
And pause button changes to "Resume"
And GPS tracking continues in background
```

**Technical Notes**:
- Pause state: Stored in Room/SwiftData as `navigationSession.status = "PAUSED"`
- GPS continues during pause to track location for resume
- Voice instructions: Suppressed via `isMuted` flag
- Map dimming: Reduce overlay layer opacity to 0.3

---

## UC-NAV-06: End Navigation

**Description**: User ends navigation (either by tapping "End" or reaching destination). System saves ride data, uploads to Convex, and displays completion screen.

**Preconditions**:
- Navigation is active or paused

**Main Flow**:
1. User taps "End Navigation" OR arrives at destination
2. Foreground service is terminated (Android) or background task ends (iOS)
3. Ride data is compiled:
   - Start/end timestamps
   - Total distance
   - Duration
   - Average speed
   - GPS trace (polyline)
   - Deviation events
4. Ride is saved to local database (Room/SwiftData)
5. Upload to Convex is queued via WorkManager (Android) or BGTaskScheduler (iOS)
6. Completion screen displays:
   - Total distance
   - Duration
   - Average speed
   - Curvature score (if available)
   - "Save Ride" and "Discard" buttons
7. User taps "Save": Ride is permanently stored and marked for upload
8. User taps "Discard": Ride is deleted from local database

**Acceptance Criteria - Android**:

```gherkin
Given navigation is active
When user taps "End Navigation" button
Or user arrives within 20m of destination
Then MapboxNavigationSDK is stopped via stopNavigation()
And ForegroundService is removed via stopForegroundService()
And ride data is compiled from session
And ride is saved to Room database with status="COMPLETED"
And WorkManager enqueues one-time work to upload ride to Convex
And completion screen displays with metrics
```

```gherkin
Given completion screen is displayed
When user taps "Save Ride" button
Then ride status in Room database is updated to "SAVED"
And upload to Convex is prioritized in WorkManager queue
And user is navigated to ride history screen
```

```gherkin
Given completion screen is displayed
When user taps "Discard" button
Then ride is deleted from Room database
And WorkManager upload task is cancelled
And user is navigated to home screen
```

**Acceptance Criteria - iOS**:

```gherkin
Given navigation is active
When user taps "End Navigation" button
Or user arrives within 20m of destination
Then MapboxNavigationSDK is stopped
And background location task is cancelled
And ride data is compiled from session
And ride is saved to SwiftData with status="COMPLETED"
And BGTaskScheduler submits upload task
And completion screen displays with metrics
```

**Technical Notes**:
- Arrival threshold: 20m from destination coordinate
- Ride data schema: Matches Convex `rides` table schema
- Upload API: `api.db.rides.create` with ride payload
- WorkManager constraints: `NetworkType.CONNECTED`, `BatteryNotLow`

---

## UC-NAV-07: Background Navigation

**Description**: Navigation continues when app is backgrounded or device is locked. Foreground service (Android) or background location task (iOS) maintains GPS tracking and voice instructions.

**Preconditions**:
- Navigation is active
- User backgrounds app or locks device

**Main Flow**:
1. User backgrounds app or locks device
2. Foreground service (Android) or background task (iOS) continues GPS tracking
3. Voice instructions continue to play
4. Location updates are processed every 1 second
5. Deviation detection continues in background
6. When user returns to app, navigation screen displays current state

**Acceptance Criteria - Android**:

```gherkin
Given navigation is active
When user backgrounds app or locks device
Then ForegroundService continues running
And notification displays: "Navigating to [destination] - [distance] remaining"
And GPS updates continue via FusedLocationProviderClient
And voice instructions play via TextToSpeech
And location updates are saved to local database
```

```gherkin
Given navigation is active in background
When user returns to app
Then navigation screen displays current state
And map is centered on user location
And metrics are up-to-date with latest GPS data
```

```gherkin
Given navigation is active in background
When system kills process (low memory, device restart)
Then navigation session is saved to Room database with status="INTERRUPTED"
And user can resume navigation via notification: "Resume navigation to [destination]"
And tapping notification relaunches app and restores navigation state
```

**Acceptance Criteria - iOS**:

```gherkin
Given navigation is active
When user backgrounds app or locks device
Then "location" background mode continues GPS tracking
And AVSpeechSynthesizer continues voice instructions
And location updates are saved to SwiftData
And notification displays: "Navigating to [destination] - [distance] remaining"
```

```gherkin
Given navigation is active in background
When system suspends app (iOS background execution limit)
Then navigation session is saved to SwiftData with status="INTERRUPTED"
And user can resume via notification or app relaunch
And navigation state is restored from saved session
```

**Technical Notes**:
- Android: Foreground service with `SERVICE_FOREGROUND` type, notification required
- iOS: Background location via `UIBackgroundModes` in Info.plist
- Process death recovery: Restore session ID from notification intent
- Background limits: Android (no limit with foreground service), iOS (limited to ~3 minutes without location updates)

---

## UC-NAV-08: Error Handling

**Description**: System handles navigation errors gracefully: GPS loss, network timeout, TTS failure, low battery. Each error type has specific recovery flow.

**Preconditions**:
- Navigation is active

**Main Flow - GPS Loss**:
1. GPS signal is lost (accuracy degrades > 100m or no updates for 10+ seconds)
2. System displays "GPS signal lost. Searching for signal..." banner
3. Voice instructions are muted
4. Last known position is displayed on map with "Last GPS update" timestamp
5. System retries GPS acquisition every 2 seconds
6. After 30 seconds without GPS, prompt user: "GPS unavailable. End navigation or continue without GPS?"
7. If GPS recovers: Navigation resumes with "GPS signal recovered" announcement

**Main Flow - Network Timeout**:
1. Network request fails (rerouting, upload, etc.)
2. System displays error banner: "Network error. Retrying..."
3. Request is retried with exponential backoff (1s, 2s, 4s, 8s, 16s)
4. After 3 failed attempts, error is logged and user is notified
5. Offline mode is activated if available

**Main Flow - TTS Failure**:
1. TextToSpeech or AVSpeechSynthesizer fails to speak
2. Error is logged with utterance text
3. Voice instructions are muted
4. User is notified: "Voice instructions unavailable. Check device settings."
5. Visual turn cards continue to display
6. User can manually retry voice instructions via settings

**Main Flow - Low Battery**:
1. Battery level drops below 20%
2. System displays "Low battery. End navigation to save power?" prompt
3. User can tap "End Navigation" or "Continue"
4. If "Continue" is selected, GPS sampling rate is reduced to 5-second intervals
5. Voice instructions are muted to save power
6. Visual guidance continues

**Acceptance Criteria - Android**:

```gherkin
Given navigation is active
When GPS accuracy degrades > 100m or no updates for 10+ seconds
Then "GPS signal lost" banner displays
And TextToSpeech is muted
And last known position displays on map
And GPS retry timer starts (2-second intervals)
And after 30s without GPS, dialog prompts: "GPS unavailable. End navigation or continue without GPS?"
```

```gherkin
Given GPS signal was lost
When GPS accuracy returns to < 20m
Then banner is dismissed
And TextToSpeech announces "GPS signal recovered"
And navigation resumes normally
```

```gherkin
Given navigation is active
When network request fails (timeout, no connectivity)
Then error banner displays: "Network error. Retrying..."
And request is retried with exponential backoff (1s, 2s, 4s, 8s, 16s)
And after 3 failed attempts, error is logged to Crashlytics
And offline mode is activated if Mapbox offline tiles are available
```

```gherkin
Given navigation is active
When TextToSpeech fails to speak (onUtteranceError callback)
Then error is logged with utterance text
And voice instructions are muted
And user is notified: "Voice instructions unavailable. Check device settings."
And visual turn cards continue to display
```

```gherkin
Given navigation is active
When battery level drops below 20%
Then dialog displays: "Low battery. End navigation to save power?"
And user can tap "End Navigation" or "Continue"
If "Continue" is selected:
  Then GPS sampling rate is reduced to 5-second intervals
  And TextToSpeech is muted
  And visual guidance continues
```

**Acceptance Criteria - iOS**:

```gherkin
Given navigation is active
When CLLocationManager fails to update location (didFailWithError)
And error is GPS-related (kCLErrorLocationUnknown)
Then "GPS signal lost" banner displays
And AVSpeechSynthesizer is muted
And last known position displays on map
And GPS retry timer starts
And after 30s, alert prompts: "GPS unavailable. End navigation or continue?"
```

```gherkin
Given navigation is active
When network request fails (URLSession timeout, no connectivity)
Then error banner displays: "Network error. Retrying..."
And request is retried with exponential backoff
And after 3 failed attempts, error is logged
And offline mode is activated if offline tiles are available
```

```gherkin
Given navigation is active
When AVSpeechSynthesizer fails to speak (didFinishWithError)
Then error is logged with utterance text
And voice instructions are muted
And user is notified: "Voice instructions unavailable"
And visual turn cards continue to display
```

**Technical Notes**:
- GPS loss detection: `location.accuracy > 100m` or `lastUpdate > 10s ago`
- Network retry: Exponential backoff with max 16s delay, 3 attempts
- TTS error handling: `onUtteranceError` (Android), `didFinishWithError` (iOS)
- Low battery: Monitor via `Intent.ACTION_BATTERY_LOW` (Android), `UIDevice.batteryLevel` (iOS)
- Error logging: Firebase Crashlytics for non-recoverable errors

---

## Appendix: Technical Stack

### Android
- **Navigation SDK**: `com.mapbox.navigation:android:2.x` (Mapbox Navigation SDK)
- **Location**: `FusedLocationProviderClient` with `PRIORITY_HIGH_ACCURACY`
- **Foreground Service**: `Service` with `FOREGROUND_SERVICE` type
- **TTS**: `android.speech.tts.TextToSpeech`
- **Persistence**: Room database (`@Entity navigation_session`)
- **Background Upload**: WorkManager (`OneTimeWorkRequest`)

### iOS
- **Navigation SDK**: `MapboxNavigation` framework (NavigationViewController)
- **Location**: `CLLocationManager` with `kCLLocationAccuracyBestForNavigation`
- **Background Mode**: `UIBackgroundModes` -> "location" in Info.plist
- **TTS**: `AVSpeechSynthesizer` with `AVSpeechUtterance`
- **Persistence**: SwiftData (`NavigationSession` model)
- **Background Upload**: `BGTaskScheduler` with `BGProcessingTask`

### Cross-Platform
- **Route Data**: Convex `route_plans` table with geometry from Mapbox Directions API
- **Upload API**: Convex `api.db.rides.create` mutation
- **Offline Support**: Mapbox offline tile packs for route regions
- **Error Tracking**: Firebase Crashlytics for non-recoverable errors
