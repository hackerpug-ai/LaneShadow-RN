---
stability: PRODUCT_CONTEXT
last_validated: 2026-06-15
prd_version: 3.0.0
prd_scope: post-mvp-forward-looking
holocron_id: js77v8w2833z10g8xbg6nh9gah88rr10
---

# Post-MVP Opportunities — Where AI Extends the Rider Experience

> **⚠️ This document changes NO MVP scope.** Every item here is **post-MVP**. The Discovery-MVP remains exactly as specified at **v3.0.0** (see [01-scope.md](./01-scope.md)). This is a forward-looking opportunity log — a place to capture *why* these bets matter and *what* they would add — so the team can build past the MVP without re-deriving the rationale. Nothing here is committed, sequenced, or AC-bearing.

## What this is

A distillation of **rider-voice research** (Reddit + cruiser/touring forums, 2026-06-15) layered on LaneShadow's own prior research. It answers the question: *once the MVP ships discovery, where does AI most extend the motorcycle rider experience?* The headline bets are **Butler-grade "why this road is good" enrichment** and **weather-window intelligence** — both already deferred in [01-scope.md](./01-scope.md), now documented with the evidence behind them.

This complements, and does not replace, [PRODUCT-STRATEGY.md](../../PRODUCT-STRATEGY.md) (the canonical phased roadmap). It maps the strategy's later phases to *rider-validated* opportunity, and grounds the durable purpose written in [WHY.md](../../WHY.md).

**Evidence base:**
- Reddit/forum deep research → holocron `js77v8w2833z10g8xbg6nh9gah88rr10`
- [waypoint-demand/03-findings.md](../../research/waypoint-demand/03-findings.md) + [05-rider-lexicon.md](../../research/waypoint-demand/05-rider-lexicon.md) — riders mention stops/waypoints in 78–100% of ride-discovery posts
- [REVENUE-VALIDATION.md](../../research/REVENUE-VALIDATION.md) — NL planning is commoditizing; per-segment weather is the moat
- [voice-jtbd-analysis.md](../../artifacts/team-product/voice-jtbd-analysis.md) — the in-ride voice arc

## The opportunity stack (ranked by rider evidence)

The four are **not peers — they stack**: the curated catalog made trustworthy (enrichment) is the substrate → weather is the strongest standalone pain and the competitive moat → composition is the format riders actually think in → personalization compounds all three once usage data exists.

| # | Opportunity | Rider-evidence strength | Maps to strategy |
|---|---|---|---|
| **O1** | Butler-grade "why this road is good" enrichment | HIGH | "Rich enrichment" + scoring calibration |
| **O2** | Weather-window intelligence | HIGH (+ moat) | Pillar 3 / Phase 2 |
| **O3** | Ride/loop composition over curated roads + waypoints | MEDIUM-HIGH (but commoditized at the base) | Pillar 1 + Phase 0.5 (waypoints) |
| **O4** | Personalized ranking | MEDIUM/LOW (latent; retention) | Pillar 4 / Phase 4 |

---

### O1 — Butler-grade "why this road is good" enrichment

- **What it is:** Generate the headline + the "why" for each curated route — AI vision over Street View/satellite + an LLM over geometry, elevation, and surrounding POIs — to replace the verified-empty `curated_route_enrichments`. The detail view stops being a name + a dot + bare numbers and starts explaining *why a road is worth riding*, the way an expert-curated map does.
- **Rider evidence:** Riders pay for and revere **Butler Maps** — *graded* (G1/G2) paper maps of good motorcycle roads. *"Butler's G1 maps are amazing — great pavement, fantastic corners, stupid-gorgeous views."* *"Once you get into riding you look at maps differently."* The discovery search in existing apps is described as *"remarkably barren."* Competitive fact: **Rever already bundles Butler as a paid add-on** — so a static overlay is table stakes.
- **Why it's out of the MVP:** `curated_route_enrichments` is EMPTY (0 docs); ~32% of routes lack even a summary. The MVP honestly ships *lean* detail (scores as bars + centroid/polyline + basic weather) rather than fake richness.
- **What it would add:** The single biggest fix to the MVP's weakest step ("see *why* it's good"). A cheap, batchable content generation pass.
- **Dependencies:** curated catalog (exists); a generation pipeline (Haiku/vision, prompt-cached); a quality gate so generated "why" is trustworthy, not hallucinated.
- **Must clear:** beat a static Butler overlay via *dynamic/local/fresh* enrichment, not just prose over the same data.
- **Rough gate-test:** open a route that today shows only a name + centroid → see a trustworthy one-paragraph "why," grounded in real road attributes, that a rider who knows the road agrees with.

### O2 — Weather-window intelligence

- **What it is:** Move from "basic current conditions" to a personalized, route- and elevation-aware answer to *"is it worth riding, and where, this weekend?"* — including micro-climate awareness (a mountain pass is colder and fogged when the valley forecast says clear).
- **Rider evidence:** Go/no-go is a recurring, emotional, **personal-threshold** decision: *"30% chance of rain is my threshold."* *"<41°F in the morning and I'll park it."* *"If there are several days of rain along my route, I'll change plans and detour around it."* A long-standing plea: *"an app that makes it easy to tell if I should ride today — let me set my own thresholds."* [REVENUE-VALIDATION.md](../../research/REVENUE-VALIDATION.md) names per-segment weather the moat *"no competitor can match."*
- **Why it's out of the MVP:** the MVP intentionally shows only basic current conditions for the route centroid; weather intelligence is its own build (forecast fusion, elevation, scheduling) and a separate strategy phase.
- **What it would add:** the literal "Ride the Moment" payoff and the clearest competitive moat. Possibly closer to the *actual wedge* than its Phase-2 position implies.
- **Dependencies:** a forecast provider with hourly + elevation granularity; per-rider thresholds; the curated catalog for "where."
- **Rough gate-test:** Friday evening → "best 3-hour window + best road for it this weekend near me," honoring my personal rain/temp/wind thresholds, correct about a mountain road being colder/wetter than the valley.

### O3 — Ride/loop composition over the curated catalog + waypoints

- **What it is:** Compose a *ride*, not retrieve a *road*: "a 3-hour scenic loop from home with a coffee stop." Natural-language constraints → a loop over known-good curated roads + curated waypoint stops, timed to the rider's window, starting and ending where they are.
- **Rider evidence:** A rider literally requested this on the Kurviger forum (2026): *"select start/end + desired distance → auto-generate a scenic round trip… optionally include scenic viewpoints, coffee/lunch spots, biker cafés."* Ride-report culture is loops-with-stops ("lunch loop," "BBQ at the halfway point"); waypoint research shows stops are the *primary* subject of 78–100% of ride-discovery posts.
- **⚠️ Important caveat (why this is not a standalone moat):** **basic algorithmic loop-generation is already commoditized** — Calimoto, Scenic, Kurviger, Detecht all do "pick distance + direction → twisty loop," and it's *shallow*: *"Calimoto became insistent on routing through housing developments to create 'twisty' roads."* Differentiation comes **only** from composing over *known-good curated roads + curated stops + weather*, not from raw curvature optimization. Composition is the *delivery vehicle* for O1/O2, not a bet on its own.
- **Why it's out of the MVP:** the MVP plots single curated routes; composition needs the waypoint content type (strategy Phase 0.5) and the routing engine to assemble multi-road loops.
- **Dependencies:** waypoints (Phase 0.5); curated catalog; a composition/routing layer; ideally O2 (weather-timed) and O1 (why-rich stops).
- **Rough gate-test:** "3-hour scenic loop from here with a coffee stop" → a loop built from catalog-good roads + a real curated stop, not suburb-curves to hit a distance.

### O4 — Personalized ranking

- **What it is:** Learn from saves, ratings, and "rode-it" signals → re-rank the generic composite into "roads like the ones you loved."
- **Rider evidence:** **Thinnest direct demand** — riders rarely ask "learn my taste"; it's a builder's intuition, real but latent. A retention/compounding play, not an expressed pain.
- **Why it's out of the MVP (and out of early post-MVP):** needs usage data — saves/ratings — that does not exist pre-launch. Start collecting the signal first; build the ranker once there's something to learn from.
- **Dependencies:** the save/feedback loop (MVP starts it via `recordRouteFeedback`/`curatedRouteRef`), then volume.
- **Rough gate-test:** after N saves/ratings, a rider's top-ranked results visibly skew toward the archetypes/regions they've favored.

---

## Cross-cutting findings that should shape any post-MVP work

These came through the rider research strongly enough to constrain *how* any of the above is built:

- **"By a rider, for riders" is a positioning asset.** *"The people who make these apps don't seem to be riders"* is the #1 emotional complaint. LaneShadow's literal identity is the antidote — lean into it (see [WHY.md](../../WHY.md)).
- **Anti-forced-social — caution for the Community pillar.** Riders want *GPX-simple route sharing*, NOT a friend-graph or notifications: *"Riding apps aren't the place for chat and group features… I don't need to find riding buddies."* Build sharing, not a social network ([Pillar 5](../../PRODUCT-STRATEGY.md)).
- **Offline + battery are table-stakes pains.** *"It sucks your battery. Support told me to run in airplane mode."* Kurviger dying offline in the Alps. This *validates* the offline-first / on-device thesis — every opportunity above must fit that envelope.
- **Digital curated discovery is the open lane.** The real competition for "find a good road" is *paper Butler maps + Google-wander + local clubs*, because the apps' discovery is barren. The MVP aims at a genuine gap.
- **NL planning is commoditized** (ThrottleMap = GPT-4o, Komoot = ChatGPT). Correctly already demoted — not a differentiator. Don't reinvest there.

## Pointers

- Deferred-item list with one-line rationale: [01-scope.md → Out of Scope](./01-scope.md).
- Canonical phased roadmap: [PRODUCT-STRATEGY.md](../../PRODUCT-STRATEGY.md) (Pillars 1–5, Phases 0–5).
- Durable purpose: [WHY.md](../../WHY.md).
- Full research with quotes + confidence: holocron `js77v8w2833z10g8xbg6nh9gah88rr10`.
