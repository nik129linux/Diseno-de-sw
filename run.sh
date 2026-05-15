#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Kill anything already running ─────────────────────────────────────────────
echo "[1/4] Cleaning up old processes..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
pkill -f 'mvnw|spring-boot:run|vite' 2>/dev/null || true
sleep 1

# ── Start MongoDB (Docker) ─────────────────────────────────────────────────────
echo "[2/4] Starting MongoDB..."
docker compose -f "$PROJECT_DIR/docker-compose.yml" up -d mongodb 2>&1 | grep -v "^time="
until docker exec datashield-mongo mongosh --quiet --eval 'db.runCommand("ping").ok' \
  "mongodb://admin:secure_password_123@localhost:27017/datashield?authSource=admin" \
  > /dev/null 2>&1; do
  sleep 2
done
echo "       MongoDB ready."

# ── Start Backend (on host, connects to Ollama at localhost:11434) ─────────────
echo "[3/4] Starting Spring Boot backend..."
cd "$PROJECT_DIR"
export MONGODB_URI="mongodb://admin:secure_password_123@localhost:27017/datashield?authSource=admin"
export LLM_PROVIDER=ollama
export OLLAMA_MODEL=gemma4:31b-cloud
export OLLAMA_BASE_URL=http://localhost:11434/v1
export SPRING_PROFILES_ACTIVE=dev

./mvnw spring-boot:run -q > /tmp/datashield-backend.log 2>&1 &
BACKEND_PID=$!

until curl -sf http://localhost:8080/actuator/health > /dev/null 2>&1; do
  if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "ERROR: Backend crashed. Check /tmp/datashield-backend.log"
    tail -20 /tmp/datashield-backend.log
    exit 1
  fi
  sleep 3
done
echo "       Backend ready at http://localhost:8080"

# ── Start Frontend ─────────────────────────────────────────────────────────────
echo "[4/4] Starting frontend..."
cd "$PROJECT_DIR/frontend"
npm run dev > /tmp/datashield-frontend.log 2>&1 &

until curl -sf http://localhost:5173 > /dev/null 2>&1; do
  sleep 2
done
echo "       Frontend ready at http://localhost:5173"

echo ""
echo "========================================="
echo "  DataShield AI is running!"
echo "========================================="
echo "  Frontend : http://localhost:5173"
echo "  Backend  : http://localhost:8080"
echo "  Model    : gemma4:31b-cloud (Ollama)"
echo ""
echo "  Admin    : admin@datashield.ai / Admin@123!"
echo "  Employee : employee@datashield.ai / Admin@123!"
echo "========================================="
echo "  Logs:"
echo "    Backend  -> /tmp/datashield-backend.log"
echo "    Frontend -> /tmp/datashield-frontend.log"
echo "========================================="
