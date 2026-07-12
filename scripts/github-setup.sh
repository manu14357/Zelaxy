#!/usr/bin/env bash
#
# github-setup.sh — configure the GitHub repo's discoverability metadata.
#
# GitHub "topics", a crisp description, and a homepage URL are the single biggest
# free lever for repo discovery (they power GitHub search + Explore + Google).
# Run this once (re-running is safe — it just re-applies the same values).
#
# Prerequisites:
#   gh auth login          # authenticate the GitHub CLI first
#
# Usage:
#   bash scripts/github-setup.sh
#
set -euo pipefail

REPO="manu14357/Zelaxy"
HOMEPAGE="https://zelaxy.in"
DESCRIPTION="Open-source visual platform to build, run & ship AI agents and workflows. 264 blocks, 240+ integrations, 21 AI providers, built-in RAG & real-time collaboration. Self-hosted. No code required."

# Up to 20 topics. Mix of category, tech, and high-intent "alternative" discovery terms.
TOPICS=(
  ai
  ai-agents
  agentic-ai
  workflow-automation
  workflow-engine
  ai-workflow
  llm
  rag
  no-code
  low-code
  automation
  mcp
  nextjs
  typescript
  react-flow
  self-hosted
  n8n-alternative
  zapier-alternative
  openai
  anthropic
)

echo "▶ Checking gh auth…"
gh auth status >/dev/null 2>&1 || { echo "✗ Not authenticated. Run: gh auth login"; exit 1; }

echo "▶ Setting description + homepage…"
gh repo edit "$REPO" \
  --description "$DESCRIPTION" \
  --homepage "$HOMEPAGE" \
  --enable-issues \
  --enable-discussions \
  --enable-wiki=false

echo "▶ Setting topics ("${#TOPICS[@]}")…"
# gh repo edit --add-topic can be passed repeatedly
topic_args=()
for t in "${TOPICS[@]}"; do topic_args+=(--add-topic "$t"); done
gh repo edit "$REPO" "${topic_args[@]}"

echo "✓ Done. Verify:  gh repo view $REPO --web"
echo
echo "⚠ One manual step the API can't do: set the repo's SOCIAL PREVIEW image."
echo "  GitHub → repo → Settings → General → Social preview → Upload."
echo "  Use a 1280×640 export of the hero card at: https://zelaxy.in/opengraph-image"
