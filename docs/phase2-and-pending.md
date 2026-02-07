# Fase 2, pendências e sugestões

Itens fora do escopo MVP ou a definir depois. Mantidos em arquivo separado para não poluir o SDD e as user stories.

---

## Fase 2 (pós-MVP)

### Funcionalidades
- **Estrutura mercadológica:** campo categoria/subcategoria na abertura de nova contagem; filtro ou escopo de produtos por categoria na contagem.
- **Relatórios e exportação:** relatório de contagem (PDF/Excel), histórico de divergências, indicadores por depósito.
- **Configurações avançadas:** parâmetros de contagem (ex.: obrigatoriedade de PDV online), vínculo estoque ↔ PDV em tela, integração com outro ERP (troca de provedor além do CPlug).
- **Permissões avançadas:** perfis customizáveis, papéis “só leitura”, limites por depósito ou loja.

### Melhorias de produto
- Ordenação configurável da lista de produtos na contagem (salvar preferência por usuário).
- Filtros salvos na listagem de contagens.
- Notificações ou avisos quando contagem ficar parada por X dias.

---

## Pendências (a decidir com produto/negócio)

- **Fórmula de velocidade:** no SDD foi definida uma fórmula padrão substituível; se o negócio quiser outra (ex.: por hora, ou ponderada), basta trocar a implementação da fórmula mantendo o contrato (entrada: contagem; saída: %/dia ou texto).
- **Conteúdo da tela Conferir:** se será só leitura da tabela de itens + resumo ou se terá ações (ex.: reabrir, exportar). MVP: visualização.
- **Múltiplas lojas:** se um mesmo usuário acessa mais de uma loja e como escolher contexto (loja/depósito) no login ou no app.

---

## Sugestões técnicas

- **Adapter do provedor:** implementar o contrato do provedor (§3 SDD) em módulo isolado (ex.: `erp-provider/`, implementações `cplug/`, `outro-erp/`); injeção por config ou env.
- **Cache e offline:** definir se listagem de contagens e itens da contagem podem ser cacheados (ex.: React Query com stale time) e se haverá modo offline limitado (ex.: só leitura).
- **Testes:** testes de integração contra mock do contrato do provedor para validar troca de ERP sem quebrar fluxos.
- **Auditoria:** registrar quem finalizou/excluiu contagem e quando; dados já previstos em criadoPor/criadoEm; estender para finalizadoPor/finalizadoEm e excluídoPor/excluídoEm se necessário.

---

## Referências

- SDD: `docs/sdd-architecture.md`
- User stories: `docs/user-stories.md`
