import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/shared/config';

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string = string> {
  /** Available options to display as segments. */
  options: readonly SegmentedControlOption<T>[];
  /** Currently selected value. */
  selectedValue: T;
  /** Called when the user selects a segment. */
  onSelect: (value: T) => void;
  /** Whether the control is disabled (reduces opacity, blocks interaction). */
  disabled?: boolean;
  /** Optional style override for the outer container. */
  style?: ViewStyle;
  /** Accessibility label for the entire control group. */
  accessibilityLabel?: string;
}

/**
 * Themed segmented control (pill-style toggle).
 * Renders horizontally; the active segment is highlighted with the CTA color.
 * Respects light/dark theme and enforces minimum touch targets.
 *
 * @example
 * ```tsx
 * <SegmentedControl
 *   options={[{ value: 'pt', label: 'PT' }, { value: 'en', label: 'EN' }]}
 *   selectedValue={language}
 *   onSelect={setLanguage}
 * />
 * ```
 */
export function SegmentedControl<T extends string = string>({
  options,
  selectedValue,
  onSelect,
  disabled = false,
  style,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const theme = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          backgroundColor: theme.colors.border + '40',
          borderRadius: theme.radius.md,
          padding: 3,
        },
        segment: {
          flex: 1,
          minHeight: 38,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: theme.radius.md - 2,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
        },
        segmentActive: {
          backgroundColor: theme.colors.cta,
          ...theme.shadows.sm,
        },
        segmentPressed: {
          opacity: 0.8,
        },
        label: {
          ...theme.typography.bodySmall,
          fontWeight: '500',
          color: theme.colors.textMuted,
        },
        labelActive: {
          color: theme.colors.white,
          fontWeight: '600',
        },
        disabled: {
          opacity: 0.45,
        },
      }),
    [theme],
  );

  return (
    <View
      style={[styles.container, disabled && styles.disabled, style]}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const isActive = option.value === selectedValue;
        return (
          <Pressable
            key={option.value}
            style={({ pressed }) => [
              styles.segment,
              isActive && styles.segmentActive,
              pressed && !isActive && styles.segmentPressed,
            ]}
            onPress={() => !disabled && onSelect(option.value)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: isActive, disabled }}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
