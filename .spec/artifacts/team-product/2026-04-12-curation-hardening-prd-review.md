# Curation Pipeline Hardening PRD Review — Expert Team Report

**Date**: 2026-04-12
**Team**: curation-hardening-expert-review
**PRD Version**: 1.0.0
**Review Type**: Domain Expert Validation (Research, Convex, NLP, Quality)

---

## Executive Summary

**VERDICT**: **CONDITIONAL APPROVAL** — The PRD has a sound architectural foundation but contains **5 CRITICAL issues** and **8 HIGH-priority concerns** that must be addressed before implementation.

### Critical Issues (Must Fix)

1. **2 of 6 new data sources have ZERO research validation** (BDR GPX, twtex.com)
2. **Convex schema "non-breaking" claim is FALSE** — nullable fields require deployment
3. **Missing Convex table definitions** for RouteMention/AggregatedMention entities
4. **No pilot data exists** to validate 95%+ NLP accuracy claims
5. **Quality floor may reject 25-40% of existing catalog** — requires phased rollout

### High-Priority Concerns

6. Convex has no native geospatial queries — requires workaround
7. Levenshtein threshold (0.7) too permissive for dedup
8. Reddit API policy risk not acknowledged in PRD
9. snake_case vs camelCase naming inconsistency
10. Sentiment analysis inadequate for rider vernacular
11. Authority weights assumed without validation
12. Geographic coverage bias in community signals
13. Calibration gate storage location undefined

---

## Team Composition

| Specialist | Domain | Deliverable |
|------------|--------|-------------|
| data-source-expert | Research validation | source-validation-report.md |
| nlp-expert | NLP feasibility | nlp-feasibility-report.md |
| convex-architect | Backend architecture | convex-architecture-review.md |
| quality-expert | Data quality infrastructure | quality-infrastructure-assessment.md |

---

## Finding #1: Data Source Validation Gaps

**Specialist**: data-source-expert
**Severity**: CRITICAL

### Summary

6 new sources were validated against project research reality (`.spec/research/CHANNELS.md`, `.spec/research/data-sources/us-roadway-datasets.md`):

| Source | Confidence | Status | Issues |
|--------|------------|--------|--------|
| US Scenic Byways GIS | HIGH | ✅ Proceed | Data freshness (2018 baseline) |
| ADVRider RSS | HIGH | ✅ Proceed | Only 1 parent feed, not 17 section feeds |
| Reddit API | MEDIUM | ⚠️ Caution | Policy risk not acknowledged |
| **BDR GPX** | **LOW** | **❌ BLOCKED** | **No research documentation** |
| **twtex.com** | **LOW** | **❌ BLOCKED** | **No research documentation** |
| USFS MVUM | HIGH | ✅ Proceed | None |

### Critical Blockers

**BDR GPX (UC-SRC-02)**:
- PRD assumes "free GPX downloads" from ridebdr.com
- Zero research documentation exists
- Unknown: availability, authentication, rate limits, format consistency
- **Recommendation**: Live verification required before implementation

**twtex.com (UC-SRC-03)**:
- PRD assumes scraping feasible
- Zero research documentation exists
- Unknown: site structure, WAF protection, rate limits, legal/ToS implications
- **Recommendation**: Comprehensive research required before implementation

### Integration Priority (Revised)

**Phase 1** (HIGH confidence, research-backed):
1. ✅ US Scenic Byways GIS (799 routes)
2. ✅ ADVRider RSS (parent feed with geographic post-filtering)
3. ✅ USFS MVUM (government data)

**Phase 2** (MEDIUM confidence, with safeguards):
4. ⚠️ Reddit API (conservative rate limiting, monitor policy changes)

**Phase 3** (BLOCKED until verified):
5. ❌ BDR GPX (live verification required)
6. ❌ twtex.com (comprehensive research required)

---

## Finding #2: Convex Architecture Violations

**Specialist**: convex-architect
**Severity**: CRITICAL

### Issue #2.1: Non-Breaking Claim is Incorrect

**PRD Claim** (AD-009):
> "Convex nullable columns, not new table. Non-breaking for existing mobile app."

**Reality**:
- Convex schema changes require deployment
- Mobile apps see new schema immediately (no versioning buffer)
- `npx convex dev` regenerates TypeScript types automatically
- Clients must handle `undefined` gracefully or will crash

**Impact**: Mobile apps will crash if they don't handle undefined values for new fields

**Fix**:
```typescript
// models/curated-routes.ts
export const CURATED_ROUTE_FIELDS = {
  // ... existing fields
  description: v.optional(v.string()),
  rating: v.optional(v.number()),
  // ... all new fields as v.optional()
}
```

### Issue #2.2: Missing Convex Table Definitions

**Problem**: RouteMention and AggregatedMention are defined as Python dataclasses but have no Convex table schema.

**Impact**:
- No audit trail for forum mentions
- Cannot recalculate if authority weights change
- No debugging data for NLP extraction errors
- Regulatory risk if scraping violates ToS

**Required Addition**:
```typescript
// convex/schema.ts - NEW TABLE
route_mentions: defineTable({
  roadName: v.string(),
  highwayNumber: v.optional(v.string()),
  state: v.optional(v.string()),
  sentimentScore: v.number(),
  attributes: v.record(v.number()),
  source: v.string(),
  sourceAuthority: v.number(),
  postUrl: v.string(),
  postScore: v.number(),
  mentionDate: v.number(),
  processedAt: v.number(),
  routeId: v.optional(v.id("curated_routes")),
})
  .index("by_routeId", ["routeId"])
  .index("by_source_and_date", ["source", "mentionDate"])
  .index("by_roadName_and_state", ["roadName", "state"]);
```

### Issue #2.3: No Geospatial Query Capability

**Problem**: Convex has no native geospatial queries (no `geoNear`, `geoWithin`, R-tree indexes).

**Proposed Dedup** (Stage 3):
- Centroid distance < 5km
- Length difference < 20%

**Required Workaround**:
```python
# Pre-compute geohash in pipeline
import geohash2
route.geohash6 = geohash2.encode(lat, lng, precision=6)  # ~1.2km x 0.6km

# In Convex: query by geohash prefix, filter by exact distance in JS
```

**OR**: Use PostGIS for dedup in pipeline, Convex only stores results.

---

## Finding #3: Unproven NLP Accuracy Claims

**Specialist**: nlp-expert
**Severity**: CRITICAL

### Issue #3.1: No Pilot Data Exists

**PRD Claims**:
- Regex road NER: 95%+ accuracy
- Keyword attribute classification: sufficient
- TextBlob/VADER sentiment: adequate
- 0.75 accuracy threshold with upgrade path to sentence-transformer

**Reality**: **Zero pilot extraction data exists** in codebase or `.spec` directory.

**Impact**: The 0.75 accuracy threshold has **no empirical basis**. The upgrade path is defined, but there's no data to trigger it.

### Issue #3.2: Regex 95%+ Claim is Overly Optimistic

**Challenges in Motorcycle Forum Vernacular**:
```
"rode the Dragon twice today" → Nickname (not in regex)
"hit the Gap and then the Dragon" → Multiple nicknames
"took 129 south from Knoxville" → Ambiguous (US-129? NC-129?)
"the Skyway was closed due to fog" → Nickname
```

**Estimated Real-World Accuracy**: 60-75%, not 95%+

**Required Validation**:
```python
# Pilot: 100 manually labeled forum posts
# Measure: regex precision/recall for highway number detection
# Expected: High precision (80%+), low recall (50-60%)
```

### Issue #3.3: Sentiment Analysis Inadequate

**TextBlob/VADER Limitations**:
- Trained on product reviews, not adventure riding discourse
- Misses sarcasm: "Great road if you like guardrail rash"
- Misses rider-specific sentiment: "technical" = positive for adventure riders

**Missing Attribute**: Surface type (paved/gravel/dirt/mixed) — critical for adventure riders, not in PRD.

### Recommended Pilot (1 Week)

**Scope**: 100 manually labeled forum posts
- 50 from ADVRider Regional Forums
- 50 from r/motorcycles

**Labels**:
1. Road/highway mentions (span extraction)
2. Attribute classifications (6 buckets)
3. Sentiment (positive/neutral/negative)
4. Ambiguity flags

**Success Criteria**:
- Regex road NER: precision > 80%, recall > 70%
- Attribute classification: F1 > 0.70 per bucket
- Sentiment: accuracy > 75%

---

## Finding #4: Quality Floor Impact Concerns

**Specialist**: quality-expert
**Severity**: CRITICAL

### Issue #4.1: Rejection Rate Estimate

**Quality Floor Criteria**: Routes must meet at least ONE of:
- description length > 100 characters, OR
- community_rating present, OR
- FHWA designation present, OR
- curvature score present

**Estimated Rejection**:
- Conservative: 25-30%
- Aggressive: 35-40%

**Impact**: A 25-40% reduction in catalog size is **NOT acceptable** for immediate production deployment.

### Recommended Phased Rollout

**Phase 1: Soft Floor (Weeks 1-2)**
- Apply quality floor but mark as `quality_tier: minimal` instead of rejecting
- Exclude `minimal` routes from featured/prominent positions
- Allow users to opt-in to see all routes
- Collect engagement metrics

**Phase 2: Hard Floor (Weeks 3-4)**
- Permanently exclude routes with 0 engagement in Phase 1
- Maintain `minimal` tier for routes with partial data

### Issue #4.2: Dedup Thresholds Too Permissive

**Problem**: Levenshtein threshold of 0.7 (70%) will produce false positives:
```
"Skyline Drive" vs "Skyline Boulevard" → ~0.75 (WRONG MATCH)
"Mountain Highway" vs "Mountain Valley Road" → ~0.72 (WRONG MATCH)
```

**Recommendation**:
- Stage 2: Increase to **0.85** for road names
- Stage 3: Use **0.75** (slightly lower with geospatial confirmation)
- Use `token_sort_ratio()` for word-order-insensitive matching

---

## Finding #5: Additional High-Priority Concerns

### 5.1: Reddit API Policy Risk

**Finding** (data-source-expert, nlp-expert):
- March 2026 moderator crackdown on bot activity
- API technically accessible but policy changes could break integration
- Bot detection may result in IP bans

**Mitigation**: Implement conservative rate limiting, monitor for policy changes, consider old.reddit.com scraping as fallback.

### 5.2: Naming Inconsistency

**Finding** (convex-architect):
- PRD uses `snake_case` (mention_frequency_score)
- Convex conventions use `camelCase` (compositeScore)
- Creates inconsistency in codebase

**Fix**: Use camelCase throughout: `mentionFrequencyScore`, `designationScore`, etc.

### 5.3: Authority Weights Unvalidated

**Finding** (nlp-expert):
```yaml
rider_magazine: 1.0
advrider: 0.6
reddit_r_motorcycles: 0.4
```

**Problem**: Authority weights are assumed, not validated. No research supports these specific values.

**Validation Required**:
- Survey riders on which sources they trust
- Test sensitivity: how much do rankings change if weights are ±0.2?

### 5.4: Geographic Coverage Bias

**Finding** (nlp-expert):
- Community sources skew toward popular riding areas (Rockies, PNW, Northeast)
- Sparse coverage: Alaska, Latin America, Africa/ME
- Routes in popular areas will have inflated mention_frequency
- Routes in sparse areas will be unfairly penalized

**Mitigation**:
- Geographic normalization: divide mention frequency by regional post volume
- Floor value: routes with < 5 mentions get baseline mention_frequency = 0.01
- Explicit flag: `low_signal_confidence` for routes with < 10 mentions

---

## Cross-Team Insights

### Convergence Points

**All 4 specialists agreed on**:
1. ✅ Three-stage dedup strategy is sound (with threshold tuning)
2. ✅ R-tree spatial index will perform well at 20k scale
3. ✅ US Scenic Byways GIS, ADVRider RSS, USFS MVUM are HIGH confidence
4. ⚠️ Quality floor requires phased rollout
5. ⚠️ Calibration gate is critical enforcement mechanism

### Divergent Perspectives

**data-source-expert vs. nlp-expert on ADVRider**:
- data-source-expert: HIGH confidence (RSS feeds work)
- nlp-expert: MEDIUM confidence (only 1 parent feed, not 17 section feeds)

**Resolution**: Both correct — RSS is accessible but requires geographic post-filtering.

**convex-architect vs. quality-expert on dedup**:
- convex-architect: Geospatial queries impossible in Convex
- quality-expert: R-tree will perform well (in Python pipeline)

**Resolution**: Both correct — R-tree works in pipeline, but Convex needs geohash workaround.

---

## Recommended Implementation Plan

### Pre-Implementation (Must Complete First)

**Week 0: Validation & Planning**
1. ✅ **Source Verification**:
   - Live test BDR GPX availability (ridebdr.com)
   - Comprehensive twtex.com research (feasibility, legal/ToS)
   - Document findings in `.spec/research/data-sources/`

2. ✅ **NLP Pilot** (1 week):
   - Label 100 forum posts with ground truth
   - Implement regex road NER + keyword extraction
   - Measure actual accuracy
   - Decision: stay with regex OR upgrade to sentence-transformer

3. ✅ **Convex Schema Design**:
   - Define RouteMention table schema
   - Fix nullable field strategy (client compatibility)
   - Design geohash workaround for geospatial queries
   - Add all indexes for new query patterns

### Implementation (Revised Timeline)

**Week 1-2: Source Diversification (Phase 1 Only)**
- US Scenic Byways GIS ingestion
- ADVRider RSS ingestion (with geographic post-filtering)
- USFS MVUM ingestion
- **DO NOT**: BDR GPX or twtex.com (blocked until verified)

**Week 2-3: Quality Infrastructure (Soft Floor)**
- Three-stage dedup (with corrected thresholds: 0.85, 0.75)
- R-tree spatial index implementation
- Quality floor filter (soft phase: mark as `minimal`, don't reject)
- Coverage validation report

**Week 3-4: Scoring & Calibration**
- Composite score weight realignment
- Ground truth dataset construction (Rider Mag + FHWA)
- Calibration gate enforcement (80% threshold)
- Per-archetype calibration

**Week 4-5: Community Sources (Conditional)**
- **ONLY IF pilot accuracy > 75%**:
  - ADVRider NLP extraction pipeline
  - Reddit API ingestion
  - Mention aggregation
  - Community signal merge

**Week 5-6: Hard Floor & Polish**
- Analyze soft floor metrics
- Implement hard floor for no-engagement routes
- Performance testing at 20k+ routes
- Documentation and runbooks

---

## Gaps & Caveats

### Information Gaps

1. **BDR GPX availability**: Unknown until live verification
2. **twtex.com scraping feasibility**: Unknown until comprehensive research
3. **NLP accuracy**: Unknown until pilot data collected
4. **Quality floor rejection rate**: Estimated, not measured
5. **Convex geospatial query performance**: Untested with geohash workaround

### Assumptions Made

1. RapidFuzz can process 10,000+ string comparisons/second (reasonable but untested)
2. R-tree index build time is 1-2 seconds for 20k routes (reasonable but untested)
3. TextBlob/VADER sentiment accuracy > 75% (unproven)
4. Authority weights (rider_magazine: 1.0, advrider: 0.6) are correct (unvalidated)
5. 80% calibration threshold is achievable (untested)

---

## Recommended Next Steps

### Immediate (This Week)

1. **BLOCK BDR GPX and twtex.com** until verification complete
2. **Build NLP pilot** (100 labeled posts) — allocate 1 week
3. **Design Convex schema** for RouteMention table and geohash workaround
4. **Soft floor commitment**: Document phased rollout plan

### Before Implementation

5. **Complete source verification** for BDR GPX and twtex.com
6. **Measure NLP accuracy** on pilot data
7. **Fix Convex schema strategy** (nullable fields, table definitions)
8. **Tune dedup thresholds** (0.85 for Stage 2, 0.75 for Stage 3)

### During Implementation

9. **Monitor Reddit API policy changes**
10. **Add geographic normalization** for mention frequency
11. **Implement source provenance tracking** (field-level)
12. **Add surface type attribute** to NLP extraction

---

## Conclusion

The Curation Pipeline Hardening PRD has a **sound architectural foundation** but contains critical gaps that must be addressed before implementation:

**Strengths**:
- ✅ Four-layer hardening approach is well-structured
- ✅ Three-stage dedup strategy is appropriate (with threshold tuning)
- ✅ 3 of 6 new sources are research-backed and HIGH confidence
- ✅ Calibration gate enforcement is critical and necessary

**Critical Blockers**:
- ❌ 2 sources (BDR GPX, twtex.com) have zero research validation
- ❌ Convex architecture claims are incorrect (non-breaking, missing tables)
- ❌ NLP accuracy claims are unproven (no pilot data)
- ❌ Quality floor will reject 25-40% of catalog (requires phased rollout)

**Overall Assessment**: **CONDITIONAL APPROVAL**

Implement the 5 critical fixes and 8 high-priority concerns, then proceed with confidence. The 6-week timeline is realistic IF the validation work (NLP pilot, source verification) is completed first.

---

## Appendices

### A. Deliverable Files

1. `source-validation-report.md` — Data source validation against research reality
2. `nlp-feasibility-report.md` — NLP extraction feasibility and accuracy assessment
3. `convex-architecture-review.md` — Convex backend architecture review
4. `quality-infrastructure-assessment.md` — Quality floor and dedup impact assessment

### B. Research References

- `.spec/research/CHANNELS.md` — Forum access patterns, bot readability
- `.spec/research/data-sources/us-roadway-datasets.md` — US government data sources
- `.spec/research/data-sources/CHANNELS.md` — Data source access patterns
- `.spec/prds/curation-hardening/` — Full PRD documentation

### C. Questions for User

1. **BDR GPX**: Should we proceed with live verification or defer to Phase 2?
2. **twtex.com**: Should we invest in comprehensive research or drop this source?
3. **NLP Pilot**: Can we allocate 1 week for pilot extraction before committing to AD-002?
4. **Quality Floor**: Is the phased rollout (soft → hard) acceptable?
5. **Convex Schema**: Should RouteMention be persisted (audit trail) or in-memory only?
6. **Geospatial Queries**: Accept geohash approximation (±1km) or invest in PostGIS?

---

**Report Prepared By**: Orchestrator (curation-hardening-expert-review team)
**Date**: 2026-04-12
**Team Members**: data-source-expert, nlp-expert, convex-architect, quality-expert
**Next Review**: After pilot validation and source verification complete
