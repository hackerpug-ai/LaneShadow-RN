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

function requestedScreensFromEnv(): Set<string> | null {
  const raw = process.env.DESIGN_REVIEW_SCREENS?.trim()
  if (!raw) {
    return null
  }

  const screens = raw
    .split(',')
    .map((screen) => screen.trim())
    .filter(Boolean)

  return screens.length > 0 ? new Set(screens) : null
}

function buildComponentName(
  screen: string,
  state: string,
  selector: string,
  index: number,
): string {
  const primaryMapSlotSelector = `.view-${screen}__map-slot`

  // The planning-screen review contract expects the canonical state slug
  // to survive into annotations for the primary captured component.
  if (screen === 'planning-screen' && selector === primaryMapSlotSelector && index === 0) {
    return state
  }

  return `${selector.replace(/^\./, '')}-${index}`
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
      // Use both generic component classes and view-specific components
      const componentSelectors = [
        // Generic LaneShadow components
        '.ls-btn',
        '.ls-input',
        '.ls-divider',
        // Molecules
        '.mol-social-btn',
        '.mol-form-field',
        // View-specific components (dynamic based on screen name)
        `.view-${screen.replace(/-/g, '-')}__card`,
        `.view-${screen.replace(/-/g, '-')}__chip`,
        `.view-${screen.replace(/-/g, '-')}__callout`,
        `.view-${screen.replace(/-/g, '-')}__map-slot`,
        `.view-${screen.replace(/-/g, '-')}__broken-mark`,
        `.view-${screen.replace(/-/g, '-')}__origin-pin`,
        `.view-${screen.replace(/-/g, '-')}__dest-pin`,
        `.view-${screen.replace(/-/g, '-')}__pin`,
        `.view-${screen.replace(/-/g, '-')}__marker`,
        `.view-${screen.replace(/-/g, '-')}__btn`,
        `.view-${screen.replace(/-/g, '-')}__input`,
        // Organisms (if any)
        '.org-map-layer',
        '.org-topbar',
      ]

      for (const selector of componentSelectors) {
        const elements = await phoneFrame.locator(selector).all()
        for (let i = 0; i < elements.length; i++) {
          const box = await elements[i].boundingBox()
          if (box) {
            // Extract design tokens from this component element
            const componentTokens = await elements[i].evaluate((el) => {
              const tokens: Record<string, string> = {}
              const computedStyle = window.getComputedStyle(el)

              // Extract all CSS custom properties (--*)
              for (let i = 0; i < computedStyle.length; i++) {
                const prop = computedStyle[i]
                if (prop.startsWith('--')) {
                  const value = computedStyle.getPropertyValue(prop)
                  // Only include non-empty token values
                  if (value && value.trim() !== '') {
                    tokens[prop] = value.trim()
                  }
                }
              }

              // Also extract key computed style properties that represent design tokens
              // These are the resolved values that would be used by vision LLM evaluators
              const tokenProperties = [
                'color',
                'background-color',
                'font-family',
                'font-size',
                'font-weight',
                'line-height',
                'border-color',
                'border-width',
                'border-radius',
                'padding-top',
                'padding-right',
                'padding-bottom',
                'padding-left',
                'margin-top',
                'margin-right',
                'margin-bottom',
                'margin-left',
                'opacity',
                'box-shadow',
              ]

              tokenProperties.forEach((prop) => {
                const value = computedStyle.getPropertyValue(prop)
                if (value && value.trim() !== '' && value !== 'none' && value !== 'normal') {
                  tokens[`computed_${prop.replace(/-/g, '_')}`] = value.trim()
                }
              })

              return tokens
            })

            components.push({
              name: buildComponentName(screen, state, selector, i),
              selector: `${selector}:nth-of-type(${i + 1})`,
              bounding_box: {
                x: Math.round(box.x - frameBox.x),
                y: Math.round(box.y - frameBox.y),
                w: Math.round(box.width),
                h: Math.round(box.height),
              },
              design_tokens: componentTokens,
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
  const requestedScreens = requestedScreensFromEnv()

  // Get all view directories
  const viewDirs = readdirSync(viewsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith('.'))
    .map((dirent) => dirent.name)
    .filter((view) => !requestedScreens || requestedScreens.has(view))

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
