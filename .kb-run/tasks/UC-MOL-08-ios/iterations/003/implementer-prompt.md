# Remediation Packet: UC-MOL-08-ios

Execution unit: `UC-MOL-08-ios`
Task file: `.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-08-ios-location-route-molecules.md`
Worktree: `.kb-run/worktrees/UC-MOL-08-ios`
Current head: `4ecccd6d02a43c6532459a6ceda238dc3ede8a00`
Base approved dependency: `69917ef488ed3ef95e8ec9318251d95193528634` (`UC-MOL-05-ios`)

## Unresolved Requirements

- AC-3: `LSRouteAttachmentCard` best variant must match the documented composition.
- AC-5: compact mode must truly render with `10pt vertical / 12pt horizontal` padding.
- AC-8: stories/tests must verify the corrected behavior, not just helper/source strings.
- Cross-cutting: generated token outputs must stay sourced from the token pipeline, not direct edits to `Generated/Tokens.swift`.

## Reviewer Findings To Fix

1. CRITICAL
   File: `tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift`
   Problem: `circle` / `circleFill` were added directly to generated Swift output, but the source-of-truth icon manifest and other generated platforms were not updated.
   Required fix: add any required new icons to the token source of truth (`tokens/semantic/icons.json` plus any missing SVG/icon pipeline inputs), regenerate all affected platform outputs, and remove direct manual edits to generated Swift token files.

2. HIGH
   File: `ios/LaneShadow/Views/Molecules/LSRouteAttachmentCard.swift`
   Problem: compact padding is not the actual rendered outer padding because `LSCard` adds its own padding before the molecule adds more. Effective compact padding is larger than the required `10/12`.
   Required fix: make the rendered compact card padding land at exactly `10pt vertical / 12pt horizontal`, either by using an LSCard configuration without built-in padding or by consolidating padding into one layer.

3. HIGH
   File: `ios/LaneShadow/Views/Molecules/LSRouteAttachmentCard.swift`
   Problem: the metrics row still renders `distance + duration + elevation + scenic dots`, but the UC-MOL-08 spec requires `distance + duration + 5-dot scenic meter + SCENIC label`.
   Required fix: remove the extra elevation metric from this molecule, add the `SCENIC` label in the required label typography/content color, and align stories/tests with that documented composition.

4. MEDIUM
   File: `ios/LaneShadowTests/Molecules/LSRouteAttachmentCardTests.swift`
   Problem: tests still rely too heavily on helper/source inspection and miss the real regressions.
   Required fix: strengthen tests to assert effective compact padding after composition and the required scenic label/output, not just helper values or source strings.

## Additional Constraints

- Do not modify the legacy file `ios/LaneShadow/Views/Molecules/RouteAttachmentCard.swift`.
- Keep the scenic meter on atom paths only.
- Preserve the already-fixed star-vs-dot regression.
- Keep `LSLocationContextBar` compliant.
- If new icons are required, fix them at the token source and regenerate; do not patch generated outputs by hand.

## Validation Required Before Handoff

- `swiftformat --lint ios/LaneShadow/Views/Molecules/LSLocationContextBar.swift ios/LaneShadow/Views/Molecules/LSRouteAttachmentCard.swift ios/LaneShadowTests/Molecules/LSLocationContextBarTests.swift ios/LaneShadowTests/Molecules/LSRouteAttachmentCardTests.swift ios/LaneShadow/Sandbox/Stories/Molecules/LSLocationContextBarStory.swift ios/LaneShadow/Sandbox/Stories/Molecules/LSRouteAttachmentCardStory.swift`
- `cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSLocationContextBarTests -only-testing:LaneShadowTests/LSRouteAttachmentCardTests`
- `grep -n 'Color(red:\\|Color(hex:\\|Image(systemName:' ios/LaneShadow/Views/Molecules/LSLocationContextBar.swift ios/LaneShadow/Views/Molecules/LSRouteAttachmentCard.swift | wc -l | xargs test 0 -eq`

## Handoff Contract

Return a completion packet with:
- commit SHA
- changed files
- concise RED/GREEN evidence
- exact commands run and pass/fail status
- any residual risks
