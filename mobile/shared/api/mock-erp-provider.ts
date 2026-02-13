import { Platform } from 'react-native';
import type { Contagem } from '@/entities/contagem/model/types';
import type { Estoque } from '@/entities/estoque/model/types';
import type {
  ErpProvider,
  ListInventoriesFilters,
  CreateInventoryParams,
  InventoryItem,
  EstruturaMercadologica,
} from './erp-provider-types';

// ─── Static reference data ───────────────────────────────────

const MOCK_STOCKS: Estoque[] = [
  { id: 's1', nome: 'Estoque 1', ativo: true },
  { id: 's2', nome: 'Estoque 2', ativo: true },
  { id: 's3', nome: 'Estoque 3', ativo: true },
];

const MOCK_ESTRUTURAS: EstruturaMercadologica[] = [
  { id: 'cat1', nome: 'Alimentos' },
  { id: 'cat2', nome: 'Bebidas' },
  { id: 'cat3', nome: 'Limpeza' },
];

// ─── Persistence helpers (survive web refresh) ───────────────

const STORAGE_KEY_INVENTORIES = 'mock_inventories';
const STORAGE_KEY_ITEMS = 'mock_inventory_items';
const STORAGE_KEY_COUNTER = 'mock_count_id';

/** Read JSON from localStorage (web only, no-op on native). */
function readStorage<T>(key: string): T | null {
  if (Platform.OS !== 'web') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Write JSON to localStorage (web only, no-op on native). */
function writeStorage(key: string, value: unknown): void {
  if (Platform.OS !== 'web') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — ignore
  }
}

/** Serialize Maps to a plain object for JSON storage. */
function serializeMaps(): void {
  const inventoriesObj: Record<string, Contagem> = {};
  mockInventories.forEach((v, k) => { inventoriesObj[k] = v; });

  const itemsObj: Record<string, InventoryItem[]> = {};
  mockInventoryItems.forEach((v, k) => { itemsObj[k] = v; });

  writeStorage(STORAGE_KEY_INVENTORIES, inventoriesObj);
  writeStorage(STORAGE_KEY_ITEMS, itemsObj);
  writeStorage(STORAGE_KEY_COUNTER, mockCountId);
}

/** Restore Maps from localStorage. Returns true if data was restored. */
function restoreFromStorage(): boolean {
  const inventoriesObj = readStorage<Record<string, Contagem>>(STORAGE_KEY_INVENTORIES);
  const itemsObj = readStorage<Record<string, InventoryItem[]>>(STORAGE_KEY_ITEMS);
  const counter = readStorage<number>(STORAGE_KEY_COUNTER);

  if (!inventoriesObj || Object.keys(inventoriesObj).length === 0) return false;

  mockInventories.clear();
  for (const [k, v] of Object.entries(inventoriesObj)) {
    mockInventories.set(k, v);
  }

  mockInventoryItems.clear();
  if (itemsObj) {
    for (const [k, v] of Object.entries(itemsObj)) {
      mockInventoryItems.set(k, v);
    }
  }

  if (counter != null) mockCountId = counter;

  return true;
}

// ─── In-memory state ─────────────────────────────────────────

let mockCountId = 1;
const mockInventories: Map<string, Contagem> = new Map();
const mockInventoryItems: Map<string, InventoryItem[]> = new Map();

/** Try to restore persisted state on module load. */
const _restoredFromStorage = restoreFromStorage();

// ─── Seed data (only when nothing persisted) ─────────────────

function seedInitialCounts() {
  if (mockInventories.size > 0) return;
  const base = new Date();
  base.setDate(base.getDate() - 2);
  ['s1', 's2'].forEach((estoqueId, i) => {
    const id = `00${mockCountId++}`;
    const dataInicio = new Date(base);
    dataInicio.setDate(dataInicio.getDate() + i);
    const dataFinalizacao = i === 1 ? new Date(base.getTime() + 86400000).toISOString() : undefined;
    const c: Contagem = {
      id,
      estoqueId,
      valorAConsiderar: 'VENDA',
      modalidadeContagem: i === 0 ? 'LOJA_FUNCIONANDO' : 'LOJA_FECHADA',
      dataInicio: dataInicio.toISOString(),
      status: i === 0 ? 'EM_ANDAMENTO' : 'FINALIZADO',
      dataFinalizacao,
      criadoEm: dataInicio.toISOString(),
      criadoPor: i === 0 ? 'mock-employee-1' : 'mock-manager-1',
      criadoPorNome: i === 0 ? 'Rafael Funcionário' : 'Claudio Gerente',
      ...(i === 1 && {
        finalizadoPor: 'mock-manager-1',
        finalizadoPorNome: 'Claudio Gerente',
        finalizadoEm: dataFinalizacao,
      }),
    };
    mockInventories.set(id, c);
    mockInventoryItems.set(id, [
      { id: `i-${id}-1`, produtoId: '9602', produtoNome: 'Produto A', valorUnitario: 10, qtdSistema: 5 },
      { id: `i-${id}-2`, produtoId: '3401', produtoNome: 'Produto B', valorUnitario: 35, qtdSistema: 2 },
    ]);
  });
  serializeMaps();
}

function createMockCount(params: CreateInventoryParams): Contagem {
  const id = `00${mockCountId++}`;
  const now = new Date().toISOString();
  const contagem: Contagem = {
    id,
    estoqueId: params.estoqueId,
    valorAConsiderar: params.valorAConsiderar,
    ...(params.estruturaMercadologicaId && { estruturaMercadologicaId: params.estruturaMercadologicaId }),
    ...(params.estruturaMercadologicaIds &&
      params.estruturaMercadologicaIds.length > 0 && { estruturaMercadologicaIds: params.estruturaMercadologicaIds }),
    ...(params.modalidadeContagem && { modalidadeContagem: params.modalidadeContagem }),
    dataInicio: now,
    status: 'EM_ANDAMENTO',
    criadoEm: now,
    criadoPor: 'mock-employee-1',
    criadoPorNome: 'Rafael Funcionário',
  };
  mockInventories.set(id, contagem);
  const items: InventoryItem[] = [
    { id: 'i1', produtoId: '9602', produtoNome: 'Produto A', valorUnitario: 10, qtdSistema: 5 },
    { id: 'i2', produtoId: '3401', produtoNome: 'Produto B', valorUnitario: 35, qtdSistema: 2 },
    { id: 'i3', produtoId: '2022', produtoNome: 'Produto C', valorUnitario: 235, qtdSistema: 1 },
  ];
  mockInventoryItems.set(id, items);
  serializeMaps();
  return contagem;
}

// ─── Provider implementation ─────────────────────────────────

export const mockErpProvider: ErpProvider = {
  async listStocks() {
    return [...MOCK_STOCKS];
  },
  async getStock(id: string) {
    return MOCK_STOCKS.find((s) => s.id === id) ?? null;
  },
  async listEstruturasMercadologicas() {
    return [...MOCK_ESTRUTURAS];
  },
  async listInventories(filters: ListInventoriesFilters) {
    seedInitialCounts();
    let list = Array.from(mockInventories.values()).filter((c) => !c.excluidoEm);
    if (filters.estoqueId) list = list.filter((c) => c.estoqueId === filters.estoqueId);
    if (filters.status) list = list.filter((c) => c.status === filters.status);
    if (filters.dataInicio) {
      const from = new Date(filters.dataInicio).getTime();
      list = list.filter((c) => new Date(c.dataInicio).getTime() >= from);
    }
    if (filters.dataFim) {
      const to = new Date(filters.dataFim).getTime();
      list = list.filter((c) => new Date(c.dataInicio).getTime() <= to);
    }
    list.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
    return list;
  },
  async getInventory(id: string) {
    seedInitialCounts();
    const c = mockInventories.get(id);
    return c && !c.excluidoEm ? c : null;
  },
  async createInventory(params: CreateInventoryParams) {
    return createMockCount(params);
  },
  async updateInventory(id: string, patch) {
    const c = mockInventories.get(id);
    if (!c) throw new Error('Contagem não encontrada');
    const updated = { ...c, ...patch };
    if (patch.status === 'FINALIZADO') {
      updated.finalizadoPor = updated.finalizadoPor ?? 'mock-manager-1';
      updated.finalizadoPorNome = updated.finalizadoPorNome ?? 'Claudio Gerente';
      updated.finalizadoEm = updated.finalizadoEm ?? patch.dataFinalizacao ?? new Date().toISOString();
    }
    mockInventories.set(id, updated);
    serializeMaps();
    return updated;
  },
  async deleteInventory(id: string) {
    const c = mockInventories.get(id);
    if (!c) return;
    c.excluidoPor = 'mock-user';
    c.excluidoEm = new Date().toISOString();
    mockInventoryItems.delete(id);
    serializeMaps();
  },
  async listInventoryItems(inventoryId: string) {
    seedInitialCounts();
    return [...(mockInventoryItems.get(inventoryId) ?? [])];
  },
  async registerCountedQuantity(inventoryId: string, productId: string, qtdContada: number) {
    const items = mockInventoryItems.get(inventoryId);
    const item = items?.find((i) => i.produtoId === productId);
    if (!item) return { success: false, code: 'NOT_FOUND', message: 'Produto não encontrado' };
    item.qtdContada = qtdContada;
    item.dataHoraContagem = new Date().toISOString();
    serializeMaps();
    return { success: true };
  },
  async checkPdvOnline(_inventoryId: string) {
    return { ok: true };
  },
  async checkTransferenciasPendentes(_inventoryId: string, _productId: string) {
    return { ok: true };
  },
};
