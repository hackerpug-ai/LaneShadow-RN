# LaneShadow Project Rules

**This is the authoritative project instruction document.** All agents, subagents, and team members must follow these rules.

---

## Platforms

This project targets: **iOS, Android, Web, Convex**

| Platform | Status | Notes |
|----------|--------|-------|
| iOS | Required | Native Swift/SwiftUI implementation |
| Android | Required | Native Kotlin/Compose implementation |
| Web | Required | React-based web platform |
| Convex | Required | Backend (API, database, subscriptions) |
| Desktop | Not targeted | - |

---

## User Context

**Required reading for all product decisions:** [User Profiles](.spec/USER-PROFILES.md) — defines our 4 primary personas (experienced cruisers, touring planners, returning riders, group organizers) and design principles derived from their needs.

LaneShadow serves recreational cruiser and touring riders who ride for enjoyment and scenery — not sport bike, dirt bike, or track riders.

---

## Brand Philosophy

**Required reading for all visual, copy, and identity decisions:** [`.spec/brand/PHILOSOPHY.md`](.spec/brand/PHILOSOPHY.md) — the load-bearing brand foundation. Defines manifesto, eight design pillars, claimed lineage (Imhof / Sibley / Buchanan-Smith / Pirsig / Pullman / Solnit / Draplin), rejected traditions, moodboard anchors, and the eight-question test for any future artifact.

**The unifying thesis**: LaneShadow is the field journal of someone who has actually ridden the roads. The AI navigator is the rider's *daemon* (Pullman) — a soul-companion that travels alongside, drawn beside the lead line as a dotted echo in the same cartographic hand. We are heirs to **cartographic humanism**, not Silicon Valley SaaS.

**Hard rejections** (do not ship anything in these traditions):
- SaaS aesthetic (Inter, geometric vector-flat, purple gradients, ambient pastels)
- Outdoor-performance gear-brand (Eurostile, mountain triangle, "BEAST MODE")
- Motorcycle-culture macho (skulls, flames, eagles, gothic blackletter, chrome)
- Compass-and-star navigation cliche (rose, needle, NSEW, pin-drop)
- Kitsch heritage (faux-vintage filters, beardy lumberjack, sepia, "EST. 2026")
- Apple/Google Maps utilitarianism (vector-flat, anonymous, depersonalized)
- Wellness-app ambient curves (symmetric U/V/valley/bowl/smile-shapes)

**Color discipline**: ink `#1F1A14` (primary), paper `#FDFBF8` (substrate), copper `#D9742A` (surgical accent only). No gradients. No purples. No glows.

When this rule conflicts with a fashionable trend, kill the trend. When in doubt, ask: *would Imhof feel kinship with the hand that made this?*

Holocron reference: `js75jses5nx4bh7pmdqwnw0mw986d6f2`.

---

## Real Map Surfaces

Every LaneShadow map surface must render through the platform's real map implementation (`LSMap` on iOS/Android and the matching Mapbox-backed surface on web). Static maps, faux SVG maps, paper-map stand-ins, placeholder map mocks, and preview-only map components are prohibited in app code, sandbox stories, component templates, and design-system artifacts.

If Mapbox credentials, network, or style loading fail, show a real error state. Do not substitute a drawn map, snapshot, static tile, or decorative fallback. Preserve LaneShadow's cartographic feel through Mapbox style configuration and live overlays only.

---

## Convex Backend

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.

---

## Local Domain Experts

When dispatching subagents for planning, review, or implementation, prefer these project-local experts over generic agents. They understand this project's stack, patterns, and conventions.

| Agent | Role | When to Use |
|-------|------|-------------|
| `convex-planner` | Convex planning | Schemas, API endpoints, migration strategies |
| `convex-implementer` | Convex implementation | Mutations, queries, migrations using TDD |
| `convex-reviewer` | Convex review | API design, data integrity, migration safety |
| `kotlin-planner` | Android planning | Kotlin/Compose architecture, Hilt DI, Room schemas, Material 3 |
| `kotlin-implementer` | Android implementation | Kotlin/Compose code using TDD with Hilt, Room, Material 3 |
| `kotlin-reviewer` | Android review | Compose patterns, coroutine safety, Hilt DI correctness, TDD quality |
| `swift-planner` | iOS planning | Swift/SwiftUI architecture, SwiftData schemas, @Observable design, navigation |
| `swift-implementer` | iOS implementation | Swift/SwiftUI code using TDD with @Observable, SwiftData, XcodeBuildMCP |
| `swift-reviewer` | iOS review | Swift 6 concurrency safety, memory management, modern API usage, TDD quality |
| `frontend-designer` | Standalone visual exploration | Mockups and presentation-only exploration outside sprint execution. Do not assign sprint implementation, verification, token pipelines, registries, or stateful UI work to this agent. |
| `pi-agent-planner` | pi agent planning | Extension design, tools, workflows, event handlers |
| `pi-agent-implementer` | pi agent implementation | Extensions, tools, workflows using pi coding-agent SDK |
| `pi-agent-reviewer` | pi agent review | pi SDK best practices, TypeScript quality standards |

**Dispatch priority**: Always check this table first. Only fall back to generic `general-purpose` agents when no domain expert matches the task.

Platform ownership rule for sprint execution:
- iOS implementation tasks must use `swift-*` agents for implementation and review.
- Android implementation tasks must use `kotlin-*` agents for implementation and review.
- Do not assign `frontend-designer` to executable sprint tasks.
- In `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/`, only native execution agents are valid. Treat any task that writes `react-native/**`, `tokens/**`, or mixed React Native/native paths as a planning error that must be split, moved, or rewritten before `/kb-run-sprint` dispatches it.

---

## Design Rules

For UI/UX design rules, component patterns, and theme usage, see [`styles/RULES.md`](styles/RULES.md).

### One View, Many States — Never One Screen Per Variant

**Rule:** When a view has multiple mocks/variants, those are STATES of one screen, not separate screens.

**Why:** Mounting a different SwiftUI/Compose template per variant unmounts shared infrastructure (map atom, camera, tile cache, polylines, animation timers), breaks the persistent-map-host contract (Sprint 06), produces visual jank during transitions (overlays from different templates briefly co-exist, NavigationStack auto-titles leak), and forces duplicate composition code that drifts apart over time.

**How to apply (planning):**

- When a PRD or design spec defines multiple variants of a view (e.g., "S01 Scouting / S02 Drawing / V01 Slow Planning / V02 Cancel Prompt"), the implementation MUST be **one screen + a state enum** — not one template per variant.
- When `/kb-sprint-tasks-plan` generates tasks from a PRD, do NOT create a `<Variant>Screen.swift` per variant. Generate one `<View>Screen.swift` (or `<View>App.swift` if it's a root) with a `<View>State` enum and overlay composition that derives from state.
- Planner agents (`swift-planner`, `kotlin-planner`, `design-planner`, `mobile-planner`) MUST refuse to produce per-variant screen plans. Their output must show ONE screen + state-driven overlays + view-model derivation of state.
- Capture/snapshot tests (`DesignReviewCaptureTests`, `*SnapshotTest.kt`) target the unified screen with state injected via sandbox stories — not separate screen templates.

**How to apply (implementation):**

- Transitions between variants are **state mutations**, never `NavigationLink` / `NavigationStack` push / `navController.navigate(...)`.
- The map atom (`LSMap` / Compose `LSMap`) stays mounted across all variant transitions. Camera, tile cache, and polylines are preserved.
- View models can stay separate per concern (`IdleViewModel` + `PlanningViewModel`), but they OWN STATE, not VIEW INSTANTIATION. The unified screen reads from whichever view model is active.
- Components reused across states (`LSTopBar`, `LSContextCapsule`, `LSMapControls`, `LSChatInput`) are mounted ONCE; their input bindings change by state.

**Anti-patterns to reject in reviews:**

- A new `<Variant>Screen.swift` / `<Variant>Screen.kt` whose only difference from another screen is the overlay set or chat-input lock state.
- An `AppFlowView` / router that swaps between sibling templates which each own their own `LSMapLayer` / `LSMap`.
- A `NavigationLink` between two states of the same conceptual screen.
- Snapshot tests that compare per-template captures instead of per-state captures of one template.

**Sprint 08 post-mortem:** This rule was added 2026-05-14 after the user observed planning-state visual jank caused by `AppFlowView` swapping `IdleScreenContainer` ↔ `PlanningScreenContainer` as separate views — each instantiating its own `LSMapLayer + LSMap`. The fix (task `MAPAPP-UNIFY`) collapses both into one `MapApp` screen with state-driven overlays.

---

## Pre-Commit Checks

Every commit runs the following checks via `lefthook` `pre-commit` jobs declared in [`lefthook.yml`](lefthook.yml):

1. **TypeScript type check** — `pnpm type-check:native`
2. **Biome lint/format/imports** — `pnpm exec biome check --no-errors-on-unmatched {staged_files}`
3. **Token validation and sync checks** — `pnpm tokens:validate`, `pnpm tokens:sync-check` when matching files are staged
4. **iOS project generation check** — `scripts/ios/check-project-generated.sh` when `ios/project.yml` is staged
5. **Platform-native checks** — `swiftformat`, `xcodebuild ... build`, or `./gradlew :app:compileDebugKotlin` when matching platform files are staged

Additional repo-wide verification runs via `lefthook pre-push`:

1. **Convex build** — `pnpm --dir server run convex:dev -- --once`

Do not bypass these checks with `--no-verify`.

## Agent / Subagent Commit Policy

- Agents and subagents **must always commit their work** when they complete a task or reach a stable checkpoint.
- Before submitting a commit, agents **must run the pre-commit checks** and **fix any failures** rather than skipping or bypassing them.
- If a check fails, diagnose the root cause, fix it, and re-attempt the commit. Do not use `--no-verify` to work around failures.
- Commits should be atomic and well-described — one logical change per commit.

---

## Verification Standards by Platform

Every platform must pass **lint, typecheck, and test** before committing.

| Platform | Lint | Typecheck | Test |
|----------|------|-----------|------|
| **Server** (Convex/TS) | `pnpm lint` | `pnpm type-check:native` | `pnpm test` |
| **iOS** (Swift/SwiftUI) | `swiftlint` | `null` | `xcodebuild test -scheme {scheme} -destination 'platform=iOS Simulator,name=iPhone 16'` |
| **Android** (Kotlin/Compose) | `./gradlew detekt` | `null` | `./gradlew test` |

Agents and reviewers must run all applicable checks for the platform they are working on. Do not skip or bypass failing checks.

---

## Real Device E2E Testing

Human testing gates for **non-sandbox code** must include real-device E2E steps. This applies to live app flows such as auth, Convex subscriptions/mutations, Mapbox rendering, persistence, location, offline data, and external-service integration. Simulator/emulator checks can support the gate, but they do not replace real-device evidence for non-sandbox behavior.

LaneShadow's iOS real-device automation pattern is native XCUITest through `xcodebuild test` on a physical iPhone. The canonical automated iOS PASS path is email/password auth using `CLERK_TEST_EMAIL` and `CLERK_TEST_PASSWORD` from `.env.local`; XCTest `.xcresult`, attached screenshots, and xcodebuild logs under `ios/build/` are the evidence. See [`docs/REAL_DEVICE_E2E.md`](docs/REAL_DEVICE_E2E.md) for setup, result artifacts, and expectations.

Until Android has an equivalent physical-device automation harness, Android-only real-device observations must be recorded as MANUAL or BLOCKED with exact evidence instructions. Do not mark Android-only steps PASS from iOS evidence.

---

## Accessibility Standards

All user-facing components must meet **WCAG 2.1 AA** accessibility requirements. Reviewers must verify accessibility compliance as part of every UI task review.

### iOS (SwiftUI)

- Every interactive element must have an `accessibilityLabel`. Buttons with icon-only content must describe the action (e.g., `"Navigate back"`, `"Dismiss message"`).
- Use `accessibilityHint` for non-obvious actions (e.g., `"Double tap to change sort order"`).
- Use `accessibilityIdentifier` for UI testing selectors (not `accessibilityLabel`).
- Support **Dynamic Type** — layouts must not clip or overlap at largest accessibility content sizes. Use `ScrollView` and flexible stacks; avoid fixed heights on text containers.

**Canonical examples:**
- `ios/LaneShadow/Views/Molecules/AppHeader.swift` — `.accessibilityLabel("Back")` + `.accessibilityHint("Navigate back")` on back button
- `ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift` — `.accessibilityLabel("Unpin message")` / `.accessibilityLabel("Dismiss message")` on action icons
- `ios/LaneShadow/Views/Molecules/NewSessionButton.swift` — parameterized `accessibilityLabel` with computed fallback

### Android (Compose)

- Every interactive element must have a `contentDescription` or `semantics` modifier. Icon-only buttons must describe the action.
- Use `semantics { contentDescription = ... }` for custom composable accessibility.
- All touch targets must be at least **48dp** (Material 3 default; verify for custom composables).
- Support **font scaling** — use `scaleable` text styles; test at 200% scale. Avoid fixed `dp` heights on text containers.

**Canonical examples:**
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSSuggestionChip.kt` — `contentDescription = label` on chip composable
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSListRow.kt` — `contentDescription` on list row elements + trailing actions
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSNavHeader.kt` — `.semantics { }` block for navigation header

### Both Platforms

- **Color contrast:** Text must meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text). Use theme tokens exclusively — never hardcode colors (enforced by `scripts/tokens/enforce-native-compliance.sh`).
- **Focus order:** Interactive elements must be navigable in logical reading order.
- **State announcements:** Use `accessibilityValue` (iOS) / `stateDescription` (Android) for dynamic state (e.g., "Expanded" / "Collapsed").

---

## Multi-Agent Dispatch (iOS + Android)

Background: holocron research doc `js74ct16xh8dq06zpcysqggd25858fac` — "Multi-Agent Orchestration for iOS (Xcode) + Android Studio Codebases."

**Orchestrator rules (never negotiable):**

1. **Orchestrator does not execute.** Decompose → delegate → validate → escalate. Never write Swift / Kotlin. Never run `xcodebuild` / `gradlew` / `simctl` / `adb` directly. Context pollution from "quick fixes" collapses the planning layer.
2. **One specialist per platform per task.** Route by file scope:
   - `ios/**` → iOS specialist (uses XcodeBuildMCP for closed-loop build/test)
   - `android/**` → Android specialist (uses `./gradlew` + adb)
   - Shared contracts → shared specialist
   Never run two iOS specialists on the same feature — they will collide on simulator state.
3. **Worktree + runtime isolation together.** Per parallel dispatch:
   - `git worktree add .claude/worktrees/{task-id}` on branch `task/{task-id}`
   - Reserve a dedicated **simulator UDID** (`xcrun simctl clone` from a golden template) per iOS task
   - Reserve a dedicated **AVD + emulator port** (5554, 5556, …) per Android task
   - Each specialist runs `source scripts/agent-worktree-env.sh` inside the worktree to get per-task `DERIVED_DATA_PATH` / `GRADLE_USER_HOME` / `SWIFTPM_CACHE_DIR`
4. **Structured build evidence, not free text.** A specialist that commits `.swift` changes must have an `xcodebuild` or XcodeBuildMCP invocation in its transcript; `.kt` / `.gradle` changes require `./gradlew` or `adb`. Enforced by `.claude/hooks/subagent-build-evidence.py` (SubagentStop).
5. **`.pbxproj` / `.xcodeproj` are generated-only.** Agents must not hand-edit Xcode project internals. To change iOS targets, packages, schemes, or source membership, edit [`ios/project.yml`](ios/project.yml), run `scripts/ios/generate-project.sh`, and commit the regenerated `ios/LaneShadow.xcodeproj` output with the spec change. Direct project edits remain blocked globally by `~/.claude/hooks/protect-xcode-project.py` (PreToolUse) and locally by `.codex/hooks/pre_tool_use_protect_xcode.py`.
6. **Orchestrator merges, never the specialist.** After specialist commits and reviewer approves, orchestrator runs `git merge --no-ff` and then `git worktree remove` (never `--force`). If cleanup fails, preserve the worktree and escalate.

**Humans own:** code signing, provisioning profiles, App Store / Play Store submission, visual polish judgment. Xcode target membership is owned by the generated XcodeGen spec, not by manual `.pbxproj` edits.

---

## Cross-Platform Component Parity

> **Note (2026-05-04):** Snapshot parity gate removed in Sprint 05; pipeline replaced by `pnpm design:review` (see `.spec/prds/v3-integration/tasks/sprint-05-design-review-pipeline/`). The canonical-id naming spec below remains load-bearing for the in-app sandbox catalog UI (`LaneShadowStories.all` on iOS, `LaneShadowSandboxEntry` on Android).

**The canonical sandbox story ID is the cross-platform parity key.** When a component is implemented on both iOS (`ios/LaneShadow/Sandbox/Stories/...`) and Android (`android/app/src/debug/.../sandbox/stories/...`), both platforms MUST register the same `id` string for the same conceptual variant. The snapshot test infrastructure uses this id literally as the PNG filename stem; mismatched ids silently fall into `*_only` arrays and never get cross-platform visual review.

### Canonical naming spec

```
{tier}.{component}.{subgroup?}.{variant}    — all lowercase
- segments separated by dots (.)
- multi-word inside a segment: kebab-case (hyphens)
- tier ∈ { atoms, molecules, organisms, templates, modifiers, tokens } (NO `infrastructure.` prefix)
- component: lowercase kebab-case (e.g. badge, route-attachment-card, phase-dot, glasspanel)
- subgroup (optional, used when one component has 4+ variants on a single dimension): lowercase kebab-case (e.g. status, weather, callout)
- variant: lowercase kebab-case (e.g. error, primary-ghost, with-icon, color-overrides)
- size shorthand: prefer sm, md, lg, xl (matches token naming) — not small/medium/large
```

#### Examples

| Canonical | Anti-pattern | Why |
|---|---|---|
| `atoms.badge.status.error` | `atoms.badge.statusError` | Variants must be kebab-case; subgroup REQUIRED when 4+ variants share a dimension |
| `atoms.pill.sm`, `atoms.pill.md`, `atoms.pill.lg` | `atoms.pill.small`, `.medium`, `.large` | Size shorthand matches design token naming |
| `molecules.toolbar.back-title-action` | `molecules.toolbar.backTitleAction` | Variants kebab-case |
| `tokens.color-swatches.all` | `infrastructure.tokens.color-swatches.all` | No `infrastructure.` prefix on tokens |
| `templates.route-details.default` | `templates.routeDetails.default` | Component name kebab-case |

### Parallel maintenance rule

When adding, renaming, or removing a story on one platform, the SAME change must land on the other platform in the same PR. If a variant is genuinely platform-specific (e.g. an iOS-only system overlay or an Android-only modifier), add it to `tokens/sandbox/parity-exemptions.json` with an explicit `reason` field — never silently leave it in the `ios_only` / `android_only` arrays without justification.

### Verification

**Note:** The snapshot parity gate (`pnpm snapshots:check`, `pnpm snapshots:parity-coverage`) was removed in Sprint 05 and replaced by `pnpm design:review`. The canonical-id naming spec below remains load-bearing for the in-app sandbox catalog UI.

Historical parity thresholds (for reference):
- atoms / molecules: ≥ 95% (enforced)
- organisms: ≥ 90% (enforced)
- tokens: 100% (enforced)
- templates: ≥ 50% (advisory; legitimately platform-specific UX patterns may diverge)
- infrastructure / modifiers: exempt (sandbox scaffolding, not user-facing)

### PNG filename contract

Both platforms write `{id}.{theme}.png` where theme is `light` or `dark`:
- iOS: custom UIImage capture in `ios/LaneShadowTests/Sandbox/StorySnapshotTests.swift` (overrides swift-snapshot-testing's default sanitizer)
- Android: dropshots `assertSnapshot(name = sanitizedId)` in `android/app/src/androidTest/java/com/laneshadow/sandbox/snapshots/SandboxSnapshotTestBase.kt` (sanitizes `/` → `.`)

Resulting paths:
- iOS PNGs: `ios/LaneShadowTests/__Snapshots__/StorySnapshotTests/{id}.{theme}.png`
- Android PNGs: `android/app/src/androidTest/screenshots/AllStoriesSnapshotTest/{id}.{theme}.png`

### Sprint 6 / 8 post-mortem

The parity contract emerged from real incidents — see commits `b434433f` (iOS canonicalization), `4c474f40` (parity tooling), `87fe018e` (Android baseline restoration after a cycle that broke parity). Future drift is gated by the `lefthook` pre-push hook plus this rule.

---

## .spec Directory — Progressive Disclosure Guide

The `.spec/` directory is your centralized artifact store for planning, research, designs, and specifications. It's organized for progressive disclosure: start shallow, dig deeper as needed.

### How to Use .spec (Progressive Disclosure)

| What You Need | File/Folder | When to Read | What's Inside |
|---|---|---|---|
| **📋 Quick project overview** | `.spec/PRD.md` | First time setup, sprint kickoff | 1-page executive summary of LaneShadow features |
| **🎯 Detailed feature requirements** | `.spec/prd/{feature}/README.md` | Planning a specific feature | Full PRD for one feature (e.g., `waypoints-enrichment/`) |
| **🔬 Research & validation** | `.spec/research/CHANNELS.md` | Before implementing data pipeline | Motorcycle rider research channels, scraping strategy, data quality metrics |
| **🎨 Design specs & components** | `.spec/prd/{feature}/designs/` | Building UI/UX | Component hierarchies, Figma links, design tokens |
| **✅ Task breakdown & tracking** | `.spec/prd/{feature}/tasks/` | Daily work, sprint management | Epic folders, task markdown, and execution state for that PRD only |
| **🎬 Design reviews & feedback** | `.spec/prd/{feature}/reviews/` | Post-implementation refinement | Design review notes, feedback from stakeholders |

### Folder Structure Map

```
.spec/
├── PRD.md                           # Start here: 1-page overview
├── PLAN-NOTEBOOK.md                 # Planning scratchpad
├── research/                        # Research artifacts
│   ├── CHANNELS.md                  # Rider research channels & scraping
│   └── ...
├── prd/                             # Feature PRDs (detailed)
│   ├── feature-name/
│   │   ├── README.md                # PRD document
│   │   ├── tasks/                   # Epic/task execution artifacts for this PRD
│   │   │   ├── epic-1/
│   │   │   │   ├── EPIC.md
│   │   │   │   └── US-001.md
│   │   │   └── INDEX.md
│   │   ├── designs/                 # Design artifacts (Figma links, comps)
│   │   └── reviews/                 # Review feedback & decisions
│   └── waypoints-enrichment/
│       ├── README.md
│       ├── tasks/
│       │   ├── epic-1/
│       │   └── INDEX.md
│       └── ...
├── brand/                           # Brand guidelines
└── artifacts/                       # Supporting artifacts (sketches, etc.)
```

### Plan + Task Workflow

**Canonical task location:**
1. Each PRD lives in its own folder at `.spec/prd/{feature-name}/`
2. The only source-of-truth task location for that PRD is `.spec/prd/{feature-name}/tasks/`
3. Epic folders live under that sibling `tasks/` directory
4. `/kb-run-epic` must execute against that PRD-local `tasks/` folder, not a repo-global task directory
5. The legacy repo-global directory `.spec/tasks/` is deprecated and read-only

**Task files follow kb-project-plan conventions:**
- Each PRD gets a sibling `tasks/` directory
- Each epic gets its own folder with `EPIC.md` and task files
- Reference tasks from CLI with `/kb-run-epic --prd .spec/prd/{feature-name}/README.md {epic-id}` or the explicit epic path

### Reading Order by Role

**Product Manager**
1. `.spec/PRD.md` (overview)
2. `.spec/prd/{feature-name}/README.md` (detailed feature)
3. `.spec/prd/{feature-name}/reviews/` (feedback loops)

**Engineer**
1. `.spec/PRD.md` (context)
2. `.spec/prd/{feature-name}/README.md` (requirements)
3. `.spec/prd/{feature-name}/tasks/` (your task breakdown)
4. `.spec/prd/{feature-name}/designs/` (if UI-related)
5. `.spec/research/` (if data pipeline work)

**Designer**
1. `.spec/prd/{feature-name}/designs/` (start here)
2. `.spec/prd/{feature-name}/README.md` (requirements)
3. `.spec/prd/{feature-name}/reviews/` (feedback)

**Research / Data**
1. `.spec/research/` (primary source)
2. `.spec/PRD.md` (context)
3. `.spec/prd/{feature-name}/tasks/` (epics and task scopes for that PRD)

### Plan + Task Execution Workflow

**Step 1: Generate Tasks from Plan**
Once the plan is approved, run:
```bash
/kb-project-plan .spec/prd/{feature-name}/README.md
```
This generates a PRD-local task package:
- `.spec/prd/{feature-name}/tasks/INDEX.md`
- `.spec/prd/{feature-name}/tasks/{epic-id}/EPIC.md`
- `.spec/prd/{feature-name}/tasks/{epic-id}/{task-id}.md`

**Step 2: Execute Tasks**
Run the epic to execute all tasks:
```bash
/kb-run-epic --prd .spec/prd/{feature-name}/README.md {epic-id}
```

**Step 3: Keep Execution Scoped**
- Tasks for one PRD stay inside that PRD's sibling `tasks/` folder
- Multiple PRDs may have epics with the same slug, so do not rely on repo-global epic names
- Prefer the `--prd` form when invoking `/kb-run-epic`
- Treat `.spec/tasks/` as legacy history only; do not write new tasks there

### Best Practices

- ✅ **Read the PRD** before starting any feature work
- ✅ **Use EnterPlanMode** for non-trivial features (3+ steps)
- ✅ **Run kb-project-plan** after plan approval to generate tasks
- ✅ **Keep tasks in the PRD's sibling `tasks/` directory**
- ✅ **Reference tasks** from PRD for context and acceptance criteria
- ✅ **Check .spec/research/** for existing analysis before researching
- ✅ **Update relevant .spec/ files** after major decisions
- ❌ **Don't create standalone repo-global task files** — tasks live in the PRD folder's `tasks/` directory
- ❌ **Don't write new work into `.spec/tasks/`** — it is deprecated legacy storage
- ❌ **Don't duplicate** — if it exists in .spec/, link to it instead of copying
- ❌ **Don't let .spec/ get stale** — mark files with dates, archive old plans

---

## Planning & Execution Workflow

### Plan Storage
All plans (PRDs, specs, design docs) MUST be stored in `.spec/prd/` — each plan in its own subdirectory:
```
.spec/prd/{feature-name}/
├── README.md          # The plan/PRD itself
└── ...                # Supporting artifacts
```

### Plan → Task Pipeline
After generating a plan, ALWAYS run `/kb-project-plan` to create task files from the plan. This produces structured task files in the PRD's sibling `tasks/` directory, for example `.spec/prd/{feature-name}/tasks/{epic-id}/`, which `/kb-run-epic` consumes.

**Workflow:**
1. Create plan in `.spec/prd/{feature-name}/`
2. Run `/kb-project-plan` to generate task files
3. Run `/kb-run-epic --prd .spec/prd/{feature-name}/README.md {epic-id}` to execute tasks

### Design Review Pipeline — View Snapshot Testing

**When a sprint delivers a whole map view** (auth-screen, idle-screen, planning-screen, route-results-screen, route-details-screen, sessions-screen), the planner MUST include a design-review pipeline task that wires the new view into the `pnpm design:review` capture → eval → report flow.

**Required for every view sprint (Sprints 06–10 and beyond):**

1. **Reference assets** — ensure `.spec/design/system/views/{view}/` has PNGs + annotations for all states/variants (produced by `pnpm design:references`)
2. **XCUITest capture tests** — add `DesignReviewCaptureTests` test methods for every `(screen, state, theme)` tuple of the new view
3. **Manifest entry** — the capture suite automatically generates manifest entries; verify the new view appears in `.design-review/manifest.json`
4. **Pipeline run** — `pnpm design:review --screens {view}` must produce a report with zero `high`-severity issues before the sprint's human testing gate can pass
5. **Report evidence** — capture the pipeline report as gate evidence; include it in the sprint's deliverable artifacts

**What this means for planners:**

- When using `swift-planner` or `kotlin-planner` to plan a view sprint, include an explicit task for XCUITest capture test methods targeting the new view's states
- When using `convex-planner` to plan a sprint that includes pipeline infrastructure work, ensure the manifest + eval + report scripts handle the new view
- Every sprint's human testing gate MUST include a `pnpm design:review --screens {view}` step with a zero-high-severity-issues pass criterion
- The design-review skill is at `~/.claude/skills/design-review/SKILL.md`; the pipeline scripts are in `scripts/design-review/`

**Pipeline commands (planners should reference these in task specs):**

| Command | Purpose |
|---------|---------|
| `pnpm design:references` | Generate reference PNGs + annotations from design HTML |
| `pnpm design:export` | Export captured screenshots from .xcresult bundles |
| `pnpm design:eval` | Run vision LLM eval against references |
| `pnpm design:report` | Merge evals into report.json + report.html |
| `pnpm design:review` | Umbrella: runs full pipeline end-to-end |

**Current coverage (as of Sprint 05):** auth-screen only. Each subsequent view sprint (06–10) expands coverage by one view.
