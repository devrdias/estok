import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { useTheme } from '@/shared/config';

const VIEWBOX = 48;

/**
 * e-stok brand logo: isometric cube representing inventory/stock.
 * Uses brand colors (indigo/blue/cyan) for the 3D cube faces.
 *
 * @example
 * ```tsx
 * <Logo size={48} />
 * <Logo size={64} showWordmark />
 * ```
 */
export interface LogoProps {
  /** Icon size in pixels (width & height) */
  size?: number;
  /** Show the "e-stok" wordmark next to the cube */
  showWordmark?: boolean;
  /** Custom container style */
  style?: ViewStyle;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
}

/** Brand colors for the isometric cube faces */
const CUBE_COLORS = {
  top: '#93C5FD',    // Blue-300 (lightest face, facing "light")
  right: '#3B82F6',  // Blue-500 (medium face)
  left: '#4338CA',   // Indigo-700 (darkest face)
} as const;

/**
 * Isometric cube vertices for a 48×48 viewBox.
 * Cube is centered at (24, 24) with scale factor 12.
 */
const CUBE_FACES = {
  top: '24,12 34.4,18 24,24 13.6,18',
  left: '13.6,18 24,24 24,36 13.6,30',
  right: '24,24 34.4,18 34.4,30 24,36',
} as const;

export function Logo({
  size = 48,
  showWordmark = false,
  style,
  accessibilityLabel = 'e-stok',
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
        <Polygon points={CUBE_FACES.left} fill={CUBE_COLORS.left} />
        <Polygon points={CUBE_FACES.right} fill={CUBE_COLORS.right} />
        <Polygon points={CUBE_FACES.top} fill={CUBE_COLORS.top} />
      </Svg>
      {showWordmark && (
        <Text style={[styles.wordmark, { fontSize: Math.round(22 * scale), color: theme.colors.text }]}>
          e-stok
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
