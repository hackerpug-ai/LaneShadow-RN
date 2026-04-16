---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-15
prd_version: 1.0.0
---

# Repo Restructure

## Product Description

LaneShadow is a motorcycle scenic route discovery app currently structured as a flat React Native/Expo project with Convex code mixed into the root. This initiative reorganizes the repository into a 4-application-folder monorepo matching the Storywright architecture pattern.

## Problem Statement

The current repo has React Native app code and Convex backend code at the same directory level, making it unclear where the "app" ends and the "backend" begins. This structure doesn't support adding native Android/iOS apps alongside the existing React Native app.

## Solution

Restructure into 4 top-level application folders:

1. **`server/`** — Move `convex/` and backend tooling here
2. **`react-native/`** — Move the entire Expo/React Native app here
3. **`android/`** — Placeholder directory for future native Android app
4. **`ios/`** — Placeholder directory for future native iOS app

Plus a root `Makefile` for cross-platform dev commands and a root `CLAUDE.md` pointing to the correct subdirectories.

This is a **pure restructure** — zero code changes, zero functionality changes. The app must work identically after the move.

## Architecture Reference

Matches the Storywright pattern:
```
storywright/          →  laneshadow/
├── android/              ├── android/       # (placeholder)
├── ios/                  ├── ios/           # (placeholder)
├── server/               ├── server/        # convex/ moves here
│   └── convex/           │   └── convex/
└── Makefile              ├── react-native/  # current app moves here
                          └── Makefile
```
