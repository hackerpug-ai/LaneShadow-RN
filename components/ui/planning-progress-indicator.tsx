import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { useSemanticTheme } from '../../hooks/use-semantic-theme';

export type ProgressStep =
  | 'reading'
  | 'finding'
  | 'weather'
  | 'building'
  | 'complete';

interface ProgressStepConfig {
  id: ProgressStep;
  label: string;
  icon: string;
}

const PROGRESS_STEPS: ProgressStepConfig[] = [
  { id: 'reading', label: 'Reading your ride...', icon: '📖' },
  { id: 'finding', label: 'Finding scenic roads...', icon: '🛣️' },
  { id: 'weather', label: 'Checking weather...', icon: '🌤️' },
  { id: 'building', label: 'Building options...', icon: '⚙️' },
];

interface PlanningProgressIndicatorProps {
  currentStep: ProgressStep;
  visible?: boolean;
}

export const PlanningProgressIndicator: React.FC<
  PlanningProgressIndicatorProps
> = ({ currentStep, visible = true }) => {
  const { semantic } = useSemanticTheme();

  if (!visible || currentStep === 'complete') return null;

  const currentIndex = PROGRESS_STEPS.findIndex((s) => s.id === currentStep);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: semantic.color.card.default,
          borderColor: semantic.color.border.default,
          ...semantic.elevation[2],
        },
      ]}
    >
      {PROGRESS_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;

        return (
          <View key={step.id} style={styles.step}>
            {/* Icon */}
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isCompleted
                    ? semantic.color.success.default + '25'
                    : isCurrent
                      ? semantic.color.primary.default + '25'
                      : semantic.color.surfaceVariant.default,
                  borderColor: isCompleted
                    ? semantic.color.success.default
                    : isCurrent
                      ? semantic.color.primary.default
                      : semantic.color.border.default,
                },
              ]}
            >
              {isCurrent ? (
                <ActivityIndicator size="small" color={semantic.color.primary.default} />
              ) : (
                <Text style={styles.icon}>{step.icon}</Text>
              )}
              {isCurrent && (
                <View style={[styles.activeDot, { backgroundColor: semantic.color.primary.default }]} />
              )}
            </View>

            {/* Label */}
            <Text
              style={[
                styles.label,
                {
                  color: isCompleted
                    ? semantic.color.success.default
                    : isCurrent
                      ? semantic.color.onSurface.default
                      : semantic.color.onSurface.subtle,
                  opacity: isPending ? 0.6 : 1,
                  fontWeight: isCurrent ? '700' : '600',
                },
              ]}
            >
              {step.label}
            </Text>

            {/* Connector */}
            {index < PROGRESS_STEPS.length - 1 && (
              <View
                style={[
                  styles.connector,
                  {
                    backgroundColor: isCompleted
                      ? semantic.color.success.default + '60'
                      : semantic.color.border.default,
                  },
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    gap: 8,
    borderWidth: 1,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
    borderWidth: 2,
  },
  icon: {
    fontSize: 18,
  },
  activeDot: {
    position: 'absolute',
    bottom: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  connector: {
    position: 'absolute',
    top: 22,
    left: '50%',
    width: '100%',
    height: 2,
    zIndex: -1,
  },
});
