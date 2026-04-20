---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-20
prd_version: 1.0.0
---

# Roles

V2 is designed for a hybrid team: **AI agents own most execution**, human reviewers gate major decisions, and end users benefit from visual consistency without interacting with the design system directly. Each role below is a distinct consumer of the design system artifacts.

| Role | Type | Description |
|------|------|-------------|
| **swift-planner** | AI agent | Reads a UC spec, inspects the `ios/` codebase, and produces an implementation plan for a single iOS component, view, or screen — including `@Observable` data model, SwiftUI view hierarchy, preview/story signature, and XCTest cases. Consumes tokens via the generated `NativeTheme` constants. |
| **swift-implementer** | AI agent | Receives a plan and writes paired XCTest + SwiftUI production code using TDD (RED → GREEN → REFACTOR). Registers the produced component as a `Story` in `ios/LaneShadow/Sandbox/Stories/*Stories.swift`. Never hard-codes colors/fonts — always resolves from the theme. |
| **swift-reviewer** | AI agent | Adversarially validates Swift code: modern API usage, Swift 6 concurrency safety, memory management, TDD quality (real RED evidence, behavior-level assertions), and visual verification via `/native-sandbox --platform ios` on a simulator. |
| **kotlin-planner** | AI agent | The Android analog of `swift-planner`. Produces Compose component hierarchy, Hilt DI graph (where applicable — V2 mostly avoids DI for stateless UI), Room schema (not used in V2 — mocks only), and JUnit4 + Compose UI test cases. |
| **kotlin-implementer** | AI agent | Writes paired test + Compose production code using TDD. Registers the produced composable as a `Story` in the Android sandbox module. Never hard-codes design values — always resolves from `MaterialTheme` or the generated Kotlin token extensions. |
| **kotlin-reviewer** | AI agent | Adversarially validates Kotlin/Compose code: idiomatic Compose patterns, coroutine safety, state hoisting, recomposition correctness, TDD quality, and visual verification via `/native-sandbox --platform android` on an emulator. |
| **frontend-designer** | AI agent | Produces and maintains component design specifications derived from `concepts/LaneShadow Design System v2 _standalone_.html`: variants, states, arg controls, spacing diagrams, and intended light/dark appearance. Standalone visual exploration only — does not touch sprint implementation. |
| **product-manager** | AI agent (lead) | Owns the PRD, defines UCs, validates acceptance criteria, coordinates cross-group decisions (e.g., atom API consistency across platforms), and triggers `--feedback` updates when the Copper concepts evolve or a UC needs reshaping. |
| **Human reviewer (operator)** | Human | Justin (operator) — sets appetite, triggers `/kb-run-sprint`, reviews each sprint's human testing gate by opening `/native-sandbox` on both platforms, and approves merges to main. Has final veto on visual quality. |
| **End user** | Human (indirect) | LaneShadow recreational cruiser/touring riders. Does not interact with the design system directly — but every visible surface they touch post-V2 is produced by it. Their consistency experience is the ultimate quality gate. |

## Role Interactions

- **Plan → Implement → Review** triad per platform, per UC. A UC produces two triads running in parallel (iOS and Android).
- **Shared specs**: `frontend-designer` produces a single spec consumed by both iOS and Android triads — this is where cross-platform fidelity is enforced.
- **Shared tokens**: all six executor agents (iOS plan/impl/review, Android plan/impl/review) read from the same generated token outputs, which themselves come from a single `semantic.tokens.json`.
- **Gate**: human reviewer runs `/native-sandbox` on both platforms after each sprint. If parity or fidelity fails, the sprint is rolled back via `/kb-prd-plan --feedback`, not patched via `--no-verify`.

## Out-of-role Usage

- `react-native-ui-*` agents **must not** be dispatched for V2 work. They owned the now-deleted React Native layer. `react-native/` is retired by UC-SBX-04.
- `frontend-designer` **must not** be assigned to sprint execution tasks (per RULES.md platform ownership rule). Its role is specs only; implementation goes to swift-* or kotlin-*.
- `convex-*` agents are **not used** in V2. Mock data is hand-authored per UC-SBX-03 and lives in the sandbox module, not in Convex.
