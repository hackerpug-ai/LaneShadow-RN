import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

interface Variant {
  stateName: string
  theme: string
}

function parseVariantsFromReadme(readmePath: string): Variant[] {
  const content = readFileSync(readmePath, 'utf-8')
  const variants: Variant[] = []

  // Find the Variants table
  const variantsTableMatch = content.match(/## Variants\s+([\s\S]*?)(?=##|\n---)/)
  if (!variantsTableMatch) {
    return variants
  }

  const tableContent = variantsTableMatch[1]
  const rows = tableContent.match(/^\|[^\n]+\|$/gm) || []

  for (const row of rows) {
    // Skip header row and separator rows
    if (
      row.includes('Variant ID') ||
      row.includes('Description') ||
      row.includes('Key behaviour') ||
      row.includes('---')
    ) {
      continue
    }

    const cells = row.split('|').filter((c) => c.trim() !== '')
    if (cells.length < 3) continue

    // Handle both formats:
    // Format 1: | S01 · Email Entry · Light | Description | Light |
    // Format 2: | S01 | Default · Best Pre-selected | Light | ... |
    let stateName: string
    let theme: string

    if (cells[0].includes('·')) {
      // Format 1: variant info is in first cell
      const variantCell = cells[0].trim()
      theme = cells[cells.length - 1].trim()

      const parts = variantCell.split('·').map((p) => p.trim())
      // Extract state name from middle element(s)
      // Format can be: "S01 · Email Entry · Light" (3 parts)
      //             or: "S04 · Filter Sheet" (2 parts, theme is in separate column)
      if (parts.length === 3 && parts[2].toLowerCase() === theme.toLowerCase()) {
        // Theme is included in the variant cell
        stateName = parts[1] // Middle element
      } else {
        // Theme is in separate column, state is everything after ID
        stateName = parts.slice(1).join(' ')
      }
    } else {
      // Format 2: separate cells
      stateName = cells[1].trim()
      theme = cells[2].trim()
    }

    // Clean up state name and theme
    stateName = stateName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    theme = theme.toLowerCase()

    variants.push({ stateName, theme })
  }

  return variants
}

function annotateHtmlFile(htmlPath: string, viewName: string, variants: Variant[]): void {
  let html = readFileSync(htmlPath, 'utf-8')

  // Find all <section> elements
  const sectionRegex = /<section\s+([^>]*?)>/g
  let sectionIndex = 0

  html = html.replace(sectionRegex, (match, attributes) => {
    // Get the variant for this section
    const variant = variants[sectionIndex]
    sectionIndex++

    if (!variant) {
      console.warn(`No variant found for ${viewName} section ${sectionIndex}, skipping`)
      return match
    }

    // Build data attributes
    const dataAttrs = ` data-screen="${viewName}" data-state="${variant.stateName}" data-theme="${variant.theme}"`

    // Reconstruct the section tag with data attributes
    return `<section ${attributes}${dataAttrs}>`
  })

  writeFileSync(htmlPath, html, 'utf-8')
  console.log(`✅ Annotated ${viewName} with ${sectionIndex} sections`)
}

function main(): void {
  const designSystemRoot = join(process.cwd(), '.spec', 'design', 'system')
  const viewsDir = join(designSystemRoot, 'views')

  const viewDirs = readdirSync(viewsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith('.'))
    .map((dirent) => dirent.name)

  console.log(`Found ${viewDirs.length} views to annotate\n`)

  for (const view of viewDirs) {
    const readmePath = join(viewsDir, view, 'README.md')
    const htmlPath = join(viewsDir, view, `${view}.html`)

    try {
      const variants = parseVariantsFromReadme(readmePath)
      if (variants.length === 0) {
        console.warn(`⚠️  No variants found in ${view}/README.md`)
        continue
      }

      console.log(`${view}: ${variants.length} variants`)
      annotateHtmlFile(htmlPath, view, variants)
    } catch (error) {
      console.error(`❌ Error processing ${view}:`, error)
    }
  }

  console.log('\n✨ HTML annotation complete!')
}

main()
