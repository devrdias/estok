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

export const ModalidadeContagem = {
  LOJA_FECHADA: 'LOJA_FECHADA',
  LOJA_ABERTA: 'LOJA_ABERTA',
} as const;

export type ModalidadeContagemValue = (typeof ModalidadeContagem)[keyof typeof ModalidadeContagem];

export interface Contagem {
  id: string;
  estoqueId: string;
  estruturaMercadologicaId?: string;
  /** Multi-select: IDs of selected product structures. Empty = all. */
  estruturaMercadologicaIds?: string[];
  valorAConsiderar: ValorAConsiderarValue;
  /** Counting mode: store closed or store open. */
  modalidadeContagem?: ModalidadeContagemValue;
  dataInicio: string;
  dataFinalizacao?: string;
  status: CountStatusValue;
  criadoEm: string;
  criadoPor?: string;
  /** Display name of the user who created (started) the count. */
  criadoPorNome?: string;
  /** Fase 2 auditoria: quem e quando finalizou. */
  finalizadoPor?: string;
  /** Display name of the user who finalized the count. */
  finalizadoPorNome?: string;
  finalizadoEm?: string;
  /** Fase 2 auditoria: soft-delete — quem e quando excluiu. */
  excluidoPor?: string;
  excluidoEm?: string;
}
