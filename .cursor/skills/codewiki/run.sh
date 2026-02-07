#!/usr/bin/env bash
# Run CodeWiki in this repo. Uses .venv-codewiki and pre-populated tiktoken cache
# to avoid Python 3.12 and SSL issues on first import.
set -e
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
export TIKTOKEN_CACHE_DIR="${TIKTOKEN_CACHE_DIR:-$ROOT/.codewiki-cache}"
if [[ ! -d "$ROOT/.venv-codewiki/bin" ]]; then
  echo "Run setup first: .cursor/skills/codewiki/setup.sh"
  exit 1
fi
exec "$ROOT/.venv-codewiki/bin/codewiki" "$@"
