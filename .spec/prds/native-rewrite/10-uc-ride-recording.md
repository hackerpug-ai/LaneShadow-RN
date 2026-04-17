# UC-10: Ride Recording Use Cases

**Parity Goal**: Replace Expo Location tracking with native foreground services and high-frequency GPS sampling for curvature detection

**Current State**: React Native app uses Expo Location with basic tracking (useCurrentLocation hook)

**Target State**: Native ride recording with foreground services, 1-second GPS sampling, curvature detection algorithm, and offline persistence

---

## UC-REC-01: Start Ride Recording

**Description**: User initiates ride recording. System verifies GPS lock, launches foreground service with notification, and displays recording UI with real-time metrics.

**UI Components (from Sprint 2):**
- `BaseViewLayout` (template) — root container for the Record Ride screen
- `MapViewWrapper` (organism) — live map showing current location and trace
- `Button` (atom) — "Start Recording" primary action and GPS retry/cancel controls
- `StatRow` (molecule) — real-time speed, distance, duration metrics
- `MinimalOverlayWidget` (molecule) — floating speedometer/distance/timer readouts over map
- `MinimalOverlayWidgetPreview` (molecule) — composes overlay widgets into the recording HUD
- `Banner` (molecule) — GPS lock status and "acquiring signal" messaging
- `PermissionNotification` (molecule) — location permission prompt when not yet granted
- `FAB` (atom) — primary record trigger in map-forward layout
- `IconSymbol` (atom) — iconography across HUD and controls

**New Compositions Needed:** None

**Preconditions**:
- User is authenticated with Convex
- Location permissions are granted
- GPS is enabled

**Main Flow**:
1. User navigates to "Record Ride" screen
2. User taps "Start Recording" button
3. System requests GPS lock (accuracy < 10m required)
4. Once GPS is locked, foreground service (Android) or background location task (iOS) is launched
5. Persistent notification displays: "Recording ride - 0.0 mi - 00:00:00"
6. Recording screen displays:
   - Current speed (speedometer)
   - Distance traveled
   - Duration (timer)
   - Current location (reverse geocoded)
   - "Pause" and "Stop" buttons
7. GPS points begin recording to local database (Room/SwiftData)
8. Recording session is created with status="RECORDING"

**Acceptance Criteria - Android**:

```gherkin
Given user is on "Record Ride" screen
When user taps "Start Recording" button
And GPS accuracy is < 10m within 30 seconds
Then ForegroundService is created with notification showing "Recording ride"
And notification is ongoing (non-dismissable) with "Stop Recording" action
And FusedLocationProviderClient is set to PRIORITY_HIGH_ACCURACY with 1-second interval
And Room database creates ride_session record with status="RECORDING"
And recording screen displays real-time metrics
And first GPS point is saved to ride_points table
```

```gherkin
Given user taps "Start Recording" button
And GPS accuracy is > 10m after 30 seconds
Then error dialog displays: "Unable to acquire GPS signal. Ensure location is enabled and try again."
And recording is not started
And user can tap "Retry" or "Cancel"
```

```gherkin
Given recording is active
When user taps home button or backgrounds app
Then ForegroundService continues running
And notification updates with real-time metrics: "Recording ride - [distance] mi - [duration]"
And GPS points continue recording to local database
And recording can be stopped via notification action "Stop Recording"
```

**Acceptance Criteria - iOS**:

```gherkin
Given user is on "Record Ride" screen
When user taps "Start Recording" button
And CLLocationManager achieves accuracy < 10m within 30 seconds
Then "location" background mode is activated
And CLLocationManager is configured with kCLLocationAccuracyBestForNavigation
And location updates are requested with 1-second interval (desiredAccuracy: best, activityType: automotiveNavigation)
And SwiftData creates ride_session record with status="RECORDING"
And recording screen displays real-time metrics
And first GPS point is saved to RidePoint entity
```

```gherkin
Given recording is active
When user backgrounds app
Then CLLocationManager continues updates in background
And notification displays: "Recording ride - [distance] mi - [duration]"
And GPS points continue recording to SwiftData
```

**Technical Notes**:
- GPS lock requirement: Accuracy < 10m, verified via `location.accuracy` (Android) or `horizontalAccuracy` (iOS)
- Sampling rate: 1 second (1000ms interval)
- Android: `FusedLocationProviderClient.LocationRequest` with `Priority.PRIORITY_HIGH_ACCURACY`
- iOS: `CLLocationManager` with `desiredAccuracy = kCLLocationAccuracyBestForNavigation`
- Foreground service notification ID: `laneshadow://recording/active`
- Schema: `ride_session` (session metadata) + `ride_points` (GPS points with timestamp, lat, lng, speed, accuracy)

---

## UC-REC-02: Pause/Resume Recording

**Description**: User pauses recording (e.g., for a stop) and resumes later. GPS tracking pauses but session remains active. Resume checks for deviation from last recorded point.

**UI Components (from Sprint 2):**
- `Button` (atom) — "Pause" / "Resume" primary controls
- `StatRow` (molecule) — frozen distance/duration during pause
- `MinimalOverlayWidget` (molecule) — paused-state HUD indicators
- `Banner` (molecule) — "Recording paused" status banner
- `BottomActionSheet` (template) — "Continue" vs "New Segment" deviation prompt
- `IconSymbol` (atom) — pause/resume icons
- `MapViewWrapper` (organism) — shows last recorded point vs current location on resume

**New Compositions Needed:** None

**Preconditions**:
- Recording is active (UC-REC-01 completed)

**Main Flow**:
1. User taps "Pause" button on recording screen
2. GPS tracking is paused (location updates stop)
3. Timer is frozen
4. Notification updates: "Recording paused - [distance] mi - [duration]"
5. Pause timestamp is recorded
6. User taps "Resume" button
7. System checks current GPS location against last recorded point:
   - If deviation < 100m: Resume recording, append to existing session
   - If deviation > 100m: Prompt user: "You've moved since pausing. Start new segment or continue?"
8. GPS tracking resumes
9. Timer resumes

**Acceptance Criteria - Android**:

```gherkin
Given recording is active
When user taps "Pause" button
Then FusedLocationProviderClient location updates are stopped via removeLocationUpdates()
And ride_session status is updated to "PAUSED" in Room database
And pause_timestamp is recorded in ride_session
And notification text updates to "Recording paused - [distance] mi - [duration]"
And recording screen shows "Paused" state with "Resume" button
```

```gherkin
Given recording is paused
When user taps "Resume" button
And current location is < 100m from last recorded point
Then FusedLocationProviderClient location updates are resumed via requestLocationUpdates()
And ride_session status is updated to "RECORDING" in Room database
And resume_timestamp is recorded
And GPS points continue appending to ride_points table
And timer resumes from frozen value
```

```gherkin
Given recording is paused
When user taps "Resume" button
And current location is > 100m from last recorded point
Then dialog displays: "You've moved since pausing. Start new segment or continue recording?"
If "Continue" is selected:
  Then recording resumes and GPS points append to existing session
If "New Segment" is selected:
  Then current session is ended (status="COMPLETED")
  And new session is created (status="RECORDING")
  And recording resumes with new session
```

**Acceptance Criteria - iOS**:

```gherkin
Given recording is active
When user taps "Pause" button
Then CLLocationManager stops updating via stopUpdatingLocation()
And ride_session status is updated to "PAUSED" in SwiftData
And pause_timestamp is recorded
And notification updates to "Recording paused"
And recording screen shows "Paused" state
```

```gherkin
Given recording is paused
When user taps "Resume" button
And current location is < 100m from last recorded point
Then CLLocationManager resumes updates via startUpdatingLocation()
And ride_session status is updated to "RECORDING"
And resume_timestamp is recorded
And GPS points continue appending
And timer resumes
```

**Technical Notes**:
- Deviation threshold: 100m (configurable)
- Distance calculation: Haversine formula between last point and current location
- Pause duration tracking: `pauseEndTimestamp - pauseStartTimestamp` added to session metadata
- Segment support: Multiple segments per ride (linked via parent `ride_id`)

---

## UC-REC-03: Background Location Tracking

**Description**: Recording continues when app is backgrounded or device is locked. Foreground service (Android) or background location task (iOS) maintains GPS tracking with battery optimization.

**UI Components (from Sprint 2):**
- `Banner` (molecule) — "Recording (power saving)" / interrupted-session banner on foreground return
- `InfoToast` (molecule) — background-mode status notifications
- `WarningToast` (molecule) — low-battery / reduced-sampling notifications
- `StatRow` (molecule) — metrics refresh when user returns to app
- `MinimalOverlayWidget` (molecule) — restored HUD state post-background
- `Button` (atom) — "Resume interrupted recording" confirmation
- `IconSymbol` (atom) — battery / power-save iconography

**New Compositions Needed:** None

**Preconditions**:
- Recording is active
- User backgrounds app or locks device

**Main Flow**:
1. User backgrounds app or locks device
2. Foreground service (Android) or background task (iOS) continues GPS tracking
3. Location updates continue at 1-second interval
4. Notification updates with real-time metrics (distance, duration)
5. GPS points are saved to local database
6. Battery optimization: Sampling rate adjusts based on battery level and charging state
7. When user returns to app, recording screen displays current state

**Acceptance Criteria - Android**:

```gherkin
Given recording is active
When user backgrounds app or locks device
Then ForegroundService continues running with notification
And notification updates every 5 seconds with: "Recording ride - [distance] mi - [duration]"
And FusedLocationProviderClient continues location updates
And GPS points are saved to Room database
And recording can be stopped via notification action "Stop Recording"
```

```gherkin
Given recording is active in background
When battery level is > 50% and device is charging
Then GPS sampling rate remains at 1-second interval
And location updates continue normally
```

```gherkin
Given recording is active in background
When battery level drops below 20% and device is not charging
Then GPS sampling rate is reduced to 5-second interval
And notification displays: "Recording ride (power saving) - [distance] mi - [duration]"
And GPS points continue recording at reduced rate
```

```gherkin
Given recording is active in background
When system kills process (low memory, device restart)
Then ride_session status is saved to Room database as "INTERRUPTED"
And user can resume recording via notification: "Resume recording"
And tapping notification relaunches app and prompts: "Resume interrupted recording?"
And if confirmed, recording resumes with new session linked to interrupted session
```

**Acceptance Criteria - iOS**:

```gherkin
Given recording is active
When user backgrounds app or locks device
Then "location" background mode continues GPS tracking
And CLLocationManager continues updates
And notification displays: "Recording ride - [distance] mi - [duration]"
And GPS points are saved to SwiftData
And recording can be stopped via notification action
```

```gherkin
Given recording is active in background
When battery level is > 50% and device is charging
Then GPS sampling rate remains at 1-second interval
```

```gherkin
Given recording is active in background
When battery level drops below 20% and device is not charging
Then GPS sampling rate is reduced to 5-second interval
And notification displays: "Recording ride (power saving) - [distance] mi"
And GPS points continue recording at reduced rate
```

```gherkin
Given recording is active in background
When iOS suspends app (background execution limit)
Then ride_session status is saved to SwiftData as "INTERRUPTED"
And user can resume via notification or app relaunch
And recording state is restored from saved session
```

**Technical Notes**:
- Android: Foreground service with `SERVICE_FOREGROUND` type, notification required
- iOS: Background location via `UIBackgroundModes` in Info.plist
- Battery optimization:
  - High battery (>50% or charging): 1-second sampling
  - Low battery (<20%, not charging): 5-second sampling
- Background limits: Android (no limit with foreground service), iOS (limited to ~3 minutes without location updates)
- Process death recovery: Restore session ID from notification intent

---

## UC-REC-04: Curvature Detection

**Description**: System analyzes GPS points in real-time to detect curved road segments and calculate curvature scores. Algorithm identifies changes in heading and radius of curvature.

**UI Components (from Sprint 2):**
- `RoutePolyline` (atom) — draws the recorded GPS trace on the map
- `MapViewWrapper` (organism) — renders detected curve segments in real-time
- `Badge` (atom) — curvature score indicator (0-10)
- `StatRow` (molecule) — live curvature score / lateral-G readouts
- `InfoToast` (molecule) — "Curvy road detected! Score: X/10" notification
- `MinimalOverlayWidget` (molecule) — floating curvature-score HUD widget
- `IconSymbol` (atom) — curve/flag icons for flagged segments

**New Compositions Needed:** None

**Preconditions**:
- Recording is active
- At least 3 GPS points recorded

**Main Flow**:
1. As GPS points are recorded, system calculates heading between consecutive points (bearing in degrees)
2. System detects changes in heading (> 10° change indicates potential curve)
3. For detected curve, system calculates:
   - Radius of curvature (via circle fitting algorithm)
   - Curve length (distance along curve)
   - Average speed through curve
   - Lateral acceleration (v² / r)
4. Curvature score is calculated: 0-10 scale based on radius and lateral acceleration
5. High-curvature segments (> 7.0 score) are flagged for review
6. Curvature data is saved to local database with segment metadata

**Acceptance Criteria - Android**:

```gherkin
Given recording is active and 3+ GPS points are recorded
When consecutive GPS points show heading change > 10 degrees
Then system identifies curve segment
And curve segment is saved to ride_curves table with:
  - start_timestamp
  - end_timestamp
  - radius_of_curvature (meters)
  - curve_length (meters)
  - average_speed (mph)
  - lateral_acceleration (g-force)
  - curvature_score (0-10)
And curve segment is linked to ride_session and ride_points
```

```gherkin
Given curve segment is detected
When radius_of_curvature is < 50 meters and lateral_acceleration > 0.3g
Then curvature_score is calculated as 8.0-10.0 (high curvature)
And segment is flagged for review (is_flagged=true)
And notification displays: "Curvy road detected! Score: [score]/10"
```

```gherkin
Given curve segment is detected
When radius_of_curvature is 50-200 meters and lateral_acceleration 0.1-0.3g
Then curvature_score is calculated as 5.0-7.9 (moderate curvature)
And segment is not flagged
```

```gherkin
Given curve segment is detected
When radius_of_curvature is > 200 meters and lateral_acceleration < 0.1g
Then curvature_score is calculated as 0.0-4.9 (low curvature)
And segment is not flagged
```

**Acceptance Criteria - iOS**:

```gherkin
Given recording is active and 3+ GPS points are recorded
When consecutive GPS points show heading change > 10 degrees
Then system identifies curve segment
And curve segment is saved to RideCurve entity with:
  - startTimestamp
  - endTimestamp
  - radiusOfCurvature (meters)
  - curveLength (meters)
  - averageSpeed (mph)
  - lateralAcceleration (g-force)
  - curvatureScore (0-10)
And curve segment is linked to ride session
```

**Technical Notes**:
- Heading calculation: `atan2(lng2 - lng1, lat2 - lat1)` converted to degrees
- Curve detection threshold: Heading change > 10° between consecutive points
- Circle fitting algorithm: Least-squares fit to GPS points in segment
- Radius of curvature: Calculated from fitted circle
- Lateral acceleration: `a = v² / r` (v in m/s, r in meters), converted to g-force
- Curvature score formula:
  - Score 0-4.9: radius > 200m or acceleration < 0.1g
  - Score 5.0-7.9: radius 50-200m or acceleration 0.1-0.3g
  - Score 8.0-10.0: radius < 50m or acceleration > 0.3g
- Real-time detection: Analyze last 10 GPS points in sliding window
- Database schema: `ride_curves` table linked to `ride_session` and `ride_points`

---

## UC-REC-05: Complete and Save Recording

**Description**: User stops recording. System compiles ride data, saves to local database, uploads to Convex, and displays completion screen with metrics.

**UI Components (from Sprint 2):**
- `SubpageLayout` (template) — completion screen chrome with back/close
- `Card` (atom) — container for aggregated ride metrics
- `StatRow` (molecule) — distance, duration, avg speed, max speed rows
- `Badge` (atom) — max curvature score indicator
- `RoutePolyline` (atom) — renders the completed GPS trace preview
- `MapViewWrapper` (organism) — preview map with full ride polyline
- `Button` (atom) — "Save Ride" and "Discard" actions
- `DeleteRouteDialog` (molecule) — confirm discard flow (reused for ride discard confirmation)
- `IconSymbol` (atom) — metric iconography

**New Compositions Needed:**
- `CompletionSummaryCard` (proposed organism) — dedicated post-ride summary composition that arranges ride stats (StatRow), curvature badge, map polyline preview, and Save/Discard actions into a cohesive "ride completed" hero card. Existing Card + StatRow cover atoms, but the specific composition (hero metrics header, curvature highlight, trace preview, dual-CTA footer) is not expressible through any single Sprint-2 catalog entry — `RouteDetailsSheet` is the closest analog but is route-planning focused, not ride-completion focused.

**Preconditions**:
- Recording is active or paused

**Main Flow**:
1. User taps "Stop Recording" button
2. GPS tracking is stopped
3. Foreground service is terminated (Android) or background task ends (iOS)
4. Ride data is compiled:
   - Start/end timestamps
   - Total distance (sum of distances between GPS points)
   - Duration (end - start, minus pause duration)
   - Average speed (total distance / duration)
   - Maximum speed
   - GPS trace (polyline)
   - Curvature segments (if any)
5. Ride is saved to local database with status="COMPLETED"
6. Upload to Convex is queued via WorkManager (Android) or BGTaskScheduler (iOS)
7. Completion screen displays:
   - Total distance
   - Duration
   - Average speed
   - Max speed
   - Curvature segments (count and max score)
   - "Save Ride" and "Discard" buttons
8. User taps "Save": Ride is permanently stored and marked for upload
9. User taps "Discard": Ride is deleted from local database

**Acceptance Criteria - Android**:

```gherkin
Given recording is active or paused
When user taps "Stop Recording" button
Then FusedLocationProviderClient location updates are stopped
And ForegroundService is removed via stopForegroundService()
And notification is dismissed
And ride data is compiled from ride_session and ride_points tables
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
Then ride and all ride_points are deleted from Room database
And WorkManager upload task is cancelled
And user is navigated to home screen
```

**Acceptance Criteria - iOS**:

```gherkin
Given recording is active or paused
When user taps "Stop Recording" button
Then CLLocationManager stops updating
And background location task is cancelled
And notification is dismissed
And ride data is compiled from SwiftData entities
And ride is saved with status="COMPLETED"
And BGTaskScheduler submits upload task
And completion screen displays with metrics
```

**Technical Notes**:
- Distance calculation: Sum of Haversine distances between consecutive GPS points
- Duration: `endTimestamp - startTimestamp - totalPauseDuration`
- Average speed: `totalDistance / duration` (converted to mph)
- Max speed: Maximum `speed` value from all GPS points
- GPS trace: Polyline encoded from GPS points (Google polyline algorithm)
- Curvature segments: Loaded from `ride_curves` table, aggregated for display
- Upload API: Convex `api.db.rides.create` mutation with ride payload
- WorkManager constraints: `NetworkType.CONNECTED`, `BatteryNotLow`, `RequiresCharging=false`

---

## UC-REC-06: Share Recorded Ride

**Description**: User shares a recorded ride via GPX export, share sheet, or link sharing. Ride data is exported and shared via native sharing mechanisms.

**UI Components (from Sprint 2):**
- `SavedRoutesScreen` (screen) — entry point listing saved rides to share
- `SavedRouteCard` (molecule) — individual ride row with share affordance
- `BottomActionSheet` (template) — "Export GPX / Share link / Share summary" options sheet
- `Button` (atom) — "Share" trigger and sheet actions
- `IconSymbol` (atom) — share / link / file iconography
- `SuccessToast` (molecule) — "Link copied to clipboard" confirmation
- `ErrorToast` (molecule) — share/export failure notification

**New Compositions Needed:**
- `RideShareSheet` (proposed organism) — ride-specific share options sheet that surfaces GPX export, Convex link, and text summary with preview. `BottomActionSheet` provides the template-level container but only handles generic action lists; a share sheet with ride-context header (distance/duration preview), three distinctly-styled share modes, and summary-text preview requires composition beyond the generic actions template. Could be built atop `BottomActionSheet` + `StatRow` + `Button` but warrants a named organism.

**Preconditions**:
- Ride is saved (status="SAVED")
- Ride has GPS points and metadata

**Main Flow**:
1. User navigates to ride history screen
2. User taps on a saved ride
3. User taps "Share" button
4. System displays share options:
   - Export GPX file
   - Share link (if uploaded to Convex)
   - Share summary (text with distance, duration, route)
5. User selects export option:
   - **GPX Export**: System generates GPX file with GPS trace and metadata, opens share sheet
   - **Link Share**: System copies Convex share link to clipboard
   - **Summary Share**: System generates text summary and opens share sheet
6. User selects destination app (Messages, Email, etc.)
7. Content is shared

**Acceptance Criteria - Android**:

```gherkin
Given user has selected a saved ride from ride history
When user taps "Share" button
Then share bottom sheet displays with options:
  - "Export GPX file"
  - "Share link"
  - "Share summary"
```

```gherkin
Given share options are displayed
When user selects "Export GPX file"
Then GPX file is generated from ride_points table:
  - GPX header with metadata (name, time, author)
  - <trk> segment with <trkpt> points (lat, lng, elevation, time)
  - GPX footer
And file is saved to external storage: "laneshadow_ride_[timestamp].gpx"
And share sheet is opened with FileProvider for GPX file
And user can select app to share GPX file
```

```gherkin
Given share options are displayed
When user selects "Share link" and ride is uploaded to Convex
Then share link is generated: "https://laneshadow.app/ride/[rideId]"
And link is copied to clipboard
And toast displays: "Link copied to clipboard"
And user can paste link into any app
```

```gherkin
Given share options are displayed
When user selects "Share summary"
Then text summary is generated:
  - "LaneShadow Ride: [distance] mi, [duration], [avg_speed] mph avg"
  - "Curvature score: [max_score]/10"
And share sheet is opened with text content
And user can select app to share summary
```

**Acceptance Criteria - iOS**:

```gherkin
Given user has selected a saved ride from ride history
When user taps "Share" button
Then UIActivityViewController is presented with activity items:
  - GPX file (NSData)
  - Share link (URL)
  - Text summary (String)
And user can select destination app
```

```gherkin
Given UIActivityViewController is displayed
When user selects GPX file activity
Then GPX file is generated from SwiftData RidePoint entities
And file is written to temporary directory
And file is attached to share sheet
And user can select app to share GPX file
```

**Technical Notes**:
- GPX format: Standard GPX 1.1 schema with `<trk>`, `<trkseg>`, `<trkpt>` elements
- GPX metadata: Name, time, author (LaneShadow), link to Convex ride
- Android share: `FileProvider` for file sharing, `Intent.ACTION_SEND` for text/link
- iOS share: `UIActivityViewController` with activity items array
- Share link: Convex ride ID encoded as short URL via `api.db.rides.share` mutation
- File naming: `laneshadow_ride_[timestamp].gpx` or `laneshadow_ride_[rideId].gpx`

---

## UC-REC-07: Recording Error Handling

**Description**: System handles recording errors gracefully: GPS loss, storage full, upload failure. Each error type has specific recovery flow.

**UI Components (from Sprint 2):**
- `Banner` (molecule) — "GPS signal lost" / "Storage full" persistent error banners
- `ConnectionBanner` (molecule) — network/upload connectivity state
- `ErrorToast` (molecule) — transient upload-failure notifications
- `WarningToast` (molecule) — GPS-degraded / storage warnings
- `SuccessToast` (molecule) — "GPS signal recovered" confirmation
- `BottomActionSheet` (template) — "End recording or continue?" / "End or free up space?" decision sheets
- `Button` (atom) — "Retry Upload" / "End Recording" / "Free Up Space" actions
- `IconSymbol` (atom) — warning / error / retry iconography
- `Progress` (atom) — upload-retry progress indicator

**New Compositions Needed:** None

**Preconditions**:
- Recording is active

**Main Flow - GPS Loss**:
1. GPS signal is lost (accuracy degrades > 100m or no updates for 10+ seconds)
2. System displays "GPS signal lost. Searching for signal..." banner
3. Timer is frozen
4. Last known GPS point is marked in database
5. System retries GPS acquisition every 2 seconds
6. After 30 seconds without GPS, prompt user: "GPS unavailable. End recording or continue without GPS?"
7. If GPS recovers: Recording resumes with "GPS signal recovered" announcement

**Main Flow - Storage Full**:
1. Local database cannot save GPS point (disk full error)
2. System displays error banner: "Storage full. Unable to save ride data."
3. Recording is paused
4. User is prompted: "Storage full. End recording or free up space?"
5. If "End Recording": Recording is stopped and partial ride is saved
6. If "Free Up Space": User is directed to storage settings, recording can be resumed

**Main Flow - Upload Failure**:
1. Upload to Convex fails (network error, server error, timeout)
2. System logs error and retries with exponential backoff (1s, 2s, 4s, 8s, 16s)
3. After 3 failed attempts, ride is marked as "UPLOAD_PENDING" in local database
4. Retry is scheduled for later via WorkManager/BGTaskScheduler
5. User can manually retry upload from ride history screen
6. Upload status is displayed on ride detail screen

**Acceptance Criteria - Android**:

```gherkin
Given recording is active
When GPS accuracy degrades > 100m or no updates for 10+ seconds
Then "GPS signal lost" banner displays
And timer is frozen
And last GPS point is marked with is_last_valid=true in ride_points table
And GPS retry timer starts (2-second intervals)
And after 30s without GPS, dialog prompts: "GPS unavailable. End recording or continue?"
```

```gherkin
Given GPS signal was lost
When GPS accuracy returns to < 20m
Then banner is dismissed
And recording resumes
And GPS points continue recording
And timer resumes
```

```gherkin
Given recording is active
When Room database insert fails with SQLiteFullException
Then error banner displays: "Storage full. Unable to save ride data."
And recording is paused (status="PAUSED")
And dialog prompts: "Storage full. End recording or free up space?"
If "End Recording" is selected:
  Then recording is stopped and partial ride is saved with status="COMPLETED"
If "Free Up Space" is selected:
  Then user is directed to device storage settings
  And recording remains paused
  And user can resume recording after freeing space
```

```gherkin
Given ride is saved and upload to Convex is in progress
When upload fails (network error, timeout, server error 500+)
Then error is logged to Crashlytics
And ride status in Room database is updated to "UPLOAD_PENDING"
And WorkManager enqueues retry with exponential backoff (1s, 2s, 4s, 8s, 16s)
And after 3 failed attempts, retry is scheduled for later
And user can manually retry via "Retry Upload" button on ride detail screen
```

**Acceptance Criteria - iOS**:

```gherkin
Given recording is active
When CLLocationManager fails to update location (didFailWithError)
And error is GPS-related (kCLErrorLocationUnknown)
Then "GPS signal lost" banner displays
And timer is frozen
And last GPS point is marked with isLastValid=true
And GPS retry timer starts
And after 30s, alert prompts: "GPS unavailable. End recording or continue?"
```

```gherkin
Given recording is active
When SwiftData save fails with NSError (domain=NSCocoaErrorDomain, code=NSFileWriteOutOfSpaceError)
Then error banner displays: "Storage full. Unable to save ride data."
And recording is paused (status="PAUSED")
And alert prompts: "Storage full. End recording or free up space?"
If "End Recording" is selected:
  Then recording is stopped and partial ride is saved
If "Free Up Space" is selected:
  Then user is directed to device storage settings
  And recording remains paused
```

```gherkin
Given ride is saved and upload to Convex is in progress
When upload fails (network error, timeout, server error)
Then error is logged
And ride status in SwiftData is updated to "UPLOAD_PENDING"
And BGTaskScheduler schedules retry with exponential backoff
And after 3 failed attempts, retry is scheduled for later
And user can manually retry via "Retry Upload" button on ride detail screen
```

**Technical Notes**:
- GPS loss detection: `location.accuracy > 100m` or `lastUpdate > 10s ago`
- Storage full detection: Catch `SQLiteFullException` (Android) or `NSFileWriteOutOfSpaceError` (iOS)
- Upload retry: Exponential backoff with max 16s delay, 3 attempts, then schedule for later
- Manual retry: "Retry Upload" button on ride detail screen triggers immediate upload via WorkManager/BGTaskScheduler
- Error logging: Firebase Crashlytics for non-recoverable errors
- Upload status display: Ride detail screen shows upload status with icon (pending/uploaded/failed)

---

## Appendix: Technical Stack

### Android
- **Location**: `FusedLocationProviderClient` with `PRIORITY_HIGH_ACCURACY`
- **Foreground Service**: `Service` with `FOREGROUND_SERVICE` type, ongoing notification
- **Persistence**: Room database with tables:
  - `ride_session` (metadata: start_time, end_time, distance, duration, status)
  - `ride_points` (GPS points: timestamp, lat, lng, speed, accuracy, session_id)
  - `ride_curves` (curvature segments: start_time, end_time, radius, score, session_id)
- **Background Upload**: WorkManager with `OneTimeWorkRequest`
- **Share**: `FileProvider` for GPX files, `Intent.ACTION_SEND` for text/link

### iOS
- **Location**: `CLLocationManager` with `kCLLocationAccuracyBestForNavigation`
- **Background Mode**: `UIBackgroundModes` -> "location" in Info.plist
- **Persistence**: SwiftData with models:
  - `RideSession` (metadata: startTime, endTime, distance, duration, status)
  - `RidePoint` (GPS points: timestamp, lat, lng, speed, accuracy, sessionId)
  - `RideCurve` (curvature segments: startTime, endTime, radius, score, sessionId)
- **Background Upload**: `BGTaskScheduler` with `BGProcessingTask`
- **Share**: `UIActivityViewController` with activity items (GPX file, URL, String)

### Cross-Platform
- **GPS Sampling**: 1-second interval (1000ms) for high-accuracy tracking
- **Curvature Algorithm**: Circle fitting to GPS points, radius calculation, lateral acceleration (v²/r)
- **Curvature Score**: 0-10 scale based on radius and acceleration
- **Upload API**: Convex `api.db.rides.create` mutation with ride payload
- **GPX Export**: Standard GPX 1.1 format with track segments
- **Battery Optimization**: Adaptive sampling rate based on battery level and charging state
- **Error Tracking**: Firebase Crashlytics for non-recoverable errors

### Database Schema (Room/SwiftData parity)

**ride_session** table:
- `id` (primary key)
- `start_time` (timestamp)
- `end_time` (timestamp, nullable)
- `distance` (meters)
- `duration` (seconds)
- `pause_duration` (seconds)
- `avg_speed` (mph)
- `max_speed` (mph)
- `status` (enum: RECORDING, PAUSED, COMPLETED, INTERRUPTED, SAVED, UPLOAD_PENDING, UPLOADED)
- `convex_ride_id` (string, nullable)
- `created_at` (timestamp)

**ride_points** table:
- `id` (primary key)
- `session_id` (foreign key to ride_session)
- `timestamp` (timestamp)
- `latitude` (double)
- `longitude` (double)
- `speed` (m/s, nullable)
- `accuracy` (meters)
- `altitude` (meters, nullable)
- `heading` (degrees, nullable)
- `is_last_valid` (boolean)

**ride_curves** table:
- `id` (primary key)
- `session_id` (foreign key to ride_session)
- `start_time` (timestamp)
- `end_time` (timestamp)
- `radius_of_curvature` (meters)
- `curve_length` (meters)
- `average_speed` (mph)
- `lateral_acceleration` (g-force)
- `curvature_score` (0-10)
- `is_flagged` (boolean)
