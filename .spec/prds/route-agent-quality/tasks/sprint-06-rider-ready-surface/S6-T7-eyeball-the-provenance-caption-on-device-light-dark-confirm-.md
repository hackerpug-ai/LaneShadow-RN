# S6-T7 — Eyeball the provenance caption on device (light + dark); confirm it reads as context not alert

> Status: ✅ Completed
> Reviewer: Founder-Operator
> Completed: 2026-08-01T04:27:27Z
> Omission: Explicitly omitted by the Founder-Operator on 2026-07-31. This real-device human gate is waived for this sprint; no device pass is claimed.
> Red-hat finding: **S6-F5 (MEDIUM)** — accepted scope waiver for Sprint 06 closeout; subjective calm-vs-warning judgment remains unverified. Do **not** fabricate device evidence. Forward schedule before Sprint 07 depends on this surface (not an S6 gate re-open).
> Omission record: `.spec/orchestrate/orch-route-agent-quality-s06-rider-ready-surface-20260730T055327Z-codex-omission.json`
> Proposed By: `product-manager`

| Field | Value |
|---|---|
| TASK_ID | S6-T7 |
| SPRINT | [Sprint 06 — Rider-ready surface](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | `Founder-Operator` |
| ESTIMATE | 30 min |
| EFFORT | S |
| PRIORITY | P0 |
| PROPOSED_BY | `product-manager` |
| TDD_MODE | `skipped` |
| RED_GREEN_REQUIRED | no |
| CAPABILITIES | touches CAP-GEO-03 |
| DEPENDS_ON | S6-T3, S6-T4, S6-T5, S6-T6 |

RUNTIME_COMMANDS:
- typecheck: `pnpm type-check`
- lint: `pnpm lint`
- test: `pnpm test`

## BACKGROUND
On a real device running the post-Sprint-06 build against the REAL un-seeded post-Sprint-04 rider-ready catalog, the Founder-Operator performs the 7-step human gate from SPRINT.md: open an ai_reconstructed route detail and confirm the provenance caption reads as plain informational text with muted styling and no badge in BOTH light and dark; confirm a scraped_promoted route shows no caption; browse a thin region and confirm the honest 'no routes near you yet' state; confirm a saved non-ready route still opens its detail. Each step records a pass/fail verdict with a real screenshot.

## Omission record

This requirement was explicitly omitted by the Founder-Operator on 2026-07-31. The omission is a scope decision, not a human-test pass: the real-device screenshots and verdicts are intentionally not required for this sprint closeout. Automated implementation evidence remains owned by S6-T3, S6-T4, S6-T5, S6-T6, and S6-T8.

## 🚫 CRITICAL CONSTRAINTS (Never tier)
- **MUST** Run every step on the REAL un-seeded post-Sprint-04 rider-ready catalog — the live catalog a real rider would browse. The 'seed' is the catalog itself.
- **MUST** Capture a real on-device screenshot for each of the 7 steps and store it as that step's evidence artifact (Step 4 contributes TWO screenshots — light and dark).
- **MUST** Check the ai_reconstructed caption in BOTH light mode and dark mode; record a separate calm-vs-warning verdict for each theme.
- **MUST** Record an explicit pass/fail verdict for each of the 7 steps before the gate can be considered closed.
- **MUST** Confirm the literal caption copy 'Route line reconstructed from the ride description' character-for-character on the ai_reconstructed route.
- **MUST** Confirm the literal honest-absence copy 'no routes near you yet' character-for-character when browsing a thin region.
- **NEVER** Never use fixtures, seeded test data, mock routes, or a stub catalog — the human gate exists precisely to verify the real surface; a fixture invalidates the gate.
- **NEVER** Never close the gate with any step unrecorded or any screenshot missing.
- **NEVER** Never skip the dark-mode check — caption contrast must be verified in both themes, not just the founder's preferred theme.
- **NEVER** Never accept a paraphrase of the literal copy ('no routes here', 'come back later', 'line approximated from description') — synonyms FAIL the gate; the literal string is the spec.
- **STRICTLY** A single 'reads as a warning' observation on any ai_reconstructed or name_routed caption FAILS the entire gate — calm-context is a ship/no-ship invariant, not a polish nicety.
- **STRICTLY** A single badge, alert icon, exclamation mark, or red/amber/orange color on the caption FAILS the gate.
- **STRICTLY** If any scraped_promoted route shows ANY caption text, the gate FAILS — provenance silence for scraped lines is absolute.
- **STRICTLY** The gate is binary: either all 7 steps pass on the real device with screenshots, or the gate does not close. Partial pass is not a state.

## SPECIFICATION
**Objective:** On a real device running the post-Sprint-06 build against the REAL un-seeded post-Sprint-04 rider-ready catalog, the Founder-Operator performs the 7-step human gate from SPRINT.md: open an ai_reconstructed route detail and confirm the provenance caption reads as plain informational text with muted styling and no badge in BOTH light and dark; confirm a scraped_promoted route shows no caption; browse a thin region and confirm the honest 'no routes near you yet' state; confirm a saved non-ready route still opens its detail. Each step records a pass/fail verdict with a real screenshot.

**Success state:** All 7 human gate steps pass on the real device against the real catalog, each backed by a real screenshot and a recorded founder verdict. No caption reads as a warning in either theme. The scraped_promoted route is caption-silent. The thin region shows the literal honest-absence copy. The saved non-ready route opens its detail. The gate closes Sprint 06 and unblocks Sprint 07.

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR)
### AC-1 [PRIMARY] — AC-1

**Requirement:** GIVEN the real un-seeded post-Sprint-04 rider-ready catalog contains at least one ai_reconstructed route WHEN the founder opens its detail view on a real iOS device THEN the route name and reconstructed line are visible and the provenance caption is present with the exact ai_reconstructed copy

VERIFY: `Founder-Operator screenshot of an ai_reconstructed detail view captured on a real iOS device against the real catalog`

SCENARIO:
- `start_ref` seed_method: `recorded_external`
- ACTION (user): Open the LaneShadow app on a real iOS device against the real un-seeded post-Sprint-04 catalog (no fixtures) → From discovery or browse, tap a route whose geometryProvenance is 'ai_reconstructed' to open its detail view → Read the rendered caption text on the detail screen
- CASE 1 (`real-catalog`): MUST_OBSERVE ['detail view opens with route name visible (route name length >= 1 character)', 'caption text is exactly "Route line reconstructed from the ride description"', 'caption node is rendered exactly 1 time on the detail screen', 'plotted route line decodes to >= 2 points']; MUST_NOT_OBSERVE ['no caption node on the ai_reconstructed detail (caption node count == 0)', 'blocked or error screen preventing the detail view from opening (0 route elements rendered)', 'spinner state stuck with 0 route elements rendered']
- NEGATIVE_CONTROL (would_fail_if): ['the caption reads as a warning or alert rather than plain context', 'a fixture or seeded catalog is substituted for the real post-Sprint-04 catalog', 'the route line decodes to fewer than 2 points (a dot masquerading as a route)', 'the detail view is blocked or shows an error screen instead of opening']
- EVIDENCE: `screenshot` (required_capture=True)

### AC-2 — AC-2

**Requirement:** GIVEN the open ai_reconstructed detail view with caption present WHEN the founder reads the caption THEN it reads as plain informational context, not as an alert or warning

VERIFY: `Founder-Operator human-judgment screenshot of the ai_reconstructed caption reading as context`

SCENARIO:
- `start_ref` seed_method: `recorded_external`
- ACTION (user): With the ai_reconstructed detail view open, read the caption text aloud → Confirm the caption reads as calm informational context, not as an alert, warning, or error message
- CASE 1 (`real-catalog`): MUST_OBSERVE ['caption text contains the informational phrase "reconstructed from the ride description"', 'caption tone is declarative (1 statement, no exclamation)', 'caption has >= 1 character of body copy in a muted subtitle']; MUST_NOT_OBSERVE ['caption text containing "warning", "error", or "approximate"', 'caption rendered as a banner with a "warning" color or icon', 'caption phrased as an apology or failure notice (0 warning tokens)']
- NEGATIVE_CONTROL (would_fail_if): ['the caption reads as a warning', 'the caption uses alert/warning vocabulary or punctuation', 'the caption is phrased as a failure notice or apology', 'a fixture catalog is substituted for the real post-Sprint-04 catalog']
- EVIDENCE: `screenshot` (required_capture=True)

### AC-3 — AC-3

**Requirement:** GIVEN the open ai_reconstructed detail view WHEN the founder inspects the caption styling THEN the caption uses muted text color with no badge, icon, border, or warning affordance

VERIFY: `Founder-Operator screenshot showing muted caption styling with no badge/icon/border`

SCENARIO:
- `start_ref` seed_method: `recorded_external`
- ACTION (user): With the ai_reconstructed detail view open, inspect the caption's visual styling → Confirm the caption is muted text with no badge, icon, border, or warning affordance
- CASE 1 (`real-catalog`): MUST_OBSERVE ['caption rendered in a muted text color (>= 1 shade lighter than primary)', 'caption has 0 badges, 0 icons, 0 warning borders', 'caption font is body/subtitle weight (>= 1 step below route title)']; MUST_NOT_OBSERVE ['a badge or chip element (e.g. "ai") wrapping the caption', 'a warning icon (e.g. "triangle" or "exclamation") beside the caption', 'a warning-colored border or fill (0 warning colors)']
- NEGATIVE_CONTROL (would_fail_if): ['the caption is wrapped in a badge, chip, or bordered container', 'a warning icon or warning-color background is applied to the caption', 'the caption styling matches the warning/error text style instead of muted body text', 'dark mode is skipped in the styling check']
- EVIDENCE: `screenshot` (required_capture=True)

### AC-4 — AC-4

**Requirement:** GIVEN the open ai_reconstructed detail view WHEN the founder toggles the iOS device appearance between light and dark mode THEN the caption remains calm, muted, and readable in both modes

VERIFY: `Founder-Operator screenshots of the caption in BOTH light mode AND dark mode`

SCENARIO:
- `start_ref` seed_method: `recorded_external`
- ACTION (user): With the ai_reconstructed detail view open in light mode, capture a screenshot → Toggle the iOS device appearance to dark mode (Settings > Display & Brightness > Dark) → Re-open the same ai_reconstructed detail view and capture a second screenshot → Compare the 2 screenshots for consistent muted caption treatment
- CASE 1 (`real-catalog`): MUST_OBSERVE ['2 screenshots captured: 1 light + 1 dark', 'caption muted and readable in both modes (>= 1 contrast ratio)', 'caption copy identical across modes (same "reconstructed from the ride description" text)']; MUST_NOT_OBSERVE ['caption becomes a warning color in either mode (0 warning hues)', 'caption unreadable in dark mode (0 contrast failures)', 'only 1 mode captured (dark mode skipped)']
- NEGATIVE_CONTROL (would_fail_if): ['dark mode is skipped and only 1 screenshot is captured', 'the caption becomes a bright/warning color in dark mode', 'the caption text or styling differs between light and dark mode', 'a fixture catalog is substituted for the real post-Sprint-04 catalog']
- EVIDENCE: `screenshot` (required_capture=True)

### AC-5 — AC-5

**Requirement:** GIVEN the real catalog contains a scraped_promoted rider-ready route WHEN the founder opens its detail view THEN no provenance caption node is rendered

VERIFY: `Founder-Operator screenshot of a scraped_promoted detail view with no caption node`

SCENARIO:
- `start_ref` seed_method: `recorded_external`
- ACTION (user): On the real catalog, locate a route whose geometryProvenance is 'scraped_promoted' → Tap to open its detail view → Inspect the detail screen for any provenance caption node
- CASE 1 (`real-catalog`): MUST_OBSERVE ['detail view opens with route name visible (route name length >= 1 character)', 'caption node absent (caption node count == 0)', 'no caption text containing "reconstructed" or "routed" displayed']; MUST_NOT_OBSERVE ['any caption text (e.g. "reconstructed") rendered for the scraped_promoted row', 'an empty caption container or placeholder with 0 characters', 'a badge or chip (count > 0) where the caption would appear']
- NEGATIVE_CONTROL (would_fail_if): ['a caption is rendered for a scraped_promoted route (should be silent)', 'the caption shown is the ai_reconstructed copy on a promoted row', 'a fixture catalog is substituted for the real post-Sprint-04 catalog', 'the detail view fails to open']
- EVIDENCE: `screenshot` (required_capture=True)

### AC-6 — AC-6

**Requirement:** GIVEN the device is browsed near a thin-coverage region with 0 rider-ready routes WHEN the founder opens browse or discovery for that region THEN the literal 'no routes near you yet' empty state is shown, no fabricated '0mi' distance pills appear, and any fallback-to-national is labeled

VERIFY: `Founder-Operator screenshot of the thin-region browse state on the real catalog`

SCENARIO:
- `start_ref` seed_method: `recorded_external`
- ACTION (user): On the real catalog, set the device location or browse intent to a thin-coverage region (e.g. near Ogden/SLC) with 0 nearby rider-ready routes → Open browse or discovery for that region → Read the empty/fallback state and inspect any pill or card distances
- CASE 1 (`real-catalog`): MUST_OBSERVE ['literal "no routes near you yet" empty-state text present (character-for-character match)', 'no fabricated "0mi" pill distance (0 occurrences of "0mi")', 'fallback-to-national results preceded by a label such as "No routes nearby — here\'s our top-rated"']; MUST_NOT_OBSERVE ['a fabricated "0mi" distance label on any pill or card', 'a centroid dot or non-rider-ready row plotted as a route (0 dots-as-routes)', 'a silent fallback to national results with no label (0 unlabeled national rows)']
- NEGATIVE_CONTROL (would_fail_if): ['the empty state reads as an error rather than honest absence', 'a fabricated "0mi" distance label appears on any pill', 'the fallback-to-national results are presented without a leading label', 'a fixture or seeded catalog is substituted for the real post-Sprint-04 catalog']
- EVIDENCE: `screenshot` (required_capture=True)

### AC-7 — AC-7

**Requirement:** GIVEN the founder has a saved route that is non-rider-ready (quarantined, shadow-merged, or otherwise gate-excluded) WHEN the founder reopens it from the Saved library THEN the detail view opens with route name visible and no blocked or error screen

VERIFY: `Founder-Operator screenshot of a saved non-ready route reopening to its detail on the real catalog`

SCENARIO:
- `start_ref` seed_method: `recorded_external`
- ACTION (user): On the real catalog, ensure at least 1 saved route that is currently non-rider-ready (e.g. a quarantined or shadow-merged row) is in the founder's Saved library → Open the Saved library and tap that route → Observe whether the detail view opens
- CASE 1 (`real-catalog`): MUST_OBSERVE ['detail view opens with route name visible (route name length >= 1 character)', 'no blocked/error/gate-hidden state (0 blocked affordances)', 'un-recovered line shows the honest "Approximate location" state (not a fake line)']; MUST_NOT_OBSERVE ['a blocked or error screen preventing detail access (saved count must not drop to 0)', 'the saved route silently disappearing from the Saved library (saved count must not drop to 0)', 'a fabricated plotted line for an un-recovered route (0 fake lines)']
- NEGATIVE_CONTROL (would_fail_if): ['the saved non-ready route is hidden from the Saved library or its detail is blocked', 'a fake plotted line is rendered for an un-recovered centroid-only route', 'a fixture catalog is substituted for the real post-Sprint-04 catalog', 'the canonical redirect for a shadow-merged row fails to resolve']
- EVIDENCE: `screenshot` (required_capture=True)

## TEST CRITERIA
- **TC-1** (→ AC-1): Founder opens a real ai_reconstructed route detail on device and confirms the literal caption 'Route line reconstructed from the ride description' is present as informational text.
  - VERIFY: `Screenshot of the ai_reconstructed detail view + recorded verdict that the caption matches the literal copy character-for-character and reads as informational body text.`
- **TC-2** (→ AC-2): Founder confirms the caption has no warning language, no alert icon, no badge affordance.
  - VERIFY: `Recorded verdict on the AC-1 screenshot: caption contains no warning words, no exclamation mark, no alert/warning icon, no badge pill. A single warning affordance FAILS the gate.`
- **TC-3** (→ AC-3): Founder inspects the caption's visual styling and confirms muted body treatment with no elevated chrome.
  - VERIFY: `Recorded verdict: caption uses muted/secondary text color and body weight; no filled background pill, border, or elevated container — visually similar to helper/subtext elsewhere.`
- **TC-4** (→ AC-4): Founder toggles between light and dark mode on the same ai_reconstructed detail and confirms calm-context rendering in BOTH themes.
  - VERIFY: `Two screenshots — one light, one dark — both showing the caption; recorded verdict that neither theme introduces a warning affordance or contrast regression.`
- **TC-5** (→ AC-5): Founder opens a scraped_promoted route detail and confirms NO caption renders.
  - VERIFY: `Screenshot of the scraped_promoted detail view + recorded verdict that no caption text is present anywhere on the surface.`
- **TC-6** (→ AC-6): Founder browses a thin-coverage region and confirms the honest 'no routes near you yet' state with no centroid dots, no padded junk, no fabricated '0mi'.
  - VERIFY: `Screenshot of the thin-region browse view + recorded verdict that the literal honest-absence copy is present character-for-character and no centroid dots, padded junk, or '0mi' label appear.`
- **TC-7** (→ AC-7): Founder opens a saved non-rider-ready route from the library and confirms it still opens to detail with the honest approximate state.
  - VERIFY: `Screenshot of the saved non-ready route's detail view + recorded verdict that it opened (no gate block) and renders the 'Approximate location' state for any un-recovered line.`

## SCOPE (file-level write permissions)
**writeAllowed:**
**writeProhibited:**
- `No source code changes — this is a human verification gate, not an implementation task.`
- `No fixture files created or modified — the gate runs on the real catalog.`
- `No schema, migration, or seed-data changes.`
- `No automated test code written — the test IS the human observation on the real device.`

## READING LIST
- .spec/prds/route-agent-quality/07-uc-surf.md (UC-SURF-04, UC-SURF-05, UC-SURF-06)
- .spec/prds/route-agent-quality/tasks/sprint-06-rider-ready-surface/SPRINT.md (Human Testing Gate + 7 Test Steps — authoritative)

## DESIGN
- Reference: .spec/prds/route-agent-quality/tasks/sprint-06-rider-ready-surface/SPRINT.md
- The caption must read as calm context — the founder's first-impression gut-check IS the signal. If the founder's instinct is 'this feels like a warning,' the gate FAILS even if no literal warning affordance is present.
- Both light AND dark are required — a caption that reads as calm in light but feels off in dark fails the gate. Theme-switching must not introduce a warning affordance.
- Honesty is literal: the scraped_promoted silence and the 'no routes near you yet' copy are non-negotiable character-for-character. Paraphrases ('no routes here', 'come back later', 'line approximated from description') FAIL the gate.
- The gate is exercised on the same real surface a rider sees — no preview tooling, no Storybook isolation. The point is the in-app, in-catalog reading.

**Pattern:** human-eyeball-gate-on-real-catalog
- pattern_source: `SPRINT.md Human Testing Gate section (Sprint 06)`

**Anti-pattern:** automated-screenshot-diff-or-fixture-seeded-gate — automated visual diffs and fixtures cannot substitute for the founder's calm-vs-warning judgment on the real catalog.

## EVIDENCE / VERIFICATION GATES
- **Step 1 — Open an ai_reconstructed route detail on device** — `` → Detail view opens and the literal caption 'Route line reconstructed from the ride description' is visible.
- **Step 2 — Confirm the caption reads as plain informational text** — `` → Caption reads as calm informational context — no warning words, no exclamation, no alert icon.
- **Step 3 — Confirm muted styling with no badge or warning affordance** — `` → Caption uses muted/secondary text styling; no filled pill, border, or elevated container.
- **Step 4 — Check the caption in BOTH light and dark mode** — `` → Two screenshots (light + dark); caption reads as calm context in BOTH with no contrast regression.
- **Step 5 — Confirm a scraped_promoted route shows no caption** — `` → scraped_promoted detail view has no caption text present anywhere on the surface.
- **Step 6 — Browse a thin region; confirm the honest 'no routes near you yet' state** — `` → Literal 'no routes near you yet' copy present character-for-character; no centroid dots, no padded junk, no fabricated '0mi'.
- **Step 7 — Confirm a saved non-ready route still opens its detail** — `` → Saved non-ready route opens to detail (no gate block); renders the honest 'Approximate location' state for any un-recovered line.
- **Founder records pass/fail per step with screenshots on the real catalog** — `` → all 7 steps pass on real device

## DEPENDENCIES
- Depends on: S6-T3, S6-T4, S6-T5, S6-T6

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S6-T7",
  "tdd_mode": "skipped",
  "verification_policy": {
    "requires_tests": false,
    "requires_red_evidence": false,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "real-catalog": {
      "description": "The real, un-seeded post-Sprint-04 rider-ready catalog browsed on a real iOS device. Fixtures/seeded data are FORBIDDEN \u2014 the founder observes the same live surface a rider sees.",
      "seed_method": "recorded_external",
      "records": [
        "real un-seeded post-Sprint-04 curated_routes catalog",
        "founder's real Saved library with at least one non-rider-ready saved route"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN the real un-seeded post-Sprint-04 rider-ready catalog contains at least one ai_reconstructed route WHEN the founder opens its detail view on a real iOS device THEN the route name and reconstructed line are visible and the provenance caption is present with the exact ai_reconstructed copy",
      "verify": "Founder-Operator screenshot of an ai_reconstructed detail view captured on a real iOS device against the real catalog",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "ios-device-human-gate",
        "negative_control": {
          "would_fail_if": [
            "the caption reads as a warning or alert rather than plain context",
            "a fixture or seeded catalog is substituted for the real post-Sprint-04 catalog",
            "the route line decodes to fewer than 2 points (a dot masquerading as a route)",
            "the detail view is blocked or shows an error screen instead of opening",
            "mocked/stubbed or empty-start path still passes (test is fakeable)",
            "empty/stub/mock path still passes"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot"
        },
        "cases": [
          {
            "start_ref": "real-catalog",
            "action": {
              "actor": "user",
              "steps": [
                "Open the LaneShadow app on a real iOS device against the real un-seeded post-Sprint-04 catalog",
                "Tap a route whose geometryProvenance is 'ai_reconstructed' to open its detail view",
                "Read the rendered caption text"
              ]
            },
            "end_state": {
              "must_observe": [
                "detail view opens with route name visible (route name length >= 1 character)",
                "caption text is exactly \"Route line reconstructed from the ride description\"",
                "caption node is rendered exactly 1 time on the detail screen",
                "plotted route line decodes to >= 2 points"
              ],
              "must_not_observe": [
                "no caption node on the ai_reconstructed detail (caption node count == 0)",
                "blocked or error screen preventing the detail view from opening (0 route elements rendered)",
                "spinner state stuck with 0 route elements rendered"
              ]
            },
            "seed_method": "recorded_external"
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the open ai_reconstructed detail view with caption present WHEN the founder reads the caption THEN it reads as plain informational context, not as an alert or warning",
      "verify": "Founder-Operator human-judgment screenshot of the ai_reconstructed caption reading as context",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "ios-device-human-gate",
        "negative_control": {
          "would_fail_if": [
            "the caption reads as a warning",
            "the caption uses alert/warning vocabulary or punctuation",
            "the caption is phrased as a failure notice or apology",
            "a fixture catalog is substituted for the real post-Sprint-04 catalog",
            "mocked/stubbed or empty-start path still passes (test is fakeable)",
            "empty/stub/mock path still passes"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot"
        },
        "cases": [
          {
            "start_ref": "real-catalog",
            "action": {
              "actor": "user",
              "steps": [
                "With the ai_reconstructed detail view open, read the caption text",
                "Judge whether the caption reads as plain informational context"
              ]
            },
            "end_state": {
              "must_observe": [
                "caption text contains the informational phrase \"reconstructed from the ride description\"",
                "caption tone is declarative (1 statement, no exclamation)",
                "caption has >= 1 character of body copy in a muted subtitle"
              ],
              "must_not_observe": [
                "caption text containing \"warning\", \"error\", or \"approximate\"",
                "caption rendered as a banner with a \"warning\" color or icon",
                "caption phrased as an apology or failure notice (0 warning tokens)"
              ]
            },
            "seed_method": "recorded_external"
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the open ai_reconstructed detail view WHEN the founder inspects the caption styling THEN the caption uses muted text color with no badge, icon, border, or warning affordance",
      "verify": "Founder-Operator screenshot showing muted caption styling with no badge/icon/border",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "ios-device-human-gate",
        "negative_control": {
          "would_fail_if": [
            "the caption is wrapped in a badge, chip, or bordered container",
            "a warning icon or warning-color background is applied to the caption",
            "the caption styling matches the warning/error text style instead of muted body text",
            "dark mode is skipped in the styling check",
            "mocked/stubbed or empty-start path still passes (test is fakeable)",
            "empty/stub/mock path still passes"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot"
        },
        "cases": [
          {
            "start_ref": "real-catalog",
            "action": {
              "actor": "user",
              "steps": [
                "With the ai_reconstructed detail view open, inspect the caption styling",
                "Verify the caption is muted body text with no badge/icon/border"
              ]
            },
            "end_state": {
              "must_observe": [
                "caption rendered in a muted text color (>= 1 shade lighter than primary)",
                "caption has 0 badges, 0 icons, 0 warning borders",
                "caption font is body/subtitle weight (>= 1 step below route title)"
              ],
              "must_not_observe": [
                "a badge or chip element (e.g. \"ai\") wrapping the caption",
                "a warning icon (e.g. \"triangle\" or \"exclamation\") beside the caption",
                "a warning-colored border or fill (0 warning colors)"
              ]
            },
            "seed_method": "recorded_external"
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the open ai_reconstructed detail view WHEN the founder toggles the iOS device appearance between light and dark mode THEN the caption remains calm, muted, and readable in both modes",
      "verify": "Founder-Operator screenshots of the caption in BOTH light mode AND dark mode",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "ios-device-human-gate",
        "negative_control": {
          "would_fail_if": [
            "dark mode is skipped and only 1 screenshot is captured",
            "the caption becomes a bright/warning color in dark mode",
            "the caption text or styling differs between light and dark mode",
            "a fixture catalog is substituted for the real post-Sprint-04 catalog",
            "mocked/stubbed or empty-start path still passes (test is fakeable)",
            "empty/stub/mock path still passes"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot"
        },
        "cases": [
          {
            "start_ref": "real-catalog",
            "action": {
              "actor": "user",
              "steps": [
                "Capture the ai_reconstructed caption screenshot in light mode",
                "Toggle iOS appearance to dark mode",
                "Re-open the same detail and capture a dark-mode screenshot",
                "Compare both screenshots"
              ]
            },
            "end_state": {
              "must_observe": [
                "2 screenshots captured: 1 light + 1 dark",
                "caption muted and readable in both modes (>= 1 contrast ratio)",
                "caption copy identical across modes (same \"reconstructed from the ride description\" text)"
              ],
              "must_not_observe": [
                "caption becomes a warning color in either mode (0 warning hues)",
                "caption unreadable in dark mode (0 contrast failures)",
                "only 1 mode captured (dark mode skipped)"
              ]
            },
            "seed_method": "recorded_external"
          }
        ]
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the real catalog contains a scraped_promoted rider-ready route WHEN the founder opens its detail view THEN no provenance caption node is rendered",
      "verify": "Founder-Operator screenshot of a scraped_promoted detail view with no caption node",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "ios-device-human-gate",
        "negative_control": {
          "would_fail_if": [
            "a caption is rendered for a scraped_promoted route (should be silent)",
            "the caption shown is the ai_reconstructed copy on a promoted row",
            "a fixture catalog is substituted for the real post-Sprint-04 catalog",
            "the detail view fails to open",
            "mocked/stubbed or empty-start path still passes (test is fakeable)",
            "empty/stub/mock path still passes"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot"
        },
        "cases": [
          {
            "start_ref": "real-catalog",
            "action": {
              "actor": "user",
              "steps": [
                "Locate a scraped_promoted route on the real catalog",
                "Tap to open its detail view",
                "Inspect for any provenance caption"
              ]
            },
            "end_state": {
              "must_observe": [
                "detail view opens with route name visible (route name length >= 1 character)",
                "caption node absent (caption node count == 0)",
                "no caption text containing \"reconstructed\" or \"routed\" displayed"
              ],
              "must_not_observe": [
                "any caption text (e.g. \"reconstructed\") rendered for the scraped_promoted row",
                "an empty caption container or placeholder with 0 characters",
                "a badge or chip (count > 0) where the caption would appear"
              ]
            },
            "seed_method": "recorded_external"
          }
        ]
      }
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the device is browsed near a thin-coverage region with 0 rider-ready routes WHEN the founder opens browse or discovery for that region THEN the literal 'no routes near you yet' empty state is shown, no fabricated '0mi' distance pills appear, and any fallback-to-national is labeled",
      "verify": "Founder-Operator screenshot of the thin-region browse state on the real catalog",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "ios-device-human-gate",
        "negative_control": {
          "would_fail_if": [
            "the empty state reads as an error rather than honest absence",
            "a fabricated \"0mi\" distance label appears on any pill",
            "the fallback-to-national results are presented without a leading label",
            "a fixture or seeded catalog is substituted for the real post-Sprint-04 catalog",
            "empty/stub/mock path still passes"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot"
        },
        "cases": [
          {
            "start_ref": "real-catalog",
            "action": {
              "actor": "user",
              "steps": [
                "Browse to a thin-coverage region with 0 nearby rider-ready routes",
                "Open browse/discovery for that region",
                "Read the empty/fallback state and any pill distances"
              ]
            },
            "end_state": {
              "must_observe": [
                "literal \"no routes near you yet\" empty-state text present (character-for-character match)",
                "no fabricated \"0mi\" pill distance (0 occurrences of \"0mi\")",
                "fallback-to-national results preceded by a label such as \"No routes nearby \u2014 here's our top-rated\""
              ],
              "must_not_observe": [
                "a fabricated \"0mi\" distance label on any pill or card",
                "a centroid dot or non-rider-ready row plotted as a route (0 dots-as-routes)",
                "a silent fallback to national results with no label (0 unlabeled national rows)"
              ]
            },
            "seed_method": "recorded_external"
          }
        ]
      }
    },
    {
      "id": "AC-7",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the founder has a saved route that is non-rider-ready (quarantined, shadow-merged, or otherwise gate-excluded) WHEN the founder reopens it from the Saved library THEN the detail view opens with route name visible and no blocked or error screen",
      "verify": "Founder-Operator screenshot of a saved non-ready route reopening to its detail on the real catalog",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "e2e",
        "verification_service": "ios-device-human-gate",
        "negative_control": {
          "would_fail_if": [
            "the saved non-ready route is hidden from the Saved library or its detail is blocked",
            "a fake plotted line is rendered for an un-recovered centroid-only route",
            "a fixture catalog is substituted for the real post-Sprint-04 catalog",
            "the canonical redirect for a shadow-merged row fails to resolve",
            "mocked/stubbed empty response still passes (test is fakeable)"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot"
        },
        "cases": [
          {
            "start_ref": "real-catalog",
            "action": {
              "actor": "user",
              "steps": [
                "Ensure a saved non-rider-ready route exists in the Saved library on the real catalog",
                "Open Saved and tap that route",
                "Observe whether detail opens"
              ]
            },
            "end_state": {
              "must_observe": [
                "detail view opens with route name visible (route name length >= 1 character)",
                "no blocked/error/gate-hidden state (0 blocked affordances)",
                "un-recovered line shows the honest \"Approximate location\" state (not a fake line)"
              ],
              "must_not_observe": [
                "a blocked or error screen preventing detail access (saved count must not drop to 0)",
                "the saved route silently disappearing from the Saved library (saved count must not drop to 0)",
                "a fabricated plotted line for an un-recovered route (0 fake lines)"
              ]
            },
            "seed_method": "recorded_external"
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Founder opens a real ai_reconstructed route detail on device and confirms the literal caption 'Route line reconstructed from the ride description' is present as informational text.",
      "verify": "Screenshot of the ai_reconstructed detail view + recorded verdict that the caption matches the literal copy character-for-character and reads as informational body text.",
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
      "description": "Founder confirms the caption has no warning language, no alert icon, no badge affordance.",
      "verify": "Recorded verdict on the AC-1 screenshot: caption contains no warning words, no exclamation mark, no alert/warning icon, no badge pill. A single warning affordance FAILS the gate.",
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
      "description": "Founder inspects the caption's visual styling and confirms muted body treatment with no elevated chrome.",
      "verify": "Recorded verdict: caption uses muted/secondary text color and body weight; no filled background pill, border, or elevated container \u2014 visually similar to helper/subtext elsewhere.",
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
      "description": "Founder toggles between light and dark mode on the same ai_reconstructed detail and confirms calm-context rendering in BOTH themes.",
      "verify": "Two screenshots \u2014 one light, one dark \u2014 both showing the caption; recorded verdict that neither theme introduces a warning affordance or contrast regression.",
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
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Founder opens a scraped_promoted route detail and confirms NO caption renders.",
      "verify": "Screenshot of the scraped_promoted detail view + recorded verdict that no caption text is present anywhere on the surface.",
      "maps_to_ac": "AC-5",
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
                "exercise TC-5"
              ]
            },
            "end_state": {
              "must_observe": [
                "TC-5 result count >= 1"
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
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Founder browses a thin-coverage region and confirms the honest 'no routes near you yet' state with no centroid dots, no padded junk, no fabricated '0mi'.",
      "verify": "Screenshot of the thin-region browse view + recorded verdict that the literal honest-absence copy is present character-for-character and no centroid dots, padded junk, or '0mi' label appear.",
      "maps_to_ac": "AC-6",
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
                "exercise TC-6"
              ]
            },
            "end_state": {
              "must_observe": [
                "TC-6 result count >= 1"
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
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Founder opens a saved non-rider-ready route from the library and confirms it still opens to detail with the honest approximate state.",
      "verify": "Screenshot of the saved non-ready route's detail view + recorded verdict that it opened (no gate block) and renders the 'Approximate location' state for any un-recovered line.",
      "maps_to_ac": "AC-7",
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
                "exercise TC-7"
              ]
            },
            "end_state": {
              "must_observe": [
                "TC-7 result count >= 1"
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
