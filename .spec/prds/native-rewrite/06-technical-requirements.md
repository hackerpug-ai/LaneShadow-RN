---
stability: CONSTITUTION
last_validated: 2026-04-15
prd_version: 1.0.0
---

# Technical Requirements

## System Components

| Component | Location | Role |
|-----------|----------|------|
| React Native App | `react-native/` | Existing Expo app — moved from root |
| Convex Backend | `server/convex/` | Backend functions and schema — moved from root |
| Android Placeholder | `android/` | Empty directory with README for future native app |
| iOS Placeholder | `ios/` | Empty directory with README for future native app |
| Root Config | `./` | Makefile, .gitignore, CLAUDE.md, .husky |

## Directory Structure (End State)

```
LaneShadow/
├── android/                    # Placeholder for future native Android app
│   └── README.md
├── ios/                        # Placeholder for future native iOS app
│   └── README.md
├── react-native/               # Existing Expo/React Native app (moved from root)
│   ├── app/                    # Expo Router screens
│   ├── components/             # UI components
│   ├── constants/              # App constants
│   ├── convex/                 # (symlink or config pointing to server/convex/)
│   ├── hooks/                  # React hooks
│   ├── providers/              # Context providers
│   ├── styles/                 # Theme and design tokens
│   ├── utils/                  # Utility functions
│   ├── package.json            # RN dependencies and scripts
│   ├── app.json                # Expo config
│   ├── tsconfig.json           # TypeScript config
│   └── .env.local              # RN environment variables
├── server/                     # Convex backend (moved from root)
│   ├── convex/                 # Convex functions, schema, generated
│   │   ├── _generated/         # Auto-generated Convex types
│   │   ├── lib/                # Shared backend utilities
│   │   ├── schema.ts           # Database schema
│   │   └── *.ts                # Query/mutation/action files
│   ├── package.json            # Server dependencies
│   ├── tsconfig.json           # TypeScript config for Convex
│   └── .env.local              # Convex environment variables
├── .spec/                      # Project specifications (stays at root)
├── .husky/                     # Git hooks (stays at root)
├── .gitignore                  # Root gitignore
├── CLAUDE.md                   # Project instructions (updated paths)
├── RULES.md                    # Project rules (updated paths)
├── Makefile                    # Cross-platform dev commands (new)
└── README.md                   # Root readme
```

## Migration Steps

1. Create `server/` and `react-native/` directories
2. Move `convex/` → `server/convex/`
3. Move all RN app code (`app/`, `components/`, `hooks/`, `providers/`, `styles/`, `constants/`, `utils/`, etc.) → `react-native/`
4. Move RN config files (`package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `eas.json`, `metro.config.js`, etc.) → `react-native/`
5. Create `android/README.md` and `ios/README.md`
6. Create root `Makefile`
7. Update `CLAUDE.md` and `RULES.md` with new paths
8. Update `.husky/` hooks to `cd` into correct directories
9. Update `.gitignore` for new structure
10. Verify everything runs from new locations

## Key Configuration Changes

| Config | Change |
|--------|--------|
| `npx convex dev` | Must run from `server/` directory |
| `npx expo start` | Must run from `react-native/` directory |
| Pre-commit hooks | Must `cd` into `react-native/` for typecheck/lint, `server/` for convex build |
| EAS Build | `eas.json` stays in `react-native/`, EAS project root = `react-native/` |
| Convex client URL | Unchanged — same deployment URL |
| Import paths | Unchanged within each subdirectory — only root-level references update |
