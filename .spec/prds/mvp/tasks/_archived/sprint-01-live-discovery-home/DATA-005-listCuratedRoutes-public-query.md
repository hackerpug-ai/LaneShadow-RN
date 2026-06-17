# DATA-005: listCuratedRoutes public query (bbox/state/archetype/sort/limit, Clerk-gated)

| Field | Value |
|---|---|
| Sprint | sprint-01-live-discovery-home |
| Agent | convex-implementer |
| Estimate | 240 min |
| Type | FEATURE |
| Status | Backlog |
| Proposed By | convex-planner |

## Background
No public browse query exists today (the curation `leanSync`/`fetchEnrichments` are `internalQuery` via HTTP admin, guarded by `CURATION_DEPLOY_KEY`). The hero Discovery screen needs a client-callable query over the 5,654-row catalog: `listCuratedRoutes`. It resolves bbox/center via the seeded geospatial index (DATA-001), state via the `by_state` index probing both normalized spellings (DATA-004), archetype[] via the archetype map (DATA-002), applies state/length normalization, and returns lean ranked cards with 0–1 scores. Clerk-gated via `requireIdentity`.

## Critical Constraints
- MUST be a public `query` Clerk-gated via `requireIdentity` (no anonymous access).
- MUST resolve bbox/center via `geospatial.query({rectangle})`/`geospatial.nearest` over seeded points (filterKeys state+archetype, sortKey compositeScore); state-only via `by_state` index probing BOTH normalized spellings.
- MUST expand UI archetypes to DB sets via the archetype map (DATA-002) and return primaryArchetype as a UI enum.
- MUST apply state-normalize + length-clamp in the read path; return 0–1 scores (never 0–100) and clamped length.
- MUST cap limit server-side (default ~50, hard max ~200); populate distanceMi when sort='nearest'.
- NEVER use `.filter()` for geography or state (full-table scan); never return raw DB archetypes; never return 0–100 scores or unsanitized length.

## Specification
**Objective:** A Clerk-gated public query `api.curatedRoutes.listCuratedRoutes` supporting bbox/state/archetypes[]/sort/limit over the live catalog, returning ranked lean cards.
**Success State:** All four browse modes (bbox, nearest+center, archetypes[], state) return correct ranked results with 0–1 scores + clamped length + UI-enum archetypes within interactive latency at 5,654-row scale; unauthenticated calls are rejected.

## Acceptance Criteria
### AC-1: Bbox query returns in-box routes ranked by compositeScore [PRIMARY]
**GIVEN** live Convex dev with geospatial seeded + an authenticated session **WHEN** listCuratedRoutes is called with bbox (Southeast: west -89/south 34/east -82/north 38), sort='best', limit 50 **THEN** only centroids inside the bbox are returned, ranked by compositeScore desc, with UI-enum archetypes and clamped length.
- test_tier: integration · verification_service: live Convex dev deployment
- verify: `cd server && npx convex run --dev --query api.curatedRoutes.listCuratedRoutes --args='{"bbox":{"west":-89,"south":34,"east":-82,"north":38},"sort":"best","limit":50}' | jq 'length > 0 and (.[0].compositeScore >= .[-1].compositeScore)'`
- **Scenario:** start_ref→founder_region_bbox; must_observe:[length>0, all centroids in-box, compositeScore descending]; must_not_observe:[out-of-box route, random order]; negative_control.would_fail_if:[geospatial not seeded, .filter() used, unranked].

### AC-2: Nearest returns ascending-distance with distanceMi
**GIVEN** seeded points + auth **WHEN** called with center (Nashville 36.17,-86.78), sort='nearest' **THEN** routes are ordered by ascending distance with distanceMi populated on every card.
- verify: `... --args='{"center":{"lat":36.17,"lng":-86.78},"sort":"nearest","limit":50}' | jq 'length > 0 and (.[0].distanceMi <= .[-1].distanceMi) and all(.distanceMi != null)'`
- **Scenario:** must_observe:[distanceMi ascending, all non-null]; must_not_observe:[null distanceMi, random order]; negative_control.would_fail_if:[nearest not used, missing distanceMi].

### AC-3: Archetypes filter expands UI enum; returns UI enums
**GIVEN** all 6 DB archetypes + auth **WHEN** called with archetypes=['scenic','twisties'] **THEN** only routes whose DB archetype maps into that UI set are returned, all primaryArchetype are UI enums.
- verify: `... --args='{"archetypes":["scenic","twisties"],"limit":200}' | jq 'all(.primaryArchetype == "scenic" or .primaryArchetype == "twisties")'`
- **Scenario:** must_observe:[only scenic/twisties UI enums]; must_not_observe:[raw DB values (mountain/desert/scenic_byway/coastal)]; negative_control.would_fail_if:[map not applied].

### AC-4: State filter matches both spelling variants, canonical
**GIVEN** both NC spellings + auth **WHEN** called with state='North Carolina' **THEN** both variants returned (>240) all canonical "North Carolina".
- verify: `... --args='{"state":"North Carolina","limit":200}' | jq 'length > 240 and all(.state == "North Carolina")'`
- **Scenario:** must_observe:[length>240, all canonical]; must_not_observe:[one variant only, "North-Carolina"]; negative_control.would_fail_if:[normalize absent].

### AC-5: Scores 0–1 + length clamped
**GIVEN** 0–1 scores + junk lengths + auth **WHEN** cards returned **THEN** all compositeScore ∈ [0,1] and no lengthMiles >1000 or <=0.
- verify: `... --args='{"limit":200}' | jq 'all(.compositeScore >= 0 and .compositeScore <= 1)'` and `| jq '[.[]|.lengthMiles|select(. != null and (. > 1000 or . <= 0))]|length == 0'`
- **Scenario:** must_observe:[all scores in [0,1], no junk length]; must_not_observe:[score >1 or <0, 710430/0 length]; negative_control.would_fail_if:[0–100 scale, unclamped].

### AC-6: Limit capped, interactive latency (no full-table scan)
**GIVEN** 5,654 routes + auth **WHEN** called with limit=200 **THEN** result count <=200 and the query completes <1s.
- verify: `COUNT=$(... limit=200 | jq 'length'); [ "$COUNT" -le 200 ]` and `time ... limit=50`
- **Scenario:** must_observe:[count<=200, latency<1s]; must_not_observe:[count>200, slow scan]; negative_control.would_fail_if:[limit not enforced, full-table scan].

### AC-7: Auth gate rejects unauthenticated calls [ERROR]
**GIVEN** live Convex dev, NO auth **WHEN** an unauthenticated client calls listCuratedRoutes **THEN** the query is rejected with an auth/identity error and returns no data.
- verify: `... --args='{"limit":10}' --unauthenticated 2>&1 | grep -i 'auth\|identity\|unauthorized'`
- **Scenario:** must_observe:[auth error, no data]; must_not_observe:[data returned to unauthenticated caller]; negative_control.would_fail_if:[auth gate absent].

## Test Criteria
- **TC-1** (maps_to_ac AC-1): Bbox query returns in-box routes ranked by compositeScore — verify: live query + jq
- **TC-2** (maps_to_ac AC-2): Nearest returns ascending-distance with distanceMi — verify: live query + jq
- **TC-3** (maps_to_ac AC-3): Archetypes filter returns only mapped UI-enum routes — verify: live query + jq
- **TC-4** (maps_to_ac AC-4): State filter returns both spellings canonicalized — verify: live query + jq
- **TC-5** (maps_to_ac AC-5): All scores 0–1, no junk length — verify: live query + jq
- **TC-6** (maps_to_ac AC-6): Limit capped, completes <1s — verify: count + time
- **TC-7** (maps_to_ac AC-7): Unauthenticated call rejected — verify: `--unauthenticated` returns auth error

## Reading List
- `convex/geospatialIndex.ts` — geospatial query/nearest API
- `convex/schema.ts` — `by_state`, `by_composite_score` indexes
- PRD `.spec/prds/mvp/04-uc-data.md` UC-DATA-05; `09-technical-requirements/04-api-design.md` (full args + returns validator); `02-system-components.md` (data flow)
- Existing auth pattern: any client-callable read using `requireIdentity`

## Guardrails
**Write Allowed:** `convex/curatedRoutes.ts (NEW)` query module; `convex/_generated/api.ts` (auto).
**Write Prohibited:** `server/models/curated-routes.ts` (read-only), `convex/schema.ts`, `convex/geospatialIndex.ts`.

## Code Pattern / Design
- Pattern: single exported `listCuratedRoutes` `query` with a fully-specified `v.object` args + `returns` validator (see 04-api-design). Branch on input: bbox/center → geospatial; state-only → by_state both spellings; archetype filter as geospatial filterKeys or post-load filter; best-sort via geospatial sortKey/by_composite_score; nearest via geospatial.nearest + computed distanceMi. Hard `limit` cap.
- Anti-pattern: `.filter()` for geography/state; returning raw DB archetypes; 0–100 scores; unclamped length; anonymous access.

## Agent Instructions (TDD)
RED: integration tests (one per browse mode + auth) against live Convex dev (fail until query exists). GREEN: implement `listCuratedRoutes` consuming DATA-001/002/004. REFACTOR: ensure no `.filter()` for geography/state; verify latency.

## Dependencies
- depends_on: DATA-001 (seeded points), DATA-002 (archetype map), DATA-004 (normalize/clamp)
- blocks: DISC-002 (useCuratedDiscovery hook wraps this query)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{ "requirements": [ {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN seeded+auth WHEN bbox(Southeast) sort=best THEN in-box routes ranked by compositeScore desc","verify":"cd server && npx convex run --dev --query api.curatedRoutes.listCuratedRoutes --args='{\"bbox\":{\"west\":-89,\"south\":34,\"east\":-82,\"north\":38},\"sort\":\"best\",\"limit\":50}' | jq 'length > 0 and .[0].compositeScore >= .[-1].compositeScore'"}, {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN seeded+auth WHEN center(Nashville) sort=nearest THEN ascending-distance with distanceMi","verify":"listCuratedRoutes center+nearest | jq 'ascending distance, all distanceMi != null'"}, {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN all archetypes+auth WHEN archetypes=[scenic,twisties] THEN only mapped UI-enum routes","verify":"listCuratedRoutes archetypes | jq 'all scenic|twisties'"}, {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN both NC spellings+auth WHEN state=North Carolina THEN both variants (>240) canonical","verify":"listCuratedRoutes state | jq 'length>240 and all canonical'"}, {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN 0-1 scores+junk lengths+auth WHEN cards returned THEN scores in [0,1], no length >1000 or <=0","verify":"listCuratedRoutes limit=200 | jq scores+length invariants"}, {"id":"AC-6","type":"acceptance_criterion","description":"GIVEN 5,654 routes+auth WHEN limit=200 THEN count<=200 and completes <1s","verify":"count<=200 and time <1s"}, {"id":"AC-7","type":"acceptance_criterion","description":"GIVEN no auth WHEN unauthenticated call THEN rejected with auth error","verify":"--unauthenticated returns auth/identity/unauthorized"}, {"id":"TC-1","type":"test_criterion","description":"Bbox query ranked by compositeScore","maps_to_ac":"AC-1","verify":"live query + jq"}, {"id":"TC-2","type":"test_criterion","description":"Nearest ascending-distance with distanceMi","maps_to_ac":"AC-2","verify":"live query + jq"}, {"id":"TC-3","type":"test_criterion","description":"Archetypes filter returns UI-enum routes","maps_to_ac":"AC-3","verify":"live query + jq"}, {"id":"TC-4","type":"test_criterion","description":"State filter both spellings canonicalized","maps_to_ac":"AC-4","verify":"live query + jq"}, {"id":"TC-5","type":"test_criterion","description":"Scores 0-1, no junk length","maps_to_ac":"AC-5","verify":"live query + jq"}, {"id":"TC-6","type":"test_criterion","description":"Limit capped, <1s","maps_to_ac":"AC-6","verify":"count+time"}, {"id":"TC-7","type":"test_criterion","description":"Unauthenticated call rejected","maps_to_ac":"AC-7","verify":"--unauthenticated auth error"} ] }
-->
