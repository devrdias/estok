/**
 * Contract for ERP data provider. Implementations: mock (now), CPlug (later).
 * Swap provider without changing features.
 */
import type { Contagem } from '@/entities/contagem/model/types';
import type { Estoque } from '@/entities/estoque/model/types';
import type { Pdv } from '@/entities/pdv/model/types';

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

/** Fase 2: categoria/subcategoria para escopo da contagem. */
export interface EstruturaMercadologica {
  id: string;
  nome: string;
}

export interface CreateInventoryParams {
  estoqueId: string;
  valorAConsiderar: 'VENDA' | 'CUSTO';
  /** @deprecated Use estruturaMercadologicaIds for multi-select. Kept for backwards compatibility. */
  estruturaMercadologicaId?: string;
  /** Selected product structure IDs (multi-select). Empty array or undefined = all categories. */
  estruturaMercadologicaIds?: string[];
  /** Counting mode: store closed or store open during the count. */
  modalidadeContagem?: 'LOJA_FECHADA' | 'LOJA_ABERTA';
}

/** Result of pre-register checks (US-4.4 PDV online, US-4.5 transferências pendentes). */
export interface CheckResult {
  ok: boolean;
  message?: string;
}

export interface ErpProvider {
  listStocks(): Promise<Estoque[]>;
  getStock(id: string): Promise<Estoque | null>;
  /** Fase 2: lista categorias para filtro opcional na abertura de contagem. */
  listEstruturasMercadologicas?(): Promise<EstruturaMercadologica[]>;
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
  /** US-4.4: Check if PDVs linked to the stock are online before allowing register. Optional. */
  checkPdvOnline?(inventoryId: string): Promise<CheckResult>;
  /** US-4.5: Check if product has pending stock transfers. Optional. */
  checkTransferenciasPendentes?(inventoryId: string, productId: string): Promise<CheckResult>;

  // ─── PDV management ────────────────────────────────────────

  /** List all PDVs, optionally filtered by stock. */
  listPdvs(filters?: { estoqueId?: string }): Promise<Pdv[]>;
  /** Toggle a PDV's connection status (online ↔ offline). Returns the updated PDV. */
  togglePdvStatus(pdvId: string): Promise<Pdv>;
}
