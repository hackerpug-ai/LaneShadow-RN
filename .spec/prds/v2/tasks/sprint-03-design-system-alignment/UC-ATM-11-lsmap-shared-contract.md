<!-- Template Version: 5.1.0 | Sprint: sprint-03-design-system-alignment | Type: INFRA -->

================================================================================
TASK: UC-ATM-11 — LSMap Shared Contract (Types + Fixtures + New-Theme Stub)
================================================================================

TASK_TYPE:  INFRA
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-planner + kotlin-planner | reviewer=swift-reviewer + kotlin-reviewer
ESTIMATE:   180 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   05-uc-atm.md (UC-ATM-11), .spec/design/system/atoms/map/

RUNTIME_COMMANDS:
  test:      test -f tokens/api/LSMap.contract.md && test -f tokens/sandbox/fixtures/routes.fixtures.json
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      (n/a for contract doc)

PROGRESS: AC-1 none · 0/5 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

tokens/api/LSMap.contract.md defines all LSMap types; tokens/sandbox/fixtures/routes.fixtures.json has 3 canonical scenarios (including route_results_three_alts with 3 polylines); iOS stub LSMap.swift compiles rendering an LSGlassPanel fallback on the Copper theme surface — no SDK integration yet.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST create tokens/api/LSMap.contract.md with all typed definitions: CameraPosition, AnnotationKind, Annotation, RouteVariant, PolylineData, MapMode, CameraFit, MapError.
- MUST create tokens/sandbox/fixtures/routes.fixtures.json with route_preview_single, route_results_three_alts (3 polylines with variants best/alt1/alt2), route_preview_long_coastal.
- MUST document access-token convention (iOS MBXAccessToken in Info.plist from .xcconfig; Android secrets.xml from Gradle task).
- MUST ship iOS stub ios/LaneShadow/Views/Atoms/LSMap.swift rendering LSGlassPanel fallback — no MapboxMaps import.
- MUST align the stub with the Sprint 03 Copper theme surface; legacy-theme deletion is out of scope.
- NEVER import MapboxMaps or any Mapbox SDK in the stub.
- NEVER commit a literal Mapbox access token.
- STRICTLY: iOS stub must compile via xcodebuild build; contract types must match .spec/design/system/atoms/map/README.md Cross-Platform Contract section exactly.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] AC-1: LSMap.contract.md exists with all 8 types + public API signature (PRIMARY)
- [x] AC-2: routes.fixtures.json has 3 scenarios; route_results_three_alts has 3 polylines
- [x] AC-3: iOS stub LSMap.swift compiles, no MapboxMaps import
- [x] AC-4: Contract documents access-token convention for both platforms
- [x] AC-5: iOS stub signature matches contract (mode, camera, cameraFit, polylines, annotations, showFavorites, onTap)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Contract file exists with all types [PRIMARY]
  GIVEN: tokens/api/ does not yet exist
  WHEN:  task complete
  THEN:  tokens/api/LSMap.contract.md defines CameraPosition, AnnotationKind, Annotation, RouteVariant, PolylineData, MapMode, CameraFit, MapError, and public LSMap() API for Swift + Kotlin
  VERIFY: grep -c 'CameraPosition\|AnnotationKind\|RouteVariant\|PolylineData\|MapMode\|CameraFit\|MapError' tokens/api/LSMap.contract.md (expect ≥7)

AC-2: Fixture file with 3 scenarios
  GIVEN: tokens/sandbox/fixtures/ does not yet exist
  WHEN:  task complete
  THEN:  routes.fixtures.json has route_preview_single, route_results_three_alts (.polylines.length === 3 with variants best/alt1/alt2), route_preview_long_coastal
  VERIFY: node -e "const f=require('./tokens/sandbox/fixtures/routes.fixtures.json'); const a=f.route_results_three_alts.polylines; console.log(a.length===3 && a.some(p=>p.variant==='best') && a.some(p=>p.variant==='alt1') && a.some(p=>p.variant==='alt2')?'PASS':'FAIL')"

AC-3: iOS stub compiles without Mapbox import
  GIVEN: ios/LaneShadow/Views/Atoms/LSMap.swift does not exist
  WHEN:  task complete
  THEN:  LSMap.swift renders LSGlassPanel fallback, imports only SwiftUI + LaneShadowTheme, xcodebuild build succeeds
  VERIFY: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet | tail -3

AC-4: Access-token convention documented
  GIVEN: iOS (.xcconfig/Info.plist) and Android (secrets.xml/Gradle) differ
  WHEN:  contract is written
  THEN:  Access Token Convention section includes MBXAccessToken/Info.plist (iOS) and secrets.xml/Gradle (Android) with MAPBOX_ACCESS_TOKEN env variable
  VERIFY: grep 'MBXAccessToken\|secrets.xml\|MAPBOX_ACCESS_TOKEN' tokens/api/LSMap.contract.md | wc -l (expect ≥2)

AC-5: iOS stub signature matches contract
  GIVEN: LSMap.contract.md specifies public API
  WHEN:  LSMap.swift stub written
  THEN:  LSMap signature accepts mode: MapMode, camera: CameraPosition, cameraFit: CameraFit = .static, polylines: [PolylineData] = [], annotations: [Annotation] = [], showFavorites: Bool = false, onTap: ((LatLng) -> Void)? = nil
  VERIFY: grep 'MapMode\|CameraPosition\|CameraFit\|PolylineData\|showFavorites' ios/LaneShadow/Views/Atoms/LSMap.swift | wc -l (expect ≥5)

--------------------------------------------------------------------------------
TEST CRITERIA (boolean)
--------------------------------------------------------------------------------

| ID | Statement | Maps To | Verify |
|----|-----------|---------|--------|
| TC-1 | tokens/api/LSMap.contract.md exists | AC-1 | test -f tokens/api/LSMap.contract.md |
| TC-2 | tokens/sandbox/fixtures/routes.fixtures.json exists | AC-2 | test -f tokens/sandbox/fixtures/routes.fixtures.json |
| TC-3 | route_results_three_alts.polylines array has exactly 3 entries | AC-2 | node -e "console.log(require('./tokens/sandbox/fixtures/routes.fixtures.json').route_results_three_alts.polylines.length===3?'PASS':'FAIL')" |
| TC-4 | ios/LaneShadow/Views/Atoms/LSMap.swift exists and has no MapboxMaps import | AC-3 | test -f ios/LaneShadow/Views/Atoms/LSMap.swift && grep -c 'import MapboxMaps' ios/LaneShadow/Views/Atoms/LSMap.swift = 0 |
| TC-5 | xcodebuild build succeeds after adding LSMap.swift stub | AC-3 | cd ios && xcodebuild build -scheme LaneShadow ... \| grep 'BUILD SUCCEEDED' |
| TC-6 | LSMap.swift stub body references LSGlassPanel | AC-3 | grep 'LSGlassPanel' LSMap.swift |
| TC-7 | LSMap.swift type declarations contain MapMode, CameraPosition, CameraFit, PolylineData, Annotation | AC-5 | grep -c 'MapMode\|CameraPosition\|CameraFit\|PolylineData\|Annotation' LSMap.swift ≥5 |

--------------------------------------------------------------------------------
IMPLEMENTATION STEPS
--------------------------------------------------------------------------------

1. Create tokens/api/ and tokens/sandbox/fixtures/ directories.
2. Write tokens/api/LSMap.contract.md per .spec/design/system/atoms/map/README.md Cross-Platform Contract section — all 8 types with field-level docs, public Swift + Kotlin API signatures, access-token convention.
3. Write tokens/sandbox/fixtures/routes.fixtures.json with 3 scenarios; use real SF Bay Area lat/lng coordinates.
4. Create ios/LaneShadow/Views/Atoms/LSMap.swift with LSGlassPanel stub body + all type declarations.
5. Run `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` — confirm BUILD SUCCEEDED.
6. Commit.

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- tokens/api/LSMap.contract.md (NEW)
- tokens/sandbox/fixtures/routes.fixtures.json (NEW)
- ios/LaneShadow/Views/Atoms/LSMap.swift (NEW)

writeProhibited:
- tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift
- tokens/scripts/generate.ts
- tokens/semantic/**
- ios/LaneShadow/Views/Atoms/LSGlassPanel.swift (reuse, do not modify)
- ios/LaneShadow/Tests/**
- android/** (Android stub is Android-side work; this task only ships iOS stub + shared contract)

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use LSGlassPanel from ios/LaneShadow/Views/Atoms/
- Place type declarations in LSMap.swift so UC-ATM-12-ios can replace body without changing types

⚠️ Ask First:
- Any deviation from the type names in .spec/design/system/atoms/map/README.md
- Android stub — out of scope per RULES.md (Android stub is kotlin-planner territory)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- tokens/api/LSMap.contract.md (NEW)
- tokens/sandbox/fixtures/routes.fixtures.json (NEW)
- ios/LaneShadow/Views/Atoms/LSMap.swift (NEW — stub)

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/atoms/map/README.md [PRIMARY PATTERN]
   - Lines: 1-130
   - Focus: Cross-Platform Contract section — authoritative type shapes and public API

2. ios/LaneShadow/Views/Atoms/LSGlassPanel.swift
   - Lines: 1-60
   - Focus: LSGlassPanel public API — import pattern and init signature for stub body

3. tokens/semantic/mapbox.tokens.json
   - Lines: 1-21
   - Focus: Actual Mapbox style URL values for contract

4. .spec/design/system/atoms/map/README.md
   - Lines: 180-210
   - Focus: Access token convention — iOS Info.plist + Android secrets.xml patterns

5. .spec/design/system/atoms/map/README.md
   - Lines: 280-310
   - Focus: Sandbox fixture scenario names

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/atoms/map/README.md, .spec/design/system/atoms/map/map.html

Interaction notes:
- REQUIRED READING: .spec/design/system/atoms/map/README.md in full before writing
- Stub LSMap renders LSGlassPanel with Text("Map preview — UC-ATM-12") — no actual map
- All type declarations live in LSMap.swift; UC-ATM-12-ios replaces body without changing types
- routes.fixtures.json coordinates: real SF Bay Area lat/lng for useful sandbox testing

Pattern: LSGlassPanel(.chrome) wrapping Text stub body per map/README.md error fallback pattern
Pattern source: .spec/design/system/atoms/map/README.md:276-280
Anti-pattern: Do not implement Mapbox layer/camera/annotation logic in the stub — that is UC-ATM-12-ios scope only.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (Contract exists): `test -f tokens/api/LSMap.contract.md` exits 0.
Gate 2 (Fixtures exist): `test -f tokens/sandbox/fixtures/routes.fixtures.json` exits 0.
Gate 3 (3 polylines): route_results_three_alts.polylines.length === 3.
Gate 4 (iOS stub builds): `xcodebuild build` exits BUILD SUCCEEDED.
Gate 5 (No Mapbox import in stub): `grep -c 'import MapboxMaps' ios/LaneShadow/Views/Atoms/LSMap.swift` = 0.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: (none — root of LSMap chain)
Blocks:     UC-ATM-12-ios, UC-ATM-12-android (both consume contract + fixtures on the new theme surface)
Parallel:   ALIGN-01, ALIGN-02-ios (independent tracks)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN tokens/api/ does not exist WHEN task complete THEN tokens/api/LSMap.contract.md exists with definitions for all 8 types and both-platform public API signatures", "verify": "grep -c 'CameraPosition\\|AnnotationKind\\|RouteVariant\\|PolylineData\\|MapMode\\|CameraFit\\|MapError' tokens/api/LSMap.contract.md | awk '{if($1>=7) print \"PASS\"; else print \"FAIL\"}'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN tokens/sandbox/fixtures/ does not exist WHEN task complete THEN routes.fixtures.json has 3 scenarios; route_results_three_alts.polylines has 3 entries with variants best/alt1/alt2", "verify": "node -e \"const f=require('./tokens/sandbox/fixtures/routes.fixtures.json'); const a=f.route_results_three_alts.polylines; console.log(a.length===3 && a.some(p=>p.variant==='best') && a.some(p=>p.variant==='alt1') && a.some(p=>p.variant==='alt2')?'PASS':'FAIL')\"" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN LSMap.swift does not exist WHEN task complete THEN LSMap.swift compiles, uses LSGlassPanel stub body, has no MapboxMaps import, xcodebuild build passes", "verify": "cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet | tail -3" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN iOS and Android have different token conventions WHEN contract written THEN it documents MBXAccessToken/Info.plist for iOS and secrets.xml/Gradle for Android", "verify": "grep 'MBXAccessToken\\|secrets.xml\\|MAPBOX_ACCESS_TOKEN' tokens/api/LSMap.contract.md | wc -l | awk '{if($1>=2) print \"PASS\"; else print \"FAIL\"}'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSMap.contract.md specifies public API WHEN LSMap.swift stub written THEN it accepts all 7 parameters with correct types matching the contract", "verify": "grep 'MapMode\\|CameraPosition\\|CameraFit\\|PolylineData\\|showFavorites' ios/LaneShadow/Views/Atoms/LSMap.swift | wc -l | awk '{if($1>=5) print \"PASS\"; else print \"FAIL\"}'" },
    { "id": "TC-1", "type": "test_criterion", "description": "tokens/api/LSMap.contract.md exists", "maps_to_ac": "AC-1", "verify": "test -f tokens/api/LSMap.contract.md && echo PASS" },
    { "id": "TC-2", "type": "test_criterion", "description": "tokens/sandbox/fixtures/routes.fixtures.json exists", "maps_to_ac": "AC-2", "verify": "test -f tokens/sandbox/fixtures/routes.fixtures.json && echo PASS" },
    { "id": "TC-3", "type": "test_criterion", "description": "route_results_three_alts.polylines array has exactly 3 entries", "maps_to_ac": "AC-2", "verify": "node -e \"const f=require('./tokens/sandbox/fixtures/routes.fixtures.json'); console.log(f.route_results_three_alts.polylines.length===3?'PASS':'FAIL')\"" },
    { "id": "TC-4", "type": "test_criterion", "description": "ios/LaneShadow/Views/Atoms/LSMap.swift exists and contains no MapboxMaps import", "maps_to_ac": "AC-3", "verify": "test -f ios/LaneShadow/Views/Atoms/LSMap.swift && grep -c 'import MapboxMaps' ios/LaneShadow/Views/Atoms/LSMap.swift | grep '^0$' && echo PASS" },
    { "id": "TC-5", "type": "test_criterion", "description": "xcodebuild build succeeds after adding LSMap.swift stub", "maps_to_ac": "AC-3", "verify": "cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet 2>&1 | grep 'BUILD SUCCEEDED'" },
    { "id": "TC-6", "type": "test_criterion", "description": "LSMap.swift stub body references LSGlassPanel", "maps_to_ac": "AC-3", "verify": "grep 'LSGlassPanel' ios/LaneShadow/Views/Atoms/LSMap.swift" },
    { "id": "TC-7", "type": "test_criterion", "description": "LSMap.swift type declarations contain MapMode, CameraPosition, CameraFit, PolylineData, Annotation", "maps_to_ac": "AC-5", "verify": "grep -c 'MapMode\\|CameraPosition\\|CameraFit\\|PolylineData\\|Annotation' ios/LaneShadow/Views/Atoms/LSMap.swift | awk '{if($1>=5) print \"PASS\"; else print \"FAIL\"}'" }
  ]
}
-->
