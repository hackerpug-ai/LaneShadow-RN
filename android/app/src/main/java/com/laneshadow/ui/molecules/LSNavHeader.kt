package com.laneshadow.ui.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.systemBars
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.TypographyVariant

const val LSNavHeaderTitleTag = "ls-nav-header-title"
const val LSNavHeaderSubtitleTag = "ls-nav-header-subtitle"

val LSNavHeaderBackgroundColorKey = SemanticsPropertyKey<Color>("LSNavHeaderBackgroundColor")
val LSNavHeaderTitleVariantKey = SemanticsPropertyKey<String>("LSNavHeaderTitleVariant")
val LSNavHeaderSubtitleVariantKey = SemanticsPropertyKey<String>("LSNavHeaderSubtitleVariant")
val LSNavHeaderSubtitleColorKey = SemanticsPropertyKey<Color>("LSNavHeaderSubtitleColor")
val LSNavHeaderVerticalGapKey = SemanticsPropertyKey<Dp>("LSNavHeaderVerticalGap")

private var SemanticsPropertyReceiver.lsNavHeaderBackgroundColor by LSNavHeaderBackgroundColorKey
private var SemanticsPropertyReceiver.lsNavHeaderTitleVariant by LSNavHeaderTitleVariantKey
private var SemanticsPropertyReceiver.lsNavHeaderSubtitleVariant by LSNavHeaderSubtitleVariantKey
private var SemanticsPropertyReceiver.lsNavHeaderSubtitleColor by LSNavHeaderSubtitleColorKey
private var SemanticsPropertyReceiver.lsNavHeaderVerticalGap by LSNavHeaderVerticalGapKey

enum class NavHeaderVariant {
    Default,
    LargeTitle,
    LargeTitleWithSubtitle,
}

@Stable
data class LSNavHeaderStyle(
    val backgroundColor: Color,
    val toolbarHeight: Dp,
    val largeTitleTopPadding: Dp,
    val subtitleGap: Dp,
)

@Composable
private fun resolveLSNavHeaderStyle(): LSNavHeaderStyle {
    val theme = LocalLaneShadowTheme.current
    return LSNavHeaderStyle(
        backgroundColor = GeneratedTokens.color.Surface.primary,
        toolbarHeight = theme.toolbarComponentSizing.toolbarHeight,
        largeTitleTopPadding = theme.space.md,
        subtitleGap = theme.space.xs,
    )
}

@Composable
fun LSNavHeader(
    title: String,
    variant: NavHeaderVariant = NavHeaderVariant.Default,
    subtitle: String? = null,
    modifier: Modifier = Modifier,
) {
    val style = resolveLSNavHeaderStyle()

    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(style.backgroundColor)
            .windowInsetsPadding(WindowInsets.systemBars)
            .semantics {
                lsNavHeaderBackgroundColor = style.backgroundColor
                lsNavHeaderVerticalGap = style.subtitleGap
                lsNavHeaderTitleVariant = when (variant) {
                    NavHeaderVariant.Default -> "Ui.Title.Md"
                    NavHeaderVariant.LargeTitle,
                    NavHeaderVariant.LargeTitleWithSubtitle,
                    -> "Opinion.Lg"
                }
                if (variant == NavHeaderVariant.LargeTitleWithSubtitle) {
                    lsNavHeaderSubtitleVariant = "Ui.Body.Md"
                    lsNavHeaderSubtitleColor = GeneratedTokens.color.Content.tertiary
                }
            },
    ) {
        when (variant) {
            NavHeaderVariant.Default -> {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(style.toolbarHeight),
                ) {
                    LSText(
                        text = title,
                        variant = TypographyVariant.Ui.Title.Md,
                        color = ContentColor.Primary,
                        modifier = Modifier
                            .padding(horizontal = LocalLaneShadowTheme.current.space.lg)
                            .testTag(LSNavHeaderTitleTag),
                    )
                }
            }
            NavHeaderVariant.LargeTitle -> {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = LocalLaneShadowTheme.current.space.lg),
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(style.toolbarHeight),
                    ) {}

                    LSText(
                        text = title,
                        variant = TypographyVariant.Opinion.Lg,
                        color = ContentColor.Primary,
                        modifier = Modifier
                            .padding(top = style.largeTitleTopPadding)
                            .testTag(LSNavHeaderTitleTag),
                    )
                }
            }
            NavHeaderVariant.LargeTitleWithSubtitle -> {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = LocalLaneShadowTheme.current.space.lg),
                    verticalArrangement = Arrangement.spacedBy(style.subtitleGap),
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(style.toolbarHeight),
                    ) {}

                    LSText(
                        text = title,
                        variant = TypographyVariant.Opinion.Lg,
                        color = ContentColor.Primary,
                        modifier = Modifier
                            .padding(top = style.largeTitleTopPadding)
                            .testTag(LSNavHeaderTitleTag),
                    )

                    if (!subtitle.isNullOrBlank()) {
                        LSText(
                            text = subtitle,
                            variant = TypographyVariant.Ui.Body.Md,
                            color = ContentColor.Tertiary,
                            modifier = Modifier.testTag(LSNavHeaderSubtitleTag),
                        )
                    }
                }
            }
        }
    }
}
