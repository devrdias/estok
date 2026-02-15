import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useErpProvider } from '@/shared/api';
import type { Pdv } from '@/entities/pdv/model/types';
import { PdvStatus } from '@/entities/pdv/model/types';
import type { Estoque } from '@/entities/estoque/model/types';
import { useTheme } from '@/shared/config';
import type { Theme } from '@/shared/config/theme';
import { Card, SelectModal, useAlert, type SelectOption } from '@/shared/ui';

/**
 * PDV management screen — view all Points of Sale, their connection status,
 * and toggle online/offline. Filterable by stock.
 *
 * This is critical for the counting flow: during registration, all PDVs linked
 * to the counted stock must be online (US-4.4). This screen lets users
 * proactively check and fix PDV connectivity before counting.
 */
export default function PdvsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const erp = useErpProvider();
  const { showAlert } = useAlert();

  const [pdvs, setPdvs] = useState<Pdv[]>([]);
  const [stocks, setStocks] = useState<Estoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filterStockId, setFilterStockId] = useState<string>('');
  const [stockModalVisible, setStockModalVisible] = useState(false);

  const styles = useMemo(() => createStyles(theme), [theme]);

  // ─── Data fetching ──────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pdvList, stockList] = await Promise.all([
        erp.listPdvs(filterStockId ? { estoqueId: filterStockId } : undefined),
        erp.listStocks(),
      ]);
      setPdvs(pdvList);
      setStocks(stockList);
    } finally {
      setLoading(false);
    }
  }, [erp, filterStockId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  // ─── Toggle PDV status ─────────────────────────────────────

  const handleToggle = useCallback(
    async (pdvId: string) => {
      setTogglingId(pdvId);
      try {
        const updated = await erp.togglePdvStatus(pdvId);
        setPdvs((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } catch (error) {
        showAlert(
          t('pdvs.title'),
          error instanceof Error ? error.message : t('pdvs.toggleError'),
        );
      } finally {
        setTogglingId(null);
      }
    },
    [erp, showAlert, t]
  );

  // ─── Helpers ───────────────────────────────────────────────

  const getStockName = (id: string) => stocks.find((s) => s.id === id)?.nome ?? id;

  const formatPingTime = (iso?: string): string => {
    if (!iso) return t('pdvs.noPing');
    const date = new Date(iso);
    return date.toLocaleString(undefined, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stockOptions: SelectOption[] = useMemo(
    () => stocks.map((s) => ({ value: s.id, label: s.nome })),
    [stocks]
  );

  // ─── Summary stats ─────────────────────────────────────────

  const onlineCount = pdvs.filter((p) => p.status === PdvStatus.ONLINE).length;
  const offlineCount = pdvs.filter((p) => p.status === PdvStatus.OFFLINE).length;

  // ─── Card renderer ─────────────────────────────────────────

  const renderPdvCard = ({ item: pdv }: { item: Pdv }) => {
    const isOnline = pdv.status === PdvStatus.ONLINE;
    const statusColor = isOnline ? theme.colors.secondary : theme.colors.danger;
    const isToggling = togglingId === pdv.id;

    return (
      <View
        style={[styles.card, { borderLeftColor: statusColor }]}
        accessibilityLabel={`${pdv.nome}, ${isOnline ? t('pdvs.statusOnline') : t('pdvs.statusOffline')}`}
      >
        {/* ── Header: name + status badge ── */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleArea}>
            <View style={styles.cardNameRow}>
              <Ionicons
                name="desktop-outline"
                size={18}
                color={statusColor}
              />
              <Text style={styles.cardName} numberOfLines={1}>
                {pdv.nome}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                {isOnline ? t('pdvs.statusOnline') : t('pdvs.statusOffline')}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Detail rows ── */}
        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <Ionicons name="business-outline" size={13} color={theme.colors.textMuted} />
            <Text style={styles.detailLabel}>{t('pdvs.linkedStock')}</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{getStockName(pdv.estoqueId)}</Text>
          </View>
          {pdv.endereco && (
            <View style={styles.detailItem}>
              <Ionicons name="globe-outline" size={13} color={theme.colors.textMuted} />
              <Text style={styles.detailLabel}>{t('pdvs.address')}</Text>
              <Text style={styles.detailValue}>{pdv.endereco}</Text>
            </View>
          )}
          <View style={styles.detailItem}>
            <Ionicons name="pulse-outline" size={13} color={theme.colors.textMuted} />
            <Text style={styles.detailLabel}>{t('pdvs.lastPing')}</Text>
            <Text style={styles.detailValue}>{formatPingTime(pdv.ultimoPing)}</Text>
          </View>
        </View>

        {/* ── Action button ── */}
        <View style={styles.cardActions}>
          <Pressable
            style={({ pressed }) => [
              styles.toggleBtn,
              {
                backgroundColor: isOnline ? theme.colors.danger + '12' : theme.colors.secondary + '12',
                borderColor: isOnline ? theme.colors.danger + '30' : theme.colors.secondary + '30',
              },
              pressed && styles.toggleBtnPressed,
            ]}
            onPress={() => handleToggle(pdv.id)}
            disabled={isToggling}
            accessibilityRole="button"
            accessibilityLabel={isOnline ? t('pdvs.disconnect') : t('pdvs.connect')}
          >
            {isToggling ? (
              <ActivityIndicator
                size="small"
                color={isOnline ? theme.colors.danger : theme.colors.secondary}
              />
            ) : (
              <>
                <Ionicons
                  name={isOnline ? 'power' : 'power'}
                  size={16}
                  color={isOnline ? theme.colors.danger : theme.colors.secondary}
                />
                <Text
                  style={[
                    styles.toggleBtnText,
                    { color: isOnline ? theme.colors.danger : theme.colors.secondary },
                  ]}
                >
                  {isOnline ? t('pdvs.disconnect') : t('pdvs.connect')}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  // ─── List header (summary + filter) ────────────────────────

  const renderListHeader = () => (
    <View>
      {/* Summary card */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: theme.colors.primary + '15' }]}>
              <Ionicons name="desktop-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.summaryNumber}>{pdvs.length}</Text>
            <Text style={styles.summaryLabel}>
              {t('pdvs.summaryTotal', { count: pdvs.length })}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: theme.colors.secondary + '15' }]}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.secondary} />
            </View>
            <Text style={[styles.summaryNumber, { color: theme.colors.secondary }]}>
              {onlineCount}
            </Text>
            <Text style={styles.summaryLabel}>
              {t('pdvs.summaryOnline', { count: onlineCount })}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: theme.colors.danger + '15' }]}>
              <Ionicons name="close-circle" size={20} color={theme.colors.danger} />
            </View>
            <Text style={[styles.summaryNumber, { color: theme.colors.danger }]}>
              {offlineCount}
            </Text>
            <Text style={styles.summaryLabel}>
              {t('pdvs.summaryOffline', { count: offlineCount })}
            </Text>
          </View>
        </View>
      </Card>

      {/* Stock filter */}
      <Pressable
        style={styles.filterBtn}
        onPress={() => setStockModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`${t('pdvs.filterByStock')}: ${filterStockId ? getStockName(filterStockId) : t('pdvs.allStocks')}`}
      >
        <Ionicons name="funnel-outline" size={16} color={theme.colors.cta} />
        <Text style={styles.filterBtnText}>
          {filterStockId ? getStockName(filterStockId) : t('pdvs.allStocks')}
        </Text>
        <Ionicons name="chevron-down" size={14} color={theme.colors.textMuted} />
      </Pressable>
    </View>
  );

  // ─── Empty state ──────────────────────────────────────────

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="desktop-outline" size={48} color={theme.colors.textMuted} style={{ opacity: 0.5 }} />
      </View>
      <Text style={styles.emptyTitle}>{t('pdvs.emptyTitle')}</Text>
      <Text style={styles.emptyMessage}>{t('pdvs.emptyMessage')}</Text>
    </View>
  );

  // ─── Loading state ─────────────────────────────────────────

  if (loading && pdvs.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // ─── Main render ───────────────────────────────────────────

  return (
    <View style={styles.root}>
      <FlatList
        data={pdvs}
        keyExtractor={(item) => item.id}
        renderItem={renderPdvCard}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      />

      {/* Stock filter modal */}
      <SelectModal
        visible={stockModalVisible}
        onClose={() => setStockModalVisible(false)}
        title={t('pdvs.filterByStock')}
        options={stockOptions}
        selectedValue={filterStockId || null}
        onSelect={setFilterStockId}
        allOptionLabel={t('pdvs.allStocks')}
      />
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

    /* ── Summary card ── */
    summaryCard: {
      marginBottom: theme.spacing.md,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    summaryItem: {
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    summaryIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    summaryNumber: {
      ...theme.typography.title,
      color: theme.colors.text,
    },
    summaryLabel: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
    },

    /* ── Filter button ── */
    filterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    filterBtnText: {
      ...theme.typography.bodySmall,
      fontWeight: '600',
      color: theme.colors.cta,
      flex: 1,
    },

    /* ── PDV card ── */
    card: {
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderLeftWidth: 4,
      ...theme.shadows.md,
    },
    cardHeader: {
      marginBottom: theme.spacing.sm,
    },
    cardTitleArea: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    cardName: {
      ...theme.typography.body,
      fontWeight: '700',
      color: theme.colors.text,
      flex: 1,
    },

    /* ── Status badge ── */
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusBadgeText: {
      ...theme.typography.caption,
      fontWeight: '600',
    },

    /* ── Detail grid ── */
    detailGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      minWidth: '40%',
    },
    detailLabel: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
    },
    detailValue: {
      ...theme.typography.caption,
      fontWeight: '600',
      color: theme.colors.text,
    },

    /* ── Action ── */
    cardActions: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.sm,
    },
    toggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      minHeight: theme.minTouchSize,
      borderRadius: theme.radius.md,
      borderWidth: 1,
    },
    toggleBtnPressed: {
      opacity: 0.8,
    },
    toggleBtnText: {
      ...theme.typography.bodySmall,
      fontWeight: '600',
    },

    /* ── Empty state ── */
    emptyState: {
      alignItems: 'center',
      paddingTop: theme.spacing['3xl'],
      paddingHorizontal: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    emptyIconWrap: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: theme.colors.borderLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.xs,
    },
    emptyTitle: {
      ...theme.typography.titleSmall,
      color: theme.colors.text,
      textAlign: 'center',
    },
    emptyMessage: {
      ...theme.typography.body,
      color: theme.colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
    },
  });
}
