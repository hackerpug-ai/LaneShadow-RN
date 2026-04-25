package com.laneshadow.ui.organisms

import androidx.compose.runtime.Stable

/**
 * Sealed interface for LSSectionHeader trailing slot variants.
 */
@Stable
sealed interface SectionHeaderTrailing {
    @Stable
    data object None : SectionHeaderTrailing

    @Stable
    data class Link(
        val label: String,
        val onTap: () -> Unit
    ) : SectionHeaderTrailing
}
