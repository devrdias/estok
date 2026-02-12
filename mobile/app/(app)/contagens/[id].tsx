import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useErpProvider } from '@/shared/api';
import type { InventoryItem } from '@/shared/api/erp-provider-types';
import { CountStatus } from '@/entities/contagem/model/types';
import { usePermissions } from '@/features/auth/model';
import { getStoredProductSortOrder, getStoredBlindCount, ProductSortOrder, type ProductSortOrderValue } from '@/shared/config';
import { useTheme } from '@/shared/config';
import { Button, Card } from '@/shared/ui';

/**
 * Contagem 3: contagem de fato — resumo, tabela, registrar quantidade.
 * When status is FINALIZADO: read-only (Conferir view). When EM_ANDAMENTO: edit + Finalizar button.
 */
export default function ContagemFatoScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const erp = useErpProvider();
  const { canFinalizeCount } = usePermissions();
  const [inventory, setInventory] = useState<{ status: string; dataInicio: string } | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  /** Product currently in "one retry" after divergence (contagem às cegas). */
  const [secondChanceProductId, setSecondChanceProductId] = useState<string | null>(null);
  /** Phase 2: configurable product list order (from Configurações). */
  const [sortOrder, setSortOrder] = useState<ProductSortOrderValue>('nome');
  /** Blind count mode: when enabled, divergence alert blocks save for recount. */
  const [blindCount, setBlindCount] = useState(false);
  /** Per-item input values keyed by produtoId. */
  const [itemInputs, setItemInputs] = useState<Record<string, string>>({});
  /** Ref map for auto-focusing TextInput per row. */
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: { flex: 1 },
        container: {
          padding: theme.spacing.md,
          paddingBottom: theme.spacing['2xl'],
          backgroundColor: theme.colors.background,
        },
        centered: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
        },
        readOnlyBanner: {
          backgroundColor: theme.colors.borderLight,
          padding: theme.spacing.sm,
          borderRadius: theme.radius.sm,
          marginBottom: theme.spacing.md,
        },
        readOnlyText: {
          ...theme.typography.caption,
          color: theme.colors.textMuted,
          textAlign: 'center',
        },
        summary: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.spacing.md,
          marginBottom: theme.spacing.md,
        },
        summaryRow: { marginRight: theme.spacing.lg },
        summaryLabel: { ...theme.typography.caption, color: theme.colors.textMuted },
        summaryValue: {
          ...theme.typography.bodySmall,
          fontWeight: '600',
          color: theme.colors.text,
        },
        tableScroll: { marginHorizontal: -theme.spacing.md },
        tableScrollContent: { paddingHorizontal: theme.spacing.md },
        table: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          overflow: 'hidden',
        },
        tableRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        /** Shared base for every text cell — typography + vertical padding for alignment. */
        cellBase: {
          ...theme.typography.bodySmall,
          color: theme.colors.text,
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.xs,
        },
        cellCode: { width: 70, minWidth: 70 },
        cellProduct: { width: 150, minWidth: 150 },
        cellValue: { width: 80, minWidth: 80 },
        cellSystemQty: { width: 80, minWidth: 80 },
        cellCountedQty: { width: 150, minWidth: 150, paddingHorizontal: theme.spacing.xs },
        cellBalance: { width: 80, minWidth: 80 },
        cellCountedAt: { width: 110, minWidth: 110 },
        cellHeader: {
          fontWeight: '600',
          backgroundColor: theme.colors.borderLight,
        },
        saldoDivergente: { color: theme.colors.danger, fontWeight: '600' },
        inputRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
        input: {
          flex: 1,
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
          minHeight: theme.minTouchSize,
          minWidth: theme.minTouchSize,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: theme.radius.sm,
        },
        confirmBtnText: {
          color: theme.colors.white,
          fontWeight: '600',
          ...theme.typography.bodySmall,
        },
        pressed: { opacity: 0.9 },
        finalizeButton: { marginTop: theme.spacing.md },
      }),
    [theme]
  );

  useEffect(() => {
    getStoredProductSortOrder().then(setSortOrder);
    getStoredBlindCount().then(setBlindCount);
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [inv, list] = await Promise.all([erp.getInventory(id), erp.listInventoryItems(id)]);
      if (inv) setInventory({ status: inv.status, dataInicio: inv.dataInicio });
      setItems(list ?? []);
    } finally {
      setLoading(false);
    }
  }, [id, erp]);

  useEffect(() => {
    load();
  }, [load]);

  const isReadOnly = inventory?.status === CountStatus.FINALIZADO;
  /** Number of distinct product SKUs in this inventory. */
  const totalProducts = items.length;
  /** How many product lines have been counted at least once (progress). */
  const productsCounted = items.filter((i) => i.qtdContada != null).length;
  const productsPct = totalProducts ? Math.round((productsCounted / totalProducts) * 100) : 0;
  /** Sum of all system quantities (total items expected). */
  const totalSystemItems = items.reduce((sum, i) => sum + i.qtdSistema, 0);
  /** Sum of all counted quantities (total items registered). */
  const totalCountedItems = items.reduce((sum, i) => sum + (i.qtdContada ?? 0), 0);

  const daysSinceStart = inventory?.dataInicio
    ? Math.max(1, Math.floor((Date.now() - new Date(inventory.dataInicio).getTime()) / 86400000))
    : 1;
  const velocityPct = totalProducts && daysSinceStart > 0 ? ((productsCounted / totalProducts) * 100) / daysSinceStart : 0;

  const doRegister = async (productId: string, qty: number) => {
    if (!id) return;
    const result = await erp.registerCountedQuantity(id, productId, qty);
    if (result.success) {
      setSecondChanceProductId(null);
      setItemInputs((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      load();
    } else {
      Alert.alert(t('counts.divergenceTitle'), result.message);
    }
  };

  /** US-4.4, US-4.5: run pre-register checks if provider implements them. */
  const runPreRegisterChecks = async (productId: string): Promise<boolean> => {
    if (!id) return false;
    if (erp.checkPdvOnline) {
      const pdv = await erp.checkPdvOnline(id);
      if (!pdv.ok) {
        Alert.alert(t('counts.pdvOfflineTitle'), pdv.message ?? t('counts.pdvOfflineMessage'));
        return false;
      }
    }
    if (erp.checkTransferenciasPendentes) {
      const tr = await erp.checkTransferenciasPendentes(id, productId);
      if (!tr.ok) {
        Alert.alert(t('counts.transferPendingTitle'), tr.message ?? t('counts.transferPendingMessage'));
        return false;
      }
    }
    return true;
  };

  const handleRegister = async (productId: string) => {
    const raw = itemInputs[productId] ?? '';
    const qty = parseInt(raw, 10);
    if (isNaN(qty) || !id) return;
    const item = items.find((i) => i.produtoId === productId);
    if (!item) return;

    const checksOk = await runPreRegisterChecks(productId);
    if (!checksOk) return;

    /**
     * Divergence alert only when blind count is enabled.
     * When disabled, the balance column already highlights divergence visually,
     * and blocking every save with an alert makes the workflow unusable.
     */
    if (blindCount) {
      const isDivergence = qty !== item.qtdSistema;
      const isSecondChance = secondChanceProductId === productId;

      if (isDivergence && !isSecondChance) {
        Alert.alert(
          t('counts.divergenceTitle'),
          t('counts.divergenceMessage'),
          [
            { text: t('counts.refillCount'), style: 'cancel', onPress: () => setSecondChanceProductId(productId) },
            { text: t('counts.keepCount'), onPress: () => doRegister(productId, qty) },
          ]
        );
        return;
      }
    }

    doRegister(productId, qty);
  };

  /** Update the input value for a specific product row. */
  const setItemInput = (productId: string, value: string) => {
    setItemInputs((prev) => ({ ...prev, [productId]: value }));
  };

  const handleFinalize = () => {
    if (!id) return;
    Alert.alert(
      t('counts.finalize'),
      t('counts.finalizeConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('counts.finalize'),
          onPress: async () => {
            setFinalizing(true);
            try {
              await erp.updateInventory(id, {
                status: CountStatus.FINALIZADO,
                dataFinalizacao: new Date().toISOString(),
              });
              await load();
            } catch (error) {
              Alert.alert(
                t('counts.finalizeErrorTitle'),
                error instanceof Error ? error.message : t('counts.finalizeErrorMessage'),
              );
            } finally {
              setFinalizing(false);
            }
          },
        },
      ]
    );
  };

  const saldo = (item: InventoryItem) =>
    item.qtdContada != null ? item.qtdContada - item.qtdSistema : null;

  /** US-4.3 / Phase 2: sort by user preference (nome, codigo, valor). */
  const sortedItems = useMemo(() => {
    const list = [...items];
    if (sortOrder === ProductSortOrder.NOME) {
      list.sort((a, b) => a.produtoNome.localeCompare(b.produtoNome));
    } else if (sortOrder === ProductSortOrder.CODIGO) {
      list.sort((a, b) => a.produtoId.localeCompare(b.produtoId));
    } else {
      list.sort((a, b) => a.valorUnitario - b.valorUnitario);
    }
    return list;
  }, [items, sortOrder]);

  if (loading && !inventory && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!id) return null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: `${t('counts.title')} #${id}` }} />
      {isReadOnly && (
        <View style={styles.readOnlyBanner}>
          <Text style={styles.readOnlyText}>{t('counts.viewOnly')}</Text>
        </View>
      )}

      <Card style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('counts.startDate')}</Text>
          <Text style={styles.summaryValue}>
            {inventory?.dataInicio ? new Date(inventory.dataInicio).toLocaleDateString('pt-BR') : '—'}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('counts.totalProducts')}</Text>
          <Text style={styles.summaryValue}>{totalProducts}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('counts.productsCounted')}</Text>
          <Text style={styles.summaryValue}>
            {productsCounted}/{totalProducts} ({productsPct}%)
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('counts.itemsCounted')}</Text>
          <Text style={styles.summaryValue}>
            {totalCountedItems}/{totalSystemItems}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('counts.velocity')}</Text>
          <Text style={styles.summaryValue}>{velocityPct.toFixed(1)}%</Text>
        </View>
      </Card>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.tableScrollContent}
        style={styles.tableScroll}
      >
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.cellBase, styles.cellCode, styles.cellHeader]}>{t('counts.code')}</Text>
            <Text style={[styles.cellBase, styles.cellProduct, styles.cellHeader]}>Produto</Text>
            <Text style={[styles.cellBase, styles.cellValue, styles.cellHeader]}>Valor</Text>
            <Text style={[styles.cellBase, styles.cellSystemQty, styles.cellHeader]}>Qtd. sistema</Text>
            <Text style={[styles.cellBase, styles.cellCountedQty, styles.cellHeader]}>Qtd. contada</Text>
            <Text style={[styles.cellBase, styles.cellBalance, styles.cellHeader]}>{t('counts.balance')}</Text>
            <Text style={[styles.cellBase, styles.cellCountedAt, styles.cellHeader]}>{t('counts.countedAt')}</Text>
          </View>
          {sortedItems.map((item) => {
            const balance = saldo(item);
            return (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.cellBase, styles.cellCode]} numberOfLines={1} ellipsizeMode="tail">{item.produtoId}</Text>
                <Text style={[styles.cellBase, styles.cellProduct]} numberOfLines={1} ellipsizeMode="tail">{item.produtoNome}</Text>
                <Text style={[styles.cellBase, styles.cellValue]}>{item.valorUnitario.toFixed(2)}</Text>
                <Text style={[styles.cellBase, styles.cellSystemQty]}>{item.qtdSistema}</Text>
                <View style={styles.cellCountedQty}>
                  {!isReadOnly ? (
                    <View style={styles.inputRow}>
                      <TextInput
                        ref={(ref) => { inputRefs.current[item.produtoId] = ref; }}
                        style={styles.input}
                        value={itemInputs[item.produtoId] ?? (item.qtdContada != null ? String(item.qtdContada) : '')}
                        onChangeText={(v) => setItemInput(item.produtoId, v)}
                        keyboardType="number-pad"
                        placeholder={String(item.qtdContada ?? '—')}
                        placeholderTextColor={theme.colors.textMuted}
                        onSubmitEditing={() => handleRegister(item.produtoId)}
                        returnKeyType="done"
                        selectTextOnFocus
                        accessibilityLabel={`${t('counts.countedQtyLabel')}: ${item.produtoNome}`}
                      />
                      <Pressable
                        style={({ pressed }) => [styles.confirmBtn, pressed && styles.pressed]}
                        onPress={() => handleRegister(item.produtoId)}
                        accessibilityRole="button"
                        accessibilityLabel={`${t('common.ok')}: ${item.produtoNome}`}
                      >
                        <Text style={styles.confirmBtnText}>OK</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Text style={[styles.cellBase, styles.cellCountedQty]}>
                      {item.qtdContada ?? '—'}
                    </Text>
                  )}
                </View>
                <Text style={[styles.cellBase, styles.cellBalance, balance !== null && balance !== 0 && styles.saldoDivergente]}>
                  {balance !== null ? (balance >= 0 ? `+${balance}` : balance) : '—'}
                </Text>
                <Text style={[styles.cellBase, styles.cellCountedAt]}>
                  {item.dataHoraContagem
                    ? new Date(item.dataHoraContagem).toLocaleString(undefined, {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {!isReadOnly && canFinalizeCount && (
        <Button
          onPress={handleFinalize}
          variant="primary"
          fullWidth
          loading={finalizing}
          disabled={finalizing}
          style={styles.finalizeButton}
          accessibilityLabel={t('counts.finalize')}
        >
          {t('counts.finalize')}
        </Button>
      )}

    </ScrollView>
  );
}
