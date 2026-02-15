/**
 * CPlug ERP provider stub (Phase 2). Replace with real API client when backend is ready.
 * Injected when EXPO_PUBLIC_ERP_PROVIDER=cplug.
 *
 * @see https://cplug.redocly.app/openapi — CPlug API reference
 */
import type { ErpProvider, CreateInventoryParams } from './erp-provider-types';

const NOT_IMPLEMENTED = 'CPlug ERP provider is not implemented yet. Use EXPO_PUBLIC_ERP_PROVIDER=mock.';

function throwNotImplemented(): never {
  throw new Error(NOT_IMPLEMENTED);
}

export const cplugErpProvider: ErpProvider = {
  // ─── Stocks ────────────────────────────────────────────────
  // GET /api/v3/stocks
  async listStocks() {
    return [];
  },
  // GET /api/v3/stocks/{stockId}
  async getStock() {
    return null;
  },

  // ─── Categories ────────────────────────────────────────────
  // GET /api/v3/categories
  async listEstruturasMercadologicas() {
    return [];
  },

  // ─── Inventories ───────────────────────────────────────────
  // GET /api/v3/stocks/{stockId}/inventories
  async listInventories() {
    return [];
  },
  // GET /api/v3/stocks/{stockId}/inventories/{inventoryId}
  async getInventory() {
    return null;
  },
  // POST /api/v3/stocks/{stockId}/inventories
  async createInventory(_params: CreateInventoryParams) {
    throwNotImplemented();
  },
  // PUT /api/v3/stocks/{stockId}/inventories/{inventoryId}
  async updateInventory() {
    throwNotImplemented();
  },
  // DELETE /api/v3/stocks/{stockId}/inventories/{inventoryId}
  async deleteInventory() {
    throwNotImplemented();
  },

  // ─── Inventory Items ───────────────────────────────────────
  // GET /api/v3/stocks/{stockId}/inventories/{inventoryId}/items
  async listInventoryItems() {
    return [];
  },
  // PUT /api/v3/stocks/{stockId}/inventories/{inventoryId}/items
  async registerCountedQuantity() {
    return { success: false as const, code: 'NOT_IMPLEMENTED', message: NOT_IMPLEMENTED };
  },

  // ─── Pre-register checks ──────────────────────────────────
  async checkPdvOnline() {
    return { ok: true };
  },
  async checkTransferenciasPendentes() {
    return { ok: true };
  },

  // ─── PDV management ────────────────────────────────────────
  // GET /api/v3/pos/drawer-list
  async listPdvs() {
    return [];
  },
  // POST /api/v3/pos/{posId}/drawer-open (toggle simulation)
  async togglePdvStatus() {
    throwNotImplemented();
  },
};
