# VoiceListeningVisualizer - STYLE PROPERTIES MATRIX

**Component:** VoiceListeningVisualizer (DELTA)
**Level:** Atom
**RN Source:** **NEW COMPONENT — NO RN BASELINE**
**Framework Primitives:** Platform-specific audio visualization APIs

---

## DELTA CONTEXT

**Source UC:** UC-VOICE-02 — Real-time audio amplitude waveform visualization

**Rationale:** Net-new component for voice assistant push-to-talk feature. Requires continuous microphone level visualization that cannot be expressed with existing `Progress` or `TypingIndicator` components.

**Migration path:** Native-only implementation using platform audio APIs:
- Android: `android.media.Visualizer` + `Canvas` drawing
- iOS: `AVAudioEngine` + `AVAudioNode` + SwiftUI waveform rendering

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| UC Spec | `.spec/prds/native-rewrite/13-uc-voice-assistant.md` | UC-VOICE-02 requirements |
| Framework (Android) | `android.media.Visualizer` | Audio waveform data |
| Framework (iOS) | `AVFoundation.AVAudioEngine` | Audio waveform data |

---

## STYLE PROPERTIES MATRIX

### Layout — Container (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| width | Task spec | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| height | Task spec | `80` (waveform height) | `Modifier.height(80.dp)` | `.frame(height: 80)` | ESCALATE — propose `layout.waveformHeight = 80` |
| backgroundColor | Task spec | `color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| borderRadius | Task spec | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| overflow | Task spec | `'hidden'` (clip waveform) | `Modifier.clip(shape)` | `.clipped()` | n/a |

### Visual — Waveform (platform-specific)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|
| waveformType | Task spec | `amplitude bars` | `Visualizer.MeasurementMode.PEAK_RMS` | `AVAudioNode` FFT analysis | n/a |
| barCount | Task spec | `32` | Draw 32 bars | Draw 32 bars | n/a |
| barWidth | Task spec | `4` | `4.dp` | `4` | ESCALATE — propose `size.waveformBarWidth = 4` |
| barGap | Task spec | `2` | `2.dp` | `2` | ESCALATE — propose `space.waveformBarGap = 2` |
| minBarHeight | Task spec | `4` | `4.dp` | `4` | ESCALATE — propose `size.waveformMinBarHeight = 4` |
| maxBarHeight | Task spec | `64` | `64.dp` | `64` | ESCALATE — propose `size.waveformMaxBarHeight = 64` |

### Visual — Bar Color (by amplitude)

| Amplitude | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| low | color | Task spec | `color.primary.default` | Primary | Primary | `color.primary.default` |
| medium | color | Task spec | `color.primary.dark` (if exists) | Primary variant | Primary variant | ESCALATE — verify token |
| high | color | Task spec | `color.warning.default` | Warning | Warning | `color.warning.default` |

### State — Props

| State | Source | Type | Android | iOS | Token |
|---|---|---|---|---|---|
| isRecording | Task spec | `Boolean` | `val isRecording: Boolean` | `var isRecording: Bool` | n/a |
| amplitude | Task spec | `Float` (0-1) | `val amplitude: Float` | `var amplitude: Float` | n/a |

---

## NOTES

- **NEW component:** No RN baseline exists
- **Platform-specific:** Uses native audio visualization APIs
- **Waveform type:** Amplitude bars (32 bars)
- **Bar dimensions:** 4px wide, 2px gap, 4-64px height
- **Color coding:** Primary (low), primary-dark (medium), warning (high)
- **Real-time:** Updates continuously during recording
- **Container:** 80px tall, surfaceVariant background, rounded corners
- **Clipping:** Waveform clipped to container bounds
- **Accessibility:** `accessibilityLabel` = "Recording waveform", `accessibilityRole` = "image"
