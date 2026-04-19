#!/usr/bin/env node

/**
 * Fix MDL task file paths.
 *
 * This script updates MDL task files with corrected Android paths.
 */

const fs = require('node:fs')
const path = require('node:path')

const TASKS_DIR = '.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation'

function fixFilePaths(content) {
  // Fix Android paths for MDL files
  content = content.replace(
    /react-native\/android\/app\/src\/main\/java\/com\/laneshadow\/models\//g,
    'android/app/src/main/java/com/laneshadow/models/',
  )

  return content
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  let updated = content
  updated = fixFilePaths(updated)

  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8')
    return true
  }
  return false
}

function main() {
  const files = fs.readdirSync(TASKS_DIR).filter((f) => f.startsWith('MDL-') && f.endsWith('.md'))

  console.log(`Processing ${files.length} MDL task files...`)

  let updated = 0
  let skipped = 0

  for (const file of files) {
    const filePath = path.join(TASKS_DIR, file)
    if (processFile(filePath)) {
      updated++
      console.log(`Updated: ${file}`)
    } else {
      skipped++
    }
  }

  console.log(`\nComplete!`)
  console.log(`Updated: ${updated} files`)
  console.log(`Skipped: ${skipped} files (no changes needed)`)
}

main()
