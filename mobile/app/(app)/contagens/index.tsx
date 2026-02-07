import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useErpProvider } from '@/shared/api';
import type { Contagem } from '@/entities/contagem/model/types';
import { CountStatus } from '@/entities/contagem/model/types';
import type { Estoque } from '@/entities/estoque/model/types';
import { usePermissions } from '@/features/auth/model';
import { useTheme, getStoredCountListFilters, setStoredCountListFilters } from '@/shared/config';
import { IconButton, SelectModal, DatePickerField, type SelectOption } from '@/shared/ui';

/** Fase 2: dias sem atividade para considerar contagem "parada" (aviso). */
const STALE_COUNT_DAYS = 7;

/** Parse DD/MM/YYYY or YYYY-MM-DD to ISO date string (YYYY-MM-DD). */
function parseDateToISO(value: string): string | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  const dmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const month = m.padStart(2, '0');
    const day = d.padStart(2, '0');
    return `${y}-${month}-${day}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  return undefined;
}

/**
 * Contagem 1: listagem com filtros (Estoque e Status em dropdowns, datas em linha), ações com ícones.
 */
export default function ContagensListScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const erp = useErpProvider();
  const { canDeleteCount } = usePermissions();
  const [counts, setCounts] = useState<Contagem[]>([]);
  const [stocks, setStocks] = useState<Estoque[]>([]);
  const [loading, setLoading] = useState(true);
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
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: theme.spacing.md,
          gap: theme.spacing.sm,
        },
        title: { flex: 1, ...theme.typography.titleSmall, color: theme.colors.text, textAlign: 'center' },
        filterCard: {
          marginBottom: theme.spacing.md,
          padding: theme.spacing.md,
          backgroundColor: theme.colors.backgroundCard,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        staleBanner: {
          marginBottom: theme.spacing.md,
          padding: theme.spacing.md,
          backgroundColor: theme.colors.borderLight,
          borderRadius: theme.radius.sm,
          borderLeftWidth: 4,
          borderLeftColor: theme.colors.cta,
        },
        staleBannerText: { ...theme.typography.bodySmall, color: theme.colors.text },
        filterRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          marginBottom: theme.spacing.sm,
        },
        filterApplyWrap: { flexShrink: 0 },
        dropdownTrigger: {
          flex: 1,
          minHeight: theme.minTouchSize,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing.sm,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.sm,
        },
        dropdownContent: { flex: 1, minWidth: 0 },
        dropdownLabel: { ...theme.typography.caption, color: theme.colors.textMuted },
        dropdownValue: { ...theme.typography.bodySmall, color: theme.colors.text },
        dropdownChevron: { fontSize: 10, color: theme.colors.textMuted },
        dateInput: {
          flex: 1,
          minWidth: 0,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.sm,
          padding: theme.spacing.sm,
          ...theme.typography.bodySmall,
          color: theme.colors.text,
        },
        tableScroll: { marginHorizontal: -theme.spacing.md },
        tableScrollContent: { paddingHorizontal: theme.spacing.md },
        table: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          overflow: 'hidden',
          alignSelf: 'flex-start',
        },
        tableRow: {
          flexDirection: 'row',
          padding: theme.spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        cellCode: { width: 52, minWidth: 52, ...theme.typography.bodySmall, color: theme.colors.text },
        cellStock: { width: 88, minWidth: 88, ...theme.typography.bodySmall, color: theme.colors.text },
        cellDate: { width: 96, minWidth: 96, ...theme.typography.bodySmall, color: theme.colors.text },
        cellStatus: { width: 110, minWidth: 110, ...theme.typography.bodySmall, color: theme.colors.text },
        cellActions: {
          width: 96,
          minWidth: 96,
          flexDirection: 'row',
          gap: theme.spacing.xs,
          alignItems: 'center',
        },
        cellHeader: { fontWeight: '600', backgroundColor: theme.colors.borderLight },
        empty: { padding: theme.spacing.md, color: theme.colors.textMuted },
      }),
    [theme]
  );

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
    } finally {
      setLoading(false);
    }
  }, [erp, appliedFilters.estoqueId, appliedFilters.status, appliedFilters.dataInicio, appliedFilters.dataFim]);

  useEffect(() => {
    load();
  }, [load]);

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

  const getStockName = (id: string) => stocks.find((s) => s.id === id)?.nome ?? id;
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');
  const formatEndDate = (c: Contagem) =>
    c.status === CountStatus.EM_ANDAMENTO ? '***' : (c.dataFinalizacao ? formatDate(c.dataFinalizacao) : '—');
  const statusLabel = (s: string) =>
    s === CountStatus.EM_ANDAMENTO ? t('counts.inProgress') : t('counts.finished');

  const stockOptions: SelectOption[] = stocks.map((s) => ({ value: s.id, label: s.nome }));
  const statusOptions: SelectOption[] = [
    { value: CountStatus.EM_ANDAMENTO, label: t('counts.inProgress') },
    { value: CountStatus.FINALIZADO, label: t('counts.finished') },
  ];

  const staleCounts = useMemo(() => {
    const cutoff = Date.now() - STALE_COUNT_DAYS * 86400000;
    return counts.filter(
      (c) =>
        c.status === CountStatus.EM_ANDAMENTO &&
        new Date(c.dataInicio).getTime() < cutoff
    );
  }, [counts]);

  const handleNewCount = () => router.push('/(app)/contagens/nova');
  const handleContinue = (id: string) => router.push(`/(app)/contagens/${id}` as any);
  const handleVerify = (id: string) => router.push(`/(app)/contagens/${id}` as any);
  const handleDelete = (id: string) => {
    Alert.alert(
      t('counts.deleteConfirmTitle'),
      t('counts.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('counts.delete'), style: 'destructive', onPress: async () => {
          await erp.deleteInventory(id);
          load();
        } },
      ]
    );
  };

  if (loading && counts.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <IconButton
          onPress={() => router.back()}
          icon="arrow-back"
          variant="ghost"
          accessibilityLabel={t('common.back')}
        />
        <Text style={styles.title}>{t('counts.title')}</Text>
        <IconButton
          onPress={handleNewCount}
          icon="add-circle"
          label={t('counts.newCount')}
          variant="primary"
          accessibilityLabel={t('counts.newCount')}
        />
      </View>

      <View style={styles.filterCard}>
        <View style={styles.filterRow}>
          <Pressable
            style={styles.dropdownTrigger}
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
            <Text style={styles.dropdownChevron}>▼</Text>
          </Pressable>
          <Pressable
            style={styles.dropdownTrigger}
            onPress={() => setStatusModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={`${t('counts.status')}: ${filterStatus ? statusLabel(filterStatus) : t('counts.allStatuses')}`}
          >
            <View style={styles.dropdownContent}>
              <Text style={styles.dropdownLabel}>{t('counts.status')}</Text>
              <Text style={styles.dropdownValue} numberOfLines={1}>
                {filterStatus ? statusLabel(filterStatus) : t('counts.allStatuses')}
              </Text>
            </View>
            <Text style={styles.dropdownChevron}>▼</Text>
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
          <View style={styles.filterApplyWrap}>
            <IconButton
              onPress={applyFilters}
              icon="checkmark-circle"
              variant="outline"
              accessibilityLabel={t('common.filter')}
            />
          </View>
        </View>
      </View>

      {staleCounts.length > 0 && (
        <View style={styles.staleBanner}>
          <Text style={styles.staleBannerText}>
            {t('counts.staleBanner', { count: staleCounts.length, days: STALE_COUNT_DAYS })}
          </Text>
        </View>
      )}

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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.tableScrollContent}
        style={styles.tableScroll}
      >
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.cellCode, styles.cellHeader]}>{t('counts.code')}</Text>
            <Text style={[styles.cellStock, styles.cellHeader]}>{t('counts.stock')}</Text>
            <Text style={[styles.cellDate, styles.cellHeader]}>{t('counts.startDate')}</Text>
            <Text style={[styles.cellDate, styles.cellHeader]}>{t('counts.endDate')}</Text>
            <Text style={[styles.cellStatus, styles.cellHeader]}>{t('counts.status')}</Text>
            <Text style={[styles.cellActions, styles.cellHeader]}>{t('counts.actions')}</Text>
          </View>
          {counts.length === 0 ? (
            <Text style={styles.empty}>{t('counts.title')} (vazio)</Text>
          ) : (
            counts.map((c) => (
              <View key={c.id} style={styles.tableRow}>
                <Text style={styles.cellCode} numberOfLines={1} ellipsizeMode="tail">{c.id}</Text>
                <Text style={styles.cellStock} numberOfLines={1} ellipsizeMode="tail">{getStockName(c.estoqueId)}</Text>
                <Text style={styles.cellDate} numberOfLines={1} ellipsizeMode="tail">{formatDate(c.dataInicio)}</Text>
                <Text style={styles.cellDate} numberOfLines={1} ellipsizeMode="tail">{formatEndDate(c)}</Text>
                <Text style={styles.cellStatus} numberOfLines={1} ellipsizeMode="tail">{statusLabel(c.status)}</Text>
                <View style={styles.cellActions}>
                {c.status === CountStatus.EM_ANDAMENTO && (
                  <IconButton
                    onPress={() => handleContinue(c.id)}
                    icon="play"
                    variant="ghost"
                    size={20}
                    accessibilityLabel={t('counts.continue')}
                  />
                )}
                {c.status === CountStatus.FINALIZADO && (
                  <IconButton
                    onPress={() => handleVerify(c.id)}
                    icon="eye"
                    variant="ghost"
                    size={20}
                    accessibilityLabel={t('counts.verify')}
                  />
                )}
                {canDeleteCount && (
                <IconButton
                  onPress={() => handleDelete(c.id)}
                  icon="trash-outline"
                  variant="ghostDanger"
                  size={20}
                  accessibilityLabel={t('counts.delete')}
                />
                )}
                </View>
              </View>
            )))
          }
        </View>
      </ScrollView>
    </ScrollView>
  );
}
