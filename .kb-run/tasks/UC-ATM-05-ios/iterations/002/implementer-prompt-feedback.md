# kb-run Implementer Packet

Task ID: UC-ATM-05-ios
Execution Unit: UC-ATM-05-ios-feedback
Role: swift-implementer
Reviewer: swift-reviewer
Sprint: sprint-02-atoms-foundation-primitives
Platform: ios
Worktree: /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-ATM-05-ios-feedback
Branch: kb-run/UC-ATM-05-ios-feedback
Start commit: a4f2180bb0323a006a7086b73cba5e816caaf3f2

## Operating Contract

- This is a feedback remediation pass for an already-landed sprint task.
- Work only inside this worktree.
- Do not edit any `.kb-run*` state or notebook files.
- Allowed edits are limited to the files listed below.
- Preserve existing behavior except where the user feedback requires change.
- Before running build/test commands, source `scripts/agent-worktree-env.sh` from the worktree root.
- Do not use `--no-verify`, `git commit -n`, or hook-bypass environment variables.
- The orchestrator owns checkpoint commits. Leave your product changes uncommitted.
- Final response must be JSON only and must satisfy the provided output schema.

## User Feedback (new requirement)

- GlassPanel callout accent/status stripes must render **inside** the container bounds.
- The current implementation appears to render the leading stripe outside the container edge.
- Treat this as a required remediation on top of the original UC-ATM-05-ios contract.

## Required Outcome

- Update the iOS `LSGlassPanel` callout rendering so the leading stripe is visually inside the rounded container bounds.
- Add or update tests so this requirement is asserted explicitly.
- Keep the callout stripe width at 3pt and preserve token resolution through `AccentColor`.
- Do not regress the original chrome/callout behavior, token mapping, or type-safety checks.

## Allowed Files

- `ios/LaneShadow/Views/Atoms/LSGlassPanel.swift`
- `ios/LaneShadow/Sandbox/LaneShadowStories.swift`
- `ios/LaneShadowTests/Atoms/LSGlassPanelTests.swift`
- `ios/LaneShadowTests/Atoms/LSGlassPanelTypeSafetyTests.swift`

## Required Reading

1. `/Users/justinrich/Projects/brain/docs/ROOT-CONTEXT.md`
2. `RULES.md`
3. `ios/LaneShadow/Views/Atoms/LSGlassPanel.swift`
4. `ios/LaneShadowTests/Atoms/LSGlassPanelTests.swift`
5. User feedback above

## Required Evidence Outputs

- Write a concise evidence log to `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-ATM-05-ios/iterations/002/evidence.md`.
- Write an evidence manifest JSON to `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-ATM-05-ios/iterations/002/evidence-manifest.json` with:
  - `task_id`
  - `files_changed`
  - `verification_commands`
  - `red_phase_commands`
  - `notes`
- Your final JSON response must satisfy this schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "status",
    "task_id",
    "blocking_issues",
    "unblock_options",
    "failure_classification",
    "failed_commands",
    "evidence_path",
    "evidence_manifest_path",
    "summary",
    "files_changed",
    "verification_commands",
    "acceptance_criteria_evidence",
    "reviewer_considerations",
    "notes"
  ],
  "properties": {
    "status": {
      "type": "string",
      "enum": [
        "completed",
        "blocked"
      ]
    },
    "task_id": {
      "type": "string"
    },
    "blocking_issues": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "unblock_options": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "failure_classification": {
      "type": "string",
      "enum": [
        "none",
        "pre_existing",
        "task_introduced"
      ]
    },
    "failed_commands": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "evidence_path": {
      "type": "string"
    },
    "evidence_manifest_path": {
      "type": "string"
    },
    "summary": {
      "type": "string"
    },
    "files_changed": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "verification_commands": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "acceptance_criteria_evidence": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "status",
          "evidence"
        ],
        "properties": {
          "id": {
            "type": "string"
          },
          "status": {
            "type": "string",
            "enum": [
              "met",
              "not_met"
            ]
          },
          "evidence": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      }
    },
    "reviewer_considerations": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "notes": {
      "type": "string"
    }
  }
}

```
