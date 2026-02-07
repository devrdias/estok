---
name: codewiki
description: Generate holistic, repository-level documentation with CodeWiki. Use when the user wants repo-level docs, architecture documentation, module-level API docs, or AI-generated codebase documentation for large or multilingual codebases.
---

# CodeWiki

Open-source framework for holistic, structured repository-level documentation across multilingual codebases. Generates architecture-aware docs, module trees, Mermaid diagrams, and cross-module analysis. Supports Python, Java, JavaScript, TypeScript, C, C++, and C#.

**Source:** [FSoft-AI4Code/CodeWiki](https://github.com/FSoft-AI4Code/CodeWiki)

## Prerequisites

- **Python 3.12+**
- **Node.js** (for Mermaid diagram validation)
- **LLM API access** (Anthropic Claude, OpenAI, or compatible)
- **Git** (for `--create-branch`)

Check Python:

```bash
python3 --version || python --version
```

### Testing in this repo (sistema-s)

This repo has a pre-wired CodeWiki setup to avoid Python 3.12 and SSL issues:

1. **One-time setup** (already done if `.venv-codewiki` exists):
   ```bash
   .cursor/skills/codewiki/setup.sh
   ```
2. **Run CodeWiki** (uses venv + tiktoken cache):
   ```bash
   .cursor/skills/codewiki/run.sh --version
   .cursor/skills/codewiki/run.sh config set --api-key "$ANTHROPIC_API_KEY" --base-url https://api.anthropic.com --main-model claude-sonnet-4 --cluster-model claude-sonnet-4 --fallback-model claude-sonnet-4
   .cursor/skills/codewiki/run.sh generate --output ./docs
   ```
3. Add to `.gitignore`: `.venv-codewiki`, `.codewiki-cache`

## When to Use This Skill

Use CodeWiki when the user:

- Asks for **repository-level** or **codebase-wide** documentation
- Wants **architecture documentation**, module overviews, or dependency graphs
- Needs **holistic docs** for a large or multi-language repo
- Asks to **generate docs** similar to CodeWiki or "wiki for the codebase"

Do **not** use for single-file or single-module docs; use normal editing or small-scale doc generation instead.

---

## How to Use This Skill

### Step 1: Install CodeWiki

From the **project root**:

```bash
pip install git+https://github.com/FSoft-AI4Code/CodeWiki.git
codewiki --version
```

If the user prefers a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install git+https://github.com/FSoft-AI4Code/CodeWiki.git
codewiki --version
```

### Step 2: Configure (First-Time or When Keys Change)

CodeWiki needs an API key and model settings. Prefer environment variables for secrets.

```bash
# Option A: Set via CLI (key stored in system keychain where supported)
codewiki config set \
  --api-key "$ANTHROPIC_API_KEY" \
  --base-url https://api.anthropic.com \
  --main-model claude-sonnet-4 \
  --cluster-model claude-sonnet-4 \
  --fallback-model claude-sonnet-4

# Option B: OpenAI-compatible endpoint
codewiki config set \
  --api-key "$OPENAI_API_KEY" \
  --base-url https://api.openai.com/v1 \
  --main-model gpt-4o \
  --cluster-model gpt-4o \
  --fallback-model gpt-4o-mini
```

Validate and show config:

```bash
codewiki config validate
codewiki config show
```

### Step 3: Generate Documentation

From the **project root**:

```bash
# Default: writes to ./docs/
codewiki generate

# Custom output directory
codewiki generate --output ./documentation

# With GitHub Pages viewer and new branch
codewiki generate --github-pages --create-branch

# Verbose (for debugging)
codewiki generate --verbose
```

### Step 4: Optional — Project-Specific Defaults

For this repo, persist include/exclude or focus so future runs don’t need flags:

```bash
# Example: TypeScript/React — focus on app source, exclude tests and build
codewiki config agent --include "*.ts,*.tsx" --exclude "node_modules,dist,coverage,*.test.*,__tests__"
codewiki config agent --focus "src,app"

# View current agent settings
codewiki config agent

# Clear agent settings
codewiki config agent --clear
```

**Important:**

- `--include`: **Replaces** default file patterns (e.g. `--include "*.cs"` = only `.cs`).
- `--exclude`: **Merged** with defaults (e.g. still excludes `.git`, `node_modules`, etc.).

---

## CLI Reference

### Configuration

| Command | Purpose |
|--------|---------|
| `codewiki config set --api-key ... --base-url ... --main-model ...` | Set API and models |
| `codewiki config set --max-tokens 32768 --max-depth 3` | Token/depth limits |
| `codewiki config show` | Show current config |
| `codewiki config validate` | Validate config |
| `codewiki config agent --include "*.ts" --exclude "tests"` | Persistent generate defaults |

### Generation

| Flag | Description |
|------|-------------|
| `--output DIR` | Output directory (default: `./docs/`) |
| `--create-branch` | Create a git branch for the docs |
| `--github-pages` | Generate `index.html` viewer for GitHub Pages |
| `--verbose` | Verbose logging |
| `--include "glob"` | Only these files (replaces defaults) |
| `--exclude "pattern,..."` | Exclude patterns (merged with defaults) |
| `--focus "path1,path2"` | Focus on specific modules |
| `--doc-type architecture \| api \| user-guide \| developer` | Documentation style |
| `--instructions "..."` | Custom instructions for the AI agent |

### Token / Depth (Optional)

```bash
codewiki config set --max-tokens 32768 --max-token-per-module 36369 --max-token-per-leaf-module 16000 --max-depth 2
```

Override once at runtime:

```bash
codewiki generate --max-tokens 16384 --max-depth 3
```

---

## Output Structure

After `codewiki generate`, output (default `./docs/`) looks like:

```
./docs/
├── overview.md              # Repository overview (start here)
├── module1.md               # Module documentation
├── module2.md
├── module_tree.json         # Hierarchical module structure
├── first_module_tree.json   # Initial clustering result
├── metadata.json            # Generation metadata
└── index.html               # Interactive viewer (with --github-pages)
```

- **overview.md**: High-level architecture and entry point.
- **module*.md**: Per-module docs, API references, cross-module links.
- **module_tree.json**: Tree of modules for tooling or custom viewers.
- **index.html**: Only when using `--github-pages`.

---

## Example Workflow (Cursor)

**User:** “Generate repository-level documentation for this codebase.”

1. **Install** (if needed):  
   `pip install git+https://github.com/FSoft-AI4Code/CodeWiki.git`  
   and `codewiki --version`.
2. **Configure** (if not done):  
   `codewiki config set --api-key ... --base-url ... --main-model ...`  
   then `codewiki config validate`.
3. **Generate**:  
   `codewiki generate`  
   or `codewiki generate --output ./docs --verbose`.
4. **Point user** to `docs/overview.md` and, if generated, `docs/index.html`.

For **TypeScript/React** projects, suggest:

```bash
codewiki config agent --exclude "node_modules,dist,coverage,*.test.*,__tests__"
codewiki generate --output ./docs
```

---

## Tips

1. **API key**: Prefer `$ANTHROPIC_API_KEY` or `$OPENAI_API_KEY`; avoid hardcoding.
2. **Large repos**: Use `--max-depth 2` or `3` and optionally `--focus` to limit scope.
3. **Single-language**: Use `--include "*.py"` or `--include "*.ts,*.tsx"` to restrict file types.
4. **Cost/speed**: Lower `--max-tokens` or use a smaller `--fallback-model` if needed.
5. **Config location**: API keys in system keychain (where supported); other settings in `~/.codewiki/config.json`.

---

## Pre-Delivery Checklist

- [ ] CodeWiki installed and `codewiki --version` works.
- [ ] Config validated with `codewiki config validate`.
- [ ] Generation run from project root; output in intended directory (e.g. `./docs/`).
- [ ] User knows where to read docs (`overview.md`, `index.html` if used).
- [ ] If using agent defaults, `codewiki config agent` reflects desired include/exclude/focus.
