import React, { useMemo, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/config';
import type { SelectOption } from './SelectModal';

export interface MultiSelectModalProps {
  /** Whether the modal is visible. */
  visible: boolean;
  /** Callback to close the modal. */
  onClose: () => void;
  /** Title displayed at the top of the sheet. */
  title: string;
  /** Options available for selection. */
  options: SelectOption[];
  /** Currently selected values (array of option value strings). */
  selectedValues: string[];
  /** Called with the updated array of selected values when selection changes. */
  onSelectionChange: (values: string[]) => void;
  /** Label for the "select all" option at the top. When provided, a "select all" row is shown. */
  allOptionLabel?: string;
}

/**
 * Action-sheet style modal with checkbox multi-selection. Respects light/dark theme.
 *
 * @example
 * ```tsx
 * <MultiSelectModal
 *   visible={visible}
 *   onClose={() => setVisible(false)}
 *   title="Estrutura mercadológica"
 *   options={[{ value: '1', label: 'Bebidas' }, { value: '2', label: 'Frios' }]}
 *   selectedValues={selected}
 *   onSelectionChange={setSelected}
 *   allOptionLabel="Todas"
 * />
 * ```
 */
export function MultiSelectModal({
  visible,
  onClose,
  title,
  options,
  selectedValues,
  onSelectionChange,
  allOptionLabel,
}: MultiSelectModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const listHeight = Math.min(windowHeight * 0.5, 360);

  /** "All" is selected when no specific options are chosen (empty array). */
  const isAllSelected = selectedValues.length === 0;

  const handleToggle = useCallback(
    (value: string) => {
      if (selectedValues.includes(value)) {
        onSelectionChange(selectedValues.filter((v) => v !== value));
      } else {
        onSelectionChange([...selectedValues, value]);
      }
    },
    [selectedValues, onSelectionChange]
  );

  const handleSelectAll = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'flex-end',
        },
        sheet: {
          backgroundColor: theme.colors.backgroundCard,
          borderTopLeftRadius: theme.radius.xl,
          borderTopRightRadius: theme.radius.xl,
          ...theme.shadows.lg,
        },
        handle: {
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: theme.colors.border,
          alignSelf: 'center',
          marginTop: theme.spacing.sm,
          marginBottom: theme.spacing.sm,
        },
        title: {
          ...theme.typography.section,
          color: theme.colors.textMuted,
          paddingHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.sm,
        },
        list: { maxHeight: listHeight },
        option: {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: theme.minTouchSize,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          gap: theme.spacing.md,
        },
        optionSelected: { backgroundColor: theme.colors.background },
        checkbox: {
          width: 22,
          height: 22,
          borderRadius: theme.radius.sm,
          borderWidth: 2,
          borderColor: theme.colors.border,
          justifyContent: 'center',
          alignItems: 'center',
        },
        checkboxChecked: {
          backgroundColor: theme.colors.cta,
          borderColor: theme.colors.cta,
        },
        checkmark: {
          color: theme.colors.white,
          fontSize: 14,
          fontWeight: '700',
          lineHeight: 16,
        },
        optionText: { ...theme.typography.body, color: theme.colors.text, flex: 1 },
        optionTextSelected: { fontWeight: '600', color: theme.colors.primary },
        doneButton: {
          minHeight: theme.minTouchSize,
          marginHorizontal: theme.spacing.lg,
          marginTop: theme.spacing.sm,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.cta,
          justifyContent: 'center',
          alignItems: 'center',
        },
        doneText: {
          ...theme.typography.body,
          color: theme.colors.white,
          fontWeight: '600',
        },
      }),
    [theme, listHeight]
  );

  const renderCheckbox = (checked: boolean) => (
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Text style={styles.checkmark}>✓</Text>}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
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
        <View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + theme.spacing.md,
              maxHeight: listHeight + 120 + insets.bottom,
            },
          ]}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>

          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            style={styles.list}
            ListHeaderComponent={
              allOptionLabel ? (
                <Pressable
                  style={[styles.option, isAllSelected && styles.optionSelected]}
                  onPress={handleSelectAll}
                  accessibilityRole="checkbox"
                  accessibilityLabel={allOptionLabel}
                  accessibilityState={{ checked: isAllSelected }}
                >
                  {renderCheckbox(isAllSelected)}
                  <Text style={[styles.optionText, isAllSelected && styles.optionTextSelected]}>
                    {allOptionLabel}
                  </Text>
                </Pressable>
              ) : null
            }
            renderItem={({ item }) => {
              const isChecked = selectedValues.includes(item.value);
              return (
                <Pressable
                  style={[styles.option, isChecked && styles.optionSelected]}
                  onPress={() => handleToggle(item.value)}
                  accessibilityRole="checkbox"
                  accessibilityLabel={item.label}
                  accessibilityState={{ checked: isChecked }}
                >
                  {renderCheckbox(isChecked)}
                  <Text style={[styles.optionText, isChecked && styles.optionTextSelected]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            }}
          />

          <Pressable
            style={styles.doneButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="OK"
          >
            <Text style={styles.doneText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
