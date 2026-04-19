# VoiceListeningVisualizer — STYLE PROPERTIES MATRIX

**Component:** VoiceListeningVisualizer
**Level:** Atom (Delta)
**Source:** UC-VOICE-02 (NEW for Sprint 2)
**Platform Mapping:** Android `Canvas` waveform, iOS `Shape` waveform

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Visual | NEW component (no RN source) | Canvas drawing APIs | Android: `app/src/main/java/com/laneshadow/ui/atoms/VoiceListeningVisualizer.kt`<br>iOS: `app/ui/atoms/VoiceListeningVisualizer.swift` | 2 states: idle, listening |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property for this net-new component.

### Layout — Visualizer Container

**Source files read:**
- Specification: UC-VOICE-02 (voice assistant use case)
- Design: Real-time audio amplitude waveform

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | width | UC spec | Full width of container | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | height | UC spec | `80` | `Modifier.height(80.dp)` | `.frame(height: 80)` | ESCALATE — propose `size.visualizerHeight = 80` |
| Visual | backgroundColor | UC spec | `transparent` | `Color.Transparent` | `.clear` | n/a |

### Visual — Waveform Bars

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | barCount | UC spec | `32` bars | `draw 32 bars` | `32 bars` | n/a |
| Layout | barWidth | UC spec | `2` | `draw 2.dp` | `width: 2` | ESCALATE — propose `size.visualizerBarWidth = 2` |
| Layout | barGap | UC spec | `4` | `gap 4.dp` | `spacing: 4` | ESCALATE — `space.xs` |
| Visual | barColor (idle) | UC spec | `semantic.color.onSurface.disabled` | `LaneShadowTheme.colors.onSurfaceDisabled` | `theme.colors.onSurfaceDisabled` | `color.onSurface.disabled` |
| Visual | barColor (active) | UC spec | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | barCornerRadius | UC spec | `1` | `RoundedCornerShape(1.dp)` | `RoundedRectangle(cornerRadius: 1)` | ESCALATE — `radius.none = 0` (closest) |
| Animation | amplitude | UC spec | 0-100 based on mic level | `animateFloatAsState(...)` | `@State var amplitude: CGFloat` | n/a |
| Animation | duration | UC spec | `50ms` update rate | `LaunchedEffect` with `delay(50)` | `.onReceive(timer)` | n/a |

### Visual — Glow Effect

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Visual | shadowColor | UC spec | `primary.default` with alpha 0.3 | `shadowColor = primary.copy(alpha = 0.3f)` | `.shadow(color:.primary.opacity(0.3))` | `color.primary.default` + alpha |
| Visual | shadowRadius | UC spec | `8` | `shadowRadius = 8.dp` | `radius: 8` | ESCALATE — `shadow.visualizerGlow = 8` |

---

## DESIGN NOTES

- **Net-new component** for Sprint 2 delta
- Real-time audio amplitude waveform
- 32 bars that animate based on mic level
- Idle state: flat gray bars
- Active state: bars bounce with audio
- Smooth animation (50ms updates)
- Glow effect when active
- Used in VoiceAssistantOverlay

---

## VERIFICATION GATES

- Bars animate smoothly
- Mic level drives amplitude
- Idle state shows flat bars
- Active state shows bouncing bars
- Glow effect visible when active

---

## DEPENDENCIES

- UI-001 (core theme contract)
- Audio input system (Android `AudioRecord`, iOS `AVAudioEngine`)
- Animation system

---

## COMPOSITION

- VoiceListeningVisualizer = Canvas + [32 animated bars]
- Used by: VoiceAssistantOverlay organism
