/**
 * S2-T8 — Standalone human-run z.ai GLM-5.2 structured-output proof CLI (T-AGT-024).
 *
 * Calls the REAL createZaiProvider / zaiStructuredComplete path. Does NOT mock
 * the provider inside this CLI. Reads Z_AI_API_KEY through the existing env
 * loader (convex/lib/env.ts) by loading .env.local into process.env first.
 *
 * Usage:
 *   pnpm tsx scripts/spike/zai-glm-proof.ts [route-description]
 *
 * If no route-description argument is given, a default curated-route
 * description is used (Twist of Tepusquet — the same one used in the
 * integration test).
 *
 * Exit codes:
 *   0 — success: non-empty structured result printed to stdout
 *   1 — missing Z_AI_API_KEY
 *   2 — provider/structured completion failure (typed error from zaiStructuredComplete)
 */
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

// CJS require — synchronous, not hoisted. Needed because convex/lib/env.ts
// requires CLERK_* env vars at module-load time, and .env.local must be in
// process.env BEFORE the import graph evaluates. ESM static imports are
// hoisted above this point, so createRequire + require is the safe path.
const require = createRequire(import.meta.url)

// --- Load .env.local into process.env so convex/lib/env.ts can read it ------
function loadDotEnvLocal(): void {
  const p = resolve(process.cwd(), '.env.local')
  if (!existsSync(p)) return
  const lines = readFileSync(p, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
    if (!(key in process.env)) {
      process.env[key] = val
    }
  }
}

loadDotEnvLocal()

// --- Now require the real provider path (goes through convex/lib/env.ts) -----
// The 'use node' directive in zaiProvider.ts is a no-op string outside Convex.
const { zaiStructuredComplete } = require('../../convex/actions/agent/lib/zaiProvider') as {
  zaiStructuredComplete: (
    description: string,
  ) => Promise<
    | { ok: true; object: { summary: string; confidence: string }; path: string }
    | { ok: false; reason: string; raw?: string }
  >
}
const { Z_AI_API_KEY } = require('../../convex/lib/env') as { Z_AI_API_KEY: string | undefined }

const DEFAULT_DESCRIPTION =
  'Highway 101 in Santa Maria, CA. Exit Betteravia Road heading East. ' +
  'Betteravia Road becomes Foxen Canyon Road. Foxen Canyon Road becomes Santa Maria Mesa Road. ' +
  'Santa Maria Mesa Road merges into Tepusquet Canyon Road. Head North on Tepusquet Canyon Road. ' +
  'Follow this all the way up the mountain and back down until you reach highway 166. ' +
  'Follow 166 West until you reach highway 101 again.'

async function main(): Promise<void> {
  if (!Z_AI_API_KEY) {
    // biome-ignore lint/suspicious/noConsole: operator CLI error output
    console.error(
      'ERROR: Z_AI_API_KEY is not set. Set it in .env.local or export it as an environment variable.',
    )
    process.exit(1)
  }

  const description = process.argv[2] ?? DEFAULT_DESCRIPTION

  if (!description || description.trim().length === 0) {
    // biome-ignore lint/suspicious/noConsole: operator CLI error output
    console.error('ERROR: route description argument is empty.')
    process.exit(2)
  }

  // biome-ignore lint/suspicious/noConsole: operator CLI progress output
  console.error('Calling z.ai GLM-5.2 via createZaiProvider / zaiStructuredComplete...')

  const result = await zaiStructuredComplete(description)

  if (!result.ok) {
    // biome-ignore lint/suspicious/noConsole: operator CLI error output
    console.error(`FAIL: z.ai structured completion failed — reason: ${result.reason}`)
    if (result.raw) {
      // biome-ignore lint/suspicious/noConsole: operator CLI error output
      console.error(`Raw output (truncated): ${result.raw.slice(0, 500)}`)
    }
    process.exit(2)
  }

  const output = {
    ok: true,
    path: result.path,
    summary: result.object.summary,
    confidence: result.object.confidence,
    summaryLength: result.object.summary.length,
    timestamp: new Date().toISOString(),
  }

  // biome-ignore lint/suspicious/noConsole: operator CLI structured output (parsed by gate tooling)
  console.log(JSON.stringify(output, null, 2))
  // biome-ignore lint/suspicious/noConsole: operator CLI human-readable summary
  console.error(`\nProof PASSED via path: ${result.path}`)
  // biome-ignore lint/suspicious/noConsole: operator CLI human-readable summary
  console.error(`Summary (${result.object.summary.length} chars): ${result.object.summary}`)
  // biome-ignore lint/suspicious/noConsole: operator CLI human-readable summary
  console.error(`Confidence: ${result.object.confidence}`)
}

main().catch((e) => {
  // biome-ignore lint/suspicious/noConsole: operator CLI fatal error
  console.error('FATAL: unexpected error:', e)
  process.exit(2)
})
