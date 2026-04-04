# Epic 1: Phase 0 Remediation — Unblock V1 Development

> Status: COMPLETE (2026-04-04)

> Epic Sequence: 1
> PRD: .spec/prds/v1/
> Tasks: 4

## Overview
Fix all blocking quality violations (icon imports, Text violations, hardcoded map colors) that break web compatibility and dark mode. This epic must complete before any V1 feature work can begin.

## Human Test Steps
When this epic is complete, users should be able to:
1. Run `pnpm dev:client` and verify web platform loads without errors
2. Toggle dark mode and verify map polylines use theme colors
3. Verify all icons render correctly across the app
4. Run `pnpm typecheck` and `pnpm lint` — both pass

## Acceptance Criteria (from PRD)
- All 24 `@expo/vector-icons` direct imports replaced with `IconSymbol`
- All 10 React Native `Text` imports replaced with Paper `Text` with proper variants
- All hardcoded hex colors in map components replaced with semantic theme tokens
- `pnpm typecheck` exits 0
- `pnpm lint` exits 0
- `pnpm dev:client` runs without icon or rendering errors

## PRD Sections Covered
- IMPLEMENTATION_STATUS.md Phase 0: Critical Remediation

## Dependencies
None — this is the first epic and blocks all subsequent epics (2-8).

## Task List
| Task ID | Title | Type | Priority | Blocked By |
|---------|-------|------|----------|------------|
| US-001 | Replace all 24 @expo/vector-icons direct imports with IconSymbol | INFRA | P0 | - |
| US-002 | Replace all 10 React Native Text imports with Paper Text | INFRA | P0 | - |
| US-003 | Replace hardcoded colors in map components with semantic tokens | INFRA | P0 | - |
| US-004 | Run verification gates and fix remaining issues | INFRA | P0 | US-001, US-002, US-003 |
