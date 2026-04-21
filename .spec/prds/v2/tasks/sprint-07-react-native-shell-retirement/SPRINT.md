# Sprint 7: React Native Shell Retirement

**Sequence:** 7
**Timeline:** Phase 6 · Week 6 (closing gate)
**Status:** Planned

---

## Overview

This sprint is the terminal cleanup pass — it deletes the `react-native/` app shell in its entirety and strips every remaining RN-related reference from shared build config (`package.json`, `lefthook.yml`, `Makefile`, root `tsconfig*.json`). The earlier failed-port native-side UI was already removed in Sprint 1 by UC-SBX-05, so this sprint removes only the top-level RN Expo shell itself. Non-UI code (`server/convex/`, `tokens/`, bundled fonts, launch/icon asset catalogs, domain models, DI modules, build scaffolding) is explicitly preserved. The sprint lands as a single "V2 RN retirement" commit whose diff is overwhelmingly `D` (deletion) lines, with only the minimal edits required to strip RN references from shared config.

Per-platform split: UC-SBX-04 splits into an iOS-side verification task (verify `xcodebuild` still builds green + every V2 iOS story still renders) and an Android-side verification task (verify `./gradlew :app:compileDebugKotlin` still builds green + every V2 Android story still renders), plus a shared repo-wide deletion + config-scrub task. The three tasks run in sequence (deletion first, then parallel per-platform verification).

---

## Package Boundaries (CONSTITUTION)

Inherited from Sprint 1; relevant here as post-cleanup preservation constraints.

- **Theme package is preserved and intact.** `tokens/platforms/swift/Sources/LaneShadowTheme/` and `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/` + `LaneShadowTheme` Compose wrapper remain untouched; `~/Projects/native-theme` path references remain resolvable. The RN retirement does not remove or modify any token surface.
- **Sandbox runtime is preserved and operational.** `ios/LaneShadow/Sandbox/` + `android/app/src/debug/java/com/laneshadow/sandbox/` remain intact; the SPM path reference to `~/Projects/native-sandbox/ios/` and the Gradle composite to `~/Projects/native-sandbox/android/` remain wired. `/native-sandbox` must launch on both platforms after cleanup with every V2 story from UC-ATM-01 through UC-SCR-06 rendering.
- **Verification gate.** Post-cleanup iOS + Android verification tasks confirm that no theme-package or sandbox-runtime regression was introduced by the RN shell deletion. If any sandbox story breaks, that is a cleanup-task failure, not a carry-forward item.

---

## Human Test Deliverable

A reviewer can confirm the `react-native/` subtree is gone, every RN reference is stripped from shared build configuration, both platforms build green on their native toolchains, `/native-sandbox` still launches on iOS and Android with every V2 story rendering, and the pre-commit and pre-push verification gates all pass on a clean checkout.

**Test Steps:**
1. Run `ls /Users/justinrich/Projects/LaneShadow/react-native` and confirm "No such file or directory" — the entire subtree is deleted.
2. Open `package.json` and confirm no `react-native`, `expo`, Metro, or RN-related dependencies remain in `dependencies` or `devDependencies`; open `lefthook.yml` and confirm no hooks reference `react-native/` paths; open `Makefile` and confirm no targets invoke Expo/Metro/RN CLI; open the root `tsconfig*.json` variants and confirm no `paths`, `include`, or `references` entries point into `react-native/`.
3. Run `pnpm type-check:native` and confirm zero type errors anywhere in the repo.
4. Run `pnpm exec biome check --no-errors-on-unmatched` and confirm zero lint errors related to removed imports or unused code.
5. Run `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow build` and `cd android && ./gradlew :app:compileDebugKotlin` and confirm both platforms build green.
6. Launch `/native-sandbox --platform ios` and `/native-sandbox --platform android`; browse through every tier (Atoms → Molecules → Organisms → Screens → Infrastructure) and confirm every story from UC-ATM-01 through UC-SCR-06 still renders — no regression introduced by the cleanup.
7. Run `pnpm sandbox:parity-check` and `pnpm snapshots:check` and confirm both exit 0.
8. Stage a trivial edit, run `git commit`, and confirm the `lefthook` pre-commit chain (`pnpm type-check:native`, `biome check`, `pnpm tokens:validate`, `pnpm tokens:sync-check`, `pnpm icons:check`, platform-native checks) runs and passes; run `git push --dry-run` (or trigger the pre-push equivalent) and confirm `pnpm --dir server run convex:dev -- --once`, `pnpm sandbox:parity-check`, and `pnpm snapshots:check` all pass.
9. Open the final "V2 RN retirement" commit in `git log` and confirm the diff is overwhelmingly `D` (deletion) lines, with only the minimal edits to strip RN references from `package.json`, `lefthook.yml`, `Makefile`, and `tsconfig*.json`.

---

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| UC-SBX-04-shared | Delete `react-native/` subtree + strip RN references from `package.json` / `lefthook.yml` / `Makefile` / `tsconfig*.json` | swift-implementer + kotlin-implementer (shared cleanup) | 120 min |
| UC-SBX-04-ios | Post-cleanup iOS verification (`xcodebuild` green, `/native-sandbox --platform ios` shows every V2 iOS story) | swift-implementer | 60 min |
| UC-SBX-04-android | Post-cleanup Android verification (`./gradlew :app:compileDebugKotlin` green, `/native-sandbox --platform android` shows every V2 Android story) | kotlin-implementer | 60 min |

---

## Human Testing Gate

**Gate:** `react-native/` is gone, every RN reference is stripped from `package.json` / `lefthook.yml` / `Makefile` / `tsconfig*.json`, the cross-platform parity check passes, `/native-sandbox` still launches on both iOS and Android with every V2 story from UC-ATM-01 through UC-SCR-06 rendering, and the pre-commit + pre-push verification gates all pass.

---

## Source Coverage

- `.spec/prds/v2/09-uc-sbx.md` — UC-SBX-04 acceptance criteria
- `.spec/prds/v2/README.md` — Hard Replacement Policy (legacy UI artifacts are deleted, not migrated)
- `.spec/prds/v2/01-scope.md` — "Terminal — Late — React Native shell retirement" cleanup contract
- Every prior sprint's deliverables (UC-TOK-01..05, UC-ATM-01..13, UC-MOL-01..08, UC-ORG-01..07, UC-SCR-01..06, UC-SBX-01..03, UC-SBX-05, UC-SBX-06) as the set of components that must still render after cleanup

### Per-Task Design Files

| Task | Design Reference |
|------|-----------------|
| UC-SBX-04-shared | [`concepts/designs.html`](../../concepts/designs.html) (infrastructure cleanup — no per-UC spec) |
| UC-SBX-04-ios | [`concepts/designs.html`](../../concepts/designs.html) (infrastructure cleanup — no per-UC spec) |
| UC-SBX-04-android | [`concepts/designs.html`](../../concepts/designs.html) (infrastructure cleanup — no per-UC spec) |

---

## Blocks

- None. This is the closing sprint of the V2 initiative. Downstream work (live Convex wiring, real Navigator runtime, Mapbox advanced features, auth, web rebuild, accessibility audit) is deferred per `.spec/prds/v2/01-scope.md` "Out of Scope" and will be scheduled as separate initiatives.
