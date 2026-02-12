/**
 * User preferences persisted locally (Phase 2: configurable product list order, theme).
 */
import * as SecureStore from 'expo-secure-store';

const PRODUCT_SORT_ORDER_KEY = 'app_count_product_sort';
const THEME_PREFERENCE_KEY = 'app_theme_preference';
const BLIND_COUNT_KEY = 'app_blind_count';

/** User preference: follow system, or force light/dark. */
export type ThemePreferenceValue = 'system' | 'light' | 'dark';

const DEFAULT_THEME_PREFERENCE: ThemePreferenceValue = 'system';

export async function getStoredThemePreference(): Promise<ThemePreferenceValue> {
  try {
    const value = await SecureStore.getItemAsync(THEME_PREFERENCE_KEY);
    if (value === 'system' || value === 'light' || value === 'dark') return value;
  } catch {
    // ignore
  }
  return DEFAULT_THEME_PREFERENCE;
}

export async function setStoredThemePreference(preference: ThemePreferenceValue): Promise<void> {
  try {
    await SecureStore.setItemAsync(THEME_PREFERENCE_KEY, preference);
  } catch {
    // ignore
  }
}

export const ProductSortOrder = {
  NOME: 'nome',
  CODIGO: 'codigo',
  VALOR: 'valor',
} as const;

export type ProductSortOrderValue = (typeof ProductSortOrder)[keyof typeof ProductSortOrder];

const DEFAULT_PRODUCT_SORT: ProductSortOrderValue = 'nome';

export async function getStoredProductSortOrder(): Promise<ProductSortOrderValue> {
  try {
    const value = await SecureStore.getItemAsync(PRODUCT_SORT_ORDER_KEY);
    if (value === ProductSortOrder.NOME || value === ProductSortOrder.CODIGO || value === ProductSortOrder.VALOR) {
      return value;
    }
  } catch {
    // ignore
  }
  return DEFAULT_PRODUCT_SORT;
}

export async function setStoredProductSortOrder(order: ProductSortOrderValue): Promise<void> {
  try {
    await SecureStore.setItemAsync(PRODUCT_SORT_ORDER_KEY, order);
  } catch {
    // ignore
  }
}

// --- Contagem às cegas (blind count): hides system quantity during count ---

const DEFAULT_BLIND_COUNT = false;

/**
 * Read persisted blind-count preference.
 * When enabled, the system quantity is hidden during counting.
 */
export async function getStoredBlindCount(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(BLIND_COUNT_KEY);
    if (value === 'true') return true;
    if (value === 'false') return false;
  } catch {
    // ignore
  }
  return DEFAULT_BLIND_COUNT;
}

/**
 * Persist blind-count preference.
 * @param enabled - Whether blind count mode is active.
 */
export async function setStoredBlindCount(enabled: boolean): Promise<void> {
  try {
    await SecureStore.setItemAsync(BLIND_COUNT_KEY, String(enabled));
  } catch {
    // ignore
  }
}

// --- Filtros salvos na listagem de contagens (Fase 2) ---

const COUNT_LIST_FILTERS_KEY = 'app_count_list_filters';

export interface StoredCountListFilters {
  estoqueId?: string;
  status?: string;
  dataInicio?: string;
  dataFim?: string;
}

export async function getStoredCountListFilters(): Promise<StoredCountListFilters> {
  try {
    const raw = await SecureStore.getItemAsync(COUNT_LIST_FILTERS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredCountListFilters;
    if (typeof parsed !== 'object' || parsed === null) return {};
    return {
      ...(parsed.estoqueId && { estoqueId: String(parsed.estoqueId) }),
      ...(parsed.status && { status: String(parsed.status) }),
      ...(parsed.dataInicio && { dataInicio: String(parsed.dataInicio) }),
      ...(parsed.dataFim && { dataFim: String(parsed.dataFim) }),
    };
  } catch {
    return {};
  }
}

export async function setStoredCountListFilters(filters: StoredCountListFilters): Promise<void> {
  try {
    await SecureStore.setItemAsync(COUNT_LIST_FILTERS_KEY, JSON.stringify(filters));
  } catch {
    // ignore
  }
}

/** Convert YYYY-MM-DD to DD/MM/YYYY for date input display. */
export function isoToDisplayDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
}
