package com.laneshadow.ui.planning

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.text.AnnotatedString
import androidx.navigation.compose.rememberNavController
import com.google.common.truth.Truth.assertThat
import com.laneshadow.data.chat.SessionMessage
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.mapapp.MapAppContent
import com.laneshadow.ui.mapapp.MapAppState
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class PlanningCancelConfirmTest {
    @get:Rule
    val composeRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun chat_input_renders_in_thinking_mode() {
        val uiState = mutableStateOf(
            PlanningUiState(
                sessionId = "session-1",
                isThinking = true,
                messages = listOf(
                    SessionMessage(
                        id = "rider-message",
                        sessionId = "session-1",
                        role = "rider",
                        content = "Plan a scenic 2-hour ride",
                        createdAt = 1L,
                    ),
                    SessionMessage(
                        id = "agent-message",
                        sessionId = "session-1",
                        role = "assistant",
                        content = "I found a route already.",
                        createdAt = 2L,
                    ),
                ),
            ),
        )

        setPlanningRouteContent(uiState = uiState)

        val textFieldNode = composeRule.onNodeWithContentDescription(
            "Awaiting response...",
            useUnmergedTree = true,
        ).fetchSemanticsNode()
        assertThat(textFieldNode.config[SemanticsProperties.EditableText])
            .isEqualTo(AnnotatedString("Plan a scenic 2-hour ride"))
        composeRule.onNodeWithText("I found a route already.").assertDoesNotExist()
        composeRule.onNodeWithTag("chat-input").assertIsNotEnabled()
        composeRule.onNodeWithTag("ls-spinner").assertExists()
    }

    @Test
    fun back_tap_opens_v02_cancel_confirm_sheet() {
        val uiState = mutableStateOf(
            PlanningUiState(
                sessionId = "session-1",
                isThinking = true,
            ),
        )

        setPlanningRouteContent(uiState = uiState)

        composeRule.runOnIdle {
            composeRule.activity.onBackPressedDispatcher.onBackPressed()
        }

        composeRule.onNodeWithContentDescription("Cancel ride confirmation").assertExists()
        composeRule.onNodeWithTag("planning.cancel-confirm.cancel-button").assertExists()
        composeRule.onNodeWithTag("planning.cancel-confirm.keep-button").assertExists()
    }

    @Test
    fun cancel_button_invokes_view_model_cancel() {
        val uiState = mutableStateOf(
            PlanningUiState(
                sessionId = "session-1",
                isThinking = true,
                showCancelConfirm = true,
            ),
        )
        var cancelCount = 0

        setPlanningRouteContent(
            uiState = uiState,
            onCancelPlan = {
                cancelCount += 1
                uiState.value = uiState.value.copy(showCancelConfirm = false)
            },
        )

        composeRule.onNodeWithTag("planning.cancel-confirm.cancel-button").performClick()

        composeRule.runOnIdle {
            assertEquals(1, cancelCount)
            assertThat(uiState.value.showCancelConfirm).isFalse()
        }
    }

    @Test
    fun keep_planning_dismisses_without_invoking_cancel() {
        val uiState = mutableStateOf(
            PlanningUiState(
                sessionId = "session-1",
                isThinking = true,
                showCancelConfirm = true,
                messages = listOf(
                    SessionMessage(
                        id = "rider-message",
                        sessionId = "session-1",
                        role = "rider",
                        content = "Plan a scenic 2-hour ride",
                        createdAt = 1L,
                    ),
                ),
            ),
        )
        var cancelCount = 0

        setPlanningRouteContent(
            uiState = uiState,
            onCancelPlan = { cancelCount += 1 },
        )

        composeRule.onNodeWithTag("planning.cancel-confirm.keep-button").performClick()

        composeRule.runOnIdle {
            assertEquals(0, cancelCount)
            assertThat(uiState.value.showCancelConfirm).isFalse()
            assertThat(uiState.value.isThinking).isTrue()
        }
        composeRule.onNodeWithTag("ls-spinner").assertExists()
    }

    @Test
    fun cancelled_transition_triggers_return_to_idle_without_remount() {
        val uiState = mutableStateOf(
            PlanningUiState(
                sessionId = "session-1",
                isThinking = true,
            ),
        )
        var returnToIdleCount = 0
        var consumeTransitionCount = 0

        setPlanningRouteContent(
            uiState = uiState,
            onReturnToIdle = { returnToIdleCount += 1 },
            consumeTransition = {
                consumeTransitionCount += 1
                uiState.value = uiState.value.copy(transition = null)
            },
        )

        composeRule.runOnIdle {
            uiState.value = uiState.value.copy(
                isThinking = false,
                transition = PlanningTransition.Cancelled,
            )
        }

        composeRule.waitForIdle()

        composeRule.runOnIdle {
            assertEquals(1, returnToIdleCount)
            assertEquals(1, consumeTransitionCount)
            assertThat(uiState.value.transition).isNull()
        }
        composeRule.onAllNodesWithTag("mapapp-map").assertCountEquals(1)
    }

    private fun setPlanningRouteContent(
        uiState: MutableState<PlanningUiState>,
        onCancelPlan: () -> Unit = {},
        onReturnToIdle: () -> Unit = {},
        consumeTransition: () -> Unit = {},
    ) {
        composeRule.setContent {
            LaneShadowTheme {
                val navController = rememberNavController()
                MapAppContent(
                    state = MapAppState.Planning(uiState.value.sessionId),
                    navController = navController,
                    onPlanningReturnToIdle = onReturnToIdle,
                    mapContent = { _, _ ->
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .testTag("mapapp-map"),
                        )
                    },
                    planningOverlays = { sessionId, routeReturnToIdle ->
                        PlanningScreenOverlays(
                            sessionId = sessionId,
                            navController = navController,
                            onReturnToIdle = routeReturnToIdle,
                            container = { containerReturnToIdle ->
                                PlanningScreenContent(
                                    uiState = uiState.value,
                                    onMenuTap = {},
                                    onCollapse = {},
                                    onFilter = {},
                                    onDismissCancelConfirm = {
                                        uiState.value = uiState.value.copy(showCancelConfirm = false)
                                    },
                                    onKeepPlanning = {
                                        uiState.value = uiState.value.copy(showCancelConfirm = false)
                                    },
                                    onCancelPlan = onCancelPlan,
                                    onReturnToIdle = containerReturnToIdle,
                                    consumeTransition = consumeTransition,
                                    requestCancel = {
                                        uiState.value = uiState.value.copy(showCancelConfirm = true)
                                    },
                                    skipMapRendering = true,
                                )
                            },
                        )
                    },
                )
            }
        }
    }
}
