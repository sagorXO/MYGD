#!/usr/bin/env bash
# Backs up the database and the uploaded media to BACKUP_DIR, keeping KEEP_DAYS days.
# Run from cron. Copy the results off this server: a backup on the same disk is not a backup.
set -euo pipefail

cd "$(dirname "$0")"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/mygd}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

umask 077
mkdir -p "$BACKUP_DIR"

db_tmp="$BACKUP_DIR/.db-$STAMP.tmp"
media_tmp="$BACKUP_DIR/.media-$STAMP.tmp"
trap 'rm -f "$db_tmp" "$media_tmp"' EXIT

docker compose exec -T db pg_dump -U mygd -d mygd --no-owner --format=custom > "$db_tmp"
docker compose exec -T app tar -C /data/media -cf - . > "$media_tmp"

# Only finished files get their final name, so a failed run never looks like a good backup.
test -s "$db_tmp"
mv "$db_tmp" "$BACKUP_DIR/db-$STAMP.dump"
mv "$media_tmp" "$BACKUP_DIR/media-$STAMP.tar"

find "$BACKUP_DIR" -maxdepth 1 -type f \( -name 'db-*.dump' -o -name 'media-*.tar' \) -mtime "+$KEEP_DAYS" -delete
echo "Backup finished: $BACKUP_DIR (db-$STAMP.dump, media-$STAMP.tar)"
