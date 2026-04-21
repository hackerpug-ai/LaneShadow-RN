package com.laneshadow.ui.sandbox.stories

import com.laneshadow.ui.sandbox.model.SandboxStory

/**
 * Infrastructure stories aggregator — empty shell per UC-SBX-05-android (Sprint 1 cleanup).
 *
 * Sprint 2 (atoms), Sprint 4 (molecules), Sprint 5 (organisms), and Sprint 6 (screens)
 * will repopulate the per-tier aggregators. This file stays as a stable registration point
 * so downstream aggregators don't need to know about sandbox wiring changes.
 */
object AppStories {
    val all: List<SandboxStory> = emptyList()
}
