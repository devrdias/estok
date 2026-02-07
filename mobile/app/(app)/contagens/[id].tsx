import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useErpProvider } from '../../../shared/api';
import type { InventoryItem } from '../../../shared/api/erp-provider-types';
import { theme } from '../../../shared/config/theme';
import { Button, Card } from '../../../shared/ui';

/**
 * Contagem 3: contagem de fato — resumo, tabela de produtos, registrar quantidade.
 * Design: design-system — Card for summary, primary green for confirm, CTA for links.
 */
export default function ContagemFatoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const erp = useErpProvider();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [inputQty, setInputQty] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [inv, list] = await Promise.all([erp.getInventory(id), erp.listInventoryItems(id)]);
      if (inv) setStartDate(inv.dataInicio);
      setItems(list);
    } finally {
      setLoading(false);
    }
  }, [id, erp]);

  useEffect(() => {
    load();
  }, [load]);

  const total = items.length;
  const counted = items.filter((i) => i.qtdContada != null).length;
  const pct = total ? Math.round((counted / total) * 100) : 0;

  const handleRegister = async (productId: string) => {
    const qty = parseInt(inputQty, 10);
    if (isNaN(qty) || !id) return;
    const result = await erp.registerCountedQuantity(id, productId, qty);
    if (result.success) {
      setEditingProductId(null);
      setInputQty('');
      load();
    }
  };

  const openEdit = (productId: string) => {
    setEditingProductId(productId);
    const item = items.find((i) => i.produtoId === productId);
    setInputQty(item?.qtdContada != null ? String(item.qtdContada) : '');
  };

  if (loading || !id) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.cta} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Card style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('counts.startDate')}</Text>
          <Text style={styles.summaryValue}>{startDate ? new Date(startDate).toLocaleDateString('pt-BR') : '—'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Qtd. produtos</Text>
          <Text style={styles.summaryValue}>{total}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Contados</Text>
          <Text style={styles.summaryValue}>
            {counted} ({pct}%)
          </Text>
        </View>
      </Card>

      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={[styles.cell, styles.cellHeader]}>{t('counts.code')}</Text>
          <Text style={[styles.cell, styles.cellHeader]}>Produto</Text>
          <Text style={[styles.cell, styles.cellHeader]}>Valor</Text>
          <Text style={[styles.cell, styles.cellHeader]}>Qtd. sistema</Text>
          <Text style={[styles.cell, styles.cellHeader]}>Qtd. contada</Text>
        </View>
        {items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={styles.cell}>{item.produtoId}</Text>
            <Text style={styles.cell}>{item.produtoNome}</Text>
            <Text style={styles.cell}>{item.valorUnitario.toFixed(2)}</Text>
            <Text style={styles.cell}>{item.qtdSistema}</Text>
            <View style={styles.cell}>
              {editingProductId === item.produtoId ? (
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={inputQty}
                    onChangeText={setInputQty}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                  <Pressable
                    style={({ pressed }) => [styles.confirmBtn, pressed && styles.pressed]}
                    onPress={() => handleRegister(item.produtoId)}
                    accessibilityRole="button"
                    accessibilityLabel="Confirmar quantidade"
                  >
                    <Text style={styles.confirmBtnText}>OK</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => openEdit(item.produtoId)}
                  style={({ pressed }) => pressed && styles.pressed}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar quantidade: ${item.qtdContada ?? '—'}`}
                >
                  <Text style={styles.editLink}>{item.qtdContada ?? '—'} tap</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}
      </View>

      <Button onPress={() => router.back()} variant="outline" fullWidth style={styles.backButton}>
        {t('common.back')}
      </Button>
    </ScrollView>
  );
}

const minTouch = theme.minTouchSize;

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing['2xl'],
    backgroundColor: theme.colors.background,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  summary: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, marginBottom: theme.spacing.md },
  summaryRow: { marginRight: theme.spacing.lg },
  summaryLabel: { ...theme.typography.caption, color: theme.colors.textMuted },
  summaryValue: { ...theme.typography.bodySmall, fontWeight: '600', color: theme.colors.text },
  table: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    padding: theme.spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cell: { flex: 1, ...theme.typography.bodySmall, color: theme.colors.text, minWidth: 60 },
  cellHeader: { fontWeight: '600', backgroundColor: theme.colors.borderLight },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    minWidth: 48,
    ...theme.typography.bodySmall,
    color: theme.colors.text,
  },
  confirmBtn: {
    backgroundColor: theme.colors.primary,
    minHeight: minTouch,
    minWidth: minTouch,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.radius.sm,
  },
  confirmBtnText: { color: theme.colors.white, fontWeight: '600', ...theme.typography.bodySmall },
  editLink: { color: theme.colors.cta, ...theme.typography.bodySmall },
  pressed: { opacity: 0.9 },
  backButton: { marginTop: theme.spacing.lg },
});
