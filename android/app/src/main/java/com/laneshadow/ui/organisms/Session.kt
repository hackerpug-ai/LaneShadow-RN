package com.laneshadow.ui.organisms

/**
 * Session data model for LSSessionsDrawer.
 *
 * Matches the Session entity defined in .spec/prds/v2/11-technical-requirements.md
 */
data class Session(
    val id: String,
    val title: String,
    val preview: String,
    val meta: String,
    val whenLabel: String,
    val isActive: Boolean,
    val routeIds: List<String>,
    val createdAt: String
)
