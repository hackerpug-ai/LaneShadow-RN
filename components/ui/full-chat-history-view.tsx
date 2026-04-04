import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
} from 'react-native';
import { IconSymbol } from './icon-symbol';
import { useSemanticTheme } from '../../hooks/use-semantic-theme';
import { RouteAttachmentCard } from './route-attachment-card';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export interface ChatMessage {
  id: string;
  role: 'rider' | 'agent';
  content: string;
  timestamp: Date;
  routeAttachments?: RouteAttachmentProps[];
}

interface RouteAttachmentProps {
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

interface FullChatHistoryViewProps {
  visible: boolean;
  messages: ChatMessage[];
  onCollapse: () => void;
  onRoutePress?: (routeId: string, messageId: string) => void;
  onSend?: (message: string) => void;
  currentInput?: string;
}

export const FullChatHistoryView: React.FC<FullChatHistoryViewProps> = ({
  visible,
  messages,
  onCollapse,
  onRoutePress,
  currentInput = '',
}) => {
  const { semantic } = useSemanticTheme();

  if (!visible) return null;

  const formatTime = (date: Date) => {
    const now = new Date();
    const msgDate = new Date(date);
    const diffMs = now.getTime() - msgDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return msgDate.toLocaleDateString();
  };

  return (
    <View style={[styles.container, { backgroundColor: semantic.color.background.default }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: semantic.color.border.default },
        ]}
      >
        <Text style={[styles.headerTitle, { color: semantic.color.onSurface.default }]}>
          Chat History
        </Text>
        <Pressable
          onPress={onCollapse}
          accessibilityLabel="Collapse chat"
          accessibilityRole="button"
        >
          {({ pressed }) => (
            <View style={[styles.collapseButton, { backgroundColor: pressed ? semantic.color.surfaceVariant.pressed : 'transparent' }]}>
              <IconSymbol
                name="chevron-up"
                size={24}
                color={semantic.color.onSurface.muted}
              />
              <Text
                style={[styles.collapseText, { color: semantic.color.onSurface.muted }]}
              >
                Collapse
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Messages */}
      <ScrollView
        style={styles.messagesList}
        contentContainerStyle={styles.messagesListContent}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.role === 'rider' ? styles.riderMessage : styles.agentMessage,
            ]}
          >
            {/* Message header */}
            <View style={styles.messageHeader}>
              <Text
                style={[
                  styles.messageRole,
                  {
                    color:
                      message.role === 'rider'
                        ? semantic.color.primary.default
                        : semantic.color.onSurface.muted,
                  },
                ]}
              >
                {message.role === 'rider' ? 'Rider' : '🤖 Agent'}
              </Text>
              <Text
                style={[styles.messageTime, { color: semantic.color.onSurface.subtle }]}
              >
                {formatTime(message.timestamp)}
              </Text>
            </View>

            {/* Message content */}
            <View
              style={[
                styles.messageBubble,
                {
                  backgroundColor:
                    message.role === 'rider'
                      ? semantic.color.surfaceVariant.default
                      : 'transparent',
                  borderColor:
                    message.role === 'rider'
                      ? semantic.color.border.default
                      : 'transparent',
                },
              ]}
            >
              <Text
                style={[styles.messageContent, { color: semantic.color.onSurface.muted }]}
              >
                {message.content}
              </Text>

              {/* Route attachments */}
              {message.routeAttachments && message.routeAttachments.length > 0 && (
                <View style={styles.attachments}>
                  {message.routeAttachments.map((route) => (
                    <RouteAttachmentCard
                      key={route.id}
                      {...route}
                      onPress={() => onRoutePress?.(route.id, message.id)}
                      compact={false}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}

        {currentInput && (
          <View style={[styles.messageContainer, styles.riderMessage]}>
            <View
              style={[
                styles.messageBubble,
                {
                  backgroundColor: semantic.color.surfaceVariant.default,
                  borderColor: semantic.color.border.default,
                },
              ]}
            >
              <Text
                style={[
                  styles.messageContent,
                  { color: semantic.color.onSurface.muted },
                ]}
              >
                {currentInput}
              </Text>
              <Text
                style={[
                  styles.sendingIndicator,
                  { color: semantic.color.onSurface.subtle },
                ]}
              >
                Sending...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.7,
    borderBottomWidth: 1,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  collapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  collapseText: {
    fontSize: 15,
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    padding: 16,
    gap: 20,
  },
  messageContainer: {
    width: '100%',
  },
  riderMessage: {
    alignItems: 'flex-end',
  },
  agentMessage: {
    alignItems: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  messageRole: {
    fontSize: 13,
    fontWeight: '700',
  },
  messageTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 14,
    maxWidth: '85%',
    gap: 10,
    borderWidth: 1,
  },
  messageContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  attachments: {
    gap: 12,
  },
  sendingIndicator: {
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: '500',
  },
});
