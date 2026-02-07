import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { theme } from '../config/theme';

export interface ButtonProps {
  onPress: () => void;
  children: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
  fullWidth?: boolean;
}

/**
 * Themed button. Min touch 44px, design-system colors (CTA primary, outline secondary).
 */
export function Button({
  onPress,
  children,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
  fullWidth,
}: ButtonProps) {
  const isOutline = variant === 'outline' || variant === 'secondary';
  const isDanger = variant === 'danger';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        (pressed || disabled) && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? children}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isOutline ? theme.colors.primary : theme.colors.white} />
      ) : (
        <Text style={[styles.text, isOutline && styles.textOutline, isDanger && styles.textDanger]}>{children}</Text>
      )}
    </Pressable>
  );
}

const minH = theme.minTouchSize;
const paddingH = theme.spacing.lg;
const paddingV = 14;

const styles = StyleSheet.create({
  base: {
    minHeight: minH,
    paddingHorizontal: paddingH,
    paddingVertical: paddingV,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%', maxWidth: 280 },
  primary: { backgroundColor: theme.colors.cta },
  secondary: { backgroundColor: theme.colors.primary },
  outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.colors.primary },
  danger: { backgroundColor: theme.colors.danger },
  pressed: { opacity: 0.9 },
  text: { color: theme.colors.white, fontSize: 16, fontWeight: '600' },
  textOutline: { color: theme.colors.primary },
  textDanger: { color: theme.colors.white },
});
