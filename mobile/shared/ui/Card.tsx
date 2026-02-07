import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../config/theme';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Themed card: background, radius, padding, shadow (design-system).
 */
export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.md,
  },
});
