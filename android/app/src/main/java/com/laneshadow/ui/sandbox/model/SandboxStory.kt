package com.laneshadow.ui.sandbox.model

import androidx.compose.runtime.Composable

enum class SandboxTier {
    Infrastructure,
    Atom,
    Molecule,
    Organism,
    Template,
    Screen,
}

data class SandboxStory(
    val id: String,
    val tier: SandboxTier,
    val component: String,
    val name: String,
    val summary: String,
    val content: @Composable () -> Unit,
)
