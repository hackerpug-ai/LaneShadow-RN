# Remediation Packet: UC-MOL-08-android

Execution unit: `UC-MOL-08-android`
Task file: `.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-08-android-location-route-molecules.md`
Worktree: `.kb-run/worktrees/UC-MOL-08-android`
Current head: `02b5a01cb67d8d04dbd4e4881fb33721da7ec795`
Base approved dependency: `079b8e4c9a666a42434a18bb66fcde27c0b29855` (`UC-MOL-05-android`)

## Recovered Reviewer Findings

The prior reviewer session did not emit a verdict artifact, but the transcript and scoped-file review were sufficient to recover these blocking issues:

1. HIGH
   File: `android/app/src/main/java/com/laneshadow/ui/molecules/LSRouteAttachmentCard.kt`
   Problem: the route attachment container is built directly with `Surface`, not the required `LSCard` atom.
   Required fix: recompose the molecule so the card surface ownership goes through `LSCard`, while still rendering the left stripe, selected border behavior, and compact/full padding correctly.

2. HIGH
   File: `android/app/src/main/java/com/laneshadow/ui/molecules/LSRouteAttachmentCard.kt`
   Problem: the scenic meter uses raw `Box`/`CircleShape` dots, but the task explicitly requires scenic dots through `LSIcon` atoms rather than raw circle primitives.
   Required fix: render the filled and hollow scenic dots with `LSIcon` atoms and token-backed icon/color paths only.

3. MEDIUM
   Files: `android/app/src/test/java/com/laneshadow/ui/molecules/LSRouteAttachmentCardTest.kt`, `android/app/src/test/java/com/laneshadow/ui/molecules/LSLocationContextBarTest.kt`
   Problem: tests are mostly source-text inspections and helper assertions, so they would miss the atom-composition regressions above.
   Required fix: strengthen tests to verify behavior/composition contracts that fail when `LSCard` or `LSIcon` atom usage regresses.

4. MEDIUM
   File: `android/app/src/main/java/com/laneshadow/ui/molecules/LSRouteAttachmentCard.kt`
   Problem: compact/full layout should continue to match the UC-MOL-08 spec after the `LSCard` refactor; avoid reintroducing padding or badge regressions while fixing atom composition.
   Required fix: keep AC-3 through AC-8 green while changing the container and scenic meter implementation.

## Unresolved Requirements

- AC-3: best-selected route card must still render all required slots.
- AC-4: compact mode must still suppress best/weather badges and preserve tighter padding.
- AC-5: route stripe colors must remain token-driven.
- AC-8: atom-composition gate must hold after the refactor.

## Validation Required Before Handoff

- `cd android && ./gradlew detekt`
- `cd android && ./gradlew :app:compileDebugKotlin`
- `cd android && ./gradlew test`
- targeted unit tests for `LSLocationContextBarTest` and `LSRouteAttachmentCardTest`
- direct `grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSLocationContextBar.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSRouteAttachmentCard.kt`

## Handoff Contract

Return a completion packet with:
- commit SHA
- changed files
- concise RED/GREEN evidence
- exact commands run and pass/fail status
- residual risks, including any still-unavailable connected-device checks
