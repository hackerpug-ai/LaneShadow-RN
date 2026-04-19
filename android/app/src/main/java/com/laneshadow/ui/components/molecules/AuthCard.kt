package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * AuthCard molecule component
 *
 * Card container for authentication screens (login, signup).
 * Provides a themed card with optional icon, title, subtitle, and content area.
 *
 * @param title Card title text
 * @param subtitle Optional subtitle/description text
 * @param icon Optional top icon composable
 * @param content Card body content composable
 * @param modifier Modifier for the card container
 */
@Composable
fun AuthCard(
    title: String,
    subtitle: String? = null,
    icon: @Composable (() -> Unit)? = null,
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    val theme = LocalLaneShadowTheme.current

    // Card styling constants
    val cornerRadius = theme.radius.xl
    val cardPadding = theme.space.lg
    val elevation = 1.dp
    val borderStroke = BorderStroke(1.dp, theme.colors.border.default)

    Surface(
        modifier = modifier,
        shape = androidx.compose.foundation.shape.RoundedCornerShape(cornerRadius),
        color = theme.colors.surface.default,
        border = borderStroke,
        tonalElevation = elevation,
    ) {
        Column(
            modifier = Modifier
                .padding(cardPadding),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            // Optional icon at top
            if (icon != null) {
                Box(
                    modifier = Modifier
                        .padding(bottom = 24.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    icon()
                }
            }

            // Title
            Text(
                text = title,
                modifier = Modifier.padding(bottom = if (subtitle != null) 8.dp else 24.dp),
                style = androidx.compose.ui.text.TextStyle(
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                ),
                color = theme.colors.onSurface.default,
            )

            // Optional subtitle
            if (subtitle != null) {
                Text(
                    text = subtitle,
                    modifier = Modifier.padding(bottom = 24.dp),
                    style = androidx.compose.ui.text.TextStyle(
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Normal,
                    ),
                    color = theme.colors.onSurface.default.copy(alpha = 0.7f),
                )
            }

            // Card content
            content()
        }
    }
}
