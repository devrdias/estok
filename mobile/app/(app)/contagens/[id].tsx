import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  KeyboardAvoidingView,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useErpProvider } from '@/shared/api';
import type { InventoryItem } from '@/shared/api/erp-provider-types';
import { CountStatus } from '@/entities/contagem/model/types';
import { usePermissions } from '@/features/auth/model';
import {
  getStoredProductSortOrder,
  getStoredBlindCount,
  ProductSortOrder,
  type ProductSortOrderValue,
} from '@/shared/config';
import { useTheme } from '@/shared/config';
import type { Theme } from '@/shared/config/theme';
import { Button, Card, useAlert } from '@/shared/ui';

/** Enable LayoutAnimation on Android. */
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Count detail screen — summary header + vertical FlatList of expandable product cards.
 * When status is FINALIZADO: read-only. When EM_ANDAMENTO: inline editing + Finalizar button.
 */
export default function ContagemFatoScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const erp = useErpProvider();
  const { canFinalizeCount } = usePermissions();
  const { showAlert } = useAlert();

  const [inventory, setInventory] = useState<{ status: string; dataInicio: string } | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [secondChanceProductId, setSecondChanceProductId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<ProductSortOrderValue>('nome');
  const [blindCount, setBlindCount] = useState(false);
  const [itemInputs, setItemInputs] = useState<Record<string, string>>({});
  /** Which product card is currently expanded (null = none). */
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  const styles = useMemo(() => createStyles(theme), [theme]);

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
  const totalProducts = items.length;
  const productsCounted = items.filter((i) => i.qtdContada != null).length;
  const productsPct = totalProducts ? Math.round((productsCounted / totalProducts) * 100) : 0;
  const totalSystemItems = items.reduce((sum, i) => sum + i.qtdSistema, 0);
  const totalCountedItems = items.reduce((sum, i) => sum + (i.qtdContada ?? 0), 0);

  const daysSinceStart = inventory?.dataInicio
    ? Math.max(1, Math.floor((Date.now() - new Date(inventory.dataInicio).getTime()) / 86400000))
    : 1;
  const velocityPct =
    totalProducts && daysSinceStart > 0
      ? ((productsCounted / totalProducts) * 100) / daysSinceStart
      : 0;

  // ─── Registration logic ────────────────────────────────────

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
      showAlert(t('counts.divergenceTitle'), result.message);
    }
  };

  const runPreRegisterChecks = async (productId: string): Promise<boolean> => {
    if (!id) return false;
    if (erp.checkPdvOnline) {
      const pdv = await erp.checkPdvOnline(id);
      if (!pdv.ok) {
        showAlert(t('counts.pdvOfflineTitle'), pdv.message ?? t('counts.pdvOfflineMessage'));
        return false;
      }
    }
    if (erp.checkTransferenciasPendentes) {
      const tr = await erp.checkTransferenciasPendentes(id, productId);
      if (!tr.ok) {
        showAlert(t('counts.transferPendingTitle'), tr.message ?? t('counts.transferPendingMessage'));
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

    if (blindCount) {
      const isDivergence = qty !== item.qtdSistema;
      const isSecondChance = secondChanceProductId === productId;
      if (isDivergence && !isSecondChance) {
        showAlert(t('counts.divergenceTitle'), t('counts.divergenceMessage'), [
          { text: t('counts.refillCount'), style: 'cancel', onPress: () => setSecondChanceProductId(productId) },
          { text: t('counts.keepCount'), onPress: () => doRegister(productId, qty) },
        ]);
        return;
      }
    }
    doRegister(productId, qty);
  };

  const setItemInput = (productId: string, value: string) => {
    setItemInputs((prev) => ({ ...prev, [productId]: value }));
  };

  const handleFinalize = () => {
    if (!id) return;
    showAlert(t('counts.finalize'), t('counts.finalizeConfirmMessage'), [
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
            showAlert(
              t('counts.finalizeErrorTitle'),
              error instanceof Error ? error.message : t('counts.finalizeErrorMessage'),
            );
          } finally {
            setFinalizing(false);
          }
        },
      },
    ]);
  };

  const toggleExpand = (productId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === productId ? null : productId));
  };

  // ─── Sorting ───────────────────────────────────────────────

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

  // ─── Render helpers ────────────────────────────────────────

  const saldo = (item: InventoryItem) =>
    item.qtdContada != null ? item.qtdContada - item.qtdSistema : null;

  const renderProductCard = ({ item }: { item: InventoryItem }) => {
    const isCounted = item.qtdContada != null;
    const balance = saldo(item);
    const hasDivergence = balance !== null && balance !== 0;
    const isExpanded = expandedId === item.produtoId;

    const statusColor = isCounted
      ? hasDivergence
        ? theme.colors.danger
        : theme.colors.secondary
      : theme.colors.textMuted;

    return (
      <View style={[styles.productCard, { borderLeftColor: statusColor }]}>
        {/* ── Collapsed row: always visible ── */}
        <Pressable
          style={({ pressed }) => [styles.productCardHeader, pressed && styles.productCardPressed]}
          onPress={() => toggleExpand(item.produtoId)}
          accessibilityRole="button"
          accessibilityLabel={`${item.produtoNome} - ${item.produtoId}`}
          accessibilityHint={t('counts.tapToExpand')}
        >
          <View style={styles.productMainInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.produtoNome}
            </Text>
            <Text style={styles.productCode}>#{item.produtoId}</Text>
          </View>

          <View style={styles.productStatusArea}>
            {isCounted ? (
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
                <Ionicons
                  name={hasDivergence ? 'alert-circle' : 'checkmark-circle'}
                  size={14}
                  color={statusColor}
                />
                <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                  {item.qtdContada}
                </Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: theme.colors.border + '60' }]}>
                <Text style={[styles.statusBadgeText, { color: theme.colors.textMuted }]}>
                  {t('counts.notCounted')}
                </Text>
              </View>
            )}
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.colors.textMuted}
            />
          </View>
        </Pressable>

        {/* ── Expanded section ── */}
        {isExpanded && (
          <View style={styles.expandedSection}>
            {/* Detail rows */}
            <View style={styles.detailGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('counts.systemQty')}</Text>
                <Text style={styles.detailValue}>{item.qtdSistema}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('counts.unitValue')}</Text>
                <Text style={styles.detailValue}>{item.valorUnitario.toFixed(2)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('counts.balance')}</Text>
                <Text
                  style={[
                    styles.detailValue,
                    hasDivergence && styles.divergenceValue,
                  ]}
                >
                  {balance !== null ? (balance >= 0 ? `+${balance}` : String(balance)) : '—'}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('counts.countedAt')}</Text>
                <Text style={styles.detailValue}>
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
            </View>

            {/* Inline input (editable mode only) */}
            {!isReadOnly && (
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>{t('counts.countedQtyLabel')}</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    ref={(ref) => {
                      inputRefs.current[item.produtoId] = ref;
                    }}
                    style={styles.input}
                    value={
                      itemInputs[item.produtoId] ??
                      (item.qtdContada != null ? String(item.qtdContada) : '')
                    }
                    onChangeText={(v) => setItemInput(item.produtoId, v)}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={theme.colors.textMuted}
                    onSubmitEditing={() => handleRegister(item.produtoId)}
                    returnKeyType="done"
                    selectTextOnFocus
                    accessibilityLabel={`${t('counts.countedQtyLabel')}: ${item.produtoNome}`}
                  />
                  <Pressable
                    style={({ pressed }) => [styles.confirmBtn, pressed && styles.confirmBtnPressed]}
                    onPress={() => handleRegister(item.produtoId)}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('common.ok')}: ${item.produtoNome}`}
                  >
                    <Ionicons name="checkmark" size={20} color={theme.colors.white} />
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  // ─── FlatList header (summary card + banners) ──────────────

  const renderListHeader = () => (
    <View>
      <Stack.Screen options={{ title: `${t('counts.title')} #${id}` }} />

      {isReadOnly && (
        <View style={styles.readOnlyBanner}>
          <Ionicons name="lock-closed-outline" size={14} color={theme.colors.textMuted} />
          <Text style={styles.readOnlyText}>{t('counts.viewOnly')}</Text>
        </View>
      )}

      {/* Summary card */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryGrid}>
          <SummaryItem
            icon="calendar-outline"
            label={t('counts.startDate')}
            value={inventory?.dataInicio ? new Date(inventory.dataInicio).toLocaleDateString('pt-BR') : '—'}
            theme={theme}
          />
          <SummaryItem
            icon="cube-outline"
            label={t('counts.totalProducts')}
            value={String(totalProducts)}
            theme={theme}
          />
          <SummaryItem
            icon="checkmark-done-outline"
            label={t('counts.productsCounted')}
            value={`${productsCounted}/${totalProducts} (${productsPct}%)`}
            theme={theme}
          />
          <SummaryItem
            icon="layers-outline"
            label={t('counts.itemsCounted')}
            value={`${totalCountedItems}/${totalSystemItems}`}
            theme={theme}
          />
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(productsPct, 100)}%`,
                  backgroundColor: productsPct >= 100 ? theme.colors.secondary : theme.colors.cta,
                },
              ]}
            />
          </View>
          <Text style={styles.progressBarLabel}>
            {t('counts.velocity')}: {velocityPct.toFixed(1)}%
          </Text>
        </View>
      </Card>
    </View>
  );

  // ─── FlatList footer (finalize button) ─────────────────────

  const renderListFooter = () => {
    if (isReadOnly || !canFinalizeCount) return null;
    return (
      <View style={styles.footerContainer}>
        <Button
          onPress={handleFinalize}
          variant="primary"
          fullWidth
          loading={finalizing}
          disabled={finalizing}
          accessibilityLabel={t('counts.finalize')}
        >
          {t('counts.finalize')}
        </Button>
      </View>
    );
  };

  // ─── Loading state ─────────────────────────────────────────

  if (loading && !inventory && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!id) return null;

  // ─── Main render ───────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <FlatList
        data={sortedItems}
        keyExtractor={(item) => item.id}
        renderItem={renderProductCard}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Summary Item ────────────────────────────────────────────

interface SummaryItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  theme: Theme;
}

function SummaryItem({ icon, label, value, theme }: SummaryItemProps) {
  return (
    <View style={{ flex: 1, minWidth: '45%', gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Ionicons name={icon} size={13} color={theme.colors.textMuted} />
        <Text style={{ ...theme.typography.caption, color: theme.colors.textMuted }}>{label}</Text>
      </View>
      <Text style={{ ...theme.typography.bodySmall, fontWeight: '600', color: theme.colors.text }}>
        {value}
      </Text>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    listContent: {
      padding: theme.spacing.md,
      paddingBottom: theme.spacing['3xl'],
    },

    /* ── Read-only banner ── */
    readOnlyBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      backgroundColor: theme.colors.borderLight,
      padding: theme.spacing.sm,
      borderRadius: theme.radius.md,
      marginBottom: theme.spacing.md,
    },
    readOnlyText: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
    },

    /* ── Summary card ── */
    summaryCard: {
      marginBottom: theme.spacing.lg,
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    progressBarContainer: {
      gap: theme.spacing.xs,
    },
    progressBarTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.border,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    progressBarLabel: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
    },

    /* ── Product card ── */
    productCard: {
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderLeftWidth: 4,
      overflow: 'hidden',
      ...theme.shadows.sm,
    },
    productCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      minHeight: 56,
    },
    productCardPressed: {
      opacity: 0.85,
    },
    productMainInfo: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    productName: {
      ...theme.typography.body,
      fontWeight: '600',
      color: theme.colors.text,
    },
    productCode: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    productStatusArea: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    statusBadgeText: {
      ...theme.typography.caption,
      fontWeight: '600',
    },

    /* ── Expanded section ── */
    expandedSection: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      padding: theme.spacing.md,
      gap: theme.spacing.md,
    },
    detailGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
    },
    detailItem: {
      minWidth: '40%',
      flex: 1,
    },
    detailLabel: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
      marginBottom: 2,
    },
    detailValue: {
      ...theme.typography.body,
      fontWeight: '600',
      color: theme.colors.text,
    },
    divergenceValue: {
      color: theme.colors.danger,
    },

    /* ── Input section ── */
    inputSection: {
      gap: theme.spacing.xs,
    },
    inputLabel: {
      ...theme.typography.caption,
      fontWeight: '600',
      color: theme.colors.textMuted,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.spacing.sm,
      paddingVertical: 12,
      ...theme.typography.body,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    },
    confirmBtn: {
      backgroundColor: theme.colors.primary,
      minHeight: theme.minTouchSize,
      minWidth: theme.minTouchSize,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: theme.radius.md,
    },
    confirmBtnPressed: {
      opacity: 0.85,
    },

    /* ── Footer ── */
    footerContainer: {
      marginTop: theme.spacing.lg,
      alignItems: 'center',
    },
  });
}
