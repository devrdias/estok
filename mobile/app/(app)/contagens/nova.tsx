import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useErpProvider } from '@/shared/api';
import type { EstruturaMercadologica } from '@/shared/api/erp-provider-types';
import type { Estoque } from '@/entities/estoque/model/types';
import { ValorAConsiderar } from '@/entities/contagem/model/types';
import { useTheme } from '@/shared/config';
import { Button, IconButton, SelectModal, type SelectOption } from '@/shared/ui';

/**
 * Nova contagem: Estoque (dropdown/modal), Valor a considerar (chips), Criar.
 */
export default function NovaContagemScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const erp = useErpProvider();
  const [stocks, setStocks] = useState<Estoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState<string>('');
  const [estruturas, setEstruturas] = useState<EstruturaMercadologica[]>([]);
  const [selectedEstruturaId, setSelectedEstruturaId] = useState<string>('');
  const [valorAConsiderar, setValorAConsiderar] = useState<'VENDA' | 'CUSTO'>('VENDA');
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [estruturaModalVisible, setEstruturaModalVisible] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: { flex: 1 },
        container: {
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing['2xl'],
          backgroundColor: theme.colors.background,
        },
        centered: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: theme.spacing.lg,
          gap: theme.spacing.sm,
        },
        headerSpacer: { width: 40 },
        title: { flex: 1, ...theme.typography.titleSmall, color: theme.colors.text, textAlign: 'center' },
        fieldBlock: { marginBottom: theme.spacing.lg },
        field: { marginBottom: theme.spacing.lg },
        label: { ...theme.typography.section, color: theme.colors.text, marginBottom: theme.spacing.sm },
        dropdownTrigger: {
          minHeight: theme.minTouchSize,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.backgroundCard,
        },
        dropdownValue: { flex: 1, ...theme.typography.body, color: theme.colors.text },
        dropdownChevron: { fontSize: 12, color: theme.colors.textMuted },
        row: { flexDirection: 'row', gap: theme.spacing.md },
        chip: {
          flex: 1,
          minHeight: theme.minTouchSize,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.md,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          justifyContent: 'center',
        },
        chipActive: { backgroundColor: theme.colors.cta, borderColor: theme.colors.cta },
        chipText: { ...theme.typography.body, color: theme.colors.text },
        chipTextActive: { color: theme.colors.white, fontWeight: '600' },
      }),
    [theme]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [stockList, estruturaList] = await Promise.all([
        erp.listStocks(),
        erp.listEstruturasMercadologicas?.() ?? Promise.resolve([]),
      ]);
      if (!cancelled) {
        setStocks(stockList);
        if (stockList.length > 0 && !selectedStockId) setSelectedStockId(stockList[0].id);
        setEstruturas(estruturaList);
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
        ...(selectedEstruturaId && { estruturaMercadologicaId: selectedEstruturaId }),
      });
      router.replace(`/(app)/contagens/${c.id}` as any);
    } finally {
      setSubmitting(false);
    }
  }, [erp, selectedStockId, selectedEstruturaId, valorAConsiderar, router]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const canSubmit = !!selectedStockId;
  const selectedStock = stocks.find((s) => s.id === selectedStockId);
  const selectedEstrutura = estruturas.find((e) => e.id === selectedEstruturaId);
  const stockOptions: SelectOption[] = stocks.map((s) => ({ value: s.id, label: s.nome }));
  const estruturaOptions: SelectOption[] = [
    { value: '', label: t('newCount.allCategories') },
    ...estruturas.map((e) => ({ value: e.id, label: e.nome })),
  ];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <IconButton
          onPress={() => router.back()}
          icon="arrow-back"
          variant="ghost"
          accessibilityLabel={t('common.back')}
        />
        <Text style={styles.title}>{t('newCount.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Pressable
        style={styles.fieldBlock}
        onPress={() => setStockModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`${t('newCount.stockLabel')}: ${selectedStock?.nome ?? ''}`}
      >
        <Text style={styles.label}>{t('newCount.stockLabel')}</Text>
        <View style={styles.dropdownTrigger}>
          <Text style={styles.dropdownValue} numberOfLines={1}>
            {selectedStock ? selectedStock.nome : t('counts.allStocks')}
          </Text>
          <Text style={styles.dropdownChevron}>▼</Text>
        </View>
      </Pressable>

      {estruturas.length > 0 && (
        <Pressable
          style={styles.fieldBlock}
          onPress={() => setEstruturaModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`${t('newCount.structureLabel')}: ${selectedEstrutura?.nome ?? t('newCount.allCategories')}`}
        >
          <Text style={styles.label}>{t('newCount.structureLabel')}</Text>
          <View style={styles.dropdownTrigger}>
            <Text style={styles.dropdownValue} numberOfLines={1}>
              {selectedEstrutura ? selectedEstrutura.nome : t('newCount.allCategories')}
            </Text>
            <Text style={styles.dropdownChevron}>▼</Text>
          </View>
        </Pressable>
      )}

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

      <SelectModal
        visible={stockModalVisible}
        onClose={() => setStockModalVisible(false)}
        title={t('newCount.stockLabel')}
        options={stockOptions}
        selectedValue={selectedStockId || null}
        onSelect={setSelectedStockId}
      />
      {estruturas.length > 0 && (
        <SelectModal
          visible={estruturaModalVisible}
          onClose={() => setEstruturaModalVisible(false)}
          title={t('newCount.structureLabel')}
          options={estruturaOptions}
          selectedValue={selectedEstruturaId || null}
          onSelect={setSelectedEstruturaId}
        />
      )}
    </ScrollView>
  );
}
