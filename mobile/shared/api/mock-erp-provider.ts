import type { Contagem } from '@/entities/contagem/model/types';
import type { Estoque } from '@/entities/estoque/model/types';
import type {
  ErpProvider,
  ListInventoriesFilters,
  CreateInventoryParams,
  InventoryItem,
  EstruturaMercadologica,
} from './erp-provider-types';

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

let mockCountId = 1;
const mockInventories: Map<string, Contagem> = new Map();
const mockInventoryItems: Map<string, InventoryItem[]> = new Map();

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
      dataInicio: dataInicio.toISOString(),
      status: i === 0 ? 'EM_ANDAMENTO' : 'FINALIZADO',
      dataFinalizacao,
      criadoEm: dataInicio.toISOString(),
      ...(i === 1 && {
        finalizadoPor: 'mock-user',
        finalizadoEm: dataFinalizacao,
      }),
    };
    mockInventories.set(id, c);
    mockInventoryItems.set(id, [
      { id: `i-${id}-1`, produtoId: '9602', produtoNome: 'Produto A', valorUnitario: 10, qtdSistema: 5 },
      { id: `i-${id}-2`, produtoId: '3401', produtoNome: 'Produto B', valorUnitario: 35, qtdSistema: 2 },
    ]);
  });
}

function createMockCount(params: CreateInventoryParams): Contagem {
  const id = `00${mockCountId++}`;
  const now = new Date().toISOString();
  const contagem: Contagem = {
    id,
    estoqueId: params.estoqueId,
    valorAConsiderar: params.valorAConsiderar,
    ...(params.estruturaMercadologicaId && { estruturaMercadologicaId: params.estruturaMercadologicaId }),
    dataInicio: now,
    status: 'EM_ANDAMENTO',
    criadoEm: now,
  };
  mockInventories.set(id, contagem);
  const stock = MOCK_STOCKS.find((s) => s.id === params.estoqueId);
  const items: InventoryItem[] = [
    { id: 'i1', produtoId: '9602', produtoNome: 'Produto A', valorUnitario: 10, qtdSistema: 5 },
    { id: 'i2', produtoId: '3401', produtoNome: 'Produto B', valorUnitario: 35, qtdSistema: 2 },
    { id: 'i3', produtoId: '2022', produtoNome: 'Produto C', valorUnitario: 235, qtdSistema: 1 },
  ];
  mockInventoryItems.set(id, items);
  return contagem;
}

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
      updated.finalizadoPor = updated.finalizadoPor ?? 'mock-user';
      updated.finalizadoEm = updated.finalizadoEm ?? patch.dataFinalizacao ?? new Date().toISOString();
    }
    mockInventories.set(id, updated);
    return updated;
  },
  async deleteInventory(id: string) {
    const c = mockInventories.get(id);
    if (!c) return;
    c.excluidoPor = 'mock-user';
    c.excluidoEm = new Date().toISOString();
    mockInventoryItems.delete(id);
  },
  async listInventoryItems(inventoryId: string) {
    return [...(mockInventoryItems.get(inventoryId) ?? [])];
  },
  async registerCountedQuantity(inventoryId: string, productId: string, qtdContada: number) {
    const items = mockInventoryItems.get(inventoryId);
    const item = items?.find((i) => i.produtoId === productId);
    if (!item) return { success: false, code: 'NOT_FOUND', message: 'Produto não encontrado' };
    item.qtdContada = qtdContada;
    item.dataHoraContagem = new Date().toISOString();
    return { success: true };
  },
  async checkPdvOnline(_inventoryId: string) {
    return { ok: true };
  },
  async checkTransferenciasPendentes(_inventoryId: string, _productId: string) {
    return { ok: true };
  },
};
