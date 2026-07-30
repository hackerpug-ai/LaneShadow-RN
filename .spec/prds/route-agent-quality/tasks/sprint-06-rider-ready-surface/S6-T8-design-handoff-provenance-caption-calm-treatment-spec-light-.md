# S6-T8 — Design handoff — provenance caption calm treatment spec (light + dark tokens)

> Status: ✅ Completed
> Commit: 837e2475367a249ccfeb13f01a0f3f9c6b2b7ab7
> Reviewer: product-manager+react-native-ui-reviewer
> Completed: 2026-07-30T06:26:25Z
> Proposed By: `frontend-designer`

| Field | Value |
|---|---|
| TASK_ID | S6-T8 |
| SPRINT | [Sprint 06 — Rider-ready surface](./SPRINT.md) |
| TASK_TYPE | DESIGN |
| AGENT | `frontend-designer` |
| ESTIMATE | 45 min |
| EFFORT | S |
| PRIORITY | P1 |
| PROPOSED_BY | `frontend-designer` |
| TDD_MODE | `skipped` |
| RED_GREEN_REQUIRED | no |
| CAPABILITIES | N/A |
| BLOCKS | S6-T4 |

RUNTIME_COMMANDS:
- typecheck: `pnpm type-check`
- lint: `pnpm lint`
- test: `pnpm test`
- run: `pnpm ios`

## BACKGROUND
Author a one-page design handoff spec defining the provenance caption calm treatment, exact copy, light+dark tokens, and the no-Badge/no-warning-color rule.

## 🚫 CRITICAL CONSTRAINTS (Never tier)
- **MUST** spec at .spec/design/provenance-caption-treatment.md
- **MUST** LITERAL copy for both provenance values
- **MUST** cite light+dark token paths
- **NEVER** paraphrase the literal copy
- **NEVER** introduce a new token
- **NEVER** suggest Badge/warning treatment
- **STRICTLY** treatment pinned to semantic.color.onSurface.subtle + semantic.type.body.sm

## SPECIFICATION
**Objective:** Author a one-page design handoff spec defining the provenance caption calm treatment, exact copy, light+dark tokens, and the no-Badge/no-warning-color rule.

**Success state:** S6-T4 implementer reads the spec and produces the muted Text leaf with no aesthetic questions; tokens named in spec resolve under pnpm tokens:validate.

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR)
### AC-1 [PRIMARY] — spec file exists with both literal caption strings

**Requirement:** GIVEN the repo at HEAD has no .spec/design/provenance-caption-treatment.md WHEN the spec is authored THEN the file exists and contains both literal caption strings verbatim

TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: local-filesystem  ·  FLOW_REF: UC-SURF-05  ·  VERIFY: `test -f .spec/design/provenance-caption-treatment.md && grep -c 'Route line reconstructed from the ride description' .spec/design/provenance-caption-treatment.md && grep -c 'Route line generated from the road name' .spec/design/provenance-caption-treatment.md`

SCENARIO:
- `start_ref` seed_method: `public_api`
- CASE 1 (`spec-absent`): MUST_OBSERVE ['file exists', 'both literal caption strings present (>=1 match each)']; MUST_NOT_OBSERVE ['file absent', 'paraphrased copy']
- NEGATIVE_CONTROL (would_fail_if): ['spec absent', 'copy paraphrased', 'only one of two strings present']
- EVIDENCE: `file_artifact` (required_capture=True)

### AC-2 — named tokens resolve under pnpm tokens:validate

**Requirement:** GIVEN the spec cites semantic.color.onSurface.subtle and semantic.type.body.sm WHEN pnpm tokens:validate is run THEN validation exits 0, confirming the cited token paths are real and resolvable

TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: shell-stdout  ·  FLOW_REF: UC-SURF-05  ·  VERIFY: `pnpm tokens:validate`

SCENARIO:
- `start_ref` seed_method: `public_api`
- CASE 1 (`spec-authored`): MUST_OBSERVE ['exit code 0', 'no unresolved-token errors for the two cited paths']; MUST_NOT_OBSERVE ['non-zero exit', 'token-not-found warning']
- NEGATIVE_CONTROL (would_fail_if): ['spec names a non-existent token', 'tokens:validate exits non-zero']
- EVIDENCE: `stdout` (required_capture=True)

### AC-3 — no-Badge / no-warning-color rule stated in spec

**Requirement:** GIVEN the spec body WHEN reviewed THEN it explicitly states the caption MUST NOT use a Badge variant and MUST NOT use a warning/alert color

TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: local-filesystem  ·  FLOW_REF: UC-SURF-05  ·  VERIFY: `grep -E 'no Badge|not a Badge|no warning|no alert' .spec/design/provenance-caption-treatment.md`

SCENARIO:
- `start_ref` seed_method: `public_api`
- CASE 1 (`spec-draft`): MUST_OBSERVE ['rule line present (>=1 match)']; MUST_NOT_OBSERVE ['rule absent', 'ambiguous Badge allowance']
- NEGATIVE_CONTROL (would_fail_if): ['rule omitted', 'rule allows Badge in dark mode']
- EVIDENCE: `file_artifact` (required_capture=True)

## TEST CRITERIA
- **TC-1** (→ AC-1): spec exists with both literal caption strings
  - VERIFY: `grep -c 'Route line reconstructed' .spec/design/provenance-caption-treatment.md`
- **TC-2** (→ AC-2): cited tokens resolve
  - VERIFY: `pnpm tokens:validate`
- **TC-3** (→ AC-3): no-Badge/no-warning rule present
  - VERIFY: `grep -E 'no Badge|not a Badge|no warning|no alert' .spec/design/provenance-caption-treatment.md`

## SCOPE (file-level write permissions)
**writeAllowed:**
- `.spec/design/provenance-caption-treatment.md (NEW)`
**writeProhibited:**
- `tokens/**`
- `components/**`
- `app/**`
- `convex/**`
- `shared/**`

## READING LIST
- `app/(app)/curated-route/[id].tsx` (380-420) — muted summary pattern + Badge anti-pattern to cite
- `.spec/prds/route-agent-quality/07-uc-surf.md` (1-1) — UC-SURF-05 source

## DESIGN
- Reference: .spec/prds/route-agent-quality/07-uc-surf.md
- token-pinned calm spec: onSurface.subtle + type.body.sm, light+dark values cited verbatim
- literal copy for ai_reconstructed and name_routed, verbatim — no paraphrase
- explicit no-Badge / no-warning-color rule, same body in light and dark
- one page max; references S6-T4 as the implementing task

**Pattern:** token-pinned calm-treatment spec
- pattern_source: `app/(app)/curated-route/[id].tsx summary muted-text`

**Anti-pattern:** paraphrased copy; new token; Badge/warning color allowance

## EVIDENCE / VERIFICATION GATES
- **spec exists** — `test -f .spec/design/provenance-caption-treatment.md` → exit 0
- **tokens resolve** — `pnpm tokens:validate` → exit 0
- **no-badge rule present** — `grep -E 'no Badge|not a Badge|no warning|no alert' .spec/design/provenance-caption-treatment.md` → exit 0

## DEPENDENCIES
- Blocks: S6-T4

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S6-T8",
  "tdd_mode": "skipped",
  "verification_policy": {
    "requires_tests": false,
    "requires_red_evidence": false,
    "requires_seeded_evidence": false
  },
  "fixtures": {
    "spec-absent": {
      "description": "repo before spec authored",
      "seed_method": "public_api",
      "records": [
        "no .spec/design/provenance-caption-treatment.md at HEAD"
      ]
    },
    "spec-authored": {
      "description": "repo after spec authored",
      "seed_method": "public_api",
      "records": [
        ".spec/design/provenance-caption-treatment.md present at HEAD"
      ]
    },
    "spec-draft": {
      "description": "spec body under review",
      "seed_method": "public_api",
      "records": [
        "spec body with calm-treatment section"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN the repo at HEAD has no .spec/design/provenance-caption-treatment.md WHEN the spec is authored THEN the file exists and contains both literal caption strings verbatim",
      "verify": "test -f .spec/design/provenance-caption-treatment.md && grep -c 'Route line reconstructed from the ride description' .spec/design/provenance-caption-treatment.md && grep -c 'Route line generated from the road name' .spec/design/provenance-caption-treatment.md",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "local-filesystem",
        "negative_control": {
          "would_fail_if": [
            "spec absent",
            "copy paraphrased",
            "only one of two strings present",
            "mocked/stubbed or empty-start path still passes (test is fakeable)",
            "empty/stub/mock path still passes"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact"
        },
        "cases": [
          {
            "start_ref": "spec-absent",
            "action": {
              "actor": "cli_user",
              "steps": [
                "author the spec",
                "grep both literal strings"
              ]
            },
            "end_state": {
              "must_observe": [
                "file exists (observed count >= 1 OR exact literal match)",
                "both literal caption strings present (>=1 match each)"
              ],
              "must_not_observe": [
                "file absent",
                "paraphrased copy",
                "empty result (0)"
              ]
            },
            "seed_method": "public_api"
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the spec cites semantic.color.onSurface.subtle and semantic.type.body.sm WHEN pnpm tokens:validate is run THEN validation exits 0, confirming the cited token paths are real and resolvable",
      "verify": "pnpm tokens:validate",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "shell-stdout",
        "negative_control": {
          "would_fail_if": [
            "spec names a non-existent token",
            "tokens:validate exits non-zero",
            "mocked/stubbed or empty-start path still passes (test is fakeable)",
            "empty/stub/mock path still passes"
          ]
        },
        "evidence": {
          "artifact_type": "stdout"
        },
        "cases": [
          {
            "start_ref": "spec-authored",
            "action": {
              "actor": "cli_user",
              "steps": [
                "run pnpm tokens:validate",
                "capture exit code"
              ]
            },
            "end_state": {
              "must_observe": [
                "exit code 0",
                "no unresolved-token errors for the two cited paths (observed count >= 1 OR exact literal match)"
              ],
              "must_not_observe": [
                "non-zero exit",
                "token-not-found warning",
                "empty/start signature: result count == 0 or field absent"
              ]
            },
            "seed_method": "public_api"
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the spec body WHEN reviewed THEN it explicitly states the caption MUST NOT use a Badge variant and MUST NOT use a warning/alert color",
      "verify": "grep -E 'no Badge|not a Badge|no warning|no alert' .spec/design/provenance-caption-treatment.md",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "local-filesystem",
        "negative_control": {
          "would_fail_if": [
            "rule omitted",
            "rule allows Badge in dark mode",
            "mocked/stubbed or empty-start path still passes (test is fakeable)",
            "empty/stub/mock path still passes"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact"
        },
        "cases": [
          {
            "start_ref": "spec-draft",
            "action": {
              "actor": "cli_user",
              "steps": [
                "grep for the no-Badge/no-warning rule"
              ]
            },
            "end_state": {
              "must_observe": [
                "rule line present (>=1 match)"
              ],
              "must_not_observe": [
                "rule absent",
                "ambiguous Badge allowance",
                "empty result (0)"
              ]
            },
            "seed_method": "public_api"
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "spec exists with both literal caption strings",
      "verify": "grep -c 'Route line reconstructed' .spec/design/provenance-caption-treatment.md",
      "maps_to_ac": "AC-1",
      "scenario": {
        "test_tier": "integration",
        "evidence": {
          "artifact_type": "test_output"
        },
        "negative_control": {
          "would_fail_if": [
            "mocked/stubbed empty response still passes (test is fakeable)"
          ]
        },
        "cases": [
          {
            "start_state": {
              "description": "baseline before action",
              "records": [
                "empty baseline"
              ],
              "seed_method": "public_api"
            },
            "action": {
              "steps": [
                "exercise TC-1"
              ]
            },
            "end_state": {
              "must_observe": [
                "TC-1 result count >= 1"
              ],
              "must_not_observe": [
                "empty result (0)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "cited tokens resolve",
      "verify": "pnpm tokens:validate",
      "maps_to_ac": "AC-2",
      "scenario": {
        "test_tier": "integration",
        "evidence": {
          "artifact_type": "test_output"
        },
        "negative_control": {
          "would_fail_if": [
            "mocked/stubbed empty response still passes (test is fakeable)"
          ]
        },
        "cases": [
          {
            "start_state": {
              "description": "baseline before action",
              "records": [
                "empty baseline"
              ],
              "seed_method": "public_api"
            },
            "action": {
              "steps": [
                "exercise TC-2"
              ]
            },
            "end_state": {
              "must_observe": [
                "TC-2 result count >= 1"
              ],
              "must_not_observe": [
                "empty result (0)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "no-Badge/no-warning rule present",
      "verify": "grep -E 'no Badge|not a Badge|no warning|no alert' .spec/design/provenance-caption-treatment.md",
      "maps_to_ac": "AC-3",
      "scenario": {
        "test_tier": "integration",
        "evidence": {
          "artifact_type": "test_output"
        },
        "negative_control": {
          "would_fail_if": [
            "mocked/stubbed empty response still passes (test is fakeable)"
          ]
        },
        "cases": [
          {
            "start_state": {
              "description": "baseline before action",
              "records": [
                "empty baseline"
              ],
              "seed_method": "public_api"
            },
            "action": {
              "steps": [
                "exercise TC-3"
              ]
            },
            "end_state": {
              "must_observe": [
                "TC-3 result count >= 1"
              ],
              "must_not_observe": [
                "empty result (0)"
              ]
            }
          }
        ]
      }
    }
  ]
}
-->
