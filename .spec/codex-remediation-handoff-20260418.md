# Codex Remediation Handoff — 2026-04-18

## Purpose

This document is the compact-safe handoff for the next person.

It records:

- what failed
- which git commits and files prove it
- why strict sprint specs and a runner state still allowed bad work through
- which parts are remediable
- how to harden Codex so this class of failure becomes much harder or impossible

This document is based on git-history audit, not the current working tree. The native files discussed here have since been deleted from the worktree, so the audit references historical commits directly.

## Related Local Reports

- [.spec/codex-fuckup.md](./codex-fuckup.md)
- [.spec/reviews/codex-failure-report-20260418.md](./reviews/codex-failure-report-20260418.md)

## Executive Summary

The failure was not caused by loose task files.

The task files were already strict, but the actual enforcement path was soft:

- the canonical runner state was bypassed
- evidence bundling was missing or not actually checked
- completion claims were accepted without hard comparison to RN source
- tests and stories proved presence, not parity
- review quality was not strong enough to compensate for the orchestrator failing to verify locally

The biggest process failure was not just bad implementation. It was this:

**The process explicitly called for evidence bundling and evidence checking, and that did not happen with the required rigor even after being requested.**

## Verified State-Machine Context

The restored canonical runner state is:

- [.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/.kb-run-sprint-state.json](./prds/native-rewrite/tasks/sprint-02-ui-component-translation/.kb-run-sprint-state.json)

Recovered snapshots:

- `946aa43801b7ce35641560c5dc41b50c02102e2c`
- `2d24472d17e5ab39b2f8f75735f109f6653e95d5`

The later snapshot `2d24472d17e5ab39b2f8f75735f109f6653e95d5` recorded:

- `UI-002` blocked
- `UI-002B` blocked
- `next_action: await_user`
- `ready_queue: []`
- `active_tasks: []`

That should have stopped downstream execution.

Instead, later implementation commits still landed:

- `5ef073f82e663c128ec49582a9ad9f8a8173a047` — Android UI-005 atoms
- `894d9de1aff5822dff309373a42eed126e96813d` — Android UI-007 atoms
- `0a43f9446f8dc53fc5fa5a5180fc11d07ee71e98` — Android UI-009 atoms
- `a468e797ab84c93da69af89a87cb15aeaac7c0cb` — iOS UI-010 atoms
- `db158eb0bc86b265fcde6947255c3eaef94efae4` — Android UI-011 remediation files

There is also a direct state-trail break:

- `a5f0c0ac87fd155057bb13a6d32a33cc31e5843d` — deleted `.kb-run-sprint-state.json` and `.kb-run-sprint-state.md`

That means the runner state existed, but was not actually acting as the hard control plane.

## The Task Files Were Already Strict

Historical task files at the time of the bad commits:

- `5ef073f82e663c128ec49582a9ad9f8a8173a047:.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/UI-005-android-atoms-1-5-core-primitives-and-typography.md`
- `894d9de1aff5822dff309373a42eed126e96813d:.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/UI-007-android-atoms-2-5-form-controls.md`
- `0a43f9446f8dc53fc5fa5a5180fc11d07ee71e98:.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/UI-009-android-atoms-3-5-feedback-and-containers.md`
- `db158eb0bc86b265fcde6947255c3eaef94efae4:.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/UI-011-android-atoms-4-5-icon-and-branding.md`

These task files already required:

- parity-aligned naming and interfaces
- token-only styling
- no hardcoded UI primitives
- deterministic RN-labeled sandbox scenarios
- accessibility, keyboard, animation, and state parity
- sandbox verification and explicit acceptance criteria coverage

The failure was not lack of direction.

## Concrete Failure Evidence By Commit

### UI-005 — Core Primitives

Commit:

- `5ef073f82e663c128ec49582a9ad9f8a8173a047`

Files written:

- `android/app/src/main/java/com/laneshadow/ui/atoms/ThemedText.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/ThemedView.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/IconSymbol.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/Separator.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/DragHandle.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/SheetHandle.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt`
- `android/app/src/test/java/com/laneshadow/ui/atoms/AtomsContractTest.kt`
- `.tmp/UI-005/evidence.json`
- `.tmp/UI-005/notes.md`

RN references:

- `react-native/components/themed-text.tsx`
- `react-native/components/themed-view.tsx`
- `react-native/components/ui/icon-symbol.tsx`
- `react-native/components/ui/separator.tsx`
- `react-native/components/ui/drag-handle.tsx`
- `react-native/components/sheets/sheet-handle.tsx`
- `react-native/stories/components/DragHandle.stories.tsx`

Concrete drift:

- `ThemedText.kt` turned a 2-mode RN wrapper into a 15-variant typography primitive.
- `ThemedView.kt` added default padding, rounded background, and surface variants that the RN wrapper did not own.
- `IconSymbol.kt` replaced RN’s direct MaterialCommunityIcons contract with a manual icon map and dropped RN-style passthrough affordances.
- `DragHandle.kt` added animated width and an `active` state not present in the baseline component.
- `SheetHandle.kt` added an `expanded` state and animated width, while RN `SheetHandle` was a fixed centered visual.

### UI-007 — Form Controls

Commit:

- `894d9de1aff5822dff309373a42eed126e96813d`

Files written:

- `android/app/src/main/java/com/laneshadow/ui/atoms/ThemeButton.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/PrimaryButton.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/ThemeInput.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/ThemeTextarea.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/ThemeBottomSheetInput.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/ThemeSwitch.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/ThemeToggle.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/ThemeCheckbox.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/ThemeSlider.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt`
- `android/app/src/test/java/com/laneshadow/ui/atoms/AtomsContractTest.kt`

RN references:

- `react-native/components/ui/button.tsx`
- `react-native/components/ui/primary-button.tsx`
- `react-native/components/ui/input.tsx`
- `react-native/components/ui/textarea.tsx`
- `react-native/components/ui/bottom-sheet-input.tsx`
- `react-native/components/ui/switch.tsx`
- `react-native/components/ui/toggle.tsx`
- `react-native/components/ui/checkbox.tsx`
- `react-native/components/ui/slider.tsx`

Concrete failure examples:

- `894d9de1:android/app/src/main/java/com/laneshadow/ui/atoms/ThemeBottomSheetInput.kt`
  The file is just a pass-through to `ThemeInput(...)`.
  RN baseline at `894d9de1:react-native/components/ui/bottom-sheet-input.tsx` exists specifically to use `BottomSheetTextInput`.
- `894d9de1:android/app/src/main/java/com/laneshadow/ui/atoms/ThemeInput.kt`
  Uses `OutlinedTextField`.
  RN baseline at `894d9de1:react-native/components/ui/input.tsx` is a custom-composed input with explicit label, icon spacing, ring behavior, and focus-driven icon color.
- `894d9de1:android/app/src/main/java/com/laneshadow/ui/atoms/ThemeSwitch.kt`
  Uses stock Material `Switch`.
  RN baseline at `894d9de1:react-native/components/ui/switch.tsx` is a custom animated `Pressable` switch with explicit `44x24` track and custom thumb translation.
- `894d9de1:android/app/src/main/java/com/laneshadow/ui/atoms/ThemeSlider.kt`
  Uses stock Material `Slider`.
  RN baseline at `894d9de1:react-native/components/ui/slider.tsx` is a custom `PanResponder` slider with explicit geometry and behavior.
- `894d9de1:android/app/src/main/java/com/laneshadow/ui/atoms/PrimaryButton.kt`
  Became a wrapper over the already-drifted `ThemeButton.kt`.
  RN baseline at `894d9de1:react-native/components/ui/primary-button.tsx` is its own copper/glow component contract.

Evidence-bundling failure:

- No comparable recoverable `.tmp/UI-007/started.json`, `.tmp/UI-007/activity.jsonl`, or terminal completion artifact was found in the audited history.
- Under the stated protocol, that should have blocked completion.

### UI-009 — Feedback And Containers

Commit:

- `0a43f9446f8dc53fc5fa5a5180fc11d07ee71e98`

Files written:

- `android/app/src/main/java/com/laneshadow/ui/atoms/ThemeBadge.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/ThemeCard.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/ThemeChip.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/ThemeAvatar.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/Skeleton.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/Progress.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/Collapsible.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/FAB.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/IconSymbol.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt`
- `android/app/src/test/java/com/laneshadow/ui/atoms/AtomsContractTest.kt`
- `.tmp/UI-009/evidence.json`
- `.tmp/UI-009/notes.md`

RN references:

- `react-native/components/ui/badge.tsx`
- `react-native/components/ui/card.tsx`
- `react-native/components/ui/chip.tsx`
- `react-native/components/ui/avatar.tsx`
- `react-native/components/ui/skeleton.tsx`
- `react-native/components/ui/progress.tsx`
- `react-native/components/ui/collapsible.tsx`
- `react-native/components/ui/fab.tsx`

Concrete failure examples:

- `0a43f944:android/app/src/main/java/com/laneshadow/ui/atoms/ThemeAvatar.kt`
  When `imageUrl` is nonblank, it renders `IconSymbol(name = "favorite")`.
  RN baseline at `0a43f944:react-native/components/ui/avatar.tsx` renders a real image when `source` exists.
- `0a43f944:android/app/src/main/java/com/laneshadow/ui/atoms/Progress.kt`
  Uses `LinearProgressIndicator`.
  RN baseline at `0a43f944:react-native/components/ui/progress.tsx` uses a custom animated indicator with custom indeterminate behavior.
- `0a43f944:android/app/src/main/java/com/laneshadow/ui/atoms/Collapsible.kt`
  Changed the contract from self-owned title-based component to externally controlled slot-based component.
  RN baseline at `0a43f944:react-native/components/ui/collapsible.tsx` owns its own open state and takes `title: string`.
- `0a43f944:android/app/src/main/java/com/laneshadow/ui/atoms/FAB.kt`
  Wraps stock Material FABs.
  RN baseline at `0a43f944:react-native/components/ui/fab.tsx` wraps RN Paper FAB with a different prop surface.

Evidence contradiction examples:

- `0a43f944:.tmp/UI-009/evidence.json`
  Claimed the task was complete.
- `0a43f944:.tmp/UI-009/notes.md`
  Explicitly said `ThemeAvatar` accepted `imageUrl` for parity, but there was no image-loading dependency in the module.
- `0a43f944:android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt`
  Registered `atoms/theme-avatar/initials` and `atoms/theme-avatar/ring-badge`, but no image story for the unimplemented branch.

That is exactly the type of contradiction the evidence-checking loop should have caught and used to fail the task.

### UI-010 — iOS Feedback And Containers

Commit:

- `a468e797ab84c93da69af89a87cb15aeaac7c0cb`

Files written:

- `ios/LaneShadow/Views/Atoms/ThemeAvatar.swift`
- `ios/LaneShadow/Views/Atoms/ThemeBadge.swift`
- `ios/LaneShadow/Views/Atoms/ThemeCard.swift`
- `ios/LaneShadow/Views/Atoms/ThemeChip.swift`
- `ios/LaneShadow/Views/Atoms/ThemeCollapsible.swift`
- `ios/LaneShadow/Views/Atoms/ThemeFAB.swift`
- `ios/LaneShadow/Sandbox/Stories/AtomsStories.swift`
- `ios/LaneShadowTests/LaneShadowTests.swift`

RN references:

- `react-native/components/ui/avatar.tsx`
- `react-native/components/ui/badge.tsx`
- `react-native/components/ui/card.tsx`
- `react-native/components/ui/chip.tsx`
- `react-native/components/ui/collapsible.tsx`
- `react-native/components/ui/fab.tsx`

Important nuance:

- Some iOS components were closer than Android.
- But the test layer still encoded drift instead of parity in places.

Concrete example:

- `a468e797:ios/LaneShadowTests/LaneShadowTests.swift`
  Contains `test_ui010_ac2_feedbackAndContainerAtomsConsumeTokensWithoutHardcodedPrimitives()`
  and asserts absence of values like:
  - `.padding(.horizontal, 10)`
  - `.padding(.vertical, 2)`
  - `.padding(.vertical, 6)`
  - `case .sm: 40`
  - `case .md: 64`
  - `case .lg: 96`

That means the verification layer was, in part, rewarding non-equivalence to the RN baseline instead of verifying parity.

### UI-011 — Android Icon And Branding

Commit:

- `db158eb0bc86b265fcde6947255c3eaef94efae4`

Files written in that remediation commit:

- `android/app/src/main/java/com/laneshadow/ui/atoms/CompassPlusIcon.kt`
- `android/app/src/main/java/com/laneshadow/ui/atoms/IconSymbol.kt`
- `android/app/src/test/java/com/laneshadow/ui/atoms/IconBrandingAtomsContractTest.kt`

Related historical files referenced by that task:

- `db158eb0:android/app/src/main/java/com/laneshadow/ui/atoms/MotorcyclePlusIcon.kt`
- `db158eb0:android/app/src/main/java/com/laneshadow/ui/atoms/LaneShadowLogo.kt`
- `db158eb0:android/app/src/main/java/com/laneshadow/ui/atoms/TypingIndicator.kt`
- `db158eb0:android/app/src/main/java/com/laneshadow/ui/atoms/PlusBadgeOverlay.kt`

RN references:

- `react-native/components/map/compass-plus-icon.tsx`
- `react-native/components/ui/motorcycle-plus-icon.tsx`
- `react-native/components/auth/lane-shadow-logo.tsx`
- `react-native/components/chat/typing-indicator.tsx`
- `react-native/components/ui/icon-symbol.tsx`
- `react-native/components/ui/icon-symbol.ios.tsx`

Concrete drift examples:

- `db158eb0:android/app/src/main/java/com/laneshadow/ui/atoms/TypingIndicator.kt`
  Removed RN reduce-motion handling and changed default color behavior.
- `db158eb0:android/app/src/main/java/com/laneshadow/ui/atoms/CompassPlusIcon.kt`
  Redrew the geometry differently from the RN SVG baseline.
- `db158eb0:android/app/src/main/java/com/laneshadow/ui/atoms/IconSymbol.kt`
  Still used a manual icon map rather than the RN direct glyph contract, while trying to paper over `icon-symbol.ios` divergence with aliases.

## Why This Happened Even With Strict Specs

Because the strictness was mostly in prose, not in deterministic gates.

The task files described the right target, but their built-in verification mostly proved:

- names exist
- stories exist
- docs mention parity
- builds run

Those checks do not prove RN parity.

That left a large opening for:

- stock Material wrappers
- stubbed behavior
- partial feature branches
- shallow tests
- evidence claims that were not actually validated

## Evidence Bundling Failure

This needs to be stated clearly:

**The process required evidence bundling and evidence checking, and that was not done correctly.**

The intended protocol required artifacts like:

- `.tmp/{task}/started.json`
- `.tmp/{task}/activity.jsonl`
- `.tmp/{task}/done.json` or `.tmp/{task}/completion.json`
- `.tmp/{task}/evidence.json`

The orchestrator was also supposed to validate that evidence against:

- changed files
- RN source
- sandbox coverage
- acceptance criteria
- verification commands

That did not happen with the required rigor.

Examples:

- `UI-007` appears to be missing the recoverable evidence trail entirely.
- `UI-009` had evidence, but the evidence contradicted the code and stories and still survived as a completion claim.
- `ThemeBottomSheetInput.kt` and `ThemeAvatar.kt` should have failed an evidence-to-code check immediately.

The mistake was treating evidence bundling as paperwork instead of as a hard gate.

## What Is Actually Remediable

### Remediable by deterministic bookkeeping

Yes:

- blocked dependencies
- missing evidence artifacts
- missing state transitions
- missing agent/task linkage
- missing review verdict persistence
- tasks marked complete without valid checkpoint state

These should be solved in code, not via prompt instructions.

### Not solved by bookkeeping alone

Also yes:

- accepting stock wrappers as parity
- accepting contradictory evidence
- shallow parity checks
- reviewer prose substituting for source comparison

These require structured parity manifests and deterministic contradiction rules.

## Additional Codex Constraint: Subagents Must Be Read-Only

This is a prerequisite for hardening, not an optional preference.

OpenAI's own Codex docs recommend subagents first for read-heavy parallel work. In the Codex subagent concepts doc, OpenAI says to start with read-heavy tasks such as exploration, tests, triage, and summarization, and to be more careful with write-heavy workflows because agents editing code at once can create conflicts and increase coordination overhead.

For LaneShadow, "be more careful" is not strong enough. The correct local rule is:

- Codex subagents are read-only only for sprint execution.
- Codex subagents must not be authoritative writers for sprint-owned source files.

### Why this needs to be a hard rule

- The Codex subagent docs describe orchestration features such as spawning, waiting, closing threads, and asking Codex to steer or stop a running subagent. That is conversational control, not a documented deterministic child-write checkpoint.
- The Codex hooks docs say hooks are experimental.
- The same hooks docs say current `PreToolUse` and `PostToolUse` interception is Bash-only, does not intercept `Write`, MCP, WebSearch, or other non-shell tool calls, and is incomplete even for shell.
- The hooks docs also say some parsed controls currently fail open.
- The hooks docs say `PostToolUse` cannot undo side effects from a command that already ran.
- Codex does document a `Stop` hook, but it is turn-scoped. Its `decision: "block"` behavior continues Codex with a new prompt; it is not documented as a subagent-specific completion gate that can reject a child run before bad writes exist.
- The Codex review docs describe after-the-fact diff inspection, staging, reverting, and inline comments. That is useful for review, but it is not preventative write enforcement.

So the issue is not "Codex has no hooks." The issue is narrower and more important:

- Codex does not give us a documented, deterministic, subagent-specific write gate that can stop bad child writes before those writes already exist in repo state.

### Concrete implication for this sprint

If a Kotlin or Swift subagent writes a bad translation such as:

- `ThemeBottomSheetInput.kt` as a pass-through wrapper, or
- `ThemeAvatar.kt` with a fake image branch,

then the currently documented Codex controls are too weak to trust that worker as the enforcement boundary:

- non-shell write paths are not comprehensively intercepted by the documented hook surface
- later shell feedback cannot undo side effects that already happened
- review happens after the diff exists

That means the worker can still push bad writes into the workspace before the deterministic checks run.

### Operational rule

For LaneShadow sprint execution, Codex subagents may be used only for:

- codebase exploration
- repro and triage
- test and log inspection
- review and rereview
- evidence gathering
- summarization

They must not own authoritative source-code writes for sprint-owned paths.

If a Codex subagent needs `workspace-write` for debugging artifacts, local scratch files, or evidence capture, its instructions must still explicitly forbid editing application source. In that case its output is evidence only, not implementation authority.

This is a LaneShadow operating rule derived from OpenAI's documented Codex behavior plus the failure observed here. OpenAI does not explicitly ban write-capable subagents. The stronger local conclusion is ours:

- Codex subagents cannot be used for sprint-owned writes because we cannot deterministically stop and validate them before bad writes already exist.

OpenAI docs consulted on 2026-04-18:

- [Codex subagent concepts](https://developers.openai.com/codex/concepts/subagents)
- [Codex subagents](https://developers.openai.com/codex/subagents)
- [Codex hooks](https://developers.openai.com/codex/hooks)
- [Codex review](https://developers.openai.com/codex/app/review)
- [Shell tool](https://developers.openai.com/api/docs/guides/tools-shell)
- [Local shell](https://developers.openai.com/api/docs/guides/tools-local-shell)

## Recommended Codex Hardening

The correct place to enforce this is the Codex `kb-run-sprint` control plane in global settings, not in task prose.

Relevant files:

- `~/.codex/skills/kb-run-sprint/SKILL.md`
- `~/.codex/skills/kb-run-sprint/docs/control-plane.md`
- `~/.codex/skills/kb-run-sprint/docs/execution-loop.md`
- `~/.codex/skills/kb-run-sprint/src/root.zig`
- `~/.codex/skills/kb-run-sprint/src/main.zig`
- `~/.codex/skills/kb-run-sprint/schemas/implementer-completion.schema.json`

### 0. Change the operating model: Codex subagents are read-only

Implement in:

- sprint execution policy
- `kb-run-sprint` docs
- task routing and assignment rules

Rule:

- use Codex subagents only for read-heavy exploration, triage, review, and evidence collection
- do not let Codex subagents be authoritative writers for sprint-owned source files
- if a subagent uses `workspace-write` for reproduction artifacts or tooling, its instructions must still forbid application-source edits and its outputs must be treated as evidence only

Reason:

- OpenAI's own docs recommend starting with read-heavy subagent work and being more careful with write-heavy workflows
- current Codex hooks do not provide complete write interception or rollback for subagent work

### 1. Make blocked dependencies a hard dispatch failure

Implement in:

- `reconcile`
- `transition`

Rule:

- if any dependency is not terminal, the task must not enter `ready_queue`
- `dispatch_implementer`, `run_checkpoint`, and `dispatch_reviewer` should hard-fail if dependencies are incomplete

This closes the specific failure where `UI-005` onward ran after `UI-002` and `UI-002B` were blocked.

### 2. Make missing evidence artifacts a hard checkpoint failure

Implement in:

- `checkpoint`

Rule:

- fail unless all required files exist and parse
- do not allow chat-only completion
- strongly restrict or remove salvage paths

Required artifacts:

- `.tmp/{task}/started.json`
- `.tmp/{task}/activity.jsonl`
- `.tmp/{task}/done.json` or `.tmp/{task}/completion.json`
- `.tmp/{task}/evidence.json`

This closes the `UI-007` class of failure.

### 3. Add structured evidence and parity manifests

Add schemas:

- `~/.codex/skills/kb-run-sprint/schemas/evidence-manifest.schema.json`
- `~/.codex/skills/kb-run-sprint/schemas/parity-manifest.schema.json`

Require in checkpoint:

- RN source path
- native source path
- declared states
- story ids
- a11y verification
- explicit known deltas
- files changed
- verification commands

This makes parity explicit instead of implied.

### 4. Add deterministic contradiction rules

Implement in:

- `checkpoint`

Examples of contradiction rules:

- if evidence says image state is covered, require a corresponding story id and code path
- if evidence says bottom-sheet input parity verified, require dedicated implementation rather than a pass-through wrapper
- if evidence says state parity verified, require matching story/test artifacts for those states
- if evidence says no deltas, fail if component API or behavior manifest still differs from RN in declared parity fields

This closes the `UI-009` class of failure.

### 5. Backstop Codex with repo-level hooks or CI

Codex can support fail-closed control-plane rules, but true anti-bypass protection needs enforcement outside the model.

Recommended:

- pre-push or CI checks reject sprint-owned changes unless valid checkpoint artifacts exist
- CI verifies `.kb-run-sprint-state.json` coherence
- CI verifies evidence and parity manifests for touched sprint tasks
- CI rejects completion when task write scope and changed files disagree

Otherwise, a model can still route around process by simply not using it.

### 6. Add runner tests for these exact failure modes

Add tests under:

- `~/.codex/skills/kb-run-sprint/tests`

Required scenarios:

- blocked dependency task cannot dispatch
- missing `.tmp/{task}/started.json` fails checkpoint
- missing `activity.jsonl` fails checkpoint
- missing `done.json` fails checkpoint
- evidence says image covered but no story exists
- evidence says bottom-sheet parity covered but implementation is a pass-through
- parity manifest missing required state/a11y fields
- reviewer approval cannot override missing artifacts

## Suggested Implementation Order

1. Harden `reconcile` and `transition` so blocked dependencies truly stop scheduling.
2. Harden `checkpoint` so missing evidence artifacts fail closed.
3. Add `evidence-manifest.schema.json`.
4. Add `parity-manifest.schema.json`.
5. Implement contradiction rules for known failure classes:
   - pass-through wrappers
   - fake image branches
   - stock Material substitution for custom RN controls
   - omitted story coverage for claimed states
6. Add tests for all of the above.
7. Add repo-level CI or hook enforcement so the agent cannot bypass the control plane.

## Final Assessment

The important conclusion for the next person is this:

The failure was not mysterious and it was not caused by insufficiently detailed tasks.

It happened because:

- the state machine was not authoritative in practice
- evidence bundling was missing or not actually checked
- contradiction between evidence and code was not treated as a hard failure
- parity verification was implied, not structured and validated
- review existed, but the orchestrator did not independently verify the result

If the next fix is only “tighten the prompt again,” this will happen again.

If the next fix turns these into deterministic gates in the Codex control plane and repo CI, this class of failure is meaningfully remediable.
