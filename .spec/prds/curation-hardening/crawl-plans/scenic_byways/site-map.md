# Scenic Byways Form B Site Map

**Date:** 2026-04-16
**Protocol:** Crawl Plan Protocol Form B
**Source:** America's Byways / FHWA Scenic Byways detail endpoints

## Endpoint taxonomy

| ID | Endpoint / Page Type | URL pattern | In scope | Notes |
|---|---|---|---|---|
| `PT-01-feature-json` | Normalized byway feature record | `https://fhwaapps.fhwa.dot.gov/bywaysp/StateMaps/Show/byway/{id}` | Yes | Source of rider-facing name, states, designation, description, and canonical source URL |
| `PT-02-map-reference` | Byway map page | `https://fhwaapps.fhwa.dot.gov/bywaysp/byway/{id}/map` | Supporting only | Used to justify location/geometry provenance, not parsed directly by the executor |
| `PT-03-index` | All byways listing | `https://fhwaapps.fhwa.dot.gov/bywaysp/Byways` | Discovery only | Used to build the committed inventory |

## Transition graph

- `PT-03-index` links to `PT-01-feature-json` detail URLs.
- Each `PT-01-feature-json` detail page links to a `PT-02-map-reference` page.
- The executor runs from the committed `urls.jsonl` inventory and does not re-discover links during execution.

## Sample URLs

- `PT-03-index`: `https://fhwaapps.fhwa.dot.gov/bywaysp/Byways`
- `PT-01-feature-json`: `https://fhwaapps.fhwa.dot.gov/bywaysp/StateMaps/Show/byway/2059`
- `PT-01-feature-json`: `https://fhwaapps.fhwa.dot.gov/bywaysp/StateMaps/Show/byway/2282`
- `PT-01-feature-json`: `https://fhwaapps.fhwa.dot.gov/bywaysp/StateMaps/Show/byway/2487`
- `PT-02-map-reference`: `https://fhwaapps.fhwa.dot.gov/bywaysp/byway/2059/map`

## Known traps

- FHWA overlap must upsert against the existing FHWA baseline instead of creating a second discoverable route.
- Multi-state records use a slash-delimited state string and must normalize consistently for overlap matching.
- The map page is supportive provenance only; the executor should not rely on it for required-field extraction.

## Scope decision

- This task commits a deterministic offline Form B snapshot using the 3 overlap fixtures needed to validate reconciliation and provenance.
- Execution is inventory-driven from `urls.jsonl`, selector-driven from `selectors.yaml`, and emits audit output for resumability/accounting.
