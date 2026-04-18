# LaneShadow Theme Tokens

`tokens/theme.json` is the Sprint 2 source of truth for shared semantic theme tokens.

- Validate the contract with `pnpm tokens:validate`.
- Update `tokens/theme.schema.json` whenever the contract shape changes.
- Update `version` in `tokens/theme.json` for breaking or additive contract changes.
- Keep `color.light` and `color.dark` structurally identical. The validator rejects drift.

This contract is intentionally JSON-only. Platform enforcement and native code generation are handled by `UI-002` and `UI-002B`.
