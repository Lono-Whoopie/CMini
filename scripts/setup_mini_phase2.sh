#!/bin/bash
# Phase 2: Remote Mini Configuration Script

echo "🚀 Setting up M4 Pro Mini for remote development via Tailscale..."
echo "=================================================="
echo ""

# Store Mini IP
MINI_IP="100.118.38.115"

# Step 1: Install Homebrew
echo "📦 Step 1: Installing Homebrew on Mini..."
echo "You'll need to enter the Mini password for sudo access."
echo ""

ssh -t $MINI_IP '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'

# Add Homebrew to PATH
ssh $MINI_IP 'echo "eval \"\$(/opt/homebrew/bin/brew shellenv)\"" >> ~/.zprofile && eval "$(/opt/homebrew/bin/brew shellenv)"'

echo "✅ Homebrew installed"
echo ""

# Step 2: Install essential tools
echo "🛠️ Step 2: Installing essential development tools..."
ssh $MINI_IP 'eval "$(/opt/homebrew/bin/brew shellenv)" && brew install curl wget git htop tree jq python3 node redis'

echo "✅ Essential tools installed"
echo ""

# Step 3: Install Python packages
echo "🐍 Step 3: Installing Python packages for multi-agent frameworks..."
ssh $MINI_IP 'python3 -m pip install --upgrade pip && python3 -m pip install crewai autogen-agentchat asyncio aiohttp requests pandas numpy'

echo "✅ Python packages installed"
echo ""

# Step 4: Set computer name
echo "🏷️ Step 4: Setting computer name..."
ssh -t $MINI_IP 'sudo scutil --set ComputerName "mini-dev-server" && sudo scutil --set HostName "mini-dev-server" && sudo scutil --set LocalHostName "mini-dev-server"'

echo "✅ Computer name set"
echo ""

# Step 5: Install Ollama
echo "🤖 Step 5: Installing Ollama..."
ssh $MINI_IP 'curl -fsSL https://ollama.com/install.sh | sh'

echo "✅ Ollama installed"
echo ""

# Step 6: Configure Ollama for remote access
echo "⚙️ Step 6: Configuring Ollama for Tailscale access..."

# Create Ollama configuration
ssh -t $MINI_IP 'sudo mkdir -p /etc/ollama'

ssh -t $MINI_IP 'sudo tee /etc/ollama/ollama.env << EOF
OLLAMA_HOST=0.0.0.0:11434
OLLAMA_ORIGINS=*
OLLAMA_NUM_PARALLEL=3
OLLAMA_MAX_LOADED_MODELS=3
OLLAMA_KEEP_ALIVE=30m
EOF'

echo "✅ Ollama configured"
echo ""

# Step 7: Start Redis
echo "📊 Step 7: Starting Redis..."
ssh $MINI_IP 'eval "$(/opt/homebrew/bin/brew shellenv)" && brew services start redis'

echo "✅ Redis started"
echo ""

# Step 8: Create directories
echo "📁 Step 8: Creating development directories..."
ssh $MINI_IP 'mkdir -p ~/dev-task-queue && mkdir -p /tmp/dev-uploads'

echo "✅ Directories created"
echo ""

# Step 9: Get Tailscale IP and save environment
echo "🔧 Step 9: Setting up environment variables..."
MINI_TAILSCALE_IP=$(ssh $MINI_IP "tailscale ip -4 2>/dev/null || echo '100.118.38.115'")

ssh $MINI_IP "echo 'export TAILSCALE_IP=$MINI_TAILSCALE_IP' >> ~/.zprofile"

echo "✅ Environment configured"
echo ""

# Step 10: Start Ollama service
echo "🚀 Step 10: Starting Ollama service..."
ssh $MINI_IP 'ollama serve > /dev/null 2>&1 &'
sleep 3

echo "✅ Ollama service started"
echo ""

# Final status check
echo "=================================================="
echo "✅ Mini base configuration complete!"
echo ""
echo "📍 Mini Tailscale IP: $MINI_TAILSCALE_IP"
echo "🔗 Services will be accessible via Tailscale network:"
echo "   - Ollama: http://$MINI_TAILSCALE_IP:11434"
echo "   - Redis: $MINI_TAILSCALE_IP:6379"
echo ""
echo "Next steps:"
echo "1. Deploy the development task queue server"
echo "2. Download AI models with Ollama"
echo "3. Test agent offloading from Air to Mini"
echo "=================================================="