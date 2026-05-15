import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'

interface RenderConfig {
  chrome_path: string
}

interface SectionInfo {
  screen: string
  state: string
  theme: string
}

// iPhone 15 Pro Max viewport — gives elements room to breathe and
// avoids the cramped layout that 390px (iPhone mini) produces.
// The vision eval compares against real device captures at this scale.
const VIEWPORT_WIDTH = 430
const VIEWPORT_HEIGHT = 932
const PHONE_MAX_WIDTH = 430

// Screens that paint the warm-paper Mapbox-styled SVG (mocking copper-light /
// copper-dark Studio styles) as the background. The vision eval prompt
// evaluates color tints, theme adherence, and overlay placement on these
// regions but ignores exact street geometry and place-name strings — see
// scripts/design-review/prompts/visual-eval.md §"Map Backgrounds".
const MAP_PLACEHOLDER_SCREENS = new Set([
  'idle-screen',
  'planning-screen',
  'route-results-screen',
  'route-details-screen',
  'auth-screen',
  'sessions-screen',
  'error-screen',
])

function parseManifest(): RenderConfig {
  const manifestPath = join(process.cwd(), '.spec', 'design', 'system', 'manifest.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))

  if (!manifest.render) {
    throw new Error('manifest.json missing render block')
  }

  return {
    chrome_path: manifest.render.chrome_path,
  }
}

function extractSectionsFromHtml(htmlPath: string): SectionInfo[] {
  const html = readFileSync(htmlPath, 'utf-8')
  const sections: SectionInfo[] = []

  const sectionRegex =
    /<section[^>]*data-screen="([^"]+)"[^>]*data-state="([^"]+)"[^>]*data-theme="([^"]+)"[^>]*>/g

  for (let match = sectionRegex.exec(html); match !== null; match = sectionRegex.exec(html)) {
    sections.push({
      screen: match[1],
      state: match[2],
      theme: match[3],
    })
  }

  return sections
}

async function renderSection(
  browser,
  htmlPath: string,
  section: SectionInfo,
  outputPath: string,
): Promise<void> {
  const page = await browser.newPage()

  try {
    await page.setViewportSize({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT })

    // Load via file:// URL so relative <link> paths resolve correctly
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' })

    // Override the phone frame max-width to match the larger viewport
    await page.addStyleTag({
      content: `
        [class*="__phone"] {
          max-width: ${PHONE_MAX_WIDTH}px !important;
        }
      `,
    })

    // Find the specific section by data attributes
    const sectionSelector = `section[data-screen="${section.screen}"][data-state="${section.state}"]`

    await page.waitForSelector(sectionSelector, { timeout: 10000 })

    // Find the phone frame element within this section
    const phoneFrameSelectors = [
      `${sectionSelector} .view-${section.screen}__phone`,
      `${sectionSelector} .phone-frame`,
      `${sectionSelector} [role="img"]`,
    ]

    let phoneFrame = null
    for (const selector of phoneFrameSelectors) {
      try {
        const element = await page.locator(selector).first()
        if ((await element.count()) > 0) {
          phoneFrame = element
          break
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!phoneFrame) {
      throw new Error(`Phone frame not found for ${section.screen}/${section.state}`)
    }

    await phoneFrame.screenshot({
      path: outputPath,
      type: 'png',
    })

    console.log(`  ✓ Rendered ${section.screen}/${section.state}.${section.theme}.png`)
  } finally {
    await page.close()
  }
}

async function main(): Promise<void> {
  const config = parseManifest()
  const designSystemRoot = join(process.cwd(), '.spec', 'design', 'system')
  const viewsDir = join(designSystemRoot, 'views')

  console.log(`Chrome path: ${config.chrome_path}`)
  console.log(`Viewport: ${VIEWPORT_WIDTH}×${VIEWPORT_HEIGHT} (iPhone 15 Pro Max scale)\n`)

  const viewDirs = readdirSync(viewsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith('.'))
    .map((dirent) => dirent.name)

  console.log(`Found ${viewDirs.length} views to render\n`)

  const browser = await chromium.launch({
    headless: true,
    args: ['--headless=new'],
  })

  try {
    let totalRendered = 0

    for (const view of viewDirs) {
      const htmlPath = join(viewsDir, view, `${view}.html`)

      const mapNote = MAP_PLACEHOLDER_SCREENS.has(view)
        ? ' (Mapbox copper-paper visual mock — eval ignores street geometry, evaluates tint+theme)'
        : ''
      console.log(`${view}${mapNote}:`)

      const sections = extractSectionsFromHtml(htmlPath)

      for (const section of sections) {
        // Per the 2026-05-15 reorganization, reference PNGs live at
        // `.spec/design/system/views/<view>/<state>/<state>.<theme>.png`
        // (one subfolder per state). See `.spec/prds/v3-integration/VIEW-MAP.md`.
        const stateDir = join(viewsDir, view, section.state)
        if (!existsSync(stateDir)) {
          mkdirSync(stateDir, { recursive: true })
        }
        const outputPath = join(stateDir, `${section.state}.${section.theme}.png`)
        await renderSection(browser, htmlPath, section, outputPath)
        totalRendered++
      }

      console.log('')
    }

    console.log(`✨ Rendered ${totalRendered} PNGs to ${viewsDir}/<view>/<state>/`)
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
