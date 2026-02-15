/**
 * Unit tests for the mock ERP provider. Validates the contract so that
 * swapping to another provider (e.g. CPlug) keeps app behavior consistent.
 *
 * Since the mock now uses dynamic generated data (mock-store-generator),
 * tests assert on structural properties rather than hardcoded IDs/names.
 */
import { CountStatus } from '../../../entities/contagem/model/types';
import { mockErpProvider, resetMockData } from '../mock-erp-provider';
import { getMockConfig } from '../mock-config';

/** Reset mock data before each test to guarantee clean state. */
beforeEach(() => {
  resetMockData();
});

describe('mockErpProvider', () => {
  describe('listStocks', () => {
    it('returns generated stocks with expected structure', async () => {
      const stocks = await mockErpProvider.listStocks();
      expect(stocks.length).toBeGreaterThanOrEqual(1);
      // Every stock must have id, nome, ativo
      for (const stock of stocks) {
        expect(stock.id).toBeDefined();
        expect(stock.nome).toBeDefined();
        expect(stock.ativo).toBe(true);
      }
      // IDs follow the est-N pattern from the generator
      expect(stocks[0].id).toMatch(/^est-\d+$/);
    });
  });

  describe('getStock', () => {
    it('returns stock by id', async () => {
      const stocks = await mockErpProvider.listStocks();
      const firstId = stocks[0].id;
      const stock = await mockErpProvider.getStock(firstId);
      expect(stock).not.toBeNull();
      expect(stock?.id).toBe(firstId);
    });

    it('returns null for unknown id', async () => {
      const stock = await mockErpProvider.getStock('unknown');
      expect(stock).toBeNull();
    });
  });

  describe('listInventories', () => {
    it('returns seeded inventories sorted by criadoEm desc', async () => {
      const list = await mockErpProvider.listInventories({});
      expect(list.length).toBeGreaterThanOrEqual(2);
      for (let i = 1; i < list.length; i++) {
        const prev = new Date(list[i - 1].criadoEm).getTime();
        const curr = new Date(list[i].criadoEm).getTime();
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    });

    it('filters by estoqueId', async () => {
      const stocks = await mockErpProvider.listStocks();
      const firstStockId = stocks[0].id;
      const list = await mockErpProvider.listInventories({ estoqueId: firstStockId });
      expect(list.every((c) => c.estoqueId === firstStockId)).toBe(true);
    });

    it('filters by status', async () => {
      const list = await mockErpProvider.listInventories({
        status: CountStatus.FINALIZADO,
      });
      expect(list.every((c) => c.status === CountStatus.FINALIZADO)).toBe(true);
    });
  });

  describe('createInventory', () => {
    it('creates a new inventory and returns it', async () => {
      const stocks = await mockErpProvider.listStocks();
      const stockId = stocks[0].id;
      const created = await mockErpProvider.createInventory({
        estoqueId: stockId,
        valorAConsiderar: 'CUSTO',
      });
      expect(created.id).toBeDefined();
      expect(created.estoqueId).toBe(stockId);
      expect(created.valorAConsiderar).toBe('CUSTO');
      expect(created.status).toBe(CountStatus.EM_ANDAMENTO);

      const found = await mockErpProvider.getInventory(created.id);
      expect(found).toEqual(created);
    });

    it('generates inventory items from the product catalog', async () => {
      const stocks = await mockErpProvider.listStocks();
      const created = await mockErpProvider.createInventory({
        estoqueId: stocks[0].id,
        valorAConsiderar: 'VENDA',
      });
      const items = await mockErpProvider.listInventoryItems(created.id);
      const config = getMockConfig();
      expect(items).toHaveLength(config.productCount);
      // Each item should have realistic product data from the catalog
      for (const item of items) {
        expect(item.produtoNome).toBeDefined();
        expect(item.valorUnitario).toBeGreaterThan(0);
        expect(item.qtdSistema).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('updateInventory', () => {
    it('updates status and dataFinalizacao', async () => {
      const stocks = await mockErpProvider.listStocks();
      const created = await mockErpProvider.createInventory({
        estoqueId: stocks[0].id,
        valorAConsiderar: 'VENDA',
      });
      const updated = await mockErpProvider.updateInventory(created.id, {
        status: CountStatus.FINALIZADO,
        dataFinalizacao: new Date().toISOString(),
      });
      expect(updated.status).toBe(CountStatus.FINALIZADO);
      expect(updated.dataFinalizacao).toBeDefined();
    });

    it('throws when inventory not found', async () => {
      await expect(
        mockErpProvider.updateInventory('nonexistent', { status: CountStatus.FINALIZADO })
      ).rejects.toThrow();
    });
  });

  describe('listInventoryItems', () => {
    it('returns items for an inventory', async () => {
      const list = await mockErpProvider.listInventories({});
      const id = list[0]?.id;
      expect(id).toBeDefined();
      const items = await mockErpProvider.listInventoryItems(id!);
      expect(items.length).toBeGreaterThanOrEqual(2);
      expect(items[0]).toHaveProperty('produtoId');
      expect(items[0]).toHaveProperty('qtdSistema');
      expect(items[0]).toHaveProperty('valorUnitario');
    });

    it('returns empty array for unknown inventory', async () => {
      const items = await mockErpProvider.listInventoryItems('nonexistent');
      expect(items).toEqual([]);
    });
  });

  describe('registerCountedQuantity', () => {
    it('updates item and returns success', async () => {
      const list = await mockErpProvider.listInventories({});
      const id = list[0]?.id;
      expect(id).toBeDefined();
      const itemsBefore = await mockErpProvider.listInventoryItems(id!);
      const productId = itemsBefore[0].produtoId;

      const result = await mockErpProvider.registerCountedQuantity(id!, productId, 10);
      expect(result.success).toBe(true);

      const itemsAfter = await mockErpProvider.listInventoryItems(id!);
      const item = itemsAfter.find((i) => i.produtoId === productId);
      expect(item?.qtdContada).toBe(10);
      expect(item?.dataHoraContagem).toBeDefined();
    });

    it('returns failure for unknown product', async () => {
      const list = await mockErpProvider.listInventories({});
      const id = list[0]?.id;
      expect(id).toBeDefined();

      const result = await mockErpProvider.registerCountedQuantity(id!, 'invalid-product', 1);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('deleteInventory', () => {
    it('soft-deletes inventory (hidden from list and get)', async () => {
      const stocks = await mockErpProvider.listStocks();
      const created = await mockErpProvider.createInventory({
        estoqueId: stocks[0].id,
        valorAConsiderar: 'VENDA',
      });

      const listBefore = await mockErpProvider.listInventories({});
      expect(listBefore.some((c) => c.id === created.id)).toBe(true);

      await mockErpProvider.deleteInventory(created.id);

      const found = await mockErpProvider.getInventory(created.id);
      expect(found).toBeNull();

      const items = await mockErpProvider.listInventoryItems(created.id);
      expect(items).toEqual([]);
    });
  });

  describe('checkPdvOnline (US-4.4)', () => {
    it('checks PDV status for the inventory stock', async () => {
      const result = await mockErpProvider.checkPdvOnline!('001');
      // Result depends on PDV scenario config (mixed by default),
      // so we only verify shape, not value
      expect(result).toHaveProperty('ok');
      expect(typeof result.ok).toBe('boolean');
    });

    it('returns ok: true for unknown inventory (no linked PDVs)', async () => {
      const result = await mockErpProvider.checkPdvOnline!('nonexistent');
      expect(result.ok).toBe(true);
    });
  });

  describe('checkTransferenciasPendentes (US-4.5)', () => {
    it('returns ok: true in mock', async () => {
      const result = await mockErpProvider.checkTransferenciasPendentes!('001', '9602');
      expect(result.ok).toBe(true);
    });
  });

  describe('listEstruturasMercadologicas (Fase 2)', () => {
    it('returns generated categories', async () => {
      const list = await mockErpProvider.listEstruturasMercadologicas!();
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list[0]).toHaveProperty('id');
      expect(list[0]).toHaveProperty('nome');
      // Category IDs follow the generator pattern
      expect(list[0].id).toMatch(/^cat-/);
    });
  });

  describe('createInventory with estruturaMercadologicaId (Fase 2)', () => {
    it('stores estruturaMercadologicaId on contagem', async () => {
      const stocks = await mockErpProvider.listStocks();
      const categories = await mockErpProvider.listEstruturasMercadologicas!();
      const catId = categories[0].id;

      const created = await mockErpProvider.createInventory({
        estoqueId: stocks[0].id,
        valorAConsiderar: 'CUSTO',
        estruturaMercadologicaId: catId,
      });
      expect(created.estruturaMercadologicaId).toBe(catId);
      const found = await mockErpProvider.getInventory(created.id);
      expect(found?.estruturaMercadologicaId).toBe(catId);
    });
  });

  describe('auditoria finalizadoPor/finalizadoEm (Fase 2)', () => {
    it('sets finalizadoPor and finalizadoEm when finalizing', async () => {
      const stocks = await mockErpProvider.listStocks();
      const created = await mockErpProvider.createInventory({
        estoqueId: stocks[0].id,
        valorAConsiderar: 'VENDA',
      });
      const updated = await mockErpProvider.updateInventory(created.id, {
        status: CountStatus.FINALIZADO,
        dataFinalizacao: new Date().toISOString(),
      });
      expect(updated.finalizadoPor).toBeDefined();
      expect(updated.finalizadoEm).toBeDefined();
    });
  });

  describe('PDV management', () => {
    it('lists PDVs linked to generated stocks', async () => {
      const pdvs = await mockErpProvider.listPdvs();
      expect(pdvs.length).toBeGreaterThanOrEqual(1);
      for (const pdv of pdvs) {
        expect(pdv.id).toBeDefined();
        expect(pdv.nome).toBeDefined();
        expect(['ONLINE', 'OFFLINE']).toContain(pdv.status);
        expect(pdv.estoqueId).toMatch(/^est-\d+$/);
      }
    });

    it('filters PDVs by estoqueId', async () => {
      const stocks = await mockErpProvider.listStocks();
      const firstStockId = stocks[0].id;
      const pdvs = await mockErpProvider.listPdvs({ estoqueId: firstStockId });
      expect(pdvs.every((p) => p.estoqueId === firstStockId)).toBe(true);
    });

    it('toggles PDV status', async () => {
      const pdvs = await mockErpProvider.listPdvs();
      const pdv = pdvs[0];
      const originalStatus = pdv.status;
      const toggled = await mockErpProvider.togglePdvStatus(pdv.id);
      expect(toggled.status).toBe(originalStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE');
    });
  });
});
