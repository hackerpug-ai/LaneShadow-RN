package com.laneshadow.ui.components.molecules

import com.laneshadow.ui.atoms.Glyphs

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Header molecule component
 *
 * Generic header with menu toggle for teacher and parent roles.
 * Following React Native wrapper patterns from react-native/components/layouts/header.tsx
 *
 * @param title Header title text
 * @param onMenuPress Menu button click callback
 * @param modifier Modifier for the component container
 * @param testId Optional test identifier for UI testing
 */
@Composable
fun Header(
    title: String,
    onMenuPress: () -> Unit,
    modifier: Modifier = Modifier,
    testId: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    Row(
        modifier = modifier
            .background(theme.colors.background.default)
            .border(
                border = BorderStroke(
                    width = 1.dp,
                    color = theme.colors.border.default,
                ),
            )
            .height(60.dp)
            .padding(horizontal = theme.space.lg, vertical = theme.space.sm)
            .testTag(testId ?: "header"),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Menu button (44x44)
        Icon(
            imageVector = Glyphs.Default.Menu,
            contentDescription = "Menu",
            tint = theme.colors.onSurface.default,
            modifier = Modifier
                .testTag(testId?.let { "$it-menu-button" } ?: "menu-button")
                .clickable(onClickLabel = "Menu", onClick = onMenuPress)
                .padding(theme.space.sm)
                .semantics {
                    contentDescription = "Menu"
                },
        )

        // Centered title
        Text(
            text = title,
            style = theme.type.title.lg,
            color = theme.colors.onSurface.default,
            modifier = Modifier
                .weight(1f)
                .testTag(testId?.let { "$it-title" } ?: "header-title")
                .semantics {
                    contentDescription = title
                },
        )

        // Right spacer (44dp) to balance layout
        Spacer(
            modifier = Modifier
                .width(44.dp)
                .testTag(testId?.let { "$it-right-spacer" } ?: "header-right-spacer"),
        )
    }
}
