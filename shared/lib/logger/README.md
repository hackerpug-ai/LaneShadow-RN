# Logger Module

Structured JSONL logging for LaneShadow coding agent debugging.

## Architecture

Both frontend and backend use `console.log` with `[LOG]` prefix for structured JSON output. Logs are captured via:
- **Frontend**: Metro/Expo console (visible in terminal while running simulator)
- **Backend (Convex)**: MCP console.log interception

A log collector script (or MCP) can parse `[LOG]` prefixed lines and write them to `.temp/logs/`.

## Files

| File | Purpose |
|------|---------|
| `types.ts` | Shared log entry types and `createBackendLogEntry` helper |
| `config.ts` | Environment-aware configuration (LOG_ENABLED, LOG_LEVEL) |
| `frontend-logger.ts` | Frontend console.log logger with `[LOG]` prefix |
| `convex/lib/logger.ts` | Convex console.log helper with `[LOG]` prefix |
| `components/logging/error-boundary.tsx` | React error boundary with logging |

## Usage

### Frontend

```typescript
import { logger } from '@/lib/logger/frontend-logger'

logger.info('ui.action', 'button pressed', { button: 'submit' })
logger.warn('ui.action', 'network slow', { latency: 5000 })
logger.error('ui.error', 'api failed', error, { endpoint: '/api/submit' })
```

### Convex Backend

```typescript
import { backend } from '../../lib/logger'

backend.info('convex.action', 'planRide started', { userId })
backend.error('convex.action', 'planRide failed', error, { userId })
```

Or use the raw helper:

```typescript
import { logBackend } from '../../lib/logger'

logBackend('info', 'convex.action', 'planRide started', { userId })
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_ENABLED` | `true` (dev), `false` (prod) | Enable/disable logging |
| `LOG_LEVEL` | `info` | Minimum log level: `debug`, `info`, `warn`, `error` |
| `LOG_INCLUDE_CONSOLE` | `true` | Also log readable format to console (frontend only) |

## Log Entry Format

```json
{
  "timestamp": "2026-03-03T23:00:00.000Z",
  "level": "info",
  "platform": "frontend" | "backend",
  "environment": "development",
  "sessionId": "sess_1741065600000_abc123",
  "category": "ui.action",
  "message": "button pressed",
  "data": { "button": "submit" }
}
```

## Console Output

All logs are prefixed with `[LOG]` for easy filtering:

```
[LOG]{"timestamp":"2026-03-03T23:00:00.000Z","level":"info","platform":"frontend",...}
[LOG]{"timestamp":"2026-03-03T23:00:01.000Z","level":"info","platform":"backend",...}
```

## Log Categories

### Convex Functions (backend)
- `convex.query` - Query calls
- `convex.mutation` - Mutation calls
- `convex.action` - Action calls

### AI/Agent (backend)
- `agent.start` - Agent workflow started
- `agent.step` - Agent step completed
- `agent.complete` - Agent workflow completed
- `agent.error` - Agent workflow error
- `llm.request` - LLM API request
- `llm.response` - LLM API response

### External APIs (backend)
- `api.weather` - Weather API calls
- `api.routing` - Routing API calls
- `api.places` - Places API calls

### Frontend
- `ui.action` - User actions
- `ui.navigation` - Navigation events
- `ui.error` - Frontend errors
- `ui.lifecycle` - Component lifecycle events

### System
- `system.startup` - App startup
- `system.auth` - Authentication events
- `system.error` - System-level errors

## Capturing Logs to Files

While running the simulator, logs appear in the terminal prefixed with `[LOG]`. To write to `.temp/logs/`:

### Option 1: MCP Log Collection
Use MCP to intercept console output and parse `[LOG]` lines into files.

### Option 2: Manual Grep
```bash
# Run app in background, capture logs
pnpm start 2>&1 | tee /tmp/lanelogs.log

# Extract and write to files
grep '^\[LOG\]' /tmp/lanelogs.log | sed 's/^\[LOG\]//' > .temp/logs/combined.jsonl
```

### Option 3: Simple Script
Create a log collector that reads from the terminal and writes to files.

## Coding Agent Usage

Logs are structured JSONL - one JSON object per line. Easy for agents to parse:

```bash
# Find all errors
grep '\[LOG\]' /tmp/lanelogs.log | jq 'select(.level == "error")'

# Find planRide action logs
grep '\[LOG\]' /tmp/lanelogs.log | jq 'select(.category == "convex.action")'

# Get logs for a specific session
grep "sess_1741065600000_abc123" .temp/logs/combined.jsonl
```

## Integration Steps

1. **Frontend**: Initialize in `app/_layout.tsx` ✅
2. **Backend**: Import and use `backend` from `convex/lib/logger` ✅
3. **Error Boundary**: Added to root layout ✅
4. **Hooks**: Example in `use-plan-ride.ts` ✅
5. **Actions**: Example in `planRide.ts` ✅

