---
date: 2026-04-12
type: revenue-validation
method: revenue-validate-v2
governance: strict
verdict: NO-GO
governed_score: 18
raw_score: 48
evidence_penalty: -30
agents_used: 7
holocron_id: js71dbw0c9vgrrwgr6w28dqqwd84pje1
---

# Revenue Validation: LaneShadow V1

**DVF Score**: 18/100 governed (48/100 raw) | Penalty: -30 (cap) | Hard cap: YES (5 T4 load-bearing)
**Verdict**: NO-GO (evidence quality driven — business structurally viable at $113/mo burn)

---

## Executive Summary

LaneShadow is a motorcycle-specific AI route planner (Expo + Convex, MVP stage) targeting 5.4M US cruiser and touring riders in a market estimated at $420M-$600M globally. The competitive field is active (10 direct competitors, $32-$65/yr pricing) and declining new motorcycle sales (-9.2% H1 2025) create headwinds for new-rider acquisition. The unit economics are structurally promising under optimistic assumptions — 80% gross margin, $113/mo burn — but collapse to an inverted 0.48:1 LTV:CAC ratio when the five T4 input assumptions are replaced with T2 benchmarks. The single most important action is: do not spend money on paid acquisition until real willingness-to-pay and organic growth data are in hand. The business is genuinely low-risk to run (solo founder, near-zero burn) but is not yet validated for revenue; it needs three things before it can reach CAUTION or GO: payment infrastructure, 10+ Mom Test interviews, and a smoke-test to confirm $24.99/yr resonates.

---

## DVF Scorecard

| Dimension | Score | Weight | Weighted | Key Driver |
|-----------|-------|--------|----------|------------|
| Desirability | 6/10 | 35% | 21.0 | Proven market demand (10 competitors active) offset by declining new registrations and weakened NLP differentiation |
| Viability | 3/10 | 40% | 12.0 | Unit economics invert under corrected assumptions; no payment infrastructure; breakeven unreachable in nightmare scenario |
| Feasibility | 6/10 | 25% | 15.0 | Genuine tech moat (7/10) but MVP-stage, missing offline maps table-stakes, and zero monetization code |
| **Composite (Raw)** | | | **48/100** | **CAUTION (raw)** |
| Evidence Penalty | | | -30 | 5 T4 load-bearing claims; hard cap applied |
| **Composite (Governed)** | | | **18/100** | **NO-GO** |

---

## Key Numbers

| Metric | Value | Confidence |
|--------|-------|------------|
| US registered motorcycles | 8.79M (5.4M target segment) | T1 (IIHS) |
| Global motorcycle nav software market | $420M-$600M | T3 (4+ analyst consensus) |
| SAM (US-focused) | $180M | T3 (derived) |
| SOM Year 1-3 | $8.5M-$15.2M | T3 (assumption) |
| Competitors identified | 10 (6 direct, 3 indirect, 1 substitute) | T2 |
| Competitor median price | $55-60/yr | T1 (pricing pages) |
| Recommended price | $24.99/yr (57% below median) | T3 |
| LTV (base / corrected) | $28.34 / $14.00 | T3 / T4-corrected |
| CAC (base / corrected) | $15 / $40 | T3 / T3 |
| LTV:CAC (base / corrected) | 1.89:1 / 0.48:1 | YELLOW / RED |
| Monthly burn | $113 | T1 |
| Breakeven | 55-70 paying subscribers | T2 |
| Base Y1 | 292 subs, $9.3K ARR | T3 |
| Base Y3 | 1,311 subs, $41.8K ARR | T3 |

---

## Evidence Scorecard

| Tier | Claims | % | Status |
|------|--------|---|--------|
| T1: Validated | 4 | 13% | GREEN |
| T2: Benchmarked | 8 | 26% | YELLOW |
| T3: Estimated | 9 | 29% | ORANGE |
| T4: Assumed | 10 | 32% | RED |

Boolean decomposition: 43 questions | 19% HIGH confidence | 53% NONE

---

## Adversarial Review

Claims challenged: 21 | Survived: 7 | Contradicted: 4 | Uncorroborated: 7 | Inflated: 3

Key contradictions:
- **ThrottleMap** uses GPT-4o for NLP motorcycle trip planning (weakens NLP uniqueness claim)
- **Scenic** is now cross-platform iOS + Android since Spring 2024 (prior assumption was iOS-only)
- **Motobit** review count overcounted 20x (~5K actual, not 100K+)
- **Calimoto** user count contradictory (company claims 1M and 3M in different places)

Internal contradiction: Model uses 5.5%/mo churn but T2 annual retention (33.9%) implies 8.1%/mo

---

## Financial Model Summary

### Revenue Model
- Freemium: 5 free plans/month, Pro = unlimited
- Price: $24.99/yr annual (primary), $3.99/mo monthly (secondary)
- Blended ARPU: $2.66/mo (70% annual, 30% monthly)

### Cost Structure (Solo Founder + AI Coding Agents)
- Engineering labor: $0/mo (sweat equity + AI coding agents)
- Infrastructure: $105/mo (Convex $25, LLM inference $50, Google APIs $10, Weather $20)
- App Store fee: $8/mo
- **Total monthly burn: $113/mo**
- Platform fee: 30% Y1, 15% Y2+ (Apple Small Business Program)

### Unit Economics

| Metric | Base | Conservative | Optimistic | Corrected (Strict) |
|--------|------|-------------|-----------|-------------------|
| LTV (post-platform) | $28.34 | $19.61 | $44.83 | $19.07 |
| CAC | $15 | $25 | $5 | $40 |
| LTV:CAC | 1.89:1 | 0.78:1 | 8.97:1 | 0.48:1 |
| CAC Payback | 7.1 mo | 14.1 mo | 2.4 mo | 25.9 mo |
| Monthly churn | 5.5% | 8.0% | 3.5% | 8.1% |

### Revenue Scenarios

| Scenario | MRR Month 12 | ARR Y1 Run Rate | Customers Mo12 | ARR Y3 Run Rate |
|----------|-------------|----------------|----------------|----------------|
| Conservative | $46/mo | $552 | 22 | $768 |
| Base | $777/mo | $9,324 | 292 | $41,847 |
| Optimistic | $4,621/mo | $55,452 | 1,359 | $624,564 |
| Nightmare | $24/mo | ~$290 | ~9 | Not reached |

### Standard Deviations

| Metric | Mean (u) | Std Dev (o) | 95% CI |
|--------|----------|-------------|--------|
| LTV | $27.26 | $8.43 | $10.40 - $44.12 |
| LTV:CAC | 1.81:1 | 1.25 | 0:1 - 4.31:1 |
| MRR Month 12 | $912/mo | $1,184/mo | Right-skewed; floor ~$24 |
| Breakeven months | 24.8 | 19.1 | Not reached - 24 months |

### Verdict-Flipping Variables

| Variable | Base | Worst Case | Impact | Flips Verdict? |
|----------|------|-----------|--------|---------------|
| CAC | $15 | $40 | LTV:CAC 1.89 to 0.48 | YES |
| Growth rate | 12%/mo | 5%/mo | Never reach breakeven | YES |
| Monthly churn | 5.5% | 8.1% | LTV:CAC 1.89 to 1.29 | YES |
| Freemium conversion | 2.5% | 1.0% | Subs -60% | NO alone |
| ARPU | $2.66/mo | $2.67/mo | Negligible | NO |

---

## Risks

| # | Severity | Risk | Mitigation |
|---|----------|------|------------|
| 1 | BLOCKER | No payment infrastructure — revenue is impossible | Integrate RevenueCat in 1 sprint |
| 2 | BLOCKER | LTV:CAC inverts at corrected assumptions — paid acquisition loses money | Validate organic CAC with real experiments before spending |
| 3 | WARNING | Offline maps gap vs 8/10 competitors | Build offline tiles using existing PMTiles infrastructure |
| 4 | WARNING | Declining new motorcycle sales (-9.2% H1 2025) | Target existing experienced riders, not new buyer funnel |
| 5 | MONITOR | NLP differentiation weakened by ThrottleMap/Komoot | Reframe around per-segment weather + architecture moat |

---

## Competitive Corrections

| Prior Assumption | Correction | Impact |
|-----------------|-----------|--------|
| "No competitor has NLP routing" | ThrottleMap uses GPT-4o; Komoot has ChatGPT integration (Feb 2026) | Must scope to "no major established player" — not absolute uniqueness |
| "Scenic is iOS-only" | Scenic launched Android Spring 2024 | Removes platform advantage; Scenic is now cross-platform competition |
| Calimoto "1M+ users" | Now claims "3M+" on website; neither figure independently verified | Cannot use competitor scale in market sizing without independent data |
| Motobit "100K+ reviews" | Actually ~5K reviews (AppBrain/chrome-stats) | Motobit is smaller than initially assessed |

---

## Feature Recommendations to Improve Revenue Score

### P1 — Revenue Prerequisite (Removes BLOCKER)

**RevenueCat Integration + Paywall UI**
- Integrate RevenueCat SDK (iOS IAP + Android Play Billing); build paywall at 5-plan limit
- DVF impact: Removes the BLOCKER making revenue impossible; enables conversion data (T4 to T3/T2)
- Effort: 1-2 sprints

### P2 — Retention (Reduces Churn, Improves LTV)

**Offline Map Tiles**
- Pre-download regional tiles for offline rendering via existing PMTiles infrastructure
- Closes largest table-stakes gap (8/10 competitors have this); improves Feasibility 6 to 7
- Estimated churn reduction: 1-2%/mo
- Effort: 2-3 sprints

**Ride History + Post-Ride Rating**
- Pull forward Phase 3 (route rating, notes, history browser)
- Each annotated ride = switching cost; 30%+ users rating 5+ routes improves retention
- Effort: 2-3 sprints

### P3 — Conversion (Improves Freemium-to-Paid Rate)

**Contextual Paywall Triggers**
- Trigger at high-value moments: favorite road inclusion, route export, 7-day weather forecast
- Contextual paywalls convert 3-5x better than limit-based gates
- Creates multiple T2-quality conversion data points within 30 days

**Annual Price Anchoring UI**
- Display "$2.08/mo" alongside "$3.99/mo" with "Save 47%" anchoring; default to annual
- Annual subscribers retain 2.5x better than monthly (33.9% vs 13.8% Y1 retention)
- Effort: Low (UI change only)

### P4 — Differentiation (Protects Moat)

**Weather Alert Push Notifications**
- Morning of saved ride: "Your Sunday route has 25mph headwinds starting at 10am"
- No competitor can do this at per-segment accuracy; Pro-only feature
- Creates measurable engagement signal (push open rate >40% = strong PMF evidence)

**Favorite Roads Auto-Inclusion Engine**
- Complete Phase 2 favorite roads with AI-driven inclusion in route planning
- 20+ saved roads = meaningful switching cost, directly reduces churn
- Partially built in backend (getUserFavorites tool exists)

### P5 — Business Model Evolution

**B2B Tour Operator Tier ($199-$499/yr)**
- 1 B2B sale = ~12 individual Pro subs; 50 operators = $15K ARR with zero consumer CAC
- Validate: Contact 10 operators, 3/10 interest = viable signal

**Affiliate Gear Partnerships**
- Contextual gear recs in weather overlays (RevZilla, Cycle Gear affiliate programs)
- $1-3/user/yr improves blended ARPU 20-50% at $24.99 base price

---

## Validation Experiments (Path from NO-GO to CAUTION)

| # | Assumption | Tier | Experiment | Success Criteria | Timeline |
|---|-----------|------|-----------|-----------------|----------|
| 1 | WTP at $24.99/yr | T4 | Van Westendorp survey, 20+ riders from ADVRider/HOG | "Too expensive" threshold above $20 | 2 weeks |
| 2 | Organic CAC $15 | T4 | Post in ADVRider + 2 FB groups with TestFlight link | 20+ installs; calculate real time-cost | 2 weeks |
| 3 | Freemium conversion 2-3% | T4 | Activate freemium gate after RevenueCat; track first 100 users | >2% conversion within 60 days | 60 days post-launch |
| 4 | Growth rate 12%/mo | T4 | 90-day organic experiment (forums, ASO, no paid) | >8% MoM growth = viable | 90 days |
| 5 | Churn 5.5%/mo | T3 | Measure actual churn after 50+ paying subs, 3 cohorts | <6%/mo = base model holds | 90 days |
| 6 | GPS adoption 50-78% | T3 | 5-question survey in 3 motorcycle communities, 100+ responses | >50% use dedicated nav app | 2 weeks |

If 3 of 5 experiments validate positively, governed DVF could reach 45-60 (CAUTION).

---

## Methodology

7-agent pipeline (rv-code-analyzer, rv-market-sizer, rv-competitor-scanner, rv-claim-challenger, rv-financial-modeler, rv-model-stress-tester, rv-synthesizer) with strict evidence governance. Full report stored in holocron (js71dbw0c9vgrrwgr6w28dqqwd84pje1).

### Data Quality

| Artifact | Quality |
|----------|---------|
| Code Analysis | HIGH (codebase directly read) |
| Market Sizing | MEDIUM (TAM has 4+ sources; GPS adoption uncorroborated) |
| Competitor Scan | MEDIUM (pricing T1; user counts unavailable) |
| Claim Challenge | HIGH (methodology sound) |
| Financial Model | LOW (5 key inputs T4; churn contradiction) |
| Stress Test | HIGH (correctly identifies inversions) |
