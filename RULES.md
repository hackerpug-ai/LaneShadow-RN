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
| **🎯 Detailed feature requirements** | `.spec/prds/{feature}/README.md` | Planning a specific feature | Full PRD for one feature (e.g., `waypoints-enrichment/`) |
| **🔬 Research & validation** | `.spec/research/CHANNELS.md` | Before implementing data pipeline | Motorcycle rider research channels, scraping strategy, data quality metrics |
| **🎨 Design specs & components** | `.spec/prds/{feature}/designs/` | Building UI/UX | Component hierarchies, Figma links, design tokens |
| **✅ Task breakdown & tracking** | `.spec/prds/{feature}/plan/{phase}/` | Daily work, sprint management | Atomic tasks by phase (01-research, 02-design, 03-implementation) |
| **🎬 Design reviews & feedback** | `.spec/prds/{feature}/reviews/` | Post-implementation refinement | Design review notes, feedback from stakeholders |

### Folder Structure Map

```
.spec/
├── PRD.md                           # Start here: 1-page overview
├── PLAN-NOTEBOOK.md                 # Planning scratchpad
├── research/                        # Research artifacts
│   ├── CHANNELS.md                  # Rider research channels & scraping
│   └── ...
├── prds/                            # Feature PRDs (detailed)
│   ├── feature-name/
│   │   ├── README.md                # PRD document
│   │   ├── plan/                    # Plan & tasks (when using EnterPlanMode)
│   │   │   ├── 01-research/         # Research phase tasks
│   │   │   ├── 02-design/           # Design phase tasks
│   │   │   └── 03-implementation/   # Implementation phase tasks
│   │   ├── designs/                 # Design artifacts (Figma links, comps)
│   │   └── reviews/                 # Review feedback & decisions
│   └── waypoints-enrichment/
│       ├── README.md
│       ├── plan/
│       │   ├── 01-research/
│       │   ├── 02-design/
│       │   └── 03-implementation/
│       └── ...
├── brand/                           # Brand guidelines
└── artifacts/                       # Supporting artifacts (sketches, etc.)
```

### Plan + Task Workflow

**When to use EnterPlanMode:**
1. You enter plan mode for a feature in a PRD
2. Plan is approved and finalized
3. Run `/kb-project-plan {prd-file}` to generate task structure
4. Tasks are created in `.spec/prds/{feature-name}/plan/{phase}/`
5. Follow the phase-based folder structure (01-research, 02-design, 03-implementation)

**Task files follow kb-project-plan conventions:**
- Each phase gets a folder with human-readable label
- Task files contain atomic, actionable work items
- Reference tasks from CLI with `/kb-run-epic` to execute

### Reading Order by Role

**Product Manager**
1. `.spec/PRD.md` (overview)
2. `.spec/prds/{feature-name}/README.md` (detailed feature)
3. `.spec/prds/{feature-name}/reviews/` (feedback loops)

**Engineer**
1. `.spec/PRD.md` (context)
2. `.spec/prds/{feature-name}/README.md` (requirements)
3. `.spec/prds/{feature-name}/plan/` (your task breakdown)
4. `.spec/prds/{feature-name}/designs/` (if UI-related)
5. `.spec/research/` (if data pipeline work)

**Designer**
1. `.spec/prds/{feature-name}/designs/` (start here)
2. `.spec/prds/{feature-name}/README.md` (requirements)
3. `.spec/prds/{feature-name}/reviews/` (feedback)

**Research / Data**
1. `.spec/research/` (primary source)
2. `.spec/PRD.md` (context)
3. `.spec/prds/{feature-name}/plan/01-research/` (research phase tasks)

### Plan + Task Execution Workflow

**Step 1: Enter Plan Mode**
```bash
# While working on a PRD feature
/EnterPlanMode
```
Explore the codebase, design your approach, then exit with:
```bash
/ExitPlanMode
```

**Step 2: Generate Tasks from Plan**
Once the plan is approved, run:
```bash
/kb-project-plan .spec/prds/{feature-name}/README.md
```
This generates phase-based task folders:
- `.spec/prds/{feature-name}/plan/01-research/`
- `.spec/prds/{feature-name}/plan/02-design/`
- `.spec/prds/{feature-name}/plan/03-implementation/`

**Step 3: Execute Tasks**
Run the epic to execute all tasks:
```bash
/kb-run-epic {feature-name}
```

**Step 4: Organize by Phase**
- Tasks in `01-research/` run first (investigation, spike)
- Tasks in `02-design/` run second (architecture, specs)
- Tasks in `03-implementation/` run last (code, tests, docs)

### Best Practices

- ✅ **Read the PRD** before starting any feature work
- ✅ **Use EnterPlanMode** for non-trivial features (3+ steps)
- ✅ **Run kb-project-plan** after plan approval to generate tasks
- ✅ **Organize tasks by phase** (01-research, 02-design, 03-implementation)
- ✅ **Reference tasks** from PRD for context and acceptance criteria
- ✅ **Check .spec/research/** for existing analysis before researching
- ✅ **Update relevant .spec/ files** after major decisions
- ❌ **Don't create standalone task files** — tasks live in `.spec/prds/{feature}/plan/`
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
After generating a plan, ALWAYS run `/kb-project-plan` to create task files from the plan. This produces structured task files in `.spec/tasks/{epic-id}/` that are compatible with `/kb-run-epic` for execution.

**Workflow:**
1. Create plan in `.spec/prd/{feature-name}/`
2. Run `/kb-project-plan` to generate task files
3. Run `/kb-run-epic` to execute tasks
