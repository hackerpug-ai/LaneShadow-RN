package com.laneshadow.ui.organisms

import androidx.compose.runtime.Stable
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver

/**
 * Enum for the two modes of LSMapControls organism.
 *
 * [Map] shows zoom/recenter/layers/save cluster with mode-toggle at bottom.
 * [Chat] shows only the mode-toggle chip (map icon) at the workbar.
 */
@Stable
enum class MapControlsMode {
    Map,
    Chat,
}

val LSMapControlsInstanceIdKey = SemanticsPropertyKey<String>("LSMapControlsInstanceId")
private var SemanticsPropertyReceiver.lsMapControlsInstanceId by LSMapControlsInstanceIdKey

/**
 * Handler shape for LSMapControls.
 *
 * All handlers are nullable. When a handler is null, its corresponding chip
 * is omitted from the compose tree (no empty containers).
 *
 * @param onZoomIn Callback when zoom-in chip is tapped
 * @param onZoomOut Callback when zoom-out chip is tapped
 * @param onRecenter Callback when recenter chip is tapped
 * @param onClear Callback when layers chip is tapped
 * @param onSaveRoute Callback when save chip is tapped
 * @param onToggleView Callback when mode-toggle chip is tapped (map icon in chat mode, chat icon in map mode)
 */
@Stable
data class MapControlsHandlers(
    val onZoomIn: (() -> Unit)? = null,
    val onZoomOut: (() -> Unit)? = null,
    val onRecenter: (() -> Unit)? = null,
    val onClear: (() -> Unit)? = null,
    val onSaveRoute: (() -> Unit)? = null,
    val onToggleView: (() -> Unit)? = null,
)
