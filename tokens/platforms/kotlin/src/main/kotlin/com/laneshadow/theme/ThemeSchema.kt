// kotlinx.serialization mirror of tokens/semantic/semantic.tokens.json (DTCG shape).
//
// Every leaf in the JSON is { "$type": "...", "$value": ... }; we decode only
// $value into a typed token (the contract gate — pnpm tokens:validate —
// enforces $type elsewhere). Collections that vary in size (42 color groups,
// elevation levels 0-5, easing curves, opacity steps) decode as Map<String, …>.

package com.laneshadow.theme

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
data class ColorTokenDto(@SerialName("\$value") val value: String)

@Serializable
data class DimensionTokenDto(@SerialName("\$value") val value: Double)

@Serializable
data class StringTokenDto(@SerialName("\$value") val value: String)

@Serializable
data class NumberTokenDto(@SerialName("\$value") val value: Double)

@Serializable
data class EasingTokenDto(@SerialName("\$value") val value: List<Double>)

@Serializable
data class ColorStatesDefDto(
    @SerialName("default") val defaultColor: ColorTokenDto,
    val hover: ColorTokenDto? = null,
    val pressed: ColorTokenDto? = null,
    val disabled: ColorTokenDto? = null,
    val focus: ColorTokenDto? = null,
    val muted: ColorTokenDto? = null,
    val subtle: ColorTokenDto? = null,
)

@Serializable
data class ColorModesDto(
    val light: Map<String, ColorStatesDefDto>,
    val dark: Map<String, ColorStatesDefDto>,
)

@Serializable
data class TypeStyleDefDto(
    val fontSize: DimensionTokenDto,
    val lineHeight: DimensionTokenDto,
    val fontWeight: StringTokenDto,
)

@Serializable
data class TypeVariantsDto(
    val sm: TypeStyleDefDto,
    val md: TypeStyleDefDto,
    val lg: TypeStyleDefDto,
)

@Serializable
data class TypeScaleDto(
    val label: TypeVariantsDto,
    val body: TypeVariantsDto,
    val title: TypeVariantsDto,
    val heading: TypeVariantsDto,
    val display: TypeVariantsDto,
)

@Serializable
data class ShadowOffsetDto(
    val width: DimensionTokenDto,
    val height: DimensionTokenDto,
)

@Serializable
data class ElevationDefDto(
    val shadowColor: StringTokenDto,
    val shadowOffset: ShadowOffsetDto,
    val shadowOpacity: DimensionTokenDto,
    val shadowRadius: DimensionTokenDto,
    val elevation: DimensionTokenDto,
)

@Serializable
data class ElevationModesDto(
    val light: Map<String, ElevationDefDto>,
    val dark: Map<String, ElevationDefDto>,
)

@Serializable
data class MotionRecipeDto(
    val duration: JsonElement?,
    val easing: JsonElement?,
    val iteration: String? = null,
)

@Serializable
data class MotionDto(
    val duration: Map<String, DimensionTokenDto>,
    val delay: Map<String, DimensionTokenDto>? = null,
    val scale: Map<String, DimensionTokenDto>? = null,
    val easing: Map<String, EasingTokenDto>,
    val recipes: Map<String, MotionRecipeDto>? = null,
)

@Serializable
data class SemanticTokens(
    val color: ColorModesDto,
    val space: Map<String, DimensionTokenDto>,
    val radius: Map<String, DimensionTokenDto>,
    val type: TypeScaleDto,
    val elevation: ElevationModesDto,
    val motion: MotionDto,
    val opacity: Map<String, NumberTokenDto>,
)

@Serializable
data class ThemeTokensFileDto(val semantic: SemanticTokens)
