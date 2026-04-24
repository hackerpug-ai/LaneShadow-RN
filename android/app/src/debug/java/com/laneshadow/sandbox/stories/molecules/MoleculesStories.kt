package com.laneshadow.sandbox.stories.molecules

import com.nativesandbox.model.Story

/**
 * Story registration for Sprint 04 molecule components.
 *
 * ## How to Register a Molecule Story
 *
 * 1. Import your molecule from `com.laneshadow.ui.molecules.{MoleculeName}`
 * 2. Add a story entry following the LSFormFieldStory, LSTabItemStory, or LSEmptyStateStory pattern
 *
 * ## Sprint 04 Registration
 *
 * Molecule stories for UC-MOL-04: FormField, TabItem, EmptyState
 */
object MoleculesStories {
    val all: List<Story> =
        LSFormFieldStory.all +
            LSTabItemStory.all +
            LSEmptyStateStory.all +
            LSNavigatorMoleculesStory.all
}
