package com.laneshadow.sandbox.stories

import com.nativesandbox.model.Story

/**
 * Story registration pattern for Sprint 2 atom components.
 *
 * ## How to Register a Component Story
 *
 * 1. Import your component from `com.laneshadow.ui.components.atoms.{ComponentName}`
 * 2. Add a story entry following this pattern:
 *
 * ```kotlin
 * Story(
 *   id = "atoms.{component-name}.{variant}",
 *   tier = SandboxTier.Atom,
 *   component = "{ComponentName}",
 *   name = "{Display Name}",
 *   summary = "Brief description of what this story demonstrates",
 *   content = {
 *     // Your component rendered with sample props
 *     {ComponentName}(
 *       // props from STYLE PROPERTIES MATRIX at .spec/prds/native-rewrite/matrices/ui/atoms/{component-name}.md
 *     )
 *   }
 * )
 * ```
 *
 * ## Example
 *
 * ```kotlin
 * Story(
 *   id = "atoms.button.default",
 *   tier = SandboxTier.Atom,
 *   component = "Button",
 *   name = "Default Button",
 *   summary = "Primary button in default state",
 *   content = {
 *     Button(
 *       text = "Click me",
 *       onClick = { },
 *       variant = ButtonVariant.Primary
 *     )
 *   }
 * )
 * ```
 *
 * ## Theme Compliance
 *
 * All component styling MUST use theme tokens from `LocalLaneShadowTheme.current`:
 * - Colors: `LocalLaneShadowTheme.current.colors.primary.default`
 * - Typography: `LocalLaneShadowTheme.current.type.body.md`
 * - Spacing: `LocalLaneShadowTheme.current.space.md`
 * - Border Radius: `LocalLaneShadowTheme.current.radius.md`
 * - Elevation: `LocalLaneShadowTheme.current.elevation.level2`
 *
 * See .spec/prds/native-rewrite/08e-cross-platform-theme-module.md for token pipeline details.
 *
 * ## Sprint 2 Registration
 *
 * Sprint 2 will populate this list with stories for all 42 atoms.
 * Reference each component's STYLE PROPERTIES MATRIX file for required variants.
 */
object AtomsStories {
    val all: List<Story> = LSTextStories.all + LSIconStories.all + LSPillStories.all
}
