# Pre-existing Issues — AUTH-S03-T04

Date: 2026-04-28
Worktree: /Users/justinrich/Projects/LaneShadow/.claude/worktrees/AUTH-S03-T04

## Current command outcomes

1. `cd android && ./gradlew :app:compileDebugKotlin`  
   Status: PASS (`BUILD SUCCESSFUL`)

2. `cd android && ./gradlew :app:testDebugUnitTest`  
   Status: FAIL (`370 tests completed, 13 failed`)

   Failing tests reported:
   - `SessionsDrawerTests.testDrawerSolidBackground` (`NullPointerException` at `RobolectricIdlingStrategy.android.kt:32`)
   - `SessionsDrawerTests.testActiveRowSignalWhisper` (`NullPointerException` at `RobolectricIdlingStrategy.android.kt:32`)
   - `SessionsDrawerTests.testDrawerShadowTier` (`NullPointerException` at `RobolectricIdlingStrategy.android.kt:32`)
   - `SessionsDrawerTests.testActiveStripeStrokeLg` (`NullPointerException` at `RobolectricIdlingStrategy.android.kt:32`)
   - `SessionsDrawerTests.testHamburger48dpTapTarget` (`NullPointerException` at `RobolectricIdlingStrategy.android.kt:32`)
   - `MockProviderVariantTest.test_allProviders_supportOverflowVariant` (`AssertionError` at `MockProviderVariantTest.kt:252`)
   - `MockProviderVariantTest.test_errorMockProvider_emptyVariant` (`AssertionError` at `MockProviderVariantTest.kt:171`)
   - `MockProviderVariantTest.test_allProviders_supportEmptyVariant` (`AssertionError` at `MockProviderVariantTest.kt:233`)
   - `MockProviderVariantTest.test_errorMockProvider_overflowVariant` (`AssertionError` at `MockProviderVariantTest.kt:179`)
   - `MockProviderVariantTest.test_allProviders_supportLongCopyVariant` (`AssertionError` at `MockProviderVariantTest.kt:276`)
   - `LSPhaseIndicatorTest.active_step_has_phase_dot_pulse_via_delegation` (`AssertionError` at `LSPhaseIndicatorTest.kt:67`)
   - `LSRouteAttachmentCardTest.compact_mode_keeps_layout_contracts_and_badge_gate` (`AssertionError` at `LSRouteAttachmentCardTest.kt:39`)
   - `PlanningScreenTest.ac3_sketch_polyline_animation_references_motion_recipe` (`AssertionError` at `PlanningScreenTest.kt:150`)

3. `cd android && ./gradlew :app:ktlintCheck`  
   Status: FAIL (command/task mismatch)

   Error:
   - `Cannot locate tasks that match ':app:ktlintCheck' as task 'ktlintCheck' not found in project ':app'.`

## Evidence logs
- `.tmp/AUTH-S03-T04/testDebugUnitTest.log`
- `.tmp/AUTH-S03-T04/compileDebugKotlin.log`
- `.tmp/AUTH-S03-T04/ktlintCheck.log`
