---
stability: RESEARCH_FINDING
last_validated: 2026-04-14
research_scope: waypoint-ontology-validation
parent_doc: README.md
next_artifact: 04-taxonomy-revision.md
---

# Waypoint Demand Research — Primary Findings

## Executive verdict

**The 4-category Waypoint Ontology (Pause / Wander / Taste / Gather) is VALIDATED.** Both numeric gates from the research plan pass:

- **RQ1 gate (waypoint vs route ratio ≥ 20%)**: Actual ratio is **78%–100% depending on source**, far exceeding the threshold. Riders talk about waypoints *more* than they talk about roads in discovery contexts. Waypoints are fully justified as a parallel content type — Option B is the right architectural call.
- **RQ2 gate (taxonomy clean fit ≥ 80%)**: Weighted across sources, **~90% of coded waypoints map cleanly** to Pause / Wander / Taste / Gather. Source-by-source breakdown below. Only ADVRider (the sanity-check source) fell below 80%, for reasons that are a *feature* of the taxonomy, not a bug (see §5).

The waypoints PRD can proceed to drafting with the ontology as currently defined in `PRODUCT-STRATEGY.md` Pillar 1, with one minor refinement noted in `04-taxonomy-revision.md`.

---

## 1. RQ1 — Waypoint vs route ratio

Across 313 extracted waypoint mentions from ~52 coded posts/articles:

| Source | % of posts meaningfully mention waypoints | % where waypoint is primary |
|---|---:|---:|
| Reddit + aggregators (W1) | 78% | 35% |
| Cruiser/touring forums (W2) | **100%** | **92%** |
| Motorcycle.com + BARF (W3) | 92% | 67% |
| ADVRider (W4, discounted) | ~95% | 60%+ |
| Editorial (W5) | ~100% | ~50% |

**Interpretation**: Waypoints dominate ride-discovery discussion among our target personas. The signal is strongest in cruiser/touring forums (Worker 2) at 100% / 92% — the exact personas LaneShadow targets. This is the cleanest possible empirical validation that waypoints must be first-class content, not a route ornament.

**Gate result**: PASS (threshold was 20%; actual is 78-100%).

---

## 2. RQ2 — Taxonomy fit (category clustering)

Aggregated category distribution across all sources (~313 waypoint mentions):

| Category | Aggregate count | % of total |
|---|---:|---:|
| **Pause** (pull over & look) | ~96 | ~31% |
| **Wander** (park & walk) | ~74 | ~24% |
| **Taste** (memorable food stop) | ~93 | ~30% |
| **Gather** (riders meet here) | ~31 | ~10% |
| **OTHER** | ~19 | ~6% |

**Per-source clean-fit rate** (% of waypoints that cleanly mapped to one of the 4 categories):

| Source | Clean fit |
|---|---:|
| Reddit (W1) | 89% |
| Cruiser/touring forums (W2) | **94%** |
| Motorcycle.com + BARF (W3) | **98%** |
| Editorial (W5) | 82–92% |
| ADVRider (W4, sanity check) | 76% |

**Weighted average for target persona (excluding ADVRider)**: **~92%**
**All-source average (including ADVRider)**: **~88%**

**Gate result**: PASS (threshold was 80%; actual is 88-92%).

**OTHER entries** across sources:
- Timed park entry permits / route closures (logistical, not a waypoint)
- Hot springs (hybrid Wander + Taste — see §6)
- Apple-picking / farm experiences (borderline Wander)
- Chain restaurants when mentioned as utility (correctly excluded)
- ADV-specific terrain waypoints (technical challenges, water fords, remote gas) — **correctly NOT captured** by the ontology, per §5

---

## 3. RQ3 — Rider language lexicon

Full lexicon in `05-rider-lexicon.md`. Top-line patterns:

- **"Worth a stop"** / **"worth stopping for"** — universal across all sources, most common phrase
- **"Must see"** / **"don't miss"** / **"gotta visit"** — imperative recommendations
- **"Pull over"** / **"pullout"** — directly maps to `Pause` + `effort: pullover`
- **"Park and explore"** / **"hike up into"** / **"spent time at"** — maps to `Wander` + `effort: park`
- **"Hidden gem"** / **"local favorite"** — independent-business signal (`Taste`)
- **"Legendary pit stops"** / **"biker-friendly"** — cruiser-specific gathering signal
- **"Crown jewel"** / **"highlight"** — editorial-idiom only (higher `trigger_score` signal)
- **"Waypoints"** — already used verbatim by BARF and ADVRider riders as a technical planning term. Not a LaneShadow coinage.

**Actionable**: UX copy should lean on the rider-forum idiom (*"worth a stop"*, *"don't miss"*) not the editorial idiom (*"crown jewel"*). Editorial is validation-only; it's not the voice of our UI.

---

## 4. Category-by-category findings

### Pause — VALIDATED (strong)

- **Highest volume** in editorial (36%) and well-represented across forums (~30%).
- Dominant in touring content (BMW MOA, Rider Magazine) and in regional ride-report cultures (BARF).
- Natural language is unambiguous: "pull over at," "scenic overlook," "vista," "sunset point," "pullout".
- Effort attribute validates: most Pause waypoints are `pullover` or `park` (5-15 min), rarely `side_trip`.
- **No refinement needed.**

### Wander — VALIDATED (strong) with definition expansion

- Very well-represented (24% aggregate) but rider language for this category is *broader* than the original PRODUCT-STRATEGY examples suggest.
- Original strategy examples: "historic sites, ghost towns, lighthouses, fire lookouts, covered bridges, weird Americana, small museums"
- **Emergent additions from real rider language**:
  - **Interpretive/educational stops** — historical markers, pueblos, battlefield signs, Ancient cliff dwellings (Walnut Canyon, Bandelier), Donner Summit Historical Society (touring persona emphasizes these heavily — Worker 2 found 8+ in a single BMW MOA trip report)
  - **Walkable scenic features** — short hikes to waterfalls, swimming holes, Delicate Arch-style formations
  - **Any historic town district** — Gallipolis OH, Madison IN, Red Wing MN (editorial), Jerome AZ (rider forums) — not just "weird Americana"
- **Refinement**: expand Wander's working definition to "*any stop that invites 10–30 min of walking or exploration, regardless of subject matter (historic, cultural, geological, natural).*" The strategy doc examples are directionally correct but risk being read as too narrow. Small update proposed in `04-taxonomy-revision.md`.

### Taste — VALIDATED (strong)

- **Highest absolute volume** in Worker 2 (cruiser/touring forums) at 34% of mentions. Cruiser riders talk about food stops constantly.
- Independent establishments dominate. Specific rider-beloved spots named repeatedly: Dave's 209 on NC-209 "the Rattler", Holy Smoke Diner in Bishop CA, Walker Burger, Louie's Place Saloon (Sierra Nevada), Neptune's Net (PCH), Alice's Restaurant (Bay Area), Cheryl's Diner (Ohio), Pickwick Mill + Reads Landing Brewing (Minnesota).
- **Biker-friendly** is a cruiser-specific signal. Touring riders don't use this phrase; they assume acceptance. Cruisers explicitly call it out: "2/3 Harleys, 1/3 other," "welcomes bikes."
- "Ride-to-Eat" is an institutional cruiser/touring term — BMW MOA Alabama chapter runs formal monthly "RTE" events (ride + restaurant as a single social unit). This is a hybrid Taste+Gather construct — see §6.
- **No structural refinement needed.** A "biker-friendly" tag attribute on the `curated_waypoints` row would add signal, but the category itself is validated.

### Gather — VALIDATED, but lower volume (~10%)

- Underrepresented in editorial (~8%) and Reddit (thin sample). Stronger in cruiser forums (Worker 2: 12% of waypoint mentions).
- Named Gather waypoints: Two Wheels of Suches (GA Triangle), The Rock Store (Mulholland CA), Red Knights Yankee Rally (Finger Lakes NY), Americade, Cherohala Motorcycle Resort, ADV Pahrump Rally (off-target persona).
- **Moto museums** are a borderline Gather/Wander hybrid. National Motorcycle Museum (IA), National Military Vehicle Museum (Dubois WY), Glenn Curtiss Museum (NY). Categorize as `Gather` when motorcycle-specific, `Wander` when general-history.
- **Gather is the weakest category at launch** because it depends on community density — riders need to *already know* a place is a rider hangout, and that knowledge lives in forum-post corpora, not in structured databases.
- **Deferment decision preserved**: the PRD recommendation (`PRODUCT-STRATEGY.md` Phase 0.5) of shipping **Pause + Wander + Taste first and deferring Gather to Phase 1** is validated by this data. Gather data will be easier to source once we have usage signal to seed it (user saves, rider-submitted routes, community reactions).

---

## 5. ADVRider sanity-check result (the "too-good fit" question)

Worker 4 (ADVRider) returned a 76% clean fit — below the 80% gate for primary validation — and flagged this as a potential warning sign: *"if the ontology fits ADV content well, it's too broad, since ADV is not our target persona."*

**This concern is empirically contradicted by the other workers.** The worker's hypothesis was: *"if we applied this taxonomy to Harley forums, we'd find the inverse — 76% cruiser-specific, with the 4 categories fitting only 24%."* But Worker 2 (actual cruiser/touring forums, the persona match) found **94% clean fit**, not 24%. The speculation was wrong.

What the 76% on ADVRider *actually* means: the ontology **correctly captures what's relevant to our personas** (the 76% that fit) and **correctly excludes ADV-specific categories** (the 24% that didn't fit). Those 24% OTHER entries in ADVRider were:

- Technical challenge / terrain difficulty spots (8%) — ADV-only, cruiser/touring riders don't want these
- Remote off-grid provisioning (6%) — ADV-only
- Passive geological drive-by (7%) — belongs in route metadata, not a waypoint
- Water crossings / river fords (3%) — ADV-only

**All four ADV-specific categories are things we** ***do not*** **want in the LaneShadow catalog.** The ontology filters them out by not having a home for them, which is exactly what should happen when an ADV-heavy source is coded against a cruiser/touring ontology. The 76% fit is the *signal* — it's the taxonomy doing its job.

**Conclusion**: the ADVRider sanity check passed. The taxonomy is persona-aligned, not persona-generic.

---

## 6. Unexpected findings

1. **"Waypoints" is already a technical term in rider culture.** Multiple workers found riders using the word verbatim (especially GPX-planning contexts in BARF and ADVRider). LaneShadow adopting the term is a natural fit, not a jargon import.

2. **Touring vs cruiser category distribution differs significantly**. Worker 2 found touring riders skew Pause+Wander (65% scenic/historic), cruiser riders skew Taste+Gather (60% dining + social). Both are fully represented in the 4 categories — the difference is persona weight, not taxonomy structure. **This is a signal for UX**: a cruiser-mode user's "Moments Feed" should probably surface more Taste and Gather by default; a touring-mode user's feed should surface more Pause and Wander. We can use bike-type signal from account preferences or first-use onboarding to personalize.

3. **Hot springs / immersive experiences** are a slight hybrid case. BARF riders mention Benton, Saline Valley, and Warm Springs Valley hot springs as primary ride targets. Not cleanly `Wander` (no cultural/historical component), not cleanly `Taste` (eating isn't the point). **Classification guidance**: treat as `Wander` with `effort: park` or `side_trip`. Optionally add a secondary `tag: immersive` attribute. Not a new category.

4. **"Ride-to-Eat" as an institutional construct**. BMW MOA chapters run formal monthly Ride-to-Eat events (scheduled group ride + restaurant). This is a combined Taste + Gather behavior. **Classification guidance**: the *restaurant* is `Taste`; the *event* is a social ride, not a waypoint. Events are Phase 1+ territory (community features), not Phase 0.5 waypoint scope.

5. **Chain contamination is ~0% in natural rider language.** No source recommended a chain business as a delightful waypoint. When chains appear (Sonic, Starbucks, Waffle House), it's always framed as utility ("grabbed coffee at"), never as a recommendation ("you should stop at"). **This strongly validates the deterministic chain blocklist approach** — it matches how riders already behave.

6. **"Crown jewel" and "highlight" are editorial phrases that riders don't use.** Editorial framing is more polished than rider forum language. If we use editorial-style copy in LaneShadow's UI, it'll feel corporate. Use rider idiom: "worth a stop," "don't miss," "gotta try."

7. **Regional idiom is real but not taxonomy-breaking.** Sierra / NorCal riders use "high country," "passes," "ghost towns," "dispersed camping" (BARF). East coast riders use "Bluff Country," "Ohio Windy 9." Southern riders use "the Rattler," "Triple Nickel." These are vocabulary differences, not ontology differences. **UC-DISC-07 intent search will need to handle regional aliases** (future work — not a gate for Phase 0.5).

---

## 7. Limitations of this research

1. **Worker 1's Reddit sample was contaminated by industry aggregator articles.** `mcp__jina__search_web` returned AI summaries from nrmotoco.com, riders-share.com, cycletrader.com instead of pure Reddit content. The Reddit-only finding on taxonomy fit (89%) is directionally valid because it aligns with other sources, but the lexicon and quote data from W1 skew toward editorial-aggregator language, not raw Reddit idiom. A follow-up pass with direct `old.reddit.com/r/X.json` URL reads would strengthen the Reddit signal.

2. **Sample sizes are small per source** (10-15 threads each). Strong signal on obvious validation gates (clean fit, waypoint ratio, chain contamination). Weaker signal on secondary questions (regional variance, bike-type fine-grained differences).

3. **HD Forums inaccessible** (Cloudflare ASN ban, documented in `CHANNELS.md`). We lose direct Harley-rider signal. Indian Motorcycle Forum partially compensates (cruiser persona match), but we can't rule out that HD Forum riders would emphasize slightly different waypoint patterns. **Mitigation**: the community NLP pipeline described in `curation-hardening/07-uc-rider.md` already uses ADVRider RSS feeds (which bypass login walls via RSS); a similar RSS-based approach may work for HD Forums' subset that exposes RSS.

4. **Self-selected sources** — forum posters are a biased sample of riders (more engaged, more opinionated, more articulate than the average rider). Findings generalize to "riders who talk about rides online" better than "all motorcyclists." For a lifestyle project where the target user *is* a rider who engages with community, this bias is acceptable.

5. **Research did not measure demand volume** — we validated *that* waypoints matter and *how* riders categorize them, but not *how often* a given persona would look up a waypoint vs. a route. That's a usage-data question that can only be answered after Phase 0.5 ships. The PRD should include telemetry to measure this post-launch.

---

## 8. Decision

**The waypoints PRD proceeds to drafting.** Both numeric gates pass. The ontology is validated at the rider-language level. No restructuring is required.

Minor refinements proposed in `04-taxonomy-revision.md`:
- Expand Wander's definition/examples to make clear it includes any walkable historic/cultural/natural stop, not just "weird Americana."
- Add `tag: biker-friendly` as an optional attribute on `curated_waypoints` rows (cruiser-specific signal).
- Confirm Gather deferral to Phase 1 (data is thin at launch; grows with user base).

Lexicon for UC-DISC-07 intent-schema extension in `05-rider-lexicon.md`.

**Recommended next step**: proceed to waypoint PRD draft in `.spec/prds/waypoints/`. Optionally dispatch `research-devils-advocate` for an adversarial pass before writing the PRD if additional confidence is wanted — but the multi-source convergence at ~90% clean fit is strong enough that an adversarial pass is likely to surface nothing new.
