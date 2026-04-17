# Server Workspace

`server/` is LaneShadow's backend operational root.

Use this directory as the working directory for backend tasks, scripts, and docs. Downstream work should target `server/` (and `server/convex/` once migrated) instead of the repository root.

## Purpose

- Establish a stable backend boundary before code moves.
- Provide consistent backend command entry points.
- Make downstream task instructions deterministic (`cd server`).

## Command Entry Points

Run from `server/`:

```bash
pnpm dev        # starts convex dev once server/convex exists
pnpm deploy     # deploys convex functions once server/convex exists
pnpm codegen    # regenerates convex generated types once server/convex exists
pnpm dashboard  # opens convex dashboard once server/convex exists
```

Until `server/convex/` exists, these commands fail fast with a clear message by design. This keeps `server/` as the canonical backend root now, while avoiding silent no-op behavior.

## Working Directory Contract

For backend operations, use:

```bash
cd server
```

Downstream docs and tasks should reference:

- Backend root: `server/`
- Backend code root (post-migration): `server/convex/`

## Operational Verification (RESTR-004)

The backend workflow has been verified to work from `server/` as of 2026-04-16.

### Verified Commands

**Development Mode:**
```bash
cd server
npx convex dev --once
```
✓ Verified: Convex CLI successfully discovers and prepares functions from `server/convex/`. Output shows all schema indexes created and component mounts complete.

**Deployment:**
```bash
cd server
npx convex deploy
```
✓ Verified: Convex CLI recognizes deployment targets (dev: `quirky-panther-164`, prod: `fantastic-owl-967`) and prepares deploy transactions correctly. Deploy requires interactive confirmation in terminal environments.

### Environment Requirements

For `npx convex dev` and `npx convex deploy` to work from `server/`:

1. **`CONVEX_DEPLOYMENT` env var** (optional if interactive setup is allowed):
   - Set to deployment ID (e.g., `dev:quirky-panther-164`)
   - Stored in root `.env.local` (shared by root workspace)
   - Example: `CONVEX_DEPLOYMENT=dev:quirky-panther-164`

2. **`convex` dependency** in `server/package.json`:
   - Added as `"convex": "^1.34.1"` to enable CLI detection
   - Resolves to root workspace `node_modules/convex` (shared workspace dependency)

3. **Root `.env.local` accessible**:
   - `server/` commands load `.env.local` from root (pnpm workspace behavior)
   - Contains `CONVEX_DEPLOYMENT`, `CONVEX_URL`, `CONVEX_SITE_URL` vars needed by CLI

### Parallel Work Safety

The backend is now stable for parallel work:
- `server/` is the canonical operational root for Convex commands
- `server/convex/` contains all backend function definitions
- Migration tasks can proceed independently with confidence that the backend entry point is stable

### Notes

- Root `node_modules` is intentionally shared (no `node_modules` in `server/`)
- Convex schema references use root workspace: `"$schema": "../node_modules/convex/schemas/convex.schema.json"`
- This design allows `server/` to act as the stable backend root while `convex.json` and scripts delegate to shared dependencies
