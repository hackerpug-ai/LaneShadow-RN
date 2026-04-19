# PlatformNotificationTemplate — STYLE PROPERTIES MATRIX

**Component:** PlatformNotificationTemplate
**Level:** Molecule (Delta)
**Source:** UC-NAV-07, UC-OFFL-09 (NEW for Sprint 2)
**Platform Mapping:** Android `Notification` system, iOS `UNNotification` system

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| System | NEW component (no RN source) | Platform notification APIs | Android: `app/src/main/java/com/laneshadow/ui/molecules/PlatformNotificationTemplate.kt`<br>iOS: `app/ui/molecules/PlatformNotificationTemplate.swift` | 2 variants: navigation, download |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property for this net-new component.

> **Note**: This component uses platform-native notification APIs (not React Native). Styling is limited to what each platform's notification system supports.

### Android — Notification Layout

**Source files read:**
- Specification: UC-NAV-07, UC-OFFL-09 (navigation/offline use cases)
- Design: Cross-platform OS notification template

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | smallIcon | UC spec | App icon | `setSmallIcon(R.drawable.ic_notification)` | n/a | n/a |
| Layout | largeIcon | UC spec | LaneShadow logo | `setLargeIcon(largeIconBitmap)` | n/a | n/a |
| Typography | title | UC spec | `semantic.type.title.md` | `NotificationCompat.Builder.setContentTitle(...)` | `UNMutableNotificationContent.title` | `type.title.md` |
| Typography | body | UC spec | `semantic.type.body.sm` | `setContentText(...)` | `.body` | `type.body.sm` |
| Visual | color | UC spec | `semantic.color.primary.default` | `setColor(Color.parseColor("#B87333"))` | n/a | `color.primary.default` |
| Layout | priority | UC spec | `HIGH` (navigation) / `DEFAULT` (download) | `setPriority(PRIORITY_HIGH)` | n/a | n/a |
| Layout | category | UC spec | `navigation` / `progress` | `setCategory(Category.NAVIGATION)` / `setCategory(Category.PROGRESS)` | `.categoryIdentifier` | n/a |
| Layout | ongoing | UC spec | `true` (navigation) | `setOngoing(true)` | n/a | n/a |

### Android — Navigation Notification

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | title | UC spec | "Navigating" | `setContentTitle("Navigating")` | `.title = "Navigating"` | n/a |
| Typography | body | UC spec | Current street name | `setContentText(streetName)` | `.body = streetName` | n/a |
| Action | stop | UC spec | "Stop" button | `addAction(R.drawable.ic_stop, "Stop", stopIntent)` | `.actions = [UNNotificationAction(...)]` | n/a |

### Android — Download Notification

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | title | UC spec | "Downloading region" | `setContentTitle("Downloading region")` | `.title = "Downloading region"` | n/a |
| Typography | body | UC spec | Region name + progress | `setContentText("$regionName • $progress%")` | `.body = "$regionName • $progress%"` | n/a |
| Visual | progress | UC spec | Indeterminate or 0-100 | `setProgress(max, current, indeterminate)` | n/a | n/a |
| Action | cancel | UC spec | "Cancel" button | `addAction(R.drawable.ic_cancel, "Cancel", cancelIntent)` | `.actions = [UNNotificationAction(...)]` | n/a |

### iOS — Notification Layout

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | badge | UC spec | App icon (set at app level) | n/a | App badge | n/a |
| Typography | title | UC spec | `semantic.type.title.md` | n/a | `UNMutableNotificationContent.title` | `type.title.md` |
| Typography | body | UC spec | `semantic.type.body.sm` | n/a | `.body` | `type.body.sm` |
| Layout | sound | UC spec | `default` | n/a | `.sound = .default` | n/a |
| Layout | category | UC spec | `navigation` / `progress` | n/a | `.categoryIdentifier = "navigation"` / `"progress"` | n/a |

### iOS — Navigation Notification

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | title | UC spec | "Navigating" | n/a | `.title = "Navigating"` | n/a |
| Typography | body | UC spec | Current street name | n/a | `.body = streetName` | n/a |
| Action | stop | UC spec | "Stop" action | n/a | `.actions = [UNNotificationAction(identifier: "stop", title: "Stop")]` | n/a |

### iOS — Download Notification

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | title | UC spec | "Downloading region" | n/a | `.title = "Downloading region"` | n/a |
| Typography | body | UC spec | Region name + progress | n/a | `.body = "$regionName • $progress%"` | n/a |
| Action | cancel | UC spec | "Cancel" action | n/a | `.actions = [UNNotificationAction(identifier: "cancel", title: "Cancel")]` | n/a |

---

## DESIGN NOTES

- **Net-new component** for Sprint 2 delta
- Cross-platform OS notification template
- Platform-specific implementation (not React Native)
- Android: `NotificationCompat.Builder`
- iOS: `UNMutableNotificationContent`
- Two variants: navigation (ongoing) and download (progress)
- Consolidates `NavigationNotification` + `BackgroundDownloadNotification`
- **Critical**: Android foreground service for navigation

---

## VERIFICATION GATES

- Notification appears in shade/center
- Title and body readable
- Actions (stop/cancel) work
- Navigation notification is ongoing
- Download notification shows progress

---

## DEPENDENCIES

- UI-001 (core theme contract)
- Android notification system (`androidx.core.app.NotificationCompat`)
- iOS notification system (`UserNotifications.framework`)
- Navigation service (Android foreground service)

---

## COMPOSITION

- PlatformNotificationTemplate = Platform notification + [title, body, actions]
- Used by: NavigationService, OfflineDownloadService
- NOT in component catalog (platform infrastructure)
