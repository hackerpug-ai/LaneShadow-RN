Review kb-run task ALIGN-01. Respond with JSON only matching the provided schema.

Task file: /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-03-design-system-alignment/ALIGN-01-audit-token-outputs.md
Checkpoint commit: 11542c485dbe630c2b4d52e7eee2531b3dabacd2
Worktree: /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/ALIGN-01

Requirements:
- AC-1: Surface/border gaps documented [PRIMARY]
- AC-2: map.* gaps documented
- AC-3: sizing.stroke documented
- AC-4: signal/status-tint gaps documented
- AC-5: Android column + naming-mismatch section
- TC-1: drift-report.md exists at the specified path
- TC-2: drift-report.md contains ≥12 distinct MISSING rows
- TC-3: surface.scrim-soft row has expected light rgba(34,24,16,0.18)
- TC-4: map.style.light and map.style.dark rows both present
- TC-5: sizing.stroke.md row records expected value 2
- TC-6: No production Swift or Kotlin files modified

Validation summary:
- drift-report exists
- MISSING row count: 31
- surface.scrim-soft row matches expected light value
- map.style.light + map.style.dark rows both present
- sizing.stroke.md row present with value 2
- signal.hover and status.*-tint rows present
- No Swift or Kotlin production file changes

Diff:
diff --git a/.spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md b/.spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md
new file mode 100644
index 00000000..35906e4c
--- /dev/null
+++ b/.spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md
@@ -0,0 +1,63 @@
+# ALIGN-01 Drift Report
+
+Audit scope:
+- Canonical color values: `.spec/design/system/tokens/theme.light.json` and `.spec/design/system/tokens/theme.dark.json`
+- Canonical map style values: `tokens/semantic/mapbox.tokens.json`
+- Canonical sizing values: `tokens/semantic/dimensions.tokens.json`
+- Current generated outputs: `tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift` and `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt`
+
+Notes:
+- `Tokens.kt` emits light-theme literals only for the color tokens it does contain. Missing rows below capture outright omissions; Android also has a broader dark-mode value drift across the generated color surface.
+- `surface.scrim-soft` is referenced by the sprint acceptance criteria and concept screens (`uc-scr-03-route-results.html`) but is not emitted by either native token output.
+
+## Drift Rows
+
+| Key Path | Expected Light | Expected Dark | iOS Status | Android Status |
+| --- | --- | --- | --- | --- |
+| surface.scrim-soft | rgba(34,24,16,0.18) | rgba(10,6,3,0.28) | MISSING | MISSING |
+| surface.map | #FDFBF8 | #2D2218 | MISSING | MISSING |
+| border.glass | rgba(255,255,255,0.55) | rgba(242,238,232,0.22) | MISSING | MISSING |
+| signal.hover | #F3A164 | #F3A164 | MISSING | MISSING |
+| action.primary-disabled | #EDE7E1 | #3D3228 | MISSING | MISSING |
+| status.info-tint | #DBEAFE | rgba(58,139,227,0.18) | MISSING | MISSING |
+| status.success-tint | #DCFCE7 | rgba(77,132,112,0.22) | MISSING | MISSING |
+| status.warning-tint | #FEF3C7 | rgba(196,111,27,0.22) | MISSING | MISSING |
+| status.error-tint | #FEE2E2 | rgba(201,66,60,0.22) | MISSING | MISSING |
+| status.recording | #C9423C | #C9423C | MISSING | MISSING |
+| map.paper | #FDFBF8 | #2D2218 | MISSING | MISSING |
+| map.contour | rgba(73,69,79,0.22) | rgba(242,238,232,0.22) | MISSING | MISSING |
+| map.contour-faint | rgba(73,69,79,0.10) | rgba(242,238,232,0.10) | MISSING | MISSING |
+| map.style.light | mapbox://styles/laneshadow/clxwarm01 | mapbox://styles/laneshadow/clxwarm01 | MISSING | MISSING |
+| map.style.dark | mapbox://styles/laneshadow/clxnight02 | mapbox://styles/laneshadow/clxnight02 | MISSING | MISSING |
+| sizing.stroke.sm | 1 | 1 | MISSING | MISSING |
+| sizing.stroke.md | 2 | 2 | MISSING | MISSING |
+| sizing.stroke.lg | 3 | 3 | MISSING | MISSING |
+| elev.card | 0 2px 6px rgba(34,24,16,0.06) | 0 2px 6px rgba(0,0,0,0.24) | MISSING | MISSING |
+| elev.chrome | 0 1px 3px rgba(34,24,16,0.04), 0 4px 14px rgba(34,24,16,0.06) | 0 1px 3px rgba(0,0,0,0.24), 0 4px 14px rgba(0,0,0,0.28) | MISSING | MISSING |
+| elev.overlay | 0 8px 24px rgba(34,24,16,0.10), 0 2px 6px rgba(34,24,16,0.06) | 0 8px 24px rgba(0,0,0,0.42), 0 2px 6px rgba(0,0,0,0.28) | MISSING | MISSING |
+| duration.instant | 0 | 0 | MISSING | MISSING |
+| duration.fast | 120 | 120 | MISSING | MISSING |
+| duration.standard | 240 | 240 | MISSING | MISSING |
+| duration.slow | 400 | 400 | MISSING | MISSING |
+| duration.deliberate | 600 | 600 | MISSING | MISSING |
+| ease.standard | cubic-bezier(0.4,0.0,0.2,1.0) | cubic-bezier(0.4,0.0,0.2,1.0) | MISSING | MISSING |
+| ease.emphasized | cubic-bezier(0.2,0.0,0.0,1.0) | cubic-bezier(0.2,0.0,0.0,1.0) | MISSING | MISSING |
+| ease.decelerated | cubic-bezier(0.0,0.0,0.2,1.0) | cubic-bezier(0.0,0.0,0.2,1.0) | MISSING | MISSING |
+| ease.accelerated | cubic-bezier(0.4,0.0,1.0,1.0) | cubic-bezier(0.4,0.0,1.0,1.0) | MISSING | MISSING |
+| ease.linear | linear | linear | MISSING | MISSING |
+
+## naming.mismatch
+
+Observed canonical-path vs emitted-name divergences:
+
+| Canonical token path | iOS emitted shape | Android emitted shape | Note |
+| --- | --- | --- | --- |
+| content.on-signal | `LaneShadowTheme.color.content.onSignal` | `LaneShadowTheme.color.Content.onSignal` | kebab-case token becomes camelCase accessor |
+| action.primary-hover | `LaneShadowTheme.color.action.primary.hover` | `LaneShadowTheme.color.Action.Primary.hover` | canonical hyphenated leaf is split into nested groups |
+| action.primary-pressed | `LaneShadowTheme.color.action.primary.pressed` | `LaneShadowTheme.color.Action.Primary.pressed` | same kebab-case to camelCase/nested rewrite |
+| space.0`...`space.12 | `LaneShadowTheme.spacing.s0`...`s12` | not emitted | Swift renames numeric spacing keys to `s*`; Android omits the spacing group |
+| size.touch-min | not emitted | not emitted | design token uses kebab-case; dimensions schema uses `touchTarget` instead of `touch-min`, so the naming contract is already split before native generation |
+
+Android-specific drift:
+- `Tokens.kt` has no dark-variant carrier for color values; even rows that exist by name are serialized as single light literals.
+- `Tokens.kt` omits entire groups that Swift also omits: `map`, `elev`, `duration`, `ease`, and `sizing.stroke`.


Changed file contents (.spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md):
# ALIGN-01 Drift Report

Audit scope:
- Canonical color values: `.spec/design/system/tokens/theme.light.json` and `.spec/design/system/tokens/theme.dark.json`
- Canonical map style values: `tokens/semantic/mapbox.tokens.json`
- Canonical sizing values: `tokens/semantic/dimensions.tokens.json`
- Current generated outputs: `tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift` and `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt`

Notes:
- `Tokens.kt` emits light-theme literals only for the color tokens it does contain. Missing rows below capture outright omissions; Android also has a broader dark-mode value drift across the generated color surface.
- `surface.scrim-soft` is referenced by the sprint acceptance criteria and concept screens (`uc-scr-03-route-results.html`) but is not emitted by either native token output.

## Drift Rows

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
| sizing.stroke.sm | 1 | 1 | MISSING | MISSING |
| sizing.stroke.md | 2 | 2 | MISSING | MISSING |
| sizing.stroke.lg | 3 | 3 | MISSING | MISSING |
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

## naming.mismatch

Observed canonical-path vs emitted-name divergences:

| Canonical token path | iOS emitted shape | Android emitted shape | Note |
| --- | --- | --- | --- |
| content.on-signal | `LaneShadowTheme.color.content.onSignal` | `LaneShadowTheme.color.Content.onSignal` | kebab-case token becomes camelCase accessor |
| action.primary-hover | `LaneShadowTheme.color.action.primary.hover` | `LaneShadowTheme.color.Action.Primary.hover` | canonical hyphenated leaf is split into nested groups |
| action.primary-pressed | `LaneShadowTheme.color.action.primary.pressed` | `LaneShadowTheme.color.Action.Primary.pressed` | same kebab-case to camelCase/nested rewrite |
| space.0`...`space.12 | `LaneShadowTheme.spacing.s0`...`s12` | not emitted | Swift renames numeric spacing keys to `s*`; Android omits the spacing group |
| size.touch-min | not emitted | not emitted | design token uses kebab-case; dimensions schema uses `touchTarget` instead of `touch-min`, so the naming contract is already split before native generation |

Android-specific drift:
- `Tokens.kt` has no dark-variant carrier for color values; even rows that exist by name are serialized as single light literals.
- `Tokens.kt` omits entire groups that Swift also omits: `map`, `elev`, `duration`, `ease`, and `sizing.stroke`.


Review focus:
- Verify the report satisfies every AC/TC for ALIGN-01.
- Identify any missing required rows, wrong expected values, or non-compliant scope behavior.
- Treat the restored .kb-run-sprint-codex checksum file as a host-cleaned harness artifact, not task scope.
- APPROVED only if every requirement is satisfied and there are no CRITICAL/HIGH findings.
