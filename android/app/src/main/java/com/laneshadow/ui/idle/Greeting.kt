package com.laneshadow.ui.idle

import androidx.compose.ui.text.AnnotatedString

/**
 * Idle greeting with AnnotatedString support
 *
 * This is a local wrapper around the sandbox Greeting class that supports
 * AnnotatedString for the headline field, allowing italic styling of the
 * scope word ("today"/"tonight").
 */
data class IdleGreeting(
    val meta: String,                           // e.g. "FRIDAY · 68°F · CLEAR"
    val headline: AnnotatedString,              // e.g. "Where are we riding today?" with italic "today"
    val emphasis: String? = null,               // substring to italicize (e.g. "today")
)

/**
 * Convert this AnnotatedString IdleGreeting to the sandbox Greeting format
 *
 * Since the sandbox Greeting expects a plain String headline, we extract
 * the plain text from the AnnotatedString.
 */
fun IdleGreeting.toMockGreeting(): com.laneshadow.sandbox.mockproviders.Greeting =
    com.laneshadow.sandbox.mockproviders.Greeting(
        meta = meta,
        headline = headline.text,
        emphasis = emphasis,
    )
