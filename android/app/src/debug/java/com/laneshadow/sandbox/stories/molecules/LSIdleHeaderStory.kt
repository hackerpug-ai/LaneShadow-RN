package com.laneshadow.sandbox.stories.molecules

import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.molecules.CapsuleState
import com.laneshadow.ui.molecules.IdleScope
import com.laneshadow.ui.molecules.LSIdleHeader
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSIdleHeaderStory {
    val all: List<Story> =
        listOf(
            headerStory(
                id = "molecules.idle-header.default",
                state = defaultIdleState(),
                summary = "Unified idle header — menu + greeting capsule + new in a single glass chip.",
            ),
            headerStory(
                id = "molecules.idle-header.no-meta",
                state = noMetaState(),
                summary = "Headline-only — meta row hidden when metaItems is empty.",
            ),
            headerStory(
                id = "molecules.idle-header.warning",
                state = warningState(),
                summary = "Meta tinted with status.warning when isWarning is true.",
            ),
        )
}

private fun headerStory(
    id: String,
    state: CapsuleState,
    summary: String,
    darkTheme: Boolean = false,
): Story =
    Story(
        id = id,
        tier = ComponentTier.Molecule,
        component = "LSIdleHeader",
        name = id.substringAfter("molecules.idle-header.").replace('.', ' ').replace('-', ' '),
        summary = summary,
        content = {
            LaneShadowTheme(darkTheme = darkTheme) {
                MoleculeStoryFrame {
                    LSIdleHeader(
                        capsuleState = state,
                        onMenuTap = {},
                        onNewTap = {},
                    )
                }
            }
        },
    )

private fun defaultIdleState(): CapsuleState.Idle =
    CapsuleState.Idle(
        scope = IdleScope.TODAY,
        headline = "Where are we riding today, rider?",
        emphasizedWord = "today",
        metaItems = listOf("SUNDAY", "67°F", "CLEAR"),
    )

private fun noMetaState(): CapsuleState.Idle =
    CapsuleState.Idle(
        scope = IdleScope.TODAY,
        headline = "Where are we starting from?",
        emphasizedWord = "starting",
        metaItems = emptyList(),
    )

private fun warningState(): CapsuleState.Idle =
    CapsuleState.Idle(
        scope = IdleScope.TODAY,
        headline = "Not the prettiest day for it.",
        emphasizedWord = "prettiest",
        metaItems = listOf("FRI", "62°F", "RAIN"),
        isWarning = true,
    )
