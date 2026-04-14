---
stability: RESEARCH_FINDING
last_validated: 2026-04-14
research_scope: waypoint-ontology-validation
parent_doc: 03-findings.md
used_by: .spec/prds/curation/04-uc-discovery.md UC-DISC-07 (intent schema extension), future waypoints PRD UX copy
---

# Rider Waypoint Lexicon

Natural-language phrases riders use to describe waypoints, extracted from 5 parallel research workers across Reddit, cruiser/touring forums (BMW MOA, Indian MC), Motorcycle.com, BARF, ADVRider, and editorial sources (Rider Magazine, RevZilla Common Tread).

**Use this lexicon for two things:**
1. **UC-DISC-07 intent schema extension** — the Haiku intent→params extractor must recognize these phrases as waypoint-discovery intents and slot-fill the appropriate waypoint category.
2. **UX copy in the waypoints PRD** — when in doubt, prefer rider-forum idiom over editorial idiom. *"Worth a stop"* > *"Crown jewel of the route."*

## Universal phrases (appear in ≥3 sources, high frequency)

These are the most reliable search-intent phrases. Build the intent schema around them first.

| Phrase | Category signal | Sources |
|---|---|---|
| "worth a stop" / "worth stopping for" | any | W1, W2, W3, W5 |
| "must see" / "must-see" | any, higher trigger_score | W1, W2, W3, W5 |
| "don't miss" / "can't miss" | any, higher trigger_score | W1, W2, W5 |
| "pull over" / "pullout" / "pulled off" | Pause, effort: pullover | W1, W2, W3 |
| "hidden gem" | Wander or Taste (independent) | W1, W3, W5 |
| "scenic overlook" / "overlook" / "vista" | Pause | W1, W2, W3, W5 |
| "worth the detour" / "worth the ride" | Wander or Taste, effort: side_trip | W2, W3, W5 |
| "highlight" / "highlight of the trip" | any, higher trigger_score | W2, W5 |
| "favorite ride" / "favorite stop" | any | W1, W3 |
| "grab lunch" / "grab breakfast" / "grab coffee" | Taste | W1, W2, W3 |
| "stop for" [food / views / photos] | any | W1, W2, W3 |
| "gotta try" / "gotta visit" / "gotta stop at" | any | W1, W2 |
| "hit up" / "hit the" | any | W1 |
| "on the way" | any, low trigger_score (along-route) | W1, W3 |
| "check out" | Wander or Taste | W1, W2, W3 |
| "waypoints" (used verbatim) | technical GPX-planning context | W3 (BARF), W4 |

## Cruiser/touring-specific idiom

Phrases that appear more heavily in cruiser/touring forums than in editorial or ADV sources. Use these in UX copy when serving the Mike/Terry/Sam personas.

| Phrase | Note |
|---|---|
| "biker-friendly" / "biker hangout" / "welcomes bikes" | Cruiser explicit signal; touring assumes acceptance |
| "ride-to-eat" (and "RTE") | BMW MOA institutional term — monthly group rides to restaurants |
| "fantastic stop" / "gorgeous ride" | More enthusiastic/literal than editorial |
| "cool little" [place / town / diner] | Cruiser informal idiom |
| "gateway to" [region] | Both cruiser + touring; frames a town as the approach to a ride |
| "out of the way" | Positive framing of hidden waypoints |
| "quaint" / "small-town charm" / "time warp" | Touring-persona descriptors for historic towns |
| "must not miss" (intensified) | Common on Indian Motorcycle Forum |
| "bucket list" | Aspirational framing for multi-day trip targets |

## BARF / Sierra / West-coast regional idiom

BARF (Bay Area Riders Forum) has a distinctive Sierra-Nevada rider vocabulary. These phrases don't generalize nationally but show that regional voice exists.

| Phrase | Note |
|---|---|
| "high country" | Sierra elevation language |
| "passes" (named: Tioga, Ebbetts, Sonora, Monitor) | West Coast cultural familiarity |
| "ghost towns" (Bodie, Ballarat, Bannack) | Gold-rush cultural touchstone |
| "dispersed camping" | BLM/USFS specificity |
| "fire danger" / "road closure" | CA-specific routing language |
| "hot springs" (Benton, Saline Valley, Warm Springs) | Regional waypoint cluster |
| "desert riding" | Tonopah / Death Valley / Eastern Sierra idiom |

**Future work**: when LaneShadow expands to regional route collections (Phase 4, per `PRODUCT-STRATEGY.md`), regional lexicon like this should feed regional intent schemas — "riding the high country this weekend" should route to Sierra-specific waypoints, not generic.

## Editorial idiom (use with caution)

Professional motorcycle writers at Rider Magazine and RevZilla Common Tread use more polished language than forum riders. **Do not use editorial phrasing as UI copy** — it will feel corporate and off-voice. Use it only to validate that the taxonomy covers professionally-curated waypoints.

| Phrase | Why to avoid in UI |
|---|---|
| "crown jewel of the route" | Editorial-only. Forum riders say "best stop." |
| "serpentine byways" / "swaying through curves" | Poetic; feels written, not spoken. |
| "spiritual sense" / "emotional resonance" | Over-serious. |
| "must-see attractions" | Fine, but "don't miss" is punchier and closer to rider idiom. |
| "welcome" / "gateway" | Tourist-guide framing. Fine as UI copy but use sparingly. |
| "a perfect stop for" | Fine, neutral. |
| "in awe of the scenes" | Editorial only. |

The forum-idiom equivalent of "crown jewel" is **"legendary"** ("legendary pit stops," "legendary stretch," "legendary diner"). Prefer this.

## Red-flag phrases — riders avoid or mock these

Understanding what riders *don't* say is as important as what they do. If our UX copy uses language in this column, it will feel wrong.

| Phrase | Why it fails |
|---|---|
| "POI" (point of interest) | Bureaucratic. Tourist-bureau speak. |
| "attraction" | Theme-park framing. Riders say "stop" or "spot." |
| "amenity" | Zillow/real-estate framing. Riders don't use this word. |
| "destination" (overused) | OK sparingly for high-trigger_score waypoints; loses meaning if applied to every card. |
| "experience" (as a noun) | Marketing-speak. Riders say "ride" or "stop." |
| "curated" | Meta-commentary. Don't tell riders the catalog is curated; just show them good waypoints. |
| "unlock" / "discover" (in CTAs) | App-store-speak. Prefer "find" / "show me." |

## Effort-attribute phrases

How riders indicate `effort` in natural language (used by the Haiku extractor to slot-fill the `effort` attribute from source text).

**`pullover`** — stay on the bike, 2-5 minute stop, helmet stays on:
- "pull over and look"
- "pullout"
- "nice view from the shoulder"
- "brief stop at"
- "snapped a photo"
- "pulled off the road for"

**`park`** — kill the engine, park the bike, 15-60 minute stop:
- "parked the bike and walked"
- "spent an hour at"
- "wandered around"
- "worth getting off the bike for"
- "took the hike to"
- "walked up to"

**`side_trip`** — 30+ minute detour off the main route, the waypoint IS the reason:
- "worth the detour"
- "we took a side trip to"
- "added a day to visit"
- "made a special trip to"
- "went out of the way to see"

## trigger_score language (how riders imply "is this worth a whole ride?")

**High trigger_score (0.7+)** — the waypoint can *be* the ride:
- "must-see"
- "highlight of the trip"
- "bucket list"
- "made the whole trip worth it"
- "centerpiece of the ride"
- "legendary"

**Medium trigger_score (0.4-0.6)** — solid mini-destination, worth a focused trip:
- "worth a visit"
- "worth the ride"
- "fantastic stop"
- "good day trip"

**Low trigger_score (0-0.3)** — only valuable as an along-route stop:
- "on the way"
- "nice little spot"
- "quick stop"
- "since we were there"
- "stopped for a quick look"

The Haiku source-extraction prompt should emit `trigger_score` by mapping rider language onto this scale.

## Universal phrases, in UI-copy candidates

These are ready-to-use copy snippets for the waypoints PRD UX mockups. Verbatim from rider language, short, clear.

- **CTA / filter labels**: "Worth a Stop," "Don't Miss," "Hidden Gems," "Biker-Friendly," "Legendary Stops"
- **Card badges**: "Worth the Detour" (for high trigger_score side_trip), "On the Way" (for low trigger_score pullover), "Local Favorite" (for independent Taste)
- **Empty states**: "No moments found near you — try widening your search"
- **Surprise Me copy**: "Find me something worth riding to"
- **Near Me tab**: "Moments Near You"

## Sources

- `01-sampling-log.md` — per-worker source list and URL inventory
- `03-findings.md` — primary findings analysis
- `04-taxonomy-revision.md` — ontology refinements based on lexicon evidence
