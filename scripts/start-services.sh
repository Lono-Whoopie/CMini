#!/bin/bash
# Mini Dev Server - Service Startup Script
# This ensures all services start properly on boot

echo "Starting Mini Dev Server services..."

# Set PATH
export PATH="/opt/homebrew/bin:$PATH"

# Start Redis with network access
echo "Starting Redis..."
pkill redis-server 2>/dev/null
sleep 1
redis-server --protected-mode no --bind 0.0.0.0 --daemonize yes
sleep 2
# Verify Redis is running
redis-cli ping > /dev/null 2>&1 || echo "Warning: Redis may not have started properly"

# Start Ollama with network access and M4 Pro optimization
echo "Starting Ollama (optimized for M4 Pro)..."
pkill -f ollama 2>/dev/null
sleep 2

# M4 Pro optimization settings
export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_NUM_GPU=999  # Use all GPU layers
export OLLAMA_KEEP_ALIVE=24h
export OLLAMA_MAX_LOADED_MODELS=3
export OLLAMA_NUM_PARALLEL=4
export GOMAXPROCS=14  # All CPU cores
export GGML_METAL=1  # Metal acceleration

nohup /usr/local/bin/ollama serve > ~/ollama.log 2>&1 &

# Wait for Ollama to start
sleep 5

# Start Task Queue Server
echo "Starting Task Queue Server..."
cd ~/dev-task-queue
pkill -f "node.*server.js" 2>/dev/null
nohup node server.js > server.log 2>&1 &

# Start Setup Portal
echo "Starting Setup Portal..."
cd ~/setup-portal
nohup node server.js > portal.log 2>&1 &

echo "All services started!"
echo ""
echo "Services available at:"
echo "  Task Queue: http://100.114.129.95:3001"
echo "  Ollama API: http://100.114.129.95:11434"
echo "  Setup Portal: http://100.114.129.95:8080"
echo "  Redis: 100.114.129.95:6379"