#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."
platform="${NEANES_TEST_PLATFORM:-$(docker version --format '{{.Server.Os}}/{{.Server.Arch}}')}"
image="neanes-linux-tests:${platform//\//-}"
artifacts="${NEANES_TEST_ARTIFACTS:-$PWD/.test-files/linux/$(date +%Y%m%d-%H%M%S)-${platform//\//-}}"
mkdir -p "$artifacts"

docker build --platform "$platform" --file scripts/ci/linux/Dockerfile --tag "$image" .

# Chromium needs user namespaces; keep Electron's own sandbox enabled.
container=$(docker create --platform "$platform" --init --shm-size=1g \
  --security-opt seccomp=unconfined "$image" "$@")
cleanup() {
  docker cp "$container:/artifacts/." "$artifacts/" || true
  docker rm --force "$container" >/dev/null
  echo "Linux test artifacts: $artifacts"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

docker start "$container" >/dev/null
docker logs --follow "$container" &
log_process=$!
status=$(docker wait "$container")
wait "$log_process"
exit "$status"
