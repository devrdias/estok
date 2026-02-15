import { Platform } from 'react-native';
import type { StoreSizeValue } from './mock-store-generator';
import { StoreSize } from './mock-store-generator';

// ─── Types ───────────────────────────────────────────────────

/** Simulated API latency in milliseconds. */
const ApiLatency = {
  NONE: 0,
  FAST: 500,
  MEDIUM: 1000,
  SLOW: 2000,
  VERY_SLOW: 5000,
} as const;

type ApiLatencyValue = (typeof ApiLatency)[keyof typeof ApiLatency];

/** How often mock API calls should fail with a simulated error. */
const ErrorRate = {
  NEVER: 'never',
  LOW: 'low',       // ~20%
  HIGH: 'high',     // ~50%
  ALWAYS: 'always',
} as const;

type ErrorRateValue = (typeof ErrorRate)[keyof typeof ErrorRate];

/** PDV scenario preset. */
const PdvScenario = {
  ALL_ONLINE: 'all_online',
  MIXED: 'mixed',
  ALL_OFFLINE: 'all_offline',
} as const;

type PdvScenarioValue = (typeof PdvScenario)[keyof typeof PdvScenario];

/** Number of products seeded per new inventory. */
const ProductCount = {
  FEW: 3,
  SOME: 10,
  MANY: 50,
  LOTS: 100,
} as const;

type ProductCountValue = (typeof ProductCount)[keyof typeof ProductCount];

/** Full mock configuration shape. */
interface MockConfig {
  apiLatency: ApiLatencyValue;
  errorRate: ErrorRateValue;
  pdvScenario: PdvScenarioValue;
  productCount: ProductCountValue;
  /** Store size determines number of stocks, PDVs, categories, and product catalog. */
  storeSize: StoreSizeValue;
}

// ─── Storage ─────────────────────────────────────────────────

const STORAGE_KEY = 'mock_config';

const configStorage = {
  get(): string | null {
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        return localStorage.getItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
    return null;
  },
  set(value: string): void {
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, value);
      }
    } catch {
      // ignore
    }
  },
};

// ─── Default config ──────────────────────────────────────────

const DEFAULT_CONFIG: MockConfig = {
  apiLatency: ApiLatency.NONE,
  errorRate: ErrorRate.NEVER,
  pdvScenario: PdvScenario.MIXED,
  productCount: ProductCount.SOME,
  storeSize: StoreSize.MEDIUM,
};

// ─── In-memory state ─────────────────────────────────────────

let currentConfig: MockConfig = { ...DEFAULT_CONFIG };

/** Listeners notified on config change. */
type ConfigListener = (config: MockConfig) => void;
const listeners = new Set<ConfigListener>();

// ─── Restore from storage on module load ─────────────────────

function restoreConfig(): void {
  const raw = configStorage.get();
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as Partial<MockConfig>;
    currentConfig = { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    // ignore invalid JSON
  }
}

restoreConfig();

// ─── Public API ──────────────────────────────────────────────

/**
 * Returns the current mock configuration.
 * @example
 * ```typescript
 * const config = getMockConfig();
 * if (config.apiLatency > 0) await delay(config.apiLatency);
 * ```
 */
function getMockConfig(): Readonly<MockConfig> {
  return currentConfig;
}

/**
 * Updates mock configuration (partial merge). Persists and notifies listeners.
 * @param patch - Partial config to merge into the current config.
 * @example
 * ```typescript
 * setMockConfig({ apiLatency: 1000, errorRate: 'low' });
 * ```
 */
function setMockConfig(patch: Partial<MockConfig>): void {
  currentConfig = { ...currentConfig, ...patch };
  configStorage.set(JSON.stringify(currentConfig));
  listeners.forEach((fn) => fn(currentConfig));
}

/**
 * Resets mock configuration to defaults. Persists and notifies listeners.
 */
function resetMockConfig(): void {
  currentConfig = { ...DEFAULT_CONFIG };
  configStorage.set(JSON.stringify(currentConfig));
  listeners.forEach((fn) => fn(currentConfig));
}

/**
 * Subscribe to config changes. Returns an unsubscribe function.
 * @param listener - Called with the new config on every change.
 * @example
 * ```typescript
 * const unsub = onMockConfigChange((config) => console.log(config));
 * // later…
 * unsub();
 * ```
 */
function onMockConfigChange(listener: ConfigListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ─── Helpers for the mock provider ───────────────────────────

/**
 * Simulates API latency based on current config. Call at the start of each mock method.
 */
async function simulateLatency(): Promise<void> {
  const { apiLatency } = currentConfig;
  if (apiLatency > 0) {
    await new Promise((resolve) => setTimeout(resolve, apiLatency));
  }
}

/**
 * Throws a simulated error based on the current error rate config.
 * Call after simulateLatency in each mock method.
 * @throws Error when the random check falls within the error rate.
 */
function maybeThrowError(): void {
  const { errorRate } = currentConfig;
  if (errorRate === 'never') return;
  if (errorRate === 'always') throw new Error('[MockERP] Simulated API error');

  const threshold = errorRate === 'low' ? 0.2 : 0.5;
  if (Math.random() < threshold) {
    throw new Error('[MockERP] Simulated random API error');
  }
}

// ─── Exports ─────────────────────────────────────────────────

export {
  getMockConfig,
  setMockConfig,
  resetMockConfig,
  onMockConfigChange,
  simulateLatency,
  maybeThrowError,
  ApiLatency,
  ErrorRate,
  PdvScenario,
  ProductCount,
  StoreSize,
};

export type {
  MockConfig,
  ApiLatencyValue,
  ErrorRateValue,
  PdvScenarioValue,
  ProductCountValue,
  StoreSizeValue,
};
