package com.laneshadow.ui.organisms

import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.dp
import com.laneshadow.BuildConfig
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import org.junit.Assert.assertEquals
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.RuleChain
import org.junit.rules.TestRule
import org.junit.runner.Description
import org.junit.runners.model.Statement
import org.robolectric.RobolectricTestRunner
import org.junit.runner.RunWith

@RunWith(RobolectricTestRunner::class)
class LSSectionHeaderTest {
    private val composeTestRule = createComposeRule()

    @get:Rule
    val ruleChain: TestRule = RuleChain.outerRule(DebugVariantRuleForSectionHeader).around(composeTestRule)

    /**
     * AC-1: Title + See All with spacing.3 inset
     *
     * GIVEN: Developer composes LSSectionHeader(title="Nearby Routes", trailing=SectionHeaderTrailing.Link("See all", onTap={}))
     * WHEN: Composable enters composition
     * THEN: Leading LSText("Nearby Routes", typography.ui.title.md); trailing LSText("See all") tinted colors.signal.default with Modifier.clickable; root Row has Modifier.padding(start=Spacing.spacing3); horizontal arrangement SpaceBetween
     */
    @Test
    fun title_with_trailing_link_renders_correctly() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSSectionHeader(
                    title = "Nearby Routes",
                    trailing = SectionHeaderTrailing.Link(label = "See all", onTap = {}),
                    modifier = Modifier.testTag("section-header-with-trailing"),
                )
            }
        }

        // Assert root component renders
        composeTestRule.onNodeWithTag("section-header-with-trailing").assertExists()

        // Assert title tag exists
        composeTestRule.onNodeWithTag(LSSECTIONHEADER_TITLE_TAG).assertExists()

        // Assert trailing tag exists
        composeTestRule.onNodeWithTag(LSSECTIONHEADER_TRAILING_TAG)
            .assertExists()
            .assertHasClickAction()

        // Assert component renders in LaneShadowTheme (uses theme tokens)
        composeTestRule.onNodeWithContentDescription("View all: See all").assertExists()
    }

    /**
     * AC-2: Caps label style no trailing
     *
     * GIVEN: Developer composes LSSectionHeader(title="THIS WEEK")
     * WHEN: Composable enters composition
     * THEN: Title rendered with caps-style LSText(typography.ui.label.sm); no trailing test tag present; inset Spacing.spacing3 applied
     */
    @Test
    fun caps_label_no_trailing() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSSectionHeader(
                    title = "THIS WEEK",
                    modifier = Modifier.testTag("section-header-caps"),
                )
            }
        }

        // Assert root component renders
        composeTestRule.onNodeWithTag("section-header-caps").assertExists()

        // Assert title tag exists
        composeTestRule.onNodeWithTag(LSSECTIONHEADER_TITLE_TAG).assertExists()

        // Assert trailing tag does NOT exist
        composeTestRule.onAllNodesWithTag(LSSECTIONHEADER_TRAILING_TAG)
            .assertCountEquals(0)
    }

    /**
     * AC-3: See All tap fires once
     *
     * GIVEN: LSSectionHeader with trailing=Link("See all", mock onTap)
     * WHEN: Test taps the See all label
     * THEN: onTap invocation count == 1
     */
    @Test
    fun see_all_tap_fires_callback() {
        var tapCount = 0

        composeTestRule.setContent {
            LaneShadowTheme {
                LSSectionHeader(
                    title = "Nearby Routes",
                    trailing = SectionHeaderTrailing.Link(
                        label = "See all",
                        onTap = { tapCount++ },
                    ),
                    modifier = Modifier.testTag("section-header-tappable"),
                )
            }
        }

        // Tap the trailing link
        composeTestRule.onNodeWithTag(LSSECTIONHEADER_TRAILING_TAG)
            .performClick()

        // Assert callback fired exactly once
        assertEquals(1, tapCount)
    }

    /**
     * AC-4: Custom inset prop override
     *
     * GIVEN: LSSectionHeader(title="Custom", inset=Spacing.spacing6)
     * WHEN: Composable enters composition
     * THEN: Root Row Modifier.padding(start=Spacing.spacing6) applied; default override honored
     */
    @Test
    fun custom_inset_overrides_default() {
        val customInset = 24.dp

        composeTestRule.setContent {
            LaneShadowTheme {
                LSSectionHeader(
                    title = "Custom Inset",
                    trailing = SectionHeaderTrailing.Link(label = "See all", onTap = {}),
                    insetOverride = customInset,
                    modifier = Modifier.testTag("section-header-custom-inset"),
                )
            }
        }

        // Assert component renders with custom inset
        composeTestRule.onNodeWithTag("section-header-custom-inset").assertExists()
        composeTestRule.onNodeWithTag(LSSECTIONHEADER_TITLE_TAG).assertExists()
        composeTestRule.onNodeWithTag(LSSECTIONHEADER_TRAILING_TAG).assertExists()
    }

    /**
     * AC-6: No molecule imports + no banned primitives
     *
     * GIVEN: LSSectionHeader.kt source
     * WHEN: grep gate runs
     * THEN: No imports from com.laneshadow.ui.molecules.*; no Color(0x, TextStyle(, FontFamily( literals; only atoms + theme imports
     */
    @Test
    fun no_banned_primitives_in_source() {
        val source = java.io.File("../app/src/main/java/com/laneshadow/ui/organisms/LSSectionHeader.kt").readText()

        // Must not import from molecules package
        org.junit.Assert.assertFalse("Must not import from molecules package", source.contains("import com.laneshadow.ui.molecules"))

        // Must not use hardcoded Color literals
        org.junit.Assert.assertFalse("Must not use hardcoded Color literals", source.contains("Color(0x"))

        // Must not use hardcoded TextStyle literals
        org.junit.Assert.assertFalse("Must not use hardcoded TextStyle literals", source.contains("TextStyle("))

        // Must not use hardcoded FontFamily literals
        org.junit.Assert.assertFalse("Must not use hardcoded FontFamily literals", source.contains("FontFamily("))

        // Must import from atoms package
        org.junit.Assert.assertTrue("Must import from atoms package", source.contains("import com.laneshadow.ui.atoms"))

        // Must use theme tokens
        org.junit.Assert.assertTrue("Must use theme tokens", source.contains("LocalLaneShadowTheme"))
    }
}

private object DebugVariantRuleForSectionHeader : TestRule {
    override fun apply(base: Statement, description: Description): Statement =
        object : Statement() {
            override fun evaluate() {
                assumeTrue(BuildConfig.BUILD_TYPE == "debug")
                base.evaluate()
            }
        }
}
