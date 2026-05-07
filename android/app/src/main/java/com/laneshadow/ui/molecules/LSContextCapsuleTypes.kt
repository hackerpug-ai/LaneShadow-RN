package com.laneshadow.ui.molecules

import androidx.compose.runtime.Immutable

@Immutable
enum class IdleScope {
    TODAY,
    TONIGHT,
    SOON,
}

@Immutable
sealed interface CapsuleState {
    val emphasizedWord: String
    val isWarning: Boolean
    val isSaved: Boolean

    @Immutable
    data class Idle(
        val scope: IdleScope,
        val headline: String,
        override val emphasizedWord: String,
        val metaItems: List<String>,
        override val isWarning: Boolean = false,
        override val isSaved: Boolean = false,
    ) : CapsuleState

    @Immutable
    data class Planning(
        val headline: String,
        override val emphasizedWord: String = headline,
        override val isWarning: Boolean = false,
        override val isSaved: Boolean = false,
    ) : CapsuleState

    @Immutable
    data class Route(
        val name: String,
        override val emphasizedWord: String = name,
        val metrics: List<String>,
        override val isWarning: Boolean = false,
        override val isSaved: Boolean = false,
    ) : CapsuleState
}
