#!/bin/bash
# Download essential AI models for development

MINI_IP="100.118.38.115"

echo "🤖 Downloading AI Models to M4 Pro Mini"
echo "========================================"
echo ""
echo "This will download several models optimized for your 64GB RAM."
echo "Total download size: ~50-60GB"
echo ""

# Function to download and verify model
download_model() {
    local model=$1
    local description=$2
    echo ""
    echo "📥 Downloading: $model"
    echo "   Description: $description"
    ssh $MINI_IP "source ~/.zprofile && ollama pull $model"
    if [ $? -eq 0 ]; then
        echo "   ✅ $model downloaded successfully"
    else
        echo "   ❌ Failed to download $model"
    fi
}

# Start downloads
echo "Starting model downloads..."

# Primary coding model
download_model "qwen2.5-coder:32b-instruct-q4_K_M" "Primary coding assistant (32B parameters)"

# Fast coding model for quick iterations
download_model "qwen2.5-coder:14b-instruct-q4_K_M" "Fast coding model (14B parameters)"

# Alternative coding model
download_model "deepseek-coder-v2:16b-lite-instruct-q4_K_M" "Alternative coding model (16B parameters)"

# Heavy reasoning model
download_model "llama3.3:70b-instruct-q4_K_M" "Heavy reasoning & architecture (70B parameters)"

# Documentation and analysis
download_model "qwen2.5:72b-instruct-q4_K_M" "Documentation & analysis (72B parameters)"

echo ""
echo "========================================"
echo "📊 Checking installed models..."
ssh $MINI_IP "source ~/.zprofile && ollama list"

echo ""
echo "========================================"
echo "✅ Model download complete!"
echo ""
echo "You can now use these models via:"
echo "  - Direct API: http://100.118.38.115:11434"
echo "  - SSH: ssh 100.118.38.115 'ollama run <model>'"
echo "  - Task queue (once deployed)"
echo "========================================"