# Red-Hat Review Report

**Report Date**: 2026-04-25T14:45:00Z
**Target**: Sprint 5 Organisms (sprint-05-organisms)
**Reviewed By**: swift-reviewer, kotlin-reviewer

## Executive Summary

iOS organisms have critical quality gaps: attachment stories are empty (defeating the human testing gate), test quality remains poor with source-inspection patterns and manually-invoked callbacks, and the token sweep (REMEDIATION-04) left multiple hardcoded values. Android is functionally stronger — all organisms render real UI with behavioral tests — but still has 11 hardcoded dp values violating the token constitution. Both platforms share the 312dp drawer width and 160dp map preview height hardcodes.

## HIGH Confidence Findings (Both Agents Agree)

- [ ] **Story data gaps prevent visual verification** (CRITICAL) | iOS
      `LSNavigatorMessageStory.swift:22-48` — "withOneAttachment" and "withThreeAttachments" stories pass empty `attachments: []`. Human tester cannot verify attachment rendering.
      Agents: swift-reviewer, kotlin-reviewer (confirmed Android stories have data)

- [ ] **Token constitution violations remain on both platforms** (HIGH) | Cross-platform
      iOS: hardcoded 312, 5, 72, 160 dimensions + opacity fallbacks (0.22, 0.1, 0.05, 0.5)
      Android: hardcoded 40.dp (x3), 6.dp, 312.dp, 1.dp (x2), 160.dp, 5.dp, `space.xs / 3`
      REMEDIATION-04 iOS sweep was incomplete; Android sweep never happened.
      Agents: swift-reviewer, kotlin-reviewer

- [ ] **Drawer width (312) hardcoded on both platforms** (MEDIUM) | Cross-platform
      `LSSessionsDrawer.swift:57` (iOS), `LSSessionsDrawer.kt:80` (Android)
      No responsive adaptation, violates token constitution.
      Agents: swift-reviewer, kotlin-reviewer

- [ ] **Auto-dismiss timing tests don't verify actual timing** (HIGH) | iOS
      `LSNavigatorMessageTests.swift:89-125` — test manually invokes `onDismiss()` then asserts it was called. Does NOT verify 5000ms Task.sleep fires the callback.
      Agents: swift-reviewer

## MEDIUM Confidence Findings (Single Agent, High Detail)

- [ ] **Source-inspection test pattern persists** (HIGH) | iOS
      `LSNavigatorMessageTests.swift:279-301` — `test_no_banned_primitives` reads source files and checks string patterns. This is the exact anti-pattern from the Human Signal.
      Agent: swift-reviewer

- [ ] **Tap handler tests manually invoke closures** (MEDIUM) | iOS
      `LSInlineErrorCalloutTests.swift:45-65` — test asserts `tappedSuggestion == nil` ("No tap yet") but never simulates a tap. On Android, this IS properly tested.
      Agent: swift-reviewer

- [ ] **Opacity fallback values are magic numbers** (MEDIUM) | iOS
      `LSNavigatorMessage.swift:127`, `LSInlineErrorCallout.swift:71`, `LSSessionsDrawer.swift:64,154,160` — `theme.opacity.values["20"] ?? 0.22` pattern. Should fail-fast or use semantic defaults.
      Agent: swift-reviewer

- [ ] **Android missing token sweep** (MEDIUM) | Android
      REMEDIATION-04 was iOS-only. 11 hardcoded dp values remain in Android organisms.
      Agent: kotlin-reviewer

- [ ] **No cancellation handling in async tasks** (MEDIUM) | iOS
      `LSNavigatorMessage.swift:45-51` — `.task` with Task.sleep has no `Task.isCancelled` check. Orphaned tasks can fire callbacks after view dismissal.
      Agent: swift-reviewer

- [ ] **RecordingDot missing pulse animation** (LOW) | Android
      `LSTopBar.kt:256-268` — static Box with TODO comment "pulsing animation would be added in production".
      Agent: kotlin-reviewer

- [ ] **Map preview height hardcoded (160dp) on both platforms** (MEDIUM) | Cross-platform
      `LSRouteCard.swift:40` (iOS), `LSRouteCard.kt:56` (Android)
      Agent: swift-reviewer, kotlin-reviewer

- [ ] **Space division anti-pattern** (LOW) | Android
      `LSSessionsDrawer.kt:279` — `space.xs / 3` to derive border width. Should be dedicated token.
      Agent: kotlin-reviewer

## Agent Contradictions & Debates

| Topic | swift-reviewer | kotlin-reviewer | Assessment |
|-------|---------------|-----------------|------------|
| Test quality | Critical — source inspection, manual invocation, no timing verification | Strong — behavioral tests verify callbacks, timing, rendering | iOS tests are genuinely weaker. Android tests properly simulate compose interactions. |
| REMEDIATION-04 | FAIL — iOS sweep incomplete | PARTIAL — iOS done, Android never started | Both agree: token sweep incomplete. Kotlin reviewer correctly notes REMEDIATION-04 was iOS-only commit. |
| Story quality | FAIL — attachment stories empty | PASS — stories have proper data | iOS story data is genuinely missing. Android stories are correctly populated. |
| Overall verdict | NEEDS_FIXES | NEEDS_FIXES (token violations only) | Both agree fixes needed. iOS has deeper quality issues; Android is closer to merge-ready. |

## Recommendations by Category

1. **Gaps**: Fix iOS NavigatorMessage stories to include real attachment data. Complete Android token sweep (11 dp values).
2. **Risks**: Add Task.isCancelled guard to iOS auto-dismiss. Replace opacity fallbacks with fail-fast or semantic defaults.
3. **Test Quality**: Rewrite iOS `test_no_banned_primitives` as behavioral test. Replace manual-closure-invocation tests with actual tap simulation. The Android test patterns (Compose testing library) are the target quality bar.
4. **Tokens**: Create semantic tokens for drawer width (312dp), map preview height (160dp), chip size (40dp), indicator dot (5-6dp), border width (1dp). Apply to both platforms.

## Agent Reports (Summary)

- **swift-reviewer**: 12 HIGH confidence findings, 4 MEDIUM. Critical issues: empty story data, test theatre, incomplete token sweep. Verdict: NEEDS_FIXES.
- **kotlin-reviewer**: 8 HIGH confidence findings, 9 MEDIUM, 2 LOW. No critical stubs. Main issue: 11 hardcoded dp values. Verdict: NEEDS_FIXES (tokens only).

## Metadata

- **Agents**: swift-reviewer (Glob, Grep, Read, Bash), kotlin-reviewer (Glob, Grep, Read, Bash)
- **Confidence Framework**: HIGH (cross-agent agreement), MEDIUM (single agent, detailed evidence), LOW (single agent, minor)
- **Report Generated**: 2026-04-25T14:45:00Z
- **Duration**: ~2min (parallel dispatch)
- **Next Steps**: Fix iOS story data + test quality; complete Android token sweep; add missing semantic tokens to theme package
