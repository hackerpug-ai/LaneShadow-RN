# Native Rewrite — Sprint Plan

**Project:** LaneShadow Native Rewrite
**Generated:** 2026-04-17 13:58:08 MDT
**Source PRD:** [README.md](../README.md)
**Output Path:** [tasks](/Users/justinrich/Projects/LaneShadow/.spec/prds/native-rewrite/tasks)
**Migration Note:** Sprint 2 now owns shared UI translation and fidelity sandbox work, and the former Sprint 2 through Sprint 9 have been renumbered to Sprint 3 through Sprint 10.

## Overview

| Metric | Value |
|--------|-------|
| Sprint Count | 10 |
| Total Tasks | 64 |
| Human-Test Gates | 10 |
| Index Written | Yes |
| PRD Coverage | Repo restructure, token system, component parity, RN Storybook baseline, auth, discovery, chat planning, comparison, navigation, recording, offline, voice, gatekeeper, parity retirement |

## Sprint Summary

| Sprint | Folder | Tasks | Gate Focus | Blocked By |
|--------|--------|-------|------------|------------|
| 1 | [sprint-01-repo-restructure](./sprint-01-repo-restructure/SPRINT.md) | 5 | Repo restructure and stable multi-app layout | None |
| 2 | [sprint-02-ui-component-translation](./sprint-02-ui-component-translation/SPRINT.md) | 10 | Shared UI translation, native sandbox modes, and fidelity verification | Sprint 1 |
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
- Sprint 2 establishes the shared scenario registry, screenshot workflow, and Android/iOS sandbox modes so UI fidelity is verified before rider-facing feature work resumes.
- Sprint 3 consumes the shared token outputs and sandbox-verified component slice instead of owning token extraction locally.
- Sprint 10 still carries final parity closure and React Native retirement, but it inherits a smaller and better-instrumented backlog.
- React Native deletion remains intentionally last; no earlier sprint assumes the legacy app is removed.

## Next Steps

1. Run `/kb-sprint-tasks-plan .spec/prds/native-rewrite/tasks/sprint-01-repo-restructure`
2. Review or refine sprint sequencing before execution if platform staffing changes.
3. Execute with `/kb-run-sprint sprint-01-repo-restructure` after task files exist.
