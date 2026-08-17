#!/usr/bin/env bash
# ---------------------------------------------------------
# MY GERMAN DÖNER / HORIZON — One-Click Local Docker Runner
# ---------------------------------------------------------
set -e

# Add custom brew & docker paths
export PATH="/Users/saiedsagar/homebrew/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
export DOCKER_HOST="unix:///Users/saiedsagar/.colima/default/docker.sock"

echo "🐳 [1/3] Checking Docker Engine Status..."
if ! docker info >/dev/null 2>&1; then
    if command -v colima >/dev/null 2>&1; then
        echo "🚀 Starting Colima lightweight container runtime..."
        colima start --cpu 2 --memory 4
    elif [ -d "/Applications/Docker.app" ]; then
        echo "🚀 Starting Docker Desktop..."
        open -a Docker
        echo "Waiting for Docker daemon to initialize..."
        while ! docker info >/dev/null 2>&1; do
            sleep 2
        done
    else
        echo "❌ No Docker engine found."
        exit 1
    fi
fi

echo "📦 [2/3] Starting Production Container connected to Supabase..."
docker compose up -d

echo "✅ [3/3] Application is running inside Docker Container!"
echo "---------------------------------------------------------"
echo "🌐 Kiosk Self-Service:    http://localhost:3005"
echo "🛒 POS Cashier Till:      http://localhost:3005/pos"
echo "🍳 Kitchen Display (KDS): http://localhost:3005/kds"
echo "📺 Order TV Board:        http://localhost:3005/display"
echo "⚙️ Admin Backoffice:      http://localhost:3005/admin (PIN: 1234)"
echo "---------------------------------------------------------"
echo "📋 Container Logs (Press Ctrl+C to exit):"
docker compose logs -f
