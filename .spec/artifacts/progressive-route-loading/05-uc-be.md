---
stability: FEATURE_SPEC
last_validated: 2026-04-09
prd_version: 1.0.0
functional_group: BE
---

# Use Cases: Backend Enrichment (BE)

## UC-BE-01: Fetch Weather Data Asynchronously

**Description:**
The weather enrichment job fetches wind, rain, and temperature data for up to 25 sample points along the route using Open-Meteo API. Requests are concurrent with a limit of 8 parallel calls.

**Acceptance Criteria:**
- ☐ Weather enrichment job reads route plan from route_plans table
- ☐ Job computes route index with up to 200 sample points
- ☐ Job selects up to 25 representative points for weather probing
- ☐ Job fetches weather data via Open-Meteo API with 8s timeout per request
- ☐ Job limits concurrent requests to 8 parallel calls
- ☐ Job retries failed requests once (retry-once pattern)
- ☐ Job maps weather data to route legs as wind overlay
- ☐ Job completes within 20 seconds for typical routes
- ☐ Job logs weather probe results (points fetched, success/failure counts)

## UC-BE-02: Merge Enrichment Results into Route Plans

**Description:**
After weather data is fetched, the system merges it into the route_plans.result field so the frontend receives updated data reactively. The merge updates overlaysPreview with actual weather summaries.

**Acceptance Criteria:**
- ☐ System updates route_plans.result with enriched data
- ☐ overlaysPreview.windSummary is set to 'calm' | 'moderate' | 'high' based on wind data
- ☐ overlaysPreview.rainSummary is set to 'none' | 'light' | 'moderate' | 'heavy' based on rain data
- ☐ overlaysPreview.temperatureSummary is set to 'cold' | 'mild' | 'hot' based on temperature data
- ☐ overlaysPreview.conditionsStatus is set to 'ok' when weather data is available
- ☐ System updates route_enrichments status to 'completed'
- ☐ Frontend receives reactive update via Convex subscription
- ☐ Frontend displays weather badges when data arrives
