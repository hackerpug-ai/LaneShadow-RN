# Notebook: UC-ATM-10-ios

**Sprint:** sprint-02-atoms-foundation-primitives
**Started:** 2026-04-22T15:51:43.322Z

---


## Blocked — 2026-04-22T17:45:17Z
Reviewer verdict: NEEDS_FIXES. Blocking causes: current implementation creates app-local IconName/hand-authored Path glyphs instead of rendering generated design-owned catalog assets, real story registration is shadowed by a placeholder, and new Swift files are not in Xcode target membership while ios/LaneShadow.xcodeproj edits are prohibited/human-owned.

## Unblocked — 2026-04-22T18:02:00Z
Generated Swift theme package now exposes public IconName, IconPathSpec, and IconCatalog.pathSpecs(for:) from the design-owned SVG source catalog. Swift package tests pass, including generated icon catalog coverage. Xcode target membership should be handled through ios/project.yml/XcodeGen in the task worktree, not by hand-editing project internals.

## Blocked — 2026-04-22T18:23:48Z
Still blocked after existing iteration 002 review. Blocking causes: current branch uses app-local IconName and hand-authored paths instead of a generated public icon catalog API; LaneShadowStories.swift registers private placeholder LSIconStories; new Swift files are not in target membership, while xcodeproj edits are prohibited. Remediation requires generated catalog API availability plus project target membership through an allowed path.
