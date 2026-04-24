# Reviewer Packet: UC-MOL-08-ios

Execution unit: `UC-MOL-08-ios`
Task file: `.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-08-ios-location-route-molecules.md`
Base commit: `69917ef488ed3ef95e8ec9318251d95193528634`
Candidate commit: `4ecccd6d02a43c6532459a6ceda238dc3ede8a00`
Checkpoint branch: `kb-run/sprint-04-UC-MOL-08-ios`

## Scope

- `ios/LaneShadow/Views/Molecules/LSLocationContextBar.swift`
- `ios/LaneShadow/Views/Molecules/LSRouteAttachmentCard.swift`
- `ios/LaneShadowTests/Molecules/LSLocationContextBarTests.swift`
- `ios/LaneShadowTests/Molecules/LSRouteAttachmentCardTests.swift`
- `ios/LaneShadow/Sandbox/Stories/Molecules/LSLocationContextBarStory.swift`
- `ios/LaneShadow/Sandbox/Stories/Molecules/LSRouteAttachmentCardStory.swift`
- `ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift`
- `ios/project.yml`
- `ios/LaneShadow.xcodeproj/project.pbxproj`
- `ios/LaneShadow/Views/Atoms/LSIcon.swift`
- `tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift`
- `tokens/platforms/swift/Tests/LaneShadowThemeTests/ThemeTests.swift`

## Task Requirements

- AC-1: `LSLocationContextBar` renders two `LSTagPill` atoms with space-between layout and leading pin icon.
- AC-2: Tapping the mode pill fires `onModeChange` exactly once.
- AC-3: `LSRouteAttachmentCard` best variant renders LSCard container, route stripe, `LSBestBadge`, `LSWeatherBadge`, and metrics row.
- AC-4: Selected state switches border token to `color.signal.default`.
- AC-5: Compact mode hides `LSBestBadge` and `LSWeatherBadge` and uses `10pt vertical / 12pt horizontal` padding.
- AC-6: `alt1` and `alt2` route variants resolve stripe colors from route tokens.
- AC-7: Card `onTap` fires exactly once.
- AC-8: Sandbox stories exist for both molecules.
- TC-8: No literal hex colors or `Image(systemName:)` in molecule source.
- TC-10: Legacy `ios/LaneShadow/Views/Molecules/RouteAttachmentCard.swift` remains unchanged.

## Prior Review Findings To Re-check

- High: scenic meter previously used star icons instead of a five-dot filled/hollow meter through `LSIcon`.
- High: compact padding previously used `vertical: 2, horizontal: 4` instead of `10/12`.
- Medium: tests previously failed to assert scenic meter shape and compact padding strongly enough.

## Validation Evidence

- `swiftformat --lint ios/LaneShadow/Views/Molecules/LSLocationContextBar.swift ios/LaneShadow/Views/Molecules/LSRouteAttachmentCard.swift ios/LaneShadowTests/Molecules/LSLocationContextBarTests.swift ios/LaneShadowTests/Molecules/LSRouteAttachmentCardTests.swift ios/LaneShadow/Sandbox/Stories/Molecules/LSLocationContextBarStory.swift ios/LaneShadow/Sandbox/Stories/Molecules/LSRouteAttachmentCardStory.swift` -> pass
- `cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` -> pass
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSLocationContextBarTests -only-testing:LaneShadowTests/LSRouteAttachmentCardTests` -> pass
- `grep -n 'Color(red:\\|Color(hex:\\|Image(systemName:' ios/LaneShadow/Views/Molecules/LSLocationContextBar.swift ios/LaneShadow/Views/Molecules/LSRouteAttachmentCard.swift | wc -l | xargs test 0 -eq` -> pass

## Candidate Summary

- Scenic meter was reworked to a five-dot filled/hollow meter using new `LSIcon` names `.circle` and `.circleFill`.
- `LSRouteAttachmentCard.contentPadding(compact:)` now returns `vertical: 10, horizontal: 12` in compact mode.
- Tests were strengthened to assert scenic-meter mapping and compact padding values directly.
- Residual implementation note from the implementer: circle icon cases were added directly to generated Swift token output because no upstream non-generated icon definition existed in the worktree.

## Review Instructions

1. Review the exact diff with `git diff 69917ef488ed3ef95e8ec9318251d95193528634..4ecccd6d02a43c6532459a6ceda238dc3ede8a00`.
2. Read every changed file in full, with extra scrutiny on `LSRouteAttachmentCard.swift`, `LSIcon.swift`, and the generated token changes.
3. Confirm whether modifying generated Swift token output is acceptable for this task or a regression risk that should block approval.
4. Confirm the legacy `RouteAttachmentCard.swift` file is unchanged.
5. Return only JSON matching the required reviewer verdict schema.
