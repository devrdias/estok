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
   - **Source**: “Deploy from a branch”.
   - **Branch**: `gh-pages` (pode aparecer após o primeiro workflow rodar).
   - **Folder**: `/ (root)`.
3. Salve. O workflow **Deploy Web to GitHub Pages** roda a cada push em `main` e publica o build em `mobile/dist` na branch `gh-pages`.
4. Se a branch `gh-pages` ainda não existir, faça um push em `main` (ou dispare o workflow manualmente em **Actions**). Depois que o job terminar, volte em **Settings → Pages** e selecione a branch `gh-pages`.

Site final: **https://devrdias.github.io/estok/**
