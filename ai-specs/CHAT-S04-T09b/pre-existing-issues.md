# Pre-Existing Issues: CHAT-S04-T09b

## Baseline Comparison
- Baseline commit: `469821d6`
- Baseline command: `cd android && ./gradlew test`
- Baseline result: failed with `16` tests out of `432` completed
- T09b branch command: `cd android && ./gradlew test`
- T09b branch result: failed with `16` tests out of `440` completed

## Failure Set
The failure names were the same on baseline and branch:
- `SessionsDrawerTests.testDrawerSolidBackground`
- `SessionsDrawerTests.testActiveRowSignalWhisper`
- `SessionsDrawerTests.testDrawerShadowTier`
- `SessionsDrawerTests.testActiveStripeStrokeLg`
- `SessionsDrawerTests.testHamburger48dpTapTarget`
- `MockProviderVariantTest.test_allProviders_supportOverflowVariant`
- `MockProviderVariantTest.test_errorMockProvider_emptyVariant`
- `MockProviderVariantTest.test_allProviders_supportEmptyVariant`
- `MockProviderVariantTest.test_errorMockProvider_overflowVariant`
- `MockProviderVariantTest.test_allProviders_supportLongCopyVariant`
- `AuthScreenViewModelTest.continueFromEmail_setsSubmittingWhileResolverIsPending`
- `AuthScreensSourceStructureTest.authScreen_invalid_email_and_submitting_states_render_inline`
- `AuthScreensSourceStructureTest.authScreen_email_entry_renders_design_anatomy`
- `LSPhaseIndicatorTest.active_step_has_phase_dot_pulse_via_delegation`
- `LSRouteAttachmentCardTest.compact_mode_keeps_layout_contracts_and_badge_gate`
- `PlanningScreenTest.ac3_sketch_polyline_animation_references_motion_recipe`

## Conclusion
- No new full-suite failures were introduced by T09b.
- The branch remains aligned with the base failure set; the remaining failures are pre-existing and outside this task scope.
