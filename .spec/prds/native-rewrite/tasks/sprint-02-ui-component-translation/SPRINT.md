# Sprint 2: UI Component Translation and Fidelity Sandbox (Atomized)

**Sequence:** 2
**Status:** Planned
**Structure:** Atomized — 388 UI tasks + 11 MDL tasks

## Overview

Translate all 194 React Native components to Kotlin/Compose (Android) and Swift/SwiftUI (iOS) following the atomic design hierarchy. Every RN component gets identically-named platform equivalents (e.g., `Button` → `Button.kt` + `Button.swift`) consuming the LaneShadow core theme contract.

**Key Change (2026-04-18):** Sprint 2 has been atomized from 85 multi-component tasks to 388 single-component tasks, each scoped for single-context-window AI execution. Original tasks are archived in `_archived/`.

## Atomization Strategy

**Why atomize?** The original 85-task structure failed because:
- Tasks spanned 5-10 components each, exceeding token limits
- Agents couldn't complete full tasks within one context window
- Parallel execution was unsafe (shared working tree conflicts)
- Mid-task decisions weren't documented in matrices

**New structure:**
- 1 component × 1 platform per task (e.g., `UI-001-android-button.md`, `UI-001-ios-button.md`)
- Every task references its specific matrix file (TRANSLATION SOURCES + STYLE PROPERTIES MATRIX)
- All design decisions pre-decided in `matrices/` directory
- Effort capped at S or M (never L or XL)
- Safe parallel execution across components

## Human Testing Gate

**Gate:** A reviewer can launch the installed native-sandbox library on Android and iOS via `make android_sandbox` / `make ios_sandbox`, browse every atom/molecule/organism/template/screen story registered in `AppStories.all` (Android) / `LaneShadowStories.all` (iOS), and confirm each native component renders with token-accurate parity against the React Native Storybook baseline.

## Human Test Deliverable

Both native platforms expose the native-sandbox library's sandbox mode with themed preview canvases (`.laneShadowTheme()` on iOS, `LaneShadowTheme { }` on Android) consuming the `UI-001` core theme contract, enabling side-by-side fidelity verification.

## Human Test Steps

1. Launch React Native Storybook and confirm baseline groups render in light/dark mode.
2. Run `make android_sandbox` and confirm `AppStories.all` exposes matching groups.
3. Run `make ios_sandbox` and confirm `LaneShadowStories.all` exposes matching groups.
4. For each completed component: browse RN/Android/iOS side-by-side and confirm token-accurate parity.
5. Confirm every UI task has completion record referencing translated files and Story entries.

## Source Coverage

- `06-technical-requirements.md`
- `08-design-system.md`
- `08a-atomic-component-catalog.md` (194 components)
- `08b-android-component-map.md` (Kotlin/Compose signatures)
- `08c-ios-component-map.md` (Swift/SwiftUI signatures)
- `08d-component-parity-spec.md` (cross-platform parity contract)
- `matrices/ui/**/*.md` (TRANSLATION SOURCES + STYLE PROPERTIES MATRIX)
- `matrices/models/**/*.md` (MODEL translation plans)

## Dependencies

- FND-001 — 31 atom matrices
- FND-002 — 108 molecule matrices
- FND-003 — 23 organism matrices
- FND-004 — 32 composition matrices
- FND-005 — Model inventory
- FND-006 — 11 MODEL translation plans

## Blocks

- Sprint 3: Auth and Discovery Shell
- Sprint 4: Chat Planning and Comparison
- Sprint 5: Turn-by-Turn Navigation
- Sprint 6: Ride Recording and Saved Rides
- Sprint 7: Offline Maps and Cache Recovery
- Sprint 8: Voice Assistant
- Sprint 9: Gatekeeper and Platform Polish
- Sprint 10: Native Parity and React Native Retirement

## Sprint Structure

### UI Tasks (388 total)

Atoms (31 components × 2 platforms = 62 tasks):
- UI-001 through UI-062: Core primitives, form controls, feedback, icons, branding, map polylines

Molecules (108 components × 2 platforms = 216 tasks):
- UI-063 through UI-278: Input components, cards, banners, overlays, planning widgets, weather components, map markers

Organisms (23 components × 2 platforms = 46 tasks):
- UI-279 through UI-324: Sheets, maps, chat, navigation, route details

Compositions (32 components × 2 platforms = 64 tasks):
- UI-325 through UI-388: Screen layouts, templates, error boundaries, visualizations

### MDL Tasks (11 total)

Model translations from TypeScript to Kotlin:
- MDL-001 through MDL-011: Auth tokens, storage, download queue, camera, checksums, weather optimization, etc.

## Parallel Execution Strategy

### Safe Parallelism

UI tasks are **leaf nodes** — they don't block other UI tasks. Atoms can run in parallel with molecules, organisms, and compositions. The only constraint is within-platform resource limits.

### Recommended Parallel Batches

**Wave 1 — Foundation (10 tasks × 2 platforms = 20 parallel):**
- All 10 atom variants (Button, Input, Checkbox, etc.) on Android + iOS simultaneously

**Wave 2 — Core Atoms (21 tasks × 2 platforms = 42 parallel):**
- Remaining atoms across both platforms

**Wave 3 — Molecules (108 tasks across both platforms):**
- 54 Android + 54 iOS in parallel (or platform-batched if resource-constrained)

**Wave 4 — Organisms (23 tasks × 2 platforms = 46 parallel):**
- All organisms across both platforms

**Wave 5 — Compositions (32 tasks × 2 platforms = 64 parallel):**
- All compositions across both platforms

**Wave 6 — MDL Tasks (11 tasks):**
- Kotlin-only model translations

### Worktree Protocol

When dispatching 2+ parallel subagents:
1. Verify clean working tree (`git status --porcelain`)
2. Create isolated worktrees per task at `.claude/worktrees/{task-id}/`
3. Pass worktree path explicitly in subagent prompt
4. Verify commits before merging
5. Clean up worktrees ONLY after successful merge

## Task Template Compliance

All tasks follow **TASK-TEMPLATE v5.0** with required sections:
- GOAL (1 sentence)
- DELIVERABLE (file paths)
- DONE WHEN (observable outcomes)
- ACCEPTANCE CRITERIA (TDD beads)
- READING LIST (max 5 files)
- GUARDRAILS (WRITE-ALLOWED/PROHIBITED, MUST/MUST NOT)
- CODE PATTERN (reference implementation)
- CONTEXT (current state + gap)
- AGENT INSTRUCTIONS (step-by-step)
- DEPENDENCIES (explicit blocking relationships)

## Quality Assurance

### Evidence Gates

1. **Original tasks archived:** `ls _archived/*.md | wc -l` returns 86
2. **Atomized UI tasks created:** `ls UI-*.md | wc -l` returns 388
3. **MDL tasks created:** `ls MDL-*.md | wc -l` returns 11
4. **SPRINT.md mentions atomized:** `grep -q 'atomized' SPRINT.md && grep -q 'parallel' SPRINT.md`
5. **INDEX.md lists dependencies:** `test -f INDEX.md && wc -l INDEX.md` returns > 200
6. **Task template compliance:** All UI-*.md and MDL-*.md contain GOAL, DELIVERABLE, DONE WHEN, ACCEPTANCE CRITERIA sections

### Random Sampling

Random sample of 10 tasks should score >= 80/115 on quality rubric:
- References specific matrix file by exact path (10 pts)
- One component × one platform (15 pts)
- Effort S or M only (10 pts)
- All required sections present (40 pts)
- DEPENDENCIES populated (10 pts)
- READING LIST <= 5 files (10 pts)
- GUARDRAILS complete (20 pts)

## Index

See `INDEX.md` for complete task listing with dependency graph.

## Archive

Original 85-task structure is preserved in `_archived/` for reference. Those files MUST NOT be modified.

---

**Total: 399 atomized tasks (388 UI + 11 MDL)**
**Estimated effort: ~199-399 agent-hours (S=0.5h, M=1h)**
**Parallel execution: ~20-40 calendar hours with sufficient parallel capacity**
