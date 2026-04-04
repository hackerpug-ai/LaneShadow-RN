import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { IconSymbol, type IconName } from './icon-symbol';
import { useSemanticTheme } from '../../hooks/use-semantic-theme';
import { SuggestionChips, type SuggestionChip } from './suggestion-chips';

interface SuggestionChip {
  id: string;
  label: string;
  icon: IconName;
}

const DEFAULT_SUGGESTIONS: SuggestionChip[] = [
  { id: '1', label: '2-hour loop', icon: 'clock-outline' },
  { id: '2', label: 'scenic coastal', icon: 'water-outline' },
  { id: '3', label: 'avoid highways', icon: 'bicycle' },
];

interface ChatInputBarProps {
  onSend: (message: string) => void;
  placeholder?: string;
  locationContext?: string;
  maxLength?: number;
  disabled?: boolean;
  suggestions?: SuggestionChip[];
  showSuggestions?: boolean;
  onManualModePress?: () => void;
  onNewSessionPress?: () => void;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSend,
  placeholder = 'Describe your ride...',
  locationContext = 'Near Current Location',
  maxLength = 500,
  disabled = false,
  suggestions = DEFAULT_SUGGESTIONS,
  showSuggestions = true,
  onManualModePress,
  onNewSessionPress,
}) => {
  const [message, setMessage] = useState('');
  const { semantic } = useSemanticTheme();

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleSuggestionPress = (suggestion: SuggestionChip) => {
    if (!disabled) {
      onSend(suggestion.label);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { borderTopColor: semantic.color.border.default }]}
    >
      {/* Top bar with session actions */}
      <View
        style={[
          styles.topBar,
          { backgroundColor: semantic.color.surface.default },
        ]}
      >
        {onNewSessionPress && (
          <TouchableOpacity
            style={styles.topBarButton}
            onPress={onNewSessionPress}
            accessibilityLabel="New session"
            accessibilityRole="button"
          >
            <IconSymbol
              name="plus-circle-outline"
              size={24}
              color={semantic.color.primary.default}
            />
            <Text
              style={[
                styles.topBarText,
                { color: semantic.color.onSurface.muted },
              ]}
            >
              Session
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.locationContainer}>
          <IconSymbol
            name="map-marker-outline"
            size={16}
            color={semantic.color.onSurface.subtle}
          />
          <Text
            style={[styles.locationText, { color: semantic.color.onSurface.subtle }]}
          >
            {locationContext}
          </Text>
        </View>

        {onManualModePress && (
          <TouchableOpacity
            style={styles.topBarButton}
            onPress={onManualModePress}
            accessibilityLabel="Manual mode"
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.topBarText,
                { color: semantic.color.onSurface.muted },
              ]}
            >
              Manual
            </Text>
            <IconSymbol
              name="swap-horizontal"
              size={20}
              color={semantic.color.primary.default}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestion chips - using shared component */}
      {showSuggestions && !message && (
        <SuggestionChips
          suggestions={suggestions}
          onPress={handleSuggestionPress}
          disabled={disabled}
          horizontal={false}
        />
      )}

      {/* Input bar with glassmorphic effect */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: semantic.color.background.default,
            ...semantic.elevation[3],
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              color: semantic.color.onSurface.default,
              backgroundColor: semantic.color.surfaceVariant.default,
              borderColor: semantic.color.border.default,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={semantic.color.onSurface.subtle}
          value={message}
          onChangeText={setMessage}
          maxLength={maxLength}
          multiline
          editable={!disabled}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: message.trim()
                ? semantic.color.primary.default
                : semantic.color.surfaceVariant.default,
              borderColor: message.trim()
                ? 'transparent'
                : semantic.color.border.default,
            },
          ]}
          onPress={handleSend}
          disabled={!message.trim() || disabled}
          accessibilityLabel="Send message"
          accessibilityRole="button"
        >
          <IconSymbol
            name="send"
            size={20}
            color={
              message.trim()
                ? semantic.color.onPrimary.default
                : semantic.color.onSurface.subtle
            }
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
    gap: 8,
  },
  topBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    minHeight: 36, // Ensure minimum touch target
  },
  topBarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
