# kb-run Reviewer Prompt

You are `swift-reviewer` for kb-run task `UC-MOL-02-ios`. This is review cycle 2 after remediation commit `01ac52af86279f0f2031d6a660591488bb941bfd`. This is a separate read-only review pass. Do not edit files, do not commit, do not modify `.kb-run` state.

Return ONLY valid JSON matching this schema:

```json
{
  "verdict": "APPROVED | NEEDS_FIXES",
  "confidence": "HIGH | MEDIUM | LOW",
  "tasks": [
    {
      "id": "UC-MOL-02-ios",
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
      "task_id": "UC-MOL-02-ios",
      "location": "file:line or symbol",
      "evidence": "specific code or behavior",
      "fix": "actionable remediation"
    }
  ],
  "summary": "short verdict summary"
}
```

`APPROVED` is valid only when every requirement is satisfied and there are no `CRITICAL` or `HIGH` findings.

Task file: `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-02-ios-toolbar-navheader-molecules.md`
Worktree: `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-02-ios`
Review base commit: `01b44c51bb1c9081a2c70e80783bc86d2dfb0a6a`
Review head commit: `01ac52af86279f0f2031d6a660591488bb941bfd`

Requirements:

- AC-1: `LSToolbarTests.test_default_render_uses_surface_primary_and_slot_atoms` passes and now proves the toolbar row binds to the 56pt toolbar-height token path rather than `theme.control.minHeight`.
- AC-2: `safeAreaInset(edge: .top)` or equivalent safe-area handling remains present and no status-bar hardcoding was introduced.
- AC-3: `LSNavHeaderTests.test_large_title_uses_opinion_lg_typography` passes and the large-title variant preserves `opinion.lg` plus the corrected nav-header spacing recipe.
- AC-4: `LSNavHeaderTests.test_default_variant_uses_ui_title_md` passes and default mode preserves `ui.title.md` with toolbar-height token binding.
- AC-5: Molecule source still contains no literal `Color(red:)`, `Color(hex:)`, `Font.system`, or deprecated `foregroundColor(` API.
- AC-6: Story registration remains complete for all 4 toolbar and 3 nav-header variants.

Previous review findings this remediation was intended to fix:

- Both molecules rendered at `theme.control.minHeight` instead of the required 56pt toolbar-height token.
- The previous tests were too superficial and missed the real 48pt vs 56pt regression.
- `LSNavHeader` spacing used compact tokens instead of the design recipe’s 16pt horizontal and bottom spacing.

Host / implementer validation already completed on this exact worktree state:

- `swiftformat --lint ios/LaneShadow/Views/Molecules/LSToolbar.swift ios/LaneShadow/Views/Molecules/LSNavHeader.swift ios/LaneShadowTests/Molecules/LSToolbarTests.swift ios/LaneShadowTests/Molecules/LSNavHeaderTests.swift` => pass
- `cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` => pass
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSToolbarTests/test_default_render_uses_surface_primary_and_slot_atoms -only-testing:LaneShadowTests/LSNavHeaderTests/test_large_title_uses_opinion_lg_typography -only-testing:LaneShadowTests/LSNavHeaderTests/test_default_variant_uses_ui_title_md -only-testing:LaneShadowTests/LSToolbarTests/test_all_seven_toolbar_navheader_stories_registered` => pass
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` => pass
- safe-area grep => pass
- forbidden API grep => pass

Changed files in this remediation diff:

- `ai-specs/UC-MOL-02/ios-learnings.md`
- `ios/LaneShadow/Views/Molecules/LSToolbar.swift`
- `ios/LaneShadow/Views/Molecules/LSNavHeader.swift`
- `ios/LaneShadowTests/Molecules/LSToolbarTests.swift`
- `ios/LaneShadowTests/Molecules/LSNavHeaderTests.swift`

Artifacts available:

- Implementer report: `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-02-ios/iterations/002/implementer-response.json`
- Prior reviewer verdict: `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-02-ios/iterations/001/reviewer-response.json`

Out-of-scope noise to ignore:

- `.kb-run-sprint-codex/.state.json.sha256`

Review focus:

- Judge the current worktree state against the full task contract, not just the remediation diff.
- Pay special attention to whether the new tests are now strong enough to catch the original height regression.
- Evaluate whether the `toolbarHeight = theme.space.xxxl + theme.space.sm` bridge is an acceptable token-backed resolution for this codebase, given the runtime `Theme` API still does not expose `sizing.component.toolbarHeight` directly.
