# Sprint 2 — Route Detail + Close the Loop — UI/UX Review

**Sprint:** sprint-02-route-detail-close-the-loop
**Run date:** 2026-07-06
**Capture backend:** Maestro 2.6.1 on iPhone 17 Pro (iOS 26.5), real Convex dev
**Themes:** light, dark
**Captures:** 14 screenshots, all distinct (md5 audit passed)

**Aggregate scores** (frontend-designer + orchestrator direct inspection):

| Axis | Score |
|------|------:|
| Fidelity (spec match) | **3.7 / 5** |
| Instinct (design feel) | **3.9 / 5** |
| Consistency (parity, no broken invariants) | **3.2 / 5** |

---

## Systemic Themes

### Theme 1 — Map lifecycle / render: the hero element is fragile (HIGH)

**Affects:** F1, F2, F3, F4 · **Blast radius:** 3 of 9 surfaces

The curated route detail screen is supposed to lead with a map, but on every polyline-bearing route the map either (a) fails to paint tiles on cold load, (b) renders tiles but omits the copper polyline, or (c) renders the wrong centroid marker (the default SDK user-location puck instead of the DESIGN-003 copper pin).

The only branch that renders correctly is the no-polyline branch (Blue Ridge Overlook) — and it is the gold standard of the run.

**Single fix vector:** the geometry branch in `app/(app)/curated-route/[id].tsx` needs lifecycle hardening (wait for `onMapLoaded`), explicit polyline child render, and a copper Marker asset (not the SDK puck). The DESIGN-003 AC-1 path is the one that needs attention — AC-2 (no-polyline) is already correct.

---

### Theme 2 — Brand consistency: copper is the dominant accent but two surfaces leak (MED)

**Affects:** F5 (refresh banner) · **Blast radius:** 1 of 9 surfaces

The home / plan view establishes copper as the brand accent system: copper target compass, copper route polylines, copper wrench, copper "Drawing the map" pill. Then a single off-brand element slips in: the pull-to-refresh banner is system blue. The score bars, archetype badges, action buttons, and most markers are all on-brand — but that one banner is visually loud enough to read as a different product on first glance.

**Single fix vector:** theme the RN RefreshControl to `colors={[copper-500(#EE7C2B)]}` + `tintColor={copper-500}`.

---

### Theme 3 — Save flow: known identifier reconciliation regression (MED)

**Affects:** F6 · **Blast radius:** 1 of 9 surfaces

Tapping the Save button in this run did not transition to the "Saved" state — the button remained in the copper "Save" idle state after the tap and 15s wait. The `app/(app)/curated-route/[id].tsx:235-238` hook signature threads `detail._id` (which DATA-006 does NOT return), with a `?? ''` fallback. Per the in-source `IDENTIFIER RECONCILIATION` comment, the live save needs `_id` resolution that the read path doesn't expose. The gate run reports step 5 PASSED — so this is a fresh regression or state-dependent flakiness. Either DATA-006 should return `_id` (per FU-2 the validator includes it but the React hook uses it inconsistently), or the mutation should resolve `_id` server-side from `routeId`.

This is a known-suspect area — fix it before any new feature lands on top of `useSaveCuratedRoute`.

---

## Per-Unit Findings

### curated-detail-polyline-top (Wasatch Ridge Traverse)
- **Scores:** fidelity 2 · instinct 3 · consistency 2
- **F1 (HIGH)** — Map tiles don't paint on cold load; hero element blank. Dark theme has the same symptom, so not a theme bug.
- **F4 (MED)** — Centroid marker is the default blue puck, not the copper pin required by DESIGN-003.

### curated-detail-polyline-scores
- **Scores:** fidelity 4 · instinct 4 · consistency 4
- No HIGH issues. Score bars look correct, % readouts are right-aligned, copper-500 fill on near-black track reads well in both themes.
- **F8 (LOW)** — DESIGN-001 spec self-contradicts (74% vs 90%); visually the scenic bar at 90% is correct.

### curated-detail-polyline-actions
- **Scores:** fidelity 4 · instinct 4 · consistency 4
- Save (copper filled) + Ride It (outline) — visual distinction is clear, 44pt min height satisfied. No HIGH issues.
- The saved success state (✓ Saved + Badge) was not captured — see Theme 3 / F6.

### curated-detail-no-polyline-top (Blue Ridge Overlook)
- **Scores:** fidelity 5 · instinct 5 · consistency 4
- **This is the gold-standard surface.** Real tiles (Billy Graham Fwy, Tunnel Rd labels), copper centroid pin, italic "No description yet", "Scenic" badge, 72/100, all 5 score bars. Use this as the visual target when fixing Theme 1.

### curated-detail-no-polyline-scrolled
- **Scores:** fidelity 4 · instinct 4 · consistency 4
- "Approximate location" badge visible at lower-left of map; outline variant per DESIGN-003. Scores + conditions + actions all reachable after scroll, in scroll body (not pinned — AC-3 satisfied).

### curated-detail-save-idle
- **Scores:** fidelity 4 · instinct 5 · consistency 3
- Button visual states are correct (filled primary vs outline), but the saved state never renders (see F6 / Theme 3).
- **F7 (LOW)** — No dark variant captured.

### plan-home
- **Scores:** fidelity 5 · instinct 5 · consistency 4
- Brand identity is strongest here: copper target compass, copper dashed route polylines, copper wrench, copper "Drawing the map" pill. Use as the brand-accent reference for F5.
- **F7 (LOW)** — No dark variant captured.

### plan-suggestions
- **Scores:** fidelity 3 · instinct 2 · consistency 2
- **F5 (MED)** — System-blue "Refreshing..." banner is the only off-brand accent in the entire capture set.
- **F7 (LOW)** — No dark variant captured.

### plan-card-tap-detail (Cherohala Skyway)
- **Scores:** fidelity 2 · instinct 3 · consistency 2
- **F2 (HIGH)** — Tiles render, but no copper polyline is visible. Distinct from F1 (different root cause).
- **F3 (MED)** — No "Approximate location" badge either — geometry-degradation invariant broken.
- **F4 (MED)** — Centroid renders as default blue puck, not copper pin.
- **F7 (LOW)** — No dark variant captured.

---

## Strengths (worth preserving)

1. The no-polyline branch (Blue Ridge Overlook) is the gold-standard — it nails the spec and the brand in one screen.
2. ScoreDimensionBar primitive is well-executed: copper fill, dark track, right-aligned %, sufficient row height, dark-mode parity is clean.
3. Dark theme is genuinely considered — not just inverted. Badge backgrounds, button outlines, score-bar tracks all read correctly.
4. Info hierarchy on the detail screen is clean — eye lands on composite score, then bars, then actions. The 40/60 map-vs-body split matches DESIGN-002.
5. The "No description yet" italic muted placeholder handles the empty state gracefully — no blank gap.
6. "Approximate location" badge is rendered as outline (not filled) — semantically correct ("approximate", not "highlighted").

---

## Next Steps

Run `/review-ui --polish --sprint sprint-02-route-detail-close-the-loop` to address findings one at a time. The recommended fix order:

1. **F6 (Save state never resolves)** — high-priority, blocks any Save-related UX polish. Likely a Convex read-path fix.
2. **F1 + F2 + F3 + F4 (Map lifecycle & geometry branch)** — tackle together as one Theme 1 fix; the geometry branch in `[id].tsx` needs a lifecycle + polyline + Marker rework.
3. **F5 (Refresh banner)** — single-line theme change; tiny diff, high visual payoff.
4. **F7 (Dark coverage gap)** — capture pass extension; no code change.
5. **F8 (DESIGN-001 spec contradiction)** — planner cleanup, not blocking.

See `findings.json` and `remediation.json` for the machine-readable state.
