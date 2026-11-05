#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR/frontend"
npm ci
npm run test
npm run typecheck
npm run build

rm -rf "$ROOT_DIR/backend/static"
mkdir -p "$ROOT_DIR/backend/static"
cp -R out/. "$ROOT_DIR/backend/static/"

cd "$ROOT_DIR/backend"
go mod download
go vet ./...
go build -o voicemotion .

printf "Build selesai: %s\n" "$ROOT_DIR/backend/voicemotion"
