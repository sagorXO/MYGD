#!/usr/bin/env bash
# Installs the latest version from GitHub. Takes a backup first. Run on the server:
#   sudo bash deploy/update.sh
set -euo pipefail

cd "$(dirname "$0")"
echo "== Backup before updating"
./backup.sh
echo "== Getting the latest code"
git -C .. pull --ff-only
echo "== Rebuilding (new database changes are applied automatically)"
docker compose up -d --build
state=""
for _ in $(seq 1 60); do
  state="$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose ps -q app)" 2>/dev/null || true)"
  [ "$state" = "healthy" ] && break
  sleep 5
done
[ "$state" = "healthy" ] || { echo "STOPPED: the app is not healthy. See: docker compose logs app --tail 50" >&2; exit 1; }
echo "== Loading any changes to the checklist file"
docker compose run --rm tools npm run --silent checklists:load
echo "== Removing old build files so the disk doesn't fill up"
docker builder prune -f --filter until=168h >/dev/null
docker image prune -f >/dev/null
echo "Update finished."
