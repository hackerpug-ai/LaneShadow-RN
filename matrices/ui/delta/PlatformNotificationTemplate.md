# PlatformNotificationTemplate - STYLE PROPERTIES MATRIX

**Component:** PlatformNotificationTemplate (DELTA)
**Level:** Molecule
**RN Source:** **NEW COMPONENT — NO RN BASELINE**
**Framework Primitives:** Platform-specific notification APIs

---

## DELTA CONTEXT

**Source UC:** UC-NAV-07, UC-OFFL-09 — Cross-platform OS notification template

**Rationale:** Net-new component consolidating platform-specific notification handling. Android foreground service + iOS background task notifications. UI is platform-native, not custom component.

**Migration path:** Native-only notification integration:
- Android: `Service` + `Notification` + `NotificationChannel`
- iOS: `BGTaskScheduler` + `UNNotification`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| UC Spec | `.spec/prds/native-rewrite/09-uc-navigation.md`, `11-uc-offline.md` | UC-NAV-07, UC-OFFL-09 requirements |

---

## STYLE PROPERTIES MATRIX

**Note:** This is a PLATFORM INFRASTRUCTURE component, not a UI component. The notification UI is rendered by the OS, not by our app. The matrix below documents the notification configuration properties.

### Android — Notification Configuration

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| channelId | Task spec | `'lane_shadow_nav'` | `NotificationChannel("lane_shadow_nav", ...)` | n/a (iOS) | n/a |
| channelName | Task spec | `'Navigation'` | `"Navigation"` | n/a (iOS) | n/a |
| importance | Task spec | `IMPORTANCE_LOW` | `NotificationManager.IMPORTANCE_LOW` | n/a (iOS) | n/a |
| smallIcon | Task spec | `ic_notification` | `R.drawable.ic_notification` | n/a (iOS) | n/a |
| contentTitle | Task spec | Dynamic (e.g., "Navigating...") | `setContentTitle("Navigating...")` | n/a (iOS) | n/a |
| contentText | Task spec | Dynamic (e.g., "Distance to turn: 200m") | `setContentText("Distance to turn: 200m")` | n/a (iOS) | n/a |
| priority | Task spec | `PRIORITY_LOW` | `Notification.PRIORITY_LOW` | n/a (iOS) | n/a |
| category | Task spec | `CATEGORY_SERVICE` | `setCategory(Notification.CATEGORY_SERVICE)` | n/a (iOS) | n/a |
| ongoing | Task spec | `true` | `setOngoing(true)` | n/a (iOS) | n/a |
| foregroundServiceType | Task spec | `FOREGROUND_SERVICE_TYPE_LOCATION` | `setForegroundServiceType(FOREGROUND_SERVICE_TYPE_LOCATION)` | n/a (iOS) | n/a |

### iOS — Notification Configuration

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| identifier | Task spec | `'com.laneshadow.download'` | n/a (Android) | `UNNotificationIdentifier("com.laneshadow.download")` | n/a |
| title | Task spec | Dynamic (e.g., "Downloading Maps...") | n/a (Android) | `content.title = "Downloading Maps..."` | n/a |
| body | Task spec | Dynamic (e.g., "245 MB remaining") | n/a (Android) | `content.body = "245 MB remaining"` | n/a |
| categoryIdentifier | Task spec | `'DOWNLOAD'` | n/a (Android) | `UNNotificationCategoryIdentifier("DOWNLOAD")` | n/a |
| sound | Task spec | `default` | n/a (Android) | `.sound = .default` | n/a |
| badge | Task spec | `1` | n/a (Android) | `.badge = 1` | n/a |

### State — Props

| State | Source | Type | Android | iOS | Token |
|---|---|---|---|---|---|
| type | Task spec | `'navigation'` or `'download'` | `val type: NotificationType` | `var type: NotificationType` | n/a |
| title | Task spec | `String` | `val title: String` | `var title: String` | n/a |
| body | Task spec | `String` | `val body: String` | `var body: String` | n/a |
| isOngoing | Task spec | `Boolean` | `val isOngoing: Boolean` | `var isOngoing: Bool` | n/a |
| progress | Task spec | `Int?` (0-100) | `val progress: Int?` | `var progress: Int?` | n/a |

---

## NOTES

- **PLATFORM INFRASTRUCTURE:** Not a visual UI component
- **Android:** Foreground service with notification
- **iOS:** Background task with notification
- **Notification UI:** Rendered by OS, not custom
- **Use cases:**
  - Navigation: "Navigating..." with distance to turn
  - Download: "Downloading Maps..." with progress
- **Configuration:** Channel/category setup, icons, priority
- **Platform differences:**
  - Android: NotificationChannel, foregroundServiceType
  - iOS: UNNotification, BGTaskScheduler
- **Accessibility:** OS handles notification accessibility
- **TestID:** None (platform component)
