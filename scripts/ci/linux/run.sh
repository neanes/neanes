#!/usr/bin/env bash
set -euo pipefail

suite="${1:-all}"
if (( $# )); then
  shift
fi
case "$suite" in
  all|mcp|rendering|saving) ;;
  *) echo "Unknown Linux test suite: $suite" >&2; exit 2 ;;
esac

run_tests() {
  node --version
  npm --version
  if [[ "$suite" == all ]]; then
    npm test
    npm run lint
    npx vue-tsc --noEmit
  fi
  npx vite build
  if [[ "$suite" == all || "$suite" == mcp ]]; then
    npm run test:integration:mcp -- "$@"
  fi
  if [[ "$suite" == all || "$suite" == rendering ]]; then
    npm run test:integration:rendering -- /artifacts/rendering
  fi
  if [[ "$suite" == all || "$suite" == saving ]]; then
    npm run test:integration:saving -- /artifacts/saving
  fi
}

run_tests "$@" 2>&1 | tee /artifacts/run.log
