import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { useSemanticTheme } from '../../hooks/use-semantic-theme';

export interface SuggestionChip {
  id: string;
  label: string;
  icon?: string; // Emoji icon
}

interface SuggestionChipsProps {
  suggestions: SuggestionChip[];
  onPress: (suggestion: SuggestionChip) => void;
  disabled?: boolean;
  horizontal?: boolean;
}

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({
  suggestions,
  onPress,
  disabled = false,
  horizontal = false,
}) => {
  const { semantic } = useSemanticTheme();

  const Container = horizontal ? ScrollView : View;
  const containerStyle = horizontal
    ? styles.horizontalContainer
    : styles.verticalContainer;

  return (
    <Container
      style={[containerStyle, { backgroundColor: semantic.color.surface.default }]}
      horizontal={horizontal}
      showsHorizontalScrollIndicator={false}
    >
      {suggestions.map((suggestion) => (
        <Pressable
          key={suggestion.id}
          onPress={() => onPress(suggestion)}
          disabled={disabled}
          accessibilityLabel={suggestion.label}
          accessibilityRole="button"
        >
          {({ pressed }) => (
            <View
              style={[
                styles.chip,
                {
                  backgroundColor: pressed
                    ? semantic.color.primary.pressed
                    : semantic.color.surfaceVariant.default,
                  borderColor: semantic.color.border.default,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
            >
              {suggestion.icon && (
                <Text style={[styles.chipIcon, { color: semantic.color.primary.default }]}>
                  {suggestion.icon}
                </Text>
              )}
              <Text style={[styles.chipText, { color: semantic.color.onSurface.muted }]}>
                {suggestion.label}
              </Text>
            </View>
          )}
        </Pressable>
      ))}
    </Container>
  );
};

const styles = StyleSheet.create({
  horizontalContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  verticalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    minHeight: 36, // Ensure minimum touch target
  },
  chipIcon: {
    fontSize: 14,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
