# REM-02: Add lefthook hooks for hardcoded token detection

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** general-purpose
**Estimate:** 60 min
**Type:** TOOLING
**Status:** Backlog
**Priority:** P1
**Effort:** M
**Source:** Red-hat review finding (cross-cutting reviewer)

---

## Background

Token validation hooks exist for token files (`tokens:validate`, `tokens:sync-check`) but nothing catches hardcoded hex colors or raw numeric dimensions in Swift/Kotlin source. Token compliance relies on reviewer vigilance and manual grep. A pre-commit hook can catch violations at commit time, not during snapshot testing when fix cost is 10x higher.

## Critical Constraints

**MUST:**
- Scan staged Swift files for literal hex colors (`0x[0-9A-Fa-f]{6,8}`), `Color(`, `UIColor(` outside allowed paths
- Scan staged Kotlin files for `Color(`, `0x[0-9A-Fa-f]{6,8}` outside allowed paths
- Allow patterns in: `tokens/platforms/`, `*MockProvider*`, `*Test*`, `*Stories*`, `*Snapshot*`, `*Fixture*`
- Exit non-zero with file:line of violations
- Register in `lefthook.yml` as pre-commit hook for `*.swift` and `*.kt` files

**NEVER:**
- Block the theme package itself (`tokens/platforms/`) — it IS the token source
- Block test/mock files — they legitimately use fixture colors
- Produce false positives on legitimate patterns (e.g., `Color.red` system colors in SwiftUI previews)

**STRICTLY:**
- Script must be fast (< 2 seconds for typical commit)
- Must handle files with spaces in paths
- Must print actionable error messages (file:line + suggestion to use theme token)

## Specification

**Objective:** Automated pre-commit enforcement that prevents hardcoded color literals from entering native source files outside allowed paths.

**Success State:** Committing a Swift or Kotlin file with a literal hex color outside allowed paths fails the pre-commit hook with a clear error message. Committing the same file without the literal succeeds.

## Acceptance Criteria

### AC-1 — Enforcement script exists and is executable
- **GIVEN** the scripts directory
- **WHEN** a developer checks for `scripts/tokens/enforce-native-compliance.sh`
- **THEN** the file exists, is executable, and contains detection logic for Swift and Kotlin color literals
- **Verify:** `test -x scripts/tokens/enforce-native-compliance.sh && echo OK`
- **TDD State:** RED

### AC-2 — Script rejects staged Swift file with hex literal
- **GIVEN** a staged Swift file containing `let c = 0xFF3366AA` outside allowed paths
- **WHEN** the script runs
- **THEN** it exits non-zero and prints the violating file:line
- **Verify:** Create temp Swift file with literal, stage it, run script, assert exit != 0
- **TDD State:** RED

### AC-3 — Script accepts staged Swift file in allowed paths
- **GIVEN** a staged file at `ios/LaneShadow/Sandbox/MockProviders/SomeMockProvider.swift` containing `Color(red: 0.5, green: 0.5, blue: 0.5)`
- **WHEN** the script runs
- **THEN** it exits zero (allowed path exemption)
- **Verify:** Stage a mock provider file with Color usage, run script, assert exit == 0
- **TDD State:** RED

### AC-4 — Lefthook entry registered
- **GIVEN** `lefthook.yml`
- **WHEN** a developer inspects the pre-commit hooks
- **THEN** they find a hook entry for `*.swift` and `*.kt` files running `scripts/tokens/enforce-native-compliance.sh`
- **Verify:** `grep -c "enforce-native-compliance" lefthook.yml` returns >= 1
- **TDD State:** RED

## Verification Gates

| Gate | Command | Expected |
|------|---------|----------|
| script-executable | `test -x scripts/tokens/enforce-native-compliance.sh` | exit 0 |
| reject-literal | stage a Swift file with `0xFF3366AA`, run script | exit != 0 |
| allow-mock | stage a MockProvider file with `Color(...)`, run script | exit 0 |
| lefthook-registered | `grep enforce-native-compliance lefthook.yml` | match found |

## Guardrails

**WRITE-ALLOWED:**
- `scripts/tokens/enforce-native-compliance.sh` (NEW)
- `lefthook.yml`

**WRITE-PROHIBITED:**
- All Swift/Kotlin source files
- `tokens/platforms/**` (theme package)

## Dependencies

**Depends On:** REM-01 (accessibility standards — establishes what needs enforcing)

**Blocks:** _(none)_

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"Enforcement script exists and is executable","verify":"file test"},
{"id":"AC-2","type":"acceptance_criterion","description":"Script rejects staged Swift file with hex literal","verify":"shell"},
{"id":"AC-3","type":"acceptance_criterion","description":"Script accepts staged file in allowed paths","verify":"shell"},
{"id":"AC-4","type":"acceptance_criterion","description":"Lefthook entry registered","verify":"grep"}
]}
-->
