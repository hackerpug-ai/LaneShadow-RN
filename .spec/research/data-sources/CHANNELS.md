# Motorcycle Rider Research Channels Classification

**Document ID**: `js74eh1rpt77g444tk96ty8xzx84me9c` (holocron)  
**Last Updated**: 2026-04-11  
**Confidence**: HIGH

---

## Channel Classification Matrix

### Tier 1: Primary Signal Sources (Direct Access ✅)

| Channel | Type | Access | Scrapeability | Data Freshness | Signal Quality | Best For |
|---------|------|--------|---|---|---|---|
| **ADVRider** | Forum | Public | ✅ High | Real-time | **VERY HIGH** | Adventure/touring rider insights, technical depth |
| **Motorcycle.com** | Forum | Public | ✅ High | Real-time | **HIGH** | General rider sentiment, gear discussions |
| **HD Forums** | Forum | Public | ⚠️ Cloudflare blocked | Real-time | **HIGH** | Harley-Davidson community, cruiser culture |
| **r/motorcycle** | Reddit | Public | ✅ High | Real-time | **HIGH** | Fast consensus, trending topics, new riders |
| **r/motorcycles** | Reddit | Public | ✅ High | Real-time | **HIGH** | Alternative culture, younger demographic |

### Tier 2: Validation Sources (B2B/Paid Access)

| Channel | Type | Access | Data Volume | Confidence | Best For |
|---------|------|--------|---|---|---|
| **MIC RideReport** | Industry Panel | B2B Subscription | Weekly reports | **HIGH** | Market trends, industry benchmarks |
| **EPG MyVoiceRewards** | Consumer Panel | B2B Subscription | 2,242+ respondents | **HIGH** | Purchase behavior, spending patterns |
| **CSM Research** | Market Research | B2B Subscription | Survey data | **MEDIUM-HIGH** | Post-purchase satisfaction, reliability trends |

### Tier 3: Secondary Sources (Emerging/Niche)

| Channel | Type | Access | Potential | Notes |
|---------|------|--------|---|---|
| **Discord servers** | Community | Invite-only | Medium | Emerging rider communities, younger demographic |
| **Bike-specific forums** | Forum | Public | Medium | Brand/model-specific (KTM, BMW, Harley silos) |
| **Local Rider Groups** | Facebook | Public/Private | Low | Regional signal, grassroots insights |

---

## Scraping Capabilities

### ✅ Fully Scrapable (Jina-Compatible)

- **ADVRider**: Forum structure accessible, discussion threads readable, links extractable
- **Motorcycle.com**: Thread index readable, post content accessible
- **Reddit**: API-friendly, voting/comments visible, search functional
- **MIC**: Public statistics page readable, reports require login

### ⚠️ Partially Scrapable

- **HD Forums**: Cloudflare blocks automated access (IP banned in testing)
- **Local Facebook groups**: Login required, Terms of Service restrict scraping

### ❌ Not Scrapable (Auth/Terms)

- **Premium research panels**: Paywalled, API restricted
- **Paid research reports**: Copyright restricted

---

## Recommended Scraping Strategy for LaneShadow

### Phase 1: Primary Sources (Week 1-2)
- **Target**: ADVRider + r/motorcycle + Motorcycle.com
- **Frequency**: Daily snapshot ingestion
- **Data captured**: Thread titles, post counts, user sentiment (votes/engagement)
- **Tool**: Jina `read_url` for page scrapes + Reddit API for metadata

### Phase 2: Validation Layer (Week 3-4)
- **Target**: MIC public data + EPG methodology review
- **Frequency**: Weekly/monthly reports
- **Data captured**: Market data, brand preferences, spending trends
- **Tool**: Manual review + annotation for structured insights

### Phase 3: Expansion (Month 2+)
- **Target**: Bike-specific forums, Discord analysis
- **Frequency**: As needed
- **Data captured**: Model-specific feedback, emerging communities
- **Tool**: Custom parser for structured sub-forums

---

## Access Patterns & Refresh Rates

| Channel | Read Frequency | Best Time | Lag | Notes |
|---------|---|---|---|---|
| ADVRider | Daily (6am UTC) | Low-traffic hours | 0-2h | Highest engagement 8am-6pm EST |
| Reddit | Hourly | Anytime | Real-time | Trending posts bubble up in 2-4h |
| Motorcycle.com | Daily | Anytime | 0-2h | Smaller community, slower updates |
| MIC | Weekly/Monthly | Report release dates | 1 week | Scheduled reports, not real-time |

---

## Data Quality Metrics

### By Channel Type

**Forums**
- ✅ **Depth**: Threaded discussions enable context
- ✅ **Signal-to-noise**: High (invested users)
- ❌ **Bias**: Adventure bike over-representation (ADVRider)
- ✅ **Searchability**: Full-text search enabled

**Reddit**
- ✅ **Speed**: Posts visible in minutes
- ✅ **Consensus**: Voting system surfaces agreement
- ❌ **Depth**: Shorter threads, less nuance
- ⚠️ **Bias**: Upvote bias toward entertainment over substance

**Research Panels**
- ✅ **Confidence**: Statistically significant (n=2,242+)
- ✅ **Breadth**: Demographic segmentation
- ❌ **Recency**: Delayed (monthly/quarterly reports)
- ⚠️ **Bias**: Self-selection bias (survey respondents)

---

## Channel Selection Guide for LaneShadow Use Cases

### "What do riders think about routing/navigation?"
→ **Primary**: ADVRider (Trip Planning forums) + r/motorcycle (gear threads)  
→ **Validation**: MIC equipment studies

### "How do riders choose touring bikes?"
→ **Primary**: ADVRider (Ride Reports) + Motorcycle.com (General Discussion)  
→ **Validation**: EPG purchase behavior data

### "What pain points do new riders mention?"
→ **Primary**: r/motorcycles (learning-focused) + Reddit (new rider threads)  
→ **Validation**: CSM post-purchase satisfaction surveys

### "Which brands are riders actually buying?"
→ **Primary**: MIC market data + EPG panel results  
→ **Secondary**: ADVRider bike-specific forums (usage patterns)

---

## Blockers & Workarounds

| Issue | Impact | Workaround |
|-------|--------|-----------|
| HD Forums Cloudflare block | Can't scrape Harley community | Manual monitoring, use r/Harley subreddit as proxy |
| MIC paywall | Can't access raw data | Use public statistics page + public reports |
| Reddit API rate limits | Can't scrape at scale | Batch requests hourly, use API v2 endpoints |
| Forum login walls | Can't read member-only posts | Monitor public sections only, track accessible discussions |

---

## Next Steps

1. **Set up daily ADVRider snapshot** — Thread count + engagement metrics
2. **Configure Reddit API** — Track r/motorcycle + r/motorcycles for keyword trends
3. **Create research pipeline** — Ingest + tag forum posts weekly
4. **Establish baseline metrics** — Store month-1 data for comparison
5. **Validate with panels** — Cross-reference forum sentiment against MIC/EPG data
