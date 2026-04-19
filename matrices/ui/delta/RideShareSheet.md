# RideShareSheet - STYLE PROPERTIES MATRIX

**Component:** RideShareSheet (DELTA)
**Level:** Organism
**RN Source:** **NEW COMPONENT — NO RN BASELINE**
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js` + platform share APIs

---

## DELTA CONTEXT

**Source UC:** UC-REC-06 — Ride-context share sheet (GPX/link/summary variants)

**Rationale:** Net-new organism for ride-specific sharing. Different from generic share because it needs to format GPX files, generate route links, and create summary text.

**Migration path:** Compose bottom sheet with platform share APIs:
- Android: `Intent.ACTION_SEND` + GPX file provider
- iOS: `UIActivityViewController` + GPX document

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| UC Spec | `.spec/prds/native-rewrite/10-uc-ride-recording.md` | UC-REC-06 requirements |
| BottomSheetWrapper | `react-native/components/sheets/bottom-sheet-wrapper.tsx` | Sheet template (see matrices/ui/templates/BottomSheetWrapper.md) |
| Button | `react-native/components/ui/button.tsx` | Share buttons (see matrices/ui/atoms/Button.md) |

---

## STYLE PROPERTIES MATRIX

### Layout — Root Container (BottomSheetWrapper)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| isVisible | Task spec | `boolean` | `visible: Boolean` | `isPresented: Bool` | n/a |
| onClose | Task spec | `() -> Unit` | `onDismiss: () -> Unit` | `onDismiss: () -> Void` | n/a |
| preset | Task spec | `'half'` | `snapPoints = ['60%']` | `presentationDetents([.fraction(0.6)])` | n/a (percentage) |

### Layout — Content (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| gap | Task spec | `space.md` = 12 | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(end = 12.dp)` between items | `spacing(12)` | `space.md` |

### Typography — Title (Text variant=titleLarge)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | Task spec | `titleLarge` | `MaterialTheme.typography.titleLarge` | Verify against Paper | n/a |
| fontSize | Paper titleLarge | Verify in source | (verify) | (verify) | ESCALATE — verify token |
| color | Task spec | `color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| textAlign | Task spec | `'center'` | `TextStyle(textAlign = TextAlign.Center)` | `.multilineTextAlignment(.center)` | n/a |
| text | Task spec | `'Share Ride'` | `Text("Share Ride")` | `Text("Share Ride")` | n/a |
| marginBottom | Task spec | `space.md` = 12 | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |

### Typography — Subtitle (Text variant=bodyMedium)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | Task spec | `bodyMedium` | `MaterialTheme.typography.bodyMedium` | Verify against Paper | n/a |
| color | Task spec | `color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| textAlign | Task spec | `'center'` | `TextStyle(textAlign = TextAlign.Center)` | `.multilineTextAlignment(.center)` | n/a |
| text | Task spec | `'Choose how to share your ride'` | `Text("Choose how to share your ride")` | `Text("Choose how to share your ride")` | n/a |
| marginBottom | Task spec | `space.lg` = 16 | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` |

### Layout — Share Options (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| gap | Task spec | `space.md` = 12 | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(end = 12.dp)` between items | `spacing(12)` | `space.md` |

### Button — Share as GPX (Button)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| title | Task spec | `'Share as GPX'` | `Button(title = "Share as GPX", ...)` | `Button("Share as GPX")` | n/a |
| variant | Task spec | `'secondary'` | `ButtonVariant.Secondary` | `ButtonVariant.secondary` | n/a |
| icon | Task spec | `'file-export'` | `icon = IconName.FileExport` | `icon: .fileExport` | n/a |
| onPress | Task spec | `onShareGPX` | `onPress = onShareGPX` | `onPress: onShareGPX` | n/a |

### Button — Share Link (Button)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| title | Task spec | `'Share Link'` | `Button(title = "Share Link", ...)` | `Button("Share Link")` | n/a |
| variant | Task spec | `'secondary'` | `ButtonVariant.Secondary` | `ButtonVariant.secondary` | n/a |
| icon | Task spec | `'link'` | `icon = IconName.Link` | `icon: .link` | n/a |
| onPress | Task spec | `onShareLink` | `onPress = onShareLink` | `onPress: onShareLink` | n/a |

### Button — Share Summary (Button)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| title | Task spec | `'Share Summary'` | `Button(title = "Share Summary", ...)` | `Button("Share Summary")` | n/a |
| variant | Task spec | `'secondary'` | `ButtonVariant.Secondary` | `ButtonVariant.secondary` | n/a |
| icon | Task spec | `'text'` | `icon = IconName.Text` | `icon: .text` | n/a |
| onPress | Task spec | `onShareSummary` | `onPress = onShareSummary` | `onPress: onShareSummary` | n/a |

### Platform Share Implementation

| Platform | GPX | Link | Summary |
|---|---|---|---|
| **Android** | `Intent(ACTION_SEND).setType("application/gpx+xml").putExtra(Intent.EXTRA_STREAM, gpxUri)` | `Intent(ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, shareUrl)` | `Intent(ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, summaryText)` |
| **iOS** | `UIActivityViewController(activityItems: [gpxDocument], ...)` | `UIActivityViewController(activityItems: [URL(string: shareUrl)!], ...)` | `UIActivityViewController(activityItems: [summaryText], ...)` |

### State — Props

| State | Source | Type | Android | iOS | Token |
|---|---|---|---|---|---|
| rideId | Task spec | `String` | `val rideId: String` | `var rideId: String` | n/a |
| rideName | Task spec | `String` | `val rideName: String` | `var rideName: String` | n/a |
| gpxData | Task spec | `ByteArray?` | `val gpxData: ByteArray?` | `var gpxData: Data?` | n/a |
| shareUrl | Task spec | `String?` | `val shareUrl: String?` | `var shareUrl: String?` | n/a |
| summaryText | Task spec | `String` | `val summaryText: String` | `var summaryText: String` | n/a |
| onDismiss | Task spec | `() -> Unit` | `onDismiss: () -> Unit` | `onDismiss: () -> Void` | n/a |

---

## NOTES

- **NEW organism:** No RN baseline exists
- **Sheet:** Half-height bottom sheet
- **Title:** "Share Ride" centered
- **Subtitle:** Explains share options
- **Share options:** 3 buttons (GPX, Link, Summary) with icons
- **GPX share:** File provider + GPX MIME type
- **Link share:** URL as plain text
- **Summary share:** Formatted ride summary as plain text
- **Platform APIs:** Intent (Android), UIActivityViewController (iOS)
- **Spacing:** 12px gap between buttons
- **Accessibility:** Each button has descriptive label
- **TestID:** Passed to container
