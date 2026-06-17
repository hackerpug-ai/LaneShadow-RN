---
stability: FEATURE_SPEC
last_validated: 2026-04-15
prd_version: 1.0.0
appetite_weeks: 1
---

# Scope

## Appetite

**1 week (MVP)** — Repo restructure only. Zero code changes, zero new features.

## In Scope

- Move `convex/` directory into `convex/`
- Move all React Native/Expo app code into `react-native/`
- Create `android/` placeholder directory with README
- Create `ios/` placeholder directory with README
- Update all import paths and configuration to work from new locations
- Update Convex deployment config (`convex.json` or equivalent) to find schema in `convex/`
- Update `package.json` scripts to work from `react-native/`
- Update root `CLAUDE.md` to point to new directory structure
- Create root `Makefile` with `make react-native:dev`, `make server:dev`
- Verify app runs identically after restructure
- Verify Convex dev/deploy works from `server/`
- Verify all tests pass from new locations

## Out of Scope

- **Any code changes** — only moves and config updates
- **Native Android/iOS app creation** — future initiative
- **New features** — zero functionality changes
- **CI/CD changes** — update paths only, no new pipelines
- **EAS Build changes** — update project root config only
