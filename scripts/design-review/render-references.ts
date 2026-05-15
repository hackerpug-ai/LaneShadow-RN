import { existsSync, mkdirSync, readFileSync } from 'node:fs'
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

// 2026-05-15 reorganization: design folders nest under VIEW-MAP IA.
// `data-screen` attributes in HTML still use legacy `-screen` slugs to
// preserve sandbox story id stability (`templates.<screen>.*` consumed by
// iOS/Android DesignReview capture tests). This map bridges the screen slug
// to its physical folder under `.spec/design/system/views/`.
// Auth flow is a sibling of MapApp; everything else is a MapApp state/modal.
// See `.spec/prds/v3-integration/VIEW-MAP.md`.
const SCREEN_TO_FOLDER: Record<string, string> = {
  'auth-screen': 'auth',
  'idle-screen': 'mapapp/idle',
  'planning-screen': 'mapapp/planning',
  'route-results-screen': 'mapapp/route-results',
  'route-details-screen': 'mapapp/route-details',
  'sessions-screen': 'mapapp/sessions-drawer',
  'error-screen': 'mapapp/error',
}

// Master HTML filename within each view folder (no longer `<screen>.html`;
// the rename dropped the `-screen` suffix and remapped sessions-screen to
// sessions-drawer per the VIEW-MAP rename).
const SCREEN_TO_HTML_BASENAME: Record<string, string> = {
  'auth-screen': 'auth',
  'idle-screen': 'idle',
  'planning-screen': 'planning',
  'route-results-screen': 'route-results',
  'route-details-screen': 'route-details',
  'sessions-screen': 'sessions-drawer',
  'error-screen': 'error',
}

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

  // Iterate the canonical screen list (driven by data-screen attribute, which
  // stays stable for sandbox story id compatibility). Each entry resolves to
  // a folder in the new VIEW-MAP-aligned IA.
  const screens = Object.keys(SCREEN_TO_FOLDER)
  console.log(`Found ${screens.length} screens to render\n`)

  const browser = await chromium.launch({
    headless: true,
    args: ['--headless=new'],
  })

  try {
    let totalRendered = 0

    for (const screen of screens) {
      const folder = SCREEN_TO_FOLDER[screen]
      const htmlBasename = SCREEN_TO_HTML_BASENAME[screen]
      const viewFolderAbs = join(viewsDir, folder)
      const htmlPath = join(viewFolderAbs, `${htmlBasename}.html`)

      if (!existsSync(htmlPath)) {
        console.warn(`  ⚠ skipping ${screen}: missing ${htmlPath}`)
        continue
      }

      const mapNote = MAP_PLACEHOLDER_SCREENS.has(screen)
        ? ' (Mapbox copper-paper visual mock — eval ignores street geometry, evaluates tint+theme)'
        : ''
      console.log(`${screen} → ${folder}${mapNote}:`)

      const sections = extractSectionsFromHtml(htmlPath)

      for (const section of sections) {
        // Per the 2026-05-15 reorganization, reference PNGs live at
        // `.spec/design/system/views/<folder>/<state>/<state>.<theme>.png`
        // where <folder> resolves through SCREEN_TO_FOLDER (auth/ or mapapp/<view>/).
        // See `.spec/prds/v3-integration/VIEW-MAP.md`.
        const stateDir = join(viewFolderAbs, section.state)
        if (!existsSync(stateDir)) {
          mkdirSync(stateDir, { recursive: true })
        }
        const outputPath = join(stateDir, `${section.state}.${section.theme}.png`)
        await renderSection(browser, htmlPath, section, outputPath)
        totalRendered++
      }

      console.log('')
    }

    console.log(`✨ Rendered ${totalRendered} PNGs under ${viewsDir}/`)
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
