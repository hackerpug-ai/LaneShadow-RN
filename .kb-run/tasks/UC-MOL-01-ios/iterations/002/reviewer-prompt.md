# kb-run Reviewer Prompt

You are `swift-reviewer` for kb-run task `UC-MOL-01-ios`. This is review cycle 2 after a remediation commit. This is a separate read-only review pass. Do not edit files, do not commit, do not modify `.kb-run` state.

Return ONLY valid JSON matching this schema:

```json
{
  "verdict": "APPROVED | NEEDS_FIXES",
  "confidence": "HIGH | MEDIUM | LOW",
  "tasks": [
    {
      "id": "UC-MOL-01-ios",
      "verdict": "APPROVED | NEEDS_FIXES",
      "requirements": [
        {
          "id": "AC-1",
          "satisfied": true,
          "evidence": "file/test output",
          "remediation": null
        }
      ]
    }
  ],
  "findings": [
    {
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "task_id": "UC-MOL-01-ios",
      "location": "file:line or symbol",
      "evidence": "specific code or behavior",
      "fix": "actionable remediation"
    }
  ],
  "summary": "short verdict summary"
}
```

`APPROVED` is valid only when every requirement is satisfied and there are no `CRITICAL` or `HIGH` findings.

Task file: `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-01-ios-card-listrow-molecules.md`
Worktree: `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-01-ios`
Review base commit: `30a2fa2c1c352dae8029da8c89240a247480e158`
Review head commit: `13eeac25b48a66e97ba6265bceca4ec61dbe0b0f`

Requirements:
- AC-1: `LSContentCardTests.test_default_render_uses_surface_card_tokens` passes and verifies token-driven `LSCard` composition.
- AC-2: `LSContentCardTests.test_action_footer_slot_renders_below_metadata` passes and verifies footer placement without extra gap when absent.
- AC-3: `LSListRowTests.test_layout_tokens_and_minimum_touch_target` passes and verifies spacing, chevron composition, and 44pt touch target.
- AC-4: `LSListRowTests.test_ontap_fires_once_and_no_highlight_without_handler` passes and verifies tap behavior through the public interaction surface.
- AC-5: `LSContentCard.swift` and `LSListRow.swift` contain no `Color(red:)`, `Color(hex:)`, `Font.system`, or deprecated `foregroundColor(` usage.
- AC-6: `LSContentCardTests.test_all_ten_stories_registered` passes and verifies all 10 molecule stories register/render under light and dark themes.

Previous review findings that this remediation was intended to fix:
- Missing exact XCTest selectors for AC-1, AC-2, AC-3, AC-4, and AC-6.
- Tests relied too heavily on source/property inspection instead of rendered behavior.
- `.toggle` trailing content was a static icon and needed either semantic narrowing or an explicit non-interactive interpretation consistent with task scope.

Host validation summary already completed on this exact worktree state:
- `swiftformat --lint ios/LaneShadow/Views/Molecules/LSContentCard.swift ios/LaneShadow/Views/Molecules/LSListRow.swift ios/LaneShadowTests/Molecules/LSContentCardTests.swift ios/LaneShadowTests/Molecules/LSListRowTests.swift` => pass
- `cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` => pass
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSContentCardTests/test_default_render_uses_surface_card_tokens -only-testing:LaneShadowTests/LSContentCardTests/test_action_footer_slot_renders_below_metadata -only-testing:LaneShadowTests/LSListRowTests/test_layout_tokens_and_minimum_touch_target -only-testing:LaneShadowTests/LSListRowTests/test_ontap_fires_once_and_no_highlight_without_handler -only-testing:LaneShadowTests/LSContentCardTests/test_all_ten_stories_registered` => pass

Changed files in this remediation diff:
- `ai-specs/UC-MOL-01/ios-learnings.md`
- `ios/LaneShadow/Views/Molecules/LSContentCard.swift`
- `ios/LaneShadow/Views/Molecules/LSListRow.swift`
- `ios/LaneShadowTests/Molecules/LSContentCardTests.swift`
- `ios/LaneShadowTests/Molecules/LSListRowTests.swift`

Diff summary:
- `git diff --stat 30a2fa2c..13eeac25` reports 173 insertions and 108 deletions across the five files above.

Artifacts available:
- Implementer report: `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-01-ios/iterations/002/implementer-response.json`
- Reviewer-1 verdict: `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-01-ios/iterations/001/reviewer-response.json`
- Screenshot artifact: `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-01-ios/iterations/002/uc-mol-01-ios-remediation-iteration-002.png`

Out-of-scope noise to ignore:
- `.kb-run-sprint-codex/.state.json.sha256`
- Any regenerated `MapboxConfig.generated.swift` drift was reverted before review.

Review focus:
- Judge the current worktree state against the full task contract, not just the remediation diff.
- Verify the exact test selectors and their behavior claims, not only that they exist.
- Treat `ios-learnings.md` and the screenshot as supporting context only.
- If the `.toggle` row remains non-semantic, decide whether that is acceptable within this task’s documented scope and story contract; do not invent new product requirements.
