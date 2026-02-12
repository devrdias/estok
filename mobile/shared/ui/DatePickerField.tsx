import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import DateTimePicker from 'react-native-ui-datepicker';
import type { DateType } from 'react-native-ui-datepicker';
import { useTheme } from '@/shared/config';
import { isoToDisplayDate } from '@/shared/config';

/** Format a DateType (dayjs-compatible) to YYYY-MM-DD string. */
function toIsoDate(date: DateType): string {
  if (!date) return '';
  const d = new Date(date as string | number | Date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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
 * Date field that opens a calendar modal on press. Theme-aware.
 *
 * Uses `react-native-ui-datepicker` — a pure-JS calendar component that works
 * on **Android, iOS, and Web** without platform-specific workarounds.
 *
 * @example
 * ```tsx
 * <DatePickerField
 *   value={filterDate}
 *   onChange={setFilterDate}
 *   placeholder="Selecione a data"
 * />
 * ```
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

  /** The date shown in the calendar. Falls back to today when value is empty. */
  const pickerDate: DateType = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    return undefined;
  }, [value]);

  const displayText = value ? isoToDisplayDate(value) : '';

  /** When a day is tapped, commit it immediately and close the modal. */
  const handleDateChange = useCallback(
    ({ date }: { date: DateType }) => {
      const iso = toIsoDate(date);
      if (iso) {
        onChange(iso);
        setShowPicker(false);
      }
    },
    [onChange]
  );

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
        headerRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        clearButton: {
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
        },
        clearText: {
          ...theme.typography.body,
          fontWeight: '600',
          color: theme.colors.danger ?? '#EF4444',
        },
        cancelButton: {
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
        },
        cancelText: {
          ...theme.typography.body,
          fontWeight: '600',
          color: theme.colors.textMuted,
        },
        calendarContainer: {
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.sm,
        },
      }),
    [theme]
  );

  /** Calendar style overrides that match the app theme. */
  const calendarStyles = useMemo(
    () => ({
      selected: { backgroundColor: theme.colors.primary },
      selected_label: { color: '#FFFFFF' },
      today: { borderColor: theme.colors.primary, borderWidth: 1 },
      today_label: { color: theme.colors.primary },
      day_label: { color: theme.colors.text },
      header: { color: theme.colors.text },
      month_label: { color: theme.colors.text, fontWeight: '600' as const },
      year_label: { color: theme.colors.text, fontWeight: '600' as const },
      weekday_label: { color: theme.colors.textMuted },
    }),
    [theme]
  );

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

      <Modal visible={showPicker} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {/* Header with Clear + Close actions */}
            <View style={styles.headerRow}>
              <Pressable
                onPress={() => {
                  onChange('');
                  setShowPicker(false);
                }}
                style={styles.clearButton}
                accessibilityRole="button"
                accessibilityLabel="Limpar data"
              >
                <Text style={styles.clearText}>Limpar</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowPicker(false)}
                style={styles.cancelButton}
                accessibilityRole="button"
                accessibilityLabel="Fechar"
              >
                <Text style={styles.cancelText}>Fechar</Text>
              </Pressable>
            </View>

            {/* Calendar */}
            <View style={styles.calendarContainer}>
              <DateTimePicker
                mode="single"
                date={pickerDate}
                onChange={handleDateChange}
                locale="pt"
                styles={calendarStyles}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
