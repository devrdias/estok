import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useErpProvider } from '@/shared/api';
import type { InventoryItem } from '@/shared/api/erp-provider-types';
import type { Contagem } from '@/entities/contagem/model/types';
import { CountStatus, ModalidadeContagem } from '@/entities/contagem/model/types';
import type { Estoque } from '@/entities/estoque/model/types';
import { usePermissions, useAuth, UserRole } from '@/features/auth/model';
import { useTheme, setStoredCountListFilters } from '@/shared/config';
import type { Theme } from '@/shared/config/theme';
import { SelectModal, DatePickerField, useAlert, type SelectOption } from '@/shared/ui';

/** Enable LayoutAnimation on Android. */
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Stable list separator — avoids re-creation per render. */
function ItemSeparator() {
  return <View style={{ height: 2 }} />;
}

/** Animated progress bar — extracted for stable identity. */
function ProgressBar({ pct, color, trackColor }: { pct: number; color: string; trackColor: string }) {
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: trackColor, overflow: 'hidden' as const }}>
      <View style={{ height: '100%', borderRadius: 3, width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
    </View>
  );
}

/** Days without activity to mark a count as stale. */
const STALE_COUNT_DAYS = 7;

// ─── Progress data per contagem ─────────────────────────────

interface ContagemProgress {
  total: number;
  counted: number;
  pct: number;
  loading: boolean;
}

// ─── Utility functions ──────────────────────────────────────

/** Parse DD/MM/YYYY or YYYY-MM-DD to ISO date string (YYYY-MM-DD). */
function parseDateToISO(value: string): string | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  const dmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  return undefined;
}

/** Check if a contagem has been idle for more than the stale threshold. */
function isStaleCount(c: Contagem): boolean {
  const cutoff = Date.now() - STALE_COUNT_DAYS * 86400000;
  return c.status === CountStatus.EM_ANDAMENTO && new Date(c.dataInicio).getTime() < cutoff;
}

/** Calculate number of whole days between two dates. */
function daysBetween(from: string, to: string): number {
  return Math.max(1, Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 86400000));
}

/** Calculate days elapsed since a date. */
function daysElapsed(from: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(from).getTime()) / 86400000));
}

/**
 * ContagensListScreen — modern card-based inventory count list.
 *
 * Rich cards show progress bars, velocity, counting mode, and relative time.
 * SectionList grouped by status. Collapsible filters. FAB for one-handed use.
 */
export default function ContagensListScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const erp = useErpProvider();
  const { user } = useAuth();
  const { canDeleteCount } = usePermissions();
  const { showAlert } = useAlert();

  /** Managers and admins see which employee is counting on each card. */
  const isManagerView = user?.role === UserRole.MANAGER || user?.role === UserRole.ADMIN;

  const [counts, setCounts] = useState<Contagem[]>([]);
  const [stocks, setStocks] = useState<Estoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  /** Progress data keyed by contagem ID. */
  const [progressMap, setProgressMap] = useState<Record<string, ContagemProgress>>({});

  const [filterEstoqueId, setFilterEstoqueId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<{
    estoqueId: string;
    status: string;
    dataInicio?: string;
    dataFim?: string;
  }>({ estoqueId: '', status: '' });
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  const styles = useMemo(() => createStyles(theme), [theme]);

  // ─── Data fetching ──────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([
        erp.listInventories({
          ...(appliedFilters.estoqueId && { estoqueId: appliedFilters.estoqueId }),
          ...(appliedFilters.status && { status: appliedFilters.status }),
          ...(appliedFilters.dataInicio && { dataInicio: appliedFilters.dataInicio }),
          ...(appliedFilters.dataFim && { dataFim: appliedFilters.dataFim }),
        }),
        erp.listStocks(),
      ]);
      setCounts(c);
      setStocks(s);
      return c;
    } finally {
      setLoading(false);
    }
  }, [erp, appliedFilters]);

  /** Fetch inventory items for each contagem to compute progress. */
  const loadProgress = useCallback(
    async (contagemList: Contagem[]) => {
      // Mark all as loading first
      const initial: Record<string, ContagemProgress> = {};
      for (const c of contagemList) {
        initial[c.id] = { total: 0, counted: 0, pct: 0, loading: true };
      }
      setProgressMap(initial);

      // Fetch items in parallel (batched for performance)
      const results = await Promise.allSettled(
        contagemList.map(async (c) => {
          const items: InventoryItem[] = await erp.listInventoryItems(c.id);
          const total = items.length;
          const counted = items.filter((i) => i.qtdContada != null).length;
          const pct = total > 0 ? Math.round((counted / total) * 100) : 0;
          return { id: c.id, total, counted, pct };
        })
      );

      const next: Record<string, ContagemProgress> = {};
      for (const r of results) {
        if (r.status === 'fulfilled') {
          next[r.value.id] = { ...r.value, loading: false };
        }
      }
      setProgressMap((prev) => ({ ...prev, ...next }));
    },
    [erp]
  );

  /** Reload list every time the screen gains focus (e.g. after creating a new count). */
  useFocusEffect(
    useCallback(() => {
      load().then((c) => {
        if (c && c.length > 0) loadProgress(c);
      });
    }, [load, loadProgress])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const c = await load();
      if (c && c.length > 0) loadProgress(c);
    } finally {
      setRefreshing(false);
    }
  }, [load, loadProgress]);

  // ─── Filters ────────────────────────────────────────────────

  const applyFilters = () => {
    const next = {
      estoqueId: filterEstoqueId,
      status: filterStatus,
      dataInicio: parseDateToISO(filterDateFrom),
      dataFim: parseDateToISO(filterDateTo),
    };
    setAppliedFilters(next);
    setStoredCountListFilters({
      ...(next.estoqueId && { estoqueId: next.estoqueId }),
      ...(next.status && { status: next.status }),
      ...(next.dataInicio && { dataInicio: next.dataInicio }),
      ...(next.dataFim && { dataFim: next.dataFim }),
    });
  };

  const hasActiveFilters = Boolean(
    appliedFilters.estoqueId || appliedFilters.status || appliedFilters.dataInicio || appliedFilters.dataFim
  );

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFiltersVisible((v) => !v);
  };

  // ─── Helpers ────────────────────────────────────────────────

  const getStockName = (id: string) => stocks.find((s) => s.id === id)?.nome ?? id;
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

  const formatRelativeTime = (isoDate: string): string => {
    const days = daysElapsed(isoDate);
    if (days === 0) return t('counts.today');
    return t(days === 1 ? 'counts.daysAgo_one' : 'counts.daysAgo_other', { count: days });
  };

  const formatDuration = (fromIso: string, toIso: string): string => {
    const days = daysBetween(fromIso, toIso);
    return t(days === 1 ? 'counts.durationDays_one' : 'counts.durationDays_other', { count: days });
  };

  const modeLabel = (mode?: string): string | null => {
    if (mode === ModalidadeContagem.LOJA_FECHADA) return t('counts.storeClosed');
    if (mode === ModalidadeContagem.LOJA_FUNCIONANDO) return t('counts.storeOpen');
    return null;
  };

  const stockOptions: SelectOption[] = useMemo(
    () => stocks.map((s) => ({ value: s.id, label: s.nome })),
    [stocks]
  );
  const statusOptions: SelectOption[] = useMemo(
    () => [
      { value: CountStatus.EM_ANDAMENTO, label: t('counts.inProgress') },
      { value: CountStatus.FINALIZADO, label: t('counts.finished') },
    ],
    [t]
  );

  // ─── Sections ───────────────────────────────────────────────

  const sections = useMemo(() => {
    const inProgress = counts.filter((c) => c.status === CountStatus.EM_ANDAMENTO);
    const finished = counts.filter((c) => c.status === CountStatus.FINALIZADO);
    const result: { title: string; key: string; data: Contagem[] }[] = [];
    if (inProgress.length > 0) {
      result.push({ title: t('counts.sectionInProgress'), key: 'in_progress', data: inProgress });
    }
    if (finished.length > 0) {
      result.push({ title: t('counts.sectionFinished'), key: 'finished', data: finished });
    }
    return result;
  }, [counts, t]);

  const staleCounts = useMemo(() => counts.filter(isStaleCount), [counts]);

  // ─── Actions ────────────────────────────────────────────────

  const handleNewCount = () => router.push('/(app)/contagens/nova');
  const handleContinue = (id: string) => router.push(`/(app)/contagens/${id}` as never);
  const handleVerify = (id: string) => router.push(`/(app)/contagens/${id}` as never);
  const handleDelete = (id: string) => {
    showAlert(
      t('counts.deleteConfirmTitle'),
      t('counts.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('counts.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await erp.deleteInventory(id);
              const c = await load();
              if (c && c.length > 0) loadProgress(c);
            } catch (error) {
              showAlert(
                t('counts.deleteErrorTitle'),
                error instanceof Error ? error.message : t('counts.deleteErrorMessage'),
              );
            }
          },
        },
      ]
    );
  };

  // ─── Card renderer ──────────────────────────────────────────

  const renderContagemCard = ({ item: c }: { item: Contagem }) => {
    const isInProgress = c.status === CountStatus.EM_ANDAMENTO;
    const stale = isStaleCount(c);
    const progress = progressMap[c.id];
    const statusColor = isInProgress ? theme.colors.secondary : theme.colors.cta;
    const accentColor = stale ? theme.colors.danger : statusColor;

    const days = daysElapsed(c.dataInicio);
    const velocity =
      isInProgress && progress && !progress.loading && progress.total > 0 && days > 0
        ? ((progress.counted / progress.total) * 100) / Math.max(days, 1)
        : null;

    const mode = modeLabel(c.modalidadeContagem);

    return (
      <View
        style={[styles.card, { borderLeftColor: accentColor }]}
        accessibilityLabel={`${getStockName(c.estoqueId)}, ${isInProgress ? t('counts.inProgress') : t('counts.finished')}`}
      >
        {/* ── Tappable content area (navigates to count detail) ── */}
        <Pressable
          style={({ pressed }) => pressed && styles.cardPressed}
          onPress={() => (isInProgress ? handleContinue(c.id) : handleVerify(c.id))}
          accessibilityRole="button"
          accessibilityHint={isInProgress ? t('counts.continue') : t('counts.verify')}
        >
          {/* ── Row 1: Stock name + ID badge ─── */}
          <View style={styles.cardTopRow}>
            <View style={styles.cardTitleArea}>
              <Text style={styles.cardStockName} numberOfLines={1}>
                {getStockName(c.estoqueId)}
              </Text>
              <View style={[styles.idBadge, { backgroundColor: accentColor + '18' }]}>
                <Text style={[styles.idBadgeText, { color: accentColor }]}>#{c.id}</Text>
              </View>
            </View>
            {stale && (
              <View style={styles.staleChip}>
                <Ionicons name="alert-circle" size={13} color={theme.colors.danger} />
              </View>
            )}
          </View>

          {/* ── Row 2: Progress section ──────── */}
          {progress && !progress.loading ? (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  {isInProgress
                    ? t('counts.productsProgress', { counted: progress.counted, total: progress.total })
                    : t('counts.allProductsCounted', { total: progress.total })}
                </Text>
                <Text style={[styles.progressPct, { color: isInProgress ? accentColor : theme.colors.cta }]}>
                  {isInProgress ? `${progress.pct}%` : t('counts.complete')}
                </Text>
              </View>
              <ProgressBar pct={isInProgress ? progress.pct : 100} color={accentColor} trackColor={theme.colors.border} />
            </View>
          ) : (
            <View style={styles.progressSection}>
              <View style={styles.progressSkeleton}>
                <View style={styles.progressSkeletonText} />
                <View style={styles.progressSkeletonBar} />
              </View>
            </View>
          )}

          {/* ── Row 3: Info chips (time, velocity, mode) ── */}
          <View style={styles.chipRow}>
            {/* Time chip */}
            <View style={styles.chip}>
              <Ionicons name="time-outline" size={13} color={theme.colors.textMuted} />
              <Text style={styles.chipText}>
                {isInProgress
                  ? formatRelativeTime(c.dataInicio)
                  : c.dataFinalizacao
                    ? `${formatDate(c.dataInicio)} → ${formatDate(c.dataFinalizacao)}`
                    : formatDate(c.dataInicio)}
              </Text>
            </View>

            {/* Duration chip (finished only) */}
            {!isInProgress && c.dataFinalizacao && (
              <View style={styles.chip}>
                <Ionicons name="hourglass-outline" size={13} color={theme.colors.textMuted} />
                <Text style={styles.chipText}>{formatDuration(c.dataInicio, c.dataFinalizacao)}</Text>
              </View>
            )}

            {/* Velocity chip (in-progress only, when data is available) */}
            {velocity !== null && velocity > 0 && (
              <View style={[styles.chip, styles.chipAccent]}>
                <Ionicons name="flash" size={13} color={theme.colors.secondary} />
                <Text style={[styles.chipText, { color: theme.colors.secondary }]}>
                  {t('counts.velocityShort', { value: velocity.toFixed(1) })}
                </Text>
              </View>
            )}

            {/* Mode chip */}
            {mode && (
              <View style={styles.chip}>
                <Ionicons name="storefront-outline" size={13} color={theme.colors.textMuted} />
                <Text style={styles.chipText}>{mode}</Text>
              </View>
            )}
          </View>

          {/* ── Row 4: Employee assignee (manager view) ── */}
          {isManagerView && (c.criadoPorNome || c.finalizadoPorNome) && (
            <View style={styles.assigneeRow}>
              <View style={styles.assigneeAvatar}>
                <Ionicons name="person" size={12} color={theme.colors.cta} />
              </View>
              <Text style={styles.assigneeText} numberOfLines={1}>
                {isInProgress
                  ? t('counts.countingBy', { name: c.criadoPorNome ?? '—' })
                  : c.finalizadoPorNome
                    ? t('counts.finalizedBy', { name: c.finalizadoPorNome })
                    : t('counts.createdBy', { name: c.criadoPorNome ?? '—' })}
              </Text>
            </View>
          )}
        </Pressable>

        {/* ── Row 5: Actions — separated from content Pressable to prevent event conflicts ── */}
        <View style={styles.cardActions}>
          {canDeleteCount && (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.actionBtnDanger, pressed && styles.actionPressed]}
              onPress={() => handleDelete(c.id)}
              accessibilityRole="button"
              accessibilityLabel={t('counts.delete')}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionBtnPrimary,
              { backgroundColor: accentColor },
              pressed && styles.actionPressed,
            ]}
            onPress={() => (isInProgress ? handleContinue(c.id) : handleVerify(c.id))}
            accessibilityRole="button"
            accessibilityLabel={isInProgress ? t('counts.continue') : t('counts.verify')}
            hitSlop={8}
          >
            <Ionicons name={isInProgress ? 'play' : 'eye'} size={16} color={theme.colors.white} />
            <Text style={styles.actionBtnText}>
              {isInProgress ? t('counts.continue') : t('counts.verify')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  // ─── Section header ─────────────────────────────────────────

  const renderSectionHeader = ({ section }: { section: { title: string; key: string; data: Contagem[] } }) => {
    const isInProgress = section.key === 'in_progress';
    const dotColor = isInProgress ? theme.colors.secondary : theme.colors.cta;
    return (
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionDot, { backgroundColor: dotColor }]} />
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
        <View style={[styles.sectionBadge, { backgroundColor: dotColor + '20' }]}>
          <Text style={[styles.sectionBadgeText, { color: dotColor }]}>{section.data.length}</Text>
        </View>
      </View>
    );
  };

  // ─── Empty state ────────────────────────────────────────────

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="clipboard-outline" size={48} color={theme.colors.textMuted} style={{ opacity: 0.5 }} />
      </View>
      <Text style={styles.emptyTitle}>{t('counts.emptyTitle')}</Text>
      <Text style={styles.emptyMessage}>{t('counts.emptyMessage')}</Text>
      <Pressable
        style={({ pressed }) => [styles.emptyAction, pressed && styles.actionPressed]}
        onPress={handleNewCount}
        accessibilityRole="button"
        accessibilityLabel={t('counts.newCount')}
      >
        <Ionicons name="add-circle" size={20} color={theme.colors.white} />
        <Text style={styles.emptyActionText}>{t('counts.newCount')}</Text>
      </Pressable>
    </View>
  );

  // ─── List header (filters + stale banner) ───────────────────

  const renderListHeader = () => (
    <View>
      {/* Filter toggle */}
      <Pressable
        style={styles.filterToggle}
        onPress={toggleFilters}
        accessibilityRole="button"
        accessibilityLabel={filtersVisible ? t('counts.hideFilters') : t('counts.showFilters')}
      >
        <View style={styles.filterToggleLeft}>
          <Ionicons name="options-outline" size={18} color={theme.colors.cta} />
          <Text style={styles.filterToggleText}>
            {filtersVisible ? t('counts.hideFilters') : t('counts.showFilters')}
          </Text>
          {hasActiveFilters && <View style={styles.filterActiveDot} />}
        </View>
        <Ionicons
          name={filtersVisible ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.colors.textMuted}
        />
      </Pressable>

      {/* Collapsible filter panel */}
      {filtersVisible && (
        <View style={styles.filterCard}>
          <View style={styles.filterRow}>
            <Pressable
              style={styles.dropdown}
              onPress={() => setStockModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={`${t('counts.stock')}: ${filterEstoqueId ? getStockName(filterEstoqueId) : t('counts.allStocks')}`}
            >
              <View style={styles.dropdownContent}>
                <Text style={styles.dropdownLabel}>{t('counts.stock')}</Text>
                <Text style={styles.dropdownValue} numberOfLines={1}>
                  {filterEstoqueId ? getStockName(filterEstoqueId) : t('counts.allStocks')}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={14} color={theme.colors.textMuted} />
            </Pressable>
            <Pressable
              style={styles.dropdown}
              onPress={() => setStatusModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={`${t('counts.status')}: ${filterStatus ? (filterStatus === CountStatus.EM_ANDAMENTO ? t('counts.inProgress') : t('counts.finished')) : t('counts.allStatuses')}`}
            >
              <View style={styles.dropdownContent}>
                <Text style={styles.dropdownLabel}>{t('counts.status')}</Text>
                <Text style={styles.dropdownValue} numberOfLines={1}>
                  {filterStatus
                    ? filterStatus === CountStatus.EM_ANDAMENTO
                      ? t('counts.inProgress')
                      : t('counts.finished')
                    : t('counts.allStatuses')}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={14} color={theme.colors.textMuted} />
            </Pressable>
          </View>
          <View style={styles.filterRow}>
            <DatePickerField
              value={filterDateFrom}
              onChange={setFilterDateFrom}
              placeholder={t('counts.dateFrom')}
              accessibilityLabel={t('counts.dateFrom')}
              style={styles.dateInput}
            />
            <DatePickerField
              value={filterDateTo}
              onChange={setFilterDateTo}
              placeholder={t('counts.dateTo')}
              accessibilityLabel={t('counts.dateTo')}
              style={styles.dateInput}
            />
          </View>
          <Pressable
            style={({ pressed }) => [styles.applyBtn, pressed && styles.actionPressed]}
            onPress={applyFilters}
            accessibilityRole="button"
            accessibilityLabel={t('common.filter')}
          >
            <Ionicons name="checkmark-circle" size={18} color={theme.colors.white} />
            <Text style={styles.applyBtnText}>{t('common.filter')}</Text>
          </Pressable>
        </View>
      )}

      {/* Stale counts banner */}
      {staleCounts.length > 0 && (
        <View style={styles.staleBanner}>
          <View style={styles.staleBannerIcon}>
            <Ionicons name="alert-circle" size={20} color={theme.colors.cta} />
          </View>
          <Text style={styles.staleBannerText}>
            {t('counts.staleBanner', { count: staleCounts.length, days: STALE_COUNT_DAYS })}
          </Text>
        </View>
      )}
    </View>
  );

  // ─── Loading state ──────────────────────────────────────────

  if (loading && counts.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // ─── Main render ────────────────────────────────────────────

  return (
    <View style={styles.root}>
      {/* SectionList */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderContagemCard}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={ItemSeparator}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      />

      {/* FAB — bottom-right, thumb-reachable */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={handleNewCount}
        accessibilityRole="button"
        accessibilityLabel={t('counts.newCount')}
      >
        <Ionicons name="add" size={28} color={theme.colors.white} />
      </Pressable>

      {/* Modals */}
      <SelectModal
        visible={stockModalVisible}
        onClose={() => setStockModalVisible(false)}
        title={t('counts.stock')}
        options={stockOptions}
        selectedValue={filterEstoqueId || null}
        onSelect={setFilterEstoqueId}
        allOptionLabel={t('counts.allStocks')}
      />
      <SelectModal
        visible={statusModalVisible}
        onClose={() => setStatusModalVisible(false)}
        title={t('counts.status')}
        options={statusOptions}
        selectedValue={filterStatus || null}
        onSelect={setFilterStatus}
        allOptionLabel={t('counts.allStatuses')}
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
      paddingHorizontal: theme.spacing.md,
      paddingBottom: 100,
    },

    // ─── Filter toggle ────────────────────────────
    filterToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm + 2,
      marginBottom: theme.spacing.xs,
    },
    filterToggleLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    filterToggleText: {
      ...theme.typography.bodySmall,
      fontWeight: '600',
      color: theme.colors.cta,
    },
    filterActiveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.secondary,
    },

    // ─── Filter card ──────────────────────────────
    filterCard: {
      marginBottom: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.sm,
      ...theme.shadows.sm,
    },
    filterRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    dropdown: {
      flex: 1,
      minHeight: theme.minTouchSize,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.background,
    },
    dropdownContent: { flex: 1, minWidth: 0 },
    dropdownLabel: { ...theme.typography.caption, color: theme.colors.textMuted },
    dropdownValue: { ...theme.typography.bodySmall, color: theme.colors.text },
    dateInput: {
      flex: 1,
      minWidth: 0,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.spacing.sm,
      ...theme.typography.bodySmall,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    },
    applyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      minHeight: theme.minTouchSize,
      backgroundColor: theme.colors.cta,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
    },
    applyBtnText: {
      ...theme.typography.bodySmall,
      fontWeight: '600',
      color: theme.colors.white,
    },

    // ─── Stale banner ─────────────────────────────
    staleBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.sm,
    },
    staleBannerIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.cta + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    staleBannerText: {
      flex: 1,
      ...theme.typography.bodySmall,
      color: theme.colors.text,
    },

    // ─── Section header ───────────────────────────
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.sm,
    },
    sectionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    sectionHeaderText: {
      ...theme.typography.section,
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    sectionBadge: {
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    sectionBadgeText: {
      ...theme.typography.caption,
      fontWeight: '700',
    },

    // ─── Card ─────────────────────────────────────
    card: {
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderLeftWidth: 4,
      ...theme.shadows.md,
    },
    cardPressed: {
      opacity: 0.93,
      transform: [{ scale: 0.985 }],
    },
    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    cardTitleArea: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginRight: theme.spacing.xs,
    },
    cardStockName: {
      flexShrink: 1,
      ...theme.typography.body,
      fontWeight: '700',
      color: theme.colors.text,
    },
    idBadge: {
      borderRadius: theme.radius.sm,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    idBadgeText: {
      ...theme.typography.caption,
      fontWeight: '700',
    },
    staleChip: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.danger + '12',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ─── Progress section ─────────────────────────
    progressSection: {
      marginBottom: theme.spacing.sm,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    progressLabel: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
    },
    progressPct: {
      ...theme.typography.bodySmall,
      fontWeight: '700',
    },
    // ─── Progress skeleton ────────────────────────
    progressSkeleton: {
      gap: 6,
    },
    progressSkeletonText: {
      height: 14,
      width: '60%',
      borderRadius: 4,
      backgroundColor: theme.colors.borderLight,
    },
    progressSkeletonBar: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.borderLight,
    },

    // ─── Info chips ───────────────────────────────
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs + 2,
      marginBottom: theme.spacing.sm + 2,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.borderLight,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    chipAccent: {
      backgroundColor: theme.colors.secondary + '15',
    },
    chipText: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
    },

    // ─── Assignee row (manager view) ───────────────
    assigneeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs + 2,
      marginBottom: theme.spacing.sm,
    },
    assigneeAvatar: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.colors.cta + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    assigneeText: {
      flex: 1,
      ...theme.typography.caption,
      color: theme.colors.textMuted,
    },

    // ─── Card actions ─────────────────────────────
    cardActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      minHeight: 40,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
    },
    actionBtnPrimary: {
      flex: 1,
    },
    actionBtnDanger: {
      backgroundColor: theme.colors.danger + '10',
      borderWidth: 1,
      borderColor: theme.colors.danger + '25',
    },
    actionBtnText: {
      ...theme.typography.bodySmall,
      fontWeight: '600',
      color: theme.colors.white,
    },
    actionPressed: {
      opacity: 0.85,
    },

    // ─── Empty state ──────────────────────────────
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
    emptyAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
      backgroundColor: theme.colors.cta,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm + 4,
    },
    emptyActionText: {
      ...theme.typography.body,
      fontWeight: '600',
      color: theme.colors.white,
    },

    // ─── FAB ──────────────────────────────────────
    fab: {
      position: 'absolute',
      bottom: theme.spacing.lg,
      right: theme.spacing.lg,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.cta,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.lg,
    },
    fabPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.93 }],
    },
  });
}
