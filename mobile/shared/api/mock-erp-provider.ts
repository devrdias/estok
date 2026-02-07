import type { Contagem } from '../../entities/contagem/model/types';
import type { Estoque } from '../../entities/estoque/model/types';
import type {
  ErpProvider,
  ListInventoriesFilters,
  CreateInventoryParams,
  InventoryItem,
} from './erp-provider-types';

const MOCK_STOCKS: Estoque[] = [
  { id: 's1', nome: 'Estoque 1', ativo: true },
  { id: 's2', nome: 'Estoque 2', ativo: true },
  { id: 's3', nome: 'Estoque 3', ativo: true },
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
    const c: Contagem = {
      id,
      estoqueId,
      valorAConsiderar: 'VENDA',
      dataInicio: dataInicio.toISOString(),
      status: i === 0 ? 'EM_ANDAMENTO' : 'FINALIZADO',
      dataFinalizacao: i === 1 ? new Date(base.getTime() + 86400000).toISOString() : undefined,
      criadoEm: dataInicio.toISOString(),
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
  async listInventories(filters: ListInventoriesFilters) {
    seedInitialCounts();
    let list = Array.from(mockInventories.values());
    if (filters.estoqueId) list = list.filter((c) => c.estoqueId === filters.estoqueId);
    if (filters.status) list = list.filter((c) => c.status === filters.status);
    list.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
    return list;
  },
  async getInventory(id: string) {
    return mockInventories.get(id) ?? null;
  },
  async createInventory(params: CreateInventoryParams) {
    return createMockCount(params);
  },
  async updateInventory(id: string, patch) {
    const c = mockInventories.get(id);
    if (!c) throw new Error('Contagem não encontrada');
    const updated = { ...c, ...patch };
    mockInventories.set(id, updated);
    return updated;
  },
  async deleteInventory(id: string) {
    mockInventories.delete(id);
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
};
