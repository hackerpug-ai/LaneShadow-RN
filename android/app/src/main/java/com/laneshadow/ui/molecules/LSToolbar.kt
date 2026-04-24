package com.laneshadow.ui.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.systemBars
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import com.laneshadow.theme.LaneShadowThemeValues
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.atoms.ButtonVariant
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LSButton
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.TypographyVariant

const val LSToolbarTitleTag = "ls-toolbar-title"
const val LSToolbarLeadingTag = "ls-toolbar-leading"
const val LSToolbarTrailingTag = "ls-toolbar-trailing"

val LSToolbarHeightKey = SemanticsPropertyKey<Dp>("LSToolbarHeight")
val LSToolbarBackgroundColorKey = SemanticsPropertyKey<Color>("LSToolbarBackgroundColor")
val LSToolbarTitleVariantKey = SemanticsPropertyKey<String>("LSToolbarTitleVariant")
val LSToolbarInsetsAppliedKey = SemanticsPropertyKey<Boolean>("LSToolbarInsetsApplied")
val LSToolbarTrailingGapKey = SemanticsPropertyKey<Dp>("LSToolbarTrailingGap")

private var SemanticsPropertyReceiver.lsToolbarHeight by LSToolbarHeightKey
private var SemanticsPropertyReceiver.lsToolbarBackgroundColor by LSToolbarBackgroundColorKey
private var SemanticsPropertyReceiver.lsToolbarTitleVariant by LSToolbarTitleVariantKey
private var SemanticsPropertyReceiver.lsToolbarInsetsApplied by LSToolbarInsetsAppliedKey
private var SemanticsPropertyReceiver.lsToolbarTrailingGap by LSToolbarTrailingGapKey

@Stable
data class ToolbarComponentSizing(
    val toolbarHeight: Dp,
    val actionTouchTarget: Dp,
)

val LaneShadowThemeValues.toolbarComponentSizing: ToolbarComponentSizing
    get() = ToolbarComponentSizing(
        // Toolbar height token is not exposed in LaneShadowThemeValues yet; derive from existing spacing tokens.
        toolbarHeight = space.xxxxl - space.sm,
        actionTouchTarget = space.xxxl,
    )

@Stable
data class LSToolbarAction(
    val icon: IconName,
    val onClick: () -> Unit,
)

@Stable
sealed interface LSToolbarLeading {
    @Stable
    data object None : LSToolbarLeading

    @Stable
    data class Back(val onClick: () -> Unit) : LSToolbarLeading
}

@Stable
sealed interface LSToolbarTrailing {
    @Stable
    data object None : LSToolbarTrailing

    @Stable
    data class Action(val icon: IconName, val onClick: () -> Unit) : LSToolbarTrailing

    @Stable
    data class Actions(
        val first: LSToolbarAction,
        val second: LSToolbarAction,
    ) : LSToolbarTrailing
}

@Stable
data class LSToolbarStyle(
    val height: Dp,
    val backgroundColor: Color,
    val trailingGap: Dp,
    val actionTouchTarget: Dp,
)

fun resolveLSToolbarStyle(theme: LaneShadowThemeValues): LSToolbarStyle =
    LSToolbarStyle(
        height = theme.toolbarComponentSizing.toolbarHeight,
        backgroundColor = GeneratedTokens.color.Surface.primary,
        trailingGap = theme.space.xs,
        actionTouchTarget = theme.toolbarComponentSizing.actionTouchTarget,
    )

@Composable
fun LSToolbar(
    title: String,
    leading: LSToolbarLeading = LSToolbarLeading.None,
    trailing: LSToolbarTrailing = LSToolbarTrailing.None,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    val style = resolveLSToolbarStyle(theme)

    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(style.backgroundColor)
            .windowInsetsPadding(WindowInsets.systemBars)
            .semantics {
                lsToolbarHeight = style.height
                lsToolbarBackgroundColor = style.backgroundColor
                lsToolbarTitleVariant = "Ui.Title.Md"
                lsToolbarInsetsApplied = true
                lsToolbarTrailingGap = style.trailingGap
            },
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(style.height),
            contentAlignment = Alignment.Center,
        ) {
            LSText(
                text = title,
                variant = TypographyVariant.Ui.Title.Md,
                color = ContentColor.Primary,
                modifier = Modifier
                    .testTag(LSToolbarTitleTag)
                    .wrapContentWidth()
                    .semantics { contentDescription = "Toolbar title" },
            )
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(style.height),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            LeadingSlot(
                leading = leading,
                actionSize = style.actionTouchTarget,
            )

            Spacer(modifier = Modifier.weight(1f))

            TrailingSlot(
                trailing = trailing,
                actionSize = style.actionTouchTarget,
                actionGap = style.trailingGap,
            )
        }
    }
}

@Composable
private fun LeadingSlot(
    leading: LSToolbarLeading,
    actionSize: Dp,
) {
    when (leading) {
        LSToolbarLeading.None -> Unit
        is LSToolbarLeading.Back -> {
            ToolbarIconButton(
                icon = IconName.ChevL,
                description = "Navigate back",
                onClick = leading.onClick,
                modifier = Modifier.testTag(LSToolbarLeadingTag),
                actionSize = actionSize,
            )
        }
    }
}

@Composable
private fun TrailingSlot(
    trailing: LSToolbarTrailing,
    actionSize: Dp,
    actionGap: Dp,
) {
    when (trailing) {
        LSToolbarTrailing.None -> Unit
        is LSToolbarTrailing.Action -> {
            ToolbarIconButton(
                icon = trailing.icon,
                description = "Toolbar action: ${trailing.icon.value}",
                onClick = trailing.onClick,
                actionSize = actionSize,
                modifier = Modifier.testTag(LSToolbarTrailingTag),
            )
        }
        is LSToolbarTrailing.Actions -> {
            Row(
                horizontalArrangement = Arrangement.spacedBy(actionGap),
                modifier = Modifier.testTag(LSToolbarTrailingTag),
            ) {
                ToolbarIconButton(
                    icon = trailing.first.icon,
                    description = "Toolbar action: ${trailing.first.icon.value}",
                    onClick = trailing.first.onClick,
                    actionSize = actionSize,
                    modifier = Modifier,
                )
                ToolbarIconButton(
                    icon = trailing.second.icon,
                    description = "Toolbar action: ${trailing.second.icon.value}",
                    onClick = trailing.second.onClick,
                    actionSize = actionSize,
                    modifier = Modifier,
                )
            }
        }
    }
}

@Composable
private fun ToolbarIconButton(
    icon: IconName,
    description: String,
    onClick: () -> Unit,
    actionSize: Dp,
    modifier: Modifier,
) {
    Box(
        modifier = modifier.size(actionSize),
        contentAlignment = Alignment.Center,
    ) {
        LSButton(
            label = "",
            variant = ButtonVariant.Ghost,
            onClick = onClick,
            modifier = Modifier
                .fillMaxWidth()
                .height(actionSize)
                .semantics { contentDescription = description },
        )

        LSIcon(
            name = icon,
            size = IconSize.Md,
            color = IconColor.Content(ContentColor.Primary),
        )
    }
}
