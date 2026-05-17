package com.laneshadow.ui.molecules

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.GlassCornerRadius
import com.laneshadow.ui.atoms.GlassVariant
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LSGlassPanel
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.StatusColor
import com.laneshadow.ui.atoms.TypographyVariant

// Test tags
const val LS_IDLE_HEADER_TAG = "ls-idle-header"
const val LS_IDLE_HEADER_MENU_TAG = "ls-idle-header-menu"
const val LS_IDLE_HEADER_NEW_TAG = "ls-idle-header-new"
const val LS_IDLE_HEADER_CAPSULE_TAG = "ls-idle-header-capsule"
const val LS_IDLE_HEADER_META_TAG = "ls-idle-header-meta"

private val ChipHeight = 40.dp
private val ActionSize = 40.dp

/**
 * Unified idle-screen floating header. Renders menu + idle context capsule
 * content + new-session affordance inside a single [LSGlassPanel] chip so the
 * three elements visually read as one. Replaces the older three-chip
 * [com.laneshadow.ui.organisms.LSTopBar] layout on the idle screen only.
 *
 * Authority: `.spec/design/system/views/mapapp/idle/README.md`
 * "TopBar Chip Paradigm".
 */
@Composable
fun LSIdleHeader(
    capsuleState: CapsuleState,
    onMenuTap: () -> Unit,
    onNewTap: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Box(
        modifier = modifier
            .fillMaxWidth()
            .statusBarsPadding()
            .padding(horizontal = theme.space.md)
            .testTag(LS_IDLE_HEADER_TAG),
    ) {
        LSGlassPanel(
            variant = GlassVariant.Chrome,
            cornerRadius = GlassCornerRadius.Md,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(ChipHeight),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
            ) {
                MenuButton(onTap = onMenuTap)
                Box(modifier = Modifier.weight(1f)) {
                    CapsuleContent(state = capsuleState)
                }
                NewButton(onTap = onNewTap)
            }
        }
    }
}

@Composable
private fun MenuButton(
    onTap: () -> Unit,
) {
    Box(
        modifier = Modifier
            .minimumInteractiveComponentSize()
            .size(ActionSize)
            .clickable(onClick = onTap)
            .testTag(LS_IDLE_HEADER_MENU_TAG)
            .semantics { contentDescription = "Open sessions" },
        contentAlignment = Alignment.Center,
    ) {
        LSIcon(
            name = IconName.Menu,
            size = IconSize.Sm,
            color = IconColor.Content(ContentColor.Primary),
        )
    }
}

@Composable
private fun NewButton(
    onTap: () -> Unit,
) {
    Box(
        modifier = Modifier
            .minimumInteractiveComponentSize()
            .size(ActionSize)
            .clickable(onClick = onTap)
            .testTag(LS_IDLE_HEADER_NEW_TAG)
            .semantics { contentDescription = "Start new session" },
        contentAlignment = Alignment.Center,
    ) {
        LSIcon(
            name = IconName.Plus,
            size = IconSize.Sm,
            color = IconColor.Content(ContentColor.Primary),
        )
    }
}

@Composable
private fun CapsuleContent(state: CapsuleState) {
    val theme = LocalLaneShadowTheme.current

    when (state) {
        is CapsuleState.Idle -> {
            val emphasisColor = GeneratedTokens.color.Signal.default
            val baseColor = theme.content.primary
            val metaColor = if (state.isWarning) {
                theme.colors.warning.default
            } else {
                GeneratedTokens.color.Signal.default
            }

            Column(
                modifier = Modifier.testTag(LS_IDLE_HEADER_CAPSULE_TAG),
                verticalArrangement = Arrangement.spacedBy(theme.space.xs),
            ) {
                Text(
                    text = styledIdleHeadline(
                        headline = state.headline,
                        emphasis = state.emphasizedWord,
                        baseColor = baseColor,
                        emphasisColor = emphasisColor,
                    ),
                    style = theme.typography.opinion.md,
                    color = baseColor,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )

                if (state.metaItems.isNotEmpty()) {
                    MetaRow(items = state.metaItems, color = metaColor)
                }
            }
        }
        is CapsuleState.Planning -> {
            LSText(
                text = state.headline,
                variant = TypographyVariant.Opinion.Md,
                color = ContentColor.Primary,
                modifier = Modifier.testTag(LS_IDLE_HEADER_CAPSULE_TAG),
            )
        }
        is CapsuleState.Route -> {
            Column(
                modifier = Modifier.testTag(LS_IDLE_HEADER_CAPSULE_TAG),
                verticalArrangement = Arrangement.spacedBy(theme.space.xs),
            ) {
                LSText(
                    text = state.name,
                    variant = TypographyVariant.Opinion.Md,
                    color = ContentColor.Primary,
                )
                if (state.metrics.isNotEmpty()) {
                    MetaRow(items = state.metrics, color = theme.content.tertiary)
                }
            }
        }
    }
}

@Composable
private fun MetaRow(items: List<String>, color: Color) {
    val theme = LocalLaneShadowTheme.current
    Row(
        modifier = Modifier.testTag(LS_IDLE_HEADER_META_TAG),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(theme.space.xs),
    ) {
        items.forEachIndexed { index, item ->
            if (index > 0) {
                Box(
                    modifier = Modifier
                        .size(3.dp)
                        .alpha(0.45f),
                ) {
                    Box(
                        modifier = Modifier
                            .size(3.dp)
                            .align(Alignment.Center),
                    ) {
                        LSIcon(
                            name = IconName.CircleFill,
                            size = IconSize.Xs,
                            color = IconColor.Signal,
                        )
                    }
                }
            }
            Text(
                text = item,
                style = theme.typography.ui.label.sm,
                color = color,
                maxLines = 1,
            )
        }
    }
}

private fun styledIdleHeadline(
    headline: String,
    emphasis: String,
    baseColor: Color,
    emphasisColor: Color,
): AnnotatedString {
    val text = headline
    if (emphasis.isBlank()) {
        return buildAnnotatedString {
            withStyle(SpanStyle(color = baseColor)) { append(text) }
        }
    }
    val matchRange = Regex(Regex.escape(emphasis), RegexOption.IGNORE_CASE).find(text)
    if (matchRange == null) {
        return buildAnnotatedString {
            withStyle(SpanStyle(color = baseColor)) { append(text) }
        }
    }
    return buildAnnotatedString {
        withStyle(SpanStyle(color = baseColor)) {
            append(text.substring(0, matchRange.range.first))
        }
        withStyle(
            SpanStyle(
                color = emphasisColor,
                fontStyle = FontStyle.Italic,
            )
        ) {
            append(text.substring(matchRange.range))
        }
        withStyle(SpanStyle(color = baseColor)) {
            append(text.substring(matchRange.range.last + 1))
        }
    }
}
