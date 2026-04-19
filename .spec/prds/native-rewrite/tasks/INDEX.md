# Native Rewrite — Sprint Plan

**Project:** LaneShadow Native Rewrite
**Generated:** 2026-04-17 13:58:08 MDT
**Source PRD:** [README.md](../README.md)
**Output Path:** [tasks](/Users/justinrich/Projects/LaneShadow/.spec/prds/native-rewrite/tasks)
**Migration Note:** Sprint 2 now owns shared UI translation and fidelity sandbox work, and the former Sprint 2 through Sprint 9 have been renumbered to Sprint 3 through Sprint 10.
**Insertion Note (2026-04-18):** Sprint 1a was inserted between Sprint 1 and Sprint 2 to produce the spec, token, atomization, and fidelity-rig foundation that Sprint 2's rewritten form consumes. Sprint 2 will be archived and re-authored by Sprint 1a task FND-008.

## Overview

| Metric | Value |
|--------|-------|
| Sprint Count | 11 |
| Total Tasks | 73 |
| Human-Test Gates | 11 |
| Index Written | Yes |
| PRD Coverage | Repo restructure, component-matrix + token foundation, model translation protocol, component parity, RN Storybook baseline, auth, discovery, chat planning, comparison, navigation, recording, offline, voice, gatekeeper, parity retirement |

## Sprint Summary

| Sprint | Folder | Tasks | Gate Focus | Blocked By |
|--------|--------|-------|------------|------------|
| 1 | [sprint-01-repo-restructure](./sprint-01-repo-restructure/SPRINT.md) | 5 | Repo restructure and stable multi-app layout | None |
| 1a | [sprint-01a-foundation-rewrite](./sprint-01a-foundation-rewrite/SPRINT.md) | 9 | Matrix + token + model-plan + fidelity-rig foundation; rewrite Sprint 2 to 412 atomized tasks | Sprint 1 |
| 2 | [sprint-02-ui-component-translation](./sprint-02-ui-component-translation/SPRINT.md) | 10 | Shared UI translation, native sandbox modes, and fidelity verification | Sprint 1a |
| 3 | [sprint-03-auth-and-discovery-shell](./sprint-03-auth-and-discovery-shell/SPRINT.md) | 6 | Auth, themed map shell, and discovery on top of sandbox-verified UI | Sprints 1-2 |
| 4 | [sprint-04-chat-planning-and-comparison](./sprint-04-chat-planning-and-comparison/SPRINT.md) | 7 | Text planning, streamed responses, route comparison | Sprint 3 |
| 5 | [sprint-05-turn-by-turn-navigation](./sprint-05-turn-by-turn-navigation/SPRINT.md) | 7 | Start and complete turn-by-turn navigation | Sprints 3-4 |
| 6 | [sprint-06-ride-recording-and-saved-rides](./sprint-06-ride-recording-and-saved-rides/SPRINT.md) | 6 | Record, save, and share a ride | Sprint 5 |
| 7 | [sprint-07-offline-maps-and-cache-recovery](./sprint-07-offline-maps-and-cache-recovery/SPRINT.md) | 6 | Download regions and recover offline | Sprints 3-4, 6 |
| 8 | [sprint-08-voice-assistant](./sprint-08-voice-assistant/SPRINT.md) | 6 | Hands-free voice planning and ride control | Sprints 4-5 |
| 9 | [sprint-09-gatekeeper-and-platform-polish](./sprint-09-gatekeeper-and-platform-polish/SPRINT.md) | 6 | Trials, billing, onboarding, deep links, notifications | Sprints 3-4 |
| 10 | [sprint-10-native-parity-and-react-native-retirement](./sprint-10-native-parity-and-react-native-retirement/SPRINT.md) | 5 | Full parity validation and RN deletion | Sprints 2-9 |

## Dependency Summary

```text
Sprint 1
  -> Sprint 1a
Sprint 1a
  -> Sprint 2
Sprint 2
  -> Sprint 3
  -> Sprint 10
Sprint 3
  -> Sprint 4
  -> Sprint 5
  -> Sprint 7
  -> Sprint 9
  -> Sprint 10
Sprint 4
  -> Sprint 5
  -> Sprint 7
  -> Sprint 8
  -> Sprint 9
  -> Sprint 10
Sprint 5
  -> Sprint 6
  -> Sprint 8
  -> Sprint 10
Sprint 6
  -> Sprint 7
  -> Sprint 10
Sprint 7
  -> Sprint 10
Sprint 8
  -> Sprint 10
Sprint 9
  -> Sprint 10
```

## Notes

- Sprints are grouped by human-testable rider outcomes, not only by technical layer.
- Sprint 1a is a foundation sprint inserted 2026-04-18 because the original Sprint 2 bundled 85 tasks (up to 12 components per task) without pre-filled STYLE PROPERTIES MATRIX rows or resolved semantic tokens, which stalled AI implementers. Sprint 1a authors the matrices, resolves ~54 proposed tokens, atomizes Sprint 2 to ~412 UI tasks + N model tasks (one component × one platform), and ships a per-component screenshot-diff harness. Implementation code is not written in Sprint 1a.
- Sprint 1a also introduces the Model Translation Protocol (`08g`) so `react-native/lib/**` and `react-native/stores/**` get translated to Kotlin + Swift alongside the UI port.
- Sprint 2 establishes the shared scenario registry, screenshot workflow, and Android/iOS sandbox modes so UI fidelity is verified before rider-facing feature work resumes. Its pre-1a form is archived at `sprint-02-ui-component-translation/_archived/` after Sprint 1a runs.
- Sprint 3 consumes the shared token outputs and sandbox-verified component slice instead of owning token extraction locally.
- Sprint 10 still carries final parity closure and React Native retirement, but it inherits a smaller and better-instrumented backlog.
- React Native deletion remains intentionally last; no earlier sprint assumes the legacy app is removed.

## Next Steps

1. Run `/kb-sprint-tasks-plan .spec/prds/native-rewrite/tasks/sprint-01a-foundation-rewrite` to expand FND-001 through FND-009 into per-task acceptance criteria.
2. Execute with `/kb-run-sprint sprint-01a-foundation-rewrite` once task files exist.
3. After Sprint 1a closes, run `/kb-sprint-tasks-plan` against the newly-rewritten Sprint 2.
