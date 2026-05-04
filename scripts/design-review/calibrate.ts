#!/usr/bin/env -S pnpm tsx

/**
 * Calibration Runner for Visual Design Review
 *
 * Evaluates the golden set using the visual-eval engine and computes precision/recall.
 *
 * AC-2: Computes precision/recall against labels and emits round JSONs
 * AC-3: Lock refused below 85% threshold
 * AC-4: Held-out validation ≤5pp drop
 * AC-6: Rounds tracked in rounds.md
 *
 * Usage: pnpm design:calibrate [--round-number N] [--lock] [--verify-locked]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
import { VisualIssueSchema } from './schemas/visual-issue.zod'

// Configuration
const GOLDEN_SET_PATH = '.spec/design/calibration/golden-set.json'
const CALIBRATION_DIR = '.design-review/calibration'
const ROUNDS_LOG_PATH = '.spec/design/calibration/rounds.md'
const PROMPT_PATH = 'scripts/design-review/prompts/visual-eval.md'
const LOCKED_PROMPT_PATH = 'scripts/design-review/prompts/visual-eval.locked.md'
const SEED = 42 // Deterministic seed for train/test split

interface GoldenEntry {
  id: string
  screen: string
  state: string
  theme: string
  reference_image: string
  test_image: string
  annotations: string
  ground_truth: {
    issues: Array<{
      component: string
      issue_type: 'spacing' | 'color' | 'typography' | 'placement' | 'overflow' | 'missing'
      severity: 'low' | 'med' | 'high'
    }>
    expected_verdict: 'pass' | 'fail'
  }
}

interface GoldenSet {
  entries: GoldenEntry[]
  metadata: {
    total_entries: number
    passing_count: number
    single_issue_count: number
    multi_issue_count: number
    issue_types: string[]
  }
}

interface CalibrationRound {
  round_number: number
  timestamp: string
  scores: {
    precision: number
    recall: number
    f1: number
    true_positives: number
    false_positives: number
    true_negatives: number
    false_negatives: number
  }
  split: {
    calibration: string[]
    held_out: string[]
  }
  prompt_path: string
}

/**
 * Seeded random number generator for deterministic split
 */
function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 9301 + 49297) % 233280
    return state / 233280
  }
}

/**
 * Shuffle array using seeded random
 */
function seededShuffle<T>(array: T[], seed: number): T[] {
  const shuffled = [...array]
  const random = seededRandom(seed)
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Split golden set into calibration (10) and held-out (5) sets
 */
function splitGoldenSet(entries: GoldenEntry[]): {
  calibration: GoldenEntry[]
  held_out: GoldenEntry[]
} {
  const shuffled = seededShuffle(entries, SEED)
  return {
    calibration: shuffled.slice(0, 10),
    held_out: shuffled.slice(10, 15),
  }
}

/**
 * Load system prompt (locked or base)
 */
function loadSystemPrompt(useLocked = false): string {
  const path = useLocked && existsSync(LOCKED_PROMPT_PATH) ? LOCKED_PROMPT_PATH : PROMPT_PATH
  if (!existsSync(path)) {
    throw new Error(`Prompt file not found: ${path}`)
  }
  return readFileSync(path, 'utf-8')
}

/**
 * Convert PNG to base64
 */
function pngToBase64(filePath: string): string {
  const buffer = readFileSync(filePath)
  return buffer.toString('base64')
}

/**
 * Load annotations
 */
function loadAnnotations(filePath: string) {
  const content = readFileSync(filePath, 'utf-8')
  return JSON.parse(content)
}

/**
 * Evaluate a single entry using Claude
 */
async function evaluateEntry(
  client: Anthropic,
  entry: GoldenEntry,
  systemPrompt: string,
  retryCount = 0,
): Promise<{ success: boolean; issues?: unknown }> {
  try {
    const referenceBase64 = pngToBase64(entry.reference_image)
    const testBase64 = pngToBase64(entry.test_image)
    const annotationsData = loadAnnotations(entry.annotations)

    const userContent = `Screen: ${entry.screen}\nState: ${entry.state}\nTheme: ${entry.theme}\n\nAnnotations:\n${JSON.stringify(annotationsData.components, null, 2)}`

    const retryHint =
      retryCount > 0
        ? '\n\nNOTE: Your previous output failed schema validation. Please ensure your response is valid JSON matching the exact schema specified in the system prompt.'
        : ''

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
              source: { type: 'base64', media_type: 'image/png', data: referenceBase64 },
            },
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/png', data: testBase64 },
            },
            { type: 'text', text: userContent + retryHint },
          ],
        },
      ],
    })

    const responseText = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const jsonMatch =
      responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\[[\s\S]*\]/)

    if (!jsonMatch) {
      throw new Error('No valid JSON found in response')
    }

    const jsonResponse = jsonMatch[1] || jsonMatch[0]

    try {
      const issues = VisualIssueSchema.parse(JSON.parse(jsonResponse))
      return { success: true, issues }
    } catch (parseError) {
      if (retryCount === 0) {
        return evaluateEntry(client, entry, systemPrompt, retryCount + 1)
      } else {
        return { success: false }
      }
    }
  } catch (error) {
    return { success: false }
  }
}

/**
 * Compute precision/recall/F1 from predictions vs ground truth
 */
function computeScores(
  predictions: Array<{ entry_id: string; issues?: unknown }>,
  groundTruth: GoldenEntry[],
): {
  precision: number
  recall: number
  f1: number
  true_positives: number
  false_positives: number
  true_negatives: number
  false_negatives: number
} {
  let truePositives = 0
  let falsePositives = 0
  let trueNegatives = 0
  let falseNegatives = 0

  for (const pred of predictions) {
    const gt = groundTruth.find((e) => e.id === pred.entry_id)
    if (!gt) continue

    const predIssues = pred.issues ? (pred.issues as unknown[]).length : 0
    const gtIssues = gt.ground_truth.issues.length

    // Build sets of (component, issue_type) tuples for comparison
    const predSet = new Set<string>()
    if (pred.issues && Array.isArray(pred.issues)) {
      for (const issue of pred.issues as unknown[]) {
        if (
          typeof issue === 'object' &&
          issue !== null &&
          'component' in issue &&
          'issue_type' in issue
        ) {
          predSet.add(`${issue.component}:${issue.issue_type}`)
        }
      }
    }

    const gtSet = new Set<string>()
    for (const issue of gt.ground_truth.issues) {
      gtSet.add(`${issue.component}:${issue.issue_type}`)
    }

    // Count TP/FP/FN based on issue matches
    for (const key of predSet) {
      if (gtSet.has(key)) {
        truePositives++
      } else {
        falsePositives++
      }
    }

    for (const key of gtSet) {
      if (!predSet.has(key)) {
        falseNegatives++
      }
    }

    // TN: correctly identified as passing (no issues expected, no issues found)
    if (gtIssues === 0 && predIssues === 0) {
      trueNegatives++
    }
  }

  const precision =
    truePositives + falsePositives > 0 ? truePositives / (truePositives + falsePositives) : 1.0
  const recall =
    truePositives + falseNegatives > 0 ? truePositives / (truePositives + falseNegatives) : 1.0
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0.0

  return {
    precision,
    recall,
    f1,
    true_positives: truePositives,
    false_positives: falsePositives,
    true_negatives: trueNegatives,
    false_negatives: falseNegatives,
  }
}

/**
 * Append round entry to rounds.md
 */
function appendRoundLog(round: CalibrationRound, promptDiff?: string): void {
  let log = ''
  if (existsSync(ROUNDS_LOG_PATH)) {
    log = readFileSync(ROUNDS_LOG_PATH, 'utf-8')
  } else {
    log =
      '# Calibration Rounds\n\nThis file tracks all calibration iterations for the visual design review system.\n\n'
  }

  const entry =
    `## Round ${round.round_number} - ${round.timestamp}\n\n` +
    `**Scores:**\n` +
    `- Precision: ${(round.scores.precision * 100).toFixed(1)}%\n` +
    `- Recall: ${(round.scores.recall * 100).toFixed(1)}%\n` +
    `- F1: ${(round.scores.f1 * 100).toFixed(1)}%\n\n` +
    `**Confusion Matrix:**\n` +
    `- TP: ${round.scores.true_positives}\n` +
    `- FP: ${round.scores.false_positives}\n` +
    `- TN: ${round.scores.true_negatives}\n` +
    `- FN: ${round.scores.false_negatives}\n\n` +
    `**Split:**\n` +
    `- Calibration: ${round.split.calibration.length} entries\n` +
    `- Held-out: ${round.split.held_out.length} entries\n\n` +
    `**Prompt:** ${round.prompt_path}\n\n` +
    (promptDiff ? `**Changes:**\n${promptDiff}\n\n` : '') +
    `---\n\n`

  writeFileSync(ROUNDS_LOG_PATH, log + entry)
}

/**
 * Main calibration function
 */
async function calibrate(roundNumber = 1, lock = false, verifyLocked = false): Promise<void> {
  console.log('🔍 Starting calibration...')

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required')
  }

  // Load golden set
  if (!existsSync(GOLDEN_SET_PATH)) {
    throw new Error(`Golden set not found: ${GOLDEN_SET_PATH}`)
  }

  const goldenSetContent = readFileSync(GOLDEN_SET_PATH, 'utf-8')
  const goldenSet: GoldenSet = JSON.parse(goldenSetContent)

  console.log(`📋 Loaded ${goldenSet.entries.length} golden set entries`)

  // Load system prompt
  const useLocked = verifyLocked || lock
  const systemPrompt = loadSystemPrompt(useLocked)
  const promptPath = useLocked && existsSync(LOCKED_PROMPT_PATH) ? LOCKED_PROMPT_PATH : PROMPT_PATH
  console.log(`✅ Loaded system prompt from ${promptPath}`)

  // Split into calibration and held-out sets
  const { calibration, held_out } = splitGoldenSet(goldenSet.entries)
  console.log(`📊 Split: ${calibration.length} calibration, ${held_out.length} held-out`)

  // Create Anthropic client
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Evaluate calibration set
  console.log(`\n🔬 Evaluating calibration set...`)
  const calibrationResults: Array<{ entry_id: string; issues?: unknown }> = []
  for (const entry of calibration) {
    console.log(`  ⏳ ${entry.id}...`)
    const result = await evaluateEntry(client, entry, systemPrompt)
    calibrationResults.push({ entry_id: entry.id, issues: result.issues })
    console.log(`  ${result.success ? '✅' : '❌'} ${entry.id}`)
  }

  // Compute scores on calibration set
  const calibrationScores = computeScores(calibrationResults, calibration)
  console.log(`\n📊 Calibration Scores:`)
  console.log(`   Precision: ${(calibrationScores.precision * 100).toFixed(1)}%`)
  console.log(`   Recall: ${(calibrationScores.recall * 100).toFixed(1)}%`)
  console.log(`   F1: ${(calibrationScores.f1 * 100).toFixed(1)}%`)

  // AC-3: Lock refused below 85%
  if (lock && (calibrationScores.precision < 0.85 || calibrationScores.recall < 0.85)) {
    console.error(`\n❌ Lock refused: precision/recall below 85% threshold`)
    console.error(
      `   Precision: ${(calibrationScores.precision * 100).toFixed(1)}% (required: ≥85%)`,
    )
    console.error(`   Recall: ${(calibrationScores.recall * 100).toFixed(1)}% (required: ≥85%)`)
    process.exit(1)
  }

  // Evaluate held-out set
  console.log(`\n🔬 Evaluating held-out set...`)
  const heldOutResults: Array<{ entry_id: string; issues?: unknown }> = []
  for (const entry of held_out) {
    console.log(`  ⏳ ${entry.id}...`)
    const result = await evaluateEntry(client, entry, systemPrompt)
    heldOutResults.push({ entry_id: entry.id, issues: result.issues })
    console.log(`  ${result.success ? '✅' : '❌'} ${entry.id}`)
  }

  // Compute scores on held-out set
  const heldOutScores = computeScores(heldOutResults, held_out)
  console.log(`\n📊 Held-out Scores:`)
  console.log(`   Precision: ${(heldOutScores.precision * 100).toFixed(1)}%`)
  console.log(`   Recall: ${(heldOutScores.recall * 100).toFixed(1)}%`)
  console.log(`   F1: ${(heldOutScores.f1 * 100).toFixed(1)}%`)

  // AC-4: Held-out drift ≤5pp
  const precisionDrift = Math.abs(calibrationScores.precision - heldOutScores.precision)
  const recallDrift = Math.abs(calibrationScores.recall - heldOutScores.recall)
  const maxDrift = 0.05 // 5 percentage points

  if (precisionDrift > maxDrift || recallDrift > maxDrift) {
    console.error(`\n❌ Held-out drift exceeds 5pp threshold`)
    console.error(`   Precision drift: ${(precisionDrift * 100).toFixed(1)}% (max: 5%)`)
    console.error(`   Recall drift: ${(recallDrift * 100).toFixed(1)}% (max: 5%)`)
    if (lock) {
      console.error(`   Lock aborted due to overfitting`)
      process.exit(1)
    }
  } else {
    console.log(`✅ Held-out drift within bounds`)
  }

  // Build round object
  const round: CalibrationRound = {
    round_number: roundNumber,
    timestamp: new Date().toISOString(),
    scores: calibrationScores,
    split: {
      calibration: calibration.map((e) => e.id),
      held_out: held_out.map((e) => e.id),
    },
    prompt_path: promptPath,
  }

  // Ensure output directory exists
  mkdirSync(CALIBRATION_DIR, { recursive: true })

  // Write round file
  const roundPath = join(CALIBRATION_DIR, `round-${roundNumber}.json`)
  writeFileSync(roundPath, JSON.stringify(round, null, 2))
  console.log(`\n📁 Round written to ${roundPath}`)

  // AC-6: Track round in rounds.md
  appendRoundLog(round)
  console.log(`📝 Round logged to ${ROUNDS_LOG_PATH}`)

  // AC-5: Lock prompt if requested and thresholds met
  if (lock) {
    console.log(`\n🔒 Locking prompt...`)
    writeFileSync(LOCKED_PROMPT_PATH, systemPrompt)
    console.log(`✅ Prompt locked to ${LOCKED_PROMPT_PATH}`)
  }

  console.log(`\n✅ Calibration complete`)
}

// Parse CLI args
const args = process.argv.slice(2)
let roundNumber = 1
let lock = false
let verifyLocked = false

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--round-number' && args[i + 1]) {
    roundNumber = parseInt(args[i + 1], 10)
    i++
  } else if (args[i] === '--lock') {
    lock = true
  } else if (args[i] === '--verify-locked') {
    verifyLocked = true
  }
}

// Run if called directly
if (require.main === module || import.meta.url === `file://${process.argv[1]}`) {
  calibrate(roundNumber, lock, verifyLocked).catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { calibrate, computeScores }
