# E2E Coverage Matrix — UC × Journey × Tier

Per-PRD blocks; every UC must map to ≥1 journey or scenario, or appear in the gap report.
Format per `e2e-testing-rules` + `brain/docs/kanban/holdout-scenarios.md`.

## Route & Agent Quality (`.spec/prds/route-agent-quality/`, v2.0.0, 2026-07-10 — v1.0.0 was "Geometry Completion")

Journeys: `geo-rescue-waterfall-to-rider-ready` (J-GEO-1) ·
`geo-fail-closed-review-to-absence` (J-GEO-2) · `geo-rider-previews-recovered-route` (J-GEO-3)
· `agt-slc-ogden-honesty` (J-AGT-1, the founder's captured failure session) — all
`tier: visible`, in `.spec/scenarios/journeys/`.

| UC | Journey(s) | Per-UC scenarios (`.spec/scenarios/{UC}/`) | Tiers | Status |
|----|-----------|---------------------------------------------|-------|--------|
| UC-HYG-01 | — | core + edge + holdout | visible+holdout | ✅ covered (scenario-only; deterministic pass, no cross-UC arc needed) |
| UC-HYG-02 | J-GEO-1 | core + edge + holdout | visible+holdout | ✅ covered |
| UC-HYG-03 | — | core + edge + holdout | visible+holdout | ✅ covered (scenario-only) |
| UC-HYG-04 | — | core + edge + holdout | visible+holdout | ✅ covered (scenario-only) |
| UC-REC-01 | — | core + edge + holdout | visible+holdout | ✅ covered (scenario-only; $0 deterministic lever) |
| UC-REC-02 | J-GEO-1, J-GEO-2, J-GEO-3 | core + edge + holdout | visible+holdout | ✅ covered |
| UC-REC-03 | J-GEO-3 | core + edge + holdout | visible+holdout | ✅ covered |
| UC-REC-04 | J-GEO-1 | core + edge + holdout | visible+holdout | ✅ covered |
| UC-REC-05 | — | core + edge + holdout | visible+holdout | ✅ covered (scenario-only; founder-gated tail) |
| UC-VER-01 | J-GEO-1, J-GEO-2, J-GEO-3 | core + edge + holdout | visible+holdout | ✅ covered |
| UC-VER-02 | J-GEO-2 | core + edge + holdout | visible+holdout | ✅ covered |
| UC-VER-03 | — | core + edge + holdout | visible+holdout | ✅ covered (scenario-only; catalog-wide sweep) |
| UC-VER-04 | J-GEO-2 | core + edge + holdout | visible+holdout | ✅ covered |
| UC-VER-05 | J-GEO-1 | core + edge + holdout | visible+holdout | ✅ covered |
| UC-SURF-01 | J-GEO-1, J-GEO-3 | core + edge + holdout | visible+holdout | ✅ covered |
| UC-SURF-02 | J-GEO-1 | core + edge + holdout | visible+holdout | ✅ covered |
| UC-SURF-03 | J-GEO-3 | core + edge + holdout | visible+holdout | ✅ covered |
| UC-SURF-04 | J-GEO-2 | core + edge + holdout | visible+holdout | ✅ covered |
| UC-SURF-05 | J-GEO-3 | core + edge + holdout | visible+holdout | ✅ covered |
| UC-SURF-06 | J-GEO-3 | core + edge + holdout | visible+holdout | ✅ covered |
| UC-AGT-01 | J-AGT-1 | core + edge + holdout | visible+holdout | ✅ covered |
| UC-AGT-02 | J-AGT-1 | core + edge + holdout | visible+holdout | ✅ covered |
| UC-AGT-03 | J-AGT-1 | core + edge + holdout | visible+holdout | ✅ covered |
| UC-AGT-04 | J-AGT-1 | core + edge + holdout | visible+holdout | ✅ covered |
| UC-AGT-05 | J-AGT-1 | core + edge + holdout | visible+holdout | ✅ covered |

### Gap report (Route & Agent Quality)

- **No uncovered UCs.** 25/25 UCs carry a visible core scenario + ≥2 differently-framed
  holdouts; 19/25 additionally ride a cross-UC journey.
- UC-SURF-02/04 are double-anchored (geometry journeys + J-AGT-1) — intentional: they are
  the seam where the two halves meet.
- Scenario-only UCs (HYG-01/03/04, REC-01, REC-05, VER-03) are deterministic single-surface
  passes or founder-gated tails — acceptable per the single-UC rule; no journey spans them by
  design.
- Journey J-GEO-3 is the sprint-gate headline arc (rider-visible payoff); J-GEO-2 is the
  fail-closed integrity arc; J-AGT-1 is the agent-rebuild headline arc (the founder's real
  failed session replayed honest, with a RED baseline against the recorded v1 replies) —
  all must be stamped onto the sprints that deliver their UCs by `/kb-sprint-plan`.
- Note: sibling PRDs (mvp, enrichment) predate this matrix file; their blocks should be
  back-filled here on their next update rather than retro-authored now.

### Tier routing

- **visible** (core scenarios + 3 journeys) → sprint gates / implementer TDD contracts.
- **holdout** (edge + holdout scenarios) → reviewer/CI only; never shown to implementers
  (wall principle).
