package com.laneshadow.ui.planning

import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.foundation.layout.Box
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import com.google.common.truth.Truth.assertThat
import com.laneshadow.data.chat.SessionMessage
import com.laneshadow.theme.LaneShadowTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class PlanningCancelConfirmTest {
    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun chat_input_renders_in_thinking_mode() {
        val uiState = PlanningUiState(
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
        )

        composeRule.setContent {
            LaneShadowTheme {
                PlanningScreenContent(
                    uiState = uiState,
                    onMenuTap = {},
                    onCollapse = {},
                    onFilter = {},
                    onDismissCancelConfirm = {},
                    onKeepPlanning = {},
                    onCancelPlan = {},
                    onReturnToIdle = {},
                    consumeTransition = {},
                    requestCancel = {},
                    skipMapRendering = false,
                    mapContent = { Box {} },
                )
            }
        }

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
        composeRule.setContent {
            LaneShadowTheme {
                PlanningCancelConfirmSheet(
                    onKeep = {},
                    onCancel = {},
                )
            }
        }

        composeRule.onNodeWithContentDescription("Cancel ride confirmation").assertExists()
        composeRule.onNodeWithTag("planning.cancel-confirm.cancel-button").assertExists()
        composeRule.onNodeWithTag("planning.cancel-confirm.keep-button").assertExists()
    }

    @Test
    fun cancel_button_invokes_view_model_cancel() {
        var uiState by mutableStateOf(
            PlanningUiState(
                sessionId = "session-1",
                isThinking = true,
                showCancelConfirm = true,
            ),
        )
        var cancelCount by mutableIntStateOf(0)

        composeRule.setContent {
            LaneShadowTheme {
                PlanningScreenContent(
                    uiState = uiState,
                    onMenuTap = {},
                    onCollapse = {},
                    onFilter = {},
                    onDismissCancelConfirm = { uiState = uiState.copy(showCancelConfirm = false) },
                    onKeepPlanning = { uiState = uiState.copy(showCancelConfirm = false) },
                    onCancelPlan = {
                        cancelCount += 1
                        uiState = uiState.copy(showCancelConfirm = false)
                    },
                    onReturnToIdle = {},
                    consumeTransition = {},
                    requestCancel = { uiState = uiState.copy(showCancelConfirm = true) },
                    skipMapRendering = false,
                    mapContent = { Box {} },
                )
            }
        }

        composeRule.onNodeWithTag("planning.cancel-confirm.cancel-button").performClick()

        composeRule.runOnIdle {
            assertThat(cancelCount).isEqualTo(1)
            assertThat(uiState.showCancelConfirm).isFalse()
        }
    }

    @Test
    fun keep_planning_dismisses_without_invoking_cancel() {
        var uiState by mutableStateOf(
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
        var cancelCount by mutableIntStateOf(0)

        composeRule.setContent {
            LaneShadowTheme {
                PlanningScreenContent(
                    uiState = uiState,
                    onMenuTap = {},
                    onCollapse = {},
                    onFilter = {},
                    onDismissCancelConfirm = { uiState = uiState.copy(showCancelConfirm = false) },
                    onKeepPlanning = { uiState = uiState.copy(showCancelConfirm = false) },
                    onCancelPlan = { cancelCount += 1 },
                    onReturnToIdle = {},
                    consumeTransition = {},
                    requestCancel = { uiState = uiState.copy(showCancelConfirm = true) },
                    skipMapRendering = false,
                    mapContent = { Box {} },
                )
            }
        }

        composeRule.onNodeWithTag("planning.cancel-confirm.keep-button").performClick()

        composeRule.runOnIdle {
            assertThat(cancelCount).isEqualTo(0)
            assertThat(uiState.showCancelConfirm).isFalse()
            assertThat(uiState.isThinking).isTrue()
        }
        composeRule.onNodeWithTag("ls-spinner").assertExists()
    }

    @Test
    fun cancelled_transition_triggers_return_to_idle_without_remount() {
        var uiState by mutableStateOf(
            PlanningUiState(
                sessionId = "session-1",
                isThinking = true,
            ),
        )
        var returnToIdleCount by mutableIntStateOf(0)
        var consumeTransitionCount by mutableIntStateOf(0)
        var mapHostMountCount by mutableIntStateOf(0)

        composeRule.setContent {
            LaneShadowTheme {
                PlanningScreenContent(
                    uiState = uiState,
                    onMenuTap = {},
                    onCollapse = {},
                    onFilter = {},
                    onDismissCancelConfirm = {},
                    onKeepPlanning = {},
                    onCancelPlan = {},
                    onReturnToIdle = { returnToIdleCount += 1 },
                    consumeTransition = {
                        consumeTransitionCount += 1
                        uiState = uiState.copy(transition = null)
                    },
                    requestCancel = {},
                    skipMapRendering = false,
                    mapContent = {
                        DisposableEffect(Unit) {
                            mapHostMountCount += 1
                            onDispose { }
                        }
                    },
                )
            }
        }

        composeRule.runOnIdle {
            uiState = uiState.copy(
                isThinking = false,
                transition = PlanningTransition.Cancelled,
            )
        }

        composeRule.waitForIdle()

        composeRule.runOnIdle {
            assertThat(returnToIdleCount).isEqualTo(1)
            assertThat(consumeTransitionCount).isEqualTo(1)
            assertThat(mapHostMountCount).isEqualTo(1)
            assertThat(uiState.transition).isNull()
        }
    }
}
