#!/usr/bin/env tsx

/**
 * check-motion-refs.ts
 *
 * Validates that all motion recipe duration and easing fields reference primitive tokens
 * (e.g., {motion.duration.standard}, {motion.easing.decelerated}) rather than raw numbers.
 *
 * Usage: pnpm tsx tokens/scripts/check-motion-refs.ts tokens/semantic/motion.tokens.json
 *
 * Exits 0 if all recipes use primitive references
 * Exits 1 if any recipe uses raw numbers or references are malformed
 */

interface MotionToken {
  $type: string
  $value: number | number[]
}

interface MotionRecipe {
  duration: string | number
  easing?: string | number[] | { $type: string; $value: number[] }
  iteration?: string
}

interface MotionTokens {
  motion: {
    duration: Record<string, MotionToken>
    easing: Record<string, MotionToken>
    [recipeName: string]: MotionRecipe | Record<string, MotionToken>
  }
}

// Token reference pattern: {motion.duration.*} or {motion.easing.*}
const TOKEN_REF_PATTERN = /^\{motion\.(duration|easing)\.[a-zA-Z0-9]+\}$/

function isRecipe(value: unknown): value is MotionRecipe {
  return (
    typeof value === 'object' && value !== null && 'duration' in value && !('$type' in value) // Primitives have $type, recipes don't
  )
}

function validateRecipe(name: string, recipe: MotionRecipe): string[] {
  const errors: string[] = []

  // Check duration field
  const duration = recipe.duration
  if (typeof duration === 'number') {
    errors.push(
      `Recipe "${name}" has raw number for duration: ${duration}. Expected token reference like {motion.duration.standard}`,
    )
  } else if (typeof duration === 'string') {
    if (!TOKEN_REF_PATTERN.test(duration)) {
      errors.push(
        `Recipe "${name}" has malformed duration reference: "${duration}". Expected format: {motion.duration.<primitive>}`,
      )
    } else if (!duration.startsWith('{motion.duration.')) {
      errors.push(
        `Recipe "${name}" duration references wrong token type: "${duration}". Expected {motion.duration.<primitive>}`,
      )
    }
  } else {
    errors.push(`Recipe "${name}" has invalid duration type: ${typeof duration}`)
  }

  // Check easing field (required for all recipes)
  const easing = recipe.easing
  if (easing === undefined || easing === null) {
    errors.push(`Recipe "${name}" is missing required "easing" field`)
  } else if (Array.isArray(easing)) {
    errors.push(
      `Recipe "${name}" has raw array for easing: [${easing}]. Expected token reference like {motion.easing.standard}`,
    )
  } else if (typeof easing === 'object' && '$value' in easing) {
    errors.push(
      `Recipe "${name}" has raw easing object with $value. Expected token reference like {motion.easing.standard}`,
    )
  } else if (typeof easing === 'number') {
    errors.push(
      `Recipe "${name}" has raw number for easing: ${easing}. Expected token reference like {motion.easing.standard}`,
    )
  } else if (typeof easing === 'string') {
    if (!TOKEN_REF_PATTERN.test(easing)) {
      errors.push(
        `Recipe "${name}" has malformed easing reference: "${easing}". Expected format: {motion.easing.<primitive>}`,
      )
    } else if (!easing.startsWith('{motion.easing.')) {
      errors.push(
        `Recipe "${name}" easing references wrong token type: "${easing}". Expected {motion.easing.<primitive>}`,
      )
    }
  } else {
    errors.push(`Recipe "${name}" has invalid easing type: ${typeof easing}`)
  }

  return errors
}

function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.error('Usage: tsx tokens/scripts/check-motion-refs.ts <path-to-motion.tokens.json>')
    process.exit(1)
  }

  const filePath = args[0]

  // Read and parse the token file
  let tokens: MotionTokens
  try {
    const fileContent = require('node:fs').readFileSync(filePath, 'utf-8')
    tokens = JSON.parse(fileContent)
  } catch (error) {
    console.error(`Failed to read or parse ${filePath}:`, error)
    process.exit(1)
  }

  // Validate structure
  if (!tokens.motion || typeof tokens.motion !== 'object') {
    console.error('Invalid motion tokens file: missing or invalid "motion" root')
    process.exit(1)
  }

  const allErrors: string[] = []

  // Iterate through all motion properties
  for (const [key, value] of Object.entries(tokens.motion)) {
    if (key === 'duration' || key === 'easing') {
      continue // Skip primitive definitions
    }

    if (isRecipe(value)) {
      const recipeErrors = validateRecipe(key, value)
      allErrors.push(...recipeErrors)
    }
  }

  // Report results
  if (allErrors.length > 0) {
    console.error('❌ Motion token validation failed:\n')
    allErrors.forEach((error) => console.error(`  - ${error}`))
    console.error(`\nFound ${allErrors.length} error(s)`)
    process.exit(1)
  } else {
    console.log('✅ All motion recipes use primitive token references')
    process.exit(0)
  }
}

main()
