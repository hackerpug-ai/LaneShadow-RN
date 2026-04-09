# Epic 1: Shadow Setup

**Sequence:** 1
**Timeline:** Week 1
**Theme:** "Download Your Shadow"
**Status:** Pending

---

## Overview

User completes mandatory onboarding flow and downloads local AI model (Qwen3.5 0.8B) before accessing the app. This is a **hard gate** - the app cannot be used until the model is successfully downloaded and verified.

---

## Human Test Deliverable

**What a human can test after this epic:**

User completes full setup flow from first launch to model download completion, experiencing WiFi detection, background download with progress tracking, download resumption after interruption, and celebratory completion screen.

**Test Steps:**
1. Launch app for first time
2. View "Welcome to LaneShadow" screen with feature highlights
3. Connect to WiFi (cellular downloads blocked)
4. Initiate "Download Your Shadow" process
5. Watch "Awakening Your Shadow" progress (0-100%)
6. Navigate away from download screen (background download continues)
7. Return and see progress has continued
8. See "Your Shadow is Ready" confirmation
9. Access main app

---

## Acceptance Criteria

From PRD Sections:
- 00-overview.md (Phase 0 requirements)
- 02-roles.md (Adventure Rider persona)
- 08-technical-requirements.md (Local model integration)

| Criterion | Given | When | Then |
|-----------|-------|------|------|
| 1 | User launches app first time | Onboarding flow initiates | Welcome screen displays with "Download Your Shadow" branding |
| 2 | User proceeds from welcome | WiFi detection runs | System validates WiFi and blocks cellular |
| 3 | User has WiFi connection | Model download starts | Progress bar updates every 5% with ETA |
| 4 | Download in progress | App goes to background or restarts | Download resumes automatically from checkpoint |
| 5 | Download completes | Model verification runs | Checksum passes and "Your Shadow is Ready" screen displays |
| 6 | Model verification fails | Checksum validation detects corruption | Corrupted cache deleted, re-download triggered |
| 7 | Download fails | Network error or timeout | Retry button displays with exponential backoff |
| 8 | Storage insufficient | User attempts download on full device | Warning dialog shows required vs available space |

---

## Tasks

### CLR-001: Setup Wizard Flow Implementation
**Type:** DESIGN
**Agent:** frontend-designer
**Effort:** 480 min (8 hours)

**Objective:** Build 4-screen onboarding flow with WiFi detection, progress tracking, and state persistence

**Success:** User completes Welcome → WiFi Check → Download → Complete flow with model downloaded and verified

**Files:**
- `components/onboarding/shadow-setup-welcome.tsx` (NEW)
- `components/onboarding/shadow-setup-wifi.tsx` (NEW)
- `components/onboarding/shadow-setup-download.tsx` (NEW)
- `components/onboarding/shadow-setup-complete.tsx` (NEW)

**Dependencies:** None

---

### CLR-002: Local Model Integration
**Type:** INFRA
**Agent:** convex-implementer
**Effort:** 1200 min (20 hours)

**Objective:** Integrate Qwen3.5 0.8B with MLX runtime, native module bridge, download manager, and in-memory caching

**Success:** Model downloads from CDN, validates with checksum, loads as singleton, generates leg labels in <0.5s

**Files:**
- `ios/ShadowModel.swift` (NEW)
- `android/ShadowModel.kt` (NEW)
- `lib/ai/local-model.ts` (NEW)
- `lib/ai/model-download-manager.ts` (NEW)

**Dependencies:** None

---

### CLR-003: Gatekeeper Implementation
**Type:** FEATURE
**Agent:** react-native-ui-implementer
**Effort:** 480 min (8 hours)

**Objective:** Implement gatekeeper logic blocking app usage until model download completes

**Success:** App cannot be used without verified model, download state persists, failures show retry UX

**Files:**
- `components/gatekeeper/setup-required-screen.tsx` (NEW)
- `lib/gatekeeper/model-verification.ts` (NEW)
- `lib/gatekeeper/download-state.ts` (NEW)

**Dependencies:** CLR-001, CLR-002

---

### CLR-004: Model Download Persistence
**Type:** FEATURE
**Agent:** convex-implementer
**Effort:** 480 min (8 hours)

**Objective:** Implement persistent download state with retry logic and corruption recovery

**Success:** Download state persists across restarts, retries with exponential backoff, corrupted cache triggers re-download

**Files:**
- `lib/download-state.ts` (NEW)
- `lib/download-retry.ts` (NEW)

**Dependencies:** CLR-002

---

## Human Testing Gate

**Metric:** Setup completion rate > 90%

**Measurement:** Percentage of users who complete full setup flow (first launch → model verified)

**Success Criteria:**
- < 10% abandonment rate during download
- < 5% download failure rate
- < 2% corruption rate requiring re-download
- Average completion time < 5 minutes (on WiFi)

**Testing Method:**
- A/B test copy variants for motivation messaging
- Test with slow WiFi (2 Mbps) scenarios
- Test app kill and resume scenarios
- Test storage insufficient scenarios

---

## PRD Coverage

**Use Cases Covered:**
- UC-OFF-07 (Create Route While Offline - local model requirement)

**PRD Sections:**
- 00-overview.md (Phase 0: Shadow Setup)
- 02-roles.md (Adventure Rider persona)
- 08-technical-requirements.md (Local model integration)

---

## Blocks

**Blocks:** All other epics (hard gate)

**Rationale:** App cannot be used until model downloaded, blocking all map, routing, and enrichment features

---

## Risk Mitigation

**Risk:** User abandonment during mandatory download

**Mitigation:**
- Emphasize "AI riding companion" benefits
- Background download reduces perceived wait
- Progress updates every 5% feel responsive
- Celebratory completion screen creates positive emotion
- WiFi-only requirement explained (data cost, stability)

**Contingency:** Generic label fallback if model unavailable (degraded UX)

---

## Notes

**Critical Path:** This is the FIRST epic - all other work depends on completion

**Android Limitation:** MLX framework is Apple Silicon only - Android uses generic labels initially

**Model Size:** ~800MB compressed, ~1.15GB memory when loaded

**Download Time:** 2-5 minutes on typical WiFi (varies by connection speed)

---

## Next Steps

1. Implement CLR-001 through CLR-004
2. Pass human testing gate (> 90% completion rate)
3. Proceed to Epic 2 (Map Foundation)
