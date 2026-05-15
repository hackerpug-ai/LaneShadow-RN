# RR-S09-DR-T01 — Reconcile route-results variant naming + verify reference assets + canonical story IDs

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-14T20:25:00.000Z (retrofitted for MAPAPP-DOCTRINE 2026-05-14)

> **Task ID:** RR-S09-DR-T01
> **Sprint:** [Sprint 09 — MapApp · Route Results State](./SPRINT.md)
> **Agent:** frontend-designer
> **Estimate:** 120 min
> **Type:** INFRA
> **Status:** Backlog
> **Priority:** P0
> **Effort:** S
> **Sprint ID:** sprint-09-route-results-screen
> **PRD Refs:** UC-FID-01 (route-results variants), Sprint 09 — MapApp Route Results State

## Background

The Sprint 09 ROADMAP gate text lists route-results variants as **S01 default light**, **S02 alt-selected**, **S03 dark**, **S04 refining-scrim**, **V01 fewer-than-3**, **V02 single-candidate**, **V03 recall-chip**. The design-system canonical names — both in `.spec/design/system/views/mapapp/route-results/README.md` and in the existing PNG reference set under `.spec/design/system/views/mapapp/route-results/` — are different: **S01 Default · Best Pre-selected**, **S02 Alt1 Tapped · Sage Promoted**, **S03 Default · Dark**, **S04 Refining**, **V01 Two Candidates**, **V02 Weather Divergent** (NOT "single-candidate"), **V03 Message Dismissed** (NOT "recall-chip"). This drift mirrors the Sprint 08 variant-naming reconciliation owned by PLAN-S08-DR-T01.

Downstream capture tests (RR-S09-IOS-T05, RR-S09-AND-T05) MUST align to a single canonical set. This task locks the canonical set to the design-system README + existing PNG filenames (those have already been generated, are token-pure, and match the HTML mockup), updates the ROADMAP gate text accordingly (or annotates the gate to reference canonical names), confirms `pnpm design:references --screens route-results-screen` is idempotent against the current HTML, AND **publishes the canonical sandbox story ID convention** that maps each variant to a `templates.map-app.route-results-{variant}-{theme}` story per the MAPAPP-DOCTRINE retrofit (One View, Many States — route-results is a state of MapApp, captured via MapApp sandbox stories).

**Doctrine note (One View, Many States):** The design-system folder name `route-results-screen` and the reference PNG filenames are sunk-cost terminology kept for design-asset parity. Sandbox story IDs and downstream test method names use the new `templates.map-app.route-results-*` namespace because the runtime artifact is `MapApp` rendering with `MapAppState.routeResults(...)`, not a sibling `RouteResultsScreen` template. VARIANTS.md MUST surface both names (canonical PNG stem + canonical story ID) so capture-test authors have an authoritative mapping.

The task is **non-implementation infrastructure**: it does not write Swift or Kotlin code, does not run xcodebuild or gradle, and does not modify the design HTML itself unless reconciliation reveals a missing variant. The single point of authority output is `VARIANTS.md` in this sprint folder, which Sprint 09 implementer tasks consult.

## Critical Constraints

**MUST:**
- MUST treat the existing PNG filenames in `.spec/design/system/views/mapapp/route-results/` as canonical: `default--best-pre-selected.light.png`, `alt1-tapped--sage-promoted.light.png`, `default--dark.dark.png`, `refining.light.png`, `two-candidates.light.png`, `weather-divergent.light.png`, `message-dismissed.light.png`
- MUST verify `pnpm design:references --screens route-results-screen` (a) succeeds, (b) regenerates each PNG within a deterministic diff threshold (`pnpm design:references` is idempotent per Sprint 05 contract), (c) produces a matching `.annotations.json` for each PNG
- MUST publish the authoritative seven-variant table to `tasks/sprint-09-route-results-screen/VARIANTS.md` mapping ROADMAP gate label → canonical PNG filename stem → **canonical sandbox story ID** (`templates.map-app.route-results-{variant-slug}-{theme}`) → state-machine description (`MapAppState.routeResults(...)` with per-variant data seed) → theme → light/dark applicability
- MUST verify the design-system HTML at `.spec/design/system/views/mapapp/route-results/route-results.html` already exposes accessibility identifiers / data attributes that Sprint 09 capture tests can target (`data-variant` / `aria-label` per variant container)
- MUST flag any variant that exists in the canonical filename set but NOT in `route-results.html` (or vice versa) as a BLOCKER and surface it in `gate-evidence/RR-S09-DR-T01.md` for sprint discussion

**NEVER:**
- NEVER regenerate the PNG reference set with `--force` or `--overwrite` semantics; the existing PNGs are the canonical source; this task verifies, not rewrites
- NEVER add new variants beyond the canonical seven; new variants belong in a follow-on sprint with their own design-system update
- NEVER modify the design-system HTML to match the ROADMAP gate text; if reconciliation requires a change, the ROADMAP gate is the side that updates
- NEVER define sandbox story IDs as `templates.route-results-screen.{variant}` — that's the pre-doctrine sibling-screen namespace which is RETIRED. Canonical story IDs are `templates.map-app.route-results-{variant-slug}-{theme}`.
- NEVER write Swift, Kotlin, or TypeScript code as part of this task
- NEVER overwrite `.spec/design/system/views/mapapp/route-results/README.md` — the design-system README is the source of truth for naming

**STRICTLY:**
- STRICTLY use the design-review pipeline's existing `pnpm design:references` command for idempotency verification — do NOT roll a custom Puppeteer or Playwright capture
- STRICTLY produce `VARIANTS.md` in this sprint folder (not in the design-system folder) so it is co-located with the Sprint 09 tasks that consume it
- STRICTLY treat any PNG diff > 1px threshold during idempotency verification as a sprint-level concern surfaced in `gate-evidence/`, not a silent regeneration

## Specification

**Objective:** Lock the canonical seven-variant matrix for MapApp's route-results states by reconciling the ROADMAP gate text with the design-system README + existing PNG reference set, verify `pnpm design:references --screens route-results-screen` is idempotent against the current HTML, AND publish the canonical `templates.map-app.route-results-*` sandbox story ID convention for downstream capture tests + view-model fixtures.

**Success State:** `.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/VARIANTS.md` exists and contains a complete seven-row table mapping {ROADMAP label, canonical PNG filename stem, canonical sandbox story ID under `templates.map-app.route-results-*`, MapAppState data seed description, theme, light/dark applicability}. `pnpm design:references --screens route-results-screen` exits 0 with zero PNG diffs (idempotent). The seven canonical PNG filenames + matching `.annotations.json` files are present in `.spec/design/system/views/mapapp/route-results/`. `gate-evidence/RR-S09-DR-T01.md` records the verification run output and lists any reconciliation findings.

## Acceptance Criteria

### AC-1 — Canonical seven-variant table published to VARIANTS.md with story IDs

**GIVEN** Sprint 09 begins task expansion
**WHEN** `RR-S09-DR-T01` executes
**THEN** `.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/VARIANTS.md` exists with a markdown table containing exactly seven rows (one per canonical variant) and columns: `ROADMAP label`, `Canonical PNG filename stem`, `Canonical sandbox story ID (templates.map-app.route-results-{slug}-{theme})`, `MapAppState seed description`, `Theme`, `Reference asset path`
**Verify:** `test -f /Users/justinrich/Projects/LaneShadow/.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/VARIANTS.md && grep -c '^| ' /Users/justinrich/Projects/LaneShadow/.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/VARIANTS.md` returns ≥ 8 (1 header row + 7 data rows + alignment row) AND `grep -c 'templates.map-app.route-results-' /Users/justinrich/Projects/LaneShadow/.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/VARIANTS.md` returns ≥ 7

### AC-2 — `pnpm design:references` is idempotent for route-results-screen

**GIVEN** the current state of `.spec/design/system/views/mapapp/route-results/route-results.html` and the current PNG set in `.spec/design/system/views/mapapp/route-results/`
**WHEN** `pnpm design:references --screens route-results-screen` runs
**THEN** the command exits 0 AND no PNG file in `.spec/design/system/views/mapapp/route-results/` shows a content diff (verified via `git diff --stat .spec/design/system/views/mapapp/route-results/`)
**Verify:** `pnpm design:references --screens route-results-screen && git diff --stat .spec/design/system/views/mapapp/route-results/ | grep -c '|' | xargs -I {} test {} -eq 0`

### AC-3 — All seven canonical PNGs + annotations present

**GIVEN** the canonical filename set
**WHEN** the reference asset directory is enumerated
**THEN** all seven `.png` files AND all seven `.annotations.json` files exist under `.spec/design/system/views/mapapp/route-results/` matching the canonical stems (`default--best-pre-selected`, `alt1-tapped--sage-promoted`, `default--dark`, `refining`, `two-candidates`, `weather-divergent`, `message-dismissed`)
**Verify:** `ls /Users/justinrich/Projects/LaneShadow/.spec/design/system/views/mapapp/route-results/ | grep -c '\.png$'` returns 7 AND `ls /Users/justinrich/Projects/LaneShadow/.spec/design/system/views/mapapp/route-results/ | grep -c '\.annotations\.json$'` returns 7

### AC-4 — `route-results.html` exposes data-variant attributes for capture targeting

**GIVEN** the canonical seven variants
**WHEN** `route-results.html` is parsed
**THEN** every variant container in the HTML has a `data-variant="{canonical-stem}"` attribute (or equivalent `id` / `class` that the design-review capture pipeline can target); if any variant is missing this attribute, it is recorded in `gate-evidence/RR-S09-DR-T01.md` as a BLOCKER for Sprint 09 capture tests
**Verify:** `grep -c 'data-variant=' /Users/justinrich/Projects/LaneShadow/.spec/design/system/views/mapapp/route-results/route-results.html` returns ≥ 7 OR `gate-evidence/RR-S09-DR-T01.md` enumerates the missing attributes as a blocker

### AC-5 — Reconciliation findings recorded as gate evidence (including story ID convention)

**GIVEN** the reconciliation between ROADMAP gate text, canonical filenames, AND the new MAPAPP-DOCTRINE sandbox story ID convention
**WHEN** `RR-S09-DR-T01` completes
**THEN** `.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/gate-evidence/RR-S09-DR-T01.md` exists with: (a) command output from `pnpm design:references --screens route-results-screen`, (b) list of any reconciliation findings (terminology drift, missing variants, missing data attributes), (c) explicit `templates.map-app.route-results-*` story ID convention statement, (d) explicit statement either "no blockers" or enumerated blockers with proposed resolution
**Verify:** `test -f /Users/justinrich/Projects/LaneShadow/.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/gate-evidence/RR-S09-DR-T01.md && grep -l "design:references" /Users/justinrich/Projects/LaneShadow/.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/gate-evidence/RR-S09-DR-T01.md && grep -q "templates.map-app.route-results" /Users/justinrich/Projects/LaneShadow/.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/gate-evidence/RR-S09-DR-T01.md`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | VARIANTS.md exists with 7-row markdown table containing the required 6 columns including canonical story ID | AC-1 | `test -f .spec/.../VARIANTS.md && grep -c '^\|' .spec/.../VARIANTS.md` ≥ 8 + story ID count ≥ 7 | happy_path |
| TC-2 | `pnpm design:references --screens route-results-screen` exits 0 | AC-2 | `pnpm design:references --screens route-results-screen` | happy_path |
| TC-3 | No PNG content diff after `pnpm design:references` regeneration | AC-2 | `git diff --stat .spec/design/system/views/mapapp/route-results/ \| grep -c '\|'` returns 0 | edge |
| TC-4 | Exactly 7 .png files present in refs directory | AC-3 | `ls /Users/justinrich/Projects/LaneShadow/.spec/design/system/views/mapapp/route-results/*/*.png \| wc -l` returns 7 | happy_path |
| TC-5 | Exactly 7 .annotations.json files present in refs directory | AC-3 | `ls /Users/justinrich/Projects/LaneShadow/.spec/design/system/views/mapapp/route-results/*/*.annotations.json \| wc -l` returns 7 | happy_path |
| TC-6 | data-variant attributes present in route-results.html | AC-4 | `grep -c 'data-variant=' /Users/justinrich/Projects/LaneShadow/.spec/design/system/views/mapapp/route-results/route-results.html` ≥ 7 | edge |
| TC-7 | gate-evidence/RR-S09-DR-T01.md exists and references design:references + the templates.map-app.route-results-* story ID convention | AC-5 | `test -f gate-evidence/RR-S09-DR-T01.md && grep -q 'design:references' && grep -q 'templates.map-app.route-results'` | happy_path |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `.spec/design/system/views/mapapp/route-results/route-results.html` | all | Visual contract — all 7 variant containers; verify `data-variant=` or equivalent attribute |
| `.spec/design/system/views/mapapp/route-results/README.md` | all | Canonical variant matrix (S01..V03) + composition + tokens — reconciliation source of truth |
| `.spec/design/system/views/mapapp/route-results/` | all | Canonical PNG + annotations.json set (7 of each); these filenames are the canonical stems |
| `.spec/prds/v3-integration/ROADMAP.md` | 590-635 | Sprint 09 gate variant labels — reconciliation target |
| `scripts/design-review/` | all | `pnpm design:references` implementation; capture/eval/report scripts |
| `RULES.md` | "Design Rules › One View, Many States" + "Design Review Pipeline — View Snapshot Testing" | Planner contract for design-review pipeline expansion per sprint AND the doctrine that drives the `templates.map-app.route-results-*` story ID convention |
| `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-DR-T01-regenerate-planning-screen-references.md` | all | Sprint 08 prior-art for the same kind of reconciliation task; the Sprint 08 variant uses `templates.map-app.planning-*` story IDs per the same doctrine |

## Guardrails

**Write-Allowed:**
- `.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/VARIANTS.md` (NEW)
- `.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/gate-evidence/RR-S09-DR-T01.md` (NEW)
- `.spec/design/system/views/mapapp/route-results/route-results.html` (MODIFY — ONLY to add missing `data-variant` attributes if AC-4 surfaces a blocker; visual changes prohibited)
- `.spec/design/system/views/mapapp/route-results/` (regeneration via `pnpm design:references` only — never hand-edit; treat as derived output)

**Write-Prohibited:**
- `.spec/design/system/views/mapapp/route-results/README.md` — canonical source of truth, do NOT modify
- `.spec/prds/v3-integration/ROADMAP.md` — separate roadmap revision required if reconciliation calls for a gate update (out of this task's scope; flag as recommendation)
- `ios/**`, `android/**`, `server/**`, `react-native/**`, `tokens/**` — out of scope
- `scripts/design-review/**` — pipeline scripts owned by Sprint 05 / 08

## Design

**References:**
- `.spec/design/system/views/mapapp/route-results/README.md` (canonical 7-variant matrix)
- `.spec/design/system/views/mapapp/route-results/*/*.png` + matching `.annotations.json` files (canonical reference set)
- `.spec/design/system/views/mapapp/route-results/route-results.html` (visual contract)
- `scripts/design-review/prompts/visual-eval.md` (vision LLM eval prompt)
- Sprint 08 prior-art: PLAN-S08-DR-T01 (uses `templates.map-app.planning-*` story IDs per the same doctrine)
- `RULES.md` § Design Rules › One View, Many States (drives the `templates.map-app.route-results-*` story ID convention)

**Interaction Notes:** REQUIRED READING: `.spec/design/system/views/mapapp/route-results/route-results.html` + `.spec/design/system/views/mapapp/route-results/README.md` + `RULES.md` § Design Rules › One View, Many States. No new user-facing interactions are introduced — this task verifies the existing reference set, locks the canonical variant matrix, and locks the canonical sandbox story ID convention (`templates.map-app.route-results-*`) that downstream capture tests will hit.

**Pattern:** Sprint 08 PLAN-S08-DR-T01 reconciliation pattern. The Sprint 08 task ran `pnpm design:references` to verify idempotency, then produced the canonical variant matrix with `templates.map-app.planning-*` story IDs. Mirror that approach here for `templates.map-app.route-results-*`.

**Pattern Source:** `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-DR-T01-regenerate-planning-screen-references.md`

**Anti-Pattern:** Hand-editing PNG files in `.spec/design/system/views/mapapp/route-results/`; regenerating with `--force` and silently overwriting baselines; introducing a new variant naming scheme that diverges from both the ROADMAP and the design-system README; modifying the design-system HTML visually to "fix" a reconciliation drift (the design-system is the source of truth); defining sandbox story IDs under the pre-doctrine `templates.route-results-screen.*` namespace (RETIRED — use `templates.map-app.route-results-*`).

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `test -f /Users/justinrich/Projects/LaneShadow/.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/VARIANTS.md && grep -c '^\|' /Users/justinrich/Projects/LaneShadow/.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/VARIANTS.md` ≥ 8 AND `grep -c 'templates.map-app.route-results-' .../VARIANTS.md` ≥ 7 |
| AC-2 | `pnpm design:references --screens route-results-screen && git diff --stat .spec/design/system/views/mapapp/route-results/ \| grep -c '\|'` returns 0 |
| AC-3 | `ls /Users/justinrich/Projects/LaneShadow/.spec/design/system/views/mapapp/route-results/*/*.png \| wc -l` returns 7 AND `ls /Users/justinrich/Projects/LaneShadow/.spec/design/system/views/mapapp/route-results/*/*.annotations.json \| wc -l` returns 7 |
| AC-4 | `grep -c 'data-variant=' /Users/justinrich/Projects/LaneShadow/.spec/design/system/views/mapapp/route-results/route-results.html` ≥ 7 OR gate-evidence enumerates missing attributes |
| AC-5 | `test -f gate-evidence/RR-S09-DR-T01.md && grep -q 'design:references' && grep -q 'templates.map-app.route-results' gate-evidence/RR-S09-DR-T01.md` |

## Agent Assignment

**Agent:** frontend-designer
**Rationale:** This is design-system reconciliation work — verifying canonical names, idempotency of reference generation, authoring a variant matrix, AND locking the sandbox story ID convention. No native code, no Convex code, no E2E test code. Matches `frontend-designer`'s mandate per `RULES.md` ("Standalone visual exploration; do not assign sprint implementation, verification, token pipelines, registries, or stateful UI work to this agent.") — this task is exploratory/verification design work + naming-convention codification, NOT sprint implementation. Output is markdown + verified PNG idempotency, both of which fall inside the agent's safe scope. The reviewer for this task should be a project maintainer who reads `VARIANTS.md` for correctness; no auto-reviewer is dispatched because there's no code to lint.

## Coding Standards

- `RULES.md` § Design Rules › One View, Many States, §"Design Review Pipeline — View Snapshot Testing" (planner contract)
- `RULES.md` §"Cross-Platform Component Parity" (canonical sandbox story ID naming — mirrors capture filename naming AND mirrors iOS/Android story ID symmetry)
- `.spec/design/system/views/mapapp/route-results/README.md` (canonical variant matrix)
- Sprint 08 prior-art at `tasks/sprint-08-planning-state/PLAN-S08-DR-T01-regenerate-planning-screen-references.md`

## Dependencies

**Depends on:**
- (none — runs first in Sprint 09 wave order)

**Blocks:**
- RR-S09-IOS-T02 (consumes canonical sandbox story IDs `templates.map-app.route-results-*` for story registration)
- RR-S09-AND-T02 (same — Android sandbox story registration)
- RR-S09-IOS-T05 (iOS capture tests consume the canonical variant matrix + story IDs from VARIANTS.md)
- RR-S09-AND-T05 (Android capture tests consume the same matrix + story IDs)
- RR-S09-T11 (Sprint 09 gate verifies design-review pipeline against the canonical matrix)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"VARIANTS.md exists with 7-row markdown table mapping ROADMAP label to canonical PNG filename to canonical sandbox story ID (templates.map-app.route-results-*) to MapAppState seed description to theme to reference asset path","verify":"test -f .spec/prds/v3-integration/tasks/sprint-09-route-results-screen/VARIANTS.md && grep -c '^|' returns >= 8 AND grep -c 'templates.map-app.route-results-' returns >= 7","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"pnpm design:references --screens route-results-screen is idempotent: exits 0 with zero PNG content diffs","verify":"pnpm design:references --screens route-results-screen && git diff --stat .spec/design/system/views/mapapp/route-results/ | grep -c '|' returns 0","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"All 7 canonical PNGs + 7 matching .annotations.json files present in .spec/design/system/views/mapapp/route-results/","verify":"ls .spec/design/system/views/mapapp/route-results/*/*.png | wc -l == 7 AND ls .spec/design/system/views/mapapp/route-results/*/*.annotations.json | wc -l == 7","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"route-results.html exposes data-variant or equivalent capture-targetable attributes for all 7 variants; missing attributes recorded in gate-evidence as BLOCKER","verify":"grep -c 'data-variant=' .spec/design/system/views/mapapp/route-results/route-results.html >= 7 OR gate-evidence enumerates missing","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"gate-evidence/RR-S09-DR-T01.md records the design:references output, reconciliation findings, the templates.map-app.route-results-* story ID convention, and an explicit no-blockers or blockers-enumerated statement","verify":"test -f gate-evidence/RR-S09-DR-T01.md && grep -q 'design:references' && grep -q 'templates.map-app.route-results'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"VARIANTS.md has 7 data rows + 1 header + 1 alignment AND >= 7 canonical story IDs under templates.map-app.route-results-","verify":"grep + grep","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"pnpm design:references --screens route-results-screen exits 0","verify":"pnpm design:references --screens route-results-screen; echo $?","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"No PNG content diff after pnpm design:references run","verify":"git diff --stat .spec/design/system/views/mapapp/route-results/ | wc -l == 0","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-4","type":"test_criterion","description":"Exactly 7 .png files present in refs directory","verify":"ls .spec/design/system/views/mapapp/route-results/*/*.png | wc -l == 7","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-5","type":"test_criterion","description":"Exactly 7 .annotations.json files present in refs directory","verify":"ls .spec/design/system/views/mapapp/route-results/*/*.annotations.json | wc -l == 7","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-6","type":"test_criterion","description":"data-variant attributes count >= 7 in route-results.html","verify":"grep -c 'data-variant=' .spec/design/system/views/mapapp/route-results/route-results.html","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-7","type":"test_criterion","description":"gate-evidence/RR-S09-DR-T01.md exists and references both design:references and templates.map-app.route-results-* convention","verify":"test -f gate-evidence/RR-S09-DR-T01.md && grep -q 'design:references' && grep -q 'templates.map-app.route-results'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"}
  ]
}
-->
