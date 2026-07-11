---
service: convex
feature: UC-HYG-04
priority: P2
type: edge_case
tier: holdout
scope: task-local
---

# UC-HYG-04 holdout: hostile-shaped state strings neither crash the pass nor corrupt rows

Feed the normalizer the catalog's genuinely weird tail rather than the textbook variants: an
empty-string state, a state value with trailing whitespace and mixed delimiters
(`Tennessee /North-Carolina `), and a value that is not a US state at all (a scraped site
sometimes emits country or region words). The pass completes without throwing, each oddball
lands in a defined bucket — normalized when confidently mappable, left unchanged and reported
in the pass output when not — and no row ends up with a half-transformed value (e.g. a set
containing one canonical and one raw fragment). Running the pass twice more produces zero
additional changes, proving the odd inputs don't oscillate between representations across
runs.
