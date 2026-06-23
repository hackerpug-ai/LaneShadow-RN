---
service: mobile-app
feature: UC-DISC-11
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-DISC-11 core: app lands on the plan view with no separate discovery surface

The app opens directly to the route plan view (map + chat home). There is no dedicated
Discover screen, no archetype filter-bar, no best/nearest sort-toggle, no by-state browse
picker, and no "Plan a ride" drawer entry. The full chat view opens from a footer button
to the right of the chat input, visually distinct from the send button.

**Verify (e2e, real device):**
- Cold launch lands on the map + chat home (no separate Discover screen).
- The drawer's only navigation entries are standard ones (Settings, Saved, etc.) — NO
  "Plan a ride" entry, NO "Discover" entry.
- No filter-bar, sort-toggle, or state-picker control exists on the home.
- The footer "open full chat" button is visually distinct from the send button.
