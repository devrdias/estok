#!/usr/bin/env bash
# One-time setup for CodeWiki in this repo: Python 3.12 venv + CodeWiki + tiktoken cache.
set -e
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
PY312=""
for p in /opt/homebrew/bin/python3.12 python3.12; do
  if command -v "$p" &>/dev/null; then PY312="$p"; break; fi
done
if [[ -z "$PY312" ]]; then
  echo "Python 3.12 required. Install with: brew install python@3.12"
  exit 1
fi
echo "Using: $PY312"
"$PY312" -m venv "$ROOT/.venv-codewiki"
"$ROOT/.venv-codewiki/bin/pip" install --upgrade pip "git+https://github.com/FSoft-AI4Code/CodeWiki.git"
mkdir -p "$ROOT/.codewiki-cache"
# Pre-download tiktoken encoding so codewiki can start without SSL on first import
CACHE_KEY="9b5ad71b2ce5302211f9c61530b329a4922fc6a4"
if [[ ! -f "$ROOT/.codewiki-cache/$CACHE_KEY" ]]; then
  echo "Downloading tiktoken encoding..."
  curl -sS -o "$ROOT/.codewiki-cache/$CACHE_KEY" "https://openaipublic.blob.core.windows.net/encodings/cl100k_base.tiktoken"
fi
echo "Setup done. Run: .cursor/skills/codewiki/run.sh generate"
echo "Configure first: .cursor/skills/codewiki/run.sh config set --api-key \$ANTHROPIC_API_KEY --base-url https://api.anthropic.com --main-model claude-sonnet-4 --cluster-model claude-sonnet-4 --fallback-model claude-sonnet-4"
