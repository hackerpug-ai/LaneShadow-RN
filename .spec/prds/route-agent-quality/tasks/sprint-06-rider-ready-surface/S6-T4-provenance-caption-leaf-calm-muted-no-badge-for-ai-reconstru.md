# S6-T4 — Provenance caption leaf (calm, muted, no badge) for ai_reconstructed + name_routed only + getCuratedRouteDetail geometryProvenance projection (SURF-05)

> Status: ⬜ Pending
> Proposed By: `frontend-designer`

| Field | Value |
|---|---|
| TASK_ID | S6-T4 |
| SPRINT | [Sprint 06 — Rider-ready surface](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | `frontend-designer` |
| ESTIMATE | 120 min |
| EFFORT | M |
| PRIORITY | P0 |
| PROPOSED_BY | `frontend-designer` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | touches CAP-GEO-03 |
| DEPENDS_ON | S6-T8 |
| BLOCKS | S6-T7 |

RUNTIME_COMMANDS:
- typecheck: `pnpm type-check`
- lint: `pnpm lint`
- test: `pnpm test`
- run: `pnpm ios`

## BACKGROUND
Render a calm, muted provenance caption on the curated-route detail screen ONLY for ai_reconstructed and name_routed routes, after projecting geometryProvenance through getCuratedRouteDetail.

## 🚫 CRITICAL CONSTRAINTS (Never tier)
- **MUST** mirror summary muted-text pattern
- **MUST** projection-only backend change (no schema mutation)
- **MUST** LITERAL caption copy for the two provenance values
- **NEVER** Badge / warning color for provenance
- **NEVER** caption for scraped_promoted or pre-provenance rows
- **NEVER** new design token
- **NEVER** paraphrase the literal copy
- **STRICTLY** geometryProvenance == 'ai_reconstructed' -> exact copy 1; == 'name_routed' -> exact copy 2; else render nothing

## SPECIFICATION
**Objective:** Render a calm, muted provenance caption on the curated-route detail screen ONLY for ai_reconstructed and name_routed routes, after projecting geometryProvenance through getCuratedRouteDetail.

**Success state:** A user opening a detail screen for an ai_reconstructed or name_routed route sees one muted sentence under the summary; a scraped_promoted (or pre-provenance) route shows no caption node at all; no Badge, no warning color appears anywhere for provenance.

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR)
### AC-1 [PRIMARY] — ai_reconstructed caption rendered with exact literal copy

**Requirement:** GIVEN a curated route whose geometryProvenance == 'ai_reconstructed' is seeded WHEN the user opens that route's detail screen THEN a single muted Text node with testID 'curated-detail-provenance' renders copy exactly 'Route line reconstructed from the ride description'

TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: vitest-react-native  ·  FLOW_REF: UC-SURF-05  ·  VERIFY: `pnpm test -- 'app/(app)/curated-route/provenance-caption.test.tsx' -t AC-1`

SCENARIO:
- CASE 1 (`seeded-ai-reconstructed`): MUST_OBSERVE ['caption text is exactly "Route line reconstructed from the ride description"', "testID 'curated-detail-provenance' present"]; MUST_NOT_OBSERVE ['no caption node', 'warning badge', 'alert color']
- NEGATIVE_CONTROL (would_fail_if): ['caption hardcoded regardless of provenance', 'projection returns geometryProvenance=null', 'static shell without projection']
- EVIDENCE: `stdout` (required_capture=True)

### AC-2 — name_routed caption rendered with exact literal copy

**Requirement:** GIVEN a curated route whose geometryProvenance == 'name_routed' is seeded WHEN the user opens that route's detail screen THEN the same muted Text node (testID 'curated-detail-provenance') renders copy exactly 'Route line generated from the road name'

TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: vitest-react-native  ·  FLOW_REF: UC-SURF-05  ·  VERIFY: `pnpm test -- 'app/(app)/curated-route/provenance-caption.test.tsx' -t AC-2`

SCENARIO:
- CASE 1 (`seeded-name-routed`): MUST_OBSERVE ['caption text is exactly "Route line generated from the road name"', "testID 'curated-detail-provenance' present"]; MUST_NOT_OBSERVE ['no caption node', 'warning badge', 'ai_reconstructed copy']
- NEGATIVE_CONTROL (would_fail_if): ['copy shared between the two values', 'copy paraphrased', 'projection drops name_routed']
- EVIDENCE: `stdout` (required_capture=True)

### AC-3 — NO caption for scraped_promoted or pre-provenance rows (non-degenerate: detail still live)

**Requirement:** GIVEN a curated route whose geometryProvenance == 'scraped_promoted' OR is unset/pre-provenance is seeded WHEN the user opens that route's detail screen THEN no node with testID 'curated-detail-provenance' is rendered and no provenance copy appears, AND the detail screen itself is live (route name rendered, not a blank shell)

TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: vitest-react-native  ·  FLOW_REF: UC-SURF-05  ·  VERIFY: `pnpm test -- 'app/(app)/curated-route/provenance-caption.test.tsx' -t AC-3`

SCENARIO:
- CASE 1 (`seeded-scraped-promoted`): MUST_OBSERVE ["the detail screen still renders the route name ' Cherohala Skyway' (detail is live, not a blank shell)", "0 nodes with testID 'curated-detail-provenance'", "0 occurrences of substring 'Route line' in the rendered tree"]; MUST_NOT_OBSERVE ["any node with testID 'curated-detail-provenance'", 'empty/blank detail screen (the start signature)']
- CASE 2 (`seeded-pre-provenance`): MUST_OBSERVE ["the detail screen still renders the route name 'Legacy Ridge Run' (detail is live, not a blank shell)", "0 nodes with testID 'curated-detail-provenance'", "0 occurrences of substring 'Route line' in the rendered tree"]; MUST_NOT_OBSERVE ["any node with testID 'curated-detail-provenance'", 'empty/blank detail screen (the start signature)']
- NEGATIVE_CONTROL (would_fail_if): ['caption unconditionally rendered', 'testID always present with empty text', 'copy shown for scraped_promoted', 'empty/blank detail screen accepted as passing the absence check (the start signature)', 'detail screen fails to render the route name (degenerate satisfier: blank shell)']
- EVIDENCE: `stdout` (required_capture=True)

### AC-4 — caption styled calm/muted, visually distinct from a warning badge

**Requirement:** GIVEN the detail screen for an ai_reconstructed route is rendered WHEN the caption is measured against the existing 'Approximate location' Badge THEN the caption is plain muted Text (semantic.color.onSurface.subtle, semantic.type.body.sm), NOT a Badge, NOT a warning/alert color, and the two are visually distinguishable

TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: vitest-react-native  ·  FLOW_REF: UC-SURF-05  ·  VERIFY: `pnpm test -- 'app/(app)/curated-route/provenance-caption.test.tsx' -t AC-4`

SCENARIO:
- CASE 1 (`seeded-ai-reconstructed`): MUST_OBSERVE ["caption node type === 'Text' (NOT 'Badge')", "color resolves to semantic.color.onSurface.subtle ('#9CA3AF' light / '#6B6460' dark)", "typography resolves to 'semantic.type.body.sm' (family 'ui', size '10.5', weight '400')"]; MUST_NOT_OBSERVE ['Badge component', 'warning/alert color', 'bold/large weight']
- NEGATIVE_CONTROL (would_fail_if): ['caption implemented as Badge', 'uses semantic warning/alert color', 'uses a prominent size/weight', "caption node type is anything other than 'Text'"]
- EVIDENCE: `stdout` (required_capture=True)

## TEST CRITERIA
- **TC-1** (→ AC-1): ai_reconstructed renders exact literal copy via testID curated-detail-provenance
  - VERIFY: `pnpm test -- 'app/(app)/curated-route/provenance-caption.test.tsx' -t AC-1`
- **TC-2** (→ AC-2): name_routed renders exact literal copy via testID curated-detail-provenance
  - VERIFY: `pnpm test -- 'app/(app)/curated-route/provenance-caption.test.tsx' -t AC-2`
- **TC-3** (→ AC-3): scraped_promoted and pre-provenance rows render no caption node
  - VERIFY: `pnpm test -- 'app/(app)/curated-route/provenance-caption.test.tsx' -t AC-3`
- **TC-4** (→ AC-4): caption is plain muted Text, not Badge, not warning color
  - VERIFY: `pnpm test -- 'app/(app)/curated-route/provenance-caption.test.tsx' -t AC-4`

## SCOPE (file-level write permissions)
**writeAllowed:**
- `app/(app)/curated-route/[id].tsx (MODIFY)`
- `components/curated-route/provenance-caption.tsx (NEW)`
- `convex/curatedRoutes.ts (MODIFY — projection only)`
**writeProhibited:**
- `tokens/**`
- `convex/curatedGeometry.ts`
- `shared/models/curated-routes.ts`
- `.spec/design/provenance-caption-treatment.md`

## READING LIST
- `app/(app)/curated-route/[id].tsx` (380-420) — muted summary pattern to mirror + Badge anti-pattern to avoid
- `convex/curatedRoutes.ts` (388-496) — getCuratedRouteDetail projection + routeDetailReturnValidator — add geometryProvenance
- `shared/models/curated-routes.ts` (190-200) — geometryProvenance union already at rest

## DESIGN
- Reference: .spec/prds/route-agent-quality/07-uc-surf.md
- muted Text leaf, single line, sits under summary — same prominence as summary muted-text
- color onSurface.subtle + typography type.body.sm — no new tokens
- testID 'curated-detail-provenance' present ONLY when caption renders (absent for scraped_promoted)
- visually MUST NOT rhyme with the 'Approximate location' Badge (no border, no pill, no warning color)

**Pattern:** muted Text leaf conditional on geometryProvenance
- pattern_source: `app/(app)/curated-route/[id].tsx:380-420 summary muted-text`

**Anti-pattern:** Badge variant; warning color; caption for scraped_promoted; empty-text caption node

## EVIDENCE / VERIFICATION GATES
- **red evidence (caption absent pre-change)** — `pnpm test -- 'app/(app)/curated-route/provenance-caption.test.tsx'` → AC-1..AC-4 fail before implementation; Exit 0 after
- **typecheck** — `pnpm type-check` → Exit 0
- **lint** — `pnpm lint` → Exit 0
- **tokens resolve** — `pnpm tokens:validate` → Exit 0
- **full suite** — `pnpm test` → Exit 0

## DEPENDENCIES
- Depends on: S6-T8
- Blocks: S6-T7

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S6-T4",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "seeded-ai-reconstructed": {
      "description": "one curated route with geometryProvenance='ai_reconstructed'",
      "seed_method": "public_api",
      "records": [
        "1 route geometryProvenance=ai_reconstructed"
      ]
    },
    "seeded-name-routed": {
      "description": "one curated route with geometryProvenance='name_routed'",
      "seed_method": "public_api",
      "records": [
        "1 route geometryProvenance=name_routed"
      ]
    },
    "seeded-scraped-promoted": {
      "description": "one curated route with geometryProvenance='scraped_promoted'",
      "seed_method": "public_api",
      "records": [
        "1 route geometryProvenance=scraped_promoted"
      ]
    },
    "seeded-pre-provenance": {
      "description": "legacy pre-provenance route, geometryProvenance undefined",
      "seed_method": "public_api",
      "records": [
        "1 route 'Legacy Ridge Run' geometryProvenance undefined"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a curated route whose geometryProvenance == 'ai_reconstructed' is seeded WHEN the user opens that route's detail screen THEN a single muted Text node with testID 'curated-detail-provenance' renders copy exactly 'Route line reconstructed from the ride description'",
      "verify": "pnpm test -- 'app/(app)/curated-route/provenance-caption.test.tsx' -t AC-1",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "vitest-react-native",
        "negative_control": {
          "would_fail_if": [
            "caption hardcoded regardless of provenance",
            "projection returns geometryProvenance=null",
            "static shell without projection",
            "empty/stub/mock path still passes"
          ]
        },
        "evidence": {
          "artifact_type": "stdout"
        },
        "cases": [
          {
            "start_ref": "seeded-ai-reconstructed",
            "action": {
              "actor": "api_client",
              "steps": [
                "seed route geometryProvenance='ai_reconstructed' via public_api",
                "render detail through routeDetailReturnValidator output",
                "read caption node by testID"
              ]
            },
            "end_state": {
              "must_observe": [
                "caption text is exactly \"Route line reconstructed from the ride description\"",
                "testID 'curated-detail-provenance' present"
              ],
              "must_not_observe": [
                "no caption node",
                "warning badge",
                "alert color",
                "empty (0)"
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
      "description": "GIVEN a curated route whose geometryProvenance == 'name_routed' is seeded WHEN the user opens that route's detail screen THEN the same muted Text node (testID 'curated-detail-provenance') renders copy exactly 'Route line generated from the road name'",
      "verify": "pnpm test -- 'app/(app)/curated-route/provenance-caption.test.tsx' -t AC-2",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "vitest-react-native",
        "negative_control": {
          "would_fail_if": [
            "copy shared between the two values",
            "copy paraphrased",
            "projection drops name_routed",
            "mocked/stubbed or empty-start path still passes (test is fakeable)",
            "empty/stub/mock path still passes"
          ]
        },
        "evidence": {
          "artifact_type": "stdout"
        },
        "cases": [
          {
            "start_ref": "seeded-name-routed",
            "action": {
              "actor": "api_client",
              "steps": [
                "seed route geometryProvenance='name_routed' via public_api",
                "render detail",
                "read caption node"
              ]
            },
            "end_state": {
              "must_observe": [
                "caption text is exactly \"Route line generated from the road name\"",
                "testID 'curated-detail-provenance' present"
              ],
              "must_not_observe": [
                "no caption node",
                "warning badge",
                "ai_reconstructed copy",
                "empty (0)"
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
      "description": "GIVEN a curated route whose geometryProvenance == 'scraped_promoted' OR is unset/pre-provenance is seeded WHEN the user opens that route's detail screen THEN no node with testID 'curated-detail-provenance' is rendered and no provenance copy appears, AND the detail screen itself is live (route name rendered, not a blank shell)",
      "verify": "pnpm test -- 'app/(app)/curated-route/provenance-caption.test.tsx' -t AC-3",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "vitest-react-native",
        "negative_control": {
          "would_fail_if": [
            "caption unconditionally rendered",
            "testID always present with empty text",
            "copy shown for scraped_promoted",
            "empty/blank detail screen accepted as passing the absence check (the start signature)",
            "detail screen fails to render the route name (degenerate satisfier: blank shell)",
            "empty/stub/mock path still passes"
          ]
        },
        "evidence": {
          "artifact_type": "stdout"
        },
        "cases": [
          {
            "start_ref": "seeded-scraped-promoted",
            "action": {
              "actor": "api_client",
              "steps": [
                "seed route geometryProvenance='scraped_promoted' via public_api (route name ' Cherohala Skyway')",
                "render detail",
                "query the rendered tree for testID 'curated-detail-provenance' and for the route name"
              ]
            },
            "end_state": {
              "must_observe": [
                "the detail screen still renders the route name ' Cherohala Skyway' (detail is live, not a blank shell)",
                "0 nodes with testID 'curated-detail-provenance'",
                "0 occurrences of substring 'Route line' in the rendered tree"
              ],
              "must_not_observe": [
                "any node with testID 'curated-detail-provenance'",
                "empty/blank detail screen (the start signature)"
              ]
            },
            "seed_method": "public_api"
          },
          {
            "start_ref": "seeded-pre-provenance",
            "action": {
              "actor": "api_client",
              "steps": [
                "seed a legacy pre-provenance route whose geometryProvenance is undefined via public_api",
                "render detail",
                "query the rendered tree for testID 'curated-detail-provenance' and for the route name"
              ]
            },
            "end_state": {
              "must_observe": [
                "the detail screen still renders the route name 'Legacy Ridge Run' (detail is live, not a blank shell)",
                "0 nodes with testID 'curated-detail-provenance'",
                "0 occurrences of substring 'Route line' in the rendered tree"
              ],
              "must_not_observe": [
                "any node with testID 'curated-detail-provenance'",
                "empty/blank detail screen (the start signature)"
              ]
            },
            "seed_method": "public_api"
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the detail screen for an ai_reconstructed route is rendered WHEN the caption is measured against the existing 'Approximate location' Badge THEN the caption is plain muted Text (semantic.color.onSurface.subtle, semantic.type.body.sm), NOT a Badge, NOT a warning/alert color, and the two are visually distinguishable",
      "verify": "pnpm test -- 'app/(app)/curated-route/provenance-caption.test.tsx' -t AC-4",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "vitest-react-native",
        "negative_control": {
          "would_fail_if": [
            "caption implemented as Badge",
            "uses semantic warning/alert color",
            "uses a prominent size/weight",
            "caption node type is anything other than 'Text'",
            "mocked/stubbed or empty-start path still passes (test is fakeable)",
            "empty/stub/mock path still passes"
          ]
        },
        "evidence": {
          "artifact_type": "stdout"
        },
        "cases": [
          {
            "start_ref": "seeded-ai-reconstructed",
            "action": {
              "actor": "api_client",
              "steps": [
                "render detail",
                "assert caption node type is Text not Badge",
                "assert color resolves to semantic.color.onSurface.subtle",
                "assert typography resolves to semantic.type.body.sm"
              ]
            },
            "end_state": {
              "must_observe": [
                "caption node type === 'Text' (NOT 'Badge')",
                "color resolves to semantic.color.onSurface.subtle ('#9CA3AF' light / '#6B6460' dark)",
                "typography resolves to 'semantic.type.body.sm' (family 'ui', size '10.5', weight '400')"
              ],
              "must_not_observe": [
                "Badge component",
                "warning/alert color",
                "bold/large weight",
                "empty/start signature: result count == 0 or field absent"
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
      "description": "ai_reconstructed renders exact literal copy via testID curated-detail-provenance",
      "verify": "pnpm test -- 'app/(app)/curated-route/provenance-caption.test.tsx' -t AC-1",
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
      "description": "name_routed renders exact literal copy via testID curated-detail-provenance",
      "verify": "pnpm test -- 'app/(app)/curated-route/provenance-caption.test.tsx' -t AC-2",
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
      "description": "scraped_promoted and pre-provenance rows render no caption node",
      "verify": "pnpm test -- 'app/(app)/curated-route/provenance-caption.test.tsx' -t AC-3",
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
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "caption is plain muted Text, not Badge, not warning color",
      "verify": "pnpm test -- 'app/(app)/curated-route/provenance-caption.test.tsx' -t AC-4",
      "maps_to_ac": "AC-4",
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
                "exercise TC-4"
              ]
            },
            "end_state": {
              "must_observe": [
                "TC-4 result count >= 1"
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