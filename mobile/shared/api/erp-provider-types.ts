/**
 * Contract for ERP data provider. Implementations: mock (now), CPlug (later).
 * Swap provider without changing features.
 */
import type { Contagem } from '../../entities/contagem/model/types';
import type { Estoque } from '../../entities/estoque/model/types';

export interface ListInventoriesFilters {
  estoqueId?: string;
  dataInicio?: string;
  dataFim?: string;
  status?: string;
}

export interface InventoryItem {
  id: string;
  produtoId: string;
  produtoNome: string;
  valorUnitario: number;
  qtdSistema: number;
  qtdContada?: number;
  dataHoraContagem?: string;
}

export interface CreateInventoryParams {
  estoqueId: string;
  valorAConsiderar: 'VENDA' | 'CUSTO';
  estruturaMercadologicaId?: string;
}

export interface ErpProvider {
  listStocks(): Promise<Estoque[]>;
  getStock(id: string): Promise<Estoque | null>;
  listInventories(filters: ListInventoriesFilters): Promise<Contagem[]>;
  getInventory(id: string): Promise<Contagem | null>;
  createInventory(params: CreateInventoryParams): Promise<Contagem>;
  updateInventory(id: string, patch: Partial<Pick<Contagem, 'status' | 'dataFinalizacao'>>): Promise<Contagem>;
  deleteInventory(id: string): Promise<void>;
  listInventoryItems(inventoryId: string): Promise<InventoryItem[]>;
  registerCountedQuantity(
    inventoryId: string,
    productId: string,
    qtdContada: number
  ): Promise<{ success: true } | { success: false; code: string; message: string }>;
}
