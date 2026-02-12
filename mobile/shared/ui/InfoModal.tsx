import React, { useMemo } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/config';

export interface InfoModalProps {
  /** Whether the modal is visible. */
  visible: boolean;
  /** Callback to close the modal. */
  onClose: () => void;
  /** Title displayed at the top. */
  title: string;
  /** Body text (main explanatory content). */
  body: string;
  /** Optional label for the dismiss button. Defaults to "OK". */
  dismissLabel?: string;
}

/**
 * Informational popup modal with title, body text, and a dismiss button.
 * Used as a contextual help overlay (e.g., triggered by a "?" icon).
 *
 * @example
 * ```tsx
 * <InfoModal
 *   visible={showHelp}
 *   onClose={() => setShowHelp(false)}
 *   title="Modalidade de contagem"
 *   body="Loja fechada: a contagem é realizada com a loja fechada..."
 * />
 * ```
 */
export function InfoModal({
  visible,
  onClose,
  title,
  body,
  dismissLabel = 'OK',
}: InfoModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: theme.spacing.lg,
        },
        card: {
          backgroundColor: theme.colors.backgroundCard,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
          width: '100%',
          maxWidth: 400,
          maxHeight: '80%',
          ...theme.shadows.lg,
        },
        title: {
          ...theme.typography.titleSmall,
          color: theme.colors.text,
          marginBottom: theme.spacing.md,
        },
        body: {
          ...theme.typography.body,
          color: theme.colors.text,
          lineHeight: 24,
        },
        scrollContent: {
          paddingBottom: theme.spacing.sm,
        },
        dismissButton: {
          minHeight: theme.minTouchSize,
          marginTop: theme.spacing.lg,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.cta,
          justifyContent: 'center',
          alignItems: 'center',
        },
        dismissText: {
          ...theme.typography.body,
          color: theme.colors.white,
          fontWeight: '600',
        },
      }),
    [theme]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        />
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.body}>{body}</Text>
          </ScrollView>
          <Pressable
            style={styles.dismissButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={dismissLabel}
          >
            <Text style={styles.dismissText}>{dismissLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
