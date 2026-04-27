# FID-S01-T07 — Android critical build blockers: Session data class + RouteDetails polyline decode

**Sprint:** [SPRINT.md](./SPRINT.md) · **Agent:** kotlin-implementer · **Estimate:** 60 min · **Type:** INFRA · **Priority:** P0 · **Effort:** S · **Status:** Backlog

## BACKGROUND

Android module currently does not compile: `LSSessionsDrawer.kt` references an undeclared `Session` type at lines 74, 123, 180, 239, 246; `RouteDetailsScreen.kt` passes `coordinates = emptyList()` instead of decoding `state.route.polyline` via `PolylineDecoder.decodeOrNull()` (which exists at `android/app/src/main/java/com/laneshadow/ui/util/PolylineDecoder.kt` and is already used in `RouteResultsScreen.kt:32`). Without this, no other Android task in this sprint can build or test.

## CRITICAL CONSTRAINTS

- MUST declare `Session` data class in `LSSessionsDrawer.kt` (or import from shared model package) so existing references resolve.
- MUST decode `state.route.polyline` using `PolylineDecoder.decodeOrNull()` — STRICTLY NEVER pass `emptyList()` as a workaround.
- MUST keep this task surgical — no token edits, no story additions, no organism refactors. Pure compile-blocker fix scoped to the two cited files.
- STRICTLY do NOT modify `ios/**`, `server/**`, `react-native/**`, `web/**`.
- NEVER suppress compile errors via `@Suppress`; NEVER stub the polyline result with synthetic LatLng lists.

## SPECIFICATION

**Objective:** Eliminate the two compile-time and one runtime correctness blockers preventing the Android sandbox from building and rendering a real route polyline on RouteDetailsScreen.

**Success state:** `./gradlew :app:compileDebugKotlin` and `./gradlew assembleDebug` both exit 0; `LSSessionsDrawer.kt` declares (or imports) a `Session` data class with fields `{ id: String, title: String, whenLabel: String, preview: String, meta: String }`; `RouteDetailsScreen.kt` invokes `PolylineDecoder.decodeOrNull(state.route.polyline)` and passes the decoded `List<LatLng>` (or empty fallback only when decode returns null) into `PolylineData.coordinates`.

## ACCEPTANCE CRITERIA

- **AC-1** GIVEN current main branch where `LSSessionsDrawer.kt` references undeclared `Session`, WHEN `cd android && ./gradlew :app:compileDebugKotlin` runs, THEN BEFORE FIX: compilation fails with `Unresolved reference: Session`; AFTER FIX: compilation succeeds with exit 0.
  - verify: `cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:compileDebugKotlin`
- **AC-2** GIVEN `RouteDetailsScreen.kt` currently passes `coordinates = emptyList()`, WHEN screen rendered in unit test with mock `RouteDetailsScreenState` carrying non-empty encoded polyline, THEN BEFORE FIX: `polylines[0].coordinates` is empty; AFTER FIX: `PolylineDecoder.decodeOrNull(state.route.polyline)` invoked and decoded `List<LatLng>` populates `polylines[0].coordinates` with size > 0.
  - verify: `cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.RouteDetailsScreenTest.polylineCoordinatesAreDecodedFromState'`
- **AC-3** GIVEN `Session` data class declared, WHEN existing usages at lines 74, 123, 180, 239, 246 recompile, THEN all five usage sites resolve and compiler emits no warnings about unused private declarations.
  - verify: `cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:compileDebugKotlin --warning-mode all`
- **AC-4** GIVEN full debug variant assembled, WHEN `./gradlew assembleDebug` runs end-to-end, THEN BUILD SUCCESSFUL with exit 0 and apk produced under `android/app/build/outputs/apk/debug/`.
  - verify: `cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew assembleDebug`
- **AC-5** GIVEN `PolylineDecoder.decodeOrNull` returns null for malformed input, WHEN RouteDetailsScreen receives `state.route.polyline` that fails to decode, THEN implementation falls back to `emptyList()` WITHOUT throwing; test asserts no exception propagated.
  - verify: `cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.RouteDetailsScreenTest.malformedPolylineFallsBackGracefully'`

## TEST CRITERIA

| ID | Statement | Maps to | Verify |
|---|---|---|---|
| TC-1 | compileDebugKotlin returns exit 0 against modified files | AC-1, AC-3 | `cd android && ./gradlew :app:compileDebugKotlin` |
| TC-2 | RouteDetailsScreenTest.polylineCoordinatesAreDecodedFromState passes | AC-2 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.RouteDetailsScreenTest.polylineCoordinatesAreDecodedFromState'` |
| TC-3 | RouteDetailsScreenTest.malformedPolylineFallsBackGracefully passes | AC-5 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.RouteDetailsScreenTest.malformedPolylineFallsBackGracefully'` |
| TC-4 | assembleDebug returns exit 0 producing debug apk | AC-4 | `cd android && ./gradlew assembleDebug` |
| TC-5 | Token compliance script returns exit 0 (logic-only changes) | AC-1 | `scripts/tokens/enforce-native-compliance.sh android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt android/app/src/main/java/com/laneshadow/ui/templates/RouteDetailsScreen.kt` |

## READING LIST

- `[PHASE: RED]` `.spec/prds/v3-integration/remediations/04-organisms-chrome.md` — Gap C-07 Session data class
- `[PHASE: RED]` `.spec/prds/v3-integration/remediations/02-views-route.md` — Gap A2-01 polyline decode
- `[PHASE: RED]` `android/app/src/main/java/com/laneshadow/ui/util/PolylineDecoder.kt` — existing decoder API
- `[PHASE: GREEN]` `android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt` — declare Session data class
- `[PHASE: GREEN]` `android/app/src/main/java/com/laneshadow/ui/templates/RouteDetailsScreen.kt` — replace `emptyList()` with decoder call
- `[PHASE: RED]` `android/app/src/main/java/com/laneshadow/ui/templates/RouteResultsScreen.kt` — reference call site for `PolylineDecoder.decodeOrNull`

## GUARDRAILS

**WRITE-ALLOWED:**
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt`
- `android/app/src/main/java/com/laneshadow/ui/templates/RouteDetailsScreen.kt`
- `android/app/src/test/java/com/laneshadow/ui/templates/RouteDetailsScreenTest.kt`
- `android/app/src/main/java/com/laneshadow/ui/organisms/model/Session.kt` (only if extracted to shared model package)

**WRITE-PROHIBITED:** `ios/**`, `server/**`, `react-native/**`, `web/**`, `tokens/**`, `PolylineDecoder.kt` (read-only), `android/app/src/debug/**` (no story changes)

## DESIGN

**References:**
- `.spec/prds/v3-integration/12-uc-fid.md` UC-FID-01 build-blocker AC subset
- `.spec/prds/v3-integration/remediations/00-summary.md` theme #9
- `.spec/prds/v3-integration/remediations/04-organisms-chrome.md` gap C-07
- `.spec/prds/v3-integration/remediations/02-views-route.md` gap A2-01

**Pattern:** Surgical compile-blocker remediation + null-safe decoder invocation with explicit empty-list fallback.
**Pattern source:** Established `PolylineDecoder.decodeOrNull` pattern already in use at `RouteResultsScreen.kt:32`.
**Anti-pattern:** Hard-coding synthetic LatLng coordinates; suppressing compile errors with `@Suppress`; throwing on malformed polyline input instead of falling back.

## RED PHASE INSTRUCTIONS

Author `RouteDetailsScreenTest.kt` under `android/app/src/test/java/com/laneshadow/ui/templates/`. Use `createComposeRule` + minimal `RouteDetailsScreenState` fixture with `state.route.polyline` = known-good encoded polyline (e.g., Google's `_p~iF~ps|U_ulLnnqC_mqNvxq``@`). Assert via captured `PolylineData` (test hook OR drive through LSMap composition spy) that `coordinates.size > 0`. Add second test seeding malformed string asserting no throw + `coordinates.size == 0`. Confirm both fail BEFORE the fix (one via compile failure if Session class still missing — AC-1 RED signal). For Session class: do not author a unit test; AC-1/AC-3 validated by gradle compile success.

## GREEN PHASE INSTRUCTIONS

1. **LSSessionsDrawer.kt:** add at top of file (above `LSSESSIONSDRAWER_TAG` constants) `data class Session(val id: String, val title: String, val whenLabel: String, val preview: String, val meta: String)` — derive field names from existing usages at lines 239 (`.title`), 246 (`.whenLabel`), and SessionRow signature at line 180. NO color/styling fields; pure data carrier.
2. **RouteDetailsScreen.kt:** add `import com.laneshadow.ui.util.PolylineDecoder` near line 23. Replace lines 88-98 PolylineData construction with `coordinates = PolylineDecoder.decodeOrNull(state.route.polyline) ?: emptyList()`. Verify `state.route` exposes `polyline: String` field (it does per `RouteResultsScreen.kt:32`).
3. Run `./gradlew :app:compileDebugKotlin` to confirm AC-1 + AC-3.
4. Run unit tests; confirm TC-2 + TC-3 pass.
5. Run `./gradlew assembleDebug` to confirm AC-4.

## REVIEW NOTES

- **Cross-platform parity:** N/A — no story changes. Confirm no story file modified.
- **Token compliance:** Session is data-only; RouteDetailsScreen change is logic-only. `enforce-native-compliance.sh` MUST exit 0.
- **Boy Scout:** if `Session` is referenced elsewhere (grep `com/laneshadow` for `: Session` and `Session(`), prefer extracting to shared model `com.laneshadow.ui.organisms.model.Session` and importing in BOTH usage sites; if only LSSessionsDrawer uses it, file-local declaration is acceptable.
- Verify `PolylineDecoder.decodeOrNull` is the actual function name — open `PolylineDecoder.kt` to confirm signature before authoring tests.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| kotlin-compile | `cd android && ./gradlew :app:compileDebugKotlin` | BUILD SUCCESSFUL exit 0 (currently fails with `Unresolved reference: Session`) |
| unit-tests | `cd android && ./gradlew test` | BUILD SUCCESSFUL with `RouteDetailsScreenTest` passing |
| assemble-debug | `cd android && ./gradlew assembleDebug` | BUILD SUCCESSFUL exit 0; debug apk produced |
| token-compliance | `scripts/tokens/enforce-native-compliance.sh` | exit 0 |

## CODING STANDARDS

`RULES.md#accessibility-standards`, `RULES.md#cross-platform-component-parity`

## DEPENDENCIES

- **depends_on:** []
- **blocks:** [FID-S01-T06, FID-S01-T08, FID-S01-T09]

> **Rationale:** Build is currently broken on Android. T06 and T08 modify the same files (LSSessionsDrawer.kt) and cannot run their tests until compile succeeds. T09 (sprint verification) requires a working build to capture screenshots.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[{"id":"AC-1","type":"acceptance_criterion","description":"compileDebugKotlin succeeds","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:compileDebugKotlin","phase":"green"},{"id":"AC-2","type":"acceptance_criterion","description":"RouteDetails polyline decoded from state","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.RouteDetailsScreenTest.polylineCoordinatesAreDecodedFromState'","phase":"green"},{"id":"AC-3","type":"acceptance_criterion","description":"5 Session usages resolve, no warnings","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:compileDebugKotlin --warning-mode all","phase":"green"},{"id":"AC-4","type":"acceptance_criterion","description":"assembleDebug succeeds, apk produced","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew assembleDebug","phase":"green"},{"id":"AC-5","type":"acceptance_criterion","description":"Malformed polyline falls back gracefully","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.RouteDetailsScreenTest.malformedPolylineFallsBackGracefully'","phase":"green"},{"id":"TC-1","type":"test_criterion","description":"compileDebugKotlin exit 0","maps_to_ac":"AC-1","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:compileDebugKotlin","phase":"red"},{"id":"TC-2","type":"test_criterion","description":"polylineCoordinatesAreDecodedFromState passes","maps_to_ac":"AC-2","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.RouteDetailsScreenTest.polylineCoordinatesAreDecodedFromState'","phase":"red"},{"id":"TC-3","type":"test_criterion","description":"malformedPolylineFallsBackGracefully passes","maps_to_ac":"AC-5","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.RouteDetailsScreenTest.malformedPolylineFallsBackGracefully'","phase":"red"},{"id":"TC-4","type":"test_criterion","description":"assembleDebug exit 0","maps_to_ac":"AC-4","verify":"cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew assembleDebug","phase":"green"},{"id":"TC-5","type":"test_criterion","description":"Token compliance","maps_to_ac":"AC-1","verify":"scripts/tokens/enforce-native-compliance.sh android/app/src/main/java/com/laneshadow/ui/organisms/LSSessionsDrawer.kt android/app/src/main/java/com/laneshadow/ui/templates/RouteDetailsScreen.kt","phase":"green"}]}
-->
