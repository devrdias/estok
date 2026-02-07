import React, { useMemo } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/config';

type IoniconsName = keyof typeof Ionicons.glyphMap;

export interface IconButtonProps {
  onPress: () => void;
  icon: IoniconsName;
  label?: string;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'ghostDanger';
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
  size?: number;
}

/**
 * Compact icon button. Min touch 44px. Respects light/dark theme.
 */
export function IconButton({
  onPress,
  icon,
  label,
  variant = 'primary',
  disabled = false,
  accessibilityLabel,
  style,
  size = 22,
}: IconButtonProps) {
  const theme = useTheme();
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';
  const isGhostDanger = variant === 'ghostDanger';

  const iconColor = isGhostDanger
    ? theme.colors.danger
    : isOutline || isGhost
      ? theme.colors.cta
      : isDanger
        ? theme.colors.white
        : theme.colors.white;
  const labelColor = isGhostDanger ? theme.colors.danger : isOutline || isGhost ? theme.colors.cta : theme.colors.white;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: {
          minWidth: theme.minTouchSize,
          minHeight: theme.minTouchSize,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
          borderRadius: theme.radius.md,
        },
        primary: { backgroundColor: theme.colors.cta },
        outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.cta },
        ghost: { backgroundColor: 'transparent' },
        ghostDanger: { backgroundColor: 'transparent' },
        danger: { backgroundColor: theme.colors.danger },
        pressed: { opacity: 0.9 },
        label: { ...theme.typography.caption, fontWeight: '600' },
      }),
    [theme]
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant === 'ghostDanger' ? 'ghostDanger' : variant],
        (pressed || disabled) && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label ?? undefined}
    >
      <Ionicons name={icon} size={size} color={iconColor} />
      {label ? <Text style={[styles.label, { color: labelColor }]}>{label}</Text> : null}
    </Pressable>
  );
}
