# User Stories — Sistema de Controle de Estoque (Lojas Físicas)

Documento de histórias de usuário derivado dos wireframes. Sistema para lojas físicas controlarem seu estoque, com foco em contagem de inventário.

- **Autenticação:** login via Google Auth.
- **Idiomas:** suporte EN e PT desde o início (i18n); todas as strings da UI devem ser traduzíveis.

---

## Personas

| Persona | Descrição |
|--------|-----------|
| **Operador de loja** | Realiza contagens, consulta listas e registra quantidades. |
| **Gestor / Responsável** | Inicia contagens, configura parâmetros, confere resultados finalizados, pode excluir contagens (se tiver permissão). |

---

## 1. Autenticação e Tela Inicial

### US-1.0 Login com Google
**Como** usuário  
**Quero** entrar no sistema usando minha conta Google  
**Para** acessar o sistema sem criar nova senha.

**Critérios de aceite:**
- Na tela de login existe opção “Entrar com Google” (ou equivalente).
- Ao concluir o fluxo Google Auth, o usuário é autenticado e direcionado à Tela Inicial.
- Textos da tela de login (botão, mensagens) suportam PT e EN conforme locale selecionado.

---

### US-1.1 Acesso pós-login
**Como** usuário autenticado  
**Quero** ser direcionado à tela inicial após o login  
**Para** ter um ponto único de partida para contagens, configurações e saída.

**Critérios de aceite:**
- Após login bem-sucedido (Google), a aplicação exibe a Tela Inicial.
- A tela exibe título e texto explicando as opções disponíveis; textos via i18n (PT/EN).

---

### US-1.2 Navegação para Contagens
**Como** usuário  
**Quero** acessar a tela de contagens a partir da tela inicial  
**Para** ver e gerenciar as contagens de estoque.

**Critérios de aceite:**
- Existe botão "Contagem" na tela inicial.
- Ao clicar em "Contagem", o usuário é levado à tela que lista as últimas contagens (Contagem 1).

---

### US-1.3 Navegação para Configurações
**Como** usuário  
**Quero** acessar a tela de configurações a partir da tela inicial  
**Para** ajustar parâmetros do sistema conforme necessário.

**Critérios de aceite:**
- Existe botão "Configurações" na tela inicial.
- Ao clicar, o usuário é levado à tela de Configurações.

---

### US-1.4 Logout
**Como** usuário  
**Quero** encerrar minha sessão a partir da tela inicial  
**Para** sair do sistema com segurança.

**Critérios de aceite:**
- Existe botão "Sair" na tela inicial.
- Ao clicar, a sessão é encerrada e o usuário é redirecionado ao fluxo de login.

---

## 2. Listagem e Filtros de Contagens (Contagem 1)

### US-2.1 Visualizar últimas contagens
**Como** usuário  
**Quero** ver as últimas contagens realizadas ao entrar na tela de contagens  
**Para** acompanhar o histórico e o status das contagens.

**Critérios de aceite:**
- A tela exibe uma lista/tabela de contagens com: Código, Estoque, Data de início, Data de finalização, Status, Ações.
- Contagens "em andamento" exibem "***" na data de finalização quando não finalizadas.
- Status exibidos incluem pelo menos: "em andamento", "finalizado".

---

### US-2.2 Filtrar contagens
**Como** usuário  
**Quero** filtrar a lista de contagens por Estoque, Data e Status  
**Para** encontrar rapidamente as contagens que me interessam.

**Critérios de aceite:**
- Existem campos de filtro: Estoque, Data, Status.
- Existe botão "Filtrar" que aplica os filtros à lista.
- A lista é atualizada conforme os critérios selecionados.

---

### US-2.3 Abrir nova contagem
**Como** usuário (gestor/responsável)  
**Quero** iniciar uma nova contagem a partir da tela de listagem  
**Para** criar um novo processo de contagem de estoque.

**Critérios de aceite:**
- Existe botão "Abrir nova contagem" na tela de contagens.
- Ao clicar, o usuário é levado à tela de abertura de nova contagem (Contagem 2).

---

### US-2.4 Continuar contagem em andamento
**Como** usuário  
**Quero** continuar uma contagem que está "em andamento"  
**Para** dar sequência ao registro de quantidades até a finalização.

**Critérios de aceite:**
- Para contagens com status "em andamento", existe ação "Continuar" (ícone seta).
- Ao acionar, o usuário é levado à tela de contagem de fato (Contagem 3) daquela contagem.

---

### US-2.5 Conferir contagem finalizada
**Como** usuário  
**Quero** conferir os dados de uma contagem já finalizada  
**Para** revisar resultados e divergências.

**Critérios de aceite:**
- Para contagens com status "finalizado", existe ação "Conferir" (ícone V).
- Ao acionar, o usuário visualiza os detalhes/resultados da contagem finalizada.

---

### US-2.6 Excluir contagem (com permissão)
**Como** usuário com permissão  
**Quero** excluir uma contagem  
**Para** remover registros indesejados ou errados.

**Critérios de aceite:**
- A ação de excluir só é exibida ou permitida se o usuário tiver permissão específica.
- Ao excluir, a contagem é removida (com confirmação conforme regras de negócio).

---

## 3. Abertura de Nova Contagem (Contagem 2)

### US-3.1 Definir estoque da contagem
**Como** usuário  
**Quero** escolher o estoque que será contado ao abrir uma nova contagem  
**Para** que a contagem seja vinculada ao local/cadastro correto.

**Critérios de aceite:**
- Na tela de nova contagem existe campo "Estoque" (obrigatório).
- O usuário seleciona um estoque de uma lista/cadastro disponível.
- Sem estoque selecionado, não é possível criar a contagem.

---

### US-3.2 (Opcional / MVP) Estrutura mercadológica
**Como** usuário  
**Quero** opcionalmente definir categoria ou subcategoria a ser contada  
**Para** organizar a contagem por estrutura mercadológica.

**Critérios de aceite:**
- Campo "Estrutura mercadológica" existe na tela mas não é obrigatório para desenvolvimento mínimo.
- Se implementado, permite definir categoria e/ou subcategoria.

---

### US-3.3 Definir valor a considerar
**Como** usuário  
**Quero** escolher se a contagem considerará valor de venda ou valor de custo dos produtos  
**Para** que totais e relatórios usem a base de valor desejada.

**Critérios de aceite:**
- Existe campo "Valor a considerar" com opções: valor de venda e valor de custo.
- A opção escolhida é armazenada e usada na contagem e nos cálculos.

---

### US-3.4 Criar contagem
**Como** usuário  
**Quero** confirmar a criação da nova contagem após preencher os campos necessários  
**Para** iniciar o processo de contagem.

**Critérios de aceite:**
- Existe botão "Criar".
- Ao clicar, o sistema valida os campos obrigatórios (ao menos Estoque e Valor a considerar).
- Se válido, a contagem é criada e o usuário pode ser direcionado à tela de contagem de fato ou à listagem, conforme fluxo definido.

---

## 4. Contagem de Fato (Contagem 3)

### US-4.1 Ver resumo da contagem em andamento
**Como** usuário  
**Quero** ver um resumo da contagem em andamento no topo da tela  
**Para** acompanhar progresso e metas.

**Critérios de aceite:**
- Exibidos: data de início da contagem, velocidade da contagem (%/dia), quantidade total de produtos, quantidade de produtos já contados, percentual de produtos contados.
- Botão "Voltar" permite retornar à tela anterior (ex.: listagem de contagens).

---

### US-4.2 Registrar quantidade contada por produto
**Como** usuário  
**Quero** informar a quantidade fisicamente contada para cada produto  
**Para** que o sistema compare com a quantidade do sistema e registre divergências.

**Critérios de aceite:**
- A tela exibe uma tabela com: Código, Produto, Valor (unitário), Qtd. contada (editável), Qtd. sistema, Saldo (diferença), Data/hora da contagem.
- O usuário informa a quantidade contada e confirma (ex.: Enter).
- O sistema calcula e exibe o saldo (diferença entre contada e sistema).
- A data/hora do registro da contagem é armazenada e exibida.

---

### US-4.3 Ordenação da lista de produtos
**Como** usuário  
**Quero** que os produtos sejam exibidos em uma ordem que facilite a contagem (ex.: alfabética, por valor)  
**Para** realizar a contagem de forma mais eficiente.

**Critérios de aceite:**
- A lista de produtos possui ordem definida (configurável ou padrão), por exemplo por nome ou valor.

---

### US-4.4 Validação: PDV online
**Como** sistema  
**Quero** verificar se os PDVs vinculados ao estoque em contagem estão online antes de aceitar o registro  
**Para** evitar inconsistências por vendas não refletidas.

**Critérios de aceite:**
- Ao registrar uma quantidade contada (ex.: ao pressionar Enter), o sistema verifica se há PDV vinculado ao estoque offline.
- Se algum PDV estiver offline, exibe mensagem orientando o usuário a conectá-lo e não registra até que estejam online (ou conforme regra de negócio).

---

### US-4.5 Validação: transferências pendentes
**Como** sistema  
**Quero** verificar se o produto possui transferências de estoque pendentes antes de aceitar o registro  
**Para** garantir consistência com movimentações em aberto.

**Critérios de aceite:**
- Ao registrar quantidade contada, o sistema verifica se existem transferências pendentes para aquele produto.
- Se houver, exibe mensagem orientando a finalizar as transferências e não registra até que não haja pendências (ou conforme regra de negócio).

---

### US-4.6 Registro quando quantidade confere
**Como** usuário  
**Quero** que, quando a quantidade contada for igual à do sistema, o sistema registre e permita seguir para o próximo produto  
**Para** agilizar a contagem quando não há divergência.

**Critérios de aceite:**
- Se Qtd. contada = Qtd. sistema, o sistema grava o registro e permite seguir para o próximo item sem fluxo extra.

---

### US-4.7 Tratamento de divergência (contagem às cegas)
**Como** usuário  
**Quero** que, em caso de divergência, o sistema informe e me dê uma única chance de corrigir  
**Para** evitar tentativas repetidas de “acertar” o número do sistema (contagem às cegas).

**Critérios de aceite:**
- Se Qtd. contada ≠ Qtd. sistema, o sistema informa a divergência e pergunta se o usuário deseja refazer a contagem e corrigir.
- **Não:** o sistema registra a quantidade informada (divergente) e segue.
- **Sim:** o usuário tem **uma única** nova chance de informar outra quantidade.
- Após essa única nova tentativa: se ainda houver divergência, o sistema registra essa segunda quantidade divergente e segue (sem novas tentativas).

---

## 5. Configurações

### US-5.1 Acessar configurações
**Como** usuário  
**Quero** acessar a tela de configurações a partir da tela inicial  
**Para** alterar preferências básicas do sistema.

**Critérios de aceite:**
- A tela de Configurações é acessível pelo botão correspondente na Tela Inicial.
- Escopo básico (MVP): seleção de idioma (PT/EN), preferências de exibição (ex.: ordem padrão da lista de produtos na contagem), dados da conta logada (Google) e opção de sair. Itens avançados em fase 2 (ver `docs/phase2-and-pending.md`).

---

## Resumo por tela

| Tela | User stories |
|------|----------------|
| Login | US-1.0 |
| Tela Inicial | US-1.1 a US-1.4 |
| Contagem 1 (listagem) | US-2.1 a US-2.6 |
| Contagem 2 (nova contagem) | US-3.1 a US-3.4 |
| Contagem 3 (contagem de fato) | US-4.1 a US-4.7 |
| Configurações | US-5.1 |

---

## Dependências e observações

- **Login:** Google Auth (US-1.0); detalhes no SDD.
- **Permissões:** controle básico e frequente — excluir, criar, continuar, conferir e finalizar contagem; ver SDD §2.6.
- **PDV e transferências:** via interface do provedor ERP (CPlug inicial); detalhes no SDD.
- **Estrutura mercadológica:** fase 2; ver `docs/phase2-and-pending.md`.
- **i18n:** suporte EN e PT desde o início; todas as strings da UI em chaves de tradução.
