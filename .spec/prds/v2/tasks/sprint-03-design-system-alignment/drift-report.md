# ALIGN-01 Drift Report

Audit scope:
- Canonical color/theme values: `.spec/design/system/tokens/theme.light.json` and `.spec/design/system/tokens/theme.dark.json`
- Canonical map style values: `tokens/semantic/mapbox.tokens.json`
- Canonical dimensions values: `tokens/semantic/dimensions.tokens.json`
- Current generated outputs: `tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift` and `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt`

Notes:
- Rows below use canonical dotted paths from the theme JSONs or semantic schemas, not emitted accessor names.
- `Tokens.swift` carries light and dark values for the color tokens it emits, so its drift is primarily omissions and naming rewrites.
- `Tokens.kt` emits only a single literal for color tokens. When the canonical dark value differs from the light value, Android has a discrete `WRONG_VALUE` drift even if the key exists by name.
- Canonical theme `stroke.*` tokens and the dimensions stroke trio are audited separately. They are distinct contracts.

## Missing Rows

| Key Path | Expected Light | Expected Dark | iOS Status | Android Status |
| --- | --- | --- | --- | --- |
| surface.scrim-soft | rgba(34,24,16,0.18) | rgba(10,6,3,0.28) | MISSING | MISSING |
| surface.map | #FDFBF8 | #2D2218 | MISSING | MISSING |
| border.glass | rgba(255,255,255,0.55) | rgba(242,238,232,0.22) | MISSING | MISSING |
| signal.hover | #F3A164 | #F3A164 | MISSING | MISSING |
| action.primary-disabled | #EDE7E1 | #3D3228 | MISSING | MISSING |
| status.info-tint | #DBEAFE | rgba(58,139,227,0.18) | MISSING | MISSING |
| status.success-tint | #DCFCE7 | rgba(77,132,112,0.22) | MISSING | MISSING |
| status.warning-tint | #FEF3C7 | rgba(196,111,27,0.22) | MISSING | MISSING |
| status.error-tint | #FEE2E2 | rgba(201,66,60,0.22) | MISSING | MISSING |
| status.recording | #C9423C | #C9423C | MISSING | MISSING |
| map.paper | #FDFBF8 | #2D2218 | MISSING | MISSING |
| map.contour | rgba(73,69,79,0.22) | rgba(242,238,232,0.22) | MISSING | MISSING |
| map.contour-faint | rgba(73,69,79,0.10) | rgba(242,238,232,0.10) | MISSING | MISSING |
| map.style.light | mapbox://styles/laneshadow/clxwarm01 | mapbox://styles/laneshadow/clxwarm01 | MISSING | MISSING |
| map.style.dark | mapbox://styles/laneshadow/clxnight02 | mapbox://styles/laneshadow/clxnight02 | MISSING | MISSING |
| stroke.sm | 1 | 1 | MISSING | MISSING |
| stroke.md | 1.5 | 1.5 | MISSING | MISSING |
| stroke.lg | 2 | 2 | MISSING | MISSING |
| sizing.stroke.sm | 1 | 1 | MISSING | MISSING |
| sizing.stroke.md | 2 | 2 | MISSING | MISSING |
| sizing.stroke.lg | 3 | 3 | MISSING | MISSING |
| radius.none | 0 | 0 | MISSING | MISSING |
| radius.xs | 2 | 2 | MISSING | MISSING |
| radius.sm | 4 | 4 | MISSING | MISSING |
| radius.md | 6 | 6 | MISSING | MISSING |
| radius.lg | 10 | 10 | MISSING | MISSING |
| radius.xl | 16 | 16 | MISSING | MISSING |
| radius.2xl | 18 | 18 | MISSING | MISSING |
| radius.pill | 999 | 999 | MISSING | MISSING |
| size.touch-min | 44 | 44 | MISSING | MISSING |
| size.control-sm | 28 | 28 | MISSING | MISSING |
| size.control-md | 36 | 36 | MISSING | MISSING |
| size.control-lg | 48 | 48 | MISSING | MISSING |
| size.control-chat | 54 | 54 | MISSING | MISSING |
| size.control-xl | 56 | 56 | MISSING | MISSING |
| size.avatar-xs | 20 | 20 | MISSING | MISSING |
| size.avatar-sm | 28 | 28 | MISSING | MISSING |
| size.avatar-md | 36 | 36 | MISSING | MISSING |
| size.avatar-lg | 48 | 48 | MISSING | MISSING |
| size.avatar-xl | 64 | 64 | MISSING | MISSING |
| opacity.0 | 0 | 0 | MISSING | MISSING |
| opacity.subtle | 0.08 | 0.08 | MISSING | MISSING |
| opacity.focus | 0.12 | 0.12 | MISSING | MISSING |
| opacity.disabled | 0.38 | 0.38 | MISSING | MISSING |
| opacity.overlay | 0.60 | 0.60 | MISSING | MISSING |
| opacity.dim | 0.76 | 0.76 | MISSING | MISSING |
| opacity.veil | 0.92 | 0.92 | MISSING | MISSING |
| opacity.1 | 1 | 1 | MISSING | MISSING |
| elev.card | 0 2px 6px rgba(34,24,16,0.06) | 0 2px 6px rgba(0,0,0,0.24) | MISSING | MISSING |
| elev.chrome | 0 1px 3px rgba(34,24,16,0.04), 0 4px 14px rgba(34,24,16,0.06) | 0 1px 3px rgba(0,0,0,0.24), 0 4px 14px rgba(0,0,0,0.28) | MISSING | MISSING |
| elev.overlay | 0 8px 24px rgba(34,24,16,0.10), 0 2px 6px rgba(34,24,16,0.06) | 0 8px 24px rgba(0,0,0,0.42), 0 2px 6px rgba(0,0,0,0.28) | MISSING | MISSING |
| duration.instant | 0 | 0 | MISSING | MISSING |
| duration.fast | 120 | 120 | MISSING | MISSING |
| duration.standard | 240 | 240 | MISSING | MISSING |
| duration.slow | 400 | 400 | MISSING | MISSING |
| duration.deliberate | 600 | 600 | MISSING | MISSING |
| ease.standard | cubic-bezier(0.4,0.0,0.2,1.0) | cubic-bezier(0.4,0.0,0.2,1.0) | MISSING | MISSING |
| ease.emphasized | cubic-bezier(0.2,0.0,0.0,1.0) | cubic-bezier(0.2,0.0,0.0,1.0) | MISSING | MISSING |
| ease.decelerated | cubic-bezier(0.0,0.0,0.2,1.0) | cubic-bezier(0.0,0.0,0.2,1.0) | MISSING | MISSING |
| ease.accelerated | cubic-bezier(0.4,0.0,1.0,1.0) | cubic-bezier(0.4,0.0,1.0,1.0) | MISSING | MISSING |
| ease.linear | linear | linear | MISSING | MISSING |

## Wrong-Valued Android Rows

These rows already exist semantically in `Tokens.kt`, but Android serializes only the light literal and cannot represent the canonical dark value.

| Key Path | Expected Light | Expected Dark | iOS Status | Android Status |
| --- | --- | --- | --- | --- |
| surface.primary | #F8F7F6 | #221810 | MATCH | WRONG_VALUE (`Surface.primary = #F8F7F6`) |
| surface.card | #FDFBF8 | #2D2218 | MATCH | WRONG_VALUE (`Surface.card = #FDFBF8`) |
| surface.inset | #F2EFED | #362A1F | MATCH | WRONG_VALUE (`Surface.inset = #F2EFED`) |
| surface.overlay | rgba(253,251,248,0.92) | rgba(45,34,24,0.92) | MATCH | WRONG_VALUE (`Surface.overlay = rgba(253,251,248,0.92)`) |
| surface.glass | rgba(253,251,248,0.72) | rgba(45,34,24,0.72) | MATCH | WRONG_VALUE (`Surface.glass = rgba(253,251,248,0.72)`) |
| surface.scrim | rgba(34,24,16,0.35) | rgba(10,6,3,0.50) | MATCH | WRONG_VALUE (`Surface.scrim = rgba(34,24,16,0.35)`) |
| content.primary | #1E1A16 | #F2EEE8 | MATCH | WRONG_VALUE (`Content.primary = #1E1A16`) |
| content.secondary | #49454F | #CAC4D0 | MATCH | WRONG_VALUE (`Content.secondary = #49454F`) |
| content.tertiary | #6B6460 | #9CA3AF | MATCH | WRONG_VALUE (`Content.tertiary = #6B6460`) |
| content.subtle | #9CA3AF | #6B6460 | MATCH | WRONG_VALUE (`Content.subtle = #9CA3AF`) |
| border.default | #E5DED9 | rgba(242,238,232,0.12) | MATCH | WRONG_VALUE (`Border.default = #E5DED9`) |
| border.subtle | #EDE7E1 | rgba(242,238,232,0.07) | MATCH | WRONG_VALUE (`Border.subtle = #EDE7E1`) |
| border.strong | #C9BDB3 | rgba(242,238,232,0.22) | MATCH | WRONG_VALUE (`Border.strong = #C9BDB3`) |

## naming.mismatch

Observed canonical-path vs emitted-name divergences:

| Canonical token path | iOS emitted shape | Android emitted shape | Note |
| --- | --- | --- | --- |
| content.on-signal | `LaneShadowTheme.color.content.onSignal` | `LaneShadowTheme.color.Content.onSignal` | kebab-case leaf becomes camelCase accessor |
| action.primary-hover | `LaneShadowTheme.color.action.primary.hover` | `LaneShadowTheme.color.Action.Primary.hover` | canonical hyphenated leaf is rewritten into nested groups |
| action.primary-pressed | `LaneShadowTheme.color.action.primary.pressed` | `LaneShadowTheme.color.Action.Primary.pressed` | same kebab-case to nested-group rewrite |
| space.0 | `LaneShadowTheme.spacing.s0` | not emitted | numeric key is renamed to `s0` on iOS; Android omits the spacing group |
| space.1 | `LaneShadowTheme.spacing.s1` | not emitted | numeric key is renamed to `s1` on iOS; Android omits the spacing group |
| space.2 | `LaneShadowTheme.spacing.s2` | not emitted | numeric key is renamed to `s2` on iOS; Android omits the spacing group |
| space.3 | `LaneShadowTheme.spacing.s3` | not emitted | numeric key is renamed to `s3` on iOS; Android omits the spacing group |
| space.4 | `LaneShadowTheme.spacing.s4` | not emitted | numeric key is renamed to `s4` on iOS; Android omits the spacing group |
| space.5 | `LaneShadowTheme.spacing.s5` | not emitted | numeric key is renamed to `s5` on iOS; Android omits the spacing group |
| space.6 | `LaneShadowTheme.spacing.s6` | not emitted | numeric key is renamed to `s6` on iOS; Android omits the spacing group |
| space.7 | `LaneShadowTheme.spacing.s7` | not emitted | numeric key is renamed to `s7` on iOS; Android omits the spacing group |
| space.8 | `LaneShadowTheme.spacing.s8` | not emitted | numeric key is renamed to `s8` on iOS; Android omits the spacing group |
| space.9 | `LaneShadowTheme.spacing.s9` | not emitted | numeric key is renamed to `s9` on iOS; Android omits the spacing group |
| space.10 | `LaneShadowTheme.spacing.s10` | not emitted | numeric key is renamed to `s10` on iOS; Android omits the spacing group |
| space.11 | `LaneShadowTheme.spacing.s11` | not emitted | numeric key is renamed to `s11` on iOS; Android omits the spacing group |
| space.12 | `LaneShadowTheme.spacing.s12` | not emitted | numeric key is renamed to `s12` on iOS; Android omits the spacing group |
| size.icon-xs | not emitted | `LaneShadowTheme.sizing.icon.xs` | theme `size.icon-xs` is renamed under `sizing.icon.xs`; Android value matches 12 |
| size.icon-sm | not emitted | `LaneShadowTheme.sizing.icon.sm` | theme `size.icon-sm` is renamed under `sizing.icon.sm`; Android value matches 16 |
| size.icon-md | not emitted | `LaneShadowTheme.sizing.icon.md` | Android renames the key and emits 20 instead of canonical 18 |
| size.icon-lg | not emitted | `LaneShadowTheme.sizing.icon.lg` | theme `size.icon-lg` is renamed under `sizing.icon.lg`; Android value matches 24 |
| size.icon-xl | not emitted | `LaneShadowTheme.sizing.icon.xl` | theme `size.icon-xl` is renamed under `sizing.icon.xl`; Android value matches 32 |

## Android-Specific Drift

- `Tokens.kt` has no dark-variant carrier for any emitted color token. The `WRONG_VALUE` table above enumerates every canonical key whose generated Android value is locked to the light literal while the dark value differs.
- `Tokens.kt` also omits entire groups that are required for the second-theme migration: `map.*`, `elev.*`, `duration.*`, `ease.*`, canonical theme `stroke.*`, `radius.*`, `opacity.*`, and multiple `size.*` families.
- Android's only emitted size family is `sizing.icon.*`, which rewrites the canonical `size.icon-*` keys and changes the medium value from 18 to 20.

## Legacy-Theme Dependencies

- Native token generation still treats theme JSON and dimensions JSON as separate authorities. Theme-owned families such as `radius.*`, `opacity.*`, and most `size.*` keys never reach `Tokens.swift` or `Tokens.kt`, so atoms cannot switch to Copper by theme alone.
- The dimensions schema splits `size.touch-min` into platform-specific `dimensions.sizing.touchTarget.ios/android` before generation, so the canonical theme key has no native accessor on either platform.
- The dimensions schema diverges from the theme contract for radius values (`radius.sm/md/lg/xl`) and drops `radius.2xl` entirely, which would block a clean second-theme migration even if native generation were extended tomorrow.
- Android's generated icon sizing already drifts from the theme contract at `size.icon-md`: the canonical theme value is 18, while `LaneShadowTheme.sizing.icon.md` emits 20.
