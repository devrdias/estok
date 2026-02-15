import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useErpProvider } from '@/shared/api';
import type { EstruturaMercadologica } from '@/shared/api/erp-provider-types';
import type { Estoque } from '@/entities/estoque/model/types';
import { ValorAConsiderar, ModalidadeContagem } from '@/entities/contagem/model/types';
import type { ModalidadeContagemValue } from '@/entities/contagem/model/types';
import { useTheme } from '@/shared/config';
import { Button, SelectModal, MultiSelectModal, InfoModal, useAlert, type SelectOption } from '@/shared/ui';

/**
 * Nova contagem: Estoque (dropdown/modal), Valor a considerar (chips), Criar.
 */
export default function NovaContagemScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const erp = useErpProvider();
  const { showAlert } = useAlert();
  const [stocks, setStocks] = useState<Estoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState<string>('');
  const [estruturas, setEstruturas] = useState<EstruturaMercadologica[]>([]);
  const [selectedEstruturaIds, setSelectedEstruturaIds] = useState<string[]>([]);
  const [valorAConsiderar, setValorAConsiderar] = useState<'VENDA' | 'CUSTO'>('VENDA');
  const [modalidadeContagem, setModalidadeContagem] = useState<ModalidadeContagemValue>(ModalidadeContagem.LOJA_ABERTA);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [estruturaModalVisible, setEstruturaModalVisible] = useState(false);
  const [storeModeHelpVisible, setStoreModeHelpVisible] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        scroll: { flex: 1 },
        container: {
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing['2xl'],
        },
        footer: {
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
        labelInline: { ...theme.typography.section, color: theme.colors.text },
        labelRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.xs,
          marginBottom: theme.spacing.sm,
        },
        helpButton: {
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: theme.colors.textMuted,
          justifyContent: 'center',
          alignItems: 'center',
        },
        helpText: {
          fontSize: 14,
          fontWeight: '700',
          color: theme.colors.textMuted,
          lineHeight: 16,
        },
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
        modalidadeContagem,
        ...(selectedEstruturaIds.length > 0 && { estruturaMercadologicaIds: selectedEstruturaIds }),
      });
      router.replace(`/(app)/contagens/${c.id}` as any);
    } catch (error) {
      showAlert(
        t('newCount.createErrorTitle'),
        error instanceof Error ? error.message : t('newCount.createErrorMessage'),
      );
    } finally {
      setSubmitting(false);
    }
  }, [erp, selectedStockId, selectedEstruturaIds, valorAConsiderar, modalidadeContagem, router, t]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const canSubmit = !!selectedStockId;
  const selectedStock = stocks.find((s) => s.id === selectedStockId);
  const stockOptions: SelectOption[] = stocks.map((s) => ({ value: s.id, label: s.nome }));
  const estruturaOptions: SelectOption[] = estruturas.map((e) => ({ value: e.id, label: e.nome }));

  /** Display label for the multi-select trigger: "Todas" or "N selecionada(s)". */
  const estruturaDisplayLabel =
    selectedEstruturaIds.length === 0
      ? t('newCount.allCategories')
      : t('newCount.selectedCount', { count: selectedEstruturaIds.length });

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
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
            accessibilityLabel={`${t('newCount.structureLabel')}: ${estruturaDisplayLabel}`}
          >
            <Text style={styles.label}>{t('newCount.structureLabel')}</Text>
            <View style={styles.dropdownTrigger}>
              <Text style={styles.dropdownValue} numberOfLines={1}>
                {estruturaDisplayLabel}
              </Text>
              <Text style={styles.dropdownChevron}>▼</Text>
            </View>
          </Pressable>
        )}

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.labelInline}>{t('newCount.storeModeLabel')}</Text>
            <Pressable
              style={styles.helpButton}
              onPress={() => setStoreModeHelpVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={t('newCount.storeModeHelpTitle')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.helpText}>?</Text>
            </Pressable>
          </View>
          <View style={styles.row}>
            <Pressable
              style={[styles.chip, modalidadeContagem === ModalidadeContagem.LOJA_ABERTA && styles.chipActive]}
              onPress={() => setModalidadeContagem(ModalidadeContagem.LOJA_ABERTA)}
              accessibilityRole="button"
              accessibilityState={{ selected: modalidadeContagem === ModalidadeContagem.LOJA_ABERTA }}
            >
              <Text style={[styles.chipText, modalidadeContagem === ModalidadeContagem.LOJA_ABERTA && styles.chipTextActive]}>
                {t('newCount.storeModeOpen')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.chip, modalidadeContagem === ModalidadeContagem.LOJA_FECHADA && styles.chipActive]}
              onPress={() => setModalidadeContagem(ModalidadeContagem.LOJA_FECHADA)}
              accessibilityRole="button"
              accessibilityState={{ selected: modalidadeContagem === ModalidadeContagem.LOJA_FECHADA }}
            >
              <Text style={[styles.chipText, modalidadeContagem === ModalidadeContagem.LOJA_FECHADA && styles.chipTextActive]}>
                {t('newCount.storeModeClosed')}
              </Text>
            </Pressable>
          </View>
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
      </ScrollView>

      <View style={styles.footer}>
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
      </View>

      <SelectModal
        visible={stockModalVisible}
        onClose={() => setStockModalVisible(false)}
        title={t('newCount.stockLabel')}
        options={stockOptions}
        selectedValue={selectedStockId || null}
        onSelect={setSelectedStockId}
      />
      {estruturas.length > 0 && (
        <MultiSelectModal
          visible={estruturaModalVisible}
          onClose={() => setEstruturaModalVisible(false)}
          title={t('newCount.structureLabel')}
          options={estruturaOptions}
          selectedValues={selectedEstruturaIds}
          onSelectionChange={setSelectedEstruturaIds}
          allOptionLabel={t('newCount.allCategories')}
        />
      )}

      <InfoModal
        visible={storeModeHelpVisible}
        onClose={() => setStoreModeHelpVisible(false)}
        title={t('newCount.storeModeHelpTitle')}
        body={t('newCount.storeModeHelpBody')}
      />
    </View>
  );
}
