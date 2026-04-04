import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { IconSymbol } from './icon-symbol';
import { useSemanticTheme } from '../../hooks/use-semantic-theme';
import { RouteAttachmentCard } from './route-attachment-card';

const SCREEN_WIDTH = Dimensions.get('window').width;

export interface RouteAttachment {
  id: string;
  label: string;
  description: string;
  distance: string;
  duration: string;
  scenicScore: number;
  weatherBadge?: {
    type: 'clear' | 'rain' | 'wind' | 'cloudy';
    text: string;
  };
  isBest?: boolean;
}

interface AgentMessageOverlayProps {
  message: string;
  routeAttachments?: RouteAttachment[];
  visible: boolean;
  onDismiss: () => void;
  onMinimize: () => void;
  onRoutePress?: (routeId: string) => void;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
}

export const AgentMessageOverlay: React.FC<AgentMessageOverlayProps> = ({
  message,
  routeAttachments = [],
  visible,
  onDismiss,
  onMinimize,
  onRoutePress,
  autoDismiss = true,
  autoDismissDelay = 5000,
}) => {
  const { semantic } = useSemanticTheme();
  const [pinned, setPinned] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      if (autoDismiss && !pinned) {
        const timer = setTimeout(() => {
          onDismiss();
        }, autoDismissDelay);
        return () => clearTimeout(timer);
      }
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(-20);
    }
  }, [visible, autoDismiss, autoDismissDelay, pinned, onDismiss]);

  const handlePin = () => {
    setPinned(!pinned);
  };

  const getWeatherIcon = (type: RouteAttachment['weatherBadge']['type']) => {
    switch (type) {
      case 'clear':
        return 'weather-sunny';
      case 'rain':
        return 'weather-rainy';
      case 'wind':
        return 'weather-windy';
      case 'cloudy':
        return 'weather-cloudy';
      default:
        return 'weather-partly-cloudy';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: semantic.color.card.default,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          maxWidth: SCREEN_WIDTH - 32,
          ...semantic.elevation[4],
          borderColor: semantic.color.border.default,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.agentIconContainer, { backgroundColor: semantic.color.primary.default + '20' }]}>
            <Text style={styles.agentIcon}>🤖</Text>
          </View>
          <Text style={[styles.headerText, { color: semantic.color.onSurface.default }]}>
            Agent Response
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerButton}
            onPress={handlePin}
            accessibilityLabel={pinned ? 'Unpin' : 'Pin'}
            accessibilityRole="button"
          >
            {({ pressed }) => (
              <View style={[styles.iconButton, { backgroundColor: pressed ? semantic.color.surfaceVariant.pressed : 'transparent' }]}>
                <IconSymbol
                  name={pinned ? 'pin' : 'pin-outline'}
                  size={20}
                  color={pinned ? semantic.color.primary.default : semantic.color.onSurface.subtle}
                />
              </View>
            )}
          </Pressable>
          <Pressable
            style={styles.headerButton}
            onPress={onMinimize}
            accessibilityLabel="Minimize"
            accessibilityRole="button"
          >
            {({ pressed }) => (
              <View style={[styles.iconButton, { backgroundColor: pressed ? semantic.color.surfaceVariant.pressed : 'transparent' }]}>
                <IconSymbol
                  name="chevron-down"
                  size={20}
                  color={semantic.color.onSurface.subtle}
                />
              </View>
            )}
          </Pressable>
          <Pressable
            style={styles.headerButton}
            onPress={onDismiss}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            {({ pressed }) => (
              <View style={[styles.iconButton, { backgroundColor: pressed ? semantic.color.surfaceVariant.pressed : 'transparent' }]}>
                <IconSymbol
                  name="close"
                  size={20}
                  color={semantic.color.onSurface.subtle}
                />
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Message */}
      <Text style={[styles.message, { color: semantic.color.onSurface.muted }]}>
        {message}
      </Text>

      {/* Route Attachments - using shared component */}
      {routeAttachments.length > 0 && (
        <View style={styles.attachments}>
          {routeAttachments.map((route) => (
            <RouteAttachmentCard
              key={route.id}
              {...route}
              onPress={() => onRoutePress?.(route.id)}
              compact={false}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  agentIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentIcon: {
    fontSize: 16,
  },
  headerText: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerButton: {
    padding: 4,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  attachments: {
    gap: 12,
  },
});
