# Deploy no GitHub Pages (primeira vez)

Repositório já está com **commit inicial** e **remote** `origin` apontando para `git@github.com:devrdias/estok.git`.  
(Se o remote ainda for `sistema-s`, atualize: `git remote set-url origin git@github.com:devrdias/estok.git`.)

## 1. Autenticar SSH (conta devrdias)

No seu terminal:

```bash
git-acc devrdias
```

## 2. Criar o repositório no GitHub e dar push

**Opção A – GitHub CLI (recomendado)**

```bash
gh auth login   # se ainda não estiver autenticado
./scripts/create-repo-and-push.sh
```

**Opção B – Token + script**

```bash
export GITHUB_TOKEN=ghp_xxxx   # token com escopo repo
./scripts/create-repo-and-push.sh
```

**Opção C – Manual**

1. Crie o repositório em: https://github.com/new  
   - Nome: `estok`  
   - Visibilidade: **Private**  
   - Não marque “Add a README” (já existe no projeto).

2. Depois:

```bash
git push -u origin main
```

## 3. Ativar GitHub Pages e primeiro deploy

1. No GitHub: **Settings → Pages** (menu do repositório).
2. Em **Build and deployment**:
   - **Source**: **“GitHub Actions”** (não use “Deploy from a branch”).
3. Salve. O workflow **Deploy Web to GitHub Pages** roda a cada push em `main`, faz upload do conteúdo de `mobile/dist` e faz o deploy via ação oficial do GitHub.
4. Para o primeiro deploy: faça um push em `main` ou dispare o workflow manualmente em **Actions** → **Deploy Web to GitHub Pages** → **Run workflow**.

Site final: **https://devrdias.github.io/estok/**

---

## Não consigo ver a página (troubleshooting)

1. **Repositório privado**  
   No plano gratuito do GitHub, **Pages só fica acessível em repo público**.  
   Se o repositório estiver **Private**, em **Settings → General** mude para **Public** (ou use um plano pago que permita Pages em repo privado).

2. **Pages ativado**  
   Em **Settings → Pages** (menu lateral do repo):
   - **Build and deployment** → **Source**: **“GitHub Actions”** (não “Deploy from a branch”).
   - Salve.

3. **Workflow concluído**  
   Em **Actions**, confira se o workflow **Deploy Web to GitHub Pages** terminou em verde.  
   Se o job **deploy** falhar, verifique se o ambiente **github-pages** existe (Settings → Environments) e se o job **build** gerou o artifact.

4. **URL correta**  
   Use exatamente: **https://devrdias.github.io/estok/**  
   (com `/estok/` no final; sem barra no final também pode funcionar.)

5. **Aguardar**  
   Depois de um deploy bem-sucedido, espere 1–2 minutos e atualize a página (ou teste em aba anônima).
