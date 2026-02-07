# Software Design Document (SDD) — Arquitetura

Sistema de controle de estoque para lojas físicas. Este documento descreve a arquitetura de software alinhada aos wireframes e às user stories, e à **Feature-Sliced Design (FSD)** adotada no projeto.

---

## 1. Visão geral do sistema

### 1.1 Objetivo
Permitir que lojas físicas controlem seu estoque por meio de:
- Contagens de inventário (abertura, execução, conferência).
- Filtros e listagem de contagens.
- Regras de validação (PDV online, transferências pendentes, divergência “às cegas”).
- Navegação pós-login: Tela Inicial → Contagens / Configurações / Logout.

### 1.2 Autenticação
- **Login:** Google Auth (OAuth2/OpenID Connect). O usuário acessa o sistema via “Entrar com Google”.
- **Sessão:** Após login, o app mantém token/refresh e identifica o usuário (id, email, nome) para auditoria e permissões.
- **Logout:** Encerra sessão local e redireciona para tela de login. Não utiliza o OAuth da Connect Plug para login de usuário; o CPlug OAuth é usado apenas para chamadas à API do ERP (credenciais de aplicativo/backend).

### 1.3 Fonte de dados (ERP terceiro)
- A base de dados de negócio (estoques, produtos, contagens, transferências) vem de um **sistema terceiro (ERP)**.
- A aplicação **não persiste** esses dados localmente como fonte da verdade; consome e envia via **interface de provedor de ERP**.
- Provedor inicial: **Connect Plug (CPlug)** — [API v3](https://cplug.redocly.app/openapi).
- A interface do provedor deve ser bem definida para permitir trocar o ERP (outro provedor) sem alterar a lógica de negócio das features.

### 1.4 Internacionalização (i18n)
- **Desde o início:** suporte a múltiplos idiomas.
- **Idiomas:** PT (português) e EN (inglês). Chaves de tradução para todas as strings da UI; locale padrão configurável (ex.: PT).
- Textos de erro, botões, labels, títulos e mensagens do sistema devem vir do i18n.

### 1.5 Camadas FSD (resumo)
- **app/** — Bootstrap, roteamento global, providers (auth, i18n, ERP provider).
- **screens/** — Telas (Tela Inicial, Contagem 1, 2, 3, Configurações).
- **widgets/** — Componentes compostos reutilizáveis (ex.: layout com abas).
- **features/** — Ações de usuário (auth, contagem, filtros, criar contagem, registrar quantidade, conferir, excluir).
- **entities/** — Modelos de domínio (Contagem, Estoque, Produto, ContagemItem, etc.).
- **shared/** — UI base, API client, libs, tipos comuns, contratos do provedor ERP.

---

## 2. Modelos de dados (entidades)

### 2.1 Estoque (Inventory / Stock)
Representa o **depósito** (por depósito): cada estoque é um depósito. Pode haver vários estoques/depósitos por loja.

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | string (UUID) | sim | Identificador único |
| nome | string | sim | Nome do estoque (ex.: "ESTOQUE 1") |
| pdvIds? | string[] | não | IDs dos PDVs vinculados (para validação online); origem via interface PDV |
| ativo | boolean | sim | Se está disponível para contagem |

---

### 2.2 Estrutura mercadológica (opcional para MVP)
Categoria e/ou subcategoria para escopo da contagem.

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | string | sim | Identificador |
| categoria | string | não | Categoria |
| subcategoria? | string | não | Subcategoria |

*MVP: pode ser omitida ou só categoria.*

---

### 2.3 Contagem (Count)
Uma “rodada” de contagem de inventário.

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | string | sim | Código da contagem (ex.: "001") |
| estoqueId | string | sim | Referência ao Estoque |
| estruturaMercadologicaId? | string | não | Opcional (MVP) |
| valorAConsiderar | enum | sim | `VENDA` \| `CUSTO` |
| dataInicio | datetime | sim | Início da contagem |
| dataFinalizacao? | datetime | não | Preenchido ao finalizar; "***" na UI se em andamento |
| status | enum | sim | `EM_ANDAMENTO` \| `FINALIZADO` |
| criadoEm | datetime | sim | |
| criadoPor? | string | não | Usuário que criou |

---

### 2.4 ContagemItem (item da contagem)
Quantidade contada por produto em uma contagem.

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | string | sim | |
| contagemId | string | sim | |
| produtoId | string | sim | |
| qtdSistema | number | sim | Quantidade no sistema no momento |
| qtdContada | number | sim | Quantidade informada pelo usuário |
| valorUnitario | number | sim | Preço (venda ou custo conforme contagem) |
| dataHoraContagem | datetime | sim | Momento do registro |
| saldo | number | derivado | qtdContada - qtdSistema |

---

### 2.5 Produto
Entidade de catálogo (pode vir de outro módulo/serviço).

| Atributo | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| id | string | sim | Código (ex.: 9602) |
| nome | string | sim | Ex.: "PRODUTO A" |
| valorVenda | number | sim | |
| valorCusto | number | sim | |

*Uso: listagem na Contagem 3; valor exibido conforme `valorAConsiderar` da Contagem.*

---

### 2.6 Usuário e permissões
- **Usuário:** id, nome, email (Google), foto (opcional). Identificação via Google Auth.
- **Permissões:** controle básico e frequente para os usuários. Inclui:
  - **contagem:excluir** — Excluir contagem (já especificado).
  - **contagem:criar** — Abrir nova contagem.
  - **contagem:continuar** — Continuar contagem em andamento.
  - **contagem:conferir** — Conferir contagem finalizada.
  - **contagem:finalizar** — Finalizar contagem (híbrido: botão ou automático).
- Permissões podem ser atribuídas por perfil ou por usuário; modelo de armazenamento (local vs. ERP) a definir na implementação.

---

## 3. Interface do provedor ERP (troca de provedor)

A aplicação depende de um **provedor de dados (ERP)**. A interface desse provedor deve ser única e estável para que trocar de ERP (ex.: CPlug → outro) exija apenas nova implementação do contrato, sem mudar features ou telas.

### 3.1 Contrato do provedor (abstração)

O provedor implementa uma interface (ou conjunto de serviços) que expõe:

| Operação | Descrição | Usado em |
|----------|-----------|----------|
| **listStocks()** | Listar estoques (depósitos) | Nova contagem, filtros |
| **getStock(id)** | Detalhe de um estoque | Validações, PDV |
| **listInventories(filters)** | Listar contagens com filtros (estoqueId, dataInicio, dataFim, status) | Contagem 1 |
| **getInventory(id)** | Detalhe de uma contagem + metadados | Continuar, Conferir |
| **createInventory(params)** | Criar contagem (estoqueId, valorAConsiderar, estruturaMercadologicaId?) | Contagem 2 |
| **updateInventory(id, patch)** | Atualizar contagem (ex.: status FINALIZADO) | Finalização |
| **deleteInventory(id)** | Excluir contagem | Contagem 1 (ação Excluir) |
| **listInventoryItems(inventoryId)** | Lista de produtos da contagem com qtd sistema, valor (venda/custo), ordem | Contagem 3 |
| **registerCountedQuantity(inventoryId, productId, qtdContada)** | Registrar quantidade contada; retorna sucesso ou erro de validação (PDV, transferência, divergência) | Contagem 3 |
| **getPdvStatus(stockId)** | Verificar se PDVs vinculados ao estoque estão online | Validação antes de registrar |
| **getPendingTransfers(productId, stockId?)** | Verificar transferências pendentes para o produto | Validação antes de registrar |
| **listCategories()** | Categorias (estrutura mercadológica) — opcional | Nova contagem (fase 2) |

- **Produtos:** podem vir do provedor (listInventoryItems já retorna código, nome, valor, qtd sistema) ou de um endpoint `listProducts(stockId?, categoryId?)` se a listagem for montada no app. Preferir que o provedor devolva a lista pronta para a contagem.
- **Datas:** uso de ISO 8601 em UTC com timezone da loja (conforme CPlug).

### 3.2 Provedor inicial: Connect Plug (CPlug)

- **Documentação:** [Connect Plug API 3.0](https://cplug.redocly.app/openapi).
- **Autenticação API:** OAuth2 (grant type password ou refresh_token). Credenciais (client_id, client_secret, usuário/senha do ERP) ficam no backend ou em config segura; o app mobile/web não expõe senha do ERP.
- **Mapeamento sugerido (CPlug → domínio interno):**

| Domínio interno | CPlug API |
|-----------------|-----------|
| listStocks | `GET /api/v3/stocks` |
| getStock | `GET /api/v3/stocks/{stockId}` |
| listInventories | `GET /api/v3/stocks/{stockId}/inventories` (e filtrar por data/status no client ou se CPlug suportar query) |
| getInventory | `GET /api/v3/stocks/{stockId}/inventories/{inventoryId}` |
| createInventory | `POST /api/v3/stocks/{stockId}/inventories` |
| updateInventory | `PUT /api/v3/stocks/{stockId}/inventories/{inventoryId}` |
| deleteInventory | `DELETE /api/v3/stocks/{stockId}/inventories/{inventoryId}` |
| listInventoryItems | `GET /api/v3/stocks/{stockId}/inventories/{inventoryId}/items` |
| registerCountedQuantity | `PUT /api/v3/stocks/{stockId}/inventories/{inventoryId}/items` (ou endpoint específico de registro de contagem) |
| Transferências pendentes | `GET /api/v3/stock-transfers` (filtrar por produto/estoque e status pendente) |
| PDV / Caixas | `GET /api/v3/cash-registers` e status de drawer/PDV conforme documentação CPlug (PDV: drawer-list, etc.); definir interface interna para “PDV online” |

- **Observação:** A API CPlug tem **Inventários de um estoque** e **Transferência entre estoques**. O adapter CPlug deve traduzir os payloads e códigos de erro para o contrato interno do provedor. Se um endpoint exato não existir (ex.: registro de quantidade com validações), o backend do app pode orquestrar várias chamadas CPlug e aplicar as regras de PDV e transferências.

### 3.3 PDV (status online)

- **Requisito:** Interface com algum sistema ou controle interno que indique se os PDVs vinculados a um estoque estão online.
- **Opções:** (1) Integração com CPlug (caixas/PDV conforme API); (2) Controle interno no backend (registro de “último heartbeat” por PDV); (3) Outro sistema externo via adapter.
- O contrato do provedor expõe `getPdvStatus(stockId)`; a implementação pode ser CPlug + camada interna que agregue “online” por estoque.

---

## 4. APIs da aplicação (backend próprio)

*Estas são as APIs que o frontend/ app consome. O backend da aplicação implementa a orquestração e chama o provedor ERP (ex.: CPlug).*

### 4.1 Estoque
- `GET /estoques` — Listar estoques (depósitos); backend delega ao provedor ERP.
- `GET /estoques/:id` — Detalhe; usado para PDV vinculado quando necessário.

### 4.2 Contagens
- `GET /contagens` — Listar com filtros query: `estoqueId`, `dataInicio`, `dataFim`, `status`. Backend → provedor.listInventories.
- `GET /contagens/:id` — Detalhe + itens (Conferir, Continuar). Backend → provedor.getInventory + itens.
- `POST /contagens` — Criar (body: estoqueId, estruturaMercadologicaId?, valorAConsiderar). Backend → provedor.createInventory.
- `PATCH /contagens/:id` — Atualizar (ex.: status FINALIZADO). Backend → provedor.updateInventory; checagem de permissão `contagem:finalizar`.
- `DELETE /contagens/:id` — Excluir; checagem de permissão `contagem:excluir`. Backend → provedor.deleteInventory.

### 4.3 Contagem – itens e registro
- `GET /contagens/:id/itens` — Lista de produtos da contagem (qtd sistema, valor, ordem). Backend → provedor.listInventoryItems.
- `POST /contagens/:id/itens/:produtoId/registrar` — Registrar quantidade contada (body: qtdContada). Backend chama provedor (e validações PDV/transferências); aplica regra de divergência “às cegas” e retorna sucesso ou mensagem de bloqueio.

### 4.4 Autenticação e autorização
- **Login:** Google Auth; backend valida token Google e cria/atualiza sessão e usuário (id, nome, email).
- **Requisições:** token de sessão ou Bearer enviado; backend valida e aplica permissões (contagem:excluir, contagem:criar, etc.).

---

## 5. Fluxos de validação (Contagem 3)

Ao registrar quantidade contada (ex.: Enter):

1. **PDV online**  
   - Entrada: estoqueId (da contagem).  
   - Se algum PDV do estoque estiver offline → retornar erro/mensagem; não persistir.  
   - Se todos online → seguir.

2. **Transferências pendentes**  
   - Entrada: produtoId (e possivelmente estoqueId).  
   - Se houver transferência pendente para o produto → retornar erro/mensagem; não persistir.  
   - Se não houver → seguir.

3. **Divergência (contagem às cegas)**  
   - Se qtdContada === qtdSistema → persistir e retornar sucesso.  
   - Se qtdContada !== qtdSistema:  
     - Retornar indicação de “divergência” e perguntar “Deseja refazer a contagem?”.  
     - **Não:** persistir qtdContada atual e retornar sucesso.  
     - **Sim:** permitir **uma** nova entrada; após essa entrada, persistir o valor informado (conferindo ou divergente) e retornar sucesso.

Essas regras devem ser implementadas no backend (e eventualmente refletidas no contrato da API de registro).

---

## 6. Estrutura de telas e FSD

### 6.1 Rotas / Screens
- `/` ou `/inicial` — Tela Inicial (pós-login).
- `/contagens` — Listagem (Contagem 1): filtros + tabela + ações (Continuar, Conferir, Excluir) + “Abrir nova contagem”.
- `/contagens/nova` — Nova contagem (Contagem 2): formulário Estoque, Estrutura mercadológica (opcional), Valor a considerar, botão Criar.
- `/contagens/:id` — Contagem de fato (Contagem 3): resumo, tabela de produtos, registro de quantidade, validações.
- `/configuracoes` — Configurações (escopo a definir).
- Rotas de login/logout (fora do escopo dos wireframes).

### 6.2 Mapeamento Screen → Features / Entities
- **Tela Inicial:** feature `auth` (logout), feature `navigation` (links para Contagens e Configurações).
- **Contagem 1:** entity `Contagem`, feature `listagem-contagens` (filtros, tabela), feature `contagem-acoes` (continuar, conferir, excluir), feature `abrir-nova-contagem` (navegação para Contagem 2).
- **Contagem 2:** entity `Contagem`, `Estoque`, feature `criar-contagem` (formulário + submit).
- **Contagem 3:** entity `Contagem`, `ContagemItem`, `Produto`, feature `registrar-quantidade` (input + validações PDV, transferências, divergência), feature `resumo-contagem` (métricas no topo).

### 6.3 Widgets sugeridos
- Layout principal com área de conteúdo e (se aplicável) abas ou tabs.
- Tabela reutilizável para listagem de contagens e para lista de produtos na contagem de fato.
- Formulário de filtros (Estoque, Data, Status) reutilizável onde fizer sentido.

---

## 7. Estado e navegação

- **Servidor:** contagens, itens, estoques, produtos — fonte da verdade no backend.
- **Cliente:**  
  - Cache de listagens (ex.: React Query) com invalidação após criar/continuar/excluir/finalizar.  
  - Estado local de formulários (filtros, nova contagem, quantidade digitada).  
  - Estado da “única chance” de correção na divergência (ex.: flag + segundo input) na UI, com regra de negócio garantida no backend.

---

## 8. Regras de negócio resumidas

- Permissões: excluir, criar, continuar, conferir e finalizar contagem conforme §2.6.
- Nova contagem exige: estoque (depósito) + valor a considerar (venda ou custo).
- Ao registrar quantidade: validar PDV online e transferências pendentes antes de gravar (via provedor ERP).
- Em caso de divergência: uma única chance de reinserir quantidade; depois disso registrar o valor informado.
- Contagem “em andamento” mostra data de finalização como "***" na listagem.
- **Finalização:** híbrida — (1) botão explícito “Finalizar” na Contagem 3 (usuário com permissão `contagem:finalizar`) e/ou (2) automático ao atingir 100% dos produtos contados; critério configurável.
- **Velocidade da contagem (%/dia):** fórmula padrão substituível por configuração. Sugestão: `(qtdProdutosContados / qtdProdutosTotal) * 100 / max(1, diasDesdeInicio)`, onde `diasDesdeInicio = diffEmDias(hoje, dataInicio)`. Permite trocar a fórmula depois sem quebrar a tela.

---

## 9. Configurações (escopo básico)

Com base no sistema e no que é considerado parte da base do produto:
- **Idioma:** seleção de locale (PT / EN); persiste preferência do usuário.
- **Exibição:** preferências simples (ex.: ordem padrão da lista de produtos na contagem — nome, valor, código).
- **Conta:** exibir dados do usuário logado (Google) e opção de sair.
- Itens avançados (parâmetros de contagem, integração ERP, perfis) ficam para fase 2; ver `docs/phase2-and-pending.md`.

---

## 10. Segurança e integração

- Autenticação: Google Auth em todas as rotas protegidas; sessão validada no backend.
- Autorização: por permissões (§2.6) em cada ação (excluir, criar, continuar, conferir, finalizar).
- ERP: credenciais CPlug (ou outro provedor) apenas no backend; app nunca expõe client_secret ou senha ERP.
- PDV e transferências: via interface do provedor; tratamento de timeout e PDV offline (mensagem ao usuário, não persistir registro até resolver).

---

## 11. Design de telas (UI/UX)

Ao implementar as telas, seguir o skill **ui-ux-pro-max** (`.cursor/skills/ui-ux-pro-max/SKILL.md`):

1. **Design system:** Gerar sistema de design com `--design-system` (ex.: “inventory dashboard retail”) e persistir com `--persist` para o projeto; usar MASTER + overrides por página se necessário.
2. **Stack:** Usar o stack do projeto (ex.: React Native conforme regras do repo); buscar guidelines com `--stack react-native` (ou o stack adotado).
3. **Checklist pré-entrega:** Não usar emojis como ícones; usar SVG (Heroicons, Lucide); cursor pointer em elementos clicáveis; hover/feedback visível; contraste e bordas em light/dark; padding e max-width consistentes; acessibilidade (alt, labels, foco, reduced-motion).

Referência: `.cursor/skills/ui-ux-pro-max/SKILL.md`.

---

## Referências

- User stories: `docs/user-stories.md`
- Fase 2 e pendências: `docs/phase2-and-pending.md`
- Wireframes: imagens Tela Inicial, Contagem 1, Contagem 2, Contagem de fato
- Connect Plug API: https://cplug.redocly.app/openapi
- Arquitetura do projeto: FSD — `.cursor/rules/architecture-fsd.mdc`
- UI/UX: `.cursor/skills/ui-ux-pro-max/SKILL.md`
