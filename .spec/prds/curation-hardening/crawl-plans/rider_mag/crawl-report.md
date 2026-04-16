# Rider Magazine Crawl Report

## Source
- Article: https://ridermagazine.com/2024/12/17/50-best-motorcycle-roads-in-america/
- Title: 50 Best Motorcycle Roads in America
- Last modified (source HTML): 2026-02-04T16:32:04Z
- Form: A - editorial HTML with 50 repeated route sections in a single article

## Inventory
- Logical route sections discovered: 50
- Canonical article URL count: 1
- Fixture coverage: 5 sampled route-section fixtures

## Validation
- Required fields (`route_name`, `state_text`, `states_all`, `distance_miles`, `description`, `related_url`, `source_rank`) parsed from all 5/5 sampled fixtures.
- Source article contains exactly 50 numbered `h2` headings.
- Every numbered section has an editorial description paragraph and a related Rider link.
- Ordering note preserved: the source says the roads are listed more or less alphabetically by state rather than in rank order.

## Provenance Decisions
- `source_rank` preserves Rider's published list position.
- `source_rank_kind` is `alphabetical_by_state_order` to avoid misrepresenting the list as a merit ranking.
- Editorial description is preserved verbatim in route provenance fields.
- Human-readable rider-facing provenance remains `Rider Magazine` / `Rider Magazine 50 Best Motorcycle Roads in America`.

## Notes
- Inventory rows represent logical route-section anchors within one article. This keeps the artifact count at the exact published 50 routes while acknowledging the single-page source structure.
- No missing descriptions or related links were found in the fetched article.

**Verdict:** PASS
