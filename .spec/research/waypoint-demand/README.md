---
stability: RESEARCH_PLAN
last_validated: 2026-04-14
research_scope: waypoint-ontology-validation
related_strategy: .spec/PRODUCT-STRATEGY.md Pillar 1
related_prd: .spec/prds/waypoints/ (forthcoming — gated on this research)
channel_source: .spec/research/CHANNELS.md
---

# Waypoint Demand Research

## Purpose

Validate the **Waypoint Ontology** (`PRODUCT-STRATEGY.md` Pillar 1 — "Discovery spans routes AND waypoints") against real rider language *before* building the waypoint pipeline.

The ontology defines four rider-intent categories — **Pause**, **Wander**, **Taste**, **Gather** — derived from first-principles PM thinking. Those categories are a **hypothesis**. This research is the test.

**Cost of being wrong:** Building the sourcing pipeline, quality gates, Haiku extraction schema, and discovery UX around a taxonomy that doesn't match rider mental models would waste 2–3 weeks of Phase 0.5 work and would ship an experience that feels foreign to the personas we are building for. Forum discussions capture actual rider intent in rider words — the cheapest possible validation source available to us before we commit.

## Research Questions

### Primary questions

**RQ1** — When riders talk about great rides, how often do they reference *things along the way* (waypoints) vs. *the road itself* (route)?
> Validates whether waypoints deserve to be a *parallel content type* (Option B) or just a *route ornament* (Option A). Threshold: if ≥20% of ride-related posts reference waypoints as meaningful content, Option B is validated. <10% pushes us back to Option A.

**RQ2** — Do rider-originated waypoint mentions cluster into the proposed 4 categories (Pause / Wander / Taste / Gather), or does an alternative taxonomy emerge from the data?
> Validates whether the category model is right, needs revision, or is missing categories we didn't imagine. Threshold: ≥80% of coded waypoints fit cleanly into one of the four categories. <60% means revise the taxonomy.

**RQ3** — What natural-language phrases do riders use when asking for or sharing waypoints? ("best stop on," "don't miss," "worth pulling over for," "great place for lunch," "gotta see," etc.)
> Feeds directly into the UC-DISC-07 intent schema — the Haiku intent→params extractor needs to handle rider-natural phrasing, not PM-imagined phrasing.

### Secondary questions

- **RQ4** — What categories are over- or under-represented? (E.g., does "where to eat" dominate, or is "scenic overlooks" equally present? This changes sourcing priority.)
- **RQ5** — Are there regional differences in waypoint language? (Does PNW ride culture talk about viewpoints differently than Blue Ridge or Rockies?)
- **RQ6** — What does *chain-store contamination* look like in natural rider posts? Do riders ever recommend Taco Bell / Starbucks / McDonald's as "great stops"? Tests whether the no-chain rule will feel restrictive or welcome.
- **RQ7** — How much of rider forum content is actually ride-discovery-related, vs. gear/maintenance/politics/buying-selling? (Establishes noise floor for the exclusion filter used in UC-RIDER-03 community NLP extraction.)

## Data Sources

**Defer to `../CHANNELS.md` as the authoritative forum inventory.** This research uses a subset; we don't duplicate the channel classification here.

### Tier 1 — Primary (weighted 70% of sample)

These match the v3 personas (recreational cruiser / touring riders). Selected from CHANNELS.md Tier 1-2 with preference for channels that (a) are bot-accessible, (b) are rider-discussion-heavy, (c) skew cruiser/touring rather than ADV or sport.

| Source | Why | CHANNELS.md status |
|---|---|---|
| **Reddit r/motorcycles** (2.3M subs) | Broadest recreational rider audience; bot-readable; covers all bike types but recreational skew | Tier 1, fully accessible |
| **Reddit r/motorcyclesroadtrip** | Explicit road-trip focus — highest possible signal for "where/what to ride" language | Supplement — small but on-topic |
| **Indian Motorcycle Forum** (indianmotorcycles.net) | Cruiser-heavy community matching Mike persona; fully bot-readable | Tier 2, fully accessible |
| **BMW MOA Forum** | Touring-heavy community matching Terry persona; fully bot-readable | Tier 1, fully accessible |
| **Motorcycle.com Forums** | General rider sentiment; cruiser and touring sub-boards; fully bot-readable | Tier 1, fully accessible |

**Excluded from Tier 1 despite cruiser fit: HD Forums.** CHANNELS.md documents that HD Forums is Cloudflare ASN-banned and not bot-accessible. We lose some Mike-persona signal as a result; the gap is covered by Indian MC Forum + cruiser sub-boards on Motorcycle.com + r/motorcycles with cruiser-tagged flairs.

### Tier 2 — Secondary signal / sanity check (weighted 20% of sample)

| Source | Why | Weight |
|---|---|---|
| **ADVRider regional forums** (17 via RSS, per UC-RIDER-01) | Large body of ride-focused discussion, but skews ADV/dual-sport. Used as *directional* signal only; findings that appear only in ADVRider get discounted. | 10% |
| **BARF (Bay Area Riders)** | Regional-but-rich; includes route-report culture; fully bot-readable | 10% |

### Tier 3 — Editorial (weighted 10% of sample)

| Source | Why | Sample approach |
|---|---|---|
| **RevZilla Common Tread** | Editorial — how professional motorcycle writers frame waypoints. Establishes "expert idiom" baseline. | Sample 10–15 articles mentioning rides / destinations |
| **Rider Magazine "best rides" archive** | Editorial ground truth for idiomatic motorcycle waypoint language | Sample 10–20 articles |

### Explicitly excluded

- **Sport-bike forums** (Sportbikes.net, R6, GSX-R, Ducati Scrambler) — wrong persona per v3 strategy
- **Dirt bike / motocross forums** — wrong persona
- **Track-day communities** — wrong persona
- **Gear-heavy YouTube channels** (FortNine, etc.) — signal is gear, not waypoints
- **B2B panels** (MIC RideReport, EPG MyVoiceRewards) — too expensive for a validation pass; reserve for quantitative trend validation later if needed

## Sampling Method

- **Time window:** 2024-04-01 to 2026-04-01 (24 months). Captures two riding seasons and any recent shifts.
- **Per-source target:** 100–200 coded posts per Tier 1 source, 50–100 per Tier 2, 10–20 per Tier 3 article.
- **Total target:** ~700–1,100 coded posts.
- **Post quality floor:** text post with ≥50 words of substantive content. Exclude link-only, image-only, one-liner, meme, and "just saying hi" posts.
- **Stratification:** where possible, stratify by geographic region mentioned in post (SE / MW / W / NE / PNW / unknown).

## Inclusion Filters (post IS coded if about …)

- Asking for route / ride / road recommendations
- Sharing a ride report with details about the experience (not just photos)
- Recommending a specific place, stop, or destination
- Discussing "best" or "favorite" anything ride-related
- Planning an upcoming ride or trip
- "Where should I go this weekend" / "tell me about [state]" threads

## Exclusion Filters (post is NOT coded if about …)

These power the coding filter AND inform UC-RIDER-03's existing community NLP exclusion list:

- Gear (helmets, jackets, boots, tires, oil, luggage, intercoms, etc.)
- Maintenance, repairs, modifications, parts, wrenching
- Bike buying / selling / shopping / "should I get X vs Y"
- Crash reports, injury, insurance, legal issues
- Beginner / safety course / license / "should I learn to ride"
- Politics, current events, off-topic
- Group ride logistics (meet time, parking, rendezvous)
- Motorcycle culture philosophy posts without specific rides referenced

## Coding Schema

For each included post, the researcher (or LLM extractor) records structured data:

```json
{
  "post_id": "r-motorcycles-abc123",
  "source": "reddit|bmwmoa|indian-mc|motorcycle-com|advrider|barf|editorial",
  "source_url": "https://...",
  "posted_date": "2025-07-14",
  "region": "SE|MW|W|NE|PNW|unknown",
  "bike_type_signal": "cruiser|touring|sport|adv|unknown",
  "post_type": "asking|sharing|recommending|warning|planning|trip_report",
  "mentions_route": true,
  "mentions_waypoint": true,
  "route_mentions": [
    { "name": "Blue Ridge Parkway", "state": "NC" }
  ],
  "waypoints_referenced": [
    {
      "name": "Graveyard Fields overlook",
      "rider_language": "pulled off at the Graveyard Fields",
      "proposed_category": "pause|wander|taste|gather|OTHER",
      "if_other_describe": "",
      "effort_signal": "pullover|park|side_trip|unclear",
      "trigger_strength": "low|medium|high|unclear",
      "is_chain_business": false
    }
  ],
  "rider_language_snippet": "The stretch past the lake at Vogel State Park is worth pulling over for — there's a little rock you can walk out on and see the whole valley.",
  "notes": "Free-form observation. Note anything that doesn't fit the schema."
}
```

## Analysis Approach

1. **Category frequency** — how many posts / waypoints map to each of the 4 proposed categories, and how many require an "OTHER" code.
2. **Ratio of waypoint-centric vs route-centric posts** — RQ1 evidence. How much of rider ride-discussion content is actually about things along the way vs. the road itself?
3. **Emergent clustering of "OTHER"** — take every OTHER-coded waypoint, LLM-cluster them, see if a new pattern appears (e.g., "weather windows," "seasonal trails," "scenic loop within a city," "ferry crossings").
4. **Rider language lexicon** — extract the top 30 phrases riders use when describing waypoints ("worth a stop," "don't miss," "pull over and look at," "best spot to," "gotta try the"). This becomes input to UC-DISC-07 intent schema extension.
5. **Regional variance check** — do categories shift meaningfully by region? (If yes, the quality scoring needs regional calibration.)
6. **Chain contamination rate** — % of posts that recommend chain businesses. Low % validates the deterministic blocklist approach. High % means the blocklist is too aggressive and needs to be smarter.
7. **Bike-type variance** — do cruiser/touring riders emphasize different waypoint types than our excluded-but-sampled ADV/sport riders? (Validates the v3 persona exclusion.)

## Deliverables

Research artifacts live in this folder:

1. **`README.md`** — this document (methodology, committed before execution begins)
2. **`01-sampling-log.md`** — raw collection log per source: URLs visited, query terms used, posts retrieved, posts filtered out with reason
3. **`02-coded-posts.jsonl`** — structured coded data, one JSON object per post
4. **`03-findings.md`** — primary findings addressing RQ1–RQ3 with quantitative support
5. **`04-taxonomy-revision.md`** — what (if anything) changes in the Waypoint Ontology based on evidence. If no changes: a short "ontology confirmed" note + link back to `PRODUCT-STRATEGY.md`.
6. **`05-rider-lexicon.md`** — top phrases for feeding UC-DISC-07 intent schema

## Execution Plan

### Option A — Pilot scan (recommended first)

- **Scope:** 2 research workers in parallel, ~200 posts total
  - Worker 1: Reddit r/motorcycles + r/motorcyclesroadtrip (broad recreational signal)
  - Worker 2: BMW MOA Forum + Indian Motorcycle Forum (cruiser/touring signal matching Mike + Terry)
- **Cost estimate:** ~$5–12 in API credits
- **Wall time:** 30–60 min
- **Aggregation:** one research-analyst pass to produce `03-findings.md`
- **Decision point:** if pilot findings are clean and directional, write the waypoints PRD. If they surface taxonomy gaps, run Option B.

### Option B — Full research swarm (only if pilot surfaces issues)

- **Scope:** 4–5 research workers across all Tier 1 + Tier 2 + Tier 3 sources, ~700–1,000 posts
- **Cost estimate:** ~$25–50
- **Wall time:** 2–4 hours
- **Aggregation:** research-analyst + research-devils-advocate for adversarial validation

### Option C — Deep qualitative (reserved for edge cases)

- **Scope:** human (founder) reads 50 hand-picked threads end-to-end
- **Cost:** founder time (~2–3 hours)
- **When:** only if Options A and B both produce ambiguous signal that benefits from expert rider judgment

## Validation Gate — "Research is done when…"

We close out this research when we can confidently answer:

- **RQ1 answered:** rider-mention ratio of waypoints is either ≥20% (waypoints are parallel content type, proceed with Option B) or <10% (re-open the strategic fork).
- **RQ2 answered:** ≥80% of coded waypoints fit cleanly into Pause / Wander / Taste / Gather. If not, document the new categories in `04-taxonomy-revision.md` and update `PRODUCT-STRATEGY.md` before writing the PRD.
- **RQ3 answered:** rider lexicon has ≥30 distinct phrases documented in `05-rider-lexicon.md`.
- **Chain contamination rate documented** (RQ6).

If any gate fails, run another iteration before writing the waypoints PRD. The PRD is explicitly gated on this research closing out.

## What this research is NOT

- **Not quantitative market sizing.** We're not measuring TAM or user counts. That was done in v2.x revenue validation.
- **Not a user survey.** We don't contact real riders. Forum posts are publicly available and we observe them passively.
- **Not a full community NLP pipeline.** That's UC-RIDER-03 in `curation-hardening`. This is a one-shot validation pass using the same raw sources, but with different goals and a different coding schema.
- **Not a scraping engineering project.** If a source is bot-blocked (HD Forums), we skip it. We are not going to solve Cloudflare-bypass for a validation pass.

## Next Step

Upon user approval of this plan, execute Option A (pilot scan). Findings get written to `03-findings.md` and summarized back to the user. Decision on whether to run Option B or proceed to PRD draft is made after reviewing pilot findings together.
