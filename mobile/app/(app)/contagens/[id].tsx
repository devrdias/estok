import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useErpProvider } from '@/shared/api';
import type { InventoryItem } from '@/shared/api/erp-provider-types';
import { CountStatus } from '@/entities/contagem/model/types';
import { usePermissions } from '@/features/auth/model';
import { getStoredProductSortOrder, ProductSortOrder, type ProductSortOrderValue } from '@/shared/config';
import { useTheme } from '@/shared/config';
import { Button, Card, IconButton } from '@/shared/ui';

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
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [inputQty, setInputQty] = useState('');
  const [finalizing, setFinalizing] = useState(false);
  /** Product currently in "one retry" after divergence (contagem às cegas). */
  const [secondChanceProductId, setSecondChanceProductId] = useState<string | null>(null);
  /** Phase 2: configurable product list order (from Configurações). */
  const [sortOrder, setSortOrder] = useState<ProductSortOrderValue>('nome');

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
        cell: {
          flex: 1,
          ...theme.typography.bodySmall,
          color: theme.colors.text,
          minWidth: 56,
        },
        cellSmall: { minWidth: 64 },
        cellHeader: { fontWeight: '600', backgroundColor: theme.colors.borderLight },
        saldoDivergente: { color: theme.colors.danger, fontWeight: '600' },
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
        editLink: { color: theme.colors.cta, ...theme.typography.bodySmall },
        pressed: { opacity: 0.9 },
        finalizeButton: { marginTop: theme.spacing.md },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: theme.spacing.md,
          gap: theme.spacing.sm,
        },
        headerSpacer: { flex: 1 },
      }),
    [theme]
  );

  useEffect(() => {
    getStoredProductSortOrder().then(setSortOrder);
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
  const total = items.length;
  const counted = items.filter((i) => i.qtdContada != null).length;
  const pct = total ? Math.round((counted / total) * 100) : 0;

  const daysSinceStart = inventory?.dataInicio
    ? Math.max(1, Math.floor((Date.now() - new Date(inventory.dataInicio).getTime()) / 86400000))
    : 1;
  const velocityPct = total && daysSinceStart > 0 ? ((counted / total) * 100) / daysSinceStart : 0;

  const doRegister = async (productId: string, qty: number) => {
    if (!id) return;
    const result = await erp.registerCountedQuantity(id, productId, qty);
    if (result.success) {
      setEditingProductId(null);
      setSecondChanceProductId(null);
      setInputQty('');
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
    const qty = parseInt(inputQty, 10);
    if (isNaN(qty) || !id) return;
    const item = items.find((i) => i.produtoId === productId);
    if (!item) return;

    const checksOk = await runPreRegisterChecks(productId);
    if (!checksOk) return;

    const isDivergence = qty !== item.qtdSistema;
    const isSecondChance = secondChanceProductId === productId;

    if (isDivergence && !isSecondChance) {
      Alert.alert(
        t('counts.divergenceTitle'),
        t('counts.divergenceMessage'),
        [
          { text: t('counts.keepCount'), onPress: () => doRegister(productId, qty) },
          { text: t('counts.refillCount'), onPress: () => setSecondChanceProductId(productId) },
        ]
      );
      return;
    }
    doRegister(productId, qty);
  };

  const openEdit = (productId: string) => {
    setEditingProductId(productId);
    setSecondChanceProductId(null);
    const item = items.find((i) => i.produtoId === productId);
    setInputQty(item?.qtdContada != null ? String(item.qtdContada) : '');
  };

  const handleFinalize = () => {
    if (!id) return;
    Alert.alert(
      t('counts.finalize'),
      undefined,
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
      <View style={styles.header}>
        <IconButton
          onPress={() => router.back()}
          icon="arrow-back"
          variant="ghost"
          accessibilityLabel={t('common.back')}
        />
        <View style={styles.headerSpacer} />
      </View>
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
          <Text style={styles.summaryLabel}>Qtd. produtos</Text>
          <Text style={styles.summaryValue}>{total}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Contados</Text>
          <Text style={styles.summaryValue}>
            {counted} ({pct}%)
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('counts.velocity')}</Text>
          <Text style={styles.summaryValue}>{velocityPct.toFixed(1)}%</Text>
        </View>
      </Card>

      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={[styles.cell, styles.cellHeader]}>{t('counts.code')}</Text>
          <Text style={[styles.cell, styles.cellHeader]}>Produto</Text>
          <Text style={[styles.cell, styles.cellHeader]}>Valor</Text>
          <Text style={[styles.cell, styles.cellHeader]}>Qtd. sistema</Text>
          <Text style={[styles.cell, styles.cellHeader]}>Qtd. contada</Text>
          <Text style={[styles.cell, styles.cellHeader]}>{t('counts.balance')}</Text>
          <Text style={[styles.cell, styles.cellHeader]}>{t('counts.countedAt')}</Text>
        </View>
        {sortedItems.map((item) => {
          const balance = saldo(item);
          return (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.cell}>{item.produtoId}</Text>
              <Text style={styles.cell}>{item.produtoNome}</Text>
              <Text style={styles.cell}>{item.valorUnitario.toFixed(2)}</Text>
              <Text style={styles.cell}>{item.qtdSistema}</Text>
              <View style={styles.cell}>
                {!isReadOnly && editingProductId === item.produtoId ? (
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.input}
                      value={inputQty}
                      onChangeText={setInputQty}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={theme.colors.textMuted}
                      onSubmitEditing={() => handleRegister(item.produtoId)}
                      returnKeyType="done"
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
                ) : !isReadOnly ? (
                  <Pressable
                    onPress={() => openEdit(item.produtoId)}
                    style={({ pressed }) => pressed && styles.pressed}
                    accessibilityRole="button"
                    accessibilityLabel={`Editar quantidade: ${item.qtdContada ?? '—'}`}
                  >
                    <Text style={styles.editLink}>{item.qtdContada ?? '—'} tap</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.cell}>{item.qtdContada ?? '—'}</Text>
                )}
              </View>
              <Text style={[styles.cell, balance !== null && balance !== 0 && styles.saldoDivergente]}>
                {balance !== null ? (balance >= 0 ? `+${balance}` : balance) : '—'}
              </Text>
              <Text style={[styles.cell, styles.cellSmall]}>
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
