---
stability: FEATURE_SPEC
last_validated: 2026-07-11
prd_version: 3.1.0
functional_group: AGT
---

# Use Cases: Agent Quality (AGT)

| ID | Title | Description |
|----|-------|-------------|
| UC-AGT-01 | Rebuild the conversation layer on Mastra | Smart loop + tools + memory on a Sonnet-class model; regex intent routing deleted |
| UC-AGT-02 | Ground discovery in the rider's location and intent | Center always resolved; duration and waypoint-stop intent honored; radius + nearest |
| UC-AGT-03 | Interrogate when intent is ambiguous | One targeted clarifying question instead of guessing or deflecting |
| UC-AGT-04 | Be honest about distance, thin data, and the weather | Real distances; no false proximity; weather go/no-go volunteered; custom-route fallback |
| UC-AGT-05 | Prove and observe agent behavior | Real failed transcripts become the eval suite; traces make failures debuggable |
| UC-AGT-06 | Shape replies to the rider | Simple-by-default depth, honest comfort labels, persistent constraints, saveable close (share-to-link deferred) |

> **Diagnosis this group answers (live transcripts + code, 2026-07-10):** the "discovery
> agent" was a regex keyword matcher (`buildDiscoveryIntentFromQuery`) with a one-city
> gazetteer (`asheville`) that never passed the rider's known location as `center` and
> hardcoded `sort:'best'` — so "scenic near SLC" became national-best (none near Utah →
> "I didn't find any") and "twisty near Ogden" became state-best (Capitol Reef at ~170 mi
> presented as "near Ogden"). The orchestrator's "high" model tier was gpt-4.1 as an
> emergency fallback from a budget model. The deterministic routing pipeline itself worked
> ("Slc to park city" compiled a real route) and is preserved as tools.
>
> **Persona grounding (v3.0.0):** ACs marked into UC-AGT-01/02/04/06 derive from
> `.spec/USER-PROFILES.md` — Mike (duration-expressed requests, weather-gated Saturday
> planning, "something new" vs his regulars), Terry (depth on request), Rachel (comfort
> labels that never oversell, one kind clarifying question), Sam (waypoint-anchored loops,
> shareable close), Val (persistent "no highways"). Cross-session growth memory (Rachel's
> season arc) stays explicitly DEFERRED in 01-scope.

---

## UC-AGT-01: Rebuild the conversation layer on Mastra

Replace the orchestrator dispatch layer and the regex discovery shim with a single
`@mastra/core` agent loop embedded in the existing Convex `'use node'` actions: one capable
model with real tools, in-session memory, and the deterministic routing pipeline preserved
as tools it calls. Provider/model selection stays behind the repo's model-tier indirection,
with a new Sonnet-class `orchestrator` tier.

Acceptance Criteria:
- ☐ Rider can complete discovery, routing, search, and enrichment requests through one Mastra agent loop that replaces the orchestrator dispatch and its sub-agent query-paraphrase hops.
- ☐ System deletes the regex intent builder (`buildDiscoveryIntentFromQuery`) and its hardcoded place gazetteer so no rider request is ever parsed by keyword matching.
- ☐ System preserves the deterministic route pipeline (geocode → sketch → compile) as agent tools, and "Slc to park city"-class requests keep working end to end.
- ☐ System resolves the conversation model through a new `orchestrator` tier in the model-tier map (Sonnet-class), with no provider or model literals outside the tier map.
- ☐ System persists in-session conversation memory (stated preferences, prior locations) through a Mastra memory adapter backed by the existing Convex session store, so "OK what's scenic" inherits the SLC context from the prior turn.
- ☐ System keeps deterministic guarantees outside the model: tool validators, budget tracking, rate limits, and the rider-ready read gate are code, not prompt instructions.
- ☐ Rider can ask for "something new" and get suggestions that exclude routes already in their saved library, and can ask "which of my saved rides fits" a constraint and get an answer grounded in their real saved-route data via the registered favorites tool.

---

## UC-AGT-02: Ground discovery in the rider's location and intent

Every discovery request resolves a real center — the session location the app already has,
or a geocoded place name from the request ("Ogden") — and searches by radius with
nearest-first ordering. The silent devolution to state-best or national-best is deleted.
Rider intent beyond location is honored too: ride length expressed as time, and rides
anchored on a stop (Sam's "loop with a great BBQ spot at the halfway point").

Acceptance Criteria:
- ☐ System resolves a center for every discovery request from the rider's session location or by geocoding a place named in the request before calling the curated-route search tool.
- ☐ Rider can ask for routes "near Ogden" and receive only routes whose distance from Ogden is within the search radius, nearest first.
- ☐ System geocodes arbitrary US place names for discovery using the same real geocoding capability the routing pipeline already uses, with no hardcoded city list.
- ☐ System never silently substitutes state-wide or national results for a location-scoped request; any widening of the search is explicit in the reply (per UC-AGT-04).
- ☐ Rider cannot receive a route 100+ miles away presented as "near" a named place under any discovery query.
- ☐ Rider can express ride length as time (e.g. "a 2–3 hour loop") and System translates it into a distance window for the curated-route search using a defined recreational-pace constant (pinned in the TR, not left to the model) instead of ignoring the constraint.
- ☐ Rider can ask for a ride anchored on a stop by intent (e.g. "a loop with a good BBQ spot at the halfway point") and System composes the answer from route search plus real waypoint lookup along the route, never inventing businesses.

---

## UC-AGT-03: Interrogate when intent is ambiguous

When the agent cannot resolve what the rider wants — no resolvable location, contradictory
constraints, or an unclear ride type — it asks exactly one targeted clarifying question
instead of guessing, deflecting, or dumping generic results.

Acceptance Criteria:
- ☐ Rider receives one targeted clarifying question when a discovery request has no resolvable location and no session location exists.
- ☐ Rider receives one targeted clarifying question when the requested ride type cannot be mapped to catalog archetypes with reasonable confidence.
- ☐ System asks at most one clarifying question per rider turn and proceeds with a best-effort, honestly-labeled answer if the rider declines to clarify.
- ☐ System does not ask a clarifying question when the request is already resolvable (location known, intent clear) — "scenic rides near SLC" with a known location returns results, not questions.

---

## UC-AGT-04: Be honest about distance, thin data, and the weather

The agent's prose never claims proximity the data doesn't show. Every suggestion carries its
real distance from the resolved center; thin coverage is stated plainly with the nearest real
alternative and an offer to plan a custom route through the routing pipeline instead. And
because the rider's real question behind a dated request is "should I go?", the weather
verdict is volunteered, not fetched on request.

Acceptance Criteria:
- ☐ Rider can see the real distance from the resolved center on every route the agent suggests in conversation.
- ☐ System never generates prose describing a suggestion as "near" a place when its distance from that place exceeds the search radius.
- ☐ Rider in a thin-coverage area receives an honest summary naming how far the search reached and the nearest real option with its distance (e.g., "nothing rider-ready within 30 mi of Ogden — closest is X at Y mi").
- ☐ Rider is offered a custom-route alternative through the routing pipeline whenever curated coverage within the radius is empty or thin.
- ☐ System sources every factual claim in the reply (names, distances, scores) from tool results, never from model memory of roads.
- ☐ System volunteers a weather go/no-go verdict from real forecast data whenever a suggestion is tied to a stated ride date or time (e.g. "Saturday morning"), so the rider never has to ask whether the ride is on.

---

## UC-AGT-05: Prove and observe agent behavior

The failed SLC→Ogden session becomes the permanent regression suite: transcripts replay
against a fixtured model seam with graders asserting the behavior policies, paired with a
cost-capped real-API smoke lane. Traces make the next "why did it say that" a minutes-long
lookup instead of a forensic session.

Acceptance Criteria:
- ☐ System replays recorded rider transcripts (including the real SLC/Ogden failure session) through the agent with the model signal fixtured at the tool-call seam, asserting tool selection, tool arguments (center/radius), and final-state outcomes deterministically.
- ☐ System grades agent replies against the behavior policies — asked-when-ambiguous, distance-stated, no-false-proximity — and a policy violation fails the eval run.
- ☐ Founder-Operator can run a cost-capped smoke lane that exercises the real orchestrator model + real tools on a small transcript set against the dev deployment.
- ☐ Founder-Operator can inspect a per-turn trace (model calls, tool calls with arguments, timings, token cost) for any conversation via the wired observability backend.
- ☐ System records eval results as artifacts so a behavior regression is visible before a build ships to the founder's phone.

---

## UC-AGT-06: Shape replies to the rider

Persona-fit reply behavior derived from `.spec/USER-PROFILES.md` ("simple for Mike, deep for
Terry"; Rachel's confidence; Sam's save-and-return): concise best-options by default with depth
on request, honest comfort labels grounded in stored evidence, stated constraints that stick,
and a saveable close so a plan can be kept. (v3.1.0: sharing a plan **as a link** is DEFERRED
to a future PRD — no shareable-link affordance exists in the app today and planned multi-leg
routes have no deep-link target; the close is Save-to-library only.)

Acceptance Criteria:
- ☐ Rider receives at most three suggested routes by default, each with a one-line reason, and System expands to deeper detail (scores, surface, curvature, comparisons) only when the rider asks for it.
- ☐ Rider can ask for beginner-friendly or comfort-matched routes and System grounds the label in stored difficulty evidence (technical score, length, surface), never labeling a technically demanding route as easy.
- ☐ System applies stated riding constraints (e.g. "no highways", "nothing too technical") as persistent filters for the remainder of the session without the rider repeating them.
- ☐ Rider can act on any suggestion directly from the conversation — System closes route suggestions with a saveable next step (Save to the rider's library). *Sharing a plan as a link is DEFERRED to a future PRD (no shareable-link affordance exists today; planned multi-leg routes have no deep-link target).*
