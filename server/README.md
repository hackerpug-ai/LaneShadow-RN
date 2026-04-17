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

## Notes

- This task only establishes the workspace boundary.
- Backend feature code migration into `server/convex/` is handled by downstream restructure tasks.
