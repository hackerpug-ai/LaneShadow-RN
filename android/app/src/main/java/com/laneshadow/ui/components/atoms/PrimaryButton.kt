package com.laneshadow.ui.components.atoms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * PrimaryButton atom component
 *
 * Full-width primary action button with copper glow effect.
 *
 * @param title Button text content
 * @param onPress Callback when button is pressed
 * @param icon Optional icon composable to display (20dp size)
 * @param loading Whether button is in loading state (shows "Loading..." text with spinner)
 * @param disabled Whether button is disabled
 * @param modifier Modifier for the button container
 * @param testID Test ID for UI testing
 */
@Composable
fun PrimaryButton(
    title: String,
    onPress: () -> Unit,
    icon: @Composable (() -> Unit)? = null,
    loading: Boolean = false,
    disabled: Boolean = false,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // Determine if button should be disabled (loading also disables)
    val isDisabled = disabled || loading

    // Copper glow color with 40% opacity
    val copperGlow = Color(0xFFB87333).copy(alpha = 0.4f)

    // Button dimensions from spec
    val buttonHeight = 56.dp
    val buttonRadius = RoundedCornerShape(20.dp) // radius.xl
    val horizontalPadding = 24.dp // space.xl

    // Background color
    val backgroundColor = if (isDisabled) {
        theme.colors.primary.default.copy(alpha = 0.5f)
    } else {
        theme.colors.primary.default
    }

    // Text color - always onPrimary
    val textColor = theme.colors.onPrimary.default

    // Build semantics
    val buttonModifier = modifier
        .fillMaxWidth()
        .semantics {
            role = Role.Button
            if (isDisabled) {
                disabled()
            }
        }

    // Apply disabled opacity
    val appliedModifier = if (isDisabled) {
        buttonModifier.alpha(0.5f)
    } else {
        buttonModifier
    }

    Surface(
        modifier = appliedModifier,
        shape = buttonRadius,
        color = backgroundColor,
        shadowElevation = if (isDisabled) 0.dp else 4.dp,
        tonalElevation = if (isDisabled) 0.dp else 4.dp,
    ) {
        Box(
            modifier = Modifier
                .height(buttonHeight)
                .padding(horizontal = horizontalPadding),
            contentAlignment = Alignment.Center,
        ) {
            when {
                loading -> {
                    // Show loading indicator with "Loading..." text
                    Row(
                        modifier = Modifier,
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp,
                            color = textColor,
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Loading...",
                            style = androidx.compose.ui.text.TextStyle(
                                fontSize = 16.sp,
                                fontWeight = FontWeight.SemiBold,
                                letterSpacing = 0.sp,
                            ),
                            color = textColor,
                        )
                    }
                }
                else -> {
                    // Button with text and optional icon
                    Row(
                        modifier = Modifier,
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        if (icon != null) {
                            // Icon is sized at 20dp per spec
                            Box(modifier = Modifier.size(20.dp)) {
                                icon()
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                        }

                        Text(
                            text = title,
                            style = androidx.compose.ui.text.TextStyle(
                                fontSize = 16.sp,
                                fontWeight = FontWeight.SemiBold,
                                letterSpacing = 0.sp,
                            ),
                            color = textColor,
                        )
                    }
                }
            }
        }
    }
}
