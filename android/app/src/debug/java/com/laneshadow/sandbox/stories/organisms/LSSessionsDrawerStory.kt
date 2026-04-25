package com.laneshadow.sandbox.stories.organisms

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.organisms.LSSessionsDrawer
import com.laneshadow.ui.organisms.Session
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

/**
 * Stories for LSSessionsDrawer organism.
 */
object LSSessionsDrawerStory {
    private val fiveMockSessions = listOf(
        Session(
            id = "santa-cruz-loop",
            title = "Santa Cruz Loop",
            preview = "Take 1 south to Davenport then back through the redwoods…",
            meta = "3 routes · Active",
            whenLabel = "Today",
            isActive = true,
            routeIds = listOf("route-1", "route-2", "route-3"),
            createdAt = "2026-04-24T10:00:00Z"
        ),
        Session(
            id = "skyline-to-sea",
            title = "Skyline to the Sea",
            preview = "Best way to do 84 to 35 heading south into the park…",
            meta = "3 routes",
            whenLabel = "Mon",
            isActive = false,
            routeIds = listOf("route-4"),
            createdAt = "2026-04-21T10:00:00Z"
        ),
        Session(
            id = "pch-evening",
            title = "PCH Evening Run",
            preview = "Sunset ride from Pacifica down to Half Moon Bay…",
            meta = "2 routes",
            whenLabel = "Sun",
            isActive = false,
            routeIds = listOf("route-5"),
            createdAt = "2026-04-20T10:00:00Z"
        ),
        Session(
            id = "marin-headlands",
            title = "Marin Headlands",
            preview = "Cross the bridge and head out to Hawk Hill at sunrise…",
            meta = "1 route",
            whenLabel = "Sat",
            isActive = false,
            routeIds = listOf("route-6"),
            createdAt = "2026-04-19T10:00:00Z"
        ),
        Session(
            id = "mt-tam-summit",
            title = "Mt. Tam Summit",
            preview = "Looking for the cleanest line up Pan Toll…",
            meta = "2 routes",
            whenLabel = "Fri",
            isActive = false,
            routeIds = listOf("route-7", "route-8"),
            createdAt = "2026-04-18T10:00:00Z"
        )
    )

    private fun createLongListSessions(count: Int): List<Session> {
        return List(count) { index ->
            Session(
                id = "session-$index",
                title = "Session ${index + 1}",
                preview = "Preview text for session ${index + 1}…",
                meta = "${index % 3 + 1} route${if (index % 3 + 1 > 1) "s" else ""}",
                whenLabel = when (index % 7) {
                    0 -> "Today"
                    1 -> "Mon"
                    2 -> "Tue"
                    3 -> "Wed"
                    4 -> "Thu"
                    5 -> "Fri"
                    else -> "Sat"
                },
                isActive = index == 0,
                routeIds = listOf("route-$index"),
                createdAt = "2026-04-${24 - index}T10:00:00Z"
            )
        }
    }

    @Composable
    fun DefaultStory() {
        LaneShadowTheme {
            LSSessionsDrawer(
                sessions = fiveMockSessions,
                activeSessionId = "santa-cruz-loop",
                groupLabel = "THIS WEEK",
                onSelect = {},
                onNew = {},
                onDismiss = {},
                modifier = Modifier.testTag("organisms.sessionsdrawer.default"),
            )
        }
    }

    @Composable
    fun EmptyStateStory() {
        LaneShadowTheme {
            LSSessionsDrawer(
                sessions = emptyList(),
                activeSessionId = null,
                groupLabel = "THIS WEEK",
                onSelect = {},
                onNew = {},
                onDismiss = {},
                modifier = Modifier.testTag("organisms.sessionsdrawer.empty"),
            )
        }
    }

    @Composable
    fun LongListStory() {
        LaneShadowTheme {
            LSSessionsDrawer(
                sessions = createLongListSessions(20),
                activeSessionId = "session-0",
                groupLabel = "THIS WEEK",
                onSelect = {},
                onNew = {},
                onDismiss = {},
                modifier = Modifier.testTag("organisms.sessionsdrawer.long-list"),
            )
        }
    }

    @Composable
    fun NoActiveSessionStory() {
        LaneShadowTheme {
            LSSessionsDrawer(
                sessions = fiveMockSessions,
                activeSessionId = null,
                groupLabel = "THIS WEEK",
                onSelect = {},
                onNew = {},
                onDismiss = {},
                modifier = Modifier.testTag("organisms.sessionsdrawer.no-active"),
            )
        }
    }

    @Composable
    fun DarkModeStory() {
        LaneShadowTheme(darkTheme = true) {
            LSSessionsDrawer(
                sessions = fiveMockSessions.take(3),
                activeSessionId = "santa-cruz-loop",
                groupLabel = "THIS WEEK",
                onSelect = {},
                onNew = {},
                onDismiss = {},
                modifier = Modifier.testTag("organisms.sessionsdrawer.dark-mode"),
            )
        }
    }

    val all: List<Story> = listOf(
        Story(
            id = "organisms.sessionsdrawer.default",
            tier = ComponentTier.Organism,
            component = "LSSessionsDrawer",
            name = "Default",
            summary = "5 sessions, Santa Cruz Loop active. Copper stripe + tinted bg on active row.",
            content = {
                Box(modifier = Modifier.width(312.dp).height(800.dp)) {
                    DefaultStory()
                }
            },
        ),
        Story(
            id = "organisms.sessionsdrawer.empty",
            tier = ComponentTier.Organism,
            component = "LSSessionsDrawer",
            name = "Empty State",
            summary = "No sessions. Empty state with icon + prompt to start a new conversation.",
            content = {
                Box(modifier = Modifier.width(312.dp).height(800.dp)) {
                    EmptyStateStory()
                }
            },
        ),
        Story(
            id = "organisms.sessionsdrawer.long-list",
            tier = ComponentTier.Organism,
            component = "LSSessionsDrawer",
            name = "Long List (20)",
            summary = "20 sessions; list scrolls while header + section label stay sticky.",
            content = {
                Box(modifier = Modifier.width(312.dp).height(800.dp)) {
                    LongListStory()
                }
            },
        ),
        Story(
            id = "organisms.sessionsdrawer.no-active",
            tier = ComponentTier.Organism,
            component = "LSSessionsDrawer",
            name = "No Active Session",
            summary = "activeSessionId: null. No copper stripe or tinted background on any row.",
            content = {
                Box(modifier = Modifier.width(312.dp).height(800.dp)) {
                    NoActiveSessionStory()
                }
            },
        ),
        Story(
            id = "organisms.sessionsdrawer.dark-mode",
            tier = ComponentTier.Organism,
            component = "LSSessionsDrawer",
            name = "Dark Mode",
            summary = "Drawer resolves to ink-700 surface. Copper stripe remains vivid.",
            content = {
                Box(modifier = Modifier.width(312.dp).height(800.dp)) {
                    DarkModeStory()
                }
            },
        ),
    )
}
