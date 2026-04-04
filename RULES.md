# LaneShadow Project Rules

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
