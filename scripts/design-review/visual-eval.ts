#!/usr/bin/env -S pnpm tsx

/**
 * Visual Design Review Engine
 *
 * Evaluates iOS XCUITest captures against design references using Claude Sonnet 4.6 multimodal.
 *
 * AC-1: Performs multimodal Anthropic call per manifest entry
 * AC-3: One-shot retry on schema failure
 * AC-4: Concurrency capped at DESIGN_REVIEW_CONCURRENCY (default 3)
 * AC-5: Prompt loaded from prompts/visual-eval.md
 *
 * Usage: pnpm design:eval
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
import { VisualIssueSchema } from './schemas/visual-issue.zod'

// Configuration
const MANIFEST_PATH = '.design-review/manifest.json'
const OUTPUT_DIR = '.design-review/evals/visual'
const PROMPT_PATH = 'scripts/design-review/prompts/visual-eval.md'
const LOCKED_PROMPT_PATH = 'scripts/design-review/prompts/visual-eval.locked.md'
const CONCURRENCY = Number(process.env.DESIGN_REVIEW_CONCURRENCY) || 3

interface ManifestEntry {
  id: string
  screen: string
  state: string
  theme: string
  captured: string
  captured_metadata: string
  reference: string
  annotations: string
}

interface Manifest {
  entries: ManifestEntry[]
  generated_at: string
}

interface Annotations {
  screen: string
  state: string
  theme: string
  viewport: { width: number; height: number }
  components: Array<{
    name: string
    selector: string
    bounding_box: { x: number; y: number; w: number; h: number }
    design_tokens: Record<string, string>
  }>
}

interface EvalResult {
  entry_id: string
  screen: string
  state: string
  theme: string
  evaluated_at: string
  status: 'success' | 'error'
  issues?: unknown // VisualIssue type from Zod schema
  error?: string
  retry_count: number
}

/**
 * Load the system prompt from disk
 * AC-5: Reads from locked prompt when present, falls back to base prompt
 */
function loadSystemPrompt(): string {
  // Prefer locked prompt if it exists
  if (existsSync(LOCKED_PROMPT_PATH)) {
    return readFileSync(LOCKED_PROMPT_PATH, 'utf-8')
  }
  if (!existsSync(PROMPT_PATH)) {
    throw new Error(`Prompt file not found: ${PROMPT_PATH}`)
  }
  return readFileSync(PROMPT_PATH, 'utf-8')
}

/**
 * Convert a PNG file to base64 for Anthropic API
 */
function pngToBase64(filePath: string): string {
  const buffer = readFileSync(filePath)
  return buffer.toString('base64')
}

/**
 * Load annotations JSON file
 */
function loadAnnotations(filePath: string): Annotations {
  const content = readFileSync(filePath, 'utf-8')
  return JSON.parse(content) as Annotations
}

/**
 * Evaluate a single manifest entry using Claude Sonnet 4.6
 */
async function evaluateEntry(
  client: Anthropic,
  entry: ManifestEntry,
  systemPrompt: string,
  retryCount = 0,
): Promise<EvalResult> {
  const { id, screen, state, theme, captured, reference, annotations } = entry

  try {
    // Load images as base64
    const referenceBase64 = pngToBase64(reference)
    const capturedBase64 = pngToBase64(captured)

    // Load annotations
    const annotationsData = loadAnnotations(annotations)

    // Build user content with annotations and context
    const userContent = `Screen: ${screen}\nState: ${state}\nTheme: ${theme}\n\nAnnotations:\n${JSON.stringify(annotationsData.components, null, 2)}`

    // Build retry hint if this is a retry
    const retryHint =
      retryCount > 0
        ? '\n\nNOTE: Your previous output failed schema validation. Please ensure your response is valid JSON matching the exact schema specified in the system prompt.'
        : ''

    // Call Anthropic API with multimodal content
    // CRITICAL: Image 1 = reference, Image 2 = captured (order is semantically load-bearing)
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: referenceBase64,
              },
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: capturedBase64,
              },
            },
            {
              type: 'text',
              text: userContent + retryHint,
            },
          ],
        },
      ],
    })

    // Extract JSON from response
    const responseText = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const jsonMatch =
      responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\[[\s\S]*\]/)

    if (!jsonMatch) {
      throw new Error('No valid JSON found in response')
    }

    const jsonResponse = jsonMatch[1] || jsonMatch[0]

    // Validate against Zod schema
    let issues
    try {
      issues = VisualIssueSchema.parse(JSON.parse(jsonResponse))
    } catch (parseError) {
      if (retryCount === 0) {
        // One-shot retry on schema failure
        console.warn(`  ⚠️  Schema validation failed for ${id}, retrying...`)
        console.warn(
          `     Error: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        )
        return evaluateEntry(client, entry, systemPrompt, retryCount + 1)
      } else {
        // Second failure - record error and continue
        console.error(`  ❌ Schema validation failed twice for ${id}, recording error status`)
        return {
          entry_id: id,
          screen,
          state,
          theme,
          evaluated_at: new Date().toISOString(),
          status: 'error',
          error: `Schema validation failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          retry_count: retryCount,
        }
      }
    }

    return {
      entry_id: id,
      screen,
      state,
      theme,
      evaluated_at: new Date().toISOString(),
      status: 'success',
      issues,
      retry_count: retryCount,
    }
  } catch (error) {
    console.error(
      `  ❌ Error evaluating ${id}:`,
      error instanceof Error ? error.message : String(error),
    )

    return {
      entry_id: id,
      screen,
      state,
      theme,
      evaluated_at: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      retry_count: retryCount,
    }
  }
}

/**
 * Main evaluation function
 */
async function visualEval(): Promise<void> {
  console.log('🔍 Starting visual design review evaluation...')

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required')
  }

  // Load manifest
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error(`Manifest not found: ${MANIFEST_PATH}`)
  }

  const manifestContent = readFileSync(MANIFEST_PATH, 'utf-8')
  const manifest: Manifest = JSON.parse(manifestContent)

  if (manifest.entries.length === 0) {
    console.log('ℹ️  No entries in manifest to evaluate')
    return
  }

  console.log(`📋 Found ${manifest.entries.length} entries to evaluate`)

  // Load system prompt
  const systemPrompt = loadSystemPrompt()
  console.log(`✅ Loaded system prompt from ${PROMPT_PATH}`)

  // Create Anthropic client
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  // Ensure output directory exists
  mkdirSync(OUTPUT_DIR, { recursive: true })

  // Simple concurrency limiter (p-limit equivalent)
  let inFlight = 0
  const maxConcurrent = CONCURRENCY
  const results: EvalResult[] = []

  const evaluateWithConcurrencyLimit = async (entry: ManifestEntry): Promise<void> => {
    // Wait until we have concurrency slot
    while (inFlight >= maxConcurrent) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    inFlight++
    console.log(`  ⏳ Evaluating ${entry.id}... (${inFlight}/${maxConcurrent} in-flight)`)

    try {
      const result = await evaluateEntry(client, entry, systemPrompt)
      results.push(result)

      // Write result to file
      const outputPath = join(OUTPUT_DIR, `${entry.id}.json`)
      writeFileSync(outputPath, JSON.stringify(result, null, 2))

      if (result.status === 'success') {
        const issueCount = result.issues ? (result.issues as unknown[]).length : 0
        console.log(`  ✅ ${entry.id}: ${issueCount} issues found`)
      } else {
        console.log(`  ❌ ${entry.id}: ${result.error}`)
      }
    } finally {
      inFlight--
    }
  }

  // Process all entries with concurrency limit
  const promises = manifest.entries.map((entry) => evaluateWithConcurrencyLimit(entry))
  await Promise.all(promises)

  // Summary
  const successCount = results.filter((r) => r.status === 'success').length
  const errorCount = results.filter((r) => r.status === 'error').length

  console.log('')
  console.log('📊 Evaluation complete')
  console.log(`   ✅ Successful: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`   📁 Results written to ${OUTPUT_DIR}/`)
}

// Run if called directly
if (require.main === module || import.meta.url === `file://${process.argv[1]}`) {
  visualEval().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { visualEval }
