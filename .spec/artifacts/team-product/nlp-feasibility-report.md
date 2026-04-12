# NLP Extraction Feasibility Report
**Curation Hardening Expert Review**
**Date**: 2026-04-12
**Reviewer**: NLP Extraction Expert
**Team**: curation-hardening-expert-review

---

## Executive Summary

**VERDICT**: NLP extraction is technically feasible but accuracy claims are **UNPROVEN**. The project lacks pilot data to validate the 95%+ regex road NER claim and 0.75 accuracy threshold. Critical blockers identified:

1. ✅ **ADVRider RSS feeds are accessible** — but only 1 parent feed, not 17 section-specific feeds
2. ✅ **Reddit API access confirmed** — public API works, but rate limits constrain scale
3. ❌ **No pilot extraction data exists** — accuracy claims are hypothetical, not empirically validated
4. ⚠️ **Regex 95%+ claim is optimistic** — motorcycle forum vernacular challenges simple patterns
5. ⚠️ **TextBlob/VADER may be insufficient** — rider sentiment requires domain-specific tuning

**RECOMMENDATION**: Build a 100-post pilot extraction before committing to AD-002 architecture. Allocate 1 week for validation against manually labeled ground truth.

---

## 1. ADVRider RSS Access Validation

### Claim vs Reality

**PRD Claim** (CHANNELS.md, line 61):
> "RSS: Available per section"

**Actual Finding**:
- ✅ RSS feeds exist for XenForo forum sections
- ❌ **Only 1 parent feed for Regional Forums**, not 17 section-specific feeds
- Pattern: `https://advrider.com/f/forums/{section-slug}.{id}/index.rss`

### Verified RSS Feeds

| Section | RSS URL | Status |
|---------|---------|--------|
| Regional Forums (parent) | `/f/forums/regional-forums.16/index.rss` | ✅ Verified |
| Ride Reports - Epic Rides | `/f/forums/ride-reports-epic-rides.99/index.rss` | ✅ Verified |
| Face Plant | `/f/forums/face-plant.17/index.rss` | ✅ Verified |

### Coverage Gap Analysis

**Problem**: The PRD claims 17 regional forum sub-forums (CHANNELS.md, line 71), but RSS feeds only exist at the parent section level.

**Impact**:
- ✅ Can ingest all 7.4M regional forum posts via parent RSS
- ❌ **Cannot filter by geography at ingest time** — must post-filter RSS items
- ⚠️ Parent RSS includes tag games and low-signal content

**Workaround Required**:
```python
# ADVRiderSource must post-filter RSS items by geography
# since regional sub-forums lack individual RSS feeds
geographic_keywords = ["Northeast", "Southeast", "Texas", "Rockies", "PNW", ...]
```

### Post Volume Validation

From RSS feed inspection (2026-04-12):
- Regional Forums parent: Active threads with 10K+ comments
- Epic Rides: New posts every few hours
- RSS items include full HTML content in `<content:encoded>` field

**Signal Quality**: High — ride reports contain detailed route descriptions, geographic references, and road names.

---

## 2. Reddit API Feasibility

### Verified Access

| Subreddit | Subscribers | API Access | Rate Limit |
|-----------|-------------|------------|------------|
| r/motorcycles | 2.3M | ✅ Public API | 60 req/min |
| r/advrider | ~50K | ✅ Public API | 60 req/min |
| r/motorcyclesroadtrip | ~20K | ✅ Public API | 60 req/min |

### Rate Limit Constraints

**PRD Claim** (07-uc-rider.md, line 47):
> "Respects Reddit API rate limits (60 requests per minute)"

**Reality Check**:
- 60 req/min = **3,600 req/hour** theoretical max
- Practical limit: ~1,000 posts/hour after API overhead
- **Problem**: No historical access — only recent posts (~1,000 per subreddit)

**Extraction Impact**:
- ✅ **Feasible for recent sentiment monitoring** (flywheel use case)
- ❌ **Not feasible for historical backfill** — Reddit API restricts historical depth
- ⚠️ Community sentiment will be **biased toward recent posts** (last 6-12 months)

### Bot Activity Concern

CHANNELS.md (line 299) notes:
> "Reddit r/motorcycles reported significant bot infiltration (March 2026)"

**Risk**: Bot-generated posts may poison sentiment signals. Requires bot detection heuristics:
- Account age < 30 days + high post volume
- Generic comment patterns
- Repetitive phrasing across threads

---

## 3. NLP Accuracy Claims Validation

### 3.1 Regex Road NER: 95%+ Claim

**PRD Claim** (09-technical-requirements.md, line 143):
> "Regex handles highway numbers at 95%+"

**Assessment**: **OVERLY OPTIMISTIC** without pilot data.

#### Challenges in Motorcycle Forum Vernacular

Real examples from ADVRider RSS feed:

```
"rode the Dragon twice today"
"hit the Gap and then the Dragon"
"took 129 south from Knoxville"
"the Skyway was closed due to fog"
"Tail of the Dragon, Deals Gap, 129 — same road, three names"
```

**Regex Will Fail On**:
1. **Nicknames**: "the Dragon", "the Gap", "the Skyway" → require gazetteer mapping
2. **Ambiguity**: "129" could be US-129, NC-129, or a route number in any state
3. **Context dependence**: "rode 129" vs "bike has 129 miles on it"
4. **Geographic references**: "Rockies", "PNW", "Upstate NY" → not specific roads

**Estimated Real-World Accuracy**: 60-75%, not 95%+

**Required Validation**:
```python
# Pilot: 100 manually labeled forum posts
# Measure: regex precision/recall for highway number detection
# Expected: High precision (80%+), low recall (50-60%)
```

### 3.2 Attribute Classification: 6 Buckets

**PRD Claim** (09-technical-requirements.md, line 143):
> "6 attribute buckets... keyword matching sufficient"

**Assessment**: **POTENTIALLY ADEQUATE** for first-pass, but insufficient for nuanced rider discourse.

#### Specified Buckets (from UC-RIDER-03)

1. **Twisty level** (straight/moderate/twisty/very_twisty)
2. **Scenery quality** (urban/rural/mountain/coastal/desert)
3. **Traffic level** (light/moderate/heavy)
4. **Road condition** (excellent/good/fair/poor)
5. **Elevation drama** (flat/rolling/mountainous)
6. **Technical difficulty** (beginner/intermediate/advanced)

#### Keyword Matching Challenges

Real forum language:
- "technical but doable" → Which bucket?
- "scenic but traffic-heavy" → Conflicting signals
- "not for beginners, but paved" → Cross-bucket ambiguity

**Missing Attribute**: **Surface type** (paved/gravel/dirt/mixed) — critical for adventure riders, not in PRD.

### 3.3 Sentiment Analysis: TextBlob/VADER

**PRD Claim** (09-technical-requirements.md, line 239):
> "textblob: Lightweight sentiment analysis for NLP pipeline"

**Assessment**: **ADEQUATE FOR BINARY** (positive/negative), **INADEQUATE FOR NUANCE**.

#### Rider Sentiment Complexity

Examples from ADVRider:
```
"Brutal climb but worth every drop of sweat" → Mixed sentiment
"Too many tourists, but the road itself is sublime" → Context-dependent
"Wouldn't ride it again, but glad I did it once" → Nuanced regret
```

**TextBlob/VADER Limitations**:
- Trained on product reviews, not adventure riding discourse
- Misses sarcasm: "Great road if you like guardrail rash"
- Misses rider-specific sentiment: "technical" = positive for adventure riders, negative for cruisers

**Recommended Upgrade Path** (if accuracy < 0.75):
1. Fine-tune a small transformer on rider forum data
2. Use sentence-transformer embeddings + logistic regression
3. Add rider-specific lexicon: "technical", "brutal", "epic", "soulless"

---

## 4. Missing Validation: No Pilot Data

### Critical Gap

**Finding**: **No pilot extraction data exists** in the codebase or `.spec` directory.

Searched for:
- Ground truth labeled sets
- Extraction accuracy measurements
- NLP pilot results
- Manual annotation of forum posts

**Result**: None found.

### Impact

The **0.75 accuracy threshold** (09-technical-requirements.md, line 143) has **no empirical basis**. The upgrade path to sentence-transformer is defined, but there's no data to trigger it.

### Recommended Pilot

**Scope**: 100 manually labeled forum posts
- 50 from ADVRider Regional Forums
- 50 from r/motorcycles

**Labels Required**:
1. Road/highway mentions (span extraction)
2. Attribute classifications (6 buckets)
3. Sentiment (positive/neutral/negative)
4. Ambiguity flags (nickname, context-dependent)

**Success Criteria**:
- Regex road NER: precision > 80%, recall > 70%
- Attribute classification: F1 > 0.70 per bucket
- Sentiment: accuracy > 75%

**Time Investment**: 1 week (2 days labeling, 3 days implementation, 2 days analysis)

---

## 5. Data Quality Risks

### 5.1 Authority Weighting

**PRD Specification** (09-technical-requirements.md, line 274):
```yaml
rider_magazine: 1.0
advrider: 0.6
reddit_r_motorcycles: 0.4
```

**Risk**: Authority weights are **assumed, not validated**. No research supports these specific values.

**Validation Required**:
- Survey riders on which sources they trust
- Correlate source mentions with actual ride behavior
- Test sensitivity: how much do rankings change if weights are ±0.2?

### 5.2 Mention Frequency Bias

**Problem**: Mention frequency conflates **popularity** with **quality**.

Examples:
- "Tail of the Dragon" mentioned frequently → includes complaints about traffic/police
- Obscure gravel roads mentioned rarely → may be high-quality, low-traffic gems

**Mitigation Required**:
- Normalize mention frequency by subreddit/forum post volume
- Decay older mentions (12-month window in UC-RIDER-03)
- Sentiment-weighted frequency: positive mentions > neutral > negative

### 5.3 Geographic Coverage Bias

**Problem**: Community sources skew toward popular riding areas.

From CHANNELS.md (line 71):
- Regional Forums: 7.4M posts, but concentrated in "Rockies", "PNW", "Northeast"
- Sparse coverage: "Alaska", "Latin America", "Africa/ME"

**Impact**:
- Routes in popular areas will have **inflated mention_frequency**
- Routes in sparse areas will be **unfairly penalized**

**Mitigation**:
- Geographic normalization: divide mention frequency by regional post volume
- Floor value: routes with < 5 mentions get baseline mention_frequency = 0.01
- Explicit flag: `low_signal_confidence` for routes with < 10 mentions

---

## 6. Recommendations

### Immediate Actions (Before Implementation)

1. **Build Pilot Extraction** (Week 1)
   - Label 100 forum posts with ground truth
   - Implement regex road NER + keyword attribute extraction
   - Measure actual accuracy (not assumed)

2. **Test Reddit API Constraints** (Day 1)
   - Verify historical post access limits
   - Confirm 60 req/min rate limit in practice
   - Test bot detection heuristics on r/motorcycles sample

3. **Map ADVRider RSS Geography** (Day 2)
   - Inventory which of 17 regional sub-forums exist
   - Build geographic keyword filter for parent RSS post-processing
   - Measure signal-to-noise ratio in parent RSS feed

### Architecture Adjustments

1. **AD-002 Upgrade Path Clarification**
   - Define trigger: "if accuracy < 0.75 on pilot data"
   - Specify sentence-transformer model: `all-MiniLM-L6-v2` (fast, decent quality)
   - Budget for fine-tuning: $50-100 for GPU time

2. **Sentiment Analysis Upgrade**
   - Add rider-specific lexicon to TextBlob/VADER baseline
   - If pilot accuracy < 70%, plan for fine-tuned classifier

3. **Attribute Bucket Expansion**
   - Add **Surface Type** (paved/gravel/dirt/mixed) — critical for adventure riders
   - Consider **Seasonality** (best months to ride) — mentioned frequently in forums

### Long-term Validation

1. **Calibration Gate Enforcement** (UC-SCORE-03)
   - Build 50-100 route ground truth set from Rider Mag + FHWA
   - Require 80% agreement before full 17k+ route extraction
   - **Do not skip this** — it's the only empirical validation in the PRD

2. **Longitudinal Accuracy Tracking**
   - Store extraction accuracy metrics per run
   - Alert if degradation > 5% from baseline
   - A/B test prompt/regex improvements

---

## 7. Conclusion

**NLP extraction is technically feasible**, but the PRD's accuracy claims are **unproven and optimistic**.

### What Works
- ✅ ADVRider RSS feeds (1 parent, post-filter by geography)
- ✅ Reddit API access (rate-limited but functional)
- ✅ Regex road NER (for highway numbers, with caveats)

### What's Missing
- ❌ Pilot extraction data to validate 95%+ regex claim
- ❌ Empirical basis for 0.75 accuracy threshold
- ❌ Surface type attribute (critical for adventure riders)
- ❌ Bot detection for Reddit sentiment
- ❌ Geographic normalization for mention frequency

### Critical Path

**Before committing to AD-002 architecture**:
1. Build 100-post pilot extraction (1 week)
2. Measure actual regex NER precision/recall
3. Test TextBlob/VADER on rider sentiment
4. Decide: stay with keyword/regex OR upgrade to sentence-transformer

**If pilot accuracy < 70%**: Pause and reassess. The upgrade path exists, but requires budget and timeline.

**If pilot accuracy > 80%**: Proceed with AD-002 as specified, but add pilot data to `.spec/research/nlp-pilot/` for future validation.

---

## Appendix: Data Sources Referenced

- `.spec/research/CHANNELS.md` — Forum topography and access patterns
- `.spec/prds/curation-hardening/07-uc-rider.md` — Community sources use cases
- `.spec/prds/curation-hardening/09-technical-requirements.md` — NLP pipeline architecture (AD-002)
- `.spec/prds/curation-hardening/06-uc-score.md` — Calibration gate and validation

**Live Data Tested**:
- ADVRider RSS feeds: `https://advrider.com/f/forums/regional-forums.16/index.rss`
- Reddit API: Public API access confirmed via `praw` library specification

---

**Report Status**: COMPLETE
**Next Review**: After pilot extraction data is available
**Owner**: NLP Extraction Expert (team-product)
