#!/usr/bin/env bash
# Replaces the live database and media with a backup. Asks for confirmation; everything current is lost.
# Usage: deploy/restore.sh /path/db-XXXX.dump /path/media-XXXX.tar
set -euo pipefail

cd "$(dirname "$0")"
db_file="${1:?path to db-*.dump}"
media_file="${2:?path to media-*.tar}"
test -s "$db_file"
test -f "$media_file"

read -r -p "This REPLACES the live database and media. Type RESTORE to continue: " answer
[ "$answer" = "RESTORE" ] || { echo "Cancelled."; exit 1; }

docker compose stop app caddy
docker compose exec -T db pg_restore -U mygd -d mygd --clean --if-exists --no-owner < "$db_file"
docker compose run --rm --no-deps --entrypoint sh -T app -c 'rm -rf /data/media/* && tar -C /data/media -xf -' < "$media_file"
docker compose up -d
echo "Restore finished. Check: docker compose ps"
