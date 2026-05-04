import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const DESIGN_SYSTEM_ROOT = join(process.cwd(), '.spec', 'design', 'system')
const REFS_DIR = join(DESIGN_SYSTEM_ROOT, 'refs')

// Get all reference PNGs
const getAllPngs = (): string[] => {
  if (!readdirSync(DESIGN_SYSTEM_ROOT).includes('refs')) {
    return []
  }

  const pngs: string[] = []
  const screenDirs = readdirSync(REFS_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

  for (const screen of screenDirs) {
    const screenPath = join(REFS_DIR, screen)
    const files = readdirSync(screenPath)
    const pngFiles = files.filter((f) => f.endsWith('.png'))
    pngs.push(...pngFiles.map((f) => join(screen, f)))
  }

  return pngs
}

console.log('Checking for reference PNGs...')
const pngs = getAllPngs()
console.log(`Found ${pngs.length} PNG files`)

if (pngs.length < 40) {
  console.error(`❌ Expected at least 40 PNGs, but found ${pngs.length}`)
  process.exit(1)
}

console.log(`✅ Found ${pngs.length} reference PNGs (expected 44 based on section count)`)

// Check a sample file to verify it's a valid PNG
if (pngs.length > 0) {
  const samplePng = pngs[0]
  const samplePath = join(REFS_DIR, samplePng)
  try {
    const buffer = readFileSync(samplePath)
    // Check PNG signature
    if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) {
      console.error(`❌ ${samplePng} is not a valid PNG file`)
      process.exit(1)
    }
    console.log(`✅ Sample file ${samplePng} is a valid PNG`)
  } catch (error) {
    console.error(`❌ Error reading ${samplePng}:`, error)
    process.exit(1)
  }
}

process.exit(0)
