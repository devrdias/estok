import React, { useMemo } from 'react';
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

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: SelectOption[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  allOptionLabel?: string;
}

/**
 * Action-sheet style modal. Respects light/dark theme.
 */
export function SelectModal({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
  allOptionLabel,
}: SelectModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const listHeight = Math.min(windowHeight * 0.5, 320);

  const listOptions: SelectOption[] = allOptionLabel
    ? [{ value: '', label: allOptionLabel }, ...options]
    : options;

  const handleSelect = (value: string) => {
    onSelect(value);
    onClose();
  };

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
        list: { maxHeight: 280 },
        option: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: theme.minTouchSize,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
        },
        optionSelected: { backgroundColor: theme.colors.background },
        optionText: { ...theme.typography.body, color: theme.colors.text },
        optionTextSelected: { fontWeight: '600', color: theme.colors.primary },
        checkmark: { color: theme.colors.primary, fontSize: 16, fontWeight: '700' },
      }),
    [theme]
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
              maxHeight: listHeight + 56 + insets.bottom,
            },
          ]}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <FlatList
            data={listOptions}
            keyExtractor={(item) => item.value}
            style={styles.list}
            renderItem={({ item }) => {
              const isSelected = selectedValue === item.value;
              return (
                <Pressable
                  style={[styles.option, isSelected && styles.optionSelected]}
                  onPress={() => handleSelect(item.value)}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{item.label}</Text>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
