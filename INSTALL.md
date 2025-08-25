# CMini Installation Guide

## Quick Start

The fastest way to get started is to visit the setup portal on an already-configured Mini:

```
http://100.114.129.95:8080
```

Copy the instructions and paste them into Claude Code on any computer you want to configure.

## Manual Installation

### Prerequisites

#### On Server (M4 Pro Mini)
- macOS 14.0 or later
- 64GB RAM recommended (32GB minimum)
- 100GB free disk space
- Tailscale installed from App Store
- Homebrew installed

#### On Client
- Python 3.7+
- Tailscale installed and connected to same network
- Unix-like environment (macOS, Linux, WSL on Windows)

### Step 1: Server Installation

#### 1.1 Install System Dependencies

SSH to your Mini and run:

```bash
# Install Homebrew if not present
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install core dependencies
brew install node redis wget

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Install Tailscale from App Store or:
# https://tailscale.com/download/macos
```

#### 1.2 Deploy Server Files

From your local machine:

```bash
# Clone the repository
git clone https://github.com/yourusername/CMini.git
cd CMini

# Copy server files to Mini (replace 'mini' with your Mini's hostname or IP)
scp -r server/* mini:~/cmini-server/
scp -r scripts/* mini:~/cmini-scripts/

# Make scripts executable
ssh mini 'chmod +x ~/cmini-scripts/*.sh'
```

#### 1.3 Install Node Dependencies

```bash
ssh mini
cd ~/cmini-server
npm install express bull redis multer
```

#### 1.4 Configure and Start Services

```bash
# Optimize Ollama for M4 Pro
~/cmini-scripts/optimize-ollama.sh

# Start all services
~/cmini-scripts/start-services.sh

# Verify services are running
curl http://localhost:3001/health
curl http://localhost:8080/health
curl http://localhost:11434/api/version
redis-cli ping
```

#### 1.5 Download AI Models

```bash
# Download recommended models
ollama pull qwen2.5-coder:32b-instruct-q4_K_M
ollama pull qwen2.5-coder:14b-instruct-q4_K_M
ollama pull llama3.2:3b

# Verify models are installed
ollama list
```

#### 1.6 Configure Auto-Start

Create LaunchDaemons for automatic startup:

```bash
# Create LaunchDaemon for task queue server
sudo tee /Library/LaunchDaemons/com.cmini.taskqueue.plist > /dev/null << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cmini.taskqueue</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/mike/cmini-server/task-queue-server.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>/Users/mike/cmini-server</string>
    <key>StandardOutPath</key>
    <string>/tmp/cmini-taskqueue.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/cmini-taskqueue.error.log</string>
</dict>
</plist>
EOF

# Load the service
sudo launchctl load /Library/LaunchDaemons/com.cmini.taskqueue.plist
```

### Step 2: Client Installation

#### 2.1 Automatic Setup (Recommended)

On any computer with Tailscale connected:

```bash
# Get your Mini's Tailscale IP
tailscale status | grep mini

# Visit setup portal (replace with your Mini's IP)
open http://100.114.129.95:8080

# Copy the instructions and paste into Claude Code
```

#### 2.2 Manual Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/CMini.git
cd CMini

# Copy client files
cp client/claude_mini_client.py ~/.claude_mini_client.py
cp client/claude_config ~/.claude_config
cp client/check_updates.sh ~/.claude_check_updates.sh
chmod +x ~/.claude_check_updates.sh

# Update the IP address in config files if needed
export MINI_IP="100.114.129.95"  # Your Mini's Tailscale IP
sed -i '' "s/100.114.129.95/$MINI_IP/g" ~/.claude_config
sed -i '' "s/100.114.129.95/$MINI_IP/g" ~/.claude_check_updates.sh

# Add to shell profile
echo "source ~/.claude_config" >> ~/.zshrc  # or ~/.bashrc for bash
source ~/.claude_config

# Test the connection
python3 client/test_integration.py
```

#### 2.3 Create CLAUDE.md Instructions

Create `~/CLAUDE.md` with instructions for Claude Code:

```bash
cp docs/CLAUDE_INSTRUCTIONS.md ~/CLAUDE.md
```

### Step 3: Verification

#### 3.1 Test All Endpoints

```bash
# From client machine
cd CMini
python3 client/test_integration.py
```

Expected output:
```
🧪 Testing Mini Server Integration
==================================================

1️⃣ Testing connection...
   ✅ Server status: ready

2️⃣ Checking models...
   ✅ Models installed: 3
      - qwen2.5-coder:32b-instruct-q4_K_M
      - qwen2.5-coder:14b-instruct-q4_K_M
      - llama3.2:3b

3️⃣ Checking queue...
   ✅ Queue status: {'active': 0, 'waiting': 0, 'completed': 0}

4️⃣ Testing CrewAI endpoint...
   ✅ CrewAI endpoint working - Job ID: xxx

5️⃣ Testing AutoGen endpoint...
   ✅ AutoGen endpoint working - Job ID: xxx

6️⃣ Checking for updates...
   ✅ Portal version: 2.0.0 (2025-08-25)

==================================================
✅ Integration test complete!
```

#### 3.2 Test Task Submission

```python
# Python test
from claude_mini_client import mini_client

# Submit a test task
result = mini_client.submit_task(
    task_type="code-analysis",
    content="def hello(): print('world')",
    wait=True
)
print(result)
```

### Step 4: Windows (WSL) Setup

For Windows users, install in WSL:

```bash
# In WSL terminal
cd ~

# Install Python if needed
sudo apt update
sudo apt install python3 python3-pip

# Follow the Linux client installation steps above
wget https://github.com/yourusername/CMini/archive/main.zip
unzip main.zip
cd CMini-main

# Copy client files
cp client/claude_mini_client.py ~/.claude_mini_client.py
cp client/claude_config ~/.claude_config
cp client/check_updates.sh ~/.claude_check_updates.sh

# Update config with your Mini's IP
nano ~/.claude_config  # Update IP addresses

# Add to bashrc
echo "source ~/.claude_config" >> ~/.bashrc
source ~/.bashrc

# Test
python3 client/test_integration.py
```

## Troubleshooting

### Cannot Connect to Mini

1. Check Tailscale is connected:
```bash
tailscale status
```

2. Ping the Mini:
```bash
tailscale ping mini-hostname
```

3. Try the LAN IP if on same network:
```bash
curl http://10.0.10.244:3001/health
```

### Services Not Starting

1. Check logs:
```bash
ssh mini
tail -100 /tmp/cmini-taskqueue.error.log
tail -100 ~/cmini-server/server.log
```

2. Manually start services:
```bash
ssh mini
cd ~/cmini-server
node task-queue-server.js
```

### Models Not Downloading

1. Check disk space:
```bash
ssh mini 'df -h'
```

2. Manually pull models:
```bash
ssh mini
ollama pull qwen2.5-coder:32b-instruct-q4_K_M
```

### Redis Connection Issues

1. Check Redis is running:
```bash
ssh mini
redis-cli ping
```

2. Start Redis manually:
```bash
redis-server --protected-mode no --bind 0.0.0.0
```

## Next Steps

1. Read the [Architecture Documentation](README.md)
2. Review [API Reference](docs/API.md)
3. Configure CrewAI/AutoGen agents
4. Start submitting long-running tasks!

## Support

If you encounter issues:
1. Run the integration test: `python3 client/test_integration.py`
2. Check the setup portal: `http://your-mini-ip:8080`
3. Review server logs: `ssh mini 'tail -100 ~/cmini-server/server.log'`