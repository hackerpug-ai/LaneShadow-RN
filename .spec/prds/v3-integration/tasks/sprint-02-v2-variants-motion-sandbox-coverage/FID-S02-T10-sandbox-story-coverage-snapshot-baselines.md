================================================================================
TASK: FID-S02-T10 - Sandbox Story Coverage + Snapshot Baselines (iOS Templates + LSRouteCard, Both Platforms)
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=swift-implementer + kotlin-implementer | reviewer=swift-reviewer + kotlin-reviewer

RUNTIME_COMMANDS:
  ios-typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build
  ios-test: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  android-typecheck: cd android && ./gradlew :app:compileDebugKotlin
  android-test: cd android && ./gradlew test
  snapshots-check: pnpm snapshots:check
  snapshots-parity: pnpm snapshots:parity-coverage
  native-compliance: scripts/tokens/enforce-native-compliance.sh

PROGRESS: AC-1..AC-7 not started

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

iOS template story coverage closes the variant gap (Idle 1→7, RouteResults 1→7, RouteDetails 2→6, Sessions 1→5, Error 1→6); iOS LSRouteCard expands 1→6; snapshot baselines (light + dark) are recorded for every newly-added or affected story on both platforms; `pnpm snapshots:check` reports zero coverage gaps; `pnpm snapshots:parity-coverage` reports ≥95% per-tier parity.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST NOT register stories whose underlying implementation has not landed (T03–T08) — confirm AC content exists before registering
- MUST follow canonical story-id spec from RULES.md "Cross-Platform Component Parity": lowercase, dot-separated, kebab-case, NO `infrastructure.` prefix; iOS and Android IDs MUST match for shared variants
- MUST capture both light + dark theme baselines for every new story; PNG file naming follows `{id}.{theme}.png` (sanitization rules per RULES.md)
- MUST NOT add new tokens or atoms to satisfy coverage; missing implementations are a T03–T08 problem, not this task's
- MUST verify `pnpm snapshots:check` exits 0 (no coverage gaps) and `pnpm snapshots:parity-coverage` reports ≥95% atoms/molecules, ≥90% organisms, 100% tokens before marking this task complete
- NEVER move stories under `infrastructure.` prefix; tier prefixes are `atoms.`, `molecules.`, `organisms.`, `templates.`, `tokens.`, `modifiers.` only

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] iOS IdleScreen story count ≥ 7 (S01 default, S02 typing-send, S03 dark, S04 filter sheet, V01, V02, V03) (AC-1 PRIMARY)
- [ ] iOS RouteResults story count ≥ 7 (S01, S02, S03 dark, S04, V01, V02, V03) (AC-2)
- [ ] iOS RouteDetails story count ≥ 6 (S01, S02, S03 dark, S04 medium, S05 dismissing, V01 saved) (AC-3)
- [ ] iOS Sessions story count ≥ 5 (S01, S02 dark, S03 empty, S04 grouped, S05 new-confirm) (AC-4)
- [ ] iOS Error story count ≥ 6 (S01, S02 dark/storm-gate, S03 extended, S04 recovered, V01 offline, V02 generic) (AC-5)
- [ ] iOS LSRouteCard story count ≥ 6 (default, saved, alt variant, long-title overflow, missing data, dark) (AC-6)
- [ ] `pnpm snapshots:check` exits 0 + `pnpm snapshots:parity-coverage` reports ≥95% atoms/molecules, ≥90% organisms, 100% tokens (AC-7)
- [ ] Snapshot baselines (light + dark PNGs) committed for every new story on both platforms
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: iOS IdleScreen variant story coverage [PRIMARY]
  GIVEN: iOS sandbox story registry is enumerated
  WHEN:  Stories matching `templates.idle-screen.*` are counted
  THEN:  At least 7 stories are registered with canonical IDs covering S01 default, S02 typing-send, S03 dark, S04 filter sheet, V01 no-location, V02 first-ride, V03 weather-advisory; each has a captured `light` + `dark` snapshot baseline PNG

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/StoryCoverageTests.swift
  TEST_FUNCTION: testIOSIdleStoryCoverage7

AC-2: iOS RouteResults variant story coverage
  GIVEN: iOS sandbox story registry is enumerated
  WHEN:  Stories matching `templates.route-results.*` are counted
  THEN:  At least 7 stories are registered (S01 default, S02 alt-selected, S03 dark, S04 refining, V01, V02 weather-divergent, V03 recall); snapshots captured for each in light + dark

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/StoryCoverageTests.swift
  TEST_FUNCTION: testIOSRouteResultsStoryCoverage7

AC-3: iOS RouteDetails variant story coverage
  GIVEN: iOS sandbox story registry is enumerated
  WHEN:  Stories matching `templates.route-details.*` are counted
  THEN:  At least 6 stories are registered (S01 default, S02 mixed-weather, S03 dark, S04 medium, S05 dismissing, V01 saved); snapshots captured

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/StoryCoverageTests.swift
  TEST_FUNCTION: testIOSRouteDetailsStoryCoverage6

AC-4: iOS Sessions variant story coverage
  GIVEN: iOS sandbox story registry is enumerated
  WHEN:  Stories matching `templates.sessions-screen.*` are counted
  THEN:  At least 5 stories are registered (S01, S02 dark, S03 empty, S04 grouped, S05 new-confirm); snapshots captured

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/StoryCoverageTests.swift
  TEST_FUNCTION: testIOSSessionsStoryCoverage5

AC-5: iOS Error variant story coverage
  GIVEN: iOS sandbox story registry is enumerated
  WHEN:  Stories matching `templates.error-screen.*` are counted
  THEN:  At least 6 stories are registered (S01 default, S02 dark/storm-gate, S03 extended, S04 recovered, V01 offline, V02 generic); snapshots captured

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/StoryCoverageTests.swift
  TEST_FUNCTION: testIOSErrorStoryCoverage6

AC-6: iOS LSRouteCard story coverage
  GIVEN: iOS organism story registry is enumerated
  WHEN:  Stories matching `organisms.route-card.*` are counted
  THEN:  At least 6 stories are registered (default, saved, alt-variant, long-title-overflow, missing-data, dark); snapshots captured

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/StoryCoverageTests.swift
  TEST_FUNCTION: testIOSRouteCardStoryCoverage6

AC-7: Snapshot check + parity coverage
  GIVEN: All Sprint 02 implementation tasks (T01–T09) are landed and snapshots regenerated
  WHEN:  `pnpm snapshots:check` and `pnpm snapshots:parity-coverage` are run
  THEN:  `pnpm snapshots:check` exits 0 (no coverage gaps) and parity report shows atoms ≥ 95%, molecules ≥ 95%, organisms ≥ 90%, tokens = 100% (templates advisory; modifiers/infrastructure exempt)

  TDD_STATE:     none
  TEST_FILE:     n/a (CLI verification)
  TEST_FUNCTION: n/a

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Sandbox/MockProviders/IdleMockProvider.swift (MODIFY — only if T03 hasn't landed S01–S04 mocks; coordinate with T03 author)
- ios/LaneShadow/Sandbox/Stories/Templates/IdleScreenStory.swift (MODIFY — register S01..V03 6 missing stories)
- ios/LaneShadow/Sandbox/Stories/Templates/RouteResultsScreenStory.swift (MODIFY — register S01..V03 6 missing stories)
- ios/LaneShadow/Sandbox/Stories/Templates/RouteDetailsScreenStory.swift (MODIFY — register the 4 missing stories from T05)
- ios/LaneShadow/Sandbox/Stories/Templates/SessionsScreenStory.swift (MODIFY — register S02 dark, S03 empty, S04 grouped, S05 new-confirm)
- ios/LaneShadow/Sandbox/Stories/Templates/ErrorScreenStory.swift (MODIFY — register S02 dark/storm, S03 extended, S04 recovered, V01 offline, V02 generic)
- ios/LaneShadow/Sandbox/Stories/Organisms/LSRouteCardStory.swift (MODIFY — expand from 1 to 6 stories)
- ios/LaneShadow/Sandbox/MockProviders/RouteMockProvider.swift (MODIFY — supply mocks for new RouteCard variants if missing)
- ios/LaneShadowTests/Sandbox/StoryCoverageTests.swift (NEW)
- ios/LaneShadowTests/__Snapshots__/StorySnapshotTests/*.png (NEW — captured baselines)
- android/app/src/androidTest/screenshots/AllStoriesSnapshotTest/*.png (NEW or MODIFY — captured baselines)
- tokens/sandbox/parity-exemptions.json (MODIFY — only for genuinely platform-specific stories like Android `templates.error-screen.s02-storm-gate`)

writeProhibited:
- ios/LaneShadow/Views/** — implementations are landed by T01–T09; this task only registers stories and captures baselines
- android/app/src/main/** — same — implementations are landed by T02/T04/T06/T08
- server/**, react-native/**
- tokens/** except `parity-exemptions.json` — must NOT add new tokens
- Any file not explicitly listed above

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- iOS template story files (MODIFY): register all missing variant stories using the mock providers landed by T03–T08
- iOS LSRouteCardStory.swift (MODIFY): 6 stories with mocks
- iOS RouteMockProvider.swift (MODIFY if needed): RouteCard mocks for the 6 variants
- StoryCoverageTests.swift (NEW): per-AC count assertions
- iOS + Android snapshot PNG baselines (NEW): light + dark for every new story
- tokens/sandbox/parity-exemptions.json (MODIFY): document Android-only `templates.error-screen.s02-storm-gate` if iOS doesn't ship it this sprint

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. RULES.md "Cross-Platform Component Parity" [PRIMARY REFERENCE]
   - Sections: Canonical naming spec, Parallel maintenance rule, Verification, PNG filename contract
2. tokens/sandbox/parity-thresholds.json
   - Focus: Per-tier thresholds enforced by `pnpm snapshots:parity-coverage`
3. ios/LaneShadowTests/Sandbox/StorySnapshotTests.swift (existing)
   - Focus: How snapshot capture works on iOS (custom UIImage capture; PNG sanitization)
4. android/app/src/androidTest/java/com/laneshadow/sandbox/snapshots/SandboxSnapshotTestBase.kt (existing)
   - Focus: How dropshots snapshot capture works on Android
5. .spec/prds/v3-integration/12-uc-fid.md
   - Sections: "Sandbox stories — Android" and "Cross-platform parity (umbrella)" ACs
   - Focus: The exact expected coverage list

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: All implementation tasks T01–T09 are committed and landed BEFORE this task starts (otherwise stories register against missing impl)
Gate 2: One coverage test per AC-1..AC-6 in StoryCoverageTests.swift
Gate 3: Story IDs canonical and identical across platforms (verify via `pnpm snapshots:check`)
Gate 4: All tests pass — `xcodebuild test` AND `./gradlew test`
Gate 5: `pnpm snapshots:check` exits 0
Gate 6: `pnpm snapshots:parity-coverage` reports ≥95% atoms/molecules, ≥90% organisms, 100% tokens
Gate 7: Native compliance — `scripts/tokens/enforce-native-compliance.sh` exits 0
Gate 8: Snapshot baseline PNGs committed for every new story on both platforms (light + dark)
Gate 9: `parity-exemptions.json` updated only for genuinely platform-specific stories with explicit `reason` field
Gate 10: Scope compliance — `git diff --name-only ⊆ writeAllowed`

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Implementing missing component logic (T01–T09)
- Adding new atoms / molecules / tokens
- Snapshot baselines for atoms/molecules outside Sprint 02 scope
- Lowering parity thresholds to pass

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** iOS template/screen story coverage is sparse — IdleScreen 1, RouteResults 1, RouteDetails 2 (one buggy), Sessions 1, Error 1. iOS LSRouteCard exposes 1 story; Android already has 6. Cross-platform parity reports advisory-tier failures because iOS template stories don't exist; once they do, parity coverage should land in the high-90s.

**Gap:** Without snapshot baselines, every Sprint 03+ integration sprint risks silent regressions because the regression net is full of holes. This task closes the net.

--------------------------------------------------------------------------------
REVIEW
--------------------------------------------------------------------------------

For swift-reviewer (must pass ≤5):
- StoryCoverageTests has one test per AC; counts are deterministic
- New stories use canonical IDs only — verified by `pnpm snapshots:check`
- Snapshot baselines are non-empty PNGs (no transparent / 1×1 placeholders)
- No `Views/**` or `Theme/**` modifications — pure registration + baselines
- SCOPE respected on iOS

For kotlin-reviewer (must pass ≤5):
- Snapshot baselines committed for every new Android story (light + dark)
- No Android `main/` modifications — pure registration + baselines
- Story IDs canonical and match iOS counterparts
- `parity-exemptions.json` only adds genuine platform-only entries with reason
- SCOPE respected on Android

Should verify (both reviewers, ≤5 combined):
- `pnpm snapshots:parity-coverage` baseline shows the projected ≥95% per tier with new stories
- No accidental story-id duplication between tiers (e.g., the same id in molecules and organisms)
- Snapshot PNGs render without empty regions / black voids (visual sanity check on a sample)
- Sandbox launcher still browses cleanly (no crashes from un-mocked variants)
- `parity-exemptions.json` documentation is accurate (storm-gate is Android-only because iOS never had a storm mock — see Gap D2-03)

Verdict: [APPROVED | NEEDS_FIXES]
Feedback (required if NEEDS_FIXES):
```
[Specific, actionable issues — reference file:line where possible]
```

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALL of FID-S02-T01..T09 — every implementation task must commit BEFORE this task can register stories and capture baselines
Blocks:     Sprint 03 (which assumes a regression-protected sandbox baseline)
Parallel:   None (terminal task in the sprint)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN iOS sandbox story registry WHEN stories matching templates.idle-screen.* are counted THEN ≥7 stories registered (S01,S02,S03 dark,S04 filter sheet,V01,V02,V03) each with light+dark snapshot baseline PNG", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN iOS sandbox story registry WHEN stories matching templates.route-results.* are counted THEN ≥7 stories registered (S01,S02 alt,S03 dark,S04 refining,V01,V02 weather-divergent,V03 recall) with snapshots", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN iOS sandbox story registry WHEN stories matching templates.route-details.* are counted THEN ≥6 stories registered (S01,S02 mixed,S03 dark,S04 medium,S05 dismissing,V01 saved) with snapshots", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN iOS sandbox story registry WHEN stories matching templates.sessions-screen.* are counted THEN ≥5 stories registered (S01,S02 dark,S03 empty,S04 grouped,S05 new-confirm) with snapshots", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN iOS sandbox story registry WHEN stories matching templates.error-screen.* are counted THEN ≥6 stories registered (S01,S02 dark/storm,S03 extended,S04 recovered,V01 offline,V02 generic) with snapshots", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN iOS organism story registry WHEN stories matching organisms.route-card.* are counted THEN ≥6 stories registered (default,saved,alt,long-title,missing-data,dark) with snapshots", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN all Sprint 02 implementation tasks landed and snapshots regenerated WHEN pnpm snapshots:check + parity-coverage run THEN snapshots:check exits 0 and parity reports atoms≥95%, molecules≥95%, organisms≥90%, tokens=100%", "verify": "pnpm snapshots:check && pnpm snapshots:parity-coverage" },
    { "id": "TC-1", "type": "test_criterion", "description": "iOS story registry filtered by templates.idle-screen.* prefix returns ≥7 entries", "maps_to_ac": "AC-1", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/StoryCoverageTests/testIOSIdleStoryCoverage7" },
    { "id": "TC-2", "type": "test_criterion", "description": "iOS story registry filtered by templates.route-results.* prefix returns ≥7 entries", "maps_to_ac": "AC-2", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/StoryCoverageTests/testIOSRouteResultsStoryCoverage7" },
    { "id": "TC-3", "type": "test_criterion", "description": "iOS story registry filtered by templates.route-details.* prefix returns ≥6 entries", "maps_to_ac": "AC-3", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/StoryCoverageTests/testIOSRouteDetailsStoryCoverage6" },
    { "id": "TC-4", "type": "test_criterion", "description": "iOS story registry filtered by templates.sessions-screen.* prefix returns ≥5 entries", "maps_to_ac": "AC-4", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/StoryCoverageTests/testIOSSessionsStoryCoverage5" },
    { "id": "TC-5", "type": "test_criterion", "description": "iOS story registry filtered by templates.error-screen.* prefix returns ≥6 entries", "maps_to_ac": "AC-5", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/StoryCoverageTests/testIOSErrorStoryCoverage6" },
    { "id": "TC-6", "type": "test_criterion", "description": "iOS organism story registry filtered by organisms.route-card.* returns ≥6 entries", "maps_to_ac": "AC-6", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/StoryCoverageTests/testIOSRouteCardStoryCoverage6" },
    { "id": "TC-7", "type": "test_criterion", "description": "pnpm snapshots:check exits 0 and pnpm snapshots:parity-coverage reports atoms≥95%, molecules≥95%, organisms≥90%, tokens=100%", "maps_to_ac": "AC-7", "verify": "pnpm snapshots:check && pnpm snapshots:parity-coverage" }
  ]
}
-->
