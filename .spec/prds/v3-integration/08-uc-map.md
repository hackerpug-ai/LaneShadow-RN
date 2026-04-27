---
stability: FEATURE_SPEC
last_validated: 2026-04-27
prd_version: 1.0.0
functional_group: MAP
---

# Use Cases: Map & Offline (MAP)

| ID | Title | Description |
|----|-------|-------------|
| UC-MAP-01 | Current location tracking and recenter | Real CoreLocation / FusedLocationProvider with permission flow + recenter button + denied-state Settings deep-link |
| UC-MAP-02 | Browse and download offline map regions | New OfflineRegionsListScreen + OfflineRegionSelectorScreen for downloading Mapbox tile packs |
| UC-MAP-03 | Resume offline downloads in background | URLSession background config (iOS) / WorkManager + ForegroundService (Android) for paused/resumed downloads |

---

## UC-MAP-01: Current location tracking and recenter

V2 LSMap atom + LSMapLayer organism use real native location APIs (CoreLocation on iOS, FusedLocationProvider on Android) with permission flow. The recenter button on `LSMapLayer.controls` flies the camera to the user's current location with the V2 `mapTapDismiss` motion recipe. Falls back to last-known location on first render before permission resolves; shows a friendly notice with a Settings deep-link if permission is denied.

- **Maps to**: V2 LSMap + LSMapLayer (no new screen)
- **iOS**: CoreLocation with `CLAuthorizationStatus.whenInUse`; on denial, `UIApplication.openSettingsURLString` deep-link
- **Android**: FusedLocationProvider with `ACCESS_FINE_LOCATION`; on denial, intent to `Settings.ACTION_APPLICATION_DETAILS_SETTINGS`

### Acceptance Criteria

- ☐ User can grant or deny location permission via the platform-native permission prompt on first map render
- ☐ User can tap the recenter button on the V2 map controls to fly the camera to current location
- ☐ System displays the current-location dot on the LSMap when permission is granted
- ☐ System falls back to the last-known location (cached) when current location is unavailable
- ☐ System displays a friendly notice with a Settings deep-link button when location permission is denied

---

## UC-MAP-02: Browse and download offline map regions

Two new screens. **OfflineRegionsListScreen** shows downloaded regions (name, size in MB, last-updated, status badge: ready / downloading / paused / error) with swipe-to-delete. **OfflineRegionSelectorScreen** shows a full LSMap with a bounding-box selector overlay and a bottom sheet collecting name + estimated size + Download button. Mirrors RN `app/(app)/offline/regions-list.tsx` + `region-selector.tsx`.

- **Maps to**: NEW screens — OfflineRegionsListScreen, OfflineRegionSelectorScreen
- **iOS**: Mapbox iOS SDK 11.x `OfflineManager` + `TileStoreManager` (region descriptor with bbox + zoom range)
- **Android**: Mapbox Android SDK 11.22.0 `OfflineManager` + `TileStore`
- **Composition**: V2 LSTopBar + LSListRow per region + new `LSDownloadProgressBar` molecule + LSMap (with bbox-selector overlay) + LSBottomSheet (name input + size + Download button)

### Acceptance Criteria

- ☐ User can navigate to OfflineRegionsListScreen from the hamburger menu (UC-APP-04) or SettingsScreen
- ☐ User can view all downloaded regions with name, size in megabytes, last-updated timestamp, and status badge
- ☐ User can tap "Add region" on the list screen to open OfflineRegionSelectorScreen with a bounding-box picker overlay on the LSMap
- ☐ User can drag the bounding-box handles to select a region, enter a name in the bottom sheet's LSTextField, and tap "Download" to start the download
- ☐ User can swipe-to-delete (iOS) or long-press menu (Android) any list row to remove a downloaded region

---

## UC-MAP-03: Resume offline downloads in background

Background download lifecycle: downloads continue when the app backgrounds; pause/resume on connectivity changes; checksum validation on completion; persistent progress across app close. Uses URLSession background configuration on iOS and WorkManager + ForegroundService on Android (with `dataSync` foreground service type for API 34+ and `POST_NOTIFICATIONS` runtime permission).

- **Maps to**: APP infrastructure backing UC-MAP-02
- **iOS**: `URLSessionConfiguration.background(withIdentifier: "com.laneshadow.offline-tiles")` with delegate handlers
- **Android**: WorkManager `OfflineDownloadWorker` + `OfflineDownloadService` (ForegroundService) with notification channel for progress

### Acceptance Criteria

- ☐ System resumes an in-progress region download when the app returns from background
- ☐ System pauses downloads automatically on poor connectivity (via reachability monitor) and shows a paused indicator on the affected list row
- ☐ System validates checksum on download completion and marks the region complete in the OfflineRegionsListScreen
- ☐ User can tap a paused region row in the list to manually retry the download via the new `LSDownloadProgressBar` molecule's retry affordance
- ☐ System persists download progress across app close using Mapbox's built-in offline tile-store progress tracking
