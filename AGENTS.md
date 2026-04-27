# AGENTS — LaneShadow

This project is governed by [RULES.md](RULES.md). Read it before doing anything.

Critical sections to memorize before touching code:

- **Cross-Platform Component Parity** — iOS and Android components are maintained in parallel. The story id (e.g. `organisms.topbar.default`) is the canonical cross-platform key. PNG filename = `{id}.{theme}.png`. Both platforms MUST register the same id for the same conceptual variant. See the canonical naming spec in RULES.md.
- **Local Domain Experts** — preferred specialist agents per domain (convex, kotlin, swift, etc.).
- **Pre-Commit Checks** — what runs on every commit; never bypass with `--no-verify`.
- **Multi-Agent Dispatch (iOS + Android)** — orchestrator never executes; one specialist per platform per task; worktree + simulator/emulator isolation.

For Convex backend rules see `convex/_generated/ai/guidelines.md`. For UI/design rules see `styles/RULES.md`.
