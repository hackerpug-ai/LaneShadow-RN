import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

interface BoundingBox {
  x: number
  y: number
  w: number
  h: number
}

interface Component {
  name: string
  selector: string
  bounding_box: BoundingBox
  design_tokens: Record<string, string>
}

interface Annotation {
  screen: string
  state: string
  theme: string
  viewport: {
    width: number
    height: number
  }
  components: Component[]
}

async function extractAnnotationsForSection(
  browser,
  htmlPath: string,
  screen: string,
  state: string,
  theme: string,
): Promise<Annotation> {
  const page = await browser.newPage()

  try {
    // Set viewport
    await page.setViewportSize({ width: 390, height: 844 })

    // Load the HTML file
    const htmlContent = readFileSync(htmlPath, 'utf-8')
    await page.setContent(htmlContent)

    // Find the specific section
    const sectionSelector = `section[data-screen="${screen}"][data-state="${state}"][data-theme="${theme}"]`
    const section = await page.locator(sectionSelector).first()

    if ((await section.count()) === 0) {
      throw new Error(`Section not found: ${screen}/${state}/${theme}`)
    }

    // Extract design tokens from the section
    const designTokens = await section.evaluate((el) => {
      const tokens: Record<string, string> = {}
      const computedStyle = window.getComputedStyle(el)

      // Extract all CSS custom properties (--*)
      for (let i = 0; i < computedStyle.length; i++) {
        const prop = computedStyle[i]
        if (prop.startsWith('--')) {
          tokens[prop] = computedStyle.getPropertyValue(prop)
        }
      }

      return tokens
    })

    // Find component elements within the phone frame
    const phoneFrame = await section
      .locator('.view-' + screen.replace(/-/g, '-') + "__phone, [role='img']")
      .first()
    const components: Component[] = []

    if ((await phoneFrame.count()) > 0) {
      // Get bounding box of phone frame
      const frameBox = await phoneFrame.boundingBox()
      if (!frameBox) {
        throw new Error('Could not get phone frame bounding box')
      }

      // Find significant components within the frame
      // This is a simplified version - in reality you'd want more sophisticated component detection
      const componentSelectors = [
        '.ls-btn',
        '.ls-input',
        '.mol-social-btn',
        '.mol-form-field',
        '.ls-divider',
        '.view-' + screen.replace(/-/g, '-') + '__card',
      ]

      for (const selector of componentSelectors) {
        const elements = await phoneFrame.locator(selector).all()
        for (let i = 0; i < elements.length; i++) {
          const box = await elements[i].boundingBox()
          if (box) {
            components.push({
              name: `${selector.replace(/^\./, '')}-${i}`,
              selector: `${selector}:nth-of-type(${i + 1})`,
              bounding_box: {
                x: Math.round(box.x - frameBox.x),
                y: Math.round(box.y - frameBox.y),
                w: Math.round(box.width),
                h: Math.round(box.height),
              },
              design_tokens: {}, // Would extract component-specific tokens in a full implementation
            })
          }
        }
      }
    }

    return {
      screen,
      state,
      theme,
      viewport: {
        width: 390,
        height: 844,
      },
      components,
    }
  } finally {
    await page.close()
  }
}

async function main(): Promise<void> {
  const designSystemRoot = join(process.cwd(), '.spec', 'design', 'system')
  const viewsDir = join(designSystemRoot, 'views')
  const refsDir = join(designSystemRoot, 'refs')

  // Get all view directories
  const viewDirs = readdirSync(viewsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith('.'))
    .map((dirent) => dirent.name)

  console.log(`Extracting annotations for ${viewDirs.length} views\n`)

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
  })

  try {
    let totalAnnotations = 0

    for (const view of viewDirs) {
      const htmlPath = join(viewsDir, view, `${view}.html`)
      const viewRefsDir = join(refsDir, view)

      // Create output directory if it doesn't exist
      if (!existsSync(viewRefsDir)) {
        mkdirSync(viewRefsDir, { recursive: true })
      }

      console.log(`${view}:`)

      // Read HTML to find all sections
      const html = readFileSync(htmlPath, 'utf-8')
      const sectionRegex =
        /<section[^>]*data-screen="([^"]+)"[^>]*data-state="([^"]+)"[^>]*data-theme="([^"]+)"[^>]*>/g

      for (let match = sectionRegex.exec(html); match !== null; match = sectionRegex.exec(html)) {
        const screen = match[1]
        const state = match[2]
        const theme = match[3]

        // Only process once per state (theme-agnostic)
        // Skip if we've already processed this state
        const annotationPath = join(viewRefsDir, `${state}.annotations.json`)
        if (existsSync(annotationPath)) {
          console.log(`  ⊘ ${state}.annotations.json already exists`)
          continue
        }

        const annotation = await extractAnnotationsForSection(
          browser,
          htmlPath,
          screen,
          state,
          theme,
        )

        // Write annotation file
        writeFileSync(annotationPath, JSON.stringify(annotation, null, 2), 'utf-8')
        console.log(`  ✓ ${state}.annotations.json`)
        totalAnnotations++
      }
    }

    console.log(`\n✨ Extracted ${totalAnnotations} annotation files`)
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
