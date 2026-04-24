import LaneShadowTheme
import NativeSandbox
import SwiftUI

// Import Avatar components
// Note: These should be available from the main app target once the files are added to Xcode

/**
 * Story registration pattern for Sprint 2 atom components.
 *
 * ## How to Register a Component Story
 *
 * 1. Import your component from `LaneShadowApp/Views/Atoms/{ComponentName}`
 * 2. Add a story entry following this pattern:
 *
 * ```swift
 * Story(
 *   id: "atoms.{component-name}.{variant}",
 *   tier: .atom,
 *   component: "{ComponentName}",
 *   name: "{Display Name}",
 *   summary: "Brief description of what this story demonstrates"
 * ) { context in
 *   // Your component rendered with sample props
 *   {ComponentName}(
 *     // props from STYLE PROPERTIES MATRIX at .spec/prds/native-rewrite/matrices/ui/atoms/{component-name}.md
 *   )
 * }
 * ```
 *
 * ## Example
 *
 * ```swift
 * Story(
 *   id: "atoms.button.primary",
 *   tier: .atom,
 *   component: "Button",
 *   name: "Primary Button",
 *   summary: "Primary button in default state"
 * ) { context in
 *   Button("Tap me") { }
 * }
 * ```
 *
 * ## Theme Compliance
 *
 * All component styling MUST use theme tokens from `@Environment(\.theme)`:
 * - Colors: `context.theme.colors.primary.default`
 * - Typography: `context.theme.type.body.md`
 * - Spacing: `context.theme.space.md`
 * - Border Radius: `context.theme.radius.md`
 * - Elevation: `context.theme.elevation.level2`
 * - Motion: `context.theme.motion.duration.standard`
 * - Opacity: `context.theme.opacity.step08`
 *
 * See .spec/prds/native-rewrite/08e-cross-platform-theme-module.md for token pipeline details.
 *
 * ## Sprint 2 Registration
 *
 * Sprint 2 will populate this list with stories for all 42 atoms.
 * Reference each component's STYLE PROPERTIES MATRIX file for required variants.
 *
 * ## Available Tiers
 *
 * NativeSandbox supports these tiers (ComponentTier enum):
 * - `.atom` - Basic building blocks (Button, Input, Icon, etc.)
 * - `.molecule` - Simple compositions (FormField, Card, etc.)
 * - `.organism` - Complex sections (Header, Navigation, etc.)
 * - `.template` - Page layouts (Screen, Dialog, etc.)
 * - `.modifier` - Style wrappers (optional, rarely used)
 * - `.infrastructure` - Debug/infrastructure stories
 */
@MainActor
enum AtomsStories {
    static let all: [Story] = LSIconStories.all + LSTextStories.all + LSMapStories.all + [
        // Sprint 2: Add atom stories here following the pattern above
        // Note: Avatar stories will be added once Avatar.swift is added to Xcode project
    ]
}
