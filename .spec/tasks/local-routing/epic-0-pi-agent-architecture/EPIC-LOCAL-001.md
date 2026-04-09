# EPIC-LOCAL-001: Local Routing Extension Foundation

**Epic:** EPIC-0: Pi Agent Architecture Foundation
**Task ID:** EPIC-LOCAL-001
**Status:** Backlog
**Priority:** P0 (Critical - blocks EPIC-4, EPIC-5, EPIC-6)
**Effort:** M (1 day)
**Type:** INFRA
**Iteration:** 1

---

## CRITICAL CONSTRAINTS

MUST: Create extension structure at `~/.pi/agent/extensions/local-routing/`
MUST: Install all dependencies (mlx-local, @trestleinc/replicate, @rnmapbox/maps)
MUST: Follow existing pi agent extension patterns from `~/.pi/agent/extensions/`
NEVER: Modify core pi agent framework files
STRICTLY: Package.json must include all runtime dependencies

---

## SPECIFICATION

**Objective:** Create the foundational package structure and dependencies for the local-routing pi agent extension.

**Success looks like:** Extension package is installable, all dependencies resolve, and base extension loads without errors in pi agent runtime.

---

## PREREQUISITES

| Phase | Document | Lines/Section | Purpose |
|-------|----------|---------------|---------|
| BEFORE_START | `~/.pi/agent/extensions/README.md` | ALL | Understand extension structure patterns |
| BEFORE_START | `/Users/justinrich/Projects/LaneShadow/.spec/prds/complete-local-routing/08-technical-requirements.md` | External Dependencies section | Verify dependency versions |
| IF_BLOCKED | `~/.pi/agent/README.md` | Extension Loading | Troubleshoot extension loading issues |

---

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | Extension directory does not exist | Developer creates directory structure | All required subdirectories exist (tools/, workflows/, events/) | `test -d ~/.pi/agent/extensions/local-routing/tools && test -d ~/.pi/agent/extensions/local-routing/workflows && test -d ~/.pi/agent/extensions/local-routing/events` |
| 2 | Extension has no package.json | Developer runs `npm install` | package.json exists with all dependencies | `test -f ~/.pi/agent/extensions/local-routing/package.json && cat ~/.pi/agent/extensions/local-routing/package.json | grep -q 'mlx-local'` |
| 3 | Extension is not registered | Developer adds extension to pi agent config | Extension loads without errors | `pi-cli extension list \| grep -q 'local-routing'` |
| 4 | Extension has no entry point | Developer imports extension | Extension exports index.ts with all tools/workflows | `node -e "require('~/.pi/agent/extensions/local-routing')" && echo "Import successful"` |
| 5 | Dependencies are not installed | Developer runs npm install | All dependencies install without conflicts | `cd ~/.pi/agent/extensions/local-routing && npm ls --depth=0 \| grep -q 'mlx-local'` |

---

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | Extension directory structure exists when developer creates required subdirectories | AC-1 | `ls -la ~/.pi/agent/extensions/local-routing/ \| grep -E '(tools\|workflows\|events)'` | [ ] TRUE [ ] FALSE |
| 2 | package.json contains mlx-local dependency when developer creates package.json | AC-2 | `cat ~/.pi/agent/extensions/local-routing/package.json \| jq -e '.dependencies["mlx-local"]'` | [ ] TRUE [ ] FALSE |
| 3 | Extension loads in pi agent runtime when developer registers extension | AC-3 | `pi-cli extension test local-routing 2>&1 \| grep -q 'Extension loaded successfully'` | [ ] TRUE [ ] FALSE |
| 4 | index.ts exports all extension modules when developer creates entry point | AC-4 | `node -e "const ext = require('~/.pi/agent/extensions/local-routing'); console.log(Object.keys(ext))" \| grep -q 'tools'` | [ ] TRUE [ ] FALSE |
| 5 | All dependencies install without errors when developer runs npm install | AC-5 | `cd ~/.pi/agent/extensions/local-routing && npm install 2>&1 \| grep -q 'added N packages'` | [ ] TRUE [ ] FALSE |

---

## DESIGN

### Architecture

```
~/.pi/agent/extensions/local-routing/
├── package.json                  # Dependencies and metadata
├── index.ts                      # Main entry point
├── tools/                        # Agentic tools
│   ├── enrichRoute.ts
│   ├── calculateOfflineRoute.ts
│   ├── syncRoute.ts
│   └── manageOfflineRegions.ts
├── workflows/                    # Deterministic workflows
│   ├── coordinateConversion.ts
│   ├── localModelInference.ts
│   ├── crdtSync.ts
│   └── progressiveLoading.ts
└── events/                       # Event handlers
    ├── enrichmentHandlers.ts
    ├── syncHandlers.ts
    └── offlineHandlers.ts
```

### Dependencies

```json
{
  "name": "@pi-agent/extensions/local-routing",
  "version": "1.0.0",
  "description": "Local routing, offline maps, and hybrid enrichment for LaneShadow",
  "main": "index.ts",
  "dependencies": {
    "mlx-local": "^0.1.0",
    "@trestleinc/replicate": "^1.0.0",
    "@rnmapbox/maps": "^10.1.0",
    "@op-engineering/op-sqlite": "^7.0.0"
  },
  "peerDependencies": {
    "@pi-agent/core": "^1.0.0"
  }
}
```

### System Prompt

Extension adds these capabilities to pi agent:
- **Coordinate Conversion:** Convert between Google Maps [lat,lng] and Mapbox [lng,lat] formats
- **Offline Routing:** Calculate routes using downloaded Mapbox regions
- **Local Model Inference:** Generate leg labels using Qwen3.5 0.8B
- **Hybrid Enrichment:** Orchestrate local (fast) + cloud (quality) enrichment
- **CRDT Sync:** Bidirectional sync with @trestleinc/replicate
- **Progressive Loading:** Manage enrichment phase transitions

---

## GUARDRAILS

### WRITE-ALLOWED

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `~/.pi/agent/extensions/local-routing/package.json` | Extension metadata |
| CREATE | `~/.pi/agent/extensions/local-routing/index.ts` | Main entry point |
| CREATE | `~/.pi/agent/extensions/local-routing/tools/.gitkeep` | Tools directory |
| CREATE | `~/.pi/agent/extensions/local-routing/workflows/.gitkeep` | Workflows directory |
| CREATE | `~/.pi/agent/extensions/local-routing/events/.gitkeep` | Events directory |
| MODIFY | `~/.pi/agent/config.json` | Register extension |

### WRITE-PROHIBITED

- `~/.pi/agent/core/**` - Core framework files
- `~/.pi/agent/extensions/*/index.ts` - Other extensions' entry points

---

## CONSTRAINTS

| Constraint | Value | Reason |
|------------|-------|--------|
| Extension name | `local-routing` | Matches epic naming |
| Dependencies | Exactly 4 (mlx-local, @trestleinc/replicate, @rnmapbox/maps, @op-engineering/op-sqlite) | Matches PRD requirements |
| Subdirectories | Exactly 3 (tools/, workflows/, events/) | Follows pi agent patterns |
| package.json version | ^1.0.0 | Semantic versioning |

---

## VERIFICATION GATES

```bash
# Gate 1: Directory structure
test -d ~/.pi/agent/extensions/local-routing/tools && \
test -d ~/.pi/agent/extensions/local-routing/workflows && \
test -d ~/.pi/agent/extensions/local-routing/events

# Gate 2: package.json exists and valid
test -f ~/.pi/agent/extensions/local-routing/package.json && \
cat ~/.pi/agent/extensions/local-routing/package.json | jq -e '.dependencies'

# Gate 3: Extension loads
pi-cli extension test local-routing

# Gate 4: Dependencies install
cd ~/.pi/agent/extensions/local-routing && npm install

# Gate 5: Index exports
node -e "const ext = require('~/.pi/agent/extensions/local-routing'); console.log(Object.keys(ext))"
```

---

## FILES TO CREATE/MODIFY

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `~/.pi/agent/extensions/local-routing/package.json` | Extension metadata |
| CREATE | `~/.pi/agent/extensions/local-routing/index.ts` | Main entry point |
| CREATE | `~/.pi/agent/extensions/local-routing/README.md` | Extension documentation |
| CREATE | `~/.pi/agent/extensions/local-routing/tools/.gitkeep` | Tools directory placeholder |
| CREATE | `~/.pi/agent/extensions/local-routing/workflows/.gitkeep` | Workflows directory placeholder |
| CREATE | `~/.pi/agent/extensions/local-routing/events/.gitkeep` | Events directory placeholder |

---

## DESIGN NOTES

### Extension Loading

Extension must register with pi agent core:
```typescript
// index.ts
export const extension = {
  name: 'local-routing',
  version: '1.0.0',
  tools: {
    enrichRoute: require('./tools/enrichRoute'),
    calculateOfflineRoute: require('./tools/calculateOfflineRoute'),
    syncRoute: require('./tools/syncRoute'),
    manageOfflineRegions: require('./tools/manageOfflineRegions'),
  },
  workflows: {
    coordinateConversion: require('./workflows/coordinateConversion'),
    localModelInference: require('./workflows/localModelInference'),
    crdtSync: require('./workflows/crdtSync'),
    progressiveLoading: require('./workflows/progressiveLoading'),
  },
  events: {
    enrichment: require('./events/enrichmentHandlers'),
    sync: require('./events/syncHandlers'),
    offline: require('./events/offlineHandlers'),
  },
};
```

### Dependency Resolution

All dependencies must be resolvable:
- `mlx-local` - Local model runtime (may need npm link)
- `@trestleinc/replicate` - Local-first sync engine
- `@rnmapbox/maps` - Mapbox SDK (React Native, may need mock for testing)
- `@op-engineering/op-sqlite` - SQLite for React Native

---

## CONTRACT

### Agent Instructions

1. **Create directory structure** at `~/.pi/agent/extensions/local-routing/`
2. **Create package.json** with all 4 dependencies
3. **Create index.ts** with empty exports (tools/workflows/events to be filled by later tasks)
4. **Create subdirectory placeholders** (.gitkeep files)
5. **Register extension** in `~/.pi/agent/config.json`
6. **Test extension loading** with `pi-cli extension test local-routing`
7. **Verify dependencies** install without errors

### Journal Format

```json
{
  "task_id": "EPIC-LOCAL-001",
  "status": "in_progress",
  "steps_completed": [
    "Created directory structure",
    "Created package.json",
    "Created index.ts",
    "Registered extension"
  ],
  "verification_results": {
    "gate_1_structure": "PASS",
    "gate_2_package_json": "PASS",
    "gate_3_extension_loads": "PASS",
    "gate_4_dependencies": "PASS",
    "gate_5_index_exports": "PASS"
  },
  "files_created": [
    "~/.pi/agent/extensions/local-routing/package.json",
    "~/.pi/agent/extensions/local-routing/index.ts",
    "~/.pi/agent/extensions/local-routing/README.md"
  ]
}
```

---

## APPROVAL

**Approved By:** Pending
**Date:** Pending

---

**End of Task Definition**
