#!/bin/bash
echo "[trajex] Stopping..."
pkill -f "node src/server.js" 2>/dev/null && echo "[backend] stopped" || echo "[backend] was not running"
pkill -f vite 2>/dev/null && echo "[frontend] stopped" || echo "[frontend] was not running"
echo "Done."
