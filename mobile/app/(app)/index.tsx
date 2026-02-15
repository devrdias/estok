import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, UserRole } from '@/features/auth/model';
import { useErpProvider } from '@/shared/api';
import type { InventoryItem } from '@/shared/api/erp-provider-types';
import type { Contagem } from '@/entities/contagem/model/types';
import { CountStatus } from '@/entities/contagem/model/types';
import { useTheme } from '@/shared/config';
import { Card, Logo } from '@/shared/ui';

/** Return a time-based greeting key. */
function getGreetingKey(): string {
  const h = new Date().getHours();
  if (h < 12) return 'home.greetingMorning';
  if (h < 18) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

/** Get first name from full name. */
function getFirstName(name: string | null, email: string): string {
  if (name) {
    const first = name.trim().split(/\s+/)[0];
    return first ?? name;
  }
  return email.split('@')[0] ?? email;
}

interface DashboardSummary {
  activeCounts: number;
  finishedCounts: number;
  totalProducts: number;
  completionPct: number;
}

/** Per-user aggregated stats for the team activity section. */
interface UserCountSummary {
  userId: string;
  userName: string;
  activeCounts: number;
  totalProducts: number;
  countedProducts: number;
  pct: number;
}

/**
 * Home screen — dashboard with greeting, summary cards, quick actions, and recent counts.
 * Theme-aware (light/dark).
 */
export default function HomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const erp = useErpProvider();
  const isManagerView = user?.role === UserRole.MANAGER || user?.role === UserRole.ADMIN;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [counts, setCounts] = useState<Contagem[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({
    activeCounts: 0,
    finishedCounts: 0,
    totalProducts: 0,
    completionPct: 0,
  });
  const [userSummaries, setUserSummaries] = useState<UserCountSummary[]>([]);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const loadData = useCallback(async () => {
    try {
      const allCounts = await erp.listInventories({});
      setCounts(allCounts);

      const active = allCounts.filter((c) => c.status === CountStatus.EM_ANDAMENTO);
      const finished = allCounts.filter((c) => c.status === CountStatus.FINALIZADO);

      // Fetch items for active counts to compute completion + per-user stats
      let totalProducts = 0;
      let totalCounted = 0;

      /** Per-count item results paired with the count data. */
      const perCountData: { count: Contagem; items: InventoryItem[] }[] = [];

      const itemResults = await Promise.allSettled(
        active.map(async (c) => {
          const items: InventoryItem[] = await erp.listInventoryItems(c.id);
          return { count: c, items };
        }),
      );

      for (const r of itemResults) {
        if (r.status === 'fulfilled') {
          perCountData.push(r.value);
          totalProducts += r.value.items.length;
          totalCounted += r.value.items.filter((i) => i.qtdContada != null).length;
        }
      }

      const completionPct = totalProducts > 0 ? Math.round((totalCounted / totalProducts) * 100) : 0;

      setSummary({
        activeCounts: active.length,
        finishedCounts: finished.length,
        totalProducts,
        completionPct,
      });

      // Build per-user summaries (for manager view)
      const userMap = new Map<string, UserCountSummary>();
      for (const { count: c, items } of perCountData) {
        const uid = c.criadoPor ?? 'unknown';
        const uname = c.criadoPorNome ?? uid;
        const existing = userMap.get(uid);
        const counted = items.filter((i) => i.qtdContada != null).length;
        if (existing) {
          existing.activeCounts += 1;
          existing.totalProducts += items.length;
          existing.countedProducts += counted;
        } else {
          userMap.set(uid, {
            userId: uid,
            userName: uname,
            activeCounts: 1,
            totalProducts: items.length,
            countedProducts: counted,
            pct: 0,
          });
        }
      }
      // Compute percentages
      for (const u of userMap.values()) {
        u.pct = u.totalProducts > 0 ? Math.round((u.countedProducts / u.totalProducts) * 100) : 0;
      }
      setUserSummaries(
        Array.from(userMap.values()).sort((a, b) => b.activeCounts - a.activeCounts),
      );
    } finally {
      setLoading(false);
    }
  }, [erp]);

  /** Reload dashboard every time the Home tab gains focus (e.g. after finalizing a count). */
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const recentCounts = useMemo(
    () =>
      counts
        .filter((c) => c.status === CountStatus.EM_ANDAMENTO)
        .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
        .slice(0, 3),
    [counts],
  );

  const greeting = t(getGreetingKey());
  const firstName = user ? getFirstName(user.name, user.email) : '';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      {/* ── Greeting ── */}
      <View style={styles.greetingSection}>
        <Logo size={36} showWordmark accessibilityLabel="e-stok" />
        <View style={styles.greetingTextWrap}>
          <Text style={styles.greetingText}>
            {greeting}, <Text style={styles.greetingName}>{firstName}</Text>
          </Text>
        </View>
      </View>

      {/* ── Summary Cards ── */}
      <View style={styles.sectionHeader}>
        <Ionicons name="bar-chart-outline" size={16} color={theme.colors.textMuted} />
        <Text style={styles.sectionTitle}>{t('home.summary')}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : (
        <View style={styles.statsGrid}>
          <StatCard
            icon="pulse-outline"
            label={t('home.activeCounts')}
            value={String(summary.activeCounts)}
            color={theme.colors.secondary}
            theme={theme}
          />
          <StatCard
            icon="checkmark-done-outline"
            label={t('home.finishedCounts')}
            value={String(summary.finishedCounts)}
            color={theme.colors.cta}
            theme={theme}
          />
          <StatCard
            icon="cube-outline"
            label={t('home.totalProducts')}
            value={String(summary.totalProducts)}
            color={theme.colors.primary}
            theme={theme}
          />
          <StatCard
            icon="pie-chart-outline"
            label={t('home.completionRate')}
            value={`${summary.completionPct}%`}
            color={summary.completionPct >= 80 ? theme.colors.secondary : theme.colors.cta}
            theme={theme}
          />
        </View>
      )}

      {/* ── Quick Actions ── */}
      <View style={styles.sectionHeader}>
        <Ionicons name="flash-outline" size={16} color={theme.colors.textMuted} />
        <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [styles.actionCard, styles.actionCardPrimary, pressed && styles.actionPressed]}
          onPress={() => router.push('/(app)/contagens/nova')}
          accessibilityRole="button"
          accessibilityLabel={t('home.newCount')}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: theme.colors.white + '25' }]}>
            <Ionicons name="add-circle-outline" size={24} color={theme.colors.white} />
          </View>
          <Text style={styles.actionLabelPrimary}>{t('home.newCount')}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionCard, styles.actionCardSecondary, pressed && styles.actionPressed]}
          onPress={() => router.push('/(app)/contagens')}
          accessibilityRole="button"
          accessibilityLabel={t('home.viewCounts')}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: theme.colors.primary + '15' }]}>
            <Ionicons name="list-outline" size={24} color={theme.colors.primary} />
          </View>
          <Text style={styles.actionLabelSecondary}>{t('home.viewCounts')}</Text>
        </Pressable>
      </View>

      {/* ── Recent Activity ── */}
      <View style={styles.sectionHeader}>
        <Ionicons name="time-outline" size={16} color={theme.colors.textMuted} />
        <Text style={styles.sectionTitle}>{t('home.recentActivity')}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : recentCounts.length === 0 ? (
        <Card>
          <View style={styles.emptyRecent}>
            <Ionicons name="clipboard-outline" size={32} color={theme.colors.textMuted} style={{ opacity: 0.4 }} />
            <Text style={styles.emptyRecentTitle}>{t('home.noRecentActivity')}</Text>
            <Text style={styles.emptyRecentSubtitle}>{t('home.startCounting')}</Text>
          </View>
        </Card>
      ) : (
        <View style={styles.recentList}>
          {recentCounts.map((c) => (
            <RecentCountCard
              key={c.id}
              count={c}
              theme={theme}
              t={t}
              onPress={() => router.push(`/(app)/contagens/${c.id}` as never)}
              erp={erp}
            />
          ))}
        </View>
      )}

      {/* ── Team Activity (manager/admin only) ── */}
      {isManagerView && !loading && userSummaries.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={16} color={theme.colors.textMuted} />
            <Text style={styles.sectionTitle}>{t('home.teamActivity')}</Text>
          </View>
          <View style={styles.recentList}>
            {userSummaries.map((u) => (
              <UserSummaryCard key={u.userId} summary={u} theme={theme} t={t} />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

// ─── Stat Card ───────────────────────────────────────────────

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
  theme: ReturnType<typeof useTheme>;
}

function StatCard({ icon, label, value, color, theme }: StatCardProps) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flex: 1,
          minWidth: '45%',
          backgroundColor: theme.colors.backgroundCard,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadows.sm,
        },
        iconWrap: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: color + '15',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing.sm,
        },
        value: {
          fontSize: 24,
          fontWeight: '700',
          color: theme.colors.text,
          marginBottom: 2,
        },
        label: {
          ...theme.typography.caption,
          color: theme.colors.textMuted,
        },
      }),
    [theme, color],
  );

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

// ─── Recent Count Card ──────────────────────────────────────

interface RecentCountCardProps {
  count: Contagem;
  theme: ReturnType<typeof useTheme>;
  t: (key: string, opts?: Record<string, unknown>) => string;
  onPress: () => void;
  erp: ReturnType<typeof import('@/shared/api').useErpProvider>;
}

function RecentCountCard({ count, theme, t, onPress, erp }: RecentCountCardProps) {
  const [stockName, setStockName] = useState(count.estoqueId);
  const [progress, setProgress] = useState<{ counted: number; total: number } | null>(null);

  useEffect(() => {
    erp.getStock(count.estoqueId).then((s) => {
      if (s) setStockName(s.nome);
    });
    erp.listInventoryItems(count.id).then((items) => {
      const total = items.length;
      const counted = items.filter((i) => i.qtdContada != null).length;
      setProgress({ counted, total });
    });
  }, [count.id, count.estoqueId, erp]);

  const pct = progress && progress.total > 0 ? Math.round((progress.counted / progress.total) * 100) : 0;
  const isActive = count.status === CountStatus.EM_ANDAMENTO;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: theme.colors.backgroundCard,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderLeftWidth: 4,
          borderLeftColor: isActive ? theme.colors.secondary : theme.colors.cta,
          ...theme.shadows.sm,
        },
        pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
        topRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.sm,
        },
        stockName: {
          ...theme.typography.body,
          fontWeight: '600',
          color: theme.colors.text,
          flex: 1,
        },
        idBadge: {
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: theme.radius.sm,
          backgroundColor: (isActive ? theme.colors.secondary : theme.colors.cta) + '15',
        },
        idText: {
          ...theme.typography.caption,
          fontWeight: '700',
          color: isActive ? theme.colors.secondary : theme.colors.cta,
        },
        progressRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        },
        progressLabel: {
          ...theme.typography.caption,
          color: theme.colors.textMuted,
        },
        progressPct: {
          ...theme.typography.caption,
          fontWeight: '700',
          color: isActive ? theme.colors.secondary : theme.colors.cta,
        },
        bar: {
          height: 5,
          borderRadius: 3,
          backgroundColor: theme.colors.border,
          overflow: 'hidden' as const,
        },
        barFill: {
          height: '100%',
          borderRadius: 3,
          backgroundColor: isActive ? theme.colors.secondary : theme.colors.cta,
        },
        bottomRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: theme.spacing.sm,
        },
        dateText: {
          ...theme.typography.caption,
          color: theme.colors.textMuted,
        },
        continueBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 12,
          paddingVertical: 5,
          borderRadius: theme.radius.md,
          backgroundColor: isActive ? theme.colors.secondary : theme.colors.cta,
        },
        continueBtnText: {
          ...theme.typography.caption,
          fontWeight: '600',
          color: theme.colors.white,
        },
      }),
    [theme, isActive],
  );

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${stockName} #${count.id}`}
    >
      <View style={styles.topRow}>
        <Text style={styles.stockName} numberOfLines={1}>{stockName}</Text>
        <View style={styles.idBadge}>
          <Text style={styles.idText}>#{count.id}</Text>
        </View>
      </View>

      {progress && (
        <>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>
              {t('counts.productsProgress', { counted: progress.counted, total: progress.total })}
            </Text>
            <Text style={styles.progressPct}>{pct}%</Text>
          </View>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${Math.min(pct, 100)}%` }]} />
          </View>
        </>
      )}

      <View style={styles.bottomRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="time-outline" size={12} color={theme.colors.textMuted} />
          <Text style={styles.dateText}>
            {new Date(count.dataInicio).toLocaleDateString('pt-BR')}
          </Text>
        </View>
        <View style={styles.continueBtn}>
          <Ionicons name={isActive ? 'play' : 'eye'} size={12} color={theme.colors.white} />
          <Text style={styles.continueBtnText}>
            {isActive ? t('home.continueCount') : t('home.viewCount')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── User Summary Card (manager view) ───────────────────────

interface UserSummaryCardProps {
  summary: UserCountSummary;
  theme: ReturnType<typeof useTheme>;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

/** Extract initials from a name (up to 2 characters). */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function UserSummaryCard({ summary: u, theme, t }: UserSummaryCardProps) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: theme.colors.backgroundCard,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadows.sm,
        },
        topRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          marginBottom: theme.spacing.sm,
        },
        avatar: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: theme.colors.cta + '18',
          alignItems: 'center',
          justifyContent: 'center',
        },
        avatarText: {
          fontSize: 13,
          fontWeight: '700',
          color: theme.colors.cta,
        },
        nameArea: {
          flex: 1,
        },
        userName: {
          ...theme.typography.body,
          fontWeight: '600',
          color: theme.colors.text,
        },
        countsBadge: {
          ...theme.typography.caption,
          color: theme.colors.textMuted,
        },
        progressRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        },
        progressLabel: {
          ...theme.typography.caption,
          color: theme.colors.textMuted,
        },
        progressPct: {
          ...theme.typography.caption,
          fontWeight: '700',
          color: u.pct >= 80 ? theme.colors.secondary : theme.colors.cta,
        },
        bar: {
          height: 5,
          borderRadius: 3,
          backgroundColor: theme.colors.border,
          overflow: 'hidden' as const,
        },
        barFill: {
          height: '100%',
          borderRadius: 3,
          backgroundColor: u.pct >= 80 ? theme.colors.secondary : theme.colors.cta,
        },
      }),
    [theme, u.pct],
  );

  const countsLabel = t(
    u.activeCounts === 1 ? 'home.activeCountsLabel_one' : 'home.activeCountsLabel_other',
    { count: u.activeCounts },
  );

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(u.userName)}</Text>
        </View>
        <View style={styles.nameArea}>
          <Text style={styles.userName} numberOfLines={1}>{u.userName}</Text>
          <Text style={styles.countsBadge}>{countsLabel}</Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>
          {t('home.productsLabel', { counted: u.countedProducts, total: u.totalProducts })}
        </Text>
        <Text style={styles.progressPct}>{u.pct}%</Text>
      </View>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${Math.min(u.pct, 100)}%` }]} />
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: theme.colors.background },
    container: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing['3xl'],
    },

    /* ── Greeting ── */
    greetingSection: {
      marginBottom: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    greetingTextWrap: {
      marginTop: theme.spacing.xs,
    },
    greetingText: {
      ...theme.typography.title,
      color: theme.colors.text,
    },
    greetingName: {
      color: theme.colors.primary,
    },

    /* ── Section headers ── */
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
    sectionTitle: {
      ...theme.typography.section,
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    /* ── Summary grid ── */
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },

    /* ── Quick actions ── */
    actionsRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    actionCard: {
      flex: 1,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      alignItems: 'center',
      gap: theme.spacing.sm,
      ...theme.shadows.md,
    },
    actionCardPrimary: {
      backgroundColor: theme.colors.cta,
    },
    actionCardSecondary: {
      backgroundColor: theme.colors.backgroundCard,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    actionPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.97 }],
    },
    actionIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionLabelPrimary: {
      ...theme.typography.bodySmall,
      fontWeight: '600',
      color: theme.colors.white,
      textAlign: 'center',
    },
    actionLabelSecondary: {
      ...theme.typography.bodySmall,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
    },

    /* ── Recent activity ── */
    recentList: {
      gap: theme.spacing.sm,
    },
    emptyRecent: {
      alignItems: 'center',
      paddingVertical: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    emptyRecentTitle: {
      ...theme.typography.body,
      color: theme.colors.textMuted,
    },
    emptyRecentSubtitle: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
    },

    /* ── Loading ── */
    loadingWrap: {
      paddingVertical: theme.spacing.xl,
      alignItems: 'center',
    },
  });
}
