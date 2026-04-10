---
stability: FEATURE_SPEC
last_validated: 2026-04-10
prd_version: 1.0.0
functional_group: FLY
---

# Use Cases: Data Flywheel (FLY)

| UC ID | Title | Description |
|-------|-------|-------------|
| UC-FLY-01 | Collect User Route Feedback | System captures user interactions with routes for quality improvement |
| UC-FLY-02 | Monitor Pipeline Health | Administrator views dashboard showing scrape success rates, costs, and data quality metrics |

---

## UC-FLY-01: Collect User Route Feedback

**Description:** Discovery system tracks how riders interact with curated routes (save, hide, ride completion, rating). This feedback creates a data flywheel for continuous improvement of route recommendations.

**Acceptance Criteria:**
- ☐ User can save route from discovery screen or details sheet
- ☐ User can hide route from future discovery results
- ☐ System logs save event with route_id, user_id, and timestamp
- ☐ System logs hide event with route_id, user_id, and timestamp
- ☐ System tracks ride completion when user navigates a curated route
- ☐ System tracks user rating (1-5 stars) after ride completion
- ☐ System stores feedback in Convex route_feedback table
- ☐ System includes feedback metadata: location, archetype filters at time of interaction
- ☐ System aggregates feedback counts per route (saves, hides, completions, avg_rating)
- ☐ System updates route metadata with feedback summary statistics
- ☐ System ensures user can provide feedback offline (sync when connection available)
- ☐ System implements rate limiting on feedback submissions (prevent spam)

---

## UC-FLY-02: Monitor Pipeline Health

**Description:** Administrator views dashboard showing curation pipeline health metrics including scrape success rates, LLM extraction costs, data quality issues, and user feedback trends. Dashboard enables proactive management of the data flywheel.

**Acceptance Criteria:**
- ☐ Administrator can access curation dashboard from admin interface
- ☐ Dashboard displays total route count by source (FHWA, motorcycleroads.com, bestbikingroads.com)
- ☐ Dashboard displays last scrape date and status for each source
- ☐ Dashboard displays LLM extraction cost total and per-route average
- ☐ Dashboard displays scrape success rate (successful / attempted)
- ☐ Dashboard displays routes with missing or invalid data (quality issues)
- ☐ Dashboard displays user feedback summary (total saves, hides, ratings)
- ☐ Dashboard displays top 10 routes by saves and by ratings
- ☐ Dashboard displays bottom 10 routes by hides (quality problems)
- ☐ Dashboard filters data by time range (last 7 days, 30 days, 90 days)
- ☐ Dashboard exports data as CSV for external analysis
- ☐ System refreshes dashboard metrics on load (caches for 5 minutes)
- ☐ System requires authentication for dashboard access
