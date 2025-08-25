#!/bin/bash
# Install remaining tools on Mini

MINI_IP="100.118.38.115"

echo "🚀 Installing development tools on M4 Pro Mini"
echo "=============================================="
echo ""

# Step 1: Install Homebrew (if needed)
echo "📦 Step 1: Checking Homebrew..."
if ! ssh $MINI_IP "which brew" > /dev/null 2>&1; then
    echo "Homebrew not found. Installing..."
    echo "Please enter the Mini password when prompted:"
    ssh -t $MINI_IP "~/install_homebrew.sh"
    ssh $MINI_IP 'echo "eval \"\$(/opt/homebrew/bin/brew shellenv)\"" >> ~/.zprofile'
else
    echo "✅ Homebrew already installed"
fi

# Step 2: Install essential tools via Homebrew
echo ""
echo "🛠️ Step 2: Installing essential development tools..."
ssh $MINI_IP 'source ~/.zprofile && brew install curl wget git htop tree jq python3 node redis'

# Step 3: Install Python packages
echo ""
echo "🐍 Step 3: Installing Python packages..."
ssh $MINI_IP 'python3 -m pip install --upgrade pip'
ssh $MINI_IP 'python3 -m pip install crewai autogen-agentchat asyncio aiohttp requests pandas numpy'

# Step 4: Install Ollama
echo ""
echo "🤖 Step 4: Installing Ollama..."
if ! ssh $MINI_IP "which ollama" > /dev/null 2>&1; then
    ssh $MINI_IP 'curl -fsSL https://ollama.com/install.sh | sh'
else
    echo "✅ Ollama already installed"
fi

# Step 5: Configure Ollama for remote access
echo ""
echo "⚙️ Step 5: Configuring Ollama..."
ssh -t $MINI_IP 'sudo mkdir -p /etc/ollama && sudo tee /etc/ollama/ollama.env << EOF
OLLAMA_HOST=0.0.0.0:11434
OLLAMA_ORIGINS=*
OLLAMA_NUM_PARALLEL=3
OLLAMA_MAX_LOADED_MODELS=3
OLLAMA_KEEP_ALIVE=30m
EOF'

# Step 6: Start services
echo ""
echo "🚀 Step 6: Starting services..."
ssh $MINI_IP 'source ~/.zprofile && brew services start redis'
ssh $MINI_IP 'pkill ollama 2>/dev/null; nohup ollama serve > ~/ollama.log 2>&1 &'

# Step 7: Test services
echo ""
echo "🧪 Step 7: Testing services..."
sleep 3

# Test Redis
echo -n "Redis: "
if ssh $MINI_IP "redis-cli ping" 2>/dev/null | grep -q PONG; then
    echo "✅ Working"
else
    echo "❌ Not responding"
fi

# Test Ollama
echo -n "Ollama: "
if ssh $MINI_IP "curl -s http://localhost:11434/api/tags" > /dev/null 2>&1; then
    echo "✅ Working"
else
    echo "❌ Not responding"
fi

echo ""
echo "=============================================="
echo "✅ Installation complete!"
echo ""
echo "Services available via Tailscale:"
echo "  Ollama: http://100.118.38.115:11434"
echo "  Redis:  100.118.38.115:6379"
echo ""
echo "Next steps:"
echo "1. Download AI models: ollama pull qwen2.5-coder:32b-instruct-q4_K_M"
echo "2. Deploy the task queue server"
echo "=============================================="