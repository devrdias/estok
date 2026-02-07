/**
 * CPlug ERP provider stub (Phase 2). Replace with real API client when backend is ready.
 * Injected when EXPO_PUBLIC_ERP_PROVIDER=cplug.
 */
import type { ErpProvider, CreateInventoryParams } from './erp-provider-types';

const NOT_IMPLEMENTED = 'CPlug ERP provider is not implemented yet. Use EXPO_PUBLIC_ERP_PROVIDER=mock.';

function throwNotImplemented(): never {
  throw new Error(NOT_IMPLEMENTED);
}

export const cplugErpProvider: ErpProvider = {
  async listStocks() {
    return [];
  },
  async getStock() {
    return null;
  },
  async listEstruturasMercadologicas() {
    return [];
  },
  async listInventories() {
    return [];
  },
  async getInventory() {
    return null;
  },
  async createInventory(_params: CreateInventoryParams) {
    throwNotImplemented();
  },
  async updateInventory() {
    throwNotImplemented();
  },
  async deleteInventory() {
    throwNotImplemented();
  },
  async listInventoryItems() {
    return [];
  },
  async registerCountedQuantity() {
    return { success: false, code: 'NOT_IMPLEMENTED', message: NOT_IMPLEMENTED };
  },
};
