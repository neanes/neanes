#!/usr/bin/env bash
set -euo pipefail

force_flag=""

if [[ "${1:-}" == "--force" ]]; then
  force_flag="--force"
  shift
fi

scenario="${1:-}"
if [[ -z "$scenario" ]]; then
  echo "Usage: run-scenario.sh [--force] <scenario>" >&2
  exit 1
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/../.." && pwd)"
tmp_dir="$(node -e "process.stdout.write(require('node:os').tmpdir())")"
user_data_dir="$tmp_dir/neanes-recovery-scenarios/$scenario/userData"

node "$script_dir/seed-recovery.mjs" $force_flag --user-data-dir "$user_data_dir" "$scenario"

export NEANES_DEV_USER_DATA_DIR="$user_data_dir"
cd "$repo_root"
npm run dev
