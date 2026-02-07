/**
 * Estoque (stock/depot) domain types.
 */

export interface Estoque {
  id: string;
  nome: string;
  pdvIds?: string[];
  ativo: boolean;
}
