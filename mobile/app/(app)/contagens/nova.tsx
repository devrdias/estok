import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useErpProvider } from '../../../shared/api';
import type { Estoque } from '../../../entities/estoque/model/types';
import { ValorAConsiderar } from '../../../entities/contagem/model/types';
import { theme } from '../../../shared/config/theme';
import { Button } from '../../../shared/ui';

/**
 * Contagem 2: nova contagem — Estoque (obrigatório), Valor a considerar, Criar.
 * Design: design-system — chips with primary active state, CTA create button, min touch.
 */
export default function NovaContagemScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const erp = useErpProvider();
  const [stocks, setStocks] = useState<Estoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState<string>('');
  const [valorAConsiderar, setValorAConsiderar] = useState<'VENDA' | 'CUSTO'>('VENDA');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await erp.listStocks();
      if (!cancelled) {
        setStocks(list);
        if (list.length > 0 && !selectedStockId) setSelectedStockId(list[0].id);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [erp]);

  const handleCreate = useCallback(async () => {
    if (!selectedStockId) return;
    setSubmitting(true);
    try {
      const c = await erp.createInventory({
        estoqueId: selectedStockId,
        valorAConsiderar,
      });
      router.replace(`/(app)/contagens/${c.id}` as any);
    } finally {
      setSubmitting(false);
    }
  }, [erp, selectedStockId, valorAConsiderar, router]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.cta} />
      </View>
    );
  }

  const canSubmit = !!selectedStockId;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('newCount.title')}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>{t('newCount.stockLabel')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {stocks.map((s) => (
            <Pressable
              key={s.id}
              style={[styles.chip, selectedStockId === s.id && styles.chipActive]}
              onPress={() => setSelectedStockId(s.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedStockId === s.id }}
              accessibilityLabel={s.nome}
            >
              <Text style={[styles.chipText, selectedStockId === s.id && styles.chipTextActive]}>{s.nome}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('newCount.valueToConsider')}</Text>
        <View style={styles.row}>
          <Pressable
            style={[styles.chip, valorAConsiderar === 'VENDA' && styles.chipActive]}
            onPress={() => setValorAConsiderar(ValorAConsiderar.VENDA)}
            accessibilityRole="button"
            accessibilityState={{ selected: valorAConsiderar === 'VENDA' }}
          >
            <Text style={[styles.chipText, valorAConsiderar === 'VENDA' && styles.chipTextActive]}>
              {t('newCount.salesValue')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.chip, valorAConsiderar === 'CUSTO' && styles.chipActive]}
            onPress={() => setValorAConsiderar(ValorAConsiderar.CUSTO)}
            accessibilityRole="button"
            accessibilityState={{ selected: valorAConsiderar === 'CUSTO' }}
          >
            <Text style={[styles.chipText, valorAConsiderar === 'CUSTO' && styles.chipTextActive]}>
              {t('newCount.costValue')}
            </Text>
          </Pressable>
        </View>
      </View>

      <Button
        onPress={handleCreate}
        variant="primary"
        disabled={!canSubmit || submitting}
        loading={submitting}
        accessibilityLabel={t('common.create')}
        fullWidth
      >
        {t('common.create')}
      </Button>

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
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['2xl'],
    backgroundColor: theme.colors.background,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  title: { ...theme.typography.titleSmall, color: theme.colors.text, marginBottom: theme.spacing.lg },
  field: { marginBottom: theme.spacing.lg },
  label: { ...theme.typography.section, color: theme.colors.text, marginBottom: theme.spacing.sm },
  row: { flexDirection: 'row', gap: theme.spacing.md },
  chipRow: { flexGrow: 0 },
  chip: {
    minHeight: minTouch,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: theme.colors.cta, borderColor: theme.colors.cta },
  chipText: { ...theme.typography.body, color: theme.colors.text },
  chipTextActive: { color: theme.colors.white, fontWeight: '600' },
  backButton: { marginTop: theme.spacing.lg },
});
