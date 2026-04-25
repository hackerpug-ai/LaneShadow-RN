package com.laneshadow.sandbox

import com.laneshadow.sandbox.stories.AtomsStories
import com.laneshadow.sandbox.stories.TokenSwatchStories
import com.laneshadow.sandbox.stories.infrastructure.InfrastructureStories
import com.laneshadow.sandbox.stories.modifiers.ModifierStories
import com.laneshadow.sandbox.stories.molecules.MoleculesStories
import com.laneshadow.sandbox.stories.organisms.OrganismStories
import com.laneshadow.sandbox.stories.templates.TemplateStories
import com.nativesandbox.model.Story

/**
 * LaneShadow Sandbox Entry Point
 *
 * Aggregates all six tiers of stories for the LaneShadow sandbox:
 * - Atom: UI atoms (buttons, text, icons, etc.)
 * - Molecule: UI molecules (cards, form fields, etc.)
 * - Organism: UI organisms (top bars, nav bars, etc.)
 * - Template: Screen templates and layouts
 * - Modifier: Compose modifiers and behaviors
 * - Infrastructure: Theme controllers, mock providers, fixtures
 *
 * See UC-SBX-01-android for details on the story registry architecture.
 */
object LaneShadowSandboxEntry {

    /**
     * All stories across all six tiers.
     *
     * Stories are sorted by ID for consistent ordering in the sandbox UI.
     */
    fun getAllStories(): List<Story> =
        TokenSwatchStories.all +
            AtomsStories.all +
            MoleculesStories.all +
            OrganismStories.all +
            TemplateStories.all +
            ModifierStories.all +
            InfrastructureStories.all
}
