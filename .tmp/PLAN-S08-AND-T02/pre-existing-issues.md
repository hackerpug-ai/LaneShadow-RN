# Pre-Existing Issues Blocking Commit

## Verification Method
- Stashed only the task edits with `git stash push -m 'PLAN-S08-AND-T02-preexisting-check'`
- Re-ran repo gates on the stashed tree
- Restored task edits with `git stash pop`

All issues below reproduced on the stashed tree, so they are not caused by this remediation.

## TypeScript / Tooling
- `pnpm type-check:native` fails before project type-checking because `tsgo` is not installed in this worktree environment.
- Output: `sh: tsgo: command not found`
- Output: `Local package.json exists, but node_modules missing`

## Lint / Formatting
- `pnpm exec biome check --no-errors-on-unmatched` fails on the stashed tree with a repo-wide Biome schema mismatch plus unrelated existing diagnostics.
- `biome.json` expects schema `2.4.12` while the CLI is `2.4.15`
- Existing unrelated diagnostics include:
- `react-native/app/(app)/_layout.tsx:7` unused `sessionId`
- multiple `logos/*.html` and `logos/v2/preview.html` missing `alt` text
- `LaneShadow-AppIcon-Pack-Gradient/web/site.webmanifest` formatting drift
- `implementer_response.json` formatting drift

## Android Test Failures
- `cd android && ./gradlew test` fails on the stashed tree with unrelated existing failures outside `PlanningScreen`.
- Reproduced failures include:
- `SessionsDrawerTests > testHamburger48dpTapTarget`
- `MockProviderVariantTest > test_allProviders_supportOverflowVariant`
- `MockProviderVariantTest > test_errorMockProvider_emptyVariant`
- `LSSavedPillTest > route_details_v01_shows_saved_pill_beside_best_badge`
- `AuthScreenViewModelTest > continueFromEmail_setsSubmittingWhileResolverIsPending`
- `AuthScreensSourceStructureTest > authScreen_invalid_email_and_submitting_states_render_inline`
- `LSRouteAttachmentCardTest > compact_mode_keeps_layout_contracts_and_badge_gate`
- `LSTopBarTest > default_renders_hamburger_and_new_chips_with_glass_chrome`
- `IdleScreenRetrofitTest > capsule_replaces_legacy_greeting_overlay`
- `IdleScreenTest > liveAdvisory_rendersCard`

## Task-Specific Status
- The exact PLAN-S08-AND-T02 verification commands for AC-1 through AC-7 pass on the task tree.
- Emulator visual verification succeeded for the planning sandbox story after `installDebug`.
