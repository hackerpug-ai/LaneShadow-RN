# LaneShadow Project Rules

**This is the authoritative project instruction document.** All agents, subagents, and team members must follow these rules.

---

## User Context

**Required reading for all product decisions:** [User Profiles](.spec/USER-PROFILES.md) — defines our 4 primary personas (experienced cruisers, touring planners, returning riders, group organizers) and design principles derived from their needs.

LaneShadow serves recreational cruiser and touring riders who ride for enjoyment and scenery — not sport bike, dirt bike, or track riders.

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
| `react-native-ui-planner` | Mobile planning | Expo, react-native-paper, mobile-specific patterns |
| `react-native-ui-implementer` | Mobile implementation | React Native components using TDD with Expo |
| `react-native-ui-reviewer` | Mobile review | Theme compliance, accessibility, TDD quality with Expo |
| `kotlin-planner` | Android planning | Kotlin/Compose architecture, Hilt DI, Room schemas, Material 3 |
| `kotlin-implementer` | Android implementation | Kotlin/Compose code using TDD with Hilt, Room, Material 3 |
| `kotlin-reviewer` | Android review | Compose patterns, coroutine safety, Hilt DI correctness, TDD quality |
| `swift-planner` | iOS planning | Swift/SwiftUI architecture, SwiftData schemas, @Observable design, navigation |
| `swift-implementer` | iOS implementation | Swift/SwiftUI code using TDD with @Observable, SwiftData, XcodeBuildMCP |
| `swift-reviewer` | iOS review | Swift 6 concurrency safety, memory management, modern API usage, TDD quality |
| `frontend-designer` | Visual presentation | Layout, styling, animations ONLY — not for logic or state management |
| `pi-agent-planner` | pi agent planning | Extension design, tools, workflows, event handlers |
| `pi-agent-implementer` | pi agent implementation | Extensions, tools, workflows using pi coding-agent SDK |
| `pi-agent-reviewer` | pi agent review | pi SDK best practices, TypeScript quality standards |

**Dispatch priority**: Always check this table first. Only fall back to generic `general-purpose` agents when no domain expert matches the task.

---

## Design Rules

For UI/UX design rules, component patterns, and theme usage, see [`styles/RULES.md`](styles/RULES.md).

---

## Pre-Commit Checks

Every commit runs the following checks via a husky pre-commit hook (`.husky/pre-commit`):

1. **TypeScript type check** — `npm run type-check` (`tsc --noEmit`)
2. **ESLint** — `npm run lint`
3. **Convex build** — `npx convex dev --once` (pushes schema, functions, and runs typecheck in one shot)

All three must pass before a commit is accepted. Do not bypass these checks with `--no-verify`.

## Agent / Subagent Commit Policy

- Agents and subagents **must always commit their work** when they complete a task or reach a stable checkpoint.
- Before submitting a commit, agents **must run the pre-commit checks** and **fix any failures** rather than skipping or bypassing them.
- If a check fails, diagnose the root cause, fix it, and re-attempt the commit. Do not use `--no-verify` to work around failures.
- Commits should be atomic and well-described — one logical change per commit.

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
