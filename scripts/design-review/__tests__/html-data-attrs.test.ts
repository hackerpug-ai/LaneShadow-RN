import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const DESIGN_SYSTEM_ROOT = join(process.cwd(), '.spec', 'design', 'system')
const VIEWS_DIR = join(DESIGN_SYSTEM_ROOT, 'views')

// Get all view directories
const viewDirs = readdirSync(VIEWS_DIR, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith('.'))
  .map((dirent) => dirent.name)

const failures: string[] = []
let sectionsChecked = 0

for (const view of viewDirs) {
  const htmlPath = join(VIEWS_DIR, view, `${view}.html`)
  const html = readFileSync(htmlPath, 'utf-8')

  // Extract all <section> elements
  const sectionRegex = /<section[^>]*>/g
  const sections = html.match(sectionRegex) || []

  if (sections.length === 0) {
    failures.push(`No sections found in ${view}`)
    continue
  }

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]
    sectionsChecked++

    if (!section.includes('data-screen=')) {
      failures.push(`${view} section ${i + 1}: missing data-screen attribute`)
    }
    if (!section.includes('data-state=')) {
      failures.push(`${view} section ${i + 1}: missing data-state attribute`)
    }
    if (!section.includes('data-theme=')) {
      failures.push(`${view} section ${i + 1}: missing data-theme attribute`)
    }
  }
}

console.log(`Checked ${sectionsChecked} sections across ${viewDirs.length} views`)

if (failures.length > 0) {
  console.error('\n❌ FAILURES:')
  failures.forEach((f) => console.error(`  - ${f}`))
  process.exit(1)
}

console.log('✅ All sections have required data attributes')
process.exit(0)
