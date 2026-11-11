#!/usr/bin/env bash
# Creates a sign-in account, or gives an existing one a new PIN.
#   sudo bash deploy/add-user.sh
# Roles: STORE_MANAGER (Shift Leader: screen ads, sign-offs, opening time) or STORE_STAFF (checklists only).
# The PIN is typed without showing on screen and is stored only as a hash.
set -euo pipefail

cd "$(dirname "$0")"
read -r -p "Username (lowercase, for example oliver): " username
[ -n "$username" ] || { echo "A username is needed." >&2; exit 1; }
echo "Role: 1 = Shift Leader / manager, 2 = staff"
read -r -p "Choose 1 or 2: " choice
case "$choice" in
  1) role=STORE_MANAGER ;;
  2) role=STORE_STAFF ;;
  *) echo "Choose 1 or 2." >&2; exit 1 ;;
esac
read -r -p "Is this an existing account that needs a new PIN? (y/N): " reset
case "$reset" in
  y | Y) docker compose run --rm tools npm run --silent user:create -- --username "$username" --role "$role" --reset ;;
  *) docker compose run --rm tools npm run --silent user:create -- --username "$username" --role "$role" ;;
esac
