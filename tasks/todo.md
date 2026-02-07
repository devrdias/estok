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

## Progress Notes
- 2025-02-06: Iniciada implementação conforme workflow-orchestration; plano em tasks/todo.md.
- 2025-02-07: A1–A4 concluídos: Expo em mobile/, Expo Router, FSD, i18n PT/EN, rotas.
- 2025-02-07: B–E com mocks: auth mock (login/logout), Tela Inicial (3 botões), Configurações (idioma, conta, sair), contrato ERP + mock, Contagens list/nova/[id] (contagem de fato).
- 2025-02-06: B1/B3 atualizados: Google OAuth (expo-auth-session + expo-web-browser, provider Google), persistência com expo-secure-store; EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (e opcionalmente iOS/Android) para login real.

## Review
- (a preencher ao concluir)
