# Current Task: Implementação do app (controle de estoque)

## Plan

### A – Bootstrap e estrutura
- [x] A1: Criar projeto Expo (TypeScript) e dependências base
- [x] A2: Estrutura FSD (app, screens, widgets, features, entities, shared) e aliases
- [x] A3: i18n (EN + PT) e locale padrão
- [x] A4: Expo Router (file-based) e layouts base

### B – Auth e shell
- [x] B1: Google Auth (expo-auth-session) e provider; fallback para mock se env não configurado
- [x] B2: Tela de login e layout protegido (redirect pós-login para Tela Inicial)
- [x] B3: Logout e persistência de sessão (expo-secure-store)

### C – Tela Inicial e Configurações (básico)
- [x] C1: Tela Inicial com botões Contagem, Configurações, Sair
- [x] C2: Tela Configurações (idioma PT/EN, conta mock, sair)

### D – Contagens (listagem e nova)
- [x] D1: Contrato do provedor ERP (shared/api) e mock adapter
- [x] D2: Tela Contagens (Contagem 1): listagem, “Abrir nova contagem”
- [x] D3: Tela Nova contagem (Contagem 2): Estoque + Valor a considerar + Criar

### E – Contagem de fato (Contagem 3) — mock
- [x] E1: Tela Contagem 3: resumo, tabela de produtos, registro de quantidade (validações reais depois)

### F – Layout moderno (UX)
- [x] F1: Bottom tabs (Início, Contagens, Configurações) com ícones e tema
- [x] F2: Stack em Contagens (list → nova → [id]) com header próprio
- [x] F3: Home simplificada (CTA único); Config e lista sem “Voltar” redundante

### G – Filtros, Conferir e Finalizar
- [x] G1: Filtros na listagem (Estoque, Status, Data de/até) + botão Filtrar; mock com dataInicio/dataFim
- [x] G2: Ação "Conferir" para contagens finalizadas; tela [id] em modo somente leitura quando status FINALIZADO
- [x] G3: Botão "Finalizar contagem" na Contagem 3 (EM_ANDAMENTO) com confirmação; updateInventory no mock

### H – Validação, velocidade e idioma
- [x] H1: Validação ao registrar: Alert em falha (success: false); fluxo divergência (uma chance de refazer)
- [x] H2: Velocidade (%/dia) no resumo da Contagem 3
- [x] H3: Persistir idioma (expo-secure-store) e aplicar no init (LanguageRestorer)

### I – Data de finalização e permissões
- [x] I1: Coluna "Data de finalização" na listagem; "***" quando em andamento (US-2.1, SDD)
- [x] I2: usePermissions (mock) em features/auth; Excluir e Finalizar condicionados a canDeleteCount/canFinalizeCount

### J – Confirmação e testes
- [x] J1: Confirmação antes de excluir contagem (Alert com Cancelar / Excluir); i18n deleteConfirmTitle/Message
- [x] J2: Testes unitários do mock ERP (Jest + jest-expo): listStocks, listInventories+filtros, create/update/delete, registerCountedQuantity

### K – Logo Balanço na app
- [x] K1: Componente Logo em shared/ui (react-native-svg, blocos empilhados, cores tema, showWordmark)
- [x] K2: Logo na Home e no Login (size + wordmark, a11y)

### L – Polish MVP (logo + testes)
- [x] L1: Logo na tela Configurações (40px + wordmark)
- [x] L2: Testes unitários do componente Logo (5 testes: wordmark, a11y, size); @testing-library/react-native com --legacy-peer-deps

### M – User stories pendentes (docs/user-stories.md)
- [x] M1: US-1.4 — Botão "Sair" na Tela Inicial (Home)
- [x] M2: US-4.2 — Coluna "Data/hora da contagem" na tabela Contagem 3 + i18n countedAt, pdvOffline*, transferPending*
- [x] M3: US-4.3 — Ordenação padrão da lista de produtos por nome (Contagem 3)
- [x] M4: US-4.4 e US-4.5 — Contrato ERP: checkPdvOnline e checkTransferenciasPendentes (opcionais); mock retorna ok; tela [id] chama antes de registrar e bloqueia com Alert se não ok; testes para os dois métodos

### N – Fase 2: Ordenação configurável (Melhorias de produto)
- [x] N1: Preferência de ordem da lista na contagem (nome/código/valor): SecureStore em shared/config/preferences.ts; Configurações com seção "Ordem da lista na contagem" (3 opções); i18n
- [x] N2: Contagem 3 usa preferência (getStoredProductSortOrder, useMemo sortedItems por sortOrder)

### O – Fase 2: Adapter do provedor (Sugestões técnicas)
- [x] O1: getErpProvider() lê EXPO_PUBLIC_ERP_PROVIDER (mock|cplug); cplug-erp-provider.ts stub (listas vazias, create/update/delete/register não implementados); ErpProviderContextProvider usa getErpProvider(); export getErpProvider e cplugErpProvider

### P – Fase 2: Filtros salvos na listagem (Melhorias de produto)
- [x] P1: getStoredCountListFilters / setStoredCountListFilters em preferences.ts (JSON em SecureStore); contagens/index restaura filtros no mount e persiste ao aplicar; isoToDisplayDate para exibir datas salvas (DD/MM/YYYY)

### Q – Fase 2: Estrutura mercadológica (Funcionalidades)
- [x] Q1: Contrato ErpProvider: EstruturaMercadologica, listEstruturasMercadologicas?(); mock com categorias (Alimentos, Bebidas, Limpeza) e createInventory gravando estruturaMercadologicaId; cplug stub retorna []; nova contagem: dropdown opcional "Estrutura mercadológica" (Todas / categorias), i18n structureLabel/allCategories; testes listEstruturasMercadologicas e createInventory com estruturaMercadologicaId

### R – Fase 2: Auditoria (Sugestões técnicas)
- [x] R1: Contagem: finalizadoPor, finalizadoEm, excluidoPor, excluidoEm; mock updateInventory preenche finalizadoPor/finalizadoEm ao finalizar; mock deleteInventory faz soft-delete (excluidoPor/excluidoEm), listInventories e getInventory ignoram excluídos; testes de auditoria

### S – Fase 2: Aviso contagens paradas (Melhorias de produto)
- [x] S1: Na listagem de contagens, aviso quando existem contagens EM_ANDAMENTO há mais de 7 dias (STALE_COUNT_DAYS); banner com i18n counts.staleBanner (interpolação count, days)

## Progress Notes
- 2025-02-06: Iniciada implementação conforme workflow-orchestration; plano em tasks/todo.md.
- 2025-02-07: A1–A4 concluídos: Expo em mobile/, Expo Router, FSD, i18n PT/EN, rotas.
- 2025-02-07: B–E com mocks: auth mock (login/logout), Tela Inicial (3 botões), Configurações (idioma, conta, sair), contrato ERP + mock, Contagens list/nova/[id] (contagem de fato).
- 2025-02-06: B1/B3 atualizados: Google OAuth (expo-auth-session + expo-web-browser, provider Google), persistência com expo-secure-store; EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (e opcionalmente iOS/Android) para login real.
- 2025-02-07: F1–F3: layout com bottom tabs (Tabs do expo-router), stack em contagens (_layout.tsx), tema primary no header/tab bar; @expo/vector-icons adicionado; i18n home.tabLabel (Início/Home).
- 2025-02-07: G1–G3: filtros (Estoque chips, Status chips, Data de/até, Filtrar); Conferir para finalizado e [id] read-only; Finalizar contagem com Alert e updateInventory; coluna Saldo na tabela; i18n counts.dateFrom/dateTo/allStocks/allStatuses/finalize/finalizedSuccess/viewOnly/balance.
- 2025-02-07: H1–H3: divergência às cegas (Alert Não/Sim, segunda chance); Alert em falha de registro; velocidade (%/dia) no resumo; persistência de idioma (getStoredLanguage/setStoredLanguage, LanguageRestorer no root).
- 2025-02-07: I1–I2: coluna Data de finalização com *** em andamento; usePermissions em auth (mock todos true), Excluir e Finalizar condicionados.
- 2025-02-07: J1–J2: confirmação ao excluir (Alert); Jest + jest-expo, 14 testes para mockErpProvider em shared/api/__tests__.
- 2025-02-07: K1–K2: Logo em shared/ui/Logo.tsx (Svg+Rect, primary/secondary), export em index; Home e Login com Logo + wordmark.
- 2025-02-07: L1–L2: Logo em Configurações; testes do Logo (shared/ui/__tests__/Logo.test.tsx, 5 casos); @testing-library/react-native instalado (legacy-peer-deps). Suíte: 19 testes.
- 2025-02-07: M1–M4 (user-stories): Sair na Home; coluna Data/hora da contagem + ordenação por nome na Contagem 3; checkPdvOnline e checkTransferenciasPendentes no contrato ERP, mock e UI; 21 testes.
- 2025-02-07: Fase 2 N (ordenação configurável): preferences.ts (get/setStoredProductSortOrder), Configurações UI (Nome/Código/Valor), Contagem 3 sortedItems por preferência.
- 2025-02-07: Fase 2 O (adapter provedor): getErpProvider() por EXPO_PUBLIC_ERP_PROVIDER, cplug-erp-provider stub, context usa getErpProvider().
- 2025-02-07: Fase 2 P (filtros salvos): preferences (StoredCountListFilters, get/set), listagem restaura ao abrir e salva ao Filtrar; Logo.test.tsx passa a usar ThemeProvider.
- 2025-02-07: Fase 2 Q (estrutura mercadológica): EstruturaMercadologica + listEstruturasMercadologicas no contrato; mock categorias e persistência em createInventory; nova contagem com dropdown opcional; 23 testes.
- 2025-02-07: Fase 2 R (auditoria): Contagem com finalizadoPor/Em e excluidoPor/Em; mock finaliza preenchendo auditoria; soft-delete no mock; 25 testes.
- 2025-02-07: Fase 2 S (aviso contagens paradas): banner na listagem quando há contagens em andamento há mais de 7 dias; i18n staleBanner.

## Review
- Tabs seguem boas práticas (3–5 destinos, ícones + labels, cor ativa do design system).
- Drawer não implementado (expo-router não exporta Drawer no index); Sair permanece em Configurações.
- TypeScript e linter ok após inclusão de @expo/vector-icons.
