# Balanço — Controle de Estoque

App Expo (React Native) para lojas físicas. Nome e logo definidos com **ui-ux-pro-max**; ver `../design-system/balanco/BRAND-NAME-AND-LOGO.md` e `../design-system/balanco/MASTER.md`. Especificação em `../docs/`.

## Design system

Telas seguem o design system **Sistema Estoque** (ui-ux-pro-max). Tokens em `shared/config/theme.ts`; componentes em `shared/ui` (Button, Card). Cores: primary `#15803D`, CTA `#0369A1`, background `#F0FDF4`. Alvos de toque mínimos 44px; espaçamento 8px entre botões.

## Path aliases (tsconfig paths)

Imports podem usar o alias `@/` em vez de caminhos relativos: `@/shared/config/theme`, `@/entities/contagem/model/types`, `@/features/auth/model`. Configurado em `tsconfig.json` (`paths`) e em `app.json` (`experiments.tsConfigPaths`). Metro resolve os paths em tempo de build.

## Estrutura (FSD)

- **app/** — Expo Router (rotas): `(auth)/login`, `(app)/index` (Tela Inicial), `contagens`, `configuracoes`.
- **shared/** — Config (i18n), lib, ui.
- **entities/** — Modelos de domínio (contagem, estoque).
- **features/** — Lógica por feature (auth, contagem).
- **widgets/** — Componentes compostos (a adicionar).

## Como rodar

```bash
cd mobile
npm start
# ou: npm run ios | npm run android
```

Para web: `npm run web`.

### Build para deploy (web)

```bash
npm run build:web          # gera pasta dist/
npm run build:web:gh-pages # build + copia index.html → 404.html (para GitHub Pages SPA)
```

## Deploy gratuito (web)

O build estático (`dist/`) pode ser publicado em qualquer hospedagem de arquivos estáticos.

| Serviço | Gratuito | Observação |
|--------|----------|------------|
| **GitHub Pages** | Sim | Ver abaixo (SPA com 404.html). |
| **Vercel** | Sim | Conecte o repo; rewrites para SPA já suportados. |
| **Netlify** | Sim | Deploy por Git; configurar redirects para SPA. |
| **Cloudflare Pages** | Sim | Deploy por Git; suporta SPA. |

### GitHub Pages (gratuito)

1. **Build:** na pasta `mobile/` rode:
   ```bash
   npm run build:web:gh-pages
   ```
   Isso gera `dist/` e cria `dist/404.html` (cópia do `index.html`) para as rotas do Expo Router funcionarem em refresh/URL direta.

2. **Site no repositório (ex.: `usuario.github.io/estok`):**
   - Em **app.json**, adicione o base path (troque `estok` pelo nome do seu repo):
     ```json
     "expo": {
       "experiments": {
         "baseUrl": "/estok"
       }
     }
     ```
   - Depois rode de novo `npm run build:web:gh-pages`.
   - No GitHub: **Settings → Pages → Source**: "Deploy from a branch"; **Branch**: `main` (ou sua branch); **Folder**: `/mobile/dist` (ou a pasta onde estiver o `dist` no repo).  
   - Se o `dist` estiver dentro de `mobile/`, use **GitHub Actions** para publicar a pasta `mobile/dist` (ex.: workflow que faz build e faz push para a branch `gh-pages` ou usa `peaceiris/actions-gh-pages`).

3. **Site em `usuario.github.io` (sem subpasta):** não é necessário `baseUrl`; basta apontar o Pages para a pasta do build (por exemplo via Actions publicando o conteúdo de `dist/` na branch `gh-pages` e escolhendo essa branch em Settings → Pages).

4. **Deploy automático com GitHub Actions:** o repositório inclui o workflow `.github/workflows/deploy-web-gh-pages.yml`. Ele roda a cada push em `main`: faz o build em `mobile/` e publica `mobile/dist` na branch `gh-pages`. Para ativar:
   - Em **app.json** (mobile), defina `expo.experiments.baseUrl` com o nome do repositório (ex.: `"/estok"`).
   - No GitHub: **Settings → Pages → Build and deployment → Source**: "Deploy from a branch"; **Branch**: `gh-pages`, pasta **/ (root)**.
   - Após o primeiro push em `main`, o workflow gera a branch `gh-pages`; o site ficará em `https://<user>.github.io/<repo>/`.

### Google Auth (opcional)

Para usar login real com Google em vez do mock, defina no ambiente (ex.: `.env` ou EAS Secrets):

- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` — OAuth 2.0 Web client ID (Google Cloud Console).
- Opcional: `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` e `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` para clientes nativos.

Sem essas variáveis, o app usa usuário mock ao tocar em "Entrar com Google". A sessão é persistida com `expo-secure-store` quando Google está configurado.

### Provedor ERP (Fase 2)

- `EXPO_PUBLIC_ERP_PROVIDER` — `mock` (padrão) ou `cplug`. Com `cplug`, o app usa o stub em `shared/api/cplug-erp-provider.ts` (listas vazias; criar/editar ainda não implementados). Substitua o stub pela integração real quando o backend CPlug estiver pronto.

## i18n

PT e EN em `shared/config/i18n.ts`. Chaves: `home.*`, `auth.*`, `counts.*`, `settings.*`, `common.*`.

## Estado atual

- **Auth:** Google OAuth via `expo-auth-session` quando `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` está definido; senão mock. Sessão persistida com `expo-secure-store`.
- **ERP:** `shared/api`: contrato `ErpProvider`, `mockErpProvider` e stub `cplugErpProvider`; injeção por `EXPO_PUBLIC_ERP_PROVIDER` (mock|cplug). Configurações: ordem da lista na contagem (nome/código/valor) persistida em SecureStore.
- **Telas:** Login → Tela Inicial → Contagem / Configurações / Sair; listagem de contagens; nova contagem (Estoque + Valor); contagem de fato (resumo + tabela + registrar quantidade).

## Próximos passos (../tasks/todo.md)

- Backend + implementação real do CPlug em `cplug-erp-provider.ts`.
- Fase 2: estrutura mercadológica, relatórios, filtros salvos (ver `../docs/phase2-and-pending.md`).

- Configurar Google OAuth no projeto (client IDs) para produção.
