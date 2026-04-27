# iOS Sandbox Full-Screen Story Screenshot Mapping

Device: iPhone 16 Simulator (iOS 26.3)
Date: 2026-04-27
Build: Debug, native-sandbox `c2a8ae7` + LaneShadow `4e6e6718`

All screenshots are the **sandboxed story detail view** (not the full-screen preview). Each shows the component header, story summary, "Open Full-Screen Preview" button, and tier/args metadata.

Screenshots directory: `screenshots/` (relative to this file)

---

## Template Screens

| # | Component | Story ID | Screenshot | Description |
|---|-----------|----------|------------|-------------|
| 1 | **IdleScreen** | `templates.idle.default` | [idle-default.png](screenshots/idle-default.png) | Welcome screen with greeting overlay, map, and chat input with suggestions |
| 2 | **PlanningScreen** | `templates.planning.default` | [planning-default.png](screenshots/planning-default.png) | Planning screen default state with map and chat |
| 3 | **PlanningScreen** | `templates.planning.phase1` | [planning-phase1.png](screenshots/planning-phase1.png) | Planning screen — Phase 1 (initial route analysis) |
| 4 | **PlanningScreen** | `templates.planning.phase3` | [planning-phase3.png](screenshots/planning-phase3.png) | Planning screen — Phase 3 (route comparison) |
| 5 | **PlanningScreen** | `templates.planning.phase4` | [planning-phase4.png](screenshots/planning-phase4.png) | Planning screen — Phase 4 (route selection) |
| 6 | **PlanningScreen** | `templates.planning.phase5` | [planning-phase5.png](screenshots/planning-phase5.png) | Planning screen — Phase 5 (final confirmation) |
| 7 | **PlanningScreen** | `templates.planning.dark` | [planning-dark.png](screenshots/planning-dark.png) | Planning screen — Dark mode variant |
| 8 | **RouteResultsScreen** | `templates.route-results.default` | [route-results-default.png](screenshots/route-results-default.png) | Route results with 3 polylines and message |
| 9 | **RouteDetailsScreen** | `templates.route-details.default` | [route-details-default.png](screenshots/route-details-default.png) | Route details with polyline and route sheet |
| 10 | **RouteDetailsScreen** | `templates.route-details.mixed-weather` | [route-details-mixed-weather.png](screenshots/route-details-mixed-weather.png) | Route details — Mixed weather conditions variant |
| 11 | **SessionsScreen** | `templates.sessions.default` | [sessions-default.png](screenshots/sessions-default.png) | Sessions screen with scrimmed map and drawer |
| 12 | **ErrorScreen** | `templates.error.default` | [error-default.png](screenshots/error-default.png) | Error screen with warn-stripe callout and recovery suggestions |

---

## Component Summary

| Component | Story Count | Screenshots |
|-----------|-------------|-------------|
| IdleScreen | 1 | idle-default |
| PlanningScreen | 5 | planning-default, planning-phase1, planning-phase3, planning-phase4, planning-phase5, planning-dark |
| RouteResultsScreen | 1 | route-results-default |
| RouteDetailsScreen | 2 | route-details-default, route-details-mixed-weather |
| SessionsScreen | 1 | sessions-default |
| ErrorScreen | 1 | error-default |
| **Total** | **12** | |

## Known Issues

- **Full-screen preview layout bug**: The `fullScreenCover` presentation is committed to native-sandbox (`c2a8ae7`) but was not visually verified in this capture pass. Story detail views are captured above for design review of metadata/presentation.
- **Map placeholders**: Template screens use placeholder maps (gradient + "Map Layer" text), not real Mapbox renders — expected in sandbox context.
