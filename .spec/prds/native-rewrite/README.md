# Repo Restructure - PRD

Reorganize LaneShadow into a 4-application-folder monorepo (android/, ios/, react-native/, server/) matching the Storywright architecture pattern. This is the foundation initiative — the native rewrite is a separate future PRD.

## PRD Metadata

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Appetite | 1 week |
| Scope Level | MVP — repo restructure only |
| Created | 2026-04-15 |
| Last Updated | 2026-04-15 |

## Repository Structure (End State)

```
LaneShadow/
├── android/           # Native Android (Kotlin + Jetpack Compose + Material3)
├── ios/               # Native iOS (Swift + SwiftUI)
├── react-native/      # Original React Native/Expo app (retained during transition)
├── server/            # Convex backend (TypeScript) — shared, unchanged
├── Makefile           # Cross-platform build commands
└── .spec/             # Project specifications (unchanged)
```

## Document Index

| File | Section | Stability |
|------|---------|-----------|
| [00-overview.md](./00-overview.md) | Product description, problem statement, solution | PRODUCT_CONTEXT |
| [01-scope.md](./01-scope.md) | In scope / out of scope | FEATURE_SPEC |
| [02-roles.md](./02-roles.md) | User roles | PRODUCT_CONTEXT |
| [03-functional-groups.md](./03-functional-groups.md) | Functional group overview and use case summary | FEATURE_SPEC |
| [04-uc-restructure.md](./04-uc-restructure.md) | UC-RESTR-01 through UC-RESTR-06 | FEATURE_SPEC |
| [05-team-contributions.md](./05-team-contributions.md) | Phase contributions | - |
| [06-technical-requirements.md](./06-technical-requirements.md) | Technical specifications | CONSTITUTION |

## Quick Stats

| Metric | Value |
|--------|-------|
| Functional Groups | 1 |
| Use Cases | 6 |
| Target Folders | 4 (android/, ios/, react-native/, server/) |

## Version History

| Version | Date | Changes | Trigger |
|---------|------|---------|---------|
| 1.0.0 | 2026-04-15 | Initial PRD | New initiative |

## Next Steps

- `/kb-project-plan` - Build implementation plan
- `/trd-plan` - Generate detailed TRD
- `/pixel-perfect:design` - Generate UI design artifacts
