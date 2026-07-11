---
stability: PRODUCT_CONTEXT
last_validated: 2026-07-10
prd_version: 2.0.0
---

# Route & Agent Quality — Real Roads, Honest Assistant

## Product description

One trust program with two halves that meet at the discovery tool contract:

**Route Quality** — a rescue-first data pipeline plus a hard read-path gate that make one
promise: any route LaneShadow suggests plots a real, correct road line. Three recovery
levers run over the entire 5,757-route curated catalog in a resumable waterfall — (1)
promote the rider-drawn polylines sitting ignored in a legacy row field, (2) AI-reconstruct
geometry from the turn-by-turn ride descriptions nobody ever parsed (LLM anchor extraction →
geocoding → routing → deterministic length gate → bounded repair round), (3) re-route A-to-B
and road-name routes from their endpoints. Every produced line passes one deterministic gate
or is held fail-closed in a REVIEW queue; an LLM ride-worthiness classifier judges "is this
actually a motorcycle ride?"; a stored `riderReady` flag gates every suggestion surface.
Nothing is retired until every lever fails and the founder confirms.

**Agent Quality** — the conversation layer rebuilt on Mastra as a smart loop with tools:
one Sonnet-class model that owns intent, always grounds discovery in the rider's real
location (session location or a geocoded place name), asks one targeted question when
unsure, states honest distances, and never claims proximity the data doesn't show. The
deterministic routing pipeline — which works today — is preserved as tools the agent calls.
The founder's real failed transcripts become the permanent eval suite.

## Problem statement

**The catalog lies.** The 2026-07-10 full-export audit measured every stored polyline: of
5,757 routes only 1,707 (29.7%) have GOOD geometry; 2,870 (49.9%) have no line at all;
1,058 decode to the wrong roads. Only 1,171 (20.3%) are rider-ready, 7 of the top-10
national suggestions are junk (103 editorial rows scored 72–90 on the 0–1 scale pin the
ranking), and the fix material sat unused in the rows — 1,752 ignored scraped polylines and
948 turn-by-turn descriptions.

**The agent can't use even the good parts.** Live-transcript diagnosis of the founder's
failed session (same day): "scenic rides near SLC" → "I didn't find any"; "twisty near
Ogden" → Capitol Reef at ~170 miles presented as "near Ogden." Root cause: the "discovery
agent" was never an agent — a regex keyword matcher with a one-city gazetteer that never
passed the rider's known location and hardcoded best-first sorting, driven by an
orchestrator whose "high" model tier was gpt-4.1 as an emergency fallback from a budget
model. The rider was standing 14 miles from Big Cottonwood Canyon Scenic Byway — a broken
catalog row (centroid dot, empty description) served by an agent that couldn't say "near"
at all. Founder verdict: pull-the-plug territory. Trust requires fixing both halves — an
honest agent over junk data has nothing to say; good data behind a dumb agent never reaches
the rider.

## Solution summary

1. **Clean** (HYG): normalize the 103 out-of-scale editorial scores, merge the 50 duplicate
   groups, quarantine zero-length/outlier/test rows, normalize state strings.
2. **Rescue** (REC): the resumable lever waterfall over all 4,050 broken-geometry routes —
   promote (1,752, $0), AI-reconstruct (948; PoC proven 2026-07-10 at ratio 1.00, ~$0.07 per
   route), re-route (1,076). Provenance recorded; retirement gated behind all-lever failure
   plus founder confirm.
3. **Verify** (VER): one deterministic gate (ratio 0.6–1.6, region, degenerate), a bounded
   LLM repair round, a cross-provider ride-worthiness classifier, a REVIEW queue, and a
   ~25-route founder couch gate before the full batch.
4. **Gate** (SURF): stored `riderReady` gates discovery/browse/carousel; centroid fallback
   deleted; honest thin-region absence with labeled fallback; provenance captions; saved
   routes never hidden.
5. **Rebuild the agent** (AGT): Mastra smart-loop conversation layer on a Sonnet-class
   `orchestrator` tier; regex intent routing deleted; discovery always location-grounded
   (geocode "Ogden" like the router already geocodes endpoints); one clarifying question
   when ambiguous; honest distances and thin-data candor with a custom-route fallback;
   in-session memory; the real failed transcripts as the regression eval suite with traces
   wired to LangSmith.

**FOUNDER-BAR anchoring:** Route Quality is the Trust wave's T1 ("100% of suggested routes
plottable") and T2 ("flawless top-50"); Agent Quality is what lets the founder *feel* T1/T2
through the chat surface instead of being lied to about it. Ships before the enrichment
R-leg (`.spec/prds/enrichment/`), whose generation covers only plottable routes.

> **Grounding:** built from the ratified geometry strategy + real-service PoC
> (`.spec/proposals/geometry-completion/` — full prod-export audit, reconstruction PASS at
> ratio 1.00 on two real routes) and the 2026-07-10 agent diagnosis against live
> `session_messages` transcripts, the orchestrator/discovery source, and near-SLC/Ogden
> catalog replay. Supersedes/extends `.spec/prds/catalog-geometry-recovery/`. v1.0.0 of this
> PRD shipped as "Geometry Completion"; v2.0.0 renames the initiative and adds the AGT group.
