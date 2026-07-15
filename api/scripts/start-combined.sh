#!/bin/bash
# Runs API server and worker in the same container (free deployment mode).
# If either process exits unexpectedly, the other is killed and the container exits.
# This lets the platform (Render, Koyeb) restart the container on any failure.

set -m  # Enable job control

node dist/main &
API_PID=$!

node dist/workers/worker.js &
WORKER_PID=$!

echo "→ API server started (PID $API_PID)"
echo "→ Worker started (PID $WORKER_PID)"

# wait -n exits when ANY background job finishes (bash 4.3+, available in node:20-slim/Debian)
wait -n

echo "→ A process exited — stopping remaining processes and exiting"
kill $API_PID $WORKER_PID 2>/dev/null
wait $API_PID $WORKER_PID 2>/dev/null
exit 1
