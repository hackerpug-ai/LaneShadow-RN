import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const DESIGN_SYSTEM_ROOT = join(process.cwd(), '.spec', 'design', 'system')
const REFS_DIR = join(DESIGN_SYSTEM_ROOT, 'refs')

interface Annotation {
  screen: string
  state: string
  theme: string
  viewport: {
    width: number
    height: number
  }
  components: Array<{
    name: string
    selector: string
    bounding_box: {
      x: number
      y: number
      w: number
      h: number
    }
    design_tokens: Record<string, string>
  }>
}

function validateAnnotation(
  filePath: string,
  content: string,
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  try {
    const annotation: Annotation = JSON.parse(content)

    // Validate required fields
    if (!annotation.screen) errors.push("Missing 'screen' field")
    if (!annotation.state) errors.push("Missing 'state' field")
    if (!annotation.theme) errors.push("Missing 'theme' field")

    // Validate viewport
    if (!annotation.viewport) {
      errors.push("Missing 'viewport' field")
    } else {
      if (typeof annotation.viewport.width !== 'number')
        errors.push('viewport.width must be a number')
      if (typeof annotation.viewport.height !== 'number')
        errors.push('viewport.height must be a number')
    }

    // Validate components
    if (!Array.isArray(annotation.components)) {
      errors.push("'components' must be an array")
    } else {
      annotation.components.forEach((comp, index) => {
        if (!comp.name) errors.push(`Component ${index}: missing 'name'`)
        if (!comp.selector) errors.push(`Component ${index}: missing 'selector'`)
        if (!comp.bounding_box) errors.push(`Component ${index}: missing 'bounding_box'`)
        else {
          const box = comp.bounding_box
          if (typeof box.x !== 'number')
            errors.push(`Component ${index}: bounding_box.x must be a number`)
          if (typeof box.y !== 'number')
            errors.push(`Component ${index}: bounding_box.y must be a number`)
          if (typeof box.w !== 'number')
            errors.push(`Component ${index}: bounding_box.w must be a number`)
          if (typeof box.h !== 'number')
            errors.push(`Component ${index}: bounding_box.h must be a number`)
        }
        if (typeof comp.design_tokens !== 'object')
          errors.push(`Component ${index}: design_tokens must be an object`)
      })
    }
  } catch (error) {
    errors.push(`JSON parse error: ${error}`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

function main(): void {
  console.log('Validating annotation files...\n')

  const screenDirs = readdirSync(REFS_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

  let totalFiles = 0
  let validFiles = 0
  const allErrors: string[] = []

  for (const screen of screenDirs) {
    const screenPath = join(REFS_DIR, screen)
    const files = readdirSync(screenPath)
    const annotationFiles = files.filter((f) => f.endsWith('.annotations.json'))

    for (const file of annotationFiles) {
      const filePath = join(screenPath, file)
      const content = readFileSync(filePath, 'utf-8')
      const validation = validateAnnotation(filePath, content)

      totalFiles++
      if (validation.valid) {
        validFiles++
      } else {
        console.error(`❌ ${filePath}:`)
        validation.errors.forEach((err) => console.error(`   - ${err}`))
        allErrors.push(...validation.errors.map((e) => `${filePath}: ${e}`))
      }
    }
  }

  console.log(`\n${validFiles}/${totalFiles} annotation files are valid`)

  if (allErrors.length > 0) {
    console.error(`\n❌ Found ${allErrors.length} validation errors`)
    process.exit(1)
  }

  if (totalFiles < 40) {
    console.error(`\n❌ Expected at least 40 annotation files, but found ${totalFiles}`)
    process.exit(1)
  }

  console.log('✅ All annotation files are valid')
  process.exit(0)
}

main()
