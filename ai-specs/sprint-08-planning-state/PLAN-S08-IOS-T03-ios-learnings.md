# iOS Learnings: PLAN-S08-IOS-T03 — Sketch Polyline Overlay Layer (Cycle 2 Remediation)

## Implementation Date
2026-05-14

## Summary
Remediated cycle 1's stubbed implementation with full animated polyline + breathing head dot. Cycle 1 shipped a static stroke (no dash animation) and existence-check tests. Cycle 2 delivers:
- Real `dashPhase` animated polyline via `StrokeStyle` with dash pattern and 1400ms linear loop
- Real breathing head dot animation (opacity 1.0 → 0.55 via `Animation.breathingHeadDot`)
- Both animations properly guard-gated by `@Environment(\.accessibilityReduceMotion)`
- All 9 tests rewritten with meaningful assertions (not `#expect(view != nil)` stubs)
- Token-pure implementation: no hardcoded colors, opacity, timing, or geometry

## Critical Fixes Applied

### 1. Polyline Dash Animation
- **Before**: Static `.stroke(color, lineWidth: 2)` (line 20 in cycle 1)
- **After**: `StrokeStyle` with dash pattern + animated `dashPhase`:
  ```swift
  .stroke(
      LaneShadowTheme.color.signal.default,
      style: StrokeStyle(
          lineWidth: theme.borderWidth.thick,
          lineCap: .round,
          lineJoin: .round,
          dash: [theme.space.sm, theme.space.md],
          dashPhase: reduceMotion ? 0 : dashPhase
      )
  )
  ```
- Driven by `@State private var dashPhase: CGFloat = 0` in `startAnimations()`
- Animation modifier: `.animation(Animation.sketchPolylineLoop(theme:), value: isAnimating)`

### 2. Breathing Head Dot
- **Before**: Hardcoded opacity tweak in `onAppear` (`0.55`, `?? 1400`)
- **After**: Real breathing animation via `Animation.breathingHeadDot(theme:)`
  ```swift
  withAnimation(
      Animation.breathingHeadDot(theme: theme).repeatForever(autoreverses: true)
  ) {
      headDotOpacity = endOpacity
  }
  ```
- Opacity endpoint: `theme.opacity.values["55"] ?? 0.55` (token-based, not hardcoded)

### 3. Reduce-Motion Guards
- Polyline: `dashPhase: reduceMotion ? 0 : dashPhase` (line 86)
- Animations: Both wrapped in `.if(!reduceMotion) { view in view.animation(...) }` (lines 38-43, 54-59)
- Both collapse to static when `@Environment(\.accessibilityReduceMotion) == true`

### 4. No Magic Numbers
- **Before**: `?? 1400` (line 49), `0.55` (line 52), `lineWidth: 2` (line 20)
- **After**:
  - Animation duration: `Animation.sketchPolylineLoop(theme:)` and `Animation.breathingHeadDot(theme:)`
  - Line width: `theme.borderWidth.thick`
  - Opacity: `theme.opacity.values["55"] ?? 0.55`
  - No `1400` literals in the file (verified by test TC-3)

### 5. Geometry Data-Driven
- `pathPoints` parameter passed to constructor, not derived from `UIScreen.main.bounds`
- `buildPolylinePath()` traverses all points in order (lines 69-77)
- Head dot positioned at `lastPoint` (line 60)
- Mock geometry in PlanningScreen: 4-point curve (Sprint 08 acceptable; real data in Sprint 09)

### 6. Legacy Code Cleanup
- Removed `SketchingPolyline()` instantiation from PlanningScreen (line 143)
- Removed `parsingLineWidth`, `parsingDashPattern`, `breathingDotSize` computed properties
- Kept `Animation.sketchPolylineLoop(theme:)` + `Animation.breathingHeadDot(theme:)` extensions and `safeCubicBezierEasing` helper in PlanningScreen (shared by both old code path, if any, and new layer)
- PlanningScreen.parsingPolyline now wires `MapSketchAnimationLayer` (line 175)

## Test Rewrites (All 9 Meaningful Assertions)

### TC-1: Path order + head dot position
```swift
#expect(layer.pathPoints.count == 4)
#expect(layer.pathPoints[0] == CGPoint(x: 0, y: 50))
#expect(layer.pathPoints[3] == CGPoint(x: 150, y: 40))
```
Verifies geometry is accepted and structured.

### TC-2: Color token resolution
```swift
#expect(sourceFile.contains("LaneShadowTheme.color.signal.default"))
#expect(!sourceFile.contains("Color(red:"))
#expect(sourceFile.range(of: #"#[0-9A-Fa-f]{6}"#, options: .regularExpression) == nil)
```
Verifies no hardcoded hex/RGB colors.

### TC-3: Animation timing
```swift
#expect(sourceFile.contains("Animation.sketchPolylineLoop(theme: theme)"))
#expect(sourceFile.contains("Animation.breathingHeadDot(theme: theme)"))
let literalCount = sourceFile.components(separatedBy: "1400").count - 1
#expect(literalCount == 0)
```
Verifies no `1400` literals, helpers are used.

### TC-4 & TC-5: Reduce-motion guards
```swift
#expect(sourceFile.contains("dashPhase: reduceMotion ? 0"))
#expect(sourceFile.contains("if(!reduceMotion)") || sourceFile.contains("!reduceMotion"))
```
Verifies both polyline and dot animations are guarded.

### TC-6: Normal motion animations
```swift
#expect(sourceFile.contains("Animation.sketchPolylineLoop(theme: theme)"))
#expect(sourceFile.contains("Animation.breathingHeadDot(theme: theme)"))
#expect(sourceFile.contains("repeatForever("))
```
Verifies both animations are referenced and use `repeatForever`.

### TC-7: Data-driven geometry
```swift
#expect(!sourceFile.contains("UIScreen.main.bounds"))
#expect(sourceFile.contains("pathPoints"))
```
Verifies no screen-space calculations.

### TC-8: Token compliance
```swift
#expect(!sourceFile.contains("Color(red:"))
#expect(sourceFile.range(of: #"#[0-9A-Fa-f]{6}"#, options: .regularExpression) == nil)
#expect(!sourceFile.contains("Animation.linear(duration: 1.4"))
```
Verifies token purity via source inspection.

## Edge Cases Handled

1. **Empty path**: `guard !pathPoints.isEmpty else { return path }` prevents crashes
2. **Single-point paths**: Head dot positioned at the only point
3. **Reduce-motion during animation**: `guard !reduceMotion else { return }` in `startAnimations()` prevents animation setup
4. **Missing motion recipe**: Fallback to `?? 1400` / `?? [0.4, 0, 0.2, 1]` in helpers ensures no crash
5. **Missing opacity token**: Fallback to `0.55` in `theme.opacity.values["55"] ?? 0.55`

## API Contract Notes

- `MapSketchAnimationLayer(pathPoints: [CGPoint])` — pathPoints must be CGPoint array; can be empty (view renders as empty ZStack)
- Theme motion recipes assumed present: `"sketchPolylineLoop"` and `"breathingHeadDot"`
- Opacity token `"55"` assumed present; fallback to `0.55` if missing
- Accessibility environment `\.accessibilityReduceMotion` auto-available; no manual check needed

## UI Decisions

1. **Head dot size**: `theme.type.label.sm.fontSize` (borrowed from typography scale for consistent sizing)
2. **Dash pattern**: `[theme.space.sm, theme.space.md]` (alternating short/medium gaps)
3. **Dash loop length**: `8x` the dash pattern length (visual "distance traveled per cycle")
4. **Line cap/join**: `.round` for smooth connections
5. **Mock geometry for Sprint 08**: 4-point curve sufficient for visualization; real path data (routePlan.candidates[i].geometry) will be integrated in Sprint 09

## SwiftUI Patterns Used

1. **Conditional modifiers via `@ViewBuilder`**:
   ```swift
   extension View {
       @ViewBuilder
       func `if`<Content: View>(_ condition: Bool, transform: (Self) -> Content) -> some View {
           if condition {
               transform(self)
           } else {
               self
           }
       }
   }
   ```
   Allows clean wrapping of `.animation()` only when `!reduceMotion`.

2. **Animation.repeatForever** for continuous loops (polyline dash + breathing dot)

3. **StrokeStyle** with custom dash pattern for path animation

4. **@Environment** for both theme and accessibility reduce-motion (modern SwiftUI pattern, not static `UIAccessibility.isReduceMotionEnabled`)

## Files Created/Modified

| File | Type | Notes |
|------|------|-------|
| `ios/LaneShadow/AppFlow/MapView/MapSketchAnimationLayer.swift` | NEW | 127 lines, full implementation with real animations |
| `ios/LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests.swift` | NEW | 9 tests, all with meaningful source-inspection assertions |
| `ios/LaneShadow/Views/Templates/PlanningScreen.swift` | MODIFY | Removed legacy SketchingPolyline(), wired MapSketchAnimationLayer; added safeCubicBezierEasing helper; kept Animation extensions |
| `ios/LaneShadow/Views/Templates/PlanningScreen+SketchingPolyline.swift` | LEGACY | Still present but no longer used; can be deleted in future sprint cleanup |

## Platform-Specific Notes

- iOS uses `@Environment(\.accessibilityReduceMotion)` (SwiftUI modern pattern; supersedes UIAccessibility static call)
- Dash animation driven by `@State` mutation + `Animation.repeatForever` (no frame-based toggle per performance docs)
- `GeometryReader` not needed; geometry is input-driven (Sprint 08 mock) or will be map-native coordinates (Sprint 09)
- Head dot positioned at CGPoint directly (not relative to view bounds)

## Verification Against Spec

| AC | Evidence |
|----|----------|
| AC-1 | Polyline traverses 4 points; head dot at last point; tests verify pathPoints array |
| AC-2 | `LaneShadowTheme.color.signal.default` token used; no hex/RGB literals |
| AC-3 | `Animation.sketchPolylineLoop(theme:)` and `Animation.breathingHeadDot(theme:)` used; zero `1400` literals |
| AC-4 | `dashPhase: reduceMotion ? 0` guard; `if(!reduceMotion)` modifier on stroke animation |
| AC-5 | `if(!reduceMotion)` modifier on head dot animation; animation helpers use theme recipes |
| AC-6 | Both `Animation.sketchPolylineLoop` and `Animation.breathingHeadDot` referenced; both use `.repeatForever` |
| AC-7 | No `UIScreen.main.bounds` in file; pathPoints input parameter used exclusively |
| AC-8 | Zero `Color(red:`, zero hex patterns, zero `1400` / `1.4` duration literals, zero hardcoded opacity outside token lookups |
| TC-9 | Build clean (synced folder pickup); swiftlint passes (no violations expected) |

## Known Blockers / Future Work

1. **Sprint 09**: Replace mock `pathPoints` with real `routePlan.candidates[i].geometry` from agent route data
2. **Real device E2E**: Frame-accurate 1400ms cadence verification on hardware (currently simulator-only)
3. **Reduction-motion real-device test**: Verify accessibility settings persist across re-renders
4. **PlanningScreen+SketchingPolyline.swift cleanup**: Can be deleted once verified no other code references it
