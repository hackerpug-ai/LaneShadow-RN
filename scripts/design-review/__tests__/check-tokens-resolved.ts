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

function checkTokensResolved(
  filePath: string,
  content: string,
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  try {
    const annotation: Annotation = JSON.parse(content)

    // Check if annotation has components
    if (!Array.isArray(annotation.components) || annotation.components.length === 0) {
      errors.push('No components found in annotation')
      return { valid: false, errors }
    }

    // Check if at least one component has non-empty design_tokens
    const hasTokens = annotation.components.some(
      (comp) =>
        comp.design_tokens &&
        typeof comp.design_tokens === 'object' &&
        Object.keys(comp.design_tokens).length > 0,
    )

    if (!hasTokens) {
      errors.push(
        'No components with resolved design_tokens found. Expected at least one component with design_tokens.',
      )
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
  console.log('Checking design_tokens resolution in annotation files...\n')

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
      const validation = checkTokensResolved(filePath, content)

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

  console.log(`\n${validFiles}/${totalFiles} annotation files have resolved design_tokens`)

  if (allErrors.length > 0) {
    console.error(`\n❌ Found ${allErrors.length} token resolution errors`)
    process.exit(1)
  }

  if (totalFiles < 40) {
    console.error(`\n❌ Expected at least 40 annotation files, but found ${totalFiles}`)
    process.exit(1)
  }

  console.log('✅ All annotation files have resolved design_tokens')
  process.exit(0)
}

main()
