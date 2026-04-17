# RESTR-005: Move Expo App into react-native/ and Repair Root References

**Task ID:** RESTR-005
**Sprint:** Sprint 1 - Repo Restructure and Server Frontload
**Assigned To:** worker
**Estimate:** 360 min
**Type:** [FEATURE] [INFRA]
**Status:** Backlog

---

## CRITICAL CONSTRAINTS

1. Keep the Expo app runnable after the move; this is a structural migration, not a feature rewrite.
2. Update root assumptions everywhere the app path matters, including docs and automation.
3. Do not begin native Kotlin/Swift feature work until the old Expo app has a stable `react-native/` home.

---

## SPECIFICATION

**Objective:** Move the current Expo app into `react-native/` and update root-level references so the repo matches the intended multi-app layout before native work continues.

**Success State:** The Expo app runs from `react-native/`, and repo-level docs/configs no longer assume the app lives at root.

---

## DELIVERABLES

- `react-native/`: authoritative home for the Expo application after restructure
- `eas.json`: Expo/EAS configuration updated for the relocated app root
- `app.config.ts`: Expo config updated or relocated for the new app path
- `README.md`: root app/backend directory usage updated for the new layout

---

## ACCEPTANCE CRITERIA

### AC-001: Expo app is relocated
**GIVEN** the current app still lives at repo root
**WHEN** the move completes
**THEN** the Expo app lives under `react-native/` as the authoritative client root

### AC-002: Tooling points at react-native/
**GIVEN** scripts and configs currently assume a root app
**WHEN** the path migration is reviewed
**THEN** tooling and docs reference `react-native/` appropriately

### AC-003: Repo layout now matches the intended multi-app shape
**GIVEN** native work will happen beside the legacy app
**WHEN** Sprint 1 completes
**THEN** the repo structure matches the PRD end-state closely enough to proceed

---

## VERIFICATION

- Confirm the Expo app root is `react-native/` and root docs/configs no longer treat the repo root as the app root.
- Confirm `npx expo start` can be run from `react-native/` after the move.

---

## READING LIST

- `.spec/prds/native-rewrite/04-uc-restructure.md` — UC-RESTR-02 client move requirements
- `.spec/prds/native-rewrite/README.md` — end-state repo layout expectations
- `app.config.ts` — current Expo root assumptions before relocation

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `react-native/`
- `eas.json`
- `app.config.ts`
- `README.md`

**NEVER MODIFY:**
- `RULES.md` — project rules remain authoritative
- Unrelated native feature implementation files outside the restructure scope
- Business logic unrelated to repo layout or backend/client entry points

---

## DEPENDENCIES

- RESTR-003

---

## OUT OF SCOPE

- Native Kotlin/Swift feature implementation
- Convex deploy verification
