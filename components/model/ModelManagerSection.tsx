/**
 * Model Manager Section
 *
 * A settings screen component for managing the downloaded AI model.
 * Shows current model status, version info, and provides actions
 * for updates or deletion.
 *
 * Design: Card-based layout with subtle gradients and clear action hierarchy
 */

import React from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { Text, Card, Button, IconButton } from 'react-native-paper'
import { formatBytes } from './formatters'

interface ModelMetadata {
  version: string
  checksum: string
  downloadDate: number
  sizeBytes: number
  lastValidated: number
}

interface ModelManagerSectionProps {
  modelMetadata: ModelMetadata | null
  isModelValid: boolean
  onUpdateAvailable?: () => void
  onDeleteModel?: () => void
  onValidateModel?: () => void
  updateAvailable?: boolean
}

/**
 * Model management section for settings
 */
export const ModelManagerSection: React.FC<ModelManagerSectionProps> = ({
  modelMetadata,
  isModelValid,
  onUpdateAvailable,
  onDeleteModel,
  onValidateModel,
  updateAvailable = false,
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusColor = () => {
    if (!isModelValid) return '#EF4444'
    if (updateAvailable) return '#F59E0B'
    return '#10B981'
  }

  const getStatusText = () => {
    if (!isModelValid) return 'Corrupted'
    if (updateAvailable) return 'Update Available'
    return 'Active'
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your Shadow</Text>

      {/* Status Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Status</Text>
              <View style={styles.statusBadge}>
                <View
                  style={[styles.statusDot, { backgroundColor: getStatusColor() }]}
                />
                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
              </View>
            </View>

            {isModelValid && (
              <IconButton
                icon="check-circle"
                size={24}
                iconColor="#10B981"
                style={styles.statusIcon}
              />
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Model Info Card */}
      {modelMetadata && (
        <Card style={styles.card}>
          <Card.Title title="Model Information" />
          <Card.Content>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>{modelMetadata.version}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Size</Text>
              <Text style={styles.infoValue}>
                {formatBytes(modelMetadata.sizeBytes)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Downloaded</Text>
              <Text style={styles.infoValue}>
                {formatDate(modelMetadata.downloadDate)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Validated</Text>
              <Text style={styles.infoValue}>
                {formatDate(modelMetadata.lastValidated)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Checksum</Text>
              <Text style={styles.checksumValue} numberOfLines={1}>
                {modelMetadata.checksum.slice(0, 16)}...
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Actions Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.actionsContainer}>
            {updateAvailable && onUpdateAvailable && (
              <Button
                mode="contained"
                onPress={onUpdateAvailable}
                icon="update"
                style={styles.updateButton}
                contentStyle={styles.buttonContent}
              >
                Update Model
              </Button>
            )}

            {onValidateModel && (
              <Button
                mode="outlined"
                onPress={onValidateModel}
                icon="check"
                style={styles.validateButton}
                contentStyle={styles.buttonContent}
              >
                Validate Model
              </Button>
            )}

            {onDeleteModel && (
              <Button
                mode="text"
                onPress={onDeleteModel}
                icon="delete"
                textColor="#EF4444"
                style={styles.deleteButton}
              >
                Delete Model
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Info Card */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <View style={styles.infoHeader}>
            <IconButton icon="information-outline" size={20} />
            <Text style={styles.infoTitle}>About your AI Companion</Text>
          </View>
          <Text style={styles.infoText}>
            Your AI Companion is a local model that powers ride planning features.
            It runs entirely on your device — no data is sent to the cloud.
          </Text>
          <Text style={styles.infoText}>
            The model is approximately 400MB and requires periodic updates for
            improved performance.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F3F4F6',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
    gap: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusIcon: {
    margin: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#F3F4F6',
    fontWeight: '600',
  },
  checksumValue: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  actionsContainer: {
    gap: 12,
  },
  updateButton: {
    backgroundColor: '#F59E0B',
  },
  validateButton: {
    borderColor: '#374151',
  },
  deleteButton: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  infoCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  infoText: {
    fontSize: 13,
    color: '#D1D5DB',
    lineHeight: 20,
    marginBottom: 8,
  },
})
