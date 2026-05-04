import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

interface RenderConfig {
  chrome_path: string
  viewport: {
    width: number
    height: number
  }
}

interface SectionInfo {
  screen: string
  state: string
  theme: string
}

function parseManifest(): RenderConfig {
  const manifestPath = join(process.cwd(), '.spec', 'design', 'system', 'manifest.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))

  if (!manifest.render) {
    throw new Error('manifest.json missing render block')
  }

  return {
    chrome_path: manifest.render.chrome_path,
    viewport: {
      width: 390,
      height: 844,
    },
  }
}

function extractSectionsFromHtml(htmlPath: string): SectionInfo[] {
  const html = readFileSync(htmlPath, 'utf-8')
  const sections: SectionInfo[] = []

  // Find all <section> elements with data attributes
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
    // Set viewport
    await page.setViewportSize({ width: 390, height: 844 })

    // Load the HTML file
    const htmlContent = readFileSync(htmlPath, 'utf-8')
    await page.setContent(htmlContent, { waitUntil: 'networkidle' })

    // Find the specific section by data attributes
    const sectionSelector = `section[data-screen="${section.screen}"][data-state="${section.state}"]`

    // Wait for the section to be available
    await page.waitForSelector(sectionSelector, { timeout: 10000 })

    // Find the phone frame element within this section
    // Try different class name patterns
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

    // Take screenshot of just the phone frame
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
  const refsDir = join(designSystemRoot, 'refs')

  console.log(`Chrome path: ${config.chrome_path}`)
  console.log(`Viewport: ${config.viewport.width}×${config.viewport.height}\n`)

  // Get all view directories
  const viewDirs = readdirSync(viewsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith('.'))
    .map((dirent) => dirent.name)

  console.log(`Found ${viewDirs.length} views to render\n`)

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: ['--headless=new'],
  })

  try {
    let totalRendered = 0

    for (const view of viewDirs) {
      const htmlPath = join(viewsDir, view, `${view}.html`)
      const viewRefsDir = join(refsDir, view)

      // Create output directory
      if (!existsSync(viewRefsDir)) {
        mkdirSync(viewRefsDir, { recursive: true })
      }

      console.log(`${view}:`)

      // Extract sections from HTML
      const sections = extractSectionsFromHtml(htmlPath)

      for (const section of sections) {
        const outputPath = join(viewRefsDir, `${section.state}.${section.theme}.png`)

        await renderSection(browser, htmlPath, section, outputPath)
        totalRendered++
      }

      console.log('')
    }

    console.log(`✨ Rendered ${totalRendered} PNGs to ${refsDir}`)
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
