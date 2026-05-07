package com.laneshadow.sandbox.stories.organisms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.organisms.LSMapControls
import com.laneshadow.ui.organisms.MapControlsHandlers
import com.laneshadow.ui.organisms.MapControlsMode
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.PreviewMode
import com.nativesandbox.model.Story

object LSMapControlsStory {
    val all: List<Story> = listOf(
        // Map mode: no route (light theme)
        Story(
            id = "organisms.map-controls.map-light",
            tier = ComponentTier.Organism,
            component = "LSMapControls",
            name = "Map — No Route (Light)",
            summary = "Zoom cluster + recenter + layers + chat toggle without save chip.",
            previewMode = PreviewMode.FullScreen,
            content = { MapNoRouteLight() },
        ),
        // Map mode: no route (dark theme)
        Story(
            id = "organisms.map-controls.map-dark",
            tier = ComponentTier.Organism,
            component = "LSMapControls",
            name = "Map — No Route (Dark)",
            summary = "Zoom cluster + recenter + layers + chat toggle without save chip (dark).",
            previewMode = PreviewMode.FullScreen,
            content = { MapNoRouteDark() },
        ),

        // Map mode: with route (light theme)
        Story(
            id = "organisms.map-controls.map-with-route-light",
            tier = ComponentTier.Organism,
            component = "LSMapControls",
            name = "Map — With Route (Light)",
            summary = "Zoom cluster + recenter + layers + save chip (unsaved) + chat toggle.",
            previewMode = PreviewMode.FullScreen,
            content = { MapWithRouteLight() },
        ),
        // Map mode: with route (dark theme)
        Story(
            id = "organisms.map-controls.map-with-route-dark",
            tier = ComponentTier.Organism,
            component = "LSMapControls",
            name = "Map — With Route (Dark)",
            summary = "Zoom cluster + recenter + layers + save chip (unsaved) + chat toggle (dark).",
            previewMode = PreviewMode.FullScreen,
            content = { MapWithRouteDark() },
        ),

        // Map mode: route saved (light theme)
        Story(
            id = "organisms.map-controls.map-saved-light",
            tier = ComponentTier.Organism,
            component = "LSMapControls",
            name = "Map — Route Saved (Light)",
            summary = "Zoom cluster + recenter + layers + save chip (copper/saved) + chat toggle.",
            previewMode = PreviewMode.FullScreen,
            content = { MapSavedLight() },
        ),
        // Map mode: route saved (dark theme)
        Story(
            id = "organisms.map-controls.map-saved-dark",
            tier = ComponentTier.Organism,
            component = "LSMapControls",
            name = "Map — Route Saved (Dark)",
            summary = "Zoom cluster + recenter + layers + save chip (copper/saved) + chat toggle (dark).",
            previewMode = PreviewMode.FullScreen,
            content = { MapSavedDark() },
        ),

        // Chat mode (light theme)
        Story(
            id = "organisms.map-controls.chat-light",
            tier = ComponentTier.Organism,
            component = "LSMapControls",
            name = "Chat Mode (Light)",
            summary = "Single map-toggle chip at bottom of workbar in chat mode.",
            previewMode = PreviewMode.FullScreen,
            content = { ChatModeLight() },
        ),
        // Chat mode (dark theme)
        Story(
            id = "organisms.map-controls.chat-dark",
            tier = ComponentTier.Organism,
            component = "LSMapControls",
            name = "Chat Mode (Dark)",
            summary = "Single map-toggle chip at bottom of workbar in chat mode (dark).",
            previewMode = PreviewMode.FullScreen,
            content = { ChatModeDark() },
        ),
    )
}

@Composable
private fun MapNoRouteLight() {
    LaneShadowTheme {
        StoryColumn {
            LSMapControls(
                mode = MapControlsMode.Map,
                handlers = MapControlsHandlers(
                    onZoomIn = {},
                    onZoomOut = {},
                    onRecenter = {},
                    onClear = {},
                    onToggleView = {},
                ),
                hasRouteToSave = false,
                isSavedRoute = false,
            )
        }
    }
}

@Composable
private fun MapNoRouteDark() {
    LaneShadowTheme(darkTheme = true) {
        StoryColumn {
            LSMapControls(
                mode = MapControlsMode.Map,
                handlers = MapControlsHandlers(
                    onZoomIn = {},
                    onZoomOut = {},
                    onRecenter = {},
                    onClear = {},
                    onToggleView = {},
                ),
                hasRouteToSave = false,
                isSavedRoute = false,
            )
        }
    }
}

@Composable
private fun MapWithRouteLight() {
    LaneShadowTheme {
        StoryColumn {
            LSMapControls(
                mode = MapControlsMode.Map,
                handlers = MapControlsHandlers(
                    onZoomIn = {},
                    onZoomOut = {},
                    onRecenter = {},
                    onClear = {},
                    onSaveRoute = {},
                    onToggleView = {},
                ),
                hasRouteToSave = true,
                isSavedRoute = false,
            )
        }
    }
}

@Composable
private fun MapWithRouteDark() {
    LaneShadowTheme(darkTheme = true) {
        StoryColumn {
            LSMapControls(
                mode = MapControlsMode.Map,
                handlers = MapControlsHandlers(
                    onZoomIn = {},
                    onZoomOut = {},
                    onRecenter = {},
                    onClear = {},
                    onSaveRoute = {},
                    onToggleView = {},
                ),
                hasRouteToSave = true,
                isSavedRoute = false,
            )
        }
    }
}

@Composable
private fun MapSavedLight() {
    LaneShadowTheme {
        StoryColumn {
            LSMapControls(
                mode = MapControlsMode.Map,
                handlers = MapControlsHandlers(
                    onZoomIn = {},
                    onZoomOut = {},
                    onRecenter = {},
                    onClear = {},
                    onSaveRoute = {},
                    onToggleView = {},
                ),
                hasRouteToSave = true,
                isSavedRoute = true,
            )
        }
    }
}

@Composable
private fun MapSavedDark() {
    LaneShadowTheme(darkTheme = true) {
        StoryColumn {
            LSMapControls(
                mode = MapControlsMode.Map,
                handlers = MapControlsHandlers(
                    onZoomIn = {},
                    onZoomOut = {},
                    onRecenter = {},
                    onClear = {},
                    onSaveRoute = {},
                    onToggleView = {},
                ),
                hasRouteToSave = true,
                isSavedRoute = true,
            )
        }
    }
}

@Composable
private fun ChatModeLight() {
    LaneShadowTheme {
        StoryColumn {
            LSMapControls(
                mode = MapControlsMode.Chat,
                handlers = MapControlsHandlers(
                    onToggleView = {},
                ),
            )
        }
    }
}

@Composable
private fun ChatModeDark() {
    LaneShadowTheme(darkTheme = true) {
        StoryColumn {
            LSMapControls(
                mode = MapControlsMode.Chat,
                handlers = MapControlsHandlers(
                    onToggleView = {},
                ),
            )
        }
    }
}

@Composable
private fun StoryColumn(content: @Composable () -> Unit) {
    Column(
        modifier = Modifier.padding(LocalLaneShadowTheme.current.space.lg),
        verticalArrangement = Arrangement.spacedBy(LocalLaneShadowTheme.current.space.md),
    ) {
        content()
    }
}
