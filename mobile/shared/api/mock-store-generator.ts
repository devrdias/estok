/**
 * Generates realistic Brazilian store data for the mock ERP provider.
 *
 * Three store presets simulate different business sizes:
 * - **Small (Mercearia)**: 1 stock, 2 PDVs, 4 categories, ~40 products
 * - **Medium (Mercado)**: 3 stocks, 6 PDVs, 8 categories, ~120 products
 * - **Large (Supermercado)**: 5 stocks, 12 PDVs, 12 categories, ~250 products
 *
 * Products are distributed across categories with realistic Brazilian names,
 * EAN-like codes, and BRL price ranges.
 *
 * @example
 * ```typescript
 * const data = generateStoreData('medium');
 * data.stocks;    // 3 stocks
 * data.pdvs;      // 6 PDVs (distributed among stocks)
 * data.categories; // 8 categories
 * data.catalog;   // ~120 products (tied to categories)
 * ```
 */
import type { Estoque } from '@/entities/estoque/model/types';
import type { Pdv } from '@/entities/pdv/model/types';
import type { EstruturaMercadologica, InventoryItem } from './erp-provider-types';

// ─── Store size type ─────────────────────────────────────────

const StoreSize = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
} as const;

type StoreSizeValue = (typeof StoreSize)[keyof typeof StoreSize];

// ─── Generated data shape ────────────────────────────────────

interface GeneratedStoreData {
  stocks: Estoque[];
  pdvs: Pdv[];
  categories: EstruturaMercadologica[];
  /** Full product catalog. Inventory items are drawn from this pool. */
  catalog: CatalogProduct[];
}

interface CatalogProduct {
  produtoId: string;
  produtoNome: string;
  categoriaId: string;
  valorUnitario: number;
  /** Typical stock level for this product. */
  qtdSistemaBase: number;
}

// ─── Stock templates ─────────────────────────────────────────

const STOCK_TEMPLATES = [
  { suffix: 'Central', desc: 'Main store stock' },
  { suffix: 'Depósito A', desc: 'Warehouse A' },
  { suffix: 'Depósito B', desc: 'Warehouse B' },
  { suffix: 'Refrigerados', desc: 'Cold storage' },
  { suffix: 'Congelados', desc: 'Frozen storage' },
];

// ─── PDV name templates ──────────────────────────────────────

const PDV_NAMES = [
  'Caixa 01', 'Caixa 02', 'Caixa 03', 'Caixa 04', 'Caixa 05',
  'Caixa 06', 'Caixa 07', 'Caixa 08', 'PDV Balcão', 'PDV Expresso',
  'Autoatendimento 01', 'Autoatendimento 02',
];

// ─── Category catalog ────────────────────────────────────────

interface CategoryTemplate {
  id: string;
  nome: string;
  /** Products belonging to this category with [name, minPrice, maxPrice, avgQty]. */
  products: [string, number, number, number][];
}

const CATEGORY_CATALOG: CategoryTemplate[] = [
  {
    id: 'cat-mercearia',
    nome: 'Mercearia',
    products: [
      ['Arroz Tipo 1 5kg', 18.90, 28.90, 40],
      ['Feijão Carioca 1kg', 6.50, 9.90, 35],
      ['Feijão Preto 1kg', 7.20, 10.50, 25],
      ['Açúcar Refinado 1kg', 4.50, 6.90, 50],
      ['Açúcar Cristal 5kg', 15.90, 22.90, 20],
      ['Sal Refinado 1kg', 2.20, 3.50, 30],
      ['Farinha de Trigo 1kg', 4.90, 7.50, 35],
      ['Farinha de Mandioca 500g', 4.50, 6.90, 20],
      ['Macarrão Espaguete 500g', 3.90, 5.90, 45],
      ['Macarrão Parafuso 500g', 4.20, 6.50, 30],
      ['Molho de Tomate 340g', 2.50, 4.20, 50],
      ['Extrato de Tomate 350g', 3.90, 5.90, 25],
      ['Óleo de Soja 900ml', 6.90, 9.90, 40],
      ['Azeite Extra Virgem 500ml', 19.90, 34.90, 15],
      ['Vinagre de Álcool 750ml', 2.90, 4.50, 20],
      ['Leite Condensado 395g', 5.90, 8.50, 30],
      ['Creme de Leite 200g', 3.50, 5.20, 30],
      ['Milho Verde Lata 200g', 3.90, 5.90, 25],
      ['Ervilha Lata 200g', 3.50, 5.50, 20],
      ['Achocolatado em Pó 400g', 6.90, 10.90, 25],
    ],
  },
  {
    id: 'cat-bebidas',
    nome: 'Bebidas',
    products: [
      ['Refrigerante Cola 2L', 7.90, 10.90, 60],
      ['Refrigerante Guaraná 2L', 6.90, 9.90, 50],
      ['Refrigerante Laranja 2L', 6.50, 8.90, 30],
      ['Refrigerante Cola Lata 350ml', 3.50, 4.90, 80],
      ['Suco de Laranja 1L', 6.90, 9.90, 25],
      ['Suco de Uva Integral 1L', 9.90, 14.90, 20],
      ['Água Mineral 500ml', 1.50, 2.50, 100],
      ['Água Mineral 1.5L', 2.90, 4.50, 60],
      ['Água de Coco 200ml', 3.90, 5.90, 40],
      ['Cerveja Pilsen Lata 350ml', 2.90, 4.50, 120],
      ['Cerveja Premium 600ml', 8.90, 14.90, 30],
      ['Vinho Tinto Suave 750ml', 15.90, 29.90, 15],
      ['Energético 250ml', 7.90, 10.90, 25],
      ['Chá Gelado Limão 1L', 5.50, 7.90, 20],
      ['Café Torrado 500g', 14.90, 24.90, 35],
      ['Café Solúvel 200g', 12.90, 19.90, 20],
    ],
  },
  {
    id: 'cat-laticinios',
    nome: 'Laticínios',
    products: [
      ['Leite Integral 1L', 4.50, 6.90, 80],
      ['Leite Desnatado 1L', 4.90, 7.20, 40],
      ['Leite Longa Vida 1L', 5.50, 7.90, 50],
      ['Queijo Mussarela kg', 32.90, 45.90, 10],
      ['Queijo Prato Fatiado 150g', 8.90, 12.90, 20],
      ['Queijo Minas Frescal 500g', 14.90, 19.90, 15],
      ['Requeijão Cremoso 200g', 5.90, 8.90, 25],
      ['Manteiga 200g', 7.90, 12.90, 30],
      ['Margarina 500g', 5.50, 8.50, 40],
      ['Iogurte Natural 170g', 2.90, 4.50, 35],
      ['Iogurte Morango 170g', 3.20, 4.90, 30],
      ['Creme de Leite Fresco 200ml', 4.50, 6.90, 20],
      ['Cream Cheese 150g', 6.90, 9.90, 15],
      ['Presunto Fatiado 200g', 8.90, 13.90, 20],
    ],
  },
  {
    id: 'cat-hortifruti',
    nome: 'Hortifruti',
    products: [
      ['Banana Prata kg', 4.90, 7.90, 30],
      ['Maçã Fuji kg', 9.90, 14.90, 25],
      ['Laranja Pera kg', 3.90, 6.90, 35],
      ['Limão Tahiti kg', 5.90, 9.90, 20],
      ['Mamão Formosa kg', 4.50, 7.50, 15],
      ['Melancia kg', 2.50, 4.50, 10],
      ['Tomate Italiano kg', 6.90, 11.90, 25],
      ['Cebola kg', 4.90, 7.90, 30],
      ['Batata Inglesa kg', 4.50, 7.50, 30],
      ['Cenoura kg', 4.90, 7.90, 20],
      ['Alface Crespa un', 2.50, 4.50, 15],
      ['Brócolis un', 5.90, 8.90, 10],
      ['Pimentão Verde kg', 7.90, 12.90, 12],
      ['Pepino un', 1.90, 3.50, 15],
      ['Abóbora Cabotiá kg', 4.90, 7.90, 10],
      ['Mandioca kg', 5.90, 8.90, 15],
    ],
  },
  {
    id: 'cat-carnes',
    nome: 'Carnes e Frios',
    products: [
      ['Frango Inteiro kg', 9.90, 14.90, 20],
      ['Peito de Frango kg', 14.90, 22.90, 25],
      ['Coxa e Sobrecoxa kg', 10.90, 16.90, 20],
      ['Carne Moída kg', 22.90, 34.90, 15],
      ['Alcatra kg', 39.90, 54.90, 10],
      ['Picanha kg', 54.90, 79.90, 8],
      ['Costela Bovina kg', 24.90, 34.90, 12],
      ['Linguiça Toscana kg', 16.90, 24.90, 20],
      ['Salsicha 500g', 5.90, 8.90, 30],
      ['Presunto Cozido kg', 24.90, 34.90, 10],
      ['Mortadela kg', 12.90, 18.90, 15],
      ['Bacon Fatiado 200g', 9.90, 14.90, 15],
      ['Filé de Tilápia kg', 29.90, 39.90, 10],
      ['Camarão Médio kg', 49.90, 69.90, 5],
    ],
  },
  {
    id: 'cat-padaria',
    nome: 'Padaria e Confeitaria',
    products: [
      ['Pão Francês kg', 12.90, 16.90, 40],
      ['Pão de Forma 500g', 6.90, 9.90, 30],
      ['Pão Integral 400g', 7.90, 10.90, 20],
      ['Bisnaguinha Pacote', 5.90, 8.50, 25],
      ['Bolo de Chocolate un', 14.90, 22.90, 8],
      ['Bolo de Laranja un', 12.90, 18.90, 8],
      ['Biscoito Cream Cracker 400g', 4.50, 6.90, 35],
      ['Biscoito Recheado Chocolate 130g', 2.50, 3.90, 40],
      ['Biscoito Maria 200g', 2.90, 4.50, 30],
      ['Rosquinha de Leite 300g', 4.90, 7.50, 20],
      ['Torrada Integral 160g', 4.50, 6.90, 15],
      ['Croissant un', 3.90, 5.90, 10],
    ],
  },
  {
    id: 'cat-limpeza',
    nome: 'Limpeza',
    products: [
      ['Detergente 500ml', 2.20, 3.50, 50],
      ['Sabão em Pó 1kg', 9.90, 15.90, 30],
      ['Sabão em Barra 5un', 6.90, 9.90, 25],
      ['Amaciante 2L', 9.90, 14.90, 20],
      ['Água Sanitária 1L', 3.50, 5.50, 30],
      ['Desinfetante 500ml', 4.50, 6.90, 25],
      ['Limpador Multiuso 500ml', 5.90, 8.90, 20],
      ['Limpa Vidros 500ml', 6.90, 9.90, 15],
      ['Esponja Multiuso 3un', 2.90, 4.50, 25],
      ['Pano Multiuso 5un', 4.50, 6.90, 20],
      ['Saco de Lixo 50L 30un', 7.90, 11.90, 20],
      ['Saco de Lixo 100L 10un', 6.90, 9.90, 15],
      ['Luva de Borracha', 5.90, 8.90, 10],
      ['Rodo c/ Cabo', 12.90, 18.90, 8],
    ],
  },
  {
    id: 'cat-higiene',
    nome: 'Higiene e Beleza',
    products: [
      ['Papel Higiênico 12un', 14.90, 22.90, 30],
      ['Sabonete Barra 90g', 1.90, 3.50, 40],
      ['Shampoo 350ml', 9.90, 16.90, 20],
      ['Condicionador 350ml', 10.90, 17.90, 15],
      ['Creme Dental 90g', 3.50, 5.90, 35],
      ['Escova Dental', 4.90, 8.90, 20],
      ['Desodorante Aerossol', 9.90, 16.90, 25],
      ['Absorvente 8un', 4.90, 7.90, 20],
      ['Fralda Descartável G 20un', 22.90, 34.90, 15],
      ['Lenço Umedecido 50un', 6.90, 9.90, 15],
      ['Algodão 50g', 3.90, 5.90, 10],
      ['Protetor Solar FPS 30', 19.90, 29.90, 10],
    ],
  },
  {
    id: 'cat-congelados',
    nome: 'Congelados',
    products: [
      ['Pizza Congelada 440g', 12.90, 18.90, 20],
      ['Lasanha Congelada 600g', 14.90, 22.90, 15],
      ['Hambúrguer Bovino 672g', 12.90, 18.90, 20],
      ['Nuggets de Frango 300g', 9.90, 14.90, 25],
      ['Batata Pré-Frita 400g', 7.90, 11.90, 20],
      ['Sorvete 2L', 14.90, 24.90, 15],
      ['Picolé Pacote 4un', 7.90, 11.90, 20],
      ['Legumes Congelados 300g', 5.90, 8.90, 15],
      ['Pão de Queijo 400g', 9.90, 14.90, 20],
      ['Açaí 500ml', 12.90, 19.90, 10],
    ],
  },
  {
    id: 'cat-pet',
    nome: 'Pet Shop',
    products: [
      ['Ração Cão Adulto 1kg', 12.90, 19.90, 20],
      ['Ração Cão Filhote 1kg', 14.90, 22.90, 15],
      ['Ração Gato Adulto 1kg', 14.90, 22.90, 15],
      ['Sachê Gato 85g', 2.50, 3.90, 40],
      ['Sachê Cão 100g', 2.90, 4.50, 30],
      ['Areia Sanitária 4kg', 9.90, 14.90, 10],
      ['Petisco Cão 80g', 5.90, 9.90, 15],
      ['Antipulgas Cão', 29.90, 49.90, 8],
    ],
  },
  {
    id: 'cat-bazar',
    nome: 'Bazar e Utilidades',
    products: [
      ['Pilha Alcalina AA 4un', 9.90, 14.90, 15],
      ['Pilha Alcalina AAA 4un', 9.90, 14.90, 12],
      ['Lâmpada LED 9W', 7.90, 12.90, 10],
      ['Fita Adesiva 45mm', 3.90, 5.90, 15],
      ['Isqueiro', 2.90, 4.50, 20],
      ['Copo Descartável 200ml 100un', 4.90, 7.50, 15],
      ['Prato Descartável 15cm 10un', 2.90, 4.50, 10],
      ['Guardanapo 50un', 2.50, 3.90, 20],
      ['Papel Alumínio 30cm 7.5m', 4.90, 7.50, 12],
      ['Filme PVC 28cm 15m', 3.90, 5.90, 10],
    ],
  },
  {
    id: 'cat-matinais',
    nome: 'Matinais e Cereais',
    products: [
      ['Cereal Matinal 300g', 9.90, 14.90, 20],
      ['Granola 800g', 12.90, 18.90, 15],
      ['Aveia em Flocos 250g', 4.50, 6.90, 20],
      ['Geleia de Morango 230g', 6.90, 9.90, 15],
      ['Mel 300g', 12.90, 19.90, 10],
      ['Chocolate ao Leite 90g', 4.90, 7.90, 30],
      ['Chocolate Amargo 90g', 6.90, 10.90, 15],
      ['Barra de Cereal 3un', 3.90, 5.90, 25],
      ['Wafer Chocolate 100g', 2.90, 4.50, 20],
      ['Paçoca 180g', 5.90, 8.90, 15],
    ],
  },
];

// ─── Preset definitions ──────────────────────────────────────

interface StorePreset {
  stockCount: number;
  pdvsPerStock: number;
  categoryCount: number;
}

const PRESETS: Record<StoreSizeValue, StorePreset> = {
  small: { stockCount: 1, pdvsPerStock: 2, categoryCount: 4 },
  medium: { stockCount: 3, pdvsPerStock: 2, categoryCount: 8 },
  large: { stockCount: 5, pdvsPerStock: 3, categoryCount: 12 },
};

// ─── Deterministic random (seeded) ──────────────────────────

/** Simple pseudo-random based on seed for reproducible data. */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─── Generator ───────────────────────────────────────────────

/**
 * Generates a complete mock store dataset for the given size preset.
 *
 * The data is deterministic for a given size — calling with the same size
 * always produces the same stocks, PDVs, categories and product catalog.
 *
 * @param size - Store size preset.
 * @returns Fully generated store data with consistent cross-references.
 */
function generateStoreData(size: StoreSizeValue): GeneratedStoreData {
  const preset = PRESETS[size];
  const rand = seededRandom(size === 'small' ? 42 : size === 'medium' ? 137 : 271);

  // ── Stocks ──
  const stocks: Estoque[] = [];
  for (let i = 0; i < preset.stockCount; i++) {
    const template = STOCK_TEMPLATES[i % STOCK_TEMPLATES.length];
    stocks.push({
      id: `est-${i + 1}`,
      nome: preset.stockCount === 1 ? 'Estoque Principal' : `Estoque ${template.suffix}`,
      pdvIds: [],
      ativo: true,
    });
  }

  // ── PDVs (distributed round-robin across stocks) ──
  const totalPdvs = preset.stockCount * preset.pdvsPerStock;
  const pdvs: Pdv[] = [];
  for (let i = 0; i < totalPdvs; i++) {
    const stockIndex = i % preset.stockCount;
    const stock = stocks[stockIndex];
    const pdvId = `pdv-${i + 1}`;
    const isOnline = rand() > 0.3; // ~70% online by default

    pdvs.push({
      id: pdvId,
      nome: PDV_NAMES[i % PDV_NAMES.length],
      status: isOnline ? 'ONLINE' : 'OFFLINE',
      estoqueId: stock.id,
      endereco: `192.168.1.${10 + i}`,
      ultimoPing: isOnline ? new Date().toISOString() : undefined,
    });

    // Link PDV to stock
    if (!stock.pdvIds) stock.pdvIds = [];
    stock.pdvIds.push(pdvId);
  }

  // ── Categories (pick first N from catalog) ──
  const selectedCategories = CATEGORY_CATALOG.slice(0, preset.categoryCount);
  const categories: EstruturaMercadologica[] = selectedCategories.map((c) => ({
    id: c.id,
    nome: c.nome,
  }));

  // ── Product catalog ──
  const catalog: CatalogProduct[] = [];
  let productIdCounter = 1000;

  for (const cat of selectedCategories) {
    for (const [name, minPrice, maxPrice, avgQty] of cat.products) {
      const price = minPrice + rand() * (maxPrice - minPrice);
      const qty = Math.max(1, Math.round(avgQty * (0.5 + rand())));

      catalog.push({
        produtoId: String(productIdCounter++),
        produtoNome: name,
        categoriaId: cat.id,
        valorUnitario: parseFloat(price.toFixed(2)),
        qtdSistemaBase: qty,
      });
    }
  }

  return { stocks, pdvs, categories, catalog };
}

/**
 * Draws N products from the catalog as InventoryItem[] for a new inventory.
 *
 * Products are selected in a round-robin fashion across categories to ensure
 * diverse inventory composition. Quantity varies randomly around the base.
 *
 * @param catalog - Full product catalog from generateStoreData.
 * @param inventoryId - Parent inventory ID for building item IDs.
 * @param count - How many products to include.
 * @param categoryFilter - Optional category IDs to restrict selection.
 * @returns Inventory items ready to store.
 */
function drawInventoryItems(
  catalog: CatalogProduct[],
  inventoryId: string,
  count: number,
  categoryFilter?: string[],
): InventoryItem[] {
  let pool = catalog;
  if (categoryFilter && categoryFilter.length > 0) {
    pool = catalog.filter((p) => categoryFilter.includes(p.categoriaId));
  }
  if (pool.length === 0) pool = catalog;

  const items: InventoryItem[] = [];
  for (let i = 0; i < count; i++) {
    const product = pool[i % pool.length];
    const suffix = i >= pool.length ? ` #${Math.floor(i / pool.length) + 1}` : '';
    // Vary system quantity ±30% from base
    const qtyVariation = 0.7 + Math.random() * 0.6;
    const qtdSistema = Math.max(1, Math.round(product.qtdSistemaBase * qtyVariation));

    items.push({
      id: `i-${inventoryId}-${i + 1}`,
      produtoId: i < pool.length ? product.produtoId : `${product.produtoId}-${Math.floor(i / pool.length) + 1}`,
      produtoNome: `${product.produtoNome}${suffix}`,
      valorUnitario: product.valorUnitario,
      qtdSistema,
    });
  }
  return items;
}

/**
 * Returns a human-readable summary of a store preset for display in the config screen.
 *
 * @param size - Store size preset.
 * @returns Object with counts for display.
 */
function getStoreSummary(size: StoreSizeValue) {
  const preset = PRESETS[size];
  const totalPdvs = preset.stockCount * preset.pdvsPerStock;
  const totalProducts = CATEGORY_CATALOG
    .slice(0, preset.categoryCount)
    .reduce((sum, cat) => sum + cat.products.length, 0);

  return {
    stocks: preset.stockCount,
    pdvs: totalPdvs,
    categories: preset.categoryCount,
    products: totalProducts,
  };
}

// ─── Exports ─────────────────────────────────────────────────

export {
  generateStoreData,
  drawInventoryItems,
  getStoreSummary,
  StoreSize,
  CATEGORY_CATALOG,
};

export type {
  StoreSizeValue,
  GeneratedStoreData,
  CatalogProduct,
};
