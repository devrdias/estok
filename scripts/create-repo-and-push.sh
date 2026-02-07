#!/usr/bin/env bash
# Create private repo devrdias/sistema-s and push main. Requires:
# - GITHUB_TOKEN with repo scope (or run: gh auth login)
# - SSH auth for devrdias (e.g. run: git-acc devrdias)
set -e
REPO_OWNER="${REPO_OWNER:-devrdias}"
REPO_NAME="${REPO_NAME:-sistema-s}"

if command -v gh &>/dev/null; then
  echo "Using GitHub CLI to create repository..."
  gh repo create "$REPO_OWNER/$REPO_NAME" --private --source=. --remote=origin --push
  echo "Done. Enable Pages: Settings → Pages → Source: Deploy from branch → Branch: gh-pages, / (root)"
  exit 0
fi

if [ -z "$GITHUB_TOKEN" ]; then
  echo "Need either: (1) install gh and run 'gh auth login', or (2) set GITHUB_TOKEN"
  echo "Then run: git-acc devrdias  # in your terminal for SSH"
  echo "Then run this script again, or create repo at https://github.com/new?name=$REPO_NAME (private) and run: git push -u origin main"
  exit 1
fi

echo "Creating repository $REPO_OWNER/$REPO_NAME via API..."
curl -sS -L \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -X POST "https://api.github.com/user/repos" \
  -d "{\"name\":\"$REPO_NAME\",\"private\":true}" \
  >/dev/null || { echo "Create failed (repo may already exist)."; exit 1; }

echo "Pushing to origin main..."
git push -u origin main

echo "Done. Enable Pages: Settings → Pages → Source: Deploy from branch → Branch: gh-pages, / (root)"
