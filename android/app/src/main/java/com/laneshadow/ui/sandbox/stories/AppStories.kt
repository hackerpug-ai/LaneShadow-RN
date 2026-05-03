package com.laneshadow.ui.sandbox.stories

import com.laneshadow.ui.sandbox.model.SandboxStory

/**
 * App stories aggregator — all template stories for Sprint 04.
 *
 * Sprint 04 template stories include:
 * - IdleScreen (7 variants)
 * - PlanningScreen (9 variants)
 * - RouteResultsScreen (7 variants)
 * - RouteDetailsScreen (6 variants)
 * - ErrorScreen (6 variants)
 * - SessionsScreen (1 variant)
 *
 * Total: 36 template stories
 *
 * This file serves as the stable registration point for all template stories
 * so downstream consumers don't need to know about individual story files.
 */
object AppStories {
    val all: List<SandboxStory> = buildList {
        // Sprint 04 Template Stories
        addAll(Sprint04IdleStories.all)
        addAll(Sprint04PlanningStories.all)
        addAll(Sprint04RouteResultsStories.all)
        addAll(Sprint04RouteDetailsStories.all)
        addAll(Sprint04ErrorStories.all)
        addAll(Sprint04SessionsStories.all)
    }
}
