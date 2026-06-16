/**
 * DISC-021: Quarantine Import Graph Integration Test
 * 
 * This test verifies that dropped dedicated-discovery components are quarantined
 * and not reachable from any active screen or hook.
 * 
 * Targets quarantined:
 * - route-discovery-screen (missing - good)
 * - discovery-filter-bar (missing - good)  
 * - discovery-sort-toggle (missing - good)
 * - route-pin (exists in components/discovery/ but orphaned)
 * - state-filter-sheet (exists in components/discovery/ but orphaned)
 * - state-list-item (exists in components/discovery/ but orphaned)
 * - intent-search-sheet (exists in components/discovery/ but orphaned)
 * - intent-summary-pill (exists in components/discovery/ but orphaned)
 * - discovery-empty-overlay (exists in components/discovery/ but orphaned)
 * - discovery-loading-overlay (exists in components/discovery/ but orphaned)
 * 
 * IMPORTANT: Does NOT target hooks/use-route-discovery.ts (deferred, not dropped)
 */

import { readFileSync, existsSync } from 'fs'
import { globSync } from 'glob'
import path from 'path'

// Quarantined component identifiers that should NOT be imported by active code
const QUARANTINED_COMPONENTS = [
  'route-discovery-screen',
  'discovery-filter-bar', 
  'discovery-sort-toggle',
  'route-pin',
  'state-filter-sheet',
  'state-list-item',
  'intent-search-sheet',
  'intent-summary-pill',
  'discovery-empty-overlay',
  'discovery-loading-overlay',
  // Also check for the barrel import
  'components/discovery'
] as const

type QuarantinedComponent = typeof QUARANTINED_COMPONENTS[number]

describe('DISC-021: quarantine-import-graph', () => {
  describe('AC-1: Zero active references to quarantined components', () => {
    let scannedFiles: string[] = []
    let activeImports: QuarantinedComponent[] = []

    test('noActiveImportsOfQuarantinedComponents', () => {
      // Get all files in active source tree
      const allFiles = globSync([
        'app/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',
        'contexts/**/*.{ts,tsx}', 
        'components/**/*.{ts,tsx}',
        'server/**/*.{ts,tsx}'
      ])

      // Filter out discovery components and get unique files
      const activeFiles = allFiles.filter(file => {
        return !file.includes('components/discovery/') && 
               !file.includes('node_modules/') &&
               (file.endsWith('.ts') || file.endsWith('.tsx'))
      })

      scannedFiles = activeFiles
      expect(scannedFiles.length).toBeGreaterThan(100), 
        `Expected >100 files in active source tree, got ${scannedFiles.length}`

      // Scan each file for imports of quarantined components
      activeImports = []
      
      for (const file of activeFiles) {
        try {
          const content = readFileSync(file, 'utf-8')
          
          // Look for import statements that reference quarantined components
          for (const quarantined of QUARANTINED_COMPONENTS) {
            // Check various import patterns
            const importPatterns = [
              `import.*['"]${quarantined}['"]`,
              `from ['"].*${quarantined}.*['"]`,
              `require(['"].*${quarantined}.*['"])`
            ]
            
            for (const pattern of importPatterns) {
              const regex = new RegExp(pattern, 'g')
              const matches = content.match(regex)
              
              if (matches) {
                activeImports.push(quarantined)
                console.warn(`❌ Found import of quarantined component "${quarantined}" in ${file}`)
                break // Found at least one import for this component
              }
            }
          }
        } catch (error) {
          console.warn(`⚠️ Could not read file ${file}:`, error.message)
        }
      }

      // Critical assertion: zero imports of quarantined components
      expect(activeImports).toHaveLength(0), 
        `Found ${activeImports.length} active imports of quarantined components: ${activeImports.join(', ')}`
    })
  })

  describe('AC-2: No dedicated discover route/filter/sort/state-picker reachable', () => {
    test('noDedicatedDiscoverRouteReachable', () => {
      // Check that no discover.tsx tab route exists
      const discoverRoutePath = 'app/(app)/(tabs)/discover.tsx'
      const discoverRouteExists = existsSync(discoverRoutePath)
      
      expect(discoverRouteExists).toBe(false), 
        `❌ Discover route should not exist at ${discoverRoutePath}`

      // Verify we actually scanned some tabs route files (not empty scan)
      const tabsRouteFiles = globSync('app/(app)/(tabs)/**/*.{ts,tsx}')
      expect(tabsRouteFiles.length).toBeGreaterThan(0), 
        `Expected >0 tabs route files scanned, got ${tabsRouteFiles.length}`

      // Check actual tabs that exist
      const tabs = tabsRouteFiles.map(file => {
        const relative = path.relative('app/(app)/(tabs)', file)
        const name = relative.replace(/\.(ts|tsx)$/, '')
        return name
      }).filter(name => !name.includes('.')) // Remove any file extensions that slipped through

      console.log('📁 Available tabs:', tabs)
      expect(tabs).not.toContain('discover'), 
        '❌ discover tab should not exist in route tree'

      // Check drawer configuration for discover references
      const menuLayoutPath = 'components/layouts/menu-layout.tsx'
      const menuLayoutContent = readFileSync(menuLayoutPath, 'utf-8')
      
      // Look for discover-related paths in drawer navigation
      const discoverPatterns = [
        '/discover',
        '/route-discovery',
        'discover',
        'route-discovery'
      ]

      const foundDiscoverReferences = []
      for (const pattern of discoverPatterns) {
        if (menuLayoutContent.includes(pattern)) {
          foundDiscoverReferences.push(pattern)
        }
      }

      expect(foundDiscoverReferences).toHaveLength(0), 
        `❌ Found discover references in drawer: ${foundDiscoverReferences.join(', ')}`
    })
  })
})