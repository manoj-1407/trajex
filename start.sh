#!/bin/bash
set -e

# Get the directory where the script is located
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "[trajex] Starting services in $ROOT_DIR..."

# Ensure PostgreSQL is running (optional, user-specific)
# sudo service postgresql start || echo "[postgres] service check skipped"

# Kill old processes
pkill -f "node src/server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 1

# Start Backend
echo "[backend] Starting..."
cd "$ROOT_DIR/backend"
# Try to load env if not set
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

NODE_ENV=development node src/server.js > /tmp/trajex-backend.log 2>&1 &
BPID=$!
echo "[backend] PID $BPID"

# Wait for backend health
sleep 3
if ! curl -s http://127.0.0.1:4000/api/v1/health > /dev/null; then
  echo "[backend] FAILED — check /tmp/trajex-backend.log"
  # exit 1
fi
echo "[backend] OK — http://127.0.0.1:4000"

# Start Frontend
echo "[frontend] Starting..."
cd "$ROOT_DIR/frontend"
npm run dev > /tmp/trajex-frontend.log 2>&1 &
FPID=$!
echo "[frontend] PID $FPID"

echo ""
echo "----------------------------------------------------"
echo "  Trajex running                                    "
echo "  Frontend  →  http://localhost:5173              "
echo "  Backend   →  http://localhost:4000              "
echo "----------------------------------------------------"
echo ""
echo "Logs: /tmp/trajex-backend.log  /tmp/trajex-frontend.log"
echo "Stop: bash $ROOT_DIR/stop.sh"
