package com.laneshadow.ui.molecules

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.unit.dp
import com.google.common.truth.Truth.assertThat
import com.laneshadow.BuildConfig
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.RuleChain
import org.junit.rules.TestRule
import org.junit.runner.Description
import org.junit.runner.RunWith
import org.junit.runners.model.Statement
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class LSContextCapsuleTest {
    private val composeRule = createComposeRule()

    @get:Rule
    val ruleChain: TestRule = RuleChain.outerRule(ContextCapsuleDebugVariantRule).around(composeRule)

    @Test
    fun idle_state_renders_copper_italic_scope_and_meta_dots() {
        var expectedBackground = Color.Unspecified
        var expectedBorder = Color.Unspecified
        var expectedCornerRadius = 0.dp

        composeRule.setContent {
            LaneShadowTheme {
                val theme = LocalLaneShadowTheme.current
                expectedBackground = theme.colors.card.default.copy(alpha = 0.72f)
                expectedBorder = theme.colors.border.default
                expectedCornerRadius = theme.radius.lg

                LSContextCapsule(
                    state = idleState(),
                )
            }
        }

        composeRule.onNodeWithTag(LS_CONTEXT_CAPSULE_TAG)
            .assert(SemanticsMatcher.expectValue(LSContextCapsuleBackgroundColorKey, expectedBackground))
            .assert(SemanticsMatcher.expectValue(LSContextCapsuleBorderColorKey, expectedBorder))
            .assert(SemanticsMatcher.expectValue(LSContextCapsuleBlurRadiusKey, 14.dp))
            .assert(SemanticsMatcher.expectValue(LSContextCapsuleCornerRadiusKey, expectedCornerRadius))
            .assert(SemanticsMatcher.expectValue(LSContextCapsuleHeadlineAccentColorKey, GeneratedTokens.color.Signal.default))
            .assert(SemanticsMatcher.expectValue(LSContextCapsuleHeadlineAccentTextKey, "today"))
            .assert(SemanticsMatcher.expectValue(LSContextCapsuleMetaTextStyleKey, "Ui.Label.Sm"))

        composeRule.onNodeWithText("Where are we riding today, Justin?").assertIsDisplayed()
        composeRule.onNodeWithText("Friday").assertExists()
        composeRule.onNodeWithText("68°F").assertExists()
        composeRule.onNodeWithText("Clear").assertExists()
    }

    @Test
    fun planning_state_renders_pulse_spinner_and_italic_headline() {
        var reduceMotion by mutableStateOf(false)

        composeRule.setContent {
            LaneShadowTheme {
                LSContextCapsule(
                    state = CapsuleState.Planning(headline = "Sketching a coastal loop…"),
                    reduceMotionOverride = reduceMotion,
                )
            }
        }

        composeRule.onNodeWithTag(LS_CONTEXT_CAPSULE_SPINNER_TAG)
            .assertExists()
            .assert(SemanticsMatcher.expectValue(LSContextCapsuleReduceMotionKey, false))
        composeRule.onNodeWithTag(LS_CONTEXT_CAPSULE_HEADLINE_TAG).assertExists()
        composeRule.onNodeWithText("Sketching a coastal loop…").assertIsDisplayed()

        composeRule.runOnIdle { reduceMotion = true }

        composeRule.onNodeWithTag(LS_CONTEXT_CAPSULE_SPINNER_TAG)
            .assert(SemanticsMatcher.expectValue(LSContextCapsuleReduceMotionKey, true))
            .assert(SemanticsMatcher.expectValue(LSContextCapsuleSpinnerAlphaKey, 0.7f))
    }

    @Test
    fun route_state_uses_primary_italic_and_mono_tertiary_metrics() {
        var expectedPrimary = Color.Unspecified
        var expectedTertiary = Color.Unspecified

        composeRule.setContent {
            LaneShadowTheme {
                val theme = LocalLaneShadowTheme.current
                expectedPrimary = theme.content.primary
                expectedTertiary = theme.content.tertiary

                LSContextCapsule(
                    state = routeState(),
                )
            }
        }

        composeRule.onNodeWithTag(LS_CONTEXT_CAPSULE_TAG)
            .assert(SemanticsMatcher.expectValue(LSContextCapsuleHeadlineAccentColorKey, expectedPrimary))
            .assert(SemanticsMatcher.expectValue(LSContextCapsuleHeadlineAccentTextKey, "Coastal cruise"))
            .assert(SemanticsMatcher.expectValue(LSContextCapsuleMetaColorKey, expectedTertiary))
            .assert(SemanticsMatcher.expectValue(LSContextCapsuleMetaTextStyleKey, "Instrument.Sm"))

        composeRule.onNodeWithText("47 mi").assertExists()
        composeRule.onNodeWithText("2h 15m").assertExists()
        composeRule.onNodeWithText("arr 4:32p").assertExists()
    }

    @Test
    fun warning_modifier_tints_meta_row_only() {
        var expectedWarning = Color.Unspecified

        composeRule.setContent {
            LaneShadowTheme {
                expectedWarning = LocalLaneShadowTheme.current.colors.warning.default
                LSContextCapsule(state = idleWarningState())
            }
        }

        composeRule.onNodeWithTag(LS_CONTEXT_CAPSULE_TAG)
            .assert(SemanticsMatcher.expectValue(LSContextCapsuleMetaColorKey, expectedWarning))
            .assert(SemanticsMatcher.expectValue(LSContextCapsuleHeadlineAccentColorKey, GeneratedTokens.color.Signal.default))
    }

    @Test
    fun saved_modifier_paints_copper_hairline_border() {
        composeRule.setContent {
            LaneShadowTheme {
                LSContextCapsule(
                    state = savedRouteState(),
                )
            }
        }

        composeRule.onNodeWithTag(LS_CONTEXT_CAPSULE_TAG)
            .assert(SemanticsMatcher.expectValue(LSContextCapsuleSavedKey, true))
            .assert(SemanticsMatcher.expectValue(LSContextCapsuleSavedBorderColorKey, GeneratedTokens.color.Signal.default))
    }

    @Test
    fun theme_toggle_reresolves_tokens_without_remount() {
        var darkTheme by mutableStateOf(false)

        composeRule.setContent {
            LaneShadowTheme(darkTheme = darkTheme) {
                LSContextCapsule(
                    state = idleWarningState(),
                )
            }
        }

        val lightNode = composeRule.onNodeWithTag(LS_CONTEXT_CAPSULE_TAG).fetchSemanticsNode()
        val lightBackground = lightNode.config[LSContextCapsuleBackgroundColorKey]
        val lightBorder = lightNode.config[LSContextCapsuleBorderColorKey]
        val lightAccent = lightNode.config[LSContextCapsuleHeadlineAccentColorKey]
        val lightMeta = lightNode.config[LSContextCapsuleMetaColorKey]
        val instanceId = lightNode.config[LSContextCapsuleInstanceIdKey]

        composeRule.runOnIdle { darkTheme = true }

        val darkNode = composeRule.onNodeWithTag(LS_CONTEXT_CAPSULE_TAG).fetchSemanticsNode()
        assertThat(darkNode.config[LSContextCapsuleInstanceIdKey]).isEqualTo(instanceId)
        assertThat(darkNode.config[LSContextCapsuleBackgroundColorKey]).isNotEqualTo(lightBackground)
        assertThat(darkNode.config[LSContextCapsuleBorderColorKey]).isNotEqualTo(lightBorder)
        assertThat(darkNode.config[LSContextCapsuleHeadlineAccentColorKey]).isEqualTo(lightAccent)
        assertThat(darkNode.config[LSContextCapsuleMetaColorKey]).isEqualTo(lightMeta)
    }

    @Test
    fun chipAppearance_usesGlassPanelChrome() {
        composeRule.setContent {
            LaneShadowTheme {
                LSContextCapsule(
                    state = idleState(),
                    appearance = CapsuleAppearance.Chip,
                )
            }
        }

        // Verify the capsule renders
        composeRule.onNodeWithTag(LS_CONTEXT_CAPSULE_TAG).assertExists()

        // Verify the content is still present
        composeRule.onNodeWithText("Where are we riding today, Justin?").assertExists()
        composeRule.onNodeWithText("Friday").assertExists()
    }
}

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

private object ContextCapsuleDebugVariantRule : TestRule {
    override fun apply(base: Statement, description: Description): Statement =
        object : Statement() {
            override fun evaluate() {
                assumeTrue(BuildConfig.BUILD_TYPE == "debug")
                base.evaluate()
            }
        }
}
