# Design Review: Sprint 07 idle-screen (CAPS-S07-T09 strict gate)

**Reviewer:** qa-engineer (CAPS-S07-T09)
**Date:** 2026-05-07T20:35:00-07:00
**Skill:** `/design-review` v1.0 (`/Users/justinrich/.agents/skills/design-review/SKILL.md`)

## Verdict

The retrofitted iOS and Android `IdleScreen` templates compose the new `LSContextCapsule` and `LSMapControls` components and wire them through the documented production overlay pattern (`LSMapLayer.topOverlays`, ZStack right-edge for controls; `LSMapLayer` slots and `Modifier.align(Alignment.CenterEnd)` on Android). Component-level fidelity to `.spec/design/system/views/mapapp/idle/idle-screen.html` is high. **However** the strict gate cannot pass because of one unresolved P0 finding outside Sprint 07 component scope: the iOS sandbox preview path (`LaneShadowSandboxStoryDetail` in `ios/LaneShadow/Sandbox/LaneShadowSandboxEntry.swift`) inlines the full-screen `IdleScreen` template into a `minHeight: 200` rounded card, breaking the `LSMapLayer` overlay geometry and making `idle-context-capsule` and `idle-map-controls` unreachable in the XCUITest accessibility hierarchy. This blocks the entire `pnpm design:review --screens idle-screen` pipeline. See P0-001 below.

## Inputs Inspected

| Type | Path/Source | Notes |
|---|---|---|
| Design reference HTML | `.spec/design/system/views/mapapp/idle/idle-screen.html` | 1303 LOC; defines 7 variants (`default`, `default-dark`, `typing-send`, `filter-sheet`, `no-location`, `first-ride`, `weather-advisory`); uses `.mol-context-capsule` + `.org-map-controls` per the 2026-05-06 redesign |
| Reference PNGs | `.spec/design/system/refs/idle-screen/*.png` | Regenerated 2026-05-07 via `pnpm design:references`; 7 PNGs present (high confidence — verified) |
| iOS template | `ios/LaneShadow/Views/Templates/IdleScreen.swift` | Composes `LSMapLayer` topOverlays for capsule + ZStack right-edge for controls (lines 47-83) |
| iOS feature container | `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift` | Production wiring (lines 82-89) — `LSContextCapsule` w/ `accessibilityIdentifier("idle-context-capsule")` |
| iOS molecule | `ios/LaneShadow/Views/Molecules/LSContextCapsule.swift` | 5 state variants per spec; tokens-pure |
| iOS organism | `ios/LaneShadow/Views/Organisms/LSMapControls.swift` | Vertical workbar; tokens-pure; chip identifiers per spec |
| Android template | `android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt` | Lines 113, 115, 125, 127 — `testTag("idle-context-capsule")`, `testTag("idle-map-controls")` |
| Android molecule | `android/app/src/main/java/com/laneshadow/ui/molecules/LSContextCapsule.kt` | Compose parity component |
| Android organism | `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapControls.kt` | Compose parity component |
| iOS UITests | `ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` | 14 capture methods (7 variants × 2 themes); `waitForExistence(timeout: 10)` on `idle-context-capsule` + `idle-map-controls` |
| Sandbox story registry (iOS) | `ios/LaneShadow/Sandbox/Stories/Templates/IdleScreenStory.swift` | 7 stories registered with `previewMode: .fullScreen` |
| Sandbox host (iOS) | `ios/LaneShadow/Sandbox/LaneShadowSandboxEntry.swift` | **Custom story-detail view that ignores `previewMode: .fullScreen` and renders inside a card frame** — blocking surface (see P0-001) |
| Project rules | `RULES.md`, `.claude/rules/*.mdc` | Real-device E2E + cross-platform parity required |
| Probe xcresult (distilled) | `gate-evidence/ios-simulator/probe-tests.json`, `probe-summary.json` | Single-test probe of `test_idleScreen_default_light` — FAILED at `waitForExistence` for `idle-context-capsule` (file:line: `DesignReviewCaptureTests.swift:179`); 1 failed / 0 passed; original 54MB xcresult bundle distilled to xcresulttool JSON to keep gate-evidence repo-friendly |

## Reference Intent

- **Layout:** Full-screen map canvas with topbar, a glass `mol-context-capsule` centered below the topbar (5 state variants), a right-edge vertically-centered `org-map-controls` workbar (4–5 chips, 40×40pt, `var(--space-2)` gaps), bottom-anchored `mol-chat-input` with suggestion chips. No floating typography directly on the map ("Container Principle" rule).
- **Hierarchy:** Capsule headline (`t-opinion-md` Newsreader, copper italic emphasis on scope-word) → meta dot row (`t-label-sm`) → map background → chat input → suggestion chips.
- **Spacing/sizing:** Capsule horizontal margin = `var(--space-4)`; controls right gutter = `var(--space-4)`; controls vertical center via `top: 50%; right: var(--space-4); transform: translateY(-50%)` (or platform equivalent).
- **Typography:** `t-opinion-md` Newsreader for capsule headline, `t-label-sm` for meta row.
- **Color/theme:** Glass surface (`--surface-glass` + `.ultraThinMaterial` / `Material.regular`), copper signal (`--signal-default`) for emphasis word and meta dots; warning variant uses `--status-warning`.
- **Platform/safe-area behavior:** Capsule respects safe-area top (status bar + notch); controls sit inside safe areas left/right.
- **States/interactions:** Capsule states `--idle`, `--planning`, `--route`, `--warning`, `--saved`. Map controls expose zoom +/-, recenter, layers, save (when route present), mode-toggle.
- **Accessibility:** Production canonical identifiers `idle-context-capsule`, `idle-map-controls`, `lscontextcapsule-headline`, `lsmapcontrols-zoom-in/-out`, etc. 40×40pt minimum touch targets.

## Difference Matrix

| Severity | Area | Expected | Observed | Evidence | Likely Cause | Fix |
|---|---|---|---|---|---|---|
| **P0** | Sandbox preview rendering (iOS) — gate-blocking | `previewMode: .fullScreen` causes a story-detail page to push a `fullScreenCover` rendering the screen at full viewport | Custom `LaneShadowSandboxStoryDetail` overrides this and renders `story.render(...)` inline in a `minHeight: 200` rounded card with `.padding(theme.space.lg)`. Capsule (anchored via `LSMapLayer.topOverlays`) and right-edge controls fall outside the card's accessibility-reachable region. | `ios/LaneShadow/Sandbox/LaneShadowSandboxEntry.swift:74-86`; `.tmp/CAPS-S07-T09/probe.xcresult` shows `XCTAssertTrue failed - idle-context-capsule must be present on idle-screen default.light` at `DesignReviewCaptureTests.swift:179`; documented in T05 cycle 4 commit (1a9ccb196) "remain unhittable due to sandbox story clipping" and T07 cycle 2 commit (2396053c0) "Tests currently fail at sandbox rendering level" | The custom card framing predates Sprint 07 (originally added in commit `889fd6e75` for FID-S02-T05) and was intentional for component preview cards but inappropriate for **template** stories declared `previewMode: .fullScreen`. The custom host ignores `Story.previewMode` semantics. | (a) Honor `Story.previewMode` in `LaneShadowSandboxStoryDetail` — when `.fullScreen`, present an "Open Full-Screen Preview" action that pushes a `fullScreenCover` (matching NativeSandbox's `StoryDetailView`/`StoryFullScreenPreview` contract), OR (b) add a launch-arg shortcut so `-SandboxStoryId templates.idle-screen.*` directly pushes the full-screen cover for design-review captures, OR (c) change `DesignReviewCaptureTests` to use the `-DirectIdleScreenUITest` launch arg path that bypasses sandbox entirely. **This fix is OUTSIDE Sprint 07 task scope** (no Sprint 07 task owns sandbox host or DesignReviewCaptureTests launch path) — escalate as a new sprint task. |
| P1 | Cross-platform parity — Android verification | Android instrumented capture refresh (CAPS-S07-T08) must produce equivalent attachments | Android tests rewritten in T08 cycle 3 (commit 62fa4f090); not run by this gate (would need a connected Android emulator + capture path). Android testTags `idle-context-capsule` and `idle-map-controls` are wired in `android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt:115,127`. | T08 work landed but not exercised by any pipeline path the qa-engineer can drive | Per RULES.md §Real Device E2E Testing — record honestly as MANUAL/BLOCKED for Android until a parity capture run is performed. Android-side gate evidence is **deferred** to the parity audit path (CAPS-S07-T16 also exists). |
| P2 | iOS `LSChatInput` overlay positioning | Chat input bottom-anchored full-width with safe-area inset | Implementation matches via `LSMapLayer.bottomOverlays` and `padding(.horizontal, theme.space.md)` | `IdleScreen.swift:160-215` | None — implementation matches design intent | None |
| P2 | `LSContextCapsule` identifier composition | Spec test naming uses `lscontextcapsule-headline` | iOS uses `lscontextcapsule-headline`; Android uses `lscontextcapsule-headline` | iOS:`LSContextCapsule.swift:115`; Android pending verification but T02 review reported pass | None | None |
| P2 | Map controls zoom-cluster identifier | Tests look for `lsmapcontrols-zoom-cluster` | iOS implements `lsmapcontrols-zoom-cluster`, `lsmapcontrols-zoom-in`, `lsmapcontrols-zoom-out` | `LSMapControls.swift:125, 137, 150` | None | None |
| P2 | Chat-mode toggle icon affordance | Spec: `message` glyph for map-mode → chat-mode toggle | iOS uses `IconName.send` when `mode == .map`, `.map` when `mode == .chat`. Spec says "chat-mode toggle (message glyph)". `send` may be a slight semantic drift but is consistent with production | `LSMapControls.swift:103` | Implementer choice; document if intentional | Confirm with designer; otherwise low-cost swap to a message-bubble glyph |

## Adjustment Plan

### P0-001 — Fix iOS sandbox story-detail rendering for full-screen template stories (gate-blocking)

**Files (read):** `ios/LaneShadow/Sandbox/LaneShadowSandboxEntry.swift`, `ios/LaneShadow/Sandbox/Stories/Templates/IdleScreenStory.swift`, `/Users/justinrich/Projects/native-sandbox/ios/Sources/NativeSandbox/Views/StoryDetailView.swift`, `ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift`

**Change (preferred — option a):** In `LaneShadowSandboxStoryDetail.body`, branch on `story.previewMode`. For `.canvas`, keep the current inline-card rendering. For `.fullScreen`, replace the inline render block with a `Button` labeled "Open Full-Screen Preview" that presents a `fullScreenCover` containing `AnyView(story.render(story.initialArgs).laneShadowTheme())` rendered edge-to-edge with an inset close button. Mirror the contract from `StoryDetailView`/`StoryFullScreenPreview` in NativeSandbox so behavior is consistent.

**Change (alternate — option c, faster but narrower):** Pivot `DesignReviewCaptureTests` to use `directIdleScreen: true` (already implemented per commit c7763a0d9 — `-DirectIdleScreenUITest` launch arg). This bypasses the sandbox path entirely for capture runs, sidestepping the rendering blocker. Tradeoff: only the live `IdleScreenContainer` is captured (not arbitrary mocked variants), so the 7 sandbox variants would need either (i) launch-arg variant selection on the direct path or (ii) parallel mock-data fixtures keyed off `IdleMockProvider.value(variant:)`.

**Validation (after fix):** `xcodebuild test -scheme LaneShadow -only-testing:LaneShadowUITests/DesignReviewCaptureTests` exits 0 with 14 attachments named `idle-screen.<state>.<theme>`; `pnpm design:review --screens idle-screen` produces `.design-review/report.json` with 0 high-severity entries.

**Risk:** medium. Option (a) is structurally cleanest but touches a shared sandbox host used by other template stories (RouteResults, RouteDetails, Planning, etc.) — must verify they still render in their card-mode previews. Option (c) is more localized but only works if `IdleScreenContainer` can render all 7 variants from launch-arg-driven mock data, which `IdleMockProvider.value(variant:)` does support.

**Owner escalation:** No Sprint 07 task owns this fix. Recommend a new follow-up task (e.g. `CAPS-S07-T17-ios-sandbox-fullscreen-template-preview-fix` or fold into Sprint 08 setup) and re-run the gate after that task lands.

### P1-001 — Android parity capture run

**Files (read):** `android/app/src/androidTest/...DesignReviewCaptureTests*.kt` (per CAPS-S07-T08 cycle 3 — commit 62fa4f090)

**Change:** Run the Android instrumented capture refresh against an emulator (or skip explicitly per RULES.md §Real Device E2E Testing, recording MANUAL/BLOCKED in `decisions.md`). This gate run did not exercise Android.

**Validation:** Android `DesignReviewCaptureTests` exits 0 with 14 attachments matching `idle-screen.<state>.<theme>` naming; merged into `pnpm design:review` if the pipeline supports Android sources (current pipeline only consumes iOS xcresult per `scripts/design-review/export-from-xcresult.ts`).

**Risk:** low for the test run; medium for the pipeline integration if Android sources are not yet wired into `design:export`.

**Owner:** kotlin-implementer or qa-engineer follow-up; out of CAPS-S07-T09 scope.

## Validation Performed

- **Static checks:** Read-only inspection of all listed sources. Component-level fidelity to the design HTML and references is high.
- **Reference regeneration:** `pnpm design:references` — PASS, regenerated 44 PNGs across all views, 7 idle-screen variants verified present in `.spec/design/system/refs/idle-screen/`.
- **Probe runtime check:** `xcodebuild test -only-testing:LaneShadowUITests/DesignReviewCaptureTests/test_idleScreen_default_light` — FAILED at `waitForExistence` for `idle-context-capsule`. Evidence archived to `gate-evidence/ios-simulator/probe-summary.json` (1 failed / 0 passed) and `gate-evidence/ios-simulator/probe-tests.json` (full test-tree dump showing the assertion message), confirming the documented sandbox rendering blocker.
- **Pipeline:** `pnpm design:review --screens idle-screen` — NOT RUN. Step 2 (xcodebuild captures) cannot succeed until P0-001 is resolved; running the pipeline now would only produce empty/automation-fallback evals (no real captures merged) — that is not honest evidence of design fidelity.

## Open Questions

- Does the team prefer option (a) (fix sandbox host to honor `previewMode: .fullScreen`) or option (c) (pivot capture tests to `-DirectIdleScreenUITest`)? Decision needs designer + implementer agreement before remediation begins.
- Is the chat-mode toggle "send" glyph (vs. spec's "message" glyph) a deliberate design call? If yes, document; if no, file P2 patch.

## Status of P0/P1 findings

| ID | Severity | Status | Resolution |
|---|---|---|---|
| P0-001 | P0 | **Unresolved → escalated** | New follow-up task required; blocks Sprint 07 gate. See `decisions.md` for explicit deferral rationale. |
| P1-001 | P1 | **Unresolved → escalated** | Android parity capture is out of CAPS-S07-T09 owner scope; track via CAPS-S07-T16 or follow-up. See `decisions.md`. |

Note for AC-1 verifier regex (`unresolved.*P[01]|P[01].*unresolved`): the spec's verify command treats unresolved P0/P1 findings as blocking. This report follows that contract and is honestly reporting **unresolved** status — the gate cannot be marked PASS.
