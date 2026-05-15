package com.laneshadow.sandbox.stories.molecules

import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.molecules.CapsuleAppearance
import com.laneshadow.ui.molecules.CapsuleState
import com.laneshadow.ui.molecules.IdleScope
import com.laneshadow.ui.molecules.LSContextCapsule
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSContextCapsuleStory {
    val all: List<Story> =
        listOf(
            capsuleStory("molecules.context-capsule.idle-light", idleState()),
            capsuleStory("molecules.context-capsule.idle-dark", idleState(), darkTheme = true),
            capsuleStory("molecules.context-capsule.planning-light", planningState()),
            capsuleStory("molecules.context-capsule.planning-dark", planningState(), darkTheme = true),
            capsuleStory("molecules.context-capsule.route-light", routeState()),
            capsuleStory("molecules.context-capsule.route-dark", routeState(), darkTheme = true),
            capsuleStory("molecules.context-capsule.warning-light", idleWarningState()),
            capsuleStory("molecules.context-capsule.warning-dark", idleWarningState(), darkTheme = true),
            capsuleStory("molecules.context-capsule.saved-light", savedRouteState()),
            capsuleStory("molecules.context-capsule.saved-dark", savedRouteState(), darkTheme = true),
        )
}

private fun capsuleStory(
    id: String,
    state: CapsuleState,
    darkTheme: Boolean = false,
): Story =
    Story(
        id = id,
        tier = ComponentTier.Molecule,
        component = "LSContextCapsule",
        name = id.substringAfter("molecules.context-capsule.").replace('.', ' ').replace('-', ' '),
        summary = "LSContextCapsule $id",
        content = {
            LaneShadowTheme(darkTheme = darkTheme) {
                MoleculeStoryFrame {
                    LSContextCapsule(state = state)
                }
            }
        },
    )

private fun capsuleChipStory(
    id: String,
    state: CapsuleState,
    darkTheme: Boolean = false,
): Story =
    Story(
        id = id,
        tier = ComponentTier.Molecule,
        component = "LSContextCapsule",
        name = id.substringAfter("molecules.context-capsule.").replace('.', ' ').replace('-', ' '),
        summary = "LSContextCapsule $id",
        content = {
            LaneShadowTheme(darkTheme = darkTheme) {
                MoleculeStoryFrame {
                    LSContextCapsule(state = state, appearance = CapsuleAppearance.Chip)
                }
            }
        },
    )

private fun idleState(): CapsuleState.Idle =
    CapsuleState.Idle(
        scope = IdleScope.TODAY,
        headline = "Where are we riding today, Justin?",
        emphasizedWord = "today",
        metaItems = listOf("Friday", "68°F", "Clear"),
    )

private fun idleWarningState(): CapsuleState.Idle =
    CapsuleState.Idle(
        scope = IdleScope.TODAY,
        headline = "Not the prettiest day for it.",
        emphasizedWord = "prettiest",
        metaItems = listOf("Friday", "52°F", "Rain · 0.4″"),
        isWarning = true,
    )

private fun planningState(): CapsuleState.Planning =
    CapsuleState.Planning(
        headline = "Sketching a coastal loop…",
    )

private fun routeState(): CapsuleState.Route =
    CapsuleState.Route(
        name = "Coastal cruise",
        metrics = listOf("47 mi", "2h 15m", "arr 4:32p"),
    )

private fun savedRouteState(): CapsuleState.Route =
    CapsuleState.Route(
        name = "Mountain Pass Sunrise",
        metrics = listOf("62 mi", "3h 02m", "arr 9:18a"),
        isSaved = true,
    )
