# LSGlassPanel — Surface Atom

Translucent chrome floating above the map canvas. Backdrop-blurred, warm-tinted, available in four variants.

## Token Contract

| Property        | Token                  | Resolved (light)             | Resolved (dark)              |
|-----------------|------------------------|------------------------------|------------------------------|
| background      | `--surface-glass`      | rgba(253,251,248,0.72)        | rgba(45,34,24,0.72)           |
| border (base)   | `--border-default`     | `--paper-400`                | rgba(242,238,232,0.12)        |
| border (chrome) | rgba white 55%         | rgba(255,255,255,0.55)        | rgba(242,238,232,0.12)        |
| shadow          | `--elev-overlay`       | 0 8px 24px warm              | 0 8px 24px black              |
| radius          | `--radius-xl`          | 16px                         | 16px                         |
| padding         | `--space-5`            | 16px                         | 16px                         |
| backdrop-blur   | 13px saturate(1.2)     | browser-native               | browser-native               |
| stripe (signal) | `--signal-default`     | `--copper-500`               | `--copper-500`               |
| stripe (warning)| `--status-warning`     | `--status-warning-raw`       | `--status-warning-raw`       |

## Variants

| Class                                    | Description                                      | Use-site                     |
|------------------------------------------|--------------------------------------------------|------------------------------|
| `.ls-glass-panel`                        | Base — translucent, no accent stripe             | Generic map overlay          |
| `.ls-glass-panel--chrome`                | Explicit chrome border (rgba 55%)                | TopBar, ChatInput backing     |
| `.ls-glass-panel--callout-signal`        | 3px leading stripe — `--signal-default`          | Navigator message (LSNavigatorMessage) |
| `.ls-glass-panel--callout-warning`       | 3px leading stripe — `--status-warning`          | Inline error callout          |

## Acceptance Criteria

- AC-1: Background resolves via `--surface-glass` — no raw hex
- AC-2: Shadow resolves via `--elev-overlay`
- AC-3: Radius resolves via `--radius-xl`
- AC-4: Backdrop-filter: blur(13px) saturate(1.2) renders over map imagery
- AC-5: Chrome variant border is rgba(255,255,255,0.55) light / rgba(242,238,232,0.12) dark
- AC-6: Callout-signal stripe resolves via `--signal-default`
- AC-7: Callout-warning stripe resolves via `--status-warning`
- AC-8: All four variants × both themes rendered
- AC-9: Renders correctly over topographic SVG background
