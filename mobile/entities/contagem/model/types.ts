/**
 * Contagem (inventory count) domain types.
 */

export const CountStatus = {
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  FINALIZADO: 'FINALIZADO',
} as const;

export type CountStatusValue = (typeof CountStatus)[keyof typeof CountStatus];

export const ValorAConsiderar = {
  VENDA: 'VENDA',
  CUSTO: 'CUSTO',
} as const;

export type ValorAConsiderarValue = (typeof ValorAConsiderar)[keyof typeof ValorAConsiderar];

export interface Contagem {
  id: string;
  estoqueId: string;
  estruturaMercadologicaId?: string;
  valorAConsiderar: ValorAConsiderarValue;
  dataInicio: string;
  dataFinalizacao?: string;
  status: CountStatusValue;
  criadoEm: string;
  criadoPor?: string;
}
