You are the implementer for kb-run task ALIGN-02-android.

Context:
- Repo root: /Users/justinrich/Projects/LaneShadow
- Worktree: /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/ALIGN-02-android
- Task file: /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-03-design-system-alignment/ALIGN-02-android-refactor-kotlin-token-generation.md
- Sprint: sprint-03-design-system-alignment
- Start commit: be31ca8566ffa75527ff1a87afff24fd07261def
- The specialist prompt source at `~/Projects/brain/docs/CODEX-SPECIALIST-PROMPTS.md` is empty in this workspace. Use the task contract plus repo rules directly.
- Do not edit any `.kb-run` files. The host owns runner state and evidence artifacts.
- Stay strictly inside the task write scope. If the task cannot be completed without going out of scope, stop and return `status=blocked`.
- Do not commit. The orchestrator owns commits.
- Run the task's required reading yourself from the repository before editing.
- Read `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md` before writing code. Treat it as authoritative for the gaps this task must close.

Normalized requirement matrix:
- AC-1 [ACCEPTANCE CRITERIA]: Light-mode color coverage [PRIMARY]
- AC-2 [ACCEPTANCE CRITERIA]: Dark-mode color coverage
- AC-3 [ACCEPTANCE CRITERIA]: map.style constants exposed
- AC-4 [ACCEPTANCE CRITERIA]: sizing.stroke scale exposed
- AC-5 [ACCEPTANCE CRITERIA]: Input-hash changes on edit
- AC-6 [ACCEPTANCE CRITERIA]: All theme unit tests pass
- TC-1 [TEST CRITERIA]: Tokens.kt contains a val for surface.scrim-soft mapped as Color with alpha ~0.18 float constructor
- TC-2 [TEST CRITERIA]: Tokens.kt contains val for border.glass resolved to dark-mode rgba(242,238,232,0.22)
- TC-3 [TEST CRITERIA]: Tokens.kt map.style.light equals exactly 'mapbox://styles/laneshadow/clxwarm01'
- TC-4 [TEST CRITERIA]: LaneShadowTheme.sizing.stroke.md equals 2.dp
- TC-5 [TEST CRITERIA]: ColorSetTest.bundledJson_decodesAllCoreGroups exits BUILD SUCCESSFUL
- TC-6 [TEST CRITERIA]: pnpm tokens:generate with missing mapbox.tokens.json throws clear error (does not silently emit empty map.style)

Write scope:
- Allowed:
  - tokens/scripts/generate.ts
  - tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt via generator only
  - tokens/platforms/kotlin/src/test/kotlin/com/laneshadow/theme/TokensDimensionsTest.kt
  - tokens/platforms/kotlin/src/test/kotlin/com/laneshadow/theme/TokensMapStyleTest.kt
- Prohibited:
  - .spec/design/system/tokens/**
  - tokens/semantic/*.json
  - android/app/src/**
  - tokens/platforms/swift/**

Runtime commands to use as evidence where relevant:
- test: cd android && ./gradlew :theme:test
- typecheck: cd android && ./gradlew :app:compileDebugKotlin
- lint: cd android && ./gradlew detekt

Required TDD flow:
- Follow RED -> GREEN -> REFACTOR for the generator changes where the task demands it.
- For RED, run at least one failing assertion that demonstrates the missing emitted token surface before you change the generator.
- For GREEN, edit only the generator/source files in scope, run `pnpm tokens:generate`, then rerun the failing assertion and required gates.
- Capture the concrete RED and GREEN commands in your evidence arrays and notes.

Completion contract:
- Final response must be JSON only matching `/Users/justinrich/Projects/LaneShadow/.kb-run/implementer-completion.schema.json`.
- Set `task_id` to `"ALIGN-02-android"`.
- Set `evidence_path` to `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/ALIGN-02-android/iterations/001/evidence.md`.
- Set `evidence_manifest_path` to `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/ALIGN-02-android/iterations/001/evidence-manifest.json`.
- Do not write those evidence files; the host will persist them from your response.
- Include concrete `files_changed` and `verification_commands`.
- `acceptance_criteria_evidence` must cover every requirement id above. Use `status=met` or `status=not_met`.
- If blocked, explain the blocker precisely and list `failed_commands`.

Task-specific emphasis:
- This task is generator-owned. Do not hand-edit `Tokens.kt`.
- Preserve legacy theme compatibility. This sprint adds Copper coverage; it does not delete or rename existing theme paths.
- `map.style` values are string constants, not colors.
- `sizing.stroke` must be emitted as `Dp` under `LaneShadowTheme.sizing.stroke`.
- The outcome says Android must expose the full Copper token surface required by Sprint 03 while preserving legacy-theme compatibility. Do not stop after the first named spot-check if adjacent required emitted keys in the drift report remain missing inside this task's scope.
