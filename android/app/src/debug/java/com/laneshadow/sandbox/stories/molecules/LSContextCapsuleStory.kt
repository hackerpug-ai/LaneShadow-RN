package com.laneshadow.sandbox.stories.molecules

import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.molecules.CapsuleState
import com.laneshadow.ui.molecules.IdleScope
import com.laneshadow.ui.molecules.LSContextCapsule
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSContextCapsuleStory {
    val all: List<Story> =
        listOf(
            capsuleStory("molecules.contextcapsule.idle.light", idleState()),
            capsuleStory("molecules.contextcapsule.idle.dark", idleState(), darkTheme = true),
            capsuleStory("molecules.contextcapsule.idle-evening.light", idleEveningState()),
            capsuleStory("molecules.contextcapsule.idle-evening.dark", idleEveningState(), darkTheme = true),
            capsuleStory("molecules.contextcapsule.idle-no-location.light", idleNoLocationState()),
            capsuleStory("molecules.contextcapsule.idle-no-location.dark", idleNoLocationState(), darkTheme = true),
            capsuleStory("molecules.contextcapsule.idle-warning.light", idleWarningState()),
            capsuleStory("molecules.contextcapsule.idle-warning.dark", idleWarningState(), darkTheme = true),
            capsuleStory("molecules.contextcapsule.idle-first-ride.light", idleFirstRideState()),
            capsuleStory("molecules.contextcapsule.idle-first-ride.dark", idleFirstRideState(), darkTheme = true),
            capsuleStory("molecules.contextcapsule.planning.light", planningState()),
            capsuleStory("molecules.contextcapsule.planning.dark", planningState(), darkTheme = true),
            capsuleStory("molecules.contextcapsule.route.light", routeState()),
            capsuleStory("molecules.contextcapsule.route.dark", routeState(), darkTheme = true),
            capsuleStory("molecules.contextcapsule.route-saved.light", savedRouteState()),
            capsuleStory("molecules.contextcapsule.route-saved.dark", savedRouteState(), darkTheme = true),
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
        name = id.substringAfter("molecules.contextcapsule.").replace('.', ' ').replace('-', ' '),
        summary = "LSContextCapsule $id",
        content = {
            LaneShadowTheme(darkTheme = darkTheme) {
                MoleculeStoryFrame {
                    LSContextCapsule(state = state)
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

private fun idleEveningState(): CapsuleState.Idle =
    CapsuleState.Idle(
        scope = IdleScope.TONIGHT,
        headline = "Where are we riding tonight, Justin?",
        emphasizedWord = "tonight",
        metaItems = listOf("Friday", "62°F", "Clear"),
    )

private fun idleNoLocationState(): CapsuleState.Idle =
    CapsuleState.Idle(
        scope = IdleScope.SOON,
        headline = "Where are we starting from soon?",
        emphasizedWord = "starting",
        metaItems = listOf("Location off", "Need a pin", "Ready when you are"),
    )

private fun idleWarningState(): CapsuleState.Idle =
    CapsuleState.Idle(
        scope = IdleScope.TODAY,
        headline = "Not the prettiest day for it.",
        emphasizedWord = "prettiest",
        metaItems = listOf("Friday", "52°F", "Rain · 0.4″"),
        isWarning = true,
    )

private fun idleFirstRideState(): CapsuleState.Idle =
    CapsuleState.Idle(
        scope = IdleScope.TODAY,
        headline = "First ride? Ask me anything.",
        emphasizedWord = "Ask",
        metaItems = listOf("Friday", "68°F", "Open roads"),
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
