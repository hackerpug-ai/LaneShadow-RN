# Coding Standards (LaneShadow)

Authoritative rules live in:
- `.cursor/rules/coding_standards.mdc`
- `.cursor/rules/theme_rules.mdc`
- `.cursor/rules/react_rules.mdc`

Project-specific notes:
- Use relative imports and named exports; only Expo Router page files may use `export default`.
- TypeScript strict mode: add explicit return types; avoid implicit `any`.
- No hardcoded styling values; use semantic theme via `useSemanticTheme` and Paper `Text`.
- Prefer composition over inheritance; static imports only (no dynamic `import()`).
