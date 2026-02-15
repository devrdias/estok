/**
 * PDV (Ponto de Venda / Point of Sale) domain types.
 *
 * A PDV is a sales terminal linked to one or more stocks (Estoque).
 * During inventory counting, all PDVs linked to the stock being counted
 * must be online — otherwise the count registration is blocked (US-4.4).
 */

export const PdvStatus = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
} as const;

export type PdvStatusValue = (typeof PdvStatus)[keyof typeof PdvStatus];

export interface Pdv {
  /** Unique identifier for this PDV. */
  id: string;
  /** Human-readable name (e.g. "Caixa 01", "PDV Balcão"). */
  nome: string;
  /** Current connection status. */
  status: PdvStatusValue;
  /** ID of the stock (Estoque) this PDV is linked to. */
  estoqueId: string;
  /** IP address or hostname for display/diagnostics. */
  endereco?: string;
  /** Last time this PDV reported a heartbeat. */
  ultimoPing?: string;
}
