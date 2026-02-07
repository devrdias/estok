import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useTheme } from '@/shared/config';

const VIEWBOX = 48;

/**
 * Balanço logo: stacked blocks. Respects light/dark theme.
 */
export interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function Logo({
  size = 48,
  showWordmark = false,
  style,
  accessibilityLabel = 'Balanço',
}: LogoProps) {
  const theme = useTheme();
  const scale = size / VIEWBOX;

  return (
    <View
      style={[styles.wrapper, showWordmark && styles.row, style]}
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} fill="none">
        <Rect x={10} y={28} width={28} height={12} rx={3} fill={theme.colors.primary} />
        <Rect x={12} y={18} width={24} height={12} rx={3} fill={theme.colors.primary} />
        <Rect x={14} y={8} width={20} height={12} rx={3} fill={theme.colors.secondary} />
      </Svg>
      {showWordmark && (
        <Text style={[styles.wordmark, { fontSize: Math.round(22 * scale), color: theme.colors.text }]}>
          Balanço
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wordmark: { fontFamily: 'System', fontWeight: '700' },
});
