import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  GestureResponderEvent,
  Pressable,
} from 'react-native';
import { IconSymbol } from './icon-symbol';
import { useSemanticTheme } from '../../hooks/use-semantic-theme';

interface NewSessionButtonProps {
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  variant?: 'header' | 'fab' | 'text';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const NewSessionButton: React.FC<NewSessionButtonProps> = ({
  onPress,
  disabled = false,
  variant = 'header',
  label = 'Session',
  size = 'md',
}) => {
  const { semantic } = useSemanticTheme();

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return { iconSize: 20 as const, fontSize: 13 as const, padding: 4 };
      case 'lg':
        return { iconSize: 28 as const, fontSize: 16 as const, padding: 8 };
      default:
        return { iconSize: 24 as const, fontSize: 14 as const, padding: 6 };
    }
  };

  const { iconSize, fontSize, padding } = getSizeStyle();

  if (variant === 'fab') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel="New session"
        accessibilityRole="button"
      >
        {({ pressed }) => (
          <View
            style={[
              styles.fab,
              {
                backgroundColor: disabled
                  ? semantic.color.surfaceVariant.default
                  : pressed
                    ? semantic.color.primary.pressed
                    : semantic.color.primary.default,
                width: size === 'sm' ? 48 : size === 'lg' ? 64 : 56,
                height: size === 'sm' ? 48 : size === 'lg' ? 64 : 56,
                borderRadius: size === 'sm' ? 24 : size === 'lg' ? 32 : 28,
                opacity: disabled ? 0.5 : 1,
                ...semantic.elevation[4],
              },
            ]}
          >
            <IconSymbol
              name="plus"
              size={iconSize}
              color={disabled ? semantic.color.onSurface.subtle : semantic.color.onPrimary.default}
            />
          </View>
        )}
      </Pressable>
    );
  }

  if (variant === 'text') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel={`New ${label}`}
        accessibilityRole="button"
      >
        {({ pressed }) => (
          <View style={[styles.textButton, { padding, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }]}>
            <IconSymbol
              name="plus-circle-outline"
              size={iconSize}
              color={disabled ? semantic.color.onSurface.subtle : semantic.color.primary.default}
            />
            <Text
              style={[
                styles.text,
                {
                  color: disabled ? semantic.color.onSurface.subtle : semantic.color.primary.default,
                  fontSize,
                },
              ]}
            >
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    );
  }

  // Header variant (default)
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={`New ${label}`}
      accessibilityRole="button"
    >
      {({ pressed }) => (
        <View style={[styles.headerButton, { padding, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }]}>
          <IconSymbol
            name="plus-circle-outline"
            size={iconSize}
            color={disabled ? semantic.color.onSurface.subtle : semantic.color.primary.default}
          />
          <Text
            style={[
              styles.headerButtonText,
              {
                color: semantic.color.onSurface.muted,
                fontSize,
              },
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerButtonText: {
    fontWeight: '600',
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
