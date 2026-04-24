# UC-MOL-03 iOS Learnings

- `LSBottomSheet` should stay on native SwiftUI `.sheet` presentation with explicit fractional detents `0.25`, `0.5`, and `0.9`; tests are safer when they assert individual fractions instead of a single formatting-sensitive source string.
- `LSToast` can satisfy token-driven auto-dismiss timing by wrapping motion recipe durations in small helper types and using `Task.sleep(for:)`, which avoids banned `DispatchQueue.main.asyncAfter` usage.
- `LSModal` composes cleanly with existing atoms when title and body both route through `LSText` and actions are described as value types that map directly to `LSButton` variants.
- Story registration remains a real integration point in this repo because `MoleculesStories.swift` is the aggregation surface and `ios/project.yml` controls source membership for new story, view, and test files.
- Regenerating the Xcode project from `ios/project.yml` is sufficient for new file membership, but generated environment-derived files should be reviewed so unrelated local token changes do not leak into task scope.
