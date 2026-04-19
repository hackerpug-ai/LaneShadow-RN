#!/usr/bin/env node

/**
 * Fix Sprint 2 task file paths and add THEME COMPLIANCE sections.
 *
 * This script updates 474 UI task files with:
 * 1. Corrected Android paths: react-native/android/app/... → android/app/src/main/java/com/laneshadow/ui/components/{layer}/
 * 2. Corrected iOS paths: react-native/ios/LaneShadow/Views/... → ios/LaneShadow/Views/{Layer}/
 * 3. Added THEME COMPLIANCE section with specific token requirements
 */

const fs = require('node:fs')
const path = require('node:path')

const TASKS_DIR = '.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation'

// THEME COMPLIANCE section to add
const THEME_COMPLIANCE = `## THEME COMPLIANCE (MANDATORY)

**Non-negotiable requirements for all UI component implementations:**

### Token Category Usage

1. **Colors**: Use \`LaneShadowTheme.colors\` (Android) or \`Theme.shared.colors\` (iOS)
   - Primary, secondary, tertiary, success, warning, danger, info
   - Surface, background, border, input, ring, card, popover
   - All color state variants (default, hover, pressed, disabled, focus)

2. **Typography**: Use \`LaneShadowTheme.type\` (Android) or \`Theme.shared.type\` (iOS)
   - Label, body, title, heading, display scales
   - sm/md/lg variants per scale

3. **Spacing**: Use \`LaneShadowTheme.space\` (Android) or \`Theme.shared.space\` (iOS)
   - xs, sm, md, lg, xl, 2xl, 3xl, 4xl

4. **Border Radius**: Use \`LaneShadowTheme.radius\` (Android) or \`Theme.shared.radius\` (iOS)
   - none, sm, md, lg, xl, 2xl, full

5. **Elevation**: Use \`LaneShadowTheme.elevation\` (Android) or \`Theme.shared.elevation\` (iOS)
   - level0, level1, level2, level3, level4, level5, level8

6. **Motion**: Use \`LaneShadowTheme.motion\` (Android) or \`Theme.shared.motion\` (iOS)
   - Duration, delay, scale, easing values

7. **Opacity**: Use \`LaneShadowTheme.opacity\` (Android) or \`Theme.shared.opacity\` (iOS)
   - step00 through step11 values

### Source of Truth

All component styling MUST derive from the platform theme accessor. Do NOT hardcode colors, dimensions, or values. Cross-reference your component's STYLE PROPERTIES MATRIX file in \`.spec/prds/native-rewrite/matrices/ui/\` to identify which tokens apply to each property.

### Verification

Before marking this task complete, verify:
- [ ] No hardcoded color values (hex, RGB, etc.)
- [ ] No hardcoded dimension values (dp, pt, sp, etc.)
- [ ] All styling values reference theme tokens
- [ ] Component renders in both light and dark themes
- [ ] Sandbox story demonstrates theme compliance
`

function getLayerFromComponent(componentName) {
  // Map component names to their layer
  const atoms = [
    'avatar',
    'badge',
    'button',
    'calendar',
    'card',
    'checkbox',
    'chip',
    'date-input',
    'divider',
    'icon',
    'icon-button',
    'image',
    'input',
    'link',
    'menu',
    'progress',
    'radio',
    'select',
    'slider',
    'spinner',
    'status',
    'switch',
    'tabs',
    'text',
    'text-area',
    'time-input',
    'toggle-button',
    'tooltip',
  ]

  const molecules = [
    'alert',
    'autocomplete',
    'breadcrumb',
    'carousel',
    'combobox',
    'command-menu',
    'context-menu',
    'data-grid',
    'date-picker',
    'dialog',
    'dropdown',
    'filter-chip',
    'form-control',
    'form-group',
    'list-box',
    'list-item',
    'list',
    'menu-bar',
    'navigation-bar',
    'pagination',
    'popover',
    'radio-group',
    'range',
    'rating',
    'select-group',
    'sidebar',
    'slider-group',
    'stepper',
    'table',
    'tabs-group',
    'tag-input',
    'time-picker',
    'toggle-group',
    'toolbar',
    'tooltip-group',
    'tree',
  ]

  const lowerName = componentName.toLowerCase()

  if (atoms.some((atom) => lowerName.includes(atom))) return 'atoms'
  if (molecules.some((mol) => lowerName.includes(mol))) return 'molecules'
  if (lowerName.includes('organism')) return 'organisms'
  if (lowerName.includes('template')) return 'templates'
  if (lowerName.includes('screen')) return 'screens'
  return 'atoms' // Default fallback
}

function fixFilePaths(content, componentName) {
  const layer = getLayerFromComponent(componentName)
  const layerCapitalized = layer.charAt(0).toUpperCase() + layer.slice(1).slice(0, -1)

  // Fix Android paths
  content = content.replace(
    /react-native\/android\/app\/src\/main\/java\/com\/laneshadow\/components\/ui\//g,
    `android/app/src/main/java/com/laneshadow/ui/components/${layer}/`,
  )

  // Fix iOS paths
  content = content.replace(
    /react-native\/ios\/LaneShadow\/Views\//g,
    `ios/LaneShadow/Views/${layerCapitalized}/`,
  )

  return content
}

function addThemeCompliance(content) {
  // Only add if not already present
  if (content.includes('## THEME COMPLIANCE (MANDATORY)')) {
    return content
  }

  // Find the position before "## Test Criteria" or at the end
  const testCriteriaIndex = content.indexOf('## Test Criteria')
  const acceptanceCriteriaIndex = content.indexOf('## Acceptance Criteria')

  let insertIndex = -1

  if (testCriteriaIndex !== -1) {
    insertIndex = testCriteriaIndex
  } else if (acceptanceCriteriaIndex !== -1) {
    // Insert after Acceptance Criteria section
    const nextNewline = content.indexOf('\n\n', acceptanceCriteriaIndex)
    insertIndex = nextNewline !== -1 ? nextNewline : content.length
  } else {
    insertIndex = content.length
  }

  return `${content.slice(0, insertIndex)}\n${THEME_COMPLIANCE}\n${content.slice(insertIndex)}`
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const filename = path.basename(filePath, '.md')

  // Extract component name from filename (e.g., "UI-001-android-avatar" -> "avatar")
  const parts = filename.split('-')
  const componentName = parts[parts.length - 1]

  let updated = content
  updated = fixFilePaths(updated, componentName)
  updated = addThemeCompliance(updated)

  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8')
    return true
  }
  return false
}

function main() {
  const files = fs.readdirSync(TASKS_DIR).filter((f) => f.startsWith('UI-') && f.endsWith('.md'))

  console.log(`Processing ${files.length} task files...`)

  let updated = 0
  let skipped = 0

  for (const file of files) {
    const filePath = path.join(TASKS_DIR, file)
    if (processFile(filePath)) {
      updated++
      if (updated % 50 === 0) {
        console.log(`Updated ${updated} files...`)
      }
    } else {
      skipped++
    }
  }

  console.log(`\nComplete!`)
  console.log(`Updated: ${updated} files`)
  console.log(`Skipped: ${skipped} files (no changes needed)`)

  // Verification
  console.log('\nVerifying corrections...')
  const { execSync } = require('node:child_process')
  try {
    const oldAndroidPaths = execSync(
      `grep -r "react-native/android/app/src/main/java/com/laneshadow/components/ui/" ${TASKS_DIR} --include="*.md" | wc -l`,
      { encoding: 'utf8' },
    ).trim()
    console.log(`Remaining incorrect Android paths: ${oldAndroidPaths}`)
  } catch {
    console.log('No incorrect Android paths found (verification passed)')
  }
}

main()
