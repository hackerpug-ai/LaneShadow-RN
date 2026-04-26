package com.laneshadow.sandbox.stories.templates

import com.nativesandbox.model.Story

/**
 * Template tier stories for the LaneShadow sandbox.
 *
 * Template stories include:
 * - Screen layouts
 * - Full component compositions
 * - Page templates
 *
 * See UC-SCR-01 through UC-SCR-06 for detailed screen stories.
 */
object TemplateStories {
    val all: List<Story> = IdleScreenStory.all + PlanningScreenStory.all + PlaceholderTemplateStories.all
}
