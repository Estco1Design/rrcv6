#!/usr/bin/env bash
# Create a new source-only Git checkout. Existing destinations are never overwritten.
# Usage: bash scripts/publish-clean.sh [target-dir]
set -euo pipefail
PROJECT_SOURCE="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_DEST="${1:-$PROJECT_SOURCE/../rich-community-publish}"
if [[ -e "$PROJECT_DEST" ]]; then
  echo "Destination already exists. Choose a new directory: $PROJECT_DEST" >&2
  exit 1
fi
mkdir -p "$PROJECT_DEST"
PROJECT_DEST="$(cd "$PROJECT_DEST" && pwd)"
case "$PROJECT_DEST/" in "$PROJECT_SOURCE/"*) echo "Destination must be outside the source project" >&2; exit 1;; esac
# Export the current working tree, including new source files; exclude secrets and generated files.
tar -C "$PROJECT_SOURCE" --exclude='./node_modules' --exclude='./.next' --exclude='./.git' --exclude='./.env*' --exclude='*.tsbuildinfo' --exclude='*.log' -cf - . | tar -C "$PROJECT_DEST" -xf -
cp "$PROJECT_SOURCE/.env.example" "$PROJECT_DEST/.env.example"
cd "$PROJECT_DEST"
git init -q -b main
git add -A
git -c user.name="RRC" -c user.email="source@rrc.local" commit -q -m "RRC source export"
echo "Source checkout created at: $PROJECT_DEST"
