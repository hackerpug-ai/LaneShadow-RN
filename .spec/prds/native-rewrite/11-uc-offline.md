# UC-OFFL: Offline Download Management

**Epic**: Offline Maps
**Status**: Draft
**Last Updated**: 2026-04-16

## Overview

Offline download management enables riders to download map regions for use without network connectivity. This system provides region browsing, selection, download management, progress monitoring, and storage management across Android and iOS platforms.

## Platform-Specific Implementation

### Android
- **WorkManager**: Background download scheduling and execution
- **Room**: Local database for offline pack metadata
- **Mapbox SDK**: Offline region API (`OfflineManager`, `OfflineRegion`)
- **Storage Access Framework**: Disk space monitoring and cleanup
- **Foreground Service**: Download progress notifications

### iOS
- **Mapbox SDK**: Offline pack API (`MGLOfflinePack`, `MGLOfflineStorage`)
- **URLSession**: Background download configuration
- **SwiftData**: Local pack tracking and metadata
- **FileManager**: Storage operations and disk space monitoring
- **Background Tasks**: Background download continuation

---

## UC-OFFL-01: Browse Available Offline Regions

### Description
Riders view available map regions for offline download with storage estimates and region metadata.

### Preconditions
- User is logged in
- App has storage permissions
- Network connectivity available (for size estimates)

### Main Flow
1. Rider navigates to Offline Maps screen
2. System displays list of downloadable regions
3. Each region shows:
   - Region name (e.g., "Rocky Mountains", "Bay Area")
   - Estimated storage size (e.g., "245 MB")
   - Geographic bounds preview
   - Current download status (if applicable)
4. Rider can scroll through available regions
5. Rider taps a region to view details

### Acceptance Criteria

#### Android
```gherkin
Given the rider is on the Offline Maps screen
When the region list loads
Then display regions in a LazyColumn with Room-derived metadata
And show estimated size for each region using StorageUtils.formatBytes()
And display a bounding box preview using Mapbox Snapshot API
```

```gherkin
Given the rider is browsing regions
And network connectivity is lost
When size estimates cannot be fetched
Then display cached estimates from last successful fetch
And show "Last updated: [timestamp]" subtitle
```

#### iOS
```gherkin
Given the rider is on the Offline Maps screen
When the region list loads
Then display regions in a SwiftUI List with SwiftData-derived metadata
And show estimated size for each region using ByteCountFormatter
And display a bounding box preview using Mapbox Snapshot API
```

```gherkin
Given the rider is browsing regions
And network connectivity is lost
When size estimates cannot be fetched
Then display cached estimates from UserDefaults cache
And show "Last updated: [timestamp]" subtitle
```

---

## UC-OFFL-02: Select Region for Download

### Description
Riders select a geographic region for offline download using an interactive map interface with bounding box preview.

### Preconditions
- Rider is on Offline Maps screen
- Map component is initialized
- Network connectivity available

### Main Flow
1. Rider taps "Download New Region" button
2. System presents interactive map with current location
3. Rider pans/zooms to desired area
4. System displays dynamic bounding box overlay
5. System shows real-time size estimate
6. Rider can adjust zoom level to control download size
7. Rider taps "Confirm" to proceed to naming step

### Acceptance Criteria

#### Android
```gherkin
Given the rider taps "Download New Region"
When the map selection screen opens
Then display Mapbox map with MapView
And show current location with LocationComponent
And render bounding box overlay using PolygonOverlay
```

```gherkin
Given the rider is adjusting the region
When the bounding box changes
Then update size estimate using StorageUtils.estimateRegionSize()
And display estimate in format "Estimated: ~245 MB"
And warn if size exceeds 500 MB limit
```

#### iOS
```gherkin
Given the rider taps "Download New Region"
When the map selection screen opens
Then display Mapbox map with MGLMapView
And show current location with MGLUserLocationAnnotationView
And render bounding box overlay using MGLPolygon
```

```gherkin
Given the rider is adjusting the region
When the bounding box changes
Then update size estimate using MGLOfflinePack.estimatedSize()
And display estimate in format "Estimated: ~245 MB"
And warn if size exceeds 500 MB limit
```

---

## UC-OFFL-03: Start Region Download

### Description
Riders confirm and initiate offline map download after region selection and naming.

### Preconditions
- Region has been selected (bounds defined)
- Rider has named the region
- WiFi connection is available (enforced)
- Sufficient storage space available

### Main Flow
1. Rider enters region name in bottom sheet
2. System validates:
   - Name is not empty
   - Name is unique (no existing region with same name)
   - WiFi connection is active
   - Sufficient storage available
3. System displays download confirmation with:
   - Region name
   - Estimated size
   - WiFi requirement notice
4. Rider taps "Confirm Download"
5. System initiates download via platform-specific API
6. System shows initial progress indicator
7. Rider can navigate away; download continues in background

### Acceptance Criteria

#### Android
```gherkin
Given the rider has selected a region and entered a name
When WiFi is not connected
Then disable "Confirm Download" button
And display warning: "WiFi required for downloads. Connect to WiFi to continue."
And do not allow download to start
```

```gherkin
Given the rider has confirmed the download
When sufficient storage is available
Then create OfflineRegion via OfflineManager.createPack()
And enqueue download task with WorkManager
And persist region metadata to Room database
And show progress indicator with 0% complete
```

```gherkin
Given the rider has confirmed the download
When insufficient storage is available
Then display error: "Not enough storage. Need ~245 MB free."
And do not start download
```

#### iOS
```gherkin
Given the rider has selected a region and entered a name
When WiFi is not connected
Then disable "Confirm Download" button
And display warning: "WiFi required for downloads. Connect to WiFi to continue."
And do not allow download to start
```

```gherkin
Given the rider has confirmed the download
When sufficient storage is available
Then create MGLOfflinePack via MGLOfflineStorage.shared().addPack()
And configure URLSession for background downloads
And persist region metadata to SwiftData
And show progress indicator with 0% complete
```

```gherkin
Given the rider has confirmed the download
When insufficient storage is available
Then display error: "Not enough storage. Need ~245 MB free."
And do not start download
```

---

## UC-OFFL-04: Monitor Download Progress

### Description
Riders view real-time download progress including percentage, data transferred, speed, and estimated time remaining.

### Preconditions
- Download is in progress
- Rider is viewing the Offline Maps screen or download notification

### Main Flow
1. System receives progress updates from Mapbox SDK
2. UI updates with:
   - Progress bar (0-100%)
   - Downloaded / total data (e.g., "124 MB / 245 MB")
   - Download percentage (e.g., "51%")
   - Estimated time remaining (e.g., "3 min left")
3. Progress updates throttle to 5% increments (avoid UI thrashing)
4. Rider can navigate away; progress continues in background
5. Rider returns to screen; progress reflects current state

### Acceptance Criteria

#### Android
```gherkin
Given a download is in progress
When the OfflineManager.onProgress() callback fires
Then update Room database with new progress values
And post LiveData update to UI observer
And throttle updates to 5% increments minimum
```

```gherkin
Given the rider is viewing the download progress
When progress is 51% complete
Then display progress bar at 51%
And show "124 MB / 245 MB"
And show "51%"
And calculate ETA: "(elapsed / percentage) * (100 - percentage)"
```

```gherkin
Given the download is complete
When progress reaches 100%
Then mark region state as 'complete' in Room
And dismiss progress indicator
And show "Download complete" toast
```

#### iOS
```gherkin
Given a download is in progress
When the MGLOfflinePack.progress callback fires
Then update SwiftData with new progress values
And publish @Published progress property
And throttle updates to 5% increments minimum
```

```gherkin
Given the rider is viewing the download progress
When progress is 51% complete
Then display progress bar at 51%
And show "124 MB / 245 MB"
And show "51%"
And calculate ETA: "(elapsed / percentage) * (100 - percentage)"
```

```gherkin
Given the download is complete
When progress reaches 100%
Then mark region state as 'complete' in SwiftData
And dismiss progress indicator
And show "Download complete" alert
```

---

## UC-OFFL-05: Pause/Resume/Cancel Download

### Description
Riders control active downloads with pause, resume, and cancel actions.

### Preconditions
- Download is in progress or paused
- Rider is viewing the download progress screen

### Main Flow
1. Rider taps "Pause" button
2. System pauses download (platform-specific)
3. Button changes to "Resume"
4. Rider taps "Resume" button
5. System resumes download from last position
6. Rider taps "Cancel" button
7. System shows confirmation dialog
8. Rider confirms cancellation
9. System cancels download and cleans up partial data

### Acceptance Criteria

#### Android
```gherkin
Given a download is in progress
When the rider taps "Pause"
Then call OfflineRegion.pauseDownload()
And update region state to 'paused' in Room
And change button text to "Resume"
```

```gherkin
Given a download is paused
When the rider taps "Resume"
Then call OfflineRegion.resumeDownload()
And update region state to 'downloading' in Room
And change button text to "Pause"
```

```gherkin
Given a download is in progress or paused
When the rider taps "Cancel"
Then show confirmation dialog with region name and size
And await rider confirmation
```

```gherkin
Given the rider confirms cancellation
When the cancellation is confirmed
Then call OfflineManager.deletePack() to clean up
And remove region from Room database
And dismiss progress indicator
```

#### iOS
```gherkin
Given a download is in progress
When the rider taps "Pause"
Then call MGLOfflinePack.suspend()
And update region state to 'paused' in SwiftData
And change button text to "Resume"
```

```gherkin
Given a download is paused
When the rider taps "Resume"
Then call MGLOfflinePack.resume()
And update region state to 'downloading' in SwiftData
And change button text to "Pause"
```

```gherkin
Given a download is in progress or paused
When the rider taps "Cancel"
Then show confirmation dialog with region name and size
And await rider confirmation
```

```gherkin
Given the rider confirms cancellation
When the cancellation is confirmed
Then call MGLOfflineStorage.removePack() to clean up
And remove region from SwiftData
And dismiss progress indicator
```

---

## UC-OFFL-06: Manage Downloaded Regions

### Description
Riders view, delete, rename, and update downloaded offline regions.

### Preconditions
- At least one region has been downloaded
- Rider is on Offline Maps screen

### Main Flow
1. Rider views list of downloaded regions
2. Each region shows:
   - Region name
   - Storage size
   - Download date
   - Geographic bounds summary
3. Rider can tap region to view on map
4. Rider can tap "Rename" to change display name
5. Rider can tap "Delete" to remove region
6. Rider can tap "Update" to refresh map data

### Acceptance Criteria

#### Android
```gherkin
Given the rider is viewing downloaded regions
When the region list renders
Then display regions in LazyColumn
And show name, size, download date for each region
And format size using StorageUtils.formatBytes()
And format date using DateUtils.getRelativeTimeSpanString()
```

```gherkin
Given the rider taps "Rename" on a region
When the rename bottom sheet opens
Then pre-fill input with current region name
And validate name is not empty
And update Room database on save
And keep packName unchanged (internal ID stability)
```

```gherkin
Given the rider taps "Delete" on a region
When the confirmation dialog shows
Then display "Delete [region name] ([size])? This map will no longer be available offline."
And await rider confirmation
```

```gherkin
Given the rider confirms deletion
When the deletion is confirmed
Then call OfflineManager.deletePack()
And remove region from Room database
And refresh region list
```

#### iOS
```gherkin
Given the rider is viewing downloaded regions
When the region list renders
Then display regions in SwiftUI List
And show name, size, download date for each region
And format size using ByteCountFormatter.string(fromByteCount:)
And format date using RelativeDateTimeFormatter()
```

```gherkin
Given the rider taps "Rename" on a region
When the rename bottom sheet opens
Then pre-fill input with current region name
And validate name is not empty
And update SwiftData on save
And keep packName unchanged (internal ID stability)
```

```gherkin
Given the rider taps "Delete" on a region
When the confirmation dialog shows
Then display "Delete [region name] ([size])? This map will no longer be available offline."
And await rider confirmation
```

```gherkin
Given the rider confirms deletion
When the deletion is confirmed
Then call MGLOfflineStorage.removePack()
And remove region from SwiftData
And refresh region list
```

---

## UC-OFFL-07: Use Offline Maps

### Description
Riders automatically use downloaded offline maps when network connectivity is unavailable or poor.

### Preconditions
- At least one offline region is downloaded
- Rider's current location is within a downloaded region

### Main Flow
1. Rider opens map view
2. System checks network connectivity
3. If offline:
   - System loads tiles from offline packs
   - Map displays cached data
   - System shows "Offline Mode" indicator
4. If online:
   - System loads tiles from network
   - Offline packs used as fallback
5. Rider can pan/zoom within offline region bounds
6. Rider pans outside offline region:
   - System shows "Area not downloaded" message
   - Tiles display as blank/placeholder

### Acceptance Criteria

#### Android
```gherkin
Given the rider has downloaded the "Bay Area" region
And network connectivity is lost
When the rider opens the map view
Then load tiles from OfflineRegion.pack
And display "Offline Mode" indicator in status bar
And show map data within downloaded bounds
```

```gherkin
Given the rider is viewing offline maps
When the rider pans outside the downloaded region
Then display "Area not downloaded" message
And show blank/placeholder tiles
And continue to show downloaded region tiles
```

```gherkin
Given the rider is in offline mode
When network connectivity is restored
Then seamlessly switch to online tiles
And dismiss "Offline Mode" indicator
And continue displaying map without interruption
```

#### iOS
```gherkin
Given the rider has downloaded the "Bay Area" region
And network connectivity is lost
When the rider opens the map view
Then load tiles from MGLOfflinePack
And display "Offline Mode" indicator in status bar
And show map data within downloaded bounds
```

```gherkin
Given the rider is viewing offline maps
When the rider pans outside the downloaded region
Then display "Area not downloaded" message
And show blank/placeholder tiles
And continue to show downloaded region tiles
```

```gherkin
Given the rider is in offline mode
When network connectivity is restored
Then seamlessly switch to online tiles
And dismiss "Offline Mode" indicator
And continue displaying map without interruption
```

---

## UC-OFFL-08: Storage Management

### Description
Riders monitor device storage usage, receive warnings for low space, and can clean up old offline regions.

### Preconditions
- Rider is on Offline Maps screen
- At least one region is downloaded

### Main Flow
1. System displays total storage used by offline regions
2. System displays available device storage
3. Rider taps "Storage Management"
4. System shows breakdown by region:
   - Region name
   - Size
   - Last accessed date
5. Rider can sort regions by size or date
6. System warns when storage is low (< 500 MB available)
7. Rider can bulk-delete old regions

### Acceptance Criteria

#### Android
```gherkin
Given the rider is viewing the Offline Maps screen
When the storage summary renders
Then display "Total used: [sum of region sizes]"
And query available storage via StorageManager.getAllocatableBytes()
And show "Available: [free space]"
```

```gherkin
Given available storage is less than 500 MB
When the rider opens the Offline Maps screen
Then display warning banner: "Low storage: [available] free. Consider removing offline regions."
And show warning icon in status bar
```

```gherkin
Given the rider taps "Storage Management"
When the storage management screen opens
Then display list of regions sorted by size (largest first)
And show size, last accessed date for each region
And provide "Delete" button for each region
And provide "Delete All" button for bulk cleanup
```

#### iOS
```gherkin
Given the rider is viewing the Offline Maps screen
When the storage summary renders
Then display "Total used: [sum of region sizes]"
And query available storage via FileManager.default.availableCapacity
And show "Available: [free space]"
```

```gherkin
Given available storage is less than 500 MB
When the rider opens the Offline Maps screen
Then display warning banner: "Low storage: [available] free. Consider removing offline regions."
And show warning icon in status bar
```

```gherkin
Given the rider taps "Storage Management"
When the storage management screen opens
Then display list of regions sorted by size (largest first)
And show size, last accessed date for each region
And provide "Delete" button for each region
And provide "Delete All" button for bulk cleanup
```

---

## UC-OFFL-09: Background Download

### Description
Downloads continue when the app is backgrounded, paused, or device is locked, resuming automatically when the app reopens.

### Preconditions
- Download is in progress
- Rider backgrounds the app or locks device

### Main Flow
1. Rider starts a download
2. Rider backgrounds app (Home button, switch apps)
3. System continues download in background
4. System shows progress notification (Android) / background task (iOS)
5. Rider reopens app
6. System displays current progress (may be complete)
7. Download completes successfully without interruption

### Acceptance Criteria

#### Android
```gherkin
Given a download is in progress
When the rider backgrounds the app
Then continue download using WorkManager
And show ongoing notification with progress percentage
And allow download to complete without app in foreground
```

```gherkin
Given a download is running in background
When the download completes
Then update notification to "Download complete"
And tap notification opens Offline Maps screen
And mark region state as 'complete' in Room
```

```gherkin
Given a download is running in background
When WiFi is disconnected
Then pause the download via WorkManager constraints
And update notification to "Paused - WiFi required"
And resume automatically when WiFi reconnects
```

#### iOS
```gherkin
Given a download is in progress
When the rider backgrounds the app
Then continue download using URLSession background configuration
And register background task via BGTaskScheduler
And allow download to complete without app in foreground
```

```gherkin
Given a download is running in background
When the download completes
And the app is relaunched via URLSession delegate callback
Then update SwiftData with completed state
And show "Download complete" alert when app opens
```

```gherkin
Given a download is running in background
When WiFi is disconnected
Then pause the download via MGLOfflinePack.suspend()
And resume automatically when WiFi reconnects
```

---

## Shared Cross-Platform Requirements

### Performance
- Progress UI updates throttle to 5% increments (avoid excessive re-renders)
- Region list loads in < 500ms for 100 regions
- Download progress reflects within 1 second of actual state

### Reliability
- Downloads survive app backgrounding/foregrounding cycles
- Partial downloads cleaned up on cancellation
- Region metadata reconciled with actual Mapbox packs on app launch
- WiFi validation prevents unintended cellular data usage

### Accessibility
- All buttons have accessibility labels
- Progress announcements via accessibilityLiveRegion="polite"
- Reduce motion respected for animations
- Screen reader announces download completion

### Error Handling
- WiFiRequiredError: Clear message to connect to WiFi
- StorageExceededError: Show required space vs. available space
- InvalidBoundsError: Explain region size limits
- Network errors: Retry with exponential backoff
- Mapbox SDK failures: Graceful degradation, show cached data

---

## Related Components

### React Native (Current Implementation)
- `hooks/useOfflineDownload.ts` - Offline download state management
- `stores/offline-store.ts` - Zustand store with AsyncStorage persistence
- `components/offline/` - UI components for region management

### Native Modules (Required for Rewrite)
- **Android**: `OfflineRegionManager.kt` - WorkManager wrapper for downloads
- **iOS**: `OfflineRegionManager.swift` - URLSession background wrapper for downloads
- **Shared**: `StorageUtils` - Platform-specific disk space utilities

---

## Dependencies

### External SDKs
- **Mapbox SDK** (Android & iOS): Offline region management
- **React Native** (current): UI layer (to be replaced with native)

### Internal Services
- **Convex** (backend): Not used for offline - fully local implementation
- **StorageUtils**: Disk space calculations and formatting
- **WiFiValidator**: Network type detection and enforcement

---

## Success Metrics

- **Download success rate**: > 95% (excluding user cancellations)
- **Background completion rate**: > 90% of downloads complete after app backgrounded
- **Storage estimate accuracy**: ± 20% of actual download size
- **Offline tile availability**: 100% within downloaded region bounds
- **UI responsiveness**: < 100ms latency for progress updates
