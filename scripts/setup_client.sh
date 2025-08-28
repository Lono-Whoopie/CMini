#!/bin/bash
# CMini Client Setup Script
# One-command setup for any machine to use the CMini server

set -e

MINI_IP="100.114.129.95"
MINI_PORT="3001"
PORTAL_URL="http://${MINI_IP}:8080"

echo "🚀 CMini Client Setup Script"
echo "============================"
echo ""

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     SHELL_RC="$HOME/.bashrc";;
    Darwin*)    SHELL_RC="$HOME/.zshrc";;
    *)          SHELL_RC="$HOME/.bashrc";;
esac

echo "📍 Detected OS: ${OS}"
echo "📝 Shell config: ${SHELL_RC}"
echo ""

# Step 1: Check Python
echo "1️⃣ Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    echo "   ✅ Python ${PYTHON_VERSION} found"
else
    echo "   ❌ Python3 not found. Please install Python 3.6+ first"
    exit 1
fi

# Step 2: Install requests module if needed
echo ""
echo "2️⃣ Checking Python modules..."
if python3 -c "import requests" &> /dev/null; then
    echo "   ✅ requests module found"
else
    echo "   📦 Installing requests module..."
    pip3 install --user requests
fi

# Step 3: Download CrewAI Expert client
echo ""
echo "3️⃣ Downloading CrewAI Expert client..."
curl -s -o ~/claude_mini_expert.py ${PORTAL_URL}/downloads/claude_mini_expert.py
chmod +x ~/claude_mini_expert.py
echo "   ✅ Expert client downloaded to ~/claude_mini_expert.py"

# Step 4: Download standard Mini client
echo ""
echo "4️⃣ Creating standard Mini client..."
cat > ~/claude_mini_client.py << 'EOF'
#!/usr/bin/env python3
"""CMini Client - Basic task submission"""
import requests
import json
import sys

MINI_IP = "100.114.129.95"
TASK_QUEUE_PORT = 3001
BASE_URL = f"http://{MINI_IP}:{TASK_QUEUE_PORT}"

class MiniClient:
    def __init__(self):
        self.base_url = BASE_URL
        
    def health_check(self):
        try:
            r = requests.get(f"{self.base_url}/health", timeout=3)
            return r.status_code == 200
        except:
            return False
    
    def submit_task(self, task_type, content, wait=False):
        try:
            r = requests.post(
                f"{self.base_url}/api/dev-task",
                json={"task_type": task_type, "content": content}
            )
            if r.status_code == 200:
                result = r.json()
                print(f"✅ Task submitted: {result.get('job_id')}")
                return result
        except Exception as e:
            print(f"❌ Error: {e}")
            return None
    
    def check_job(self, job_id):
        try:
            r = requests.get(f"{self.base_url}/api/job/{job_id}")
            return r.json() if r.status_code == 200 else None
        except:
            return None

# Make available as module
mini_client = MiniClient()

if __name__ == "__main__":
    client = MiniClient()
    if client.health_check():
        print("✅ Mini server is accessible")
    else:
        print("❌ Cannot reach Mini server")
EOF
chmod +x ~/claude_mini_client.py
echo "   ✅ Standard client created at ~/claude_mini_client.py"

# Step 5: Create environment configuration
echo ""
echo "5️⃣ Creating environment configuration..."
cat > ~/.claude_config << EOF
# CMini Configuration
export CLAUDE_MINI_IP="${MINI_IP}"
export CLAUDE_DEV_SERVER="http://${MINI_IP}:${MINI_PORT}"
export CLAUDE_OLLAMA_HOST="http://${MINI_IP}:11434"
export CLAUDE_REDIS_HOST="${MINI_IP}:6379"
export CLAUDE_TASK_QUEUE_URL="http://${MINI_IP}:${MINI_PORT}"

# Helper aliases
alias mini="ssh ${MINI_IP}"
alias mini-health="curl http://${MINI_IP}:${MINI_PORT}/health | python3 -m json.tool"
alias mini-stats="curl http://${MINI_IP}:${MINI_PORT}/api/stats | python3 -m json.tool"
alias mini-models="curl http://${MINI_IP}:${MINI_PORT}/api/models | python3 -m json.tool"
alias mini-jobs="open http://${MINI_IP}:8080/jobs"
alias mini-portal="open http://${MINI_IP}:8080"

# Python path for imports
export PYTHONPATH="\$HOME:\$PYTHONPATH"

# Helper functions
claude_submit_task() {
    python3 -c "from claude_mini_client import mini_client; print(mini_client.submit_task('\$1', '\$2'))"
}

claude_check_job() {
    python3 -c "from claude_mini_client import mini_client; print(mini_client.check_job('\$1'))"
}

crew_simple() {
    python3 -c "from claude_mini_expert import CrewAIExpertClient; c = CrewAIExpertClient(); c.simple_crew('\$1')"
}

crew_review() {
    python3 -c "from claude_mini_expert import review_code; review_code('\$1')"
}

crew_debug() {
    python3 -c "from claude_mini_expert import debug_issue; debug_issue('\$1')"
}

crew_api() {
    python3 -c "from claude_mini_expert import build_api; build_api('\$1')"
}
EOF
echo "   ✅ Configuration created at ~/.claude_config"

# Step 6: Add to shell profile
echo ""
echo "6️⃣ Updating shell configuration..."
if ! grep -q "claude_config" "${SHELL_RC}" 2>/dev/null; then
    echo "" >> "${SHELL_RC}"
    echo "# CMini Configuration" >> "${SHELL_RC}"
    echo "[ -f ~/.claude_config ] && source ~/.claude_config" >> "${SHELL_RC}"
    echo "   ✅ Added to ${SHELL_RC}"
else
    echo "   ✅ Already configured in ${SHELL_RC}"
fi

# Step 7: Create CLAUDE.md
echo ""
echo "7️⃣ Creating CLAUDE.md documentation..."
cat > ~/CLAUDE.md << 'EOF'
# Claude Configuration - CMini Integration

## Auto-Update Check
ALWAYS check for updates at session start:
```bash
curl -s http://100.114.129.95:8080/version | python3 -m json.tool
```

## CMini Server Access
- **Portal**: http://100.114.129.95:8080
- **Jobs Monitor**: http://100.114.129.95:8080/jobs
- **Task Queue**: http://100.114.129.95:3001
- **Ollama**: http://100.114.129.95:11434

## CrewAI Expert System (IMPORTANT - USE THIS!)
For ANY CrewAI crew creation, use the expert system:
```python
from claude_mini_expert import CrewAIExpertClient
client = CrewAIExpertClient()
result = client.simple_crew("your task description here")
```

Never manually create crews - the expert system provides:
- 6 pre-configured patterns (code review, API, debugging, architecture, data, refactoring)
- 20+ expert agents with tools and capabilities
- Automatic task generation with dependencies
- Optimized resource allocation

Quick functions:
- `crew_review("file.py")` - Code review
- `crew_api("user management")` - Build API
- `crew_debug("memory leak")` - Debug issue
- `crew_simple("any task")` - General crew

## When to Use CMini
ALWAYS use Mini for:
1. CrewAI/AutoGen crews (MANDATORY)
2. Tasks > 90 seconds
3. Processing 5+ files
4. 32B+ model inference
5. Long-running operations

## Available Commands
- `mini` - SSH to Mini
- `mini-health` - Check server health
- `mini-stats` - View queue statistics
- `mini-models` - List available models
- `mini-jobs` - Open job monitor
- `mini-portal` - Open setup portal

## Python Clients
```python
# CrewAI Expert (preferred)
from claude_mini_expert import CrewAIExpertClient
client = CrewAIExpertClient()

# Standard client
from claude_mini_client import mini_client
```
EOF
echo "   ✅ CLAUDE.md created at ~/CLAUDE.md"

# Step 8: Test connection
echo ""
echo "8️⃣ Testing connection to Mini server..."
if curl -s -f "${PORTAL_URL}/health" > /dev/null 2>&1; then
    echo "   ✅ Portal is accessible"
else
    echo "   ⚠️  Cannot reach portal, may need Tailscale"
fi

if curl -s -f "http://${MINI_IP}:${MINI_PORT}/health" > /dev/null 2>&1; then
    echo "   ✅ Task queue is accessible"
else
    echo "   ⚠️  Cannot reach task queue"
fi

# Step 9: Quick test
echo ""
echo "9️⃣ Running quick test..."
python3 << EOF
try:
    from claude_mini_expert import CrewAIExpertClient
    from claude_mini_client import mini_client
    print("   ✅ Python imports working")
    
    client = CrewAIExpertClient()
    if hasattr(client, 'simple_crew'):
        print("   ✅ Expert client ready")
    
    if mini_client.health_check():
        print("   ✅ Can connect to Mini server")
    else:
        print("   ⚠️  Cannot connect to Mini (may need Tailscale)")
except Exception as e:
    print(f"   ⚠️  Test failed: {e}")
EOF

# Final message
echo ""
echo "✨ Setup Complete!"
echo "=================="
echo ""
echo "To activate configuration:"
echo "  source ${SHELL_RC}"
echo ""
echo "Quick start examples:"
echo "  crew_simple \"Review my code\""
echo "  crew_api \"Build user management API\""
echo "  crew_debug \"Fix memory leak\""
echo ""
echo "For more info:"
echo "  mini-portal    # Open web portal"
echo "  mini-jobs      # View running jobs"
echo ""
echo "📚 Full documentation: http://${MINI_IP}:8080/docs/crewai-expert"