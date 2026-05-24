#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Kill anything already running ─────────────────────────────────────────────
echo "[1/4] Cleaning up old processes..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
pkill -f 'mvnw|spring-boot:run|vite' 2>/dev/null || true
sleep 1

# ── MongoDB: prefer host service if already on :27017, else Docker ────────────
echo "[2/4] Setting up MongoDB..."

if ss -tlnp 2>/dev/null | grep -q ':27017'; then
  # A local mongod (or any service) already owns :27017.
  # The host mongod typically runs without auth, so use a no-auth URI.
  echo "       Host mongod detected on :27017 — skipping Docker container."
  MONGODB_URI="mongodb://localhost:27017/datashield"

  # Verify we can actually reach it
  until mongosh --quiet --eval 'db.runCommand("ping").ok' \
        "mongodb://localhost:27017/datashield" > /dev/null 2>&1; do
    echo "       Waiting for host MongoDB..."
    sleep 2
  done

else
  # No service on :27017 — start the Docker container
  echo "       Starting MongoDB container..."
  docker compose -f "$PROJECT_DIR/docker-compose.yml" up -d mongodb 2>&1 | grep -v "^time="

  until docker exec datashield-mongo mongosh --quiet \
        --eval 'db.runCommand("ping").ok' \
        "mongodb://admin:secure_password_123@localhost:27017/datashield?authSource=admin" \
        > /dev/null 2>&1; do
    sleep 2
  done

  MONGODB_URI="mongodb://admin:secure_password_123@localhost:27017/datashield?authSource=admin"
fi

echo "       MongoDB ready — $MONGODB_URI"

# ── Start Backend (on host, connects to Ollama at localhost:11434) ─────────────
echo "[3/4] Starting Spring Boot backend..."
cd "$PROJECT_DIR"
export MONGODB_URI
export LLM_PROVIDER=ollama
export OLLAMA_MODEL=gemma4:31b-cloud
export OLLAMA_BASE_URL=http://localhost:11434/v1
export SPRING_PROFILES_ACTIVE=dev

./mvnw spring-boot:run -q > /tmp/datashield-backend.log 2>&1 &
BACKEND_PID=$!

until curl -sf http://localhost:8080/actuator/health > /dev/null 2>&1; do
  if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "ERROR: Backend crashed. Check /tmp/datashield-backend.log"
    tail -30 /tmp/datashield-backend.log
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
