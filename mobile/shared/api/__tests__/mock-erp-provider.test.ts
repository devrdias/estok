/**
 * Unit tests for the mock ERP provider. Validates the contract so that
 * swapping to another provider (e.g. CPlug) keeps app behavior consistent.
 */
import { CountStatus } from '../../../entities/contagem/model/types';
import { mockErpProvider } from '../mock-erp-provider';

describe('mockErpProvider', () => {
  describe('listStocks', () => {
    it('returns all mock stocks', async () => {
      const stocks = await mockErpProvider.listStocks();
      expect(stocks).toHaveLength(3);
      expect(stocks.map((s) => s.id)).toEqual(['s1', 's2', 's3']);
      expect(stocks[0].nome).toBe('Estoque 1');
    });
  });

  describe('getStock', () => {
    it('returns stock by id', async () => {
      const stock = await mockErpProvider.getStock('s1');
      expect(stock).not.toBeNull();
      expect(stock?.nome).toBe('Estoque 1');
    });

    it('returns null for unknown id', async () => {
      const stock = await mockErpProvider.getStock('unknown');
      expect(stock).toBeNull();
    });
  });

  describe('listInventories', () => {
    it('returns seeded inventories and applies sort by criadoEm desc', async () => {
      const list = await mockErpProvider.listInventories({});
      expect(list.length).toBeGreaterThanOrEqual(2);
      for (let i = 1; i < list.length; i++) {
        const prev = new Date(list[i - 1].criadoEm).getTime();
        const curr = new Date(list[i].criadoEm).getTime();
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    });

    it('filters by estoqueId', async () => {
      const list = await mockErpProvider.listInventories({ estoqueId: 's1' });
      expect(list.every((c) => c.estoqueId === 's1')).toBe(true);
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
      const created = await mockErpProvider.createInventory({
        estoqueId: 's1',
        valorAConsiderar: 'CUSTO',
      });
      expect(created.id).toBeDefined();
      expect(created.estoqueId).toBe('s1');
      expect(created.valorAConsiderar).toBe('CUSTO');
      expect(created.status).toBe(CountStatus.EM_ANDAMENTO);

      const found = await mockErpProvider.getInventory(created.id);
      expect(found).toEqual(created);
    });
  });

  describe('updateInventory', () => {
    it('updates status and dataFinalizacao', async () => {
      const created = await mockErpProvider.createInventory({
        estoqueId: 's2',
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
    it('removes inventory and its items', async () => {
      const created = await mockErpProvider.createInventory({
        estoqueId: 's3',
        valorAConsiderar: 'VENDA',
      });
      await mockErpProvider.deleteInventory(created.id);

      const found = await mockErpProvider.getInventory(created.id);
      expect(found).toBeNull();

      const items = await mockErpProvider.listInventoryItems(created.id);
      expect(items).toEqual([]);
    });
  });

  describe('checkPdvOnline (US-4.4)', () => {
    it('returns ok: true in mock', async () => {
      const result = await mockErpProvider.checkPdvOnline!('001');
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
    it('returns mock categories', async () => {
      const list = await mockErpProvider.listEstruturasMercadologicas!();
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list[0]).toHaveProperty('id');
      expect(list[0]).toHaveProperty('nome');
    });
  });

  describe('createInventory with estruturaMercadologicaId (Fase 2)', () => {
    it('stores estruturaMercadologicaId on contagem', async () => {
      const created = await mockErpProvider.createInventory({
        estoqueId: 's1',
        valorAConsiderar: 'CUSTO',
        estruturaMercadologicaId: 'cat1',
      });
      expect(created.estruturaMercadologicaId).toBe('cat1');
      const found = await mockErpProvider.getInventory(created.id);
      expect(found?.estruturaMercadologicaId).toBe('cat1');
    });
  });

  describe('auditoria finalizadoPor/finalizadoEm (Fase 2)', () => {
    it('sets finalizadoPor and finalizadoEm when finalizing', async () => {
      const created = await mockErpProvider.createInventory({
        estoqueId: 's1',
        valorAConsiderar: 'VENDA',
      });
      const updated = await mockErpProvider.updateInventory(created.id, {
        status: CountStatus.FINALIZADO,
        dataFinalizacao: new Date().toISOString(),
      });
      expect(updated.finalizadoPor).toBe('mock-user');
      expect(updated.finalizadoEm).toBeDefined();
    });
  });

  describe('auditoria excluídoPor/excluídoEm soft-delete (Fase 2)', () => {
    it('marks contagem as excluded and hides from list and get', async () => {
      const created = await mockErpProvider.createInventory({
        estoqueId: 's2',
        valorAConsiderar: 'VENDA',
      });
      const listBefore = await mockErpProvider.listInventories({});
      expect(listBefore.some((c) => c.id === created.id)).toBe(true);
      await mockErpProvider.deleteInventory(created.id);
      const listAfter = await mockErpProvider.listInventories({});
      expect(listAfter.some((c) => c.id === created.id)).toBe(false);
      const found = await mockErpProvider.getInventory(created.id);
      expect(found).toBeNull();
    });
  });
});
