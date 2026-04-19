# Sprint 1a: Foundation and Sprint 2 Rewrite

**Sequence:** 1a (interstitial, between Sprint 1 and Sprint 2)
**Status:** In Progress (Wave 0 complete, Wave 1 blocked)

## Overview

Sprint 2 is stalled because its tasks are too big per AI invocation, the photocopy-translation matrices are absent, and ~54 proposed new semantic tokens remain unresolved. This sprint produces the spec, token, atomization, and fidelity-rig inputs that make Sprint 2 trivially parallelizable — no Kotlin or Swift component implementation code is written here. Scope also expands the native port to include data-layer translation (`react-native/lib/**`, `react-native/stores/**`) alongside the UI port, with a new per-file translation protocol. The existing 85-task Sprint 2 bundle is archived and replaced with ~412 atomized UI tasks (one component × one platform) plus N atomized model tasks, each citing a pre-filled matrix or translation plan.

## Human Testing Gate

**Gate:** Dispatching one native-implementer agent against the first rewritten Sprint 2 atomized task produces a committed component plus sandbox Story that passes `pnpm ui:diff` at ±1px RN-vs-native parity, with zero mid-task token or decision escalations.

## Human Test Deliverable

The rewritten Sprint 2 folder is fully parallel-executable by AI implementers: every UI component has a pre-filled STYLE PROPERTIES MATRIX with zero unresolved tokens, every in-scope RN business-logic file has a native translation plan, the platform theme accessors (including the previously missing Android `elevation`) expose every new token, and a per-component screenshot-diff harness catches drift at commit time instead of weeks later at Phase G.

## Human Test Steps

1. Browse `.spec/prds/native-rewrite/matrices/ui/` and confirm 206 matrix files exist (42 atoms + 107 molecules + 24 organisms + 11 templates + 10 screens + 11 delta compositions).
2. Run `grep -rn "ESCALATE" .spec/prds/native-rewrite/matrices/` and confirm zero matches, proving every literal maps to a resolved semantic token.
3. Open `.spec/prds/native-rewrite/matrices/models/INVENTORY.md` and confirm every file in `react-native/lib/**` and `react-native/stores/**` is classified SHARED-TS, PORT, or NATIVE-OWNED, with a linked `MODEL-*.md` translation plan for each PORT entry and `08g-model-translation-protocol.md` committed alongside `08f`.
4. Run `pnpm tokens:sync && pnpm tokens:validate && pnpm type-check:native && ./android/gradlew :app:compileDebugKotlin && xcodebuild -scheme LaneShadow -configuration Debug build` — confirm all exit 0 and a sandbox swatch story renders `LaneShadowTheme.elevation.level2` on Android.
5. Browse `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/` and confirm the original 85 task files live under `_archived/`, the new atomized `UI-*.md` (~412) and `MDL-*.md` task files are present with matrix references, and a random sample of 10 tasks scores ≥ 80/115 on the `kb-sprint-tasks-plan` rubric.
6. Run `pnpm ui:diff atoms.button.default` against a stubbed Button story and confirm it emits RN plus Android plus iOS PNGs and a `variance--atoms.button.default--rn-vs-android--light.json` per UI-002 conventions.
7. Dispatch one `kotlin-implementer` against the first rewritten atomized task (`UI-atom-button-android.md`), confirm it commits `Button.kt` plus sandbox Story, passes `pnpm ui:diff` at ±1px, and files zero `DECISIONS.md` entries or mid-task escalations.

## Source Coverage

- `/Users/justinrich/.claude/plans/encapsulated-scribbling-pudding.md` — approved foundation plan (source of truth for this sprint)
- `.spec/prds/native-rewrite/08a-atomic-component-catalog.md` — 195-component inventory
- `.spec/prds/native-rewrite/NEW-COMPOSITIONS-FOR-SPRINT-2-DELTA.md` — 11 delta compositions
- `.spec/prds/native-rewrite/08b-android-component-map.md` — Android primitives + framework-source reading map
- `.spec/prds/native-rewrite/08c-ios-component-map.md` — iOS primitives + reading map
- `.spec/prds/native-rewrite/08d-component-parity-spec.md` — cross-platform parity contract
- `.spec/prds/native-rewrite/08e-cross-platform-theme-module.md` — token pipeline
- `.spec/prds/native-rewrite/08f-translation-protocol.md` — Photocopy Translation Protocol (UI)
- `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/UI-007-android-atoms-2-5-form-controls.md` — gold-standard matrix template
- `react-native/components/**` — RN UI source of truth
- `react-native/lib/**` + `react-native/stores/**` — RN business-logic source of truth
- `RULES.md` — agent roster + commit policy
- `tokens/semantic/semantic.tokens.json` — current canonical token source

## Dependencies

- Sprint 1: Repo Restructure and Server Frontload (Completed)

## Blocks

- Sprint 2: UI Component Translation and Fidelity Sandbox (rewritten form depends on this foundation)
- Sprint 3: Auth and Discovery Shell (transitively — depends on rewritten Sprint 2 UI atoms + molecules)
- Sprint 4: Chat Planning and Comparison (transitively)
- Sprint 5: Turn-by-Turn Navigation (transitively)
- Sprint 6: Ride Recording and Saved Rides (transitively)
- Sprint 7: Offline Maps and Cache Recovery (transitively + depends on ported `lib/model/download-manager`)
- Sprint 8: Voice Assistant (transitively)
- Sprint 9: Gatekeeper and Platform Polish (transitively + depends on ported `lib/model/gatekeeper`)
- Sprint 10: Native Parity and React Native Retirement (transitively)

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| FND-001 | Author STYLE PROPERTIES MATRIX files for all 42 RN atoms (`matrices/ui/atoms/*.md`) using UI-007 as gold-standard template | frontend-designer | 480 min |
| FND-002 | Author STYLE PROPERTIES MATRIX files for all 107 RN molecules (`matrices/ui/molecules/*.md`) | frontend-designer | 720 min |
| FND-003 | Author STYLE PROPERTIES MATRIX files for all 24 RN organisms (`matrices/ui/organisms/*.md`) | frontend-designer | 480 min |
| FND-004 | Author matrix files for 11 templates + 10 screens + 11 delta compositions (`matrices/ui/{templates,screens,delta}/*.md`) | frontend-designer | 480 min |
| FND-005 | Author `08g-model-translation-protocol.md`; sweep `react-native/lib/**` + `react-native/stores/**` + `react-native/types/**`; classify each file SHARED-TS / PORT / NATIVE-OWNED in `matrices/models/INVENTORY.md` | engineering-manager | 360 min |
| FND-006 | Author per-file `MODEL-*.md` translation plans for every PORT-classified business-logic file (types, state machines, APIs, parity contracts) | engineering-manager | 480 min |
| FND-007 | Harvest and resolve ~54 ESCALATE tokens — author sprint `DECISIONS.md`, update `tokens/semantic/semantic.tokens.json`, add platform accessors incl. Android `LaneShadowTheme.elevation` gap fix | frontend-designer | 240 min |
| FND-008 | Archive existing sprint-02 (85 files → `sprint-02-ui-component-translation/_archived/`); author ~412 atomized UI task files + N MDL task files + rewritten SPRINT.md + INDEX.md | planner | 720 min |
| FND-009 | Author `scripts/ui-diff/*` per-component screenshot-diff harness (`capture-rn.ts`, `capture-android.ts`, `capture-ios.ts`, `compare.ts`, `variance-schema.ts`), wire `pnpm ui:diff` npm script, add opt-in lefthook pre-push gate, README | devops-engineer | 480 min |
| PRE-001 | Complete Android Theme Accessors (elevation, motion, opacity) — wire theme DTO fields to public accessor via laneShadowThemeValues() | kotlin-implementer | 120 min |
| PRE-002 | Complete iOS Theme Accessors (motion, opacity) — add ThemeMotion and ThemeOpacity structs and builder methods to Theme aggregate | swift-implementer | 120 min |
| PRE-003 | Android Sandbox Tier System + Story Registration Pattern — extend SandboxTier enum, establish story registration pattern in AtomsStories | kotlin-implementer | 90 min |
| PRE-004 | iOS Sandbox Tier System + Story Registration Pattern — document story registration pattern in AtomsStories, verify NativeSandbox tier support | swift-implementer | 90 min |
| PRE-005 | Fix Sprint 2 Task File Paths + Add Centralized Theme Mandate — correct all 388 UI + 11 MDL task paths, add THEME COMPLIANCE (MANDATORY) section to every task | planner | 180 min |

## Task Detail Files

Generated by /kb-sprint-tasks-plan on 2026-04-18T14:30:00Z

Foundation Tasks (FND-001 through FND-009):
- FND-001-author-style-properties-matrix-atoms.md
- FND-002-author-style-properties-matrix-molecules.md
- FND-003-author-style-properties-matrix-organisms.md
- FND-004-author-matrix-files-templates-screens-delta.md
- FND-005-author-model-translation-protocol-inventory.md
- FND-006-author-model-translation-plans.md
- FND-007-harvest-resolve-escalate-tokens.md
- FND-008-archive-sprint-02-author-atomized-tasks.md
- FND-009-author-ui-diff-harness.md

Prerequisites for Sprint 2 Execution (PRE-001 through PRE-005):
- PRE-001-complete-android-theme-accessors.md
- PRE-002-complete-ios-theme-accessors.md
- PRE-003-android-sandbox-tier-system.md
- PRE-004-ios-sandbox-tier-system.md
- PRE-005-fix-sprint-02-task-paths-theme-mandate.md
