import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTheme } from '@/shared/config';
import type { Theme } from '@/shared/config/theme';

// ─── Public types ────────────────────────────────────────────

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

// ─── Context ─────────────────────────────────────────────────

interface AlertContextValue {
  /** Show a themed alert dialog. Same mental model as `Alert.alert`. */
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
}

const AlertContext = React.createContext<AlertContextValue | null>(null);

/**
 * Imperative hook to show a cross-platform themed alert dialog.
 *
 * @example
 * ```tsx
 * const { showAlert } = useAlert();
 *
 * showAlert('Confirm', 'Are you sure?', [
 *   { text: 'Cancel', style: 'cancel' },
 *   { text: 'OK', onPress: () => doSomething() },
 * ]);
 * ```
 */
export function useAlert(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used within AlertProvider');
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────

interface AlertProviderProps {
  children: React.ReactNode;
}

/**
 * Provides a themed alert dialog that works on iOS, Android, and Web.
 * Wrap your app root with this provider, then call `useAlert().showAlert(…)`.
 */
export function AlertProvider({ children }: AlertProviderProps) {
  const [alert, setAlert] = useState<AlertOptions | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 20,
        stiffness: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const animateOut = useCallback(
    (onDone: () => void) => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(onDone);
    },
    [fadeAnim, scaleAnim],
  );

  const showAlert = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      // Reset animation values before showing
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      setAlert({ title, message, buttons });
    },
    [fadeAnim, scaleAnim],
  );

  const handleDismiss = useCallback(
    (button?: AlertButton) => {
      animateOut(() => {
        setAlert(null);
        button?.onPress?.();
      });
    },
    [animateOut],
  );

  const contextValue = useMemo<AlertContextValue>(
    () => ({ showAlert }),
    [showAlert],
  );

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      {alert && (
        <AlertDialogModal
          alert={alert}
          fadeAnim={fadeAnim}
          scaleAnim={scaleAnim}
          onDismiss={handleDismiss}
          onShow={animateIn}
        />
      )}
    </AlertContext.Provider>
  );
}

// ─── Modal presentation ──────────────────────────────────────

interface AlertDialogModalProps {
  alert: AlertOptions;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  onDismiss: (button?: AlertButton) => void;
  onShow: () => void;
}

function AlertDialogModal({
  alert,
  fadeAnim,
  scaleAnim,
  onDismiss,
  onShow,
}: AlertDialogModalProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const buttons: AlertButton[] =
    alert.buttons && alert.buttons.length > 0
      ? alert.buttons
      : [{ text: 'OK', style: 'default' }];

  const cancelButton = buttons.find((b) => b.style === 'cancel');
  const actionButtons = buttons.filter((b) => b.style !== 'cancel');

  // Put cancel on the left, actions on the right (iOS convention)
  const orderedButtons = cancelButton
    ? [cancelButton, ...actionButtons]
    : actionButtons;

  return (
    <Modal
      transparent
      animationType="none"
      visible
      onShow={onShow}
      statusBarTranslucent
      onRequestClose={() => onDismiss(cancelButton)}
    >
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable
          style={styles.backdropPress}
          onPress={() => onDismiss(cancelButton)}
        />
      </Animated.View>

      <View style={styles.centeredContainer} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.dialog,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Title */}
          <Text style={styles.title}>{alert.title}</Text>

          {/* Message */}
          {alert.message ? (
            <Text style={styles.message}>{alert.message}</Text>
          ) : null}

          {/* Buttons */}
          <View
            style={[
              styles.buttonRow,
              orderedButtons.length === 1 && styles.buttonRowSingle,
            ]}
          >
            {orderedButtons.map((btn, idx) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';

              return (
                <Pressable
                  key={`${btn.text}-${idx}`}
                  style={({ pressed }) => [
                    styles.button,
                    isCancel && styles.buttonCancel,
                    !isCancel && !isDestructive && styles.buttonPrimary,
                    isDestructive && styles.buttonDestructive,
                    pressed && styles.buttonPressed,
                    orderedButtons.length > 1 && { flex: 1 },
                  ]}
                  onPress={() => onDismiss(btn)}
                  accessibilityRole="button"
                  accessibilityLabel={btn.text}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isCancel && styles.buttonTextCancel,
                      isDestructive && styles.buttonTextDestructive,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    backdropPress: {
      flex: 1,
    },
    centeredContainer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },

    dialog: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.lg,
      ...theme.shadows.lg,
    },

    title: {
      ...theme.typography.titleSmall,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    message: {
      ...theme.typography.body,
      color: theme.colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: theme.spacing.lg,
    },

    buttonRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    buttonRowSingle: {
      justifyContent: 'center',
    },

    button: {
      minHeight: theme.minTouchSize,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: 12,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonPrimary: {
      backgroundColor: theme.colors.cta,
    },
    buttonCancel: {
      backgroundColor: theme.colors.borderLight,
    },
    buttonDestructive: {
      backgroundColor: theme.colors.danger,
    },
    buttonPressed: {
      opacity: 0.85,
    },

    buttonText: {
      ...theme.typography.body,
      fontWeight: '600',
      color: theme.colors.white,
    },
    buttonTextCancel: {
      color: theme.colors.text,
    },
    buttonTextDestructive: {
      color: theme.colors.white,
    },
  });
}
