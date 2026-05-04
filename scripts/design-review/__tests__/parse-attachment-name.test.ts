#!/usr/bin/env -S pnpm tsx
/**
 * Test: parseAttachmentName() extracts screen/state/action from attachment names
 *
 * TC-1: Verify attachment name parsing follows {screen}.{state}.{action} format
 */

import { parseAttachmentName } from '../export-from-xcresult.ts'

function main() {
  console.log('Testing parseAttachmentName...')

  // Test 1: Valid attachment name
  try {
    const result = parseAttachmentName('auth-screen.email-entry.load')

    if (
      result.screen !== 'auth-screen' ||
      result.state !== 'email-entry' ||
      result.action !== 'load'
    ) {
      console.error('❌ Test 1 failed: Invalid parse result')
      console.error('Expected:', { screen: 'auth-screen', state: 'email-entry', action: 'load' })
      console.error('Got:', result)
      process.exit(1)
    }

    console.log('✅ Test 1 passed: Valid attachment name parsed correctly')
  } catch (error) {
    console.error('❌ Test 1 failed:', error)
    process.exit(1)
  }

  // Test 2: Another valid attachment name
  try {
    const result = parseAttachmentName('map-screen.initial.display')

    if (
      result.screen !== 'map-screen' ||
      result.state !== 'initial' ||
      result.action !== 'display'
    ) {
      console.error('❌ Test 2 failed: Invalid parse result')
      console.error('Expected:', { screen: 'map-screen', state: 'initial', action: 'display' })
      console.error('Got:', result)
      process.exit(1)
    }

    console.log('✅ Test 2 passed: Another valid attachment name parsed correctly')
  } catch (error) {
    console.error('❌ Test 2 failed:', error)
    process.exit(1)
  }

  // Test 3: Invalid format (too few parts)
  try {
    parseAttachmentName('invalid-name')
    console.error('❌ Test 3 failed: Should have thrown error for invalid format')
    process.exit(1)
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('Invalid attachment name format')) {
      console.error('❌ Test 3 failed: Wrong error message')
      console.error('Got:', error)
      process.exit(1)
    }
    console.log('✅ Test 3 passed: Invalid format rejected correctly')
  }

  // Test 4: Invalid format (too many parts)
  try {
    parseAttachmentName('too.many.parts.here')
    console.error('❌ Test 4 failed: Should have thrown error for invalid format')
    process.exit(1)
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('Invalid attachment name format')) {
      console.error('❌ Test 4 failed: Wrong error message')
      console.error('Got:', error)
      process.exit(1)
    }
    console.log('✅ Test 4 passed: Invalid format with too many parts rejected correctly')
  }

  console.log('\n✅ All parseAttachmentName tests passed')
  process.exit(0)
}

main()
