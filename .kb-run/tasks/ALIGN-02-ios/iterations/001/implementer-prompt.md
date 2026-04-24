You are the implementer for kb-run task ALIGN-02-ios.

Context:
- Repo root: /Users/justinrich/Projects/LaneShadow
- Worktree: /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/ALIGN-02-ios
- Task file: /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-03-design-system-alignment/ALIGN-02-ios-refactor-swift-token-generation.md
- Sprint: sprint-03-design-system-alignment
- Start commit: be31ca8566ffa75527ff1a87afff24fd07261def
- The specialist prompt source at `~/Projects/brain/docs/CODEX-SPECIALIST-PROMPTS.md` is empty in this workspace. Use the task contract plus repo rules directly.
- Do not edit any `.kb-run` files. The host owns runner state and evidence artifacts.
- Stay strictly inside the task write scope. If the task cannot be completed without going out of scope, stop and return `status=blocked`.
- Do not commit. The orchestrator owns commits.
- Run the task's required reading yourself from the repository before editing.
- Read `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md` before writing code. Treat it as authoritative for the gaps this task must close.

Normalized requirement matrix:
- AC-1 [ACCEPTANCE CRITERIA]: Surface/border gaps emitted [PRIMARY]
- AC-2 [ACCEPTANCE CRITERIA]: map color tokens emitted
- AC-3 [ACCEPTANCE CRITERIA]: map.style String constants
- AC-4 [ACCEPTANCE CRITERIA]: sizing.stroke as CGFloat
- AC-5 [ACCEPTANCE CRITERIA]: Token validation + sync-check pass
- AC-6 [ACCEPTANCE CRITERIA]: Tokens.swift compiles
- TC-1 [TEST CRITERIA]: LaneShadowTheme.color.surface.scrimSoft exists in Tokens.swift
- TC-2 [TEST CRITERIA]: LaneShadowTheme.color.border.glass exists in Tokens.swift
- TC-3 [TEST CRITERIA]: LaneShadowTheme.color.map enum with paper/contour/contourFaint exists
- TC-4 [TEST CRITERIA]: LaneShadowTheme.map.style.light/.dark String constants exist
- TC-5 [TEST CRITERIA]: LaneShadowTheme.sizing.stroke.sm CGFloat = 1 exists
- TC-6 [TEST CRITERIA]: pnpm tokens:generate exits 0
- TC-7 [TEST CRITERIA]: Tokens.swift header still reads GENERATED — do not edit
- STATE-MATRIX [OUTCOME]: Outcome requires interaction-state coverage for hover; explicit AC/TC/DONE coverage is missing for hover

Write scope:
- Allowed:
  - tokens/scripts/generate.ts
  - tokens/semantic/colors.tokens.json (only if scrim-soft or border.glass are absent)
  - tokens/semantic/mapbox.tokens.json (only if needed)
  - tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift via generator only
- Prohibited:
  - ios/LaneShadow/Views/**
  - ios/LaneShadow/Tests/**
  - tokens/platforms/kotlin/**
  - tokens/semantic/dimensions.tokens.json unless it is genuinely missing the required sizing.stroke values
  - tokens/semantic/typography.tokens.json

Runtime commands to use as evidence where relevant:
- test: pnpm tokens:validate
- test: pnpm tokens:sync-check
- typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
- lint: swiftformat --lint ios/LaneShadow/

Required TDD flow:
- Follow RED -> GREEN -> REFACTOR for the generator changes where the task demands it.
- For RED, run at least one failing assertion that demonstrates the missing emitted token surface before you change the generator.
- For GREEN, edit only the generator/source files in scope, run `pnpm tokens:generate`, then rerun the failing assertion and required gates.
- Capture the concrete RED and GREEN commands in your evidence arrays and notes.

Completion contract:
- Final response must be JSON only matching `/Users/justinrich/Projects/LaneShadow/.kb-run/implementer-completion.schema.json`.
- Set `task_id` to `"ALIGN-02-ios"`.
- Set `evidence_path` to `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/ALIGN-02-ios/iterations/001/evidence.md`.
- Set `evidence_manifest_path` to `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/ALIGN-02-ios/iterations/001/evidence-manifest.json`.
- Do not write those evidence files; the host will persist them from your response.
- Include concrete `files_changed` and `verification_commands`.
- `acceptance_criteria_evidence` must cover every requirement id above. Use `status=met` or `status=not_met`.
- If blocked, explain the blocker precisely and list `failed_commands`.

Task-specific emphasis:
- This task is generator-owned. Do not hand-edit `Tokens.swift`.
- Preserve legacy theme compatibility. This sprint adds Copper coverage; it does not delete or rename existing theme paths.
- `map.style` values are String constants, not colors.
- `sizing.stroke` must be emitted as `CGFloat` under `LaneShadowTheme.sizing.stroke`.
- The outcome says the iOS token pipeline exposes the full Copper token surface required by Sprint 03 while preserving legacy-theme compatibility. Do not stop after the first named spot-check if adjacent required emitted keys in the drift report remain missing inside this task's scope.
