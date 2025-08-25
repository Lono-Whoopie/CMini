const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 80;

// Get the Mini's Tailscale IP dynamically
const MINI_TAILSCALE_IP = '100.114.129.95';
const MINI_LAN_IP = '10.0.10.244';
const TASK_QUEUE_PORT = '3001';

// Serve static files
app.use(express.static('public'));

// Main HTML page with instructions
const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mini Dev Server Setup Portal</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            background: white;
            border-radius: 10px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h1 {
            color: #667eea;
            margin-bottom: 10px;
        }
        .status {
            display: inline-block;
            padding: 5px 10px;
            background: #10b981;
            color: white;
            border-radius: 5px;
            font-size: 14px;
        }
        .cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .card h2 {
            color: #764ba2;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .card h3 {
            color: #667eea;
            margin: 20px 0 10px;
            font-size: 18px;
        }
        .download-btn {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 10px 10px 0;
            transition: transform 0.2s;
        }
        .download-btn:hover {
            transform: translateY(-2px);
        }
        pre {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            margin: 10px 0;
        }
        code {
            font-family: 'Courier New', monospace;
            background: #f3f4f6;
            padding: 2px 5px;
            border-radius: 3px;
        }
        .endpoint {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 10px;
            margin: 10px 0;
        }
        .model-list {
            background: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 10px;
            margin: 10px 0;
        }
        .warning {
            background: #fee2e2;
            border-left: 4px solid #ef4444;
            padding: 10px;
            margin: 10px 0;
        }
        .icon {
            width: 24px;
            height: 24px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🚀 Mini Dev Server Setup Portal</h1>
            <p>Configure your computer to use the M4 Pro Mini for AI-powered development tasks</p>
            <br>
            <span class="status">✅ Server Online</span>
            <span class="status" style="background: #3b82f6;">📍 Tailscale: ${MINI_TAILSCALE_IP}</span>
            <span class="status" style="background: #8b5cf6;">🏠 LAN: ${MINI_LAN_IP}</span>
        </header>

        <div class="cards">
            <div class="card">
                <h2>
                    <span class="icon">⚡</span>
                    Quick Setup
                </h2>
                <p>Download and run the setup script for your operating system:</p>
                
                <h3>🍎 macOS</h3>
                <a href="/setup/macos.sh" class="download-btn" download>Download macOS Script</a>
                <pre>curl -fsSL http://${MINI_TAILSCALE_IP}/setup/macos.sh | bash</pre>
                
                <h3>🐧 Linux/Ubuntu</h3>
                <a href="/setup/linux.sh" class="download-btn" download>Download Linux Script</a>
                <pre>curl -fsSL http://${MINI_TAILSCALE_IP}/setup/linux.sh | bash</pre>
                
                <h3>🪟 Windows</h3>
                <a href="/setup/windows.ps1" class="download-btn" download>Download Windows Script</a>
                <pre>irm http://${MINI_TAILSCALE_IP}/setup/windows.ps1 | iex</pre>
            </div>

            <div class="card">
                <h2>
                    <span class="icon">🔧</span>
                    Manual Configuration
                </h2>
                <p>Set these environment variables on your system:</p>
                <pre>CLAUDE_DEV_SERVER=http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}
CLAUDE_MINI_IP=${MINI_TAILSCALE_IP}
CLAUDE_OLLAMA_HOST=http://${MINI_TAILSCALE_IP}:11434
CLAUDE_REDIS_HOST=${MINI_TAILSCALE_IP}</pre>
                
                <h3>Configuration Files</h3>
                <p>Download configuration files:</p>
                <a href="/config/claude.md" class="download-btn" download>CLAUDE.md</a>
                <a href="/config/claude_config" class="download-btn" download>.claude_config</a>
                <a href="/config/claude_mini_client.py" class="download-btn" download>Python Client</a>
            </div>
        </div>

        <div class="cards">
            <div class="card">
                <h2>
                    <span class="icon">🎯</span>
                    Available Services
                </h2>
                
                <div class="endpoint">
                    <strong>Task Queue API</strong>
                    <code>http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}</code>
                    <ul>
                        <li><code>/health</code> - Server health check</li>
                        <li><code>/api/dev-task</code> - Submit development tasks</li>
                        <li><code>/api/models</code> - List available models</li>
                        <li><code>/api/job/:id</code> - Check job status</li>
                        <li><code>/api/stats</code> - Queue statistics</li>
                    </ul>
                </div>
                
                <div class="endpoint">
                    <strong>Ollama LLM API</strong>
                    <code>http://${MINI_TAILSCALE_IP}:11434</code>
                    <ul>
                        <li><code>/api/generate</code> - Generate text</li>
                        <li><code>/api/tags</code> - List models</li>
                        <li><code>/api/pull</code> - Download models</li>
                    </ul>
                </div>
                
                <div class="endpoint">
                    <strong>Redis Queue</strong>
                    <code>${MINI_TAILSCALE_IP}:6379</code>
                </div>
            </div>

            <div class="card">
                <h2>
                    <span class="icon">🤖</span>
                    Available Models
                </h2>
                
                <div class="model-list">
                    <strong>Installed Models:</strong>
                    <ul id="model-list">
                        <li>Loading...</li>
                    </ul>
                </div>
                
                <h3>Supported Task Types</h3>
                <ul>
                    <li><strong>code-analysis</strong> - Analyze code quality</li>
                    <li><strong>code-generation</strong> - Generate new code</li>
                    <li><strong>code-refactor</strong> - Refactor existing code</li>
                    <li><strong>debugging</strong> - Debug and fix issues</li>
                    <li><strong>documentation</strong> - Generate docs</li>
                    <li><strong>testing</strong> - Create test suites</li>
                    <li><strong>architecture</strong> - System design</li>
                    <li><strong>planning</strong> - Project planning</li>
                </ul>
            </div>
        </div>

        <div class="card">
            <h2>
                <span class="icon">📚</span>
                Usage Examples
            </h2>
            
            <h3>Submit a Task (curl)</h3>
            <pre>curl -X POST http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/api/dev-task \\
  -H "Content-Type: application/json" \\
  -d '{"task_type":"code-analysis","content":"def hello(): print('hello')"}'</pre>
            
            <h3>Python Client</h3>
            <pre>from claude_mini_client import mini_client

# Analyze code
result = mini_client.analyze_code("def hello(): print('hello')")

# Generate code
code = mini_client.generate_code("Create a REST API endpoint for user login")

# Direct LLM query
response = mini_client.query_ollama("Explain async/await in Python")</pre>
            
            <h3>Check Server Health</h3>
            <pre>curl http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/health</pre>
        </div>

        <div class="card">
            <h2>
                <span class="icon">⚠️</span>
                Prerequisites
            </h2>
            <div class="warning">
                <strong>Tailscale Required:</strong> You must have Tailscale installed and connected to the same network as the Mini server.
                <br><br>
                Install Tailscale: <a href="https://tailscale.com/download" target="_blank">https://tailscale.com/download</a>
            </div>
        </div>
    </div>

    <script>
        // Fetch and display installed models
        fetch('http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/api/models')
            .then(res => res.json())
            .then(data => {
                const modelList = document.getElementById('model-list');
                if (data.installed && data.installed.length > 0) {
                    modelList.innerHTML = data.installed.map(model => 
                        '<li><code>' + model + '</code></li>'
                    ).join('');
                } else {
                    modelList.innerHTML = '<li>No models installed yet</li>';
                }
            })
            .catch(err => {
                document.getElementById('model-list').innerHTML = '<li>Error loading models</li>';
            });
    </script>
</body>
</html>`;

// Serve the main page
app.get('/', (req, res) => {
    res.send(indexHTML);
});

// macOS setup script
app.get('/setup/macos.sh', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(\`#!/bin/bash
# Mini Dev Server Setup Script for macOS
echo "🚀 Setting up Mini Dev Server connection..."

# Create Claude configuration
cat > ~/.claude_config << 'EOF'
# Claude Global Configuration - Mini Dev Server
export CLAUDE_DEV_SERVER="http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}"
export CLAUDE_DEV_SERVER_LAN="http://${MINI_LAN_IP}:${TASK_QUEUE_PORT}"
export CLAUDE_MINI_IP="${MINI_TAILSCALE_IP}"
export CLAUDE_MINI_LAN="${MINI_LAN_IP}"
export CLAUDE_MINI_SSH="${MINI_TAILSCALE_IP}"
export CLAUDE_OLLAMA_HOST="http://${MINI_TAILSCALE_IP}:11434"
export CLAUDE_OLLAMA_API="http://${MINI_TAILSCALE_IP}:11434/api"
export CLAUDE_REDIS_HOST="${MINI_TAILSCALE_IP}"
export CLAUDE_REDIS_PORT="6379"

# Helper functions
claude_submit_task() {
    curl -X POST "\${CLAUDE_DEV_SERVER}/api/dev-task" \\
        -H "Content-Type: application/json" \\
        -d "{\\"task_type\\":\\"\$1\\",\\"content\\":\\"\$2\\",\\"context\\":\\"\${3:-}\\"}"
}

claude_check_job() {
    curl -s "\${CLAUDE_DEV_SERVER}/api/job/\$1" | python3 -m json.tool
}

claude_server_health() {
    curl -s "\${CLAUDE_DEV_SERVER}/health" | python3 -m json.tool
}

# Aliases
alias mini="ssh \${CLAUDE_MINI_SSH}"
alias mini-health="claude_server_health"

echo "🤖 Claude configured to use Mini Dev Server at \${CLAUDE_MINI_IP}"
EOF

# Add to shell config
if [ -f ~/.zshrc ]; then
    grep -q "claude_config" ~/.zshrc || echo -e "\\n# Claude Mini Server\\n[ -f ~/.claude_config ] && source ~/.claude_config" >> ~/.zshrc
else
    echo -e "# Claude Mini Server\\n[ -f ~/.claude_config ] && source ~/.claude_config" >> ~/.zshrc
fi

if [ -f ~/.bashrc ]; then
    grep -q "claude_config" ~/.bashrc || echo -e "\\n# Claude Mini Server\\n[ -f ~/.claude_config ] && source ~/.claude_config" >> ~/.bashrc
fi

# Create CLAUDE.md
curl -s http://${MINI_TAILSCALE_IP}/config/claude.md > ~/CLAUDE.md

# Download Python client
curl -s http://${MINI_TAILSCALE_IP}/config/claude_mini_client.py > ~/.claude_mini_client.py
chmod +x ~/.claude_mini_client.py

echo "✅ Setup complete! Restart your terminal or run: source ~/.claude_config"
echo "📍 Server: http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}"
echo "📚 Documentation: ~/CLAUDE.md"
\`);
});

// Linux setup script
app.get('/setup/linux.sh', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(\`#!/bin/bash
# Mini Dev Server Setup Script for Linux
echo "🚀 Setting up Mini Dev Server connection..."

# Create Claude configuration
cat > ~/.claude_config << 'EOF'
# Claude Global Configuration - Mini Dev Server
export CLAUDE_DEV_SERVER="http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}"
export CLAUDE_DEV_SERVER_LAN="http://${MINI_LAN_IP}:${TASK_QUEUE_PORT}"
export CLAUDE_MINI_IP="${MINI_TAILSCALE_IP}"
export CLAUDE_MINI_LAN="${MINI_LAN_IP}"
export CLAUDE_MINI_SSH="${MINI_TAILSCALE_IP}"
export CLAUDE_OLLAMA_HOST="http://${MINI_TAILSCALE_IP}:11434"
export CLAUDE_OLLAMA_API="http://${MINI_TAILSCALE_IP}:11434/api"
export CLAUDE_REDIS_HOST="${MINI_TAILSCALE_IP}"
export CLAUDE_REDIS_PORT="6379"

# Helper functions
claude_submit_task() {
    curl -X POST "\${CLAUDE_DEV_SERVER}/api/dev-task" \\
        -H "Content-Type: application/json" \\
        -d "{\\"task_type\\":\\"\$1\\",\\"content\\":\\"\$2\\",\\"context\\":\\"\${3:-}\\"}"
}

claude_check_job() {
    curl -s "\${CLAUDE_DEV_SERVER}/api/job/\$1" | python3 -m json.tool
}

claude_server_health() {
    curl -s "\${CLAUDE_DEV_SERVER}/health" | python3 -m json.tool
}

# Aliases
alias mini="ssh \${CLAUDE_MINI_SSH}"
alias mini-health="claude_server_health"

echo "🤖 Claude configured to use Mini Dev Server at \${CLAUDE_MINI_IP}"
EOF

# Add to shell config
if [ -f ~/.bashrc ]; then
    grep -q "claude_config" ~/.bashrc || echo -e "\\n# Claude Mini Server\\n[ -f ~/.claude_config ] && source ~/.claude_config" >> ~/.bashrc
fi

if [ -f ~/.zshrc ]; then
    grep -q "claude_config" ~/.zshrc || echo -e "\\n# Claude Mini Server\\n[ -f ~/.claude_config ] && source ~/.claude_config" >> ~/.zshrc
fi

# Create CLAUDE.md
curl -s http://${MINI_TAILSCALE_IP}/config/claude.md > ~/CLAUDE.md

# Download Python client
curl -s http://${MINI_TAILSCALE_IP}/config/claude_mini_client.py > ~/.claude_mini_client.py
chmod +x ~/.claude_mini_client.py

# Install Python requests if needed
python3 -m pip install requests --user 2>/dev/null || true

echo "✅ Setup complete! Restart your terminal or run: source ~/.claude_config"
echo "📍 Server: http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}"
echo "📚 Documentation: ~/CLAUDE.md"
\`);
});

// Windows PowerShell setup script
app.get('/setup/windows.ps1', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(\`# Mini Dev Server Setup Script for Windows
Write-Host "🚀 Setting up Mini Dev Server connection..." -ForegroundColor Green

# Set environment variables for current user
[System.Environment]::SetEnvironmentVariable("CLAUDE_DEV_SERVER", "http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}", "User")
[System.Environment]::SetEnvironmentVariable("CLAUDE_MINI_IP", "${MINI_TAILSCALE_IP}", "User")
[System.Environment]::SetEnvironmentVariable("CLAUDE_OLLAMA_HOST", "http://${MINI_TAILSCALE_IP}:11434", "User")
[System.Environment]::SetEnvironmentVariable("CLAUDE_REDIS_HOST", "${MINI_TAILSCALE_IP}", "User")

# Create PowerShell profile if it doesn't exist
if (!(Test-Path \$PROFILE)) {
    New-Item -Path \$PROFILE -Type File -Force
}

# Add helper functions to PowerShell profile
\$profileContent = @'

# Claude Mini Server Functions
function Claude-SubmitTask {
    param(\$TaskType, \$Content, \$Context = "")
    \$body = @{
        task_type = \$TaskType
        content = \$Content
        context = \$Context
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/api/dev-task" \`
        -Method Post -Body \$body -ContentType "application/json"
}

function Claude-CheckJob {
    param(\$JobId)
    Invoke-RestMethod -Uri "http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/api/job/\$JobId"
}

function Claude-ServerHealth {
    Invoke-RestMethod -Uri "http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/health"
}

function Mini-SSH {
    ssh ${MINI_TAILSCALE_IP}
}

Write-Host "🤖 Claude Mini Server available at ${MINI_TAILSCALE_IP}" -ForegroundColor Cyan
'@

# Append to profile if not already there
if (!(Select-String -Path \$PROFILE -Pattern "Claude Mini Server Functions" -Quiet)) {
    Add-Content -Path \$PROFILE -Value \$profileContent
}

# Download CLAUDE.md
Invoke-WebRequest -Uri "http://${MINI_TAILSCALE_IP}/config/claude.md" -OutFile "\$HOME\\CLAUDE.md"

# Download Python client
Invoke-WebRequest -Uri "http://${MINI_TAILSCALE_IP}/config/claude_mini_client.py" -OutFile "\$HOME\\.claude_mini_client.py"

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host "📍 Server: http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}" -ForegroundColor Yellow
Write-Host "📚 Documentation: \$HOME\\CLAUDE.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "Restart PowerShell to load the new configuration" -ForegroundColor Cyan
\`);
});

// Serve configuration files
app.get('/config/claude.md', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(\`# Claude Configuration - M4 Pro Mini Integration

## Overview
This system is configured with a remote M4 Pro Mini (64GB RAM) for heavy compute tasks. The Mini runs Ollama for LLM inference and a task queue server for distributed processing.

## Mini Dev Server Access
- **Tailscale IP**: ${MINI_TAILSCALE_IP}
- **LAN IP**: ${MINI_LAN_IP}
- **SSH Access**: \\\`ssh ${MINI_TAILSCALE_IP}\\\`
- **Task Queue Server**: http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}
- **Ollama API**: http://${MINI_TAILSCALE_IP}:11434

## Quick Test
\\\`\\\`\\\`bash
# Test server connection
curl http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/health

# Submit a task
curl -X POST http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/api/dev-task \\\\
  -H "Content-Type: application/json" \\\\
  -d '{"task_type":"code-analysis","content":"print('hello')"}'
\\\`\\\`\\\`

## Available Services

### 1. Development Task Queue Server
Submit heavy processing tasks to the Mini's queue:
- Endpoint: http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/api/dev-task
- Supported task types:
  - \\\`code-analysis\\\` - Analyze code quality
  - \\\`code-generation\\\` - Generate code from requirements
  - \\\`code-refactor\\\` - Refactor existing code
  - \\\`debugging\\\` - Debug and fix issues
  - \\\`documentation\\\` - Generate documentation
  - \\\`testing\\\` - Create test suites
  - \\\`architecture\\\` - System design
  - \\\`planning\\\` - Project planning

### 2. Ollama LLM Service
Direct LLM inference on Mini:
- API: http://${MINI_TAILSCALE_IP}:11434/api/generate
- Check models: http://${MINI_TAILSCALE_IP}:11434/api/tags

### 3. Redis Queue
- Host: ${MINI_TAILSCALE_IP}
- Port: 6379

## Environment Variables
- \\\`CLAUDE_DEV_SERVER\\\` - Task queue server URL
- \\\`CLAUDE_MINI_IP\\\` - Mini's Tailscale IP
- \\\`CLAUDE_OLLAMA_HOST\\\` - Ollama API URL
- \\\`CLAUDE_REDIS_HOST\\\` - Redis host

## Python Client Usage
\\\`\\\`\\\`python
from claude_mini_client import mini_client

# Analyze code
result = mini_client.analyze_code("def hello(): print('hello')")

# Generate code
code = mini_client.generate_code("Create a REST API")

# Direct LLM query
response = mini_client.query_ollama("Explain async/await")
\\\`\\\`\\\`
\`);
});

app.get('/config/claude_config', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.sendFile(path.join(__dirname, '.claude_config'));
});

app.get('/config/claude_mini_client.py', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.sendFile(path.join(__dirname, '.claude_mini_client.py'));
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(\`🌐 Setup Portal running on port \${port}\`);
    console.log(\`📍 Access at: http://${MINI_TAILSCALE_IP}\`);
    console.log(\`📍 Or locally: http://${MINI_LAN_IP}\`);
});