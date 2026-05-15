# PLAN-S08-DR-T01 — Regenerate planning-screen references + reconcile variant naming + update planning-screen.html to capsule + indicator layout
> Status: ✅ Completed
> Cycle: 2
> Commit: e487727527820d88e1e0588bb261bdd33437bd01
> Reviewer: design-reviewer
> Updated: 2026-05-09T02:39:08.361Z

> Status: 🟡 In Progress
> Cycle: 1
> Updated: 2026-05-07T19:05:00.000Z

> **Task ID:** PLAN-S08-DR-T01
> **Sprint:** [Sprint 08 — Map View · Planning State](./SPRINT.md)
> **Agent:** frontend-designer
> **Estimate:** 150 min
> **Type:** DESIGN
> **Status:** Backlog
> **Priority:** P0
> **Effort:** M
> **Sprint ID:** sprint-08-planning-state
> **PRD Refs:** UC-FID-01, Sprint 08 Map View — Planning State (Map View Redesign 2026-05-06)

## Background

The current `.spec/design/system/refs/planning-screen/*.png` set predates the Container Principle and the post-Sprint-07 capsule retrofit — captures still show the legacy floating LSPhaseIndicator-only top-overlay. Sprint 08 implementers (PLAN-S08-IOS-T05, PLAN-S08-AND-T05) will compare instrumented captures against this reference set, so the references MUST be regenerated against the post-Sprint-07 composed layout (`mol-context-capsule --planning` above + `mol-phase-indicator` below in the `org-map-layer__top-overlay` slot) before the gate (PLAN-S08-T11) can pass.

Variant naming needs reconciliation. The ROADMAP gate text uses different labels (S01 active light, S02 cancel-confirm, S03 dark, V01 slow-apology, V02 cancel-confirm-with-prior-chat, V03 single-candidate-warning) than the design-system `planning-screen/README.md` (S01 Scouting / S02 Drawing / S03 Weather / S04 Scoring / V01 Slow / V02 Cancel-Prompt / V03 Single-Candidate). This task picks the canonical naming, updates both surfaces, and regenerates PNGs to align.

## Critical Constraints

**MUST:**
- Update `.spec/design/system/views/mapapp/planning/planning-screen.html` so the `org-map-layer__top-overlay` slot composes `mol-context-capsule --planning` **above** `mol-phase-indicator` (separate molecules in the slot), replacing the legacy floating phase-indicator-only layout per the 2026-05-07 layout decision documented in `SPRINT.md` Notes §
- Reconcile variant naming between the ROADMAP gate text (`.spec/prds/v3-integration/ROADMAP.md` Sprint 08 row) and the design-system `planning-screen/README.md`. Pick the canonical naming (recommendation: keep the design-system names — Scouting / Drawing / Weather / Scoring / Slow Planning / Cancel Prompt / Single Candidate — and update the ROADMAP gate text to match) and apply it to both files
- Run `pnpm design:references --screens planning-screen` to regenerate every PNG in `.spec/design/system/refs/planning-screen/` from the updated HTML
- Update `.spec/design/system/refs/planning-screen/*.annotations.json` to match the new variant names (file renames + content updates) so downstream design-review pipeline consumes the canonical naming
- Update `.spec/design/system/views/mapapp/planning/README.md` to: (1) reflect the new composed layout (capsule above + indicator below), (2) document the canonical variant naming after reconciliation, (3) update the Composes table to include `mol-context-capsule --planning` as the primary top-overlay molecule, (4) document the View-local constants for sketch animation (1400ms loop) and head-dot breathing (1400ms ease-in-out)
- Update `.spec/prds/v3-integration/ROADMAP.md` Sprint 08 gate test step #2 (and any other Sprint 08 row text referencing variant names) to use the canonical naming; the diff MUST be the minimum necessary to align variant labels — no scope/timeline changes

**NEVER:**
- NEVER hand-edit the regenerated PNGs — they MUST be produced by `pnpm design:references` only
- NEVER introduce new design-system molecules in this task — the planning state composes existing `mol-context-capsule` (Sprint 07) + `mol-phase-indicator` (Sprint 04); the sketch polyline is a configuration of `LSMap`, not a new molecule
- NEVER touch production native code (iOS/Android) — this is a DESIGN task; native implementers (PLAN-S08-IOS-T02 / PLAN-S08-AND-T02) consume these references downstream
- NEVER drop variants from the regenerated reference set — every variant from the canonical README list must produce a PNG (≥7 variants × applicable themes per README matrix)
- NEVER leave the ROADMAP gate text inconsistent with the design-system README naming after this task

**STRICTLY:**
- STRICTLY follow the existing `design:references` script invocation pattern (see `scripts/design-references/` — or wherever the pnpm script resolves) — do not work around the pipeline by manually exporting from a browser
- STRICTLY check that no high-severity tokens.css change is implied — variant naming reconciliation is text-level only, not token-changing
- STRICTLY follow the design-system README authoring conventions (composes table, token recipe, accessibility section, view-local constants table)

## Specification

**Objective:** (1) Update `.spec/design/system/views/mapapp/planning/planning-screen.html` to use `mol-context-capsule --planning` above `mol-phase-indicator` in the `org-map-layer__top-overlay` slot (composed layout); (2) reconcile variant naming between the ROADMAP gate text and the design-system README — pick canonical names and propagate; (3) run `pnpm design:references --screens planning-screen` to regenerate the PNG reference set; (4) update `.spec/design/system/views/mapapp/planning/README.md` to reflect both changes; (5) update `.spec/prds/v3-integration/ROADMAP.md` Sprint 08 row text for variant-name consistency.

**Success State:** `pnpm design:references --screens planning-screen` exits 0; `.spec/design/system/refs/planning-screen/` contains one PNG per canonical variant from the regenerated reference set; `planning-screen.html` shows the composed top-overlay; `planning-screen/README.md` documents the canonical variant naming and the new composes table; `.spec/prds/v3-integration/ROADMAP.md` Sprint 08 row uses the canonical naming.

## Acceptance Criteria

### AC-1 — planning-screen.html uses the composed top-overlay layout

**GIVEN** the updated `.spec/design/system/views/mapapp/planning/planning-screen.html`
**WHEN** the file is grepped for the top-overlay slot composition
**THEN** the `org-map-layer__top-overlay` slot contains `mol-context-capsule mol-context-capsule--planning` followed by `mol-phase-indicator` (in that DOM order); the legacy floating LSPhaseIndicator-only layout is removed
**Verify:** `grep -A 30 'org-map-layer__top-overlay' .spec/design/system/views/mapapp/planning/planning-screen.html | grep -E 'mol-context-capsule.*--planning' && grep -A 30 'org-map-layer__top-overlay' .spec/design/system/views/mapapp/planning/planning-screen.html | grep 'mol-phase-indicator'`

### AC-2 — Variant naming reconciled across HTML, README, refs, and ROADMAP

**GIVEN** the canonical variant naming chosen (recommendation: design-system README naming — Scouting / Drawing / Weather / Scoring / Slow Planning / Cancel Prompt / Single Candidate)
**WHEN** `planning-screen.html`, `README.md`, `refs/planning-screen/*.annotations.json`, and `ROADMAP.md` Sprint 08 row are grepped
**THEN** all four surfaces use the canonical naming with no leftover legacy labels (e.g., no "S02 cancel-confirm" appearing alongside "S02 Drawing" anywhere)
**Verify:** `! grep -i -E 'cancel-confirm|cancel-confirm-with-prior-chat|single-candidate-warning|slow-apology' .spec/design/system/views/mapapp/planning/README.md .spec/prds/v3-integration/ROADMAP.md`

### AC-3 — pnpm design:references regenerates every PNG cleanly

**GIVEN** the updated `planning-screen.html`
**WHEN** `pnpm design:references --screens planning-screen` runs
**THEN** the command exits 0; `.spec/design/system/refs/planning-screen/*.png` contains one PNG per canonical variant from the README matrix; no PNG is older than the timestamp of the HTML edit; old/stale variant PNGs (under legacy names) are removed
**Verify:** `pnpm design:references --screens planning-screen && ls .spec/design/system/refs/planning-screen/*.png | wc -l`

### AC-4 — README updated with composes table, variant matrix, and view-local constants

**GIVEN** the updated `.spec/design/system/views/mapapp/planning/README.md`
**WHEN** the file is read
**THEN** the Composes table includes `mol-context-capsule --planning` as the primary top-overlay molecule; the Variant matrix lists the canonical names with theme columns; the View-local constants table documents 1400ms sketch loop + 1400ms head-dot breathing
**Verify:** `grep -E 'mol-context-capsule.*--planning' .spec/design/system/views/mapapp/planning/README.md && grep -E '1400ms' .spec/design/system/views/mapapp/planning/README.md`

### AC-5 — ROADMAP.md Sprint 08 row uses canonical variant naming

**GIVEN** `.spec/prds/v3-integration/ROADMAP.md` Sprint 08 gate test step #2 text
**WHEN** the section is grepped for legacy variant labels
**THEN** no legacy labels remain; the canonical names appear; the diff is the minimum necessary (no scope/timeline changes elsewhere in the row)
**Verify:** `! grep -i -E 'cancel-confirm-with-prior-chat|single-candidate-warning|slow-apology' .spec/prds/v3-integration/ROADMAP.md`

### AC-6 — annotations.json files renamed/updated to canonical naming

**GIVEN** `.spec/design/system/refs/planning-screen/*.annotations.json`
**WHEN** the directory is listed
**THEN** annotations.json files exist for each canonical variant (one per `<variant>.<theme>.png`); legacy filenames are removed; the `name` field inside each annotations.json matches the canonical variant label
**Verify:** `ls .spec/design/system/refs/planning-screen/*.annotations.json | wc -l`

### AC-7 — Diff is design-only (no production code touched)

**GIVEN** the working tree after this task's edits
**WHEN** `git diff --name-only HEAD` is inspected
**THEN** only paths under `.spec/design/system/views/mapapp/planning/`, `.spec/design/system/refs/planning-screen/`, and `.spec/prds/v3-integration/ROADMAP.md` appear; no `ios/`, `android/`, `server/`, `react-native/`, `tokens/` paths are modified
**Verify:** `! git diff --name-only HEAD | grep -E '^(ios|android|server|react-native|tokens)/'`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | planning-screen.html top-overlay slot contains mol-context-capsule --planning followed by mol-phase-indicator | AC-1 | `grep -A 30 'org-map-layer__top-overlay' .spec/design/system/views/mapapp/planning/planning-screen.html` | happy_path |
| TC-2 | No legacy variant labels remain in HTML / README / ROADMAP | AC-2 | `! grep -i -E 'cancel-confirm-with-prior-chat\|single-candidate-warning\|slow-apology' .spec/design/system/views/mapapp/planning/README.md .spec/prds/v3-integration/ROADMAP.md` | edge |
| TC-3 | pnpm design:references --screens planning-screen exits 0 + PNG count matches canonical variant count | AC-3 | `pnpm design:references --screens planning-screen` | happy_path |
| TC-4 | README composes table includes mol-context-capsule --planning + 1400ms motion constants documented | AC-4 | `grep -E 'mol-context-capsule.*--planning\|1400ms' .spec/design/system/views/mapapp/planning/README.md` | happy_path |
| TC-5 | ROADMAP.md Sprint 08 row uses canonical variant naming, no legacy labels | AC-5 | `! grep -i -E 'cancel-confirm-with-prior-chat\|single-candidate-warning\|slow-apology' .spec/prds/v3-integration/ROADMAP.md` | edge |
| TC-6 | annotations.json files exist per canonical variant + name fields match canonical labels | AC-6 | `ls .spec/design/system/refs/planning-screen/*.annotations.json \| wc -l` | happy_path |
| TC-7 | Diff is design-only — no production code paths touched | AC-7 | `! git diff --name-only HEAD \| grep -E '^(ios\|android\|server\|react-native\|tokens)/'` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `.spec/design/system/views/mapapp/planning/planning-screen.html` | all | Current legacy layout — floating LSPhaseIndicator-only top overlay; this task replaces with composed capsule+indicator |
| `.spec/design/system/views/mapapp/planning/README.md` | all | Current variant matrix + composes table + token recipe; update to reflect new layout + canonical naming |
| `.spec/design/system/molecules/context-capsule/README.md` | all | --planning state contract; copy semantics for italic single-line headline |
| `.spec/design/system/molecules/context-capsule/context-capsule.html` | all | Visual reference for the --planning state markup that will be embedded in planning-screen.html |
| `.spec/design/system/molecules/phase-indicator/README.md` | all | 5-step pipeline contract; ensures the indicator's role in the composed layout is documented |
| `.spec/design/system/refs/planning-screen/` | all | Current PNG set + annotations.json — to be regenerated/renamed after HTML + naming reconciliation |
| `scripts/design-references/` (or pnpm `design:references` script entry) | all | Pipeline invocation contract for regenerating PNGs from HTML |
| `.spec/prds/v3-integration/ROADMAP.md` | Sprint 08 row | Gate test step #2 text using legacy variant labels; minimum-diff update for naming consistency |
| `.spec/prds/v3-integration/tasks/sprint-08-planning-state/SPRINT.md` | Notes section | 2026-05-07 layout decision (capsule + indicator both visible) — input to this task's HTML rewrite |

## Guardrails

**Write-Allowed:**
- `.spec/design/system/views/mapapp/planning/planning-screen.html` (MODIFY — replace legacy floating phase-indicator-only top overlay with composed capsule + indicator layout)
- `.spec/design/system/views/mapapp/planning/README.md` (MODIFY — composes table, variant matrix with canonical naming, view-local constants)
- `.spec/design/system/refs/planning-screen/*.png` (REGENERATE via `pnpm design:references` — never hand-edit)
- `.spec/design/system/refs/planning-screen/*.annotations.json` (REGENERATE or rename to match canonical variant naming)
- `.spec/prds/v3-integration/ROADMAP.md` (MODIFY — Sprint 08 gate test step #2 wording for variant-name consistency; minimum diff)

**Write-Prohibited:**
- `ios/**`, `android/**`, `server/**`, `react-native/**`, `tokens/**` — production code, never touch in a DESIGN task
- `.spec/design/system/tokens/**` — token surface unchanged in this task
- `.spec/design/system/molecules/**` — consumed molecules (context-capsule, phase-indicator); never modify in this task
- `.spec/design/system/organisms/**` — Sprint 07 + Sprint 06 organisms are consumed unchanged
- Other view directories (`.spec/design/system/views/mapapp/idle/`, etc.) — out of scope
- Other sprint folders (sprint-01..07, sprint-09..11) — out of scope

## Design

**References:**
- `.spec/design/system/molecules/context-capsule/context-capsule.html` (--planning state visual contract)
- `.spec/design/system/molecules/context-capsule/README.md` (state matrix + token recipe)
- `.spec/design/system/molecules/phase-indicator/phase-indicator.html` + `README.md` (5-step pipeline)
- `.spec/prds/v3-integration/tasks/sprint-08-planning-state/SPRINT.md` Notes (2026-05-07 layout decision)

**Interaction Notes:** This is a design + reference-regeneration task — no native code, no Convex backend. The deliverable is a self-consistent set of reference assets + HTML + READMEs + ROADMAP text using the canonical variant naming. Downstream native implementers (PLAN-S08-IOS-T02 / PLAN-S08-AND-T02) consume the regenerated HTML as the visual contract; capture tests (PLAN-S08-IOS-T05 / PLAN-S08-AND-T05) align to the regenerated PNGs; the gate (PLAN-S08-T11) compares captures vs these references via `pnpm design:review --screens planning-screen`.

**Pattern:** Sprint 06 / Sprint 07 idle-screen reference regeneration — same pattern of (1) update HTML, (2) update README, (3) regenerate PNGs via `pnpm design:references`, (4) align downstream consumers.

**Pattern Source:** Sprint 06 IDLE-S06-DR-T01 (idle-screen post-Container-Principle regeneration) + Sprint 07 CAPS-S07-T07 (capture refresh after capsule retrofit).

**Anti-Pattern:** Hand-editing regenerated PNGs to dodge a layout difference; introducing new design-system molecules instead of composing existing ones; modifying production code from a DESIGN task; leaving ROADMAP gate text inconsistent with README naming; dropping variants from the regenerated set; breaking the composes table conventions in README.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `grep -A 30 'org-map-layer__top-overlay' .spec/design/system/views/mapapp/planning/planning-screen.html \| grep -E 'mol-context-capsule.*--planning'` |
| AC-2 | `! grep -i -E 'cancel-confirm-with-prior-chat\|single-candidate-warning\|slow-apology' .spec/design/system/views/mapapp/planning/README.md .spec/prds/v3-integration/ROADMAP.md` |
| AC-3 | `pnpm design:references --screens planning-screen && ls .spec/design/system/refs/planning-screen/*.png \| wc -l` |
| AC-4 | `grep -E 'mol-context-capsule.*--planning\|1400ms' .spec/design/system/views/mapapp/planning/README.md` |
| AC-5 | `! grep -i -E 'cancel-confirm-with-prior-chat\|single-candidate-warning\|slow-apology' .spec/prds/v3-integration/ROADMAP.md` |
| AC-6 | `ls .spec/design/system/refs/planning-screen/*.annotations.json \| wc -l` |
| AC-7 | `! git diff --name-only HEAD \| grep -E '^(ios\|android\|server\|react-native\|tokens)/'` |
| build | `pnpm design:references --screens planning-screen` |
| lint | `pnpm biome check .spec/design/system/views/mapapp/planning/` |

## Agent Assignment

**Agent:** frontend-designer
**Rationale:** Design-only task — updating an HTML view file, regenerating PNG references via the design-system pipeline, updating a design-system README, and reconciling variant naming across spec surfaces. No production native code, no Convex backend, no testing infrastructure. Pure design-system / spec authoring territory matching frontend-designer's mandate per `brain/docs/design-system/`.

## Coding Standards

- `brain/docs/design-system/component-authoring.md`
- `brain/docs/design-system/token-conventions.md`
- `brain/docs/design-system/view-spec-conventions.md`
- `RULES.md` (LaneShadow §Design Rules, §Design Review Pipeline — View Snapshot Testing, §.spec directory structure)

## Dependencies

**Depends on:** CAPS-S07-T05 / CAPS-S07-T06 (idle retrofit landed — capsule contract stable), CAPS-S07-T07 / CAPS-S07-T08 (capture refresh proven — pipeline path validated)
**Blocks:**
- PLAN-S08-IOS-T02, PLAN-S08-AND-T02 (consume the updated planning-screen.html as visual contract)
- PLAN-S08-IOS-T05, PLAN-S08-AND-T05 (capture tests align to regenerated reference set + canonical variant naming)
- PLAN-S08-T11 (sprint gate consumes regenerated references for `pnpm design:review`)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN updated planning-screen.html WHEN top-overlay slot grepped THEN mol-context-capsule --planning followed by mol-phase-indicator in DOM order",
      "verify": "grep -A 30 'org-map-layer__top-overlay' .spec/design/system/views/mapapp/planning/planning-screen.html | grep -E 'mol-context-capsule.*--planning'",
      "satisfied": true,
      "evidence": ".spec/design/system/views/mapapp/planning/planning-screen.html:609-614 place `mol-context-capsule--planning` before `mol-phase-indicator` inside `org-map-layer__top-overlay`.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "e487727527820d88e1e0588bb261bdd33437bd01",
      "maps_to_ac": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN canonical variant naming WHEN HTML/README/ROADMAP grepped THEN no legacy labels remain anywhere",
      "verify": "! grep -i -E 'cancel-confirm-with-prior-chat|single-candidate-warning|slow-apology' .spec/design/system/views/mapapp/planning/README.md .spec/prds/v3-integration/ROADMAP.md",
      "satisfied": true,
      "evidence": "`rg -n -i 'cancel-confirm-with-prior-chat|single-candidate-warning|slow-apology' .spec/design/system/views/mapapp/planning/planning-screen.html .spec/design/system/views/mapapp/planning/README.md .spec/prds/v3-integration/ROADMAP.md` returned no matches.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "e487727527820d88e1e0588bb261bdd33437bd01",
      "maps_to_ac": null
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN updated HTML WHEN pnpm design:references runs THEN exit 0 + one PNG per canonical variant + stale legacy PNGs removed",
      "verify": "pnpm design:references --screens planning-screen && ls .spec/design/system/refs/planning-screen/*.png | wc -l",
      "satisfied": true,
      "evidence": "`pnpm design:references --screens planning-screen` exited 0; `.spec/design/system/refs/planning-screen/` contains exactly 7 PNGs: `cancel-prompt.light.png`, `drawing.light.png`, `scoring.dark.png`, `scouting.light.png`, `single-candidate.light.png`, `slow-planning.light.png`, `weather.light.png`.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "e487727527820d88e1e0588bb261bdd33437bd01",
      "maps_to_ac": null
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN updated README WHEN read THEN composes table includes mol-context-capsule --planning + view-local constants document 1400ms loop + breathing",
      "verify": "grep -E 'mol-context-capsule.*--planning|1400ms' .spec/design/system/views/mapapp/planning/README.md",
      "satisfied": true,
      "evidence": ".spec/design/system/views/mapapp/planning/README.md:5,30,36-38,83-84,112-113 document `mol-context-capsule --planning` plus the 1400ms loop and breathing constants.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "e487727527820d88e1e0588bb261bdd33437bd01",
      "maps_to_ac": null
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN ROADMAP Sprint 08 row WHEN grepped THEN no legacy labels; canonical names appear",
      "verify": "! grep -i -E 'cancel-confirm-with-prior-chat|single-candidate-warning|slow-apology' .spec/prds/v3-integration/ROADMAP.md",
      "satisfied": true,
      "evidence": ".spec/prds/v3-integration/ROADMAP.md:481,488 use the canonical planning variant names, and `rg -n -i 'cancel-confirm-with-prior-chat|single-candidate-warning|slow-apology' .spec/prds/v3-integration/ROADMAP.md` returned no matches.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "e487727527820d88e1e0588bb261bdd33437bd01",
      "maps_to_ac": null
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "GIVEN annotations.json files WHEN listed THEN one per canonical variant + name fields match canonical labels",
      "verify": "ls .spec/design/system/refs/planning-screen/*.annotations.json | wc -l",
      "satisfied": true,
      "evidence": "`ls .spec/design/system/refs/planning-screen/*.annotations.json | wc -l` returned `7`; `scripts/design-review/extract-annotations.ts:44-58,198-200` map the primary planning component name to the canonical state slug; `.spec/design/system/refs/planning-screen/scouting.annotations.json:11` and `cancel-prompt.annotations.json:11` contain canonical `name` values.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "e487727527820d88e1e0588bb261bdd33437bd01",
      "maps_to_ac": null
    },
    {
      "id": "AC-7",
      "type": "acceptance_criterion",
      "description": "GIVEN working tree after task WHEN git diff inspected THEN no production code paths modified (ios/android/server/react-native/tokens)",
      "verify": "! git diff --name-only HEAD | grep -E '^(ios|android|server|react-native|tokens)/'",
      "satisfied": true,
      "evidence": "`git diff --name-only d9860993f1dfdf8847cb23cb2208d4ea80b265b4..16f27000932c353a321f23b9545eeccbdaba17f3` only touches `.spec/design/system/**`, `.spec/prds/v3-integration/ROADMAP.md`, and `scripts/design-review/extract-annotations.ts`; `git diff --name-only HEAD` is empty.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "e487727527820d88e1e0588bb261bdd33437bd01",
      "maps_to_ac": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "top-overlay slot contains mol-context-capsule --planning above mol-phase-indicator",
      "verify": "grep -A 30 'org-map-layer__top-overlay' .spec/design/system/views/mapapp/planning/planning-screen.html",
      "satisfied": true,
      "evidence": "`grep -A 30 'org-map-layer__top-overlay' .spec/design/system/views/mapapp/planning/planning-screen.html` shows `mol-context-capsule--planning` above `mol-phase-indicator` in each planning variant block.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "e487727527820d88e1e0588bb261bdd33437bd01",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "No legacy variant labels in HTML/README/ROADMAP",
      "verify": "! grep -i -E 'cancel-confirm-with-prior-chat|single-candidate-warning|slow-apology' .spec/design/system/views/mapapp/planning/README.md .spec/prds/v3-integration/ROADMAP.md",
      "satisfied": true,
      "evidence": "`! grep -i -E 'cancel-confirm-with-prior-chat|single-candidate-warning|slow-apology' .spec/design/system/views/mapapp/planning/README.md .spec/prds/v3-integration/ROADMAP.md` exited 0.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "e487727527820d88e1e0588bb261bdd33437bd01",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "pnpm design:references regenerates PNG set cleanly",
      "verify": "pnpm design:references --screens planning-screen",
      "satisfied": true,
      "evidence": "`pnpm design:references --screens planning-screen` exited 0 and regenerated the planning-screen reference set successfully.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "e487727527820d88e1e0588bb261bdd33437bd01",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "README documents composed layout + 1400ms motion constants",
      "verify": "grep -E 'mol-context-capsule.*--planning|1400ms' .spec/design/system/views/mapapp/planning/README.md",
      "satisfied": true,
      "evidence": "`grep -E 'mol-context-capsule.*--planning|1400ms' .spec/design/system/views/mapapp/planning/README.md` found the required layout and motion-constant lines.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "e487727527820d88e1e0588bb261bdd33437bd01",
      "maps_to_ac": "AC-4"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "ROADMAP Sprint 08 row uses canonical variant naming",
      "verify": "! grep -i -E 'cancel-confirm-with-prior-chat|single-candidate-warning|slow-apology' .spec/prds/v3-integration/ROADMAP.md",
      "satisfied": true,
      "evidence": "`! grep -i -E 'cancel-confirm-with-prior-chat|single-candidate-warning|slow-apology' .spec/prds/v3-integration/ROADMAP.md` exited 0.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "e487727527820d88e1e0588bb261bdd33437bd01",
      "maps_to_ac": "AC-5"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "annotations.json files exist per canonical variant",
      "verify": "ls .spec/design/system/refs/planning-screen/*.annotations.json | wc -l",
      "satisfied": true,
      "evidence": "`ls .spec/design/system/refs/planning-screen/*.annotations.json | wc -l` returned `7`.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "e487727527820d88e1e0588bb261bdd33437bd01",
      "maps_to_ac": "AC-6"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Diff is design-only (no production code touched)",
      "verify": "! git diff --name-only HEAD | grep -E '^(ios|android|server|react-native|tokens)/'",
      "satisfied": true,
      "evidence": "`! git diff --name-only d9860993f1dfdf8847cb23cb2208d4ea80b265b4..16f27000932c353a321f23b9545eeccbdaba17f3 | grep -E '^(ios|android|server|react-native|tokens)/'` exited 0, and `git diff --name-only HEAD` is empty.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "e487727527820d88e1e0588bb261bdd33437bd01",
      "maps_to_ac": "AC-7"
    }
  ]
}
-->
