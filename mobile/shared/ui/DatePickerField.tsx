import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/shared/config';
import { isoToDisplayDate } from '@/shared/config';

export interface DatePickerFieldProps {
  /** Current value: ISO date string (YYYY-MM-DD) or empty. */
  value: string;
  /** Called with ISO date string (YYYY-MM-DD) when user selects a date. */
  onChange: (isoDate: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  /** Optional style for the trigger container (e.g. flex: 1 for filters). */
  style?: object;
}

/**
 * Date field that opens the native calendar/date picker on press.
 * Uses @react-native-community/datetimepicker; theme-aware.
 */
export function DatePickerField({
  value,
  onChange,
  placeholder = '',
  accessibilityLabel,
  style,
}: DatePickerFieldProps) {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const pickerValue = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, (m ?? 1) - 1, d ?? 1);
    }
    return new Date();
  }, [value]);

  const displayText = value ? isoToDisplayDate(value) : '';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        trigger: {
          flex: 1,
          minWidth: 0,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.sm,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.sm,
          minHeight: theme.minTouchSize,
          justifyContent: 'center',
        },
        triggerText: {
          ...theme.typography.bodySmall,
          color: theme.colors.text,
        },
        placeholder: {
          ...theme.typography.bodySmall,
          color: theme.colors.textMuted,
        },
        modalOverlay: {
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.4)',
        },
        modalContent: {
          backgroundColor: theme.colors.backgroundCard,
          borderTopLeftRadius: theme.radius.xl,
          borderTopRightRadius: theme.radius.xl,
          paddingBottom: theme.spacing.lg,
        },
        doneRow: {
          flexDirection: 'row',
          justifyContent: 'flex-end',
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        doneButton: {
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
        },
        doneText: {
          ...theme.typography.body,
          fontWeight: '600',
          color: theme.colors.primary,
        },
      }),
    [theme]
  );

  const handlePickerChange = (
    event: { type: string },
    selectedDate: Date | undefined
  ) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'set' && selectedDate) {
      onChange(selectedDate.toISOString().slice(0, 10));
    }
  };

  const handleDone = () => {
    setShowPicker(false);
  };

  return (
    <>
      <Pressable
        style={[styles.trigger, style]}
        onPress={() => setShowPicker(true)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? placeholder}
      >
        <Text style={displayText ? styles.triggerText : styles.placeholder} numberOfLines={1}>
          {displayText || placeholder}
        </Text>
      </Pressable>

      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="calendar"
          onChange={handlePickerChange}
        />
      )}

      {showPicker && Platform.OS === 'ios' && (
        <Modal visible transparent animationType="slide">
          <Pressable style={styles.modalOverlay} onPress={handleDone}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.doneRow}>
                <Pressable
                  onPress={handleDone}
                  style={styles.doneButton}
                  accessibilityRole="button"
                  accessibilityLabel="Concluído"
                >
                  <Text style={styles.doneText}>Concluído</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={pickerValue}
                mode="date"
                display="spinner"
                onChange={handlePickerChange}
                locale="pt-BR"
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {showPicker && Platform.OS === 'web' && (
        <Modal visible transparent animationType="slide">
          <Pressable style={styles.modalOverlay} onPress={handleDone}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.doneRow}>
                <Pressable onPress={handleDone} style={styles.doneButton} accessibilityRole="button">
                  <Text style={styles.doneText}>Concluído</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={pickerValue}
                mode="date"
                onChange={handlePickerChange}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}
