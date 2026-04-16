# Rider Magazine Site Map

## Scope
- Source article: `https://ridermagazine.com/2024/12/17/50-best-motorcycle-roads-in-america/`
- Recon date: 2026-04-16
- Form: A, editorial HTML
- Recon method: manual browser inspection of the published article plus the saved source HTML at `.tmp/SRC-006/rider_50_best.html`

## Page Type Taxonomy
- `PT-00-article-shell`
  - One WordPress article page containing the intro plus all 50 Rider route entries.
- `PT-01-route-section`
  - Repeated numbered section inside the article. Each section has an `h2` heading, image block, editorial description paragraph, and a `Related:` link.
- `PT-02-related-article`
  - The Rider article linked from the section’s `Related:` line. Useful context, but out of scope for ingestion.

## Recon Answers
- Distinct in-scope page types: `2`
  - `PT-00-article-shell`
  - `PT-01-route-section`
- Distinct out-of-scope page type observed during recon: `1`
  - `PT-02-related-article`
- Fetch model:
  - Only `PT-00` is fetched over the network.
  - `PT-01` entries are logical DOM sections inventoried as fragment-scoped records inside `PT-00`.
- Expected inventory:
  - `1` canonical article URL
  - `50` logical `PT-01-route-section` records
- Required extraction boundary:
  - Parse only the numbered article body sections.
  - Do not treat nav, footer, comments, recommendations, or `Related:` destinations as route records.

## URL Patterns
- `PT-00-article-shell`
  - Exact URL: `https://ridermagazine.com/2024/12/17/50-best-motorcycle-roads-in-america/`
- `PT-01-route-section`
  - Logical section anchor used by this crawl plan:
  - `https://ridermagazine.com/2024/12/17/50-best-motorcycle-roads-in-america/#rider-mag-route-{rank}-{route-slug}`
  - Canonical fetch URL remains the `PT-00` article. The fragment identifies the section.
- `PT-02-related-article`
  - `https://ridermagazine.com/{yyyy}/{mm}/{dd}/{slug}/`

## Transition Graph
- `PT-00 -> PT-01`
  - DOM-local transition only. The article shell contains 50 numbered route sections.
  - Allowed discovery cue: numbered `h2` headings in the main article body.
  - Do not infer sections from image captions, gallery chrome, or unrelated WordPress blocks.
- `PT-01 -> PT-02`
  - Each route section links to one related Rider article via the centered `Related:` paragraph.
  - This is an outbound provenance link only, not an ingest expansion edge.
- `PT-02`
  - Out of scope. Do not crawl these pages for SRC-006.

## Allowed vs Rejected Transitions
- Allowed:
  - `PT-00 main article body` -> `PT-01 route section`
  - `PT-01 route section` -> `PT-02 related article` as captured provenance metadata only
- Rejected:
  - `PT-00` site header/nav -> any URL
  - `PT-00` footer/recommendation blocks -> any URL
  - `PT-00` comments/share widgets -> any URL
  - `PT-02 related article` -> follow-on crawl
  - Any non-numbered paragraph or media block -> synthetic route record

## Sample URLs
- `PT-00-article-shell`
  - `https://ridermagazine.com/2024/12/17/50-best-motorcycle-roads-in-america/`
- `PT-01-route-section`
  - `https://ridermagazine.com/2024/12/17/50-best-motorcycle-roads-in-america/#rider-mag-route-01-dalton-highway`
  - `https://ridermagazine.com/2024/12/17/50-best-motorcycle-roads-in-america/#rider-mag-route-07-pacific-coast-highway`
  - `https://ridermagazine.com/2024/12/17/50-best-motorcycle-roads-in-america/#rider-mag-route-14-route-66`
  - `https://ridermagazine.com/2024/12/17/50-best-motorcycle-roads-in-america/#rider-mag-route-42-utah-scenic-byway-12`
  - `https://ridermagazine.com/2024/12/17/50-best-motorcycle-roads-in-america/#rider-mag-route-50-beartooth-highway`
- `PT-02-related-article`
  - `https://ridermagazine.com/2024/03/26/alaska-motorcycle-ride-discovering-americas-last-frontier/`
  - `https://ridermagazine.com/2021/03/18/riding-cross-country-on-a-bmw-k-1600-b/`
  - `https://ridermagazine.com/2008/07/01/road-to-wisdom-u-s-and-canadian-rockies-motorcycle-tour/`

## Known Traps
- This source is one page with 50 repeated sections, so the inventory count is a logical section count rather than a fetched-page count.
- Rider states the roads are listed “more or less alphabetically by state rather than in rank order.” Preserve published order as metadata without presenting it as a merit ranking.
- Headings include multi-state records, punctuation-heavy names, and occasional trailing colons.
- The `Related:` article is not the ground-truth source page. It is provenance context only.
- Site chrome, comments, and other WordPress content surround the article body and must be ignored.
- Every logical `PT-01` record shares the same canonical fetch URL, so fragment IDs or explicit route IDs must carry record-level uniqueness in inventory.
- Because this is a single-article source, a crawler that expects one fetched page per route would under-report or over-fetch. Inventory must treat sections, not fetched URLs, as the unit of record.

## Scope Decisions
- In scope:
  - The article shell, because it is the only fetched source document
  - The 50 numbered route sections, because each section is the unit that maps to one curated route record
  - Editorial description, related Rider URL/title, and published order metadata
- Out of scope:
  - Related Rider articles, because SRC-006 is scoped to the published “50 Best” source page only
  - Comments, navigation chrome, ads, and sidebars, because they are not route content and would contaminate discovery
  - Any attempt to infer extra routes from outbound links or adjacent WordPress recommendation modules
