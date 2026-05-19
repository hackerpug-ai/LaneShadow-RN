package com.laneshadow.ui.planning

import com.google.common.truth.Truth.assertThat
import com.laneshadow.ui.mapapp.planningMapControlsModel
import org.junit.Test

class PlanningMapControlsLivePathTest {
    @Test
    fun live_planning_path_exposes_recenter_layers_and_toggle_controls() {
        val model = planningMapControlsModel(
            onZoomIn = {},
            onZoomOut = {},
            onRecenter = {},
            onClear = {},
            onToggleView = {},
        )

        assertThat(model.testTag).isEqualTo("planning.map-controls")
        assertThat(model.hasRouteToSave).isFalse()
        assertThat(model.isSavedRoute).isFalse()
        assertThat(model.handlers.onZoomIn).isNotNull()
        assertThat(model.handlers.onZoomOut).isNotNull()
        assertThat(model.handlers.onRecenter).isNotNull()
        assertThat(model.handlers.onClear).isNotNull()
        assertThat(model.handlers.onToggleView).isNotNull()
        assertThat(model.handlers.onSaveRoute).isNull()
    }
}
