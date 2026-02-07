import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/shared/config';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Themed card: background, radius, padding, shadow (design-system).
 * Respects light/dark theme.
 */
export function Card({ children, style }: CardProps) {
  const theme = useTheme();
  const cardStyle = useMemo(
    () => ({
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.md,
    }),
    [theme]
  );
  return <View style={[cardStyle, style]}>{children}</View>;
}
