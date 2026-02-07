import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useErpProvider } from '../../../shared/api';
import type { Contagem } from '../../../entities/contagem/model/types';
import { CountStatus } from '../../../entities/contagem/model/types';
import type { Estoque } from '../../../entities/estoque/model/types';
import { theme } from '../../../shared/config/theme';
import { Button } from '../../../shared/ui';

/**
 * Contagem 1: listagem de contagens (mock), "Abrir nova contagem".
 * Design: design-system — CTA primary, danger for delete, table borders from theme.
 */
export default function ContagensListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const erp = useErpProvider();
  const [counts, setCounts] = useState<Contagem[]>([]);
  const [stocks, setStocks] = useState<Estoque[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([erp.listInventories({}), erp.listStocks()]);
      setCounts(c);
      setStocks(s);
    } finally {
      setLoading(false);
    }
  }, [erp]);

  useEffect(() => {
    load();
  }, [load]);

  const getStockName = (id: string) => stocks.find((s) => s.id === id)?.nome ?? id;
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');
  const statusLabel = (s: string) => (s === CountStatus.EM_ANDAMENTO ? t('counts.inProgress') : t('counts.finished'));

  const handleNewCount = () => router.push('/(app)/contagens/nova');
  const handleContinue = (id: string) => router.push(`/(app)/contagens/${id}` as any);
  const handleDelete = async (id: string) => {
    await erp.deleteInventory(id);
    load();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.cta} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('counts.title')}</Text>
        <Button onPress={handleNewCount} accessibilityLabel={t('counts.newCount')}>
          {t('counts.newCount')}
        </Button>
      </View>

      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={[styles.cell, styles.cellHeader]}>{t('counts.code')}</Text>
          <Text style={[styles.cell, styles.cellHeader]}>{t('counts.stock')}</Text>
          <Text style={[styles.cell, styles.cellHeader]}>{t('counts.startDate')}</Text>
          <Text style={[styles.cell, styles.cellHeader]}>{t('counts.status')}</Text>
          <Text style={[styles.cell, styles.cellHeader]}>{t('counts.actions')}</Text>
        </View>
        {counts.length === 0 ? (
          <Text style={styles.empty}>{t('counts.title')} (vazio)</Text>
        ) : (
          counts.map((c) => (
            <View key={c.id} style={styles.tableRow}>
              <Text style={styles.cell}>{c.id}</Text>
              <Text style={styles.cell}>{getStockName(c.estoqueId)}</Text>
              <Text style={styles.cell}>{formatDate(c.dataInicio)}</Text>
              <Text style={styles.cell}>{statusLabel(c.status)}</Text>
              <View style={styles.actions}>
                {c.status === CountStatus.EM_ANDAMENTO && (
                  <Pressable
                    style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}
                    onPress={() => handleContinue(c.id)}
                  >
                    <Text style={styles.smallButtonText}>{t('counts.continue')}</Text>
                  </Pressable>
                )}
                <Pressable
                  style={({ pressed }) => [styles.smallButton, styles.dangerButton, pressed && styles.pressed]}
                  onPress={() => handleDelete(c.id)}
                >
                  <Text style={styles.smallButtonText}>{t('counts.delete')}</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
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
  container: { padding: theme.spacing.md, paddingBottom: theme.spacing['2xl'], backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  title: { ...theme.typography.titleSmall, color: theme.colors.text },
  table: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cell: { flex: 1, ...theme.typography.bodySmall, color: theme.colors.text },
  cellHeader: { fontWeight: '600', backgroundColor: theme.colors.borderLight },
  actions: { flex: 1, flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' },
  smallButton: {
    backgroundColor: theme.colors.cta,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: minTouch,
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
  },
  smallButtonText: { color: theme.colors.white, ...theme.typography.caption, fontWeight: '600' },
  dangerButton: { backgroundColor: theme.colors.danger },
  pressed: { opacity: 0.9 },
  empty: { padding: theme.spacing.md, color: theme.colors.textMuted },
  backButton: { marginTop: theme.spacing.lg },
});
