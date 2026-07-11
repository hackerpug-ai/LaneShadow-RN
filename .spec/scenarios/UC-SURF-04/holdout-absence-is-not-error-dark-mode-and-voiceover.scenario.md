---
service: mobile
feature: UC-SURF-04
priority: P2
type: edge_case
tier: holdout
scope: task-local
---

# UC-SURF-04 holdout: absence reads as absence in dark mode, VoiceOver, and against a real outage

Three framings the visible ACs never name. First, dark mode: the honest-empty chip and the
fallback label must keep their muted-informational visual weight on the dark theme — if the
dark token maps them to an alarming hue, "no routes yet" reads as "something broke", the
opposite of the trust this PRD buys. Second, VoiceOver: with the screen reader active, focus
order reaches the label chip BEFORE the fallback pills, so a blind rider hears "No routes
nearby — here's our top-rated" before hearing route names — hearing routes first would
assert nearby coverage that doesn't exist. Third, a real degraded backend: kill network
mid-session (airplane mode) and observe that the row shows the error/offline treatment, NOT
the honest-absence copy — "no routes here yet" appearing during an outage would teach riders
the absence message means "broken", destroying its meaning. The three states — absent, error,
loading — must be pairwise distinguishable by testID and by spoken announcement, in both
themes.
