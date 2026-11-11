#!/usr/bin/env bash
# MY GERMAN DÖNER — first install on a new Ubuntu server. Run once, as root, from the repository folder:
#   sudo bash deploy/install.sh
# Safe to run again: steps that are already done are skipped.
set -euo pipefail

cd "$(dirname "$0")"
say() { printf '\n== %s\n' "$*"; }
fail() { printf '\nSTOPPED: %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "Run this as root: sudo bash deploy/install.sh"

say "1/7 Docker"
if command -v docker >/dev/null 2>&1; then
  echo "Docker is already installed."
else
  echo "Installing Docker from docker.com ..."
  curl -fsSL https://get.docker.com | sh
fi
docker compose version >/dev/null 2>&1 || fail "Docker Compose is missing. Install the docker-compose-plugin package and run this again."

say "2/7 Firewall (SSH, HTTP and HTTPS only)"
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH >/dev/null
  ufw allow 80/tcp >/dev/null
  ufw allow 443/tcp >/dev/null
  ufw allow 443/udp >/dev/null
  ufw --force enable >/dev/null
  echo "Firewall on: ports 22, 80 and 443 are open."
else
  echo "ufw is not installed; use the firewall in the Hostinger panel to allow only 22, 80 and 443."
fi

say "3/7 Settings (deploy/.env)"
if [ -f .env ]; then
  echo "deploy/.env already exists; keeping it."
else
  read -r -p "Web address for the system, without https:// (for example staff.mygermandoener.com): " domain
  read -r -p "Email for certificate notices: " email
  [ -n "$domain" ] && [ -n "$email" ] || fail "Both the address and the email are needed."
  case "$domain" in *://* | */*) fail "Enter only the address, like staff.mygermandoener.com";; esac
  umask 077
  cat > .env <<EOF
DOMAIN=$domain
ACME_EMAIL=$email
DB_PASSWORD=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)
AD_MEDIA_MAX_BYTES=
IMAGE_TAG=latest
EOF
  echo "Created deploy/.env with new secrets. They stay on this server; never share or commit this file."
fi
domain="$(grep '^DOMAIN=' .env | cut -d= -f2-)"

say "4/7 Checking the address points at this server"
server_ips="$(hostname -I 2>/dev/null || true)"
domain_ip="$(getent ahostsv4 "$domain" 2>/dev/null | awk 'NR==1{print $1}')"
if [ -z "$domain_ip" ]; then
  echo "WARNING: $domain does not resolve yet. Add an A record for it pointing at this server, then run this again."
  echo "HTTPS certificates can only be issued once the address points here."
elif printf '%s' "$server_ips" | grep -qw "$domain_ip"; then
  echo "$domain points at this server ($domain_ip)."
else
  echo "WARNING: $domain points at $domain_ip, but this server's addresses are: $server_ips"
  echo "Fix the A record if that is wrong. HTTPS will not work until it points here."
fi

say "5/7 Building and starting (the first build takes several minutes)"
docker compose up -d --build
state=""
for _ in $(seq 1 60); do
  state="$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose ps -q app)" 2>/dev/null || true)"
  [ "$state" = "healthy" ] && break
  sleep 5
done
[ "$state" = "healthy" ] || fail "The app did not become healthy. See: docker compose logs app --tail 50"
echo "The app is running."

say "6/7 Store record and Oliver's checklists"
docker compose run --rm tools npm run --silent bootstrap:production
docker compose run --rm tools npm run --silent checklists:load

say "7/7 Nightly backup at 03:00"
cat > /etc/cron.d/mygd-backup <<EOF
0 3 * * * root cd $(pwd) && ./backup.sh >> /var/log/mygd-backup.log 2>&1
EOF
chmod 644 /etc/cron.d/mygd-backup
echo "Backups go to /var/backups/mygd and are kept for 14 days. Copy them off this server regularly."

say "Done"
echo "Next, create the first manager account (you choose a 4–8 digit PIN):"
echo "  sudo bash deploy/add-user.sh"
echo "Then open https://$domain"
