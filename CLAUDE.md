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
