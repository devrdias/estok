import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/config';
import { Button, Card, SegmentedControl } from '@/shared/ui';
import {
  getMockConfig,
  setMockConfig,
  resetMockConfig,
  onMockConfigChange,
  ApiLatency,
  ErrorRate,
  PdvScenario,
  ProductCount,
  StoreSize,
} from '@/shared/api/mock-config';
import type {
  MockConfig,
  ApiLatencyValue,
  ErrorRateValue,
  PdvScenarioValue,
  ProductCountValue,
  StoreSizeValue,
} from '@/shared/api/mock-config';
import { applyPdvScenario, resetMockData } from '@/shared/api/mock-erp-provider';
import { generateStoreData, getStoreSummary } from '@/shared/api/mock-store-generator';
import type { GeneratedStoreData } from '@/shared/api/mock-store-generator';

const CPLUG_API_URL = 'https://cplug.redocly.app/openapi';

/**
 * Maps ErpProvider methods to CPlug API endpoints for the reference card.
 * Shows which mock functions correspond to which real API calls.
 */
const API_ENDPOINT_MAP = [
  { method: 'listStocks', endpoint: 'GET /api/v3/stocks', icon: 'cube-outline' as const },
  { method: 'getStock', endpoint: 'GET /api/v3/stocks/{id}', icon: 'cube-outline' as const },
  { method: 'listEstruturas', endpoint: 'GET /api/v3/categories', icon: 'pricetags-outline' as const },
  { method: 'listInventories', endpoint: 'GET /api/v3/stocks/{id}/inventories', icon: 'clipboard-outline' as const },
  { method: 'createInventory', endpoint: 'POST /api/v3/stocks/{id}/inventories', icon: 'add-circle-outline' as const },
  { method: 'updateInventory', endpoint: 'PUT /api/v3/stocks/{id}/inventories/{id}', icon: 'create-outline' as const },
  { method: 'deleteInventory', endpoint: 'DELETE /api/v3/stocks/{id}/inventories/{id}', icon: 'trash-outline' as const },
  { method: 'listInventoryItems', endpoint: 'GET .../inventories/{id}/items', icon: 'list-outline' as const },
  { method: 'registerQuantity', endpoint: 'PUT .../inventories/{id}/items', icon: 'checkmark-circle-outline' as const },
  { method: 'listPdvs', endpoint: 'GET /api/v3/pos/drawer-list', icon: 'desktop-outline' as const },
];

/**
 * Development screen to configure mock ERP behavior at runtime.
 * Allows testing: API latency, error simulation, product volume, PDV scenarios.
 * Hidden from the tab bar (href: null in layout); accessed via Settings > Dev Tools.
 */
export default function MockConfigScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [config, setConfig] = useState<MockConfig>(getMockConfig());

  // Subscribe to external config changes
  useEffect(() => {
    const unsub = onMockConfigChange(setConfig);
    return unsub;
  }, []);

  const updateConfig = useCallback(
    (patch: Partial<MockConfig>) => {
      setMockConfig(patch);
      // PDV scenario changes need to be applied immediately
      if (patch.pdvScenario) {
        setTimeout(() => applyPdvScenario(), 0);
      }
    },
    [],
  );

  /** Changing store size requires a full data reset since all reference data changes. */
  const handleStoreSizeChange = useCallback(
    (newSize: StoreSizeValue) => {
      if (newSize === config.storeSize) return;
      Alert.alert(
        t('mockConfig.resetConfirmTitle'),
        t('mockConfig.storeSizeChangeHint'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.ok'),
            style: 'destructive',
            onPress: () => {
              setMockConfig({ storeSize: newSize });
              resetMockData();
            },
          },
        ],
      );
    },
    [config.storeSize, t],
  );

  const handleReset = useCallback(() => {
    Alert.alert(
      t('mockConfig.resetConfirmTitle'),
      t('mockConfig.resetConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.ok'),
          style: 'destructive',
          onPress: () => {
            resetMockConfig();
            resetMockData();
          },
        },
      ],
    );
  }, [t]);

  const storeSummary = useMemo(() => getStoreSummary(config.storeSize), [config.storeSize]);

  /** Generated store data for the preview section. */
  const storeData: GeneratedStoreData = useMemo(
    () => generateStoreData(config.storeSize),
    [config.storeSize],
  );

  /** Track which preview sections are expanded. */
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const toggleSection = useCallback((key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ─── Options ──────────────────────────────────────────────

  const latencyOptions = useMemo(
    () => [
      { value: String(ApiLatency.NONE), label: t('mockConfig.none') },
      { value: String(ApiLatency.FAST), label: '500ms' },
      { value: String(ApiLatency.MEDIUM), label: '1s' },
      { value: String(ApiLatency.SLOW), label: '2s' },
      { value: String(ApiLatency.VERY_SLOW), label: '5s' },
    ],
    [t],
  );

  const errorRateOptions = useMemo(
    () => [
      { value: ErrorRate.NEVER, label: t('mockConfig.never') },
      { value: ErrorRate.LOW, label: t('mockConfig.low') },
      { value: ErrorRate.HIGH, label: t('mockConfig.high') },
      { value: ErrorRate.ALWAYS, label: t('mockConfig.always') },
    ],
    [t],
  );

  const productCountOptions = useMemo(
    () => [
      { value: String(ProductCount.FEW), label: '3' },
      { value: String(ProductCount.SOME), label: '10' },
      { value: String(ProductCount.MANY), label: '50' },
      { value: String(ProductCount.LOTS), label: '100' },
    ],
    [],
  );

  const pdvScenarioOptions = useMemo(
    () => [
      { value: PdvScenario.ALL_ONLINE, label: t('mockConfig.allOnline') },
      { value: PdvScenario.MIXED, label: t('mockConfig.mixed') },
      { value: PdvScenario.ALL_OFFLINE, label: t('mockConfig.allOffline') },
    ],
    [t],
  );

  const storeSizeOptions = useMemo(
    () => [
      { value: StoreSize.SMALL, label: t('mockConfig.storeSizeSmall') },
      { value: StoreSize.MEDIUM, label: t('mockConfig.storeSizeMedium') },
      { value: StoreSize.LARGE, label: t('mockConfig.storeSizeLarge') },
    ],
    [t],
  );

  // ─── Styles ───────────────────────────────────────────────

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: { flex: 1, backgroundColor: theme.colors.background },
        container: {
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing['3xl'],
        },
        /* ── Header ── */
        headerCard: {
          alignItems: 'center',
          paddingVertical: theme.spacing.xl,
          paddingHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.lg,
        },
        headerIconContainer: {
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: theme.colors.primary + '18',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing.md,
        },
        headerTitle: {
          ...theme.typography.title,
          color: theme.colors.text,
          textAlign: 'center',
          marginBottom: theme.spacing.xs,
        },
        headerSubtitle: {
          ...theme.typography.bodySmall,
          color: theme.colors.textMuted,
          textAlign: 'center',
        },
        /* ── Sections ── */
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          marginBottom: theme.spacing.md,
          marginTop: theme.spacing.md,
        },
        sectionTitle: {
          ...theme.typography.section,
          color: theme.colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        settingsCard: {
          gap: 0,
          padding: 0,
          overflow: 'hidden',
        },
        /* ── Setting rows ── */
        settingRow: {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
        },
        settingRowBorder: {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
        },
        settingLabel: {
          ...theme.typography.body,
          color: theme.colors.text,
          fontWeight: '500',
          marginBottom: theme.spacing.xs,
        },
        settingDescription: {
          ...theme.typography.caption,
          color: theme.colors.textMuted,
          marginBottom: theme.spacing.sm,
        },
        /* ── Active indicator ── */
        activeTag: {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 12,
          marginBottom: theme.spacing.sm,
        },
        activeTagWarning: {
          backgroundColor: theme.colors.danger + '18',
        },
        activeTagOk: {
          backgroundColor: theme.colors.primary + '18',
        },
        activeTagText: {
          ...theme.typography.caption,
          fontWeight: '600',
        },
        activeTagTextWarning: {
          color: theme.colors.danger,
        },
        activeTagTextOk: {
          color: theme.colors.primary,
        },
        /* ── Summary row ── */
        summaryRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginTop: theme.spacing.sm,
          paddingTop: theme.spacing.sm,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.border,
        },
        summaryText: {
          ...theme.typography.caption,
          color: theme.colors.textMuted,
          flex: 1,
        },
        /* ── Collapsible preview ── */
        previewHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
        },
        previewHeaderLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          flex: 1,
        },
        previewHeaderLabel: {
          ...theme.typography.body,
          color: theme.colors.text,
          fontWeight: '500',
        },
        previewHeaderCount: {
          ...theme.typography.caption,
          color: theme.colors.textMuted,
        },
        previewContent: {
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.md,
        },
        previewItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          paddingVertical: 6,
        },
        previewItemDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
        },
        previewItemText: {
          ...theme.typography.caption,
          color: theme.colors.text,
          flex: 1,
        },
        previewItemMeta: {
          ...theme.typography.caption,
          color: theme.colors.textMuted,
        },
        previewMore: {
          ...theme.typography.caption,
          color: theme.colors.primary,
          fontStyle: 'italic',
          marginTop: 4,
        },
        /* ── API reference ── */
        apiRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          paddingVertical: 5,
          paddingHorizontal: theme.spacing.lg,
        },
        apiMethod: {
          ...theme.typography.caption,
          color: theme.colors.primary,
          fontWeight: '600',
          width: 110,
        },
        apiEndpoint: {
          ...theme.typography.caption,
          color: theme.colors.textMuted,
          flex: 1,
          fontFamily: 'monospace',
          fontSize: 11,
        },
        apiLinkCard: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.sm,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
        },
        apiLinkText: {
          ...theme.typography.bodySmall,
          color: theme.colors.primary,
          fontWeight: '600',
        },
        /* ── Footer ── */
        footer: {
          marginTop: theme.spacing.xl,
          gap: theme.spacing.md,
        },
        resetDescription: {
          ...theme.typography.caption,
          color: theme.colors.textMuted,
          textAlign: 'center',
          marginBottom: theme.spacing.sm,
        },
      }),
    [theme],
  );

  // ─── Helpers ──────────────────────────────────────────────

  const hasActiveSimulation =
    config.apiLatency > 0 || config.errorRate !== ErrorRate.NEVER;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* ── Header ── */}
      <Card style={styles.headerCard}>
        <View style={styles.headerIconContainer}>
          <Ionicons name="construct" size={32} color={theme.colors.primary} />
        </View>
        <Text style={styles.headerTitle}>{t('mockConfig.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('mockConfig.subtitle')}</Text>
        {hasActiveSimulation && (
          <View style={[styles.activeTag, styles.activeTagWarning, { marginTop: theme.spacing.md }]}>
            <Ionicons name="warning" size={12} color={theme.colors.danger} />
            <Text style={[styles.activeTagText, styles.activeTagTextWarning]}>
              {config.apiLatency > 0 ? `${config.apiLatency}ms latency` : ''}
              {config.apiLatency > 0 && config.errorRate !== ErrorRate.NEVER ? ' + ' : ''}
              {config.errorRate !== ErrorRate.NEVER ? `${config.errorRate} errors` : ''}
            </Text>
          </View>
        )}
      </Card>

      {/* ── Store Section ── */}
      <View style={styles.sectionHeader}>
        <Ionicons name="storefront-outline" size={16} color={theme.colors.textMuted} />
        <Text style={styles.sectionTitle}>{t('mockConfig.storeSection')}</Text>
      </View>
      <Card style={styles.settingsCard}>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t('mockConfig.storeSize')}</Text>
          <Text style={styles.settingDescription}>
            {t('mockConfig.storeSizeDescription')}
          </Text>
          <SegmentedControl
            options={storeSizeOptions}
            selectedValue={config.storeSize}
            onSelect={(value) => handleStoreSizeChange(value as StoreSizeValue)}
            accessibilityLabel={t('mockConfig.storeSize')}
          />
          <View style={styles.summaryRow}>
            <Ionicons name="information-circle-outline" size={14} color={theme.colors.textMuted} />
            <Text style={styles.summaryText}>
              {t('mockConfig.storeSummary', storeSummary)}
            </Text>
          </View>
        </View>
      </Card>

      {/* ── Network Section ── */}
      <View style={styles.sectionHeader}>
        <Ionicons name="cloud-outline" size={16} color={theme.colors.textMuted} />
        <Text style={styles.sectionTitle}>{t('mockConfig.networkSection')}</Text>
      </View>
      <Card style={styles.settingsCard}>
        {/* API Latency */}
        <View style={[styles.settingRow, styles.settingRowBorder]}>
          <Text style={styles.settingLabel}>{t('mockConfig.apiLatency')}</Text>
          <Text style={styles.settingDescription}>
            {t('mockConfig.apiLatencyDescription')}
          </Text>
          <SegmentedControl
            options={latencyOptions}
            selectedValue={String(config.apiLatency)}
            onSelect={(value) =>
              updateConfig({ apiLatency: Number(value) as ApiLatencyValue })
            }
            accessibilityLabel={t('mockConfig.apiLatency')}
          />
        </View>

        {/* Error Rate */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t('mockConfig.errorRate')}</Text>
          <Text style={styles.settingDescription}>
            {t('mockConfig.errorRateDescription')}
          </Text>
          <SegmentedControl
            options={errorRateOptions}
            selectedValue={config.errorRate}
            onSelect={(value) =>
              updateConfig({ errorRate: value as ErrorRateValue })
            }
            accessibilityLabel={t('mockConfig.errorRate')}
          />
        </View>
      </Card>

      {/* ── Data Section ── */}
      <View style={styles.sectionHeader}>
        <Ionicons name="server-outline" size={16} color={theme.colors.textMuted} />
        <Text style={styles.sectionTitle}>{t('mockConfig.dataSection')}</Text>
      </View>
      <Card style={styles.settingsCard}>
        {/* Product Count */}
        <View style={[styles.settingRow, styles.settingRowBorder]}>
          <Text style={styles.settingLabel}>{t('mockConfig.productCount')}</Text>
          <Text style={styles.settingDescription}>
            {t('mockConfig.productCountDescription')}
          </Text>
          <SegmentedControl
            options={productCountOptions}
            selectedValue={String(config.productCount)}
            onSelect={(value) =>
              updateConfig({ productCount: Number(value) as ProductCountValue })
            }
            accessibilityLabel={t('mockConfig.productCount')}
          />
        </View>

        {/* PDV Scenario */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t('mockConfig.pdvScenario')}</Text>
          <Text style={styles.settingDescription}>
            {t('mockConfig.pdvScenarioDescription')}
          </Text>
          <SegmentedControl
            options={pdvScenarioOptions}
            selectedValue={config.pdvScenario}
            onSelect={(value) =>
              updateConfig({ pdvScenario: value as PdvScenarioValue })
            }
            accessibilityLabel={t('mockConfig.pdvScenario')}
          />
        </View>
      </Card>

      {/* ── Data Preview Section ── */}
      <View style={styles.sectionHeader}>
        <Ionicons name="eye-outline" size={16} color={theme.colors.textMuted} />
        <Text style={styles.sectionTitle}>{t('mockConfig.previewSection')}</Text>
      </View>
      <Card style={styles.settingsCard}>
        {/* Stocks */}
        <Pressable
          onPress={() => toggleSection('stocks')}
          style={[styles.previewHeader, styles.settingRowBorder]}
          accessibilityRole="button"
          accessibilityLabel={t('mockConfig.previewStocks')}
        >
          <View style={styles.previewHeaderLeft}>
            <Ionicons name="cube-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.previewHeaderLabel}>{t('mockConfig.previewStocks')}</Text>
            <Text style={styles.previewHeaderCount}>({storeData.stocks.length})</Text>
          </View>
          <Ionicons
            name={expandedSections.stocks ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={theme.colors.textMuted}
          />
        </Pressable>
        {expandedSections.stocks && (
          <View style={styles.previewContent}>
            {storeData.stocks.map((stock) => {
              const pdvCount = storeData.pdvs.filter((p) => p.estoqueId === stock.id).length;
              return (
                <View key={stock.id} style={styles.previewItem}>
                  <View style={[styles.previewItemDot, { backgroundColor: theme.colors.primary }]} />
                  <Text style={styles.previewItemText}>{stock.nome}</Text>
                  <Text style={styles.previewItemMeta}>
                    {pdvCount} PDV(s) · {stock.id}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* PDVs */}
        <Pressable
          onPress={() => toggleSection('pdvs')}
          style={[styles.previewHeader, styles.settingRowBorder]}
          accessibilityRole="button"
          accessibilityLabel={t('mockConfig.previewPdvs')}
        >
          <View style={styles.previewHeaderLeft}>
            <Ionicons name="desktop-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.previewHeaderLabel}>{t('mockConfig.previewPdvs')}</Text>
            <Text style={styles.previewHeaderCount}>({storeData.pdvs.length})</Text>
          </View>
          <Ionicons
            name={expandedSections.pdvs ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={theme.colors.textMuted}
          />
        </Pressable>
        {expandedSections.pdvs && (
          <View style={styles.previewContent}>
            {storeData.pdvs.map((pdv) => (
              <View key={pdv.id} style={styles.previewItem}>
                <View
                  style={[
                    styles.previewItemDot,
                    { backgroundColor: pdv.status === 'ONLINE' ? theme.colors.primary : theme.colors.danger },
                  ]}
                />
                <Text style={styles.previewItemText}>{pdv.nome}</Text>
                <Text style={styles.previewItemMeta}>
                  {pdv.status} · {pdv.endereco} · {pdv.estoqueId}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Categories */}
        <Pressable
          onPress={() => toggleSection('categories')}
          style={[styles.previewHeader, styles.settingRowBorder]}
          accessibilityRole="button"
          accessibilityLabel={t('mockConfig.previewCategories')}
        >
          <View style={styles.previewHeaderLeft}>
            <Ionicons name="pricetags-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.previewHeaderLabel}>{t('mockConfig.previewCategories')}</Text>
            <Text style={styles.previewHeaderCount}>({storeData.categories.length})</Text>
          </View>
          <Ionicons
            name={expandedSections.categories ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={theme.colors.textMuted}
          />
        </Pressable>
        {expandedSections.categories && (
          <View style={styles.previewContent}>
            {storeData.categories.map((cat) => {
              const productCount = storeData.catalog.filter((p) => p.categoriaId === cat.id).length;
              return (
                <View key={cat.id} style={styles.previewItem}>
                  <View style={[styles.previewItemDot, { backgroundColor: theme.colors.primary }]} />
                  <Text style={styles.previewItemText}>{cat.nome}</Text>
                  <Text style={styles.previewItemMeta}>
                    {productCount} {t('mockConfig.previewProducts').toLowerCase()}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Product Catalog (show first 15) */}
        <Pressable
          onPress={() => toggleSection('catalog')}
          style={styles.previewHeader}
          accessibilityRole="button"
          accessibilityLabel={t('mockConfig.previewProducts')}
        >
          <View style={styles.previewHeaderLeft}>
            <Ionicons name="cart-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.previewHeaderLabel}>{t('mockConfig.previewProducts')}</Text>
            <Text style={styles.previewHeaderCount}>({storeData.catalog.length})</Text>
          </View>
          <Ionicons
            name={expandedSections.catalog ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={theme.colors.textMuted}
          />
        </Pressable>
        {expandedSections.catalog && (
          <View style={styles.previewContent}>
            {storeData.catalog.slice(0, 15).map((product) => (
              <View key={product.produtoId} style={styles.previewItem}>
                <View style={[styles.previewItemDot, { backgroundColor: theme.colors.textMuted }]} />
                <Text style={styles.previewItemText} numberOfLines={1}>
                  {product.produtoNome}
                </Text>
                <Text style={styles.previewItemMeta}>
                  R$ {product.valorUnitario.toFixed(2)}
                </Text>
              </View>
            ))}
            {storeData.catalog.length > 15 && (
              <Text style={styles.previewMore}>
                +{storeData.catalog.length - 15} {t('mockConfig.previewMoreProducts')}
              </Text>
            )}
          </View>
        )}
      </Card>

      {/* ── API Reference Section ── */}
      <View style={styles.sectionHeader}>
        <Ionicons name="code-slash-outline" size={16} color={theme.colors.textMuted} />
        <Text style={styles.sectionTitle}>{t('mockConfig.apiSection')}</Text>
      </View>
      <Card style={styles.settingsCard}>
        {API_ENDPOINT_MAP.map((entry, index) => (
          <View
            key={entry.method}
            style={[
              styles.apiRow,
              index < API_ENDPOINT_MAP.length - 1 && styles.settingRowBorder,
            ]}
          >
            <Ionicons name={entry.icon} size={12} color={theme.colors.primary} />
            <Text style={styles.apiMethod}>{entry.method}</Text>
            <Text style={styles.apiEndpoint} numberOfLines={1}>{entry.endpoint}</Text>
          </View>
        ))}
      </Card>
      <Pressable
        onPress={() => Linking.openURL(CPLUG_API_URL)}
        accessibilityRole="link"
        accessibilityLabel={t('mockConfig.apiDocsLink')}
      >
        <Card style={styles.apiLinkCard}>
          <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.apiLinkText}>{t('mockConfig.apiDocsLink')}</Text>
        </Card>
      </Pressable>

      {/* ── Actions Section ── */}
      <View style={styles.sectionHeader}>
        <Ionicons name="flash-outline" size={16} color={theme.colors.textMuted} />
        <Text style={styles.sectionTitle}>{t('mockConfig.actionsSection')}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.resetDescription}>
          {t('mockConfig.resetDataDescription')}
        </Text>
        <Button
          onPress={handleReset}
          variant="danger"
          fullWidth
          accessibilityLabel={t('mockConfig.resetData')}
        >
          {t('mockConfig.resetData')}
        </Button>
      </View>
    </ScrollView>
  );
}
