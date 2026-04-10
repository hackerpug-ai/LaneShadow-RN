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

For UI/UX design rules and theme system usage, see [`styles/RULES.md`](styles/RULES.md).

# Planning & Execution Workflow

## Plan Storage
All plans (PRDs, specs, design docs) MUST be stored in `.spec/prd/` — each plan in its own subdirectory:
```
.spec/prd/{feature-name}/
├── README.md          # The plan/PRD itself
└── ...                # Supporting artifacts
```

## Plan → Task Pipeline
After generating a plan, ALWAYS run `/kb-project-plan` to create task files from the plan. This produces structured task files in `.spec/tasks/{epic-id}/` that are compatible with `/kb-run-epic` for execution.

**Workflow:**
1. Create plan in `.spec/prd/{feature-name}/`
2. Run `/kb-project-plan` to generate task files
3. Run `/kb-run-epic` to execute tasks

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
