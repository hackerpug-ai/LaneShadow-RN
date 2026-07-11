---
service: convex
feature: UC-REC-01
priority: P1
type: error_handling
tier: holdout
scope: task-local
---

# UC-REC-01 edge: corrupt or wrong-road legacy polylines don't get promoted anyway

Not every legacy line is a treasure. Take three real-shaped failures through the promoter: a
`routePolyline` string that throws on decode (truncated base64-ish garbage), a line that
decodes to 3 points for a claimed 40-mile ride, and a line that decodes cleanly but measures
2.6× the claimed length (a scrape that captured a much longer parent route). None of the
three may produce a `generated` status: the undecodable and degenerate ones record their
specific failure, and the length-mismatched one is kept as a *candidate* attached to a
`review` status so a human can look at the actual line — because for a rider-drawn scrape,
the claimed length is as likely wrong as the line. The batch continues past all three without
halting, and the final report's rejected-count attributes each to its reason rather than
lumping them.
