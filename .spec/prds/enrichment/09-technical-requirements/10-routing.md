---
stability: CONSTITUTION
last_validated: 2026-07-10
prd_version: 1.0.0
---

# Routing & Views

## Principle

Route-vs-state discriminator: a new route ONLY at a product seam (whole frame composition
changes). Enrichment adds **content states to an existing view** — the frame (map +
scrolling detail body) is unchanged. **Zero new routes.**

## Route map delta (against the MVP route map, `prds/mvp/09-technical-requirements/09-routing.md`)

| Route | Path | Kind | States (delta) | Primary UCs (delta) | Enter when |
|---|---|---|---|---|---|
| Curated Route Detail | `app/(app)/curated-route/[id].tsx` | pushed stack route (existing) | **+`enriched`**, **+`enrichment-absent`** (covers not-generated / abstained / failed / fetch-error, single rider copy), **+combined-absence** (summary also missing) | +UC-WHY-01, +UC-WHY-02, +UC-WHY-03 | unchanged (chat card / map pin tap) |

## Route Delta — v1.0.0

| Route | NEW/CHANGED/DELETED | Detail | Discriminator rationale |
|---|---|---|---|
| Curated Route Detail | **CHANGED** | Gains the "Why ride it" section between Summary and Scores with enrichment content states; data arrives in the existing detail query (no new round-trip) | Not a seam — content states of the existing detail view, exactly mirroring how `hasSummary` and `weatherError` already govern the Summary and Conditions sections |

## Anti-proliferation check

`enriched` / `enrichment-absent` / `stale-serving-prior-text` differ only by content within
the same frame → STATES, not routes. No overlay, no navigation change, no new screen. The
operator surfaces (coverage report, couch sampling) are CLI/`npx convex run` artifacts —
deliberately NOT app routes in v1.

## UI-facing UC coverage

- UC-WHY-01 → Curated Route Detail / `enriched`
- UC-WHY-02 → Curated Route Detail / `enrichment-absent` + combined-absence
- UC-WHY-03 → Curated Route Detail / `enriched` (provenance caption; stale serves prior text invisibly)
- GEN/QUAL/LIFE UCs are operator/system-facing — no app routes (by design; see 04-api-design trust boundary).
