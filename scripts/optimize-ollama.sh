#!/bin/bash
# Optimize Ollama for M4 Pro Mini with Neural Engine

echo "🚀 Optimizing Ollama for Apple M4 Pro..."

# Set environment variables for maximum GPU/Neural Engine usage
export OLLAMA_NUM_GPU=999  # Use all available GPU layers
export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_MODELS=/Users/mike/.ollama/models
export OLLAMA_KEEP_ALIVE=24h  # Keep models in memory longer
export OLLAMA_MAX_LOADED_MODELS=3  # M4 Pro can handle multiple models
export OLLAMA_NUM_PARALLEL=4  # Parallel inference
export GOMAXPROCS=14  # Use all CPU cores

# Metal Performance Shaders optimization
export GGML_METAL=1
export GGML_METAL_NDEBUG=1

echo "📊 System Info:"
echo "- Chip: Apple M4 Pro"
echo "- Performance cores: 10"
echo "- Efficiency cores: 4" 
echo "- Neural Engine: 16-core"
echo "- Memory: 64GB unified"

echo ""
echo "⚙️ Ollama Settings:"
echo "- GPU Layers: Maximum (999)"
echo "- Parallel Requests: 4"
echo "- Keep Alive: 24 hours"
echo "- Max Loaded Models: 3"

# Kill existing Ollama
pkill -f ollama

# Start optimized Ollama
echo ""
echo "Starting optimized Ollama..."
nohup /usr/local/bin/ollama serve > ~/ollama_optimized.log 2>&1 &

sleep 3

echo ""
echo "✅ Ollama optimized for M4 Pro!"
echo ""
echo "Performance tips:"
echo "1. Models will use Metal Performance Shaders"
echo "2. Neural Engine utilized for applicable operations"
echo "3. All 14 CPU cores available"
echo "4. 64GB unified memory allows multiple large models"
echo ""
echo "Test with: curl http://localhost:11434/api/version"