#!/usr/bin/env bash
# Create private repo devrdias/estok and push main.
# Prereq: run once in your terminal:  git-acc devrdias   (SSH for push)
# Then either: (1) gh auth login, or (2) set GITHUB_TOKEN for repo creation.
set -e
REPO_OWNER="${REPO_OWNER:-devrdias}"
REPO_NAME="${REPO_NAME:-estok}"

if command -v gh &>/dev/null; then
  echo "Using GitHub CLI to create repository..."
  gh repo create "$REPO_OWNER/$REPO_NAME" --private --source=. --remote=origin --push
  echo "Done. Enable Pages: Settings → Pages → Source: Deploy from branch → Branch: gh-pages, / (root)"
  exit 0
fi

if [ -z "$GITHUB_TOKEN" ]; then
  # No token: try push-only (repo must already exist). Prereq: git-acc devrdias.
  if ! git remote get-url origin &>/dev/null; then
    git remote add origin "git@github.com:$REPO_OWNER/$REPO_NAME.git"
  fi
  echo "Pushing to origin main (repo must exist; create at https://github.com/new?name=$REPO_NAME if needed)..."
  if git push -u origin main; then
    echo "Done. Enable Pages: Settings → Pages → Source: Deploy from branch → Branch: gh-pages, / (root)"
    exit 0
  fi
  CREATE_URL="https://github.com/new?name=$REPO_NAME"
  echo "Push failed (repo not found). Create the repo first: $CREATE_URL (choose Private)"
  if command -v open &>/dev/null; then
    echo "Opening in browser..."
    open "$CREATE_URL"
  fi
  echo "After creating the repo, run this script again."
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

if ! git remote get-url origin &>/dev/null; then
  git remote add origin "git@github.com:$REPO_OWNER/$REPO_NAME.git"
fi
echo "Pushing to origin main (use git-acc devrdias if push fails)..."
git push -u origin main

echo "Done. Enable Pages: Settings → Pages → Source: Deploy from branch → Branch: gh-pages, / (root)"
