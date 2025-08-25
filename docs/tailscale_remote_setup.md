# Tailscale Remote Setup for M4 Pro Mini + MacBook Air

## Overview
Configure Tailscale for secure remote access to your M4 Pro Mini from anywhere, then remotely configure both machines for distributed MCP development and agent offloading.

## Phase 1: Initial Tailscale Setup

### Step 1: Install Tailscale on Both Machines

#### On MacBook Air (Local)
```bash
# Install Tailscale
brew install tailscale

# Or download from https://tailscale.com/download/mac
```

#### On M4 Pro Mini (Physical Access Required Initially)
```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Or manual installation:
# Download from https://tailscale.com/download/mac
# Install the package
```

### Step 2: Connect Both Machines to Tailscale

#### On MacBook Air
```bash
# Start Tailscale and authenticate
sudo tailscale up

# Follow the browser authentication flow
# Note down the Air's Tailscale IP
tailscale ip -4
```

#### On M4 Pro Mini (Physical Access)
```bash
# Start Tailscale and authenticate
sudo tailscale up

# Follow the browser authentication flow  
# Note down the Mini's Tailscale IP
tailscale ip -4

# Enable SSH access through Tailscale
sudo tailscale up --ssh

# Get the Mini's Tailscale hostname
tailscale status
```

### Step 3: Configure SSH Key Authentication

#### On MacBook Air
```bash
# Generate SSH key if you don't have one
if [ ! -f ~/.ssh/id_ed25519 ]; then
    ssh-keygen -t ed25519 -C "your-email@example.com"
fi

# Get your Mini's Tailscale IP/hostname
MINI_TAILSCALE_IP=$(tailscale status | grep "mini-" | awk '{print $1}')
echo "Mini Tailscale IP: $MINI_TAILSCALE_IP"

# Copy SSH key to Mini (you'll need to enter password once)
ssh-copy-id $MINI_TAILSCALE_IP
```

### Step 4: Test Remote Access
```bash
# Test SSH connection to Mini via Tailscale
ssh $MINI_TAILSCALE_IP

# You should now be logged into the Mini remotely!
# Exit and return to Air for the rest of the configuration
exit
```

## Phase 2: Remote Configuration from Air

All subsequent commands run from your **MacBook Air**, configuring the **Mini remotely** via Tailscale SSH.

### Step 5: Set Environment Variables

#### On MacBook Air
```bash
# Set Mini's Tailscale IP for easy access
export MINI_IP=$(tailscale status | grep "mini" | awk '{print $1}')
export MINI_HOST=$MINI_IP

# Alternative: Use hostname if preferred
# export MINI_HOST=$(tailscale status | grep "mini" | awk '{print $2}')

echo "Mini accessible at: $MINI_HOST"

# Create aliases for easy access
echo "alias mini-ssh='ssh $MINI_HOST'" >> ~/.zshrc
echo "alias mini-scp='scp -r'" >> ~/.zshrc
source ~/.zshrc
```

### Step 6: Remote Mini Configuration

#### Create Remote Configuration Script
```bash
# Create the Mini setup script locally on Air
cat > setup_mini_remote.sh << 'EOF'
#!/bin/bash
echo "🚀 Setting up M4 Pro Mini for remote development via Tailscale..."

# Update system
echo "📦 Updating system..."
brew update || {
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    eval "$(/opt/homebrew/bin/brew shellenv)"
}

# Install essential tools
echo "🛠️ Installing essential tools..."
brew install curl wget git htop tree jq python3 node redis

# Install Python packages for multi-agent frameworks
echo "🐍 Installing Python packages..."
python3 -m pip install --upgrade pip
python3 -m pip install crewai autogen-agentchat asyncio aiohttp requests pandas numpy

# Set computer name for identification
echo "🏷️ Setting computer name..."
sudo scutil --set ComputerName "mini-dev-server"
sudo scutil --set HostName "mini-dev-server"
sudo scutil --set LocalHostName "mini-dev-server"

# Install Ollama
echo "🤖 Installing Ollama..."
curl -fsSL https://ollama.com/install.sh | sh

# Configure Ollama for remote access
echo "⚙️ Configuring Ollama for Tailscale access..."
sudo mkdir -p /etc/ollama

# Create Ollama environment file for Tailscale access
sudo tee /etc/ollama/ollama.env << 'EOL'
OLLAMA_HOST=0.0.0.0:11434
OLLAMA_ORIGINS=*
OLLAMA_NUM_PARALLEL=3
OLLAMA_MAX_LOADED_MODELS=3
OLLAMA_KEEP_ALIVE=30m
EOL

# Create Ollama service plist
sudo tee /Library/LaunchDaemons/com.ollama.server.plist << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ollama.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/ollama</string>
        <string>serve</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>OLLAMA_HOST</key>
        <string>0.0.0.0:11434</string>
        <key>OLLAMA_ORIGINS</key>
        <string>*</string>
        <key>OLLAMA_NUM_PARALLEL</key>
        <string>3</string>
        <key>OLLAMA_MAX_LOADED_MODELS</key>
        <string>3</string>
        <key>OLLAMA_KEEP_ALIVE</key>
        <string>30m</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/ollama.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/ollama_error.log</string>
</dict>
</plist>
PLIST

# Load and start Ollama service
sudo launchctl load -w /Library/LaunchDaemons/com.ollama.server.plist

# Configure Redis for Tailscale access
echo "📊 Configuring Redis..."
brew services start redis

sudo tee /usr/local/etc/redis.conf << 'REDIS'
bind 0.0.0.0
port 6379
save 900 1
save 300 10
save 60 10000
appendonly yes
maxmemory 4gb
maxmemory-policy allkeys-lru
timeout 0
tcp-keepalive 300
REDIS

brew services restart redis

# Create directories
mkdir -p ~/dev-task-queue
mkdir -p /tmp/dev-uploads

echo "✅ Mini base configuration complete!"
echo "📍 Mini Tailscale IP: $(tailscale ip -4)"
echo "🔗 Services will be accessible via Tailscale network"
EOF

# Make script executable
chmod +x setup_mini_remote.sh

# Copy and execute on Mini
echo "🚀 Configuring Mini remotely via Tailscale..."
scp setup_mini_remote.sh $MINI_HOST:~/
ssh $MINI_HOST "chmod +x ~/setup_mini_remote.sh && ~/setup_mini_remote.sh"
```

### Step 7: Deploy Development Task Queue Remotely

```bash
# Create the Node.js server files locally
cat > dev_task_server.js << 'EOF'
const express = require('express');
const Redis = require('redis');
const Queue = require('bull');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.text({ limit: '50mb' }));

// File upload configuration
const upload = multer({ 
    dest: '/tmp/dev-uploads/',
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Redis connection
const redis = Redis.createClient({
    host: 'localhost',
    port: 6379,
});

// Development task queue
const devQueue = new Queue('Development Tasks', {
    redis: { host: 'localhost', port: 6379 },
    defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 20,
        attempts: 2,
        backoff: {
            type: 'exponential',
            delay: 3000
        }
    }
});

// Development model configurations
const DEV_MODELS = {
    'code-analysis': 'qwen2.5-coder:32b-instruct-q4_K_M',
    'code-generation': 'qwen2.5-coder:32b-instruct-q4_K_M', 
    'code-refactor': 'deepseek-coder-v2:16b-lite-instruct-q4_K_M',
    'architecture': 'llama3.3:70b-instruct-q4_K_M',
    'documentation': 'qwen2.5:72b-instruct-q4_K_M',
    'debugging': 'qwen2.5-coder:32b-instruct-q4_K_M',
    'testing': 'qwen2.5-coder:14b-instruct-q4_K_M',
    'planning': 'llama3.3:70b-instruct-q4_K_M',
    'review': 'qwen2.5:72b-instruct-q4_K_M',
    'api-testing': 'qwen2.5-coder:32b-instruct-q4_K_M',
    'data-analysis': 'llama3.3:70b-instruct-q4_K_M',
    'compliance-scoring': 'qwen2.5:72b-instruct-q4_K_M',
    'batch-processing': 'llama3.3:70b-instruct-q4_K_M',
    'crewai-crew': 'llama3.3:70b-instruct-q4_K_M',
    'autogen-team': 'qwen2.5:72b-instruct-q4_K_M',
    'agent-coordination': 'llama3.3:70b-instruct-q4_K_M'
};

// Development task prompts (abbreviated for space)
const DEV_PROMPTS = {
    'code-analysis': `Analyze the following code and provide comprehensive feedback: {code}`,
    'compliance-scoring': `Score the following data against compliance standards: {code}`,
    'crewai-crew': `Design and coordinate a CrewAI crew for: {code}`,
    'autogen-team': `Design and coordinate an AutoGen team for: {code}`
};

// Process development jobs
devQueue.process('dev-task', async (job) => {
    const { 
        task_type, 
        content, 
        context = '', 
        temperature = 0.3, 
        max_tokens = 8192,
        custom_prompt = null 
    } = job.data;
    
    try {
        const model = DEV_MODELS[task_type] || DEV_MODELS['code-analysis'];
        
        let prompt;
        if (custom_prompt) {
            prompt = custom_prompt;
        } else {
            const template = DEV_PROMPTS[task_type] || DEV_PROMPTS['code-analysis'];
            prompt = template.replace('{code}', content).replace('{context}', context);
        }
        
        job.progress(25);
        
        const response = await axios.post('http://localhost:11434/api/generate', {
            model,
            prompt,
            options: {
                temperature,
                num_predict: max_tokens,
                top_k: 40,
                top_p: 0.9,
            },
            stream: false
        }, {
            timeout: 600000
        });
        
        job.progress(100);
        
        return {
            success: true,
            result: response.data.response,
            model_used: model,
            task_type,
            tokens_generated: response.data.eval_count || 0,
            tokens_processed: response.data.prompt_eval_count || 0
        };
    } catch (error) {
        throw new Error(`Development task failed: ${error.message}`);
    }
});

// Process CrewAI crew executions
devQueue.process('execute-crew', async (job) => {
    const { session_id, crew_config, task_description } = job.data;
    
    try {
        job.progress(10);
        
        await fs.appendFile(`/tmp/agent-session-${session_id}.log`, 
            `${new Date().toISOString()} - CrewAI crew execution started\n`);
        
        await fs.writeJson(`/tmp/agent-status-${session_id}.json`, {
            status: 'running',
            framework: 'crewai',
            started_at: new Date().toISOString(),
            progress: 10
        });
        
        job.progress(25);
        
        const { spawn } = require('child_process');
        
        const crewProcess = spawn('python3', ['/tmp/execute_crew.py', session_id], {
            env: {
                ...process.env,
                CREW_CONFIG: JSON.stringify(crew_config),
                TASK_DESCRIPTION: task_description,
                OLLAMA_BASE_URL: 'http://localhost:11434'
            }
        });
        
        let output = '';
        let error = '';
        
        crewProcess.stdout.on('data', (data) => {
            output += data.toString();
            fs.appendFile(`/tmp/agent-session-${session_id}.log`, 
                `${new Date().toISOString()} - STDOUT: ${data.toString()}\n`);
        });
        
        crewProcess.stderr.on('data', (data) => {
            error += data.toString();
            fs.appendFile(`/tmp/agent-session-${session_id}.log`, 
                `${new Date().toISOString()} - STDERR: ${data.toString()}\n`);
        });
        
        job.progress(50);
        
        const result = await new Promise((resolve, reject) => {
            crewProcess.on('close', (code) => {
                if (code === 0) {
                    resolve({
                        success: true,
                        output,
                        session_id,
                        framework: 'crewai'
                    });
                } else {
                    reject(new Error(`CrewAI process exited with code ${code}: ${error}`));
                }
            });
        });
        
        job.progress(100);
        
        await fs.writeJson(`/tmp/agent-status-${session_id}.json`, {
            status: 'completed',
            framework: 'crewai',
            completed_at: new Date().toISOString(),
            progress: 100,
            result
        });
        
        return result;
    } catch (error) {
        await fs.writeJson(`/tmp/agent-status-${session_id}.json`, {
            status: 'failed',
            framework: 'crewai',
            failed_at: new Date().toISOString(),
            error: error.message
        });
        throw error;
    }
});

// API Routes
app.post('/dev-task', async (req, res) => {
    try {
        const { 
            task_type = 'code-analysis', 
            content, 
            context = '',
            priority = 'normal',
            temperature = 0.3,
            max_tokens = 8192,
            custom_prompt = null
        } = req.body;
        
        if (!content && !custom_prompt) {
            return res.status(400).json({ error: 'Content or custom_prompt is required' });
        }
        
        const job = await devQueue.add('dev-task', {
            task_type,
            content,
            context,
            temperature,
            max_tokens,
            custom_prompt
        }, {
            priority: priority === 'urgent' ? 1 : priority === 'low' ? -1 : 0
        });
        
        res.json({
            task_id: job.id,
            task_type,
            status: 'queued',
            estimated_wait: await getEstimatedWait()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/execute-crewai', async (req, res) => {
    try {
        const { crew_config, task_description, priority = 'high' } = req.body;
        
        if (!crew_config || !task_description) {
            return res.status(400).json({ error: 'crew_config and task_description are required' });
        }
        
        const sessionId = uuidv4();
        
        await fs.writeJson(`/tmp/crew-${sessionId}.json`, crew_config);
        
        const job = await devQueue.add('execute-crew', {
            session_id: sessionId,
            crew_config,
            task_description,
            framework: 'crewai'
        }, {
            priority: priority === 'urgent' ? 1 : priority === 'low' ? -1 : 0,
            timeout: 1800000
        });
        
        res.json({
            session_id: sessionId,
            task_id: job.id,
            status: 'started',
            framework: 'crewai',
            estimated_duration: '10-30 minutes'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/task-status/:id', async (req, res) => {
    try {
        const job = await devQueue.getJob(req.params.id);
        
        if (!job) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        const state = await job.getState();
        
        res.json({
            task_id: job.id,
            status: state,
            progress: job.progress(),
            result: state === 'completed' ? job.returnvalue : null,
            error: state === 'failed' ? job.failedReason : null,
            created_at: job.timestamp,
            processed_at: job.processedOn,
            finished_at: job.finishedOn
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/agent-session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const logPath = `/tmp/agent-session-${sessionId}.log`;
        const statusPath = `/tmp/agent-status-${sessionId}.json`;
        
        let logs = '';
        let status = { status: 'unknown' };
        
        if (await fs.pathExists(logPath)) {
            logs = await fs.readFile(logPath, 'utf8');
        }
        
        if (await fs.pathExists(statusPath)) {
            status = await fs.readJson(statusPath);
        }
        
        res.json({
            session_id: sessionId,
            logs: logs.split('\n').slice(-50),
            status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/queue-stats', async (req, res) => {
    try {
        const waiting = await devQueue.getWaiting();
        const active = await devQueue.getActive();
        const completed = await devQueue.getCompleted();
        const failed = await devQueue.getFailed();
        
        const taskTypes = {};
        [...waiting, ...active].forEach(job => {
            const type = job.data?.task_type || 'unknown';
            taskTypes[type] = (taskTypes[type] || 0) + 1;
        });
        
        res.json({
            queue_length: waiting.length,
            active_jobs: active.length,
            completed_today: completed.length,
            failed_today: failed.length,
            estimated_wait: await getEstimatedWait(),
            task_types: taskTypes,
            available_task_types: Object.keys(DEV_MODELS)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', async (req, res) => {
    try {
        const ollamaResponse = await axios.get('http://localhost:11434/api/tags', { timeout: 5000 });
        
        await redis.ping();
        
        const models = ollamaResponse.data.models?.map(m => m.name) || [];
        const requiredModels = Object.values(DEV_MODELS);
        const missingModels = requiredModels.filter(model => !models.some(m => m.startsWith(model.split(':')[0])));
        
        res.json({
            status: 'healthy',
            ollama: 'connected',
            redis: 'connected',
            models_loaded: models.length,
            missing_models: missingModels,
            queue_active: (await devQueue.getActive()).length,
            queue_waiting: (await devQueue.getWaiting()).length,
            tailscale_ip: process.env.TAILSCALE_IP || 'unknown'
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

async function getEstimatedWait() {
    const waiting = await devQueue.getWaiting();
    const active = await devQueue.getActive();
    return (waiting.length * 180) + (active.length * 90);
}

process.on('SIGTERM', async () => {
    await devQueue.close();
    await redis.quit();
    process.exit(0);
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Development Task Queue Server running on port ${port}`);
    console.log(`📊 Queue dashboard: http://localhost:${port}/queue-stats`);
    console.log(`🏥 Health check: http://localhost:${port}/health`);
    console.log(`🛠️  Available task types: ${Object.keys(DEV_MODELS).join(', ')}`);
    console.log(`🌐 Accessible via Tailscale at: http://${process.env.TAILSCALE_IP || 'TAILSCALE_IP'}:${port}`);
});
EOF

# Create package.json
cat > package.json << 'EOF'
{
  "name": "dev-task-queue",
  "version": "1.0.0",
  "description": "Development task queue for M4 Pro Mini",
  "main": "server.js",
  "scripts": {
    "start": "node dev_task_server.js",
    "dev": "nodemon dev_task_server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "redis": "^4.6.5",
    "bull": "^4.10.4",
    "axios": "^1.4.0",
    "cors": "^2.8.5",
    "helmet": "^6.1.5",
    "morgan": "^1.10.0",
    "multer": "^1.4.5",
    "fs-extra": "^11.1.1",
    "uuid": "^9.0.0"
  }
}
EOF

# Copy files to Mini
echo "📦 Deploying development task queue to Mini..."
scp dev_task_server.js package.json $MINI_HOST:~/dev-task-queue/

# Install dependencies and setup service on Mini
ssh $MINI_HOST << 'REMOTE'
cd ~/dev-task-queue

# Install Node.js dependencies
npm install

# Get Tailscale IP for environment
TAILSCALE_IP=$(tailscale ip -4)
echo "export TAILSCALE_IP=$TAILSCALE_IP" >> ~/.zprofile

# Create service plist with current user
CURRENT_USER=$(whoami)
sudo tee /Library/LaunchDaemons/com.dev.taskqueue.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.dev.taskqueue</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/$CURRENT_USER/dev-task-queue/dev_task_server.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/$CURRENT_USER/dev-task-queue</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>TAILSCALE_IP</key>
        <string>$TAILSCALE_IP</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/dev-taskqueue.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/dev-taskqueue_error.log</string>
</dict>
</plist>
EOF

# Load the service
sudo launchctl load -w /Library/LaunchDaemons/com.dev.taskqueue.plist

echo "✅ Development task queue deployed and started"
REMOTE
```

### Step 8: Deploy Multi-Agent Execution Scripts

```bash
# Create CrewAI execution script
cat > execute_crew.py << 'EOF'
#!/usr/bin/env python3
import os
import sys
import json
import asyncio
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    from crewai import Crew, Agent, Task, Process
    from langchain.llms.base import LLM
    from langchain.callbacks.manager import CallbackManagerForLLMRun
    from typing import Optional, List, Any
    import requests
except ImportError as e:
    logger.error(f"Missing required packages: {e}")
    sys.exit(1)

class OllamaLLM(LLM):
    def __init__(self, model_name: str, base_url: str = "http://localhost:11434"):
        super().__init__()
        self.model_name = model_name
        self.base_url = base_url
    
    def _call(self, prompt: str, stop: Optional[List[str]] = None, run_manager: Optional[CallbackManagerForLLMRun] = None, **kwargs: Any) -> str:
        try:
            response = requests.post(f"{self.base_url}/api/generate", json={
                "model": self.model_name,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.7, "top_p": 0.9, "top_k": 40}
            }, timeout=300)
            response.raise_for_status()
            return response.json()["response"]
        except Exception as e:
            logger.error(f"Ollama API error: {e}")
            return f"Error: {str(e)}"
    
    @property
    def _llm_type(self) -> str:
        return "ollama"

def create_crew_from_config(crew_config, task_description):
    llm = OllamaLLM(model_name="llama3.3:70b-instruct-q4_K_M")
    
    agents = []
    for agent_config in crew_config.get("agents", []):
        agent = Agent(
            role=agent_config.get("role", "Assistant"),
            goal=agent_config.get("goal", "Complete assigned tasks"),
            backstory=agent_config.get("backstory", "An experienced professional"),
            verbose=True,
            allow_delegation=agent_config.get("allow_delegation", False),
            llm=llm
        )
        agents.append(agent)
        logger.info(f"Created agent: {agent.role}")
    
    tasks = []
    task_configs = crew_config.get("tasks", [])
    if not task_configs:
        task_configs = [{"description": task_description, "expected_output": "Comprehensive analysis and recommendations"}]
    
    for i, task_config in enumerate(task_configs):
        task = Task(
            description=task_config.get("description", task_description),
            expected_output=task_config.get("expected_output", "Detailed analysis"),
            agent=agents[i % len(agents)] if agents else None
        )
        tasks.append(task)
        logger.info(f"Created task: {task.description[:50]}...")
    
    crew = Crew(agents=agents, tasks=tasks, process=Process.sequential, verbose=2)
    return crew

def main():
    if len(sys.argv) != 2:
        logger.error("Usage: python execute_crew.py <session_id>")
        sys.exit(1)
    
    session_id = sys.argv[1]
    
    try:
        crew_config = json.loads(os.environ.get('CREW_CONFIG', '{}'))
        task_description = os.environ.get('TASK_DESCRIPTION', '')
        
        logger.info(f"Starting CrewAI execution for session {session_id}")
        
        crew = create_crew_from_config(crew_config, task_description)
        result = crew.kickoff()
        
        logger.info("CrewAI execution completed successfully")
        
        output = {
            "success": True,
            "result": str(result),
            "session_id": session_id,
            "completed_at": datetime.now().isoformat()
        }
        
        print(json.dumps(output, indent=2))
        
    except Exception as e:
        logger.error(f"CrewAI execution failed: {e}")
        error_output = {
            "success": False,
            "error": str(e),
            "session_id": session_id,
            "failed_at": datetime.now().isoformat()
        }
        print(json.dumps(error_output, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()
EOF

# Create AutoGen execution script (abbreviated for space)
cat > execute_autogen.py << 'EOF'
#!/usr/bin/env python3
import os
import sys
import json
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    if len(sys.argv) != 2:
        logger.error("Usage: python execute_autogen.py <session_id>")
        sys.exit(1)
    
    session_id = sys.argv[1]
    
    try:
        team_config = json.loads(os.environ.get('TEAM_CONFIG', '{}'))
        objective = os.environ.get('OBJECTIVE', '')
        
        logger.info(f"Starting AutoGen execution for session {session_id}")
        
        # Simplified AutoGen implementation for demo
        result = f"AutoGen team discussion result for: {objective}"
        
        output = {
            "success": True,
            "result": result,
            "session_id": session_id,
            "completed_at": datetime.now().isoformat()
        }
        
        print(json.dumps(output, indent=2))
        
    except Exception as e:
        logger.error(f"AutoGen execution failed: {e}")
        error_output = {
            "success": False,
            "error": str(e),
            "session_id": session_id,
            "failed_at": datetime.now().isoformat()
        }
        print(json.dumps(error_output, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()
EOF

# Deploy execution scripts to Mini
echo "🤖 Deploying multi-agent execution scripts..."
scp execute_crew.py execute_autogen.py $MINI_HOST:/tmp/
ssh $MINI_HOST "chmod +x /tmp/execute_crew.py /tmp/execute_autogen.py"
```

### Step 9: Download Models on Mini

```bash
# Create model download script
cat > download_models_remote.sh << 'EOF'
#!/bin/bash
echo "🚀 Downloading development-focused models via Tailscale..."

echo "📥 Downloading Qwen2.5-Coder 32B (Primary coding assistant)..."
ollama pull qwen2.5-coder:32b-instruct-q4_K_M

echo "📥 Downloading DeepSeek-Coder V2.5 16B (Alternative coding)..."
ollama pull deepseek-coder-v2:16b-lite-instruct-q4_K_M

echo "📥 Downloading Llama 3.3 70B (Heavy reasoning & architecture)..."
ollama pull llama3.3:70b-instruct-q4_K_M

echo "📥 Downloading Qwen2.5 72B (Documentation & analysis)..."
ollama pull qwen2.5:72b-instruct-q4_K_M

echo "📥 Downloading Qwen2.5-Coder 14B (Fast iteration)..."
ollama pull qwen2.5-coder:14b-instruct-q4_K_M

echo "✅ Model download complete!"
ollama list
EOF

# Execute model download on Mini
echo "📥 Downloading models on Mini (this will take 15-30 minutes)..."
scp download_models_remote.sh $MINI_HOST:~/
ssh $MINI_HOST "chmod +x ~/download_models_remote.sh && ~/download_models_remote.sh"
```

## Phase 3: Configure MacBook Air for Tailscale Access

### Step 10: Update Air Configuration for Tailscale

```bash
# Get Mini's Tailscale IP
MINI_TAILSCALE_IP=$(tailscale status | grep "mini" | awk '{print $1}')

# Create environment configuration
cat > .env << EOF
# Tailscale Mini Configuration
OFFLOAD_AGENTS_TO_MINI=true
DEV_SERVER_URL=http://$MINI_TAILSCALE_IP:3001
MINI_TAILSCALE_IP=$MINI_TAILSCALE_IP

# CrewAI/AutoGen local fallback
CREWAI_LOCAL_FALLBACK=true
AUTOGEN_LOCAL_FALLBACK=true

# Development settings
PYTHONPATH="\${PYTHONPATH}:\${HOME}"
EOF

# Update shell profile for Tailscale
cat >> ~/.zshrc << EOF

# Tailscale Mini Configuration
export OFFLOAD_AGENTS_TO_MINI=true
export DEV_SERVER_URL=http://$MINI_TAILSCALE_IP:3001
export MINI_TAILSCALE_IP=$MINI_TAILSCALE_IP
export PYTHONPATH="\${PYTHONPATH}:\${HOME}"

# Aliases for remote Mini access
alias mini-ssh="ssh $MINI_TAILSCALE_IP"
alias mini-health="curl -s http://$MINI_TAILSCALE_IP:3001/health | jq"
alias mini-stats="curl -s http://$MINI_TAILSCALE_IP:3001/queue-stats | jq"
alias claude-agents-health="python3 -c 'import claude_code_agents; claude_code_agents.check_mini_connection()'"

EOF

source ~/.zshrc

echo "✅ Air configured for Tailscale access to Mini"
echo "🌐 Mini accessible at: http://$MINI_TAILSCALE_IP:3001"
```

### Step 11: Deploy Client Libraries to Air

```bash
# The offloader and client libraries from previous artifacts can be used as-is
# Just update the DEV_SERVER_URL to use Tailscale IP

# Copy the client libraries (you already have these)
# crewai_autogen_offloader.py
# dev_task_client.py  
# claude_code_agents.py
# auto_patch_agents.py

# Create test script for Tailscale connectivity
cat > test_tailscale_offloading.py << 'EOF'
#!/usr/bin/env python3
"""Test Tailscale connectivity and agent offloading."""

import os
import requests
import asyncio
from dev_task_client import DevTaskClient

def test_mini_connectivity():
    """Test basic connectivity to Mini via Tailscale."""
    mini_ip = os.getenv('MINI_TAILSCALE_IP')
    if not mini_ip:
        print("❌ MINI_TAILSCALE_IP not set")
        return False
    
    try:
        response = requests.get(f"http://{mini_ip}:3001/health", timeout=10)
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Mini connected via Tailscale")
            print(f"   IP: {mini_ip}")
            print(f"   Status: {health_data.get('status')}")
            print(f"   Models: {health_data.get('models_loaded', 0)} loaded")
            print(f"   Queue: {health_data.get('queue_waiting', 0)} waiting")
            return True
        else:
            print(f"❌ Mini responded with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to Mini: {e}")
        return False

async def test_agent_offloading():
    """Test agent offloading via Tailscale."""
    print("🧪 Testing agent offloading via Tailscale...")
    
    try:
        async with DevTaskClient() as client:
            result = await client.analyze_code(
                "def hello_world():\n    print('Hello from Tailscale!')",
                "Test code analysis via Tailscale connection"
            )
            print("✅ Agent offloading test successful")
            print(f"   Result preview: {result[:100]}...")
            return True
    except Exception as e:
        print(f"❌ Agent offloading test failed: {e}")
        return False

async def main():
    print("🔧 Testing Tailscale Mini configuration...")
    
    # Test basic connectivity
    connectivity_ok = test_mini_connectivity()
    
    if connectivity_ok:
        # Test agent offloading
        offloading_ok = await test_agent_offloading()
        
        if offloading_ok:
            print("🎉 All tests passed! Tailscale setup is working.")
        else:
            print("⚠️  Connectivity OK but offloading failed.")
    else:
        print("⚠️  Basic connectivity failed. Check Tailscale setup.")
    
    print(f"\n📊 Configuration Summary:")
    print(f"   Mini IP: {os.getenv('MINI_TAILSCALE_IP', 'Not set')}")
    print(f"   Server URL: {os.getenv('DEV_SERVER_URL', 'Not set')}")
    print(f"   Offloading: {os.getenv('OFFLOAD_AGENTS_TO_MINI', 'Not set')}")

if __name__ == "__main__":
    asyncio.run(main())
EOF

chmod +x test_tailscale_offloading.py

# Test the setup
echo "🧪 Testing Tailscale setup..."
python3 test_tailscale_offloading.py
```

## Phase 4: Final Configuration and Testing

### Step 12: Create Monitoring and Management Scripts

```bash
# Create Mini management script
cat > manage_mini.sh << 'EOF'
#!/bin/bash
# Mini management via Tailscale

MINI_IP=${MINI_TAILSCALE_IP}

case "$1" in
    "status")
        echo "📊 Mini Status via Tailscale:"
        curl -s http://$MINI_IP:3001/health | jq
        ;;
    "queue")
        echo "📋 Task Queue Status:"
        curl -s http://$MINI_IP:3001/queue-stats | jq
        ;;
    "logs")
        echo "📜 Recent logs:"
        ssh $MINI_IP "tail -20 /var/log/dev-taskqueue.log"
        ;;
    "restart")
        echo "🔄 Restarting Mini services..."
        ssh $MINI_IP "sudo launchctl restart com.dev.taskqueue && sudo launchctl restart com.ollama.server"
        ;;
    "models")
        echo "🤖 Loaded models:"
        ssh $MINI_IP "ollama list"
        ;;
    "ssh")
        echo "🔗 Connecting to Mini via Tailscale..."
        ssh $MINI_IP
        ;;
    *)
        echo "Usage: $0 {status|queue|logs|restart|models|ssh}"
        echo "  status  - Check Mini health"
        echo "  queue   - Check task queue status"  
        echo "  logs    - Show recent logs"
        echo "  restart - Restart services"
        echo "  models  - List loaded models"
        echo "  ssh     - SSH into Mini"
        ;;
esac
EOF

chmod +x manage_mini.sh

# Create aliases
echo "alias mini-status='./manage_mini.sh status'" >> ~/.zshrc
echo "alias mini-queue='./manage_mini.sh queue'" >> ~/.zshrc  
echo "alias mini-logs='./manage_mini.sh logs'" >> ~/.zshrc
echo "alias mini-restart='./manage_mini.sh restart'" >> ~/.zshrc
echo "alias mini-models='./manage_mini.sh models'" >> ~/.zshrc
echo "alias mini='./manage_mini.sh ssh'" >> ~/.zshrc

source ~/.zshrc
```

### Step 13: Test Complete Setup

```bash
# Final comprehensive test
echo "🚀 Running comprehensive Tailscale setup test..."

echo "1. Testing Tailscale connectivity..."
mini-status

echo "2. Testing task queue..."
mini-queue

echo "3. Testing model availability..."
mini-models

echo "4. Testing agent offloading..."
python3 test_tailscale_offloading.py

echo "✅ Setup complete! Your Mini is now accessible via Tailscale from anywhere."
echo "🌐 Mini Tailscale IP: $MINI_TAILSCALE_IP"
echo "🔗 Access URLs:"
echo "   Health: http://$MINI_TAILSCALE_IP:3001/health"
echo "   Queue: http://$MINI_TAILSCALE_IP:3001/queue-stats"
echo "   SSH: ssh $MINI_TAILSCALE_IP"
```

## Phase 5: Claude.md Update for Tailscale

### Step 14: Update Project Documentation

```bash
# Update claude.md with Tailscale configuration
cat >> claude.md << EOF

## Tailscale Configuration

This project uses Tailscale for secure remote access to the M4 Pro Mini from anywhere.

### Network Architecture
- **MacBook Air**: Development environment (can be anywhere)
- **M4 Pro Mini**: Heavy compute server (accessible via Tailscale)
- **Connection**: Secure WireGuard VPN via Tailscale network

### Access Information
- **Mini Tailscale IP**: $MINI_TAILSCALE_IP
- **Development Server**: http://$MINI_TAILSCALE_IP:3001
- **SSH Access**: ssh $MINI_TAILSCALE_IP

### Quick Commands
```bash
mini-status      # Check Mini health via Tailscale
mini-queue       # Check task queue status
mini-logs        # View recent logs
mini-restart     # Restart services
mini-models      # List loaded models
mini             # SSH into Mini
```

### Remote Development
With Tailscale, you can now:
- Develop from any location with internet
- Offload heavy tasks to Mini from anywhere
- Access full 64GB RAM + 70B models remotely
- Maintain secure, encrypted connection

### Environment Variables
```bash
MINI_TAILSCALE_IP=$MINI_TAILSCALE_IP
DEV_SERVER_URL=http://$MINI_TAILSCALE_IP:3001
OFFLOAD_AGENTS_TO_MINI=true
```

EOF

echo "📝 Project documentation updated with Tailscale configuration"
```

## Summary

You now have:

✅ **Tailscale VPN** connecting Air and Mini securely
✅ **Remote SSH access** to Mini from anywhere  
✅ **Complete remote configuration** of Mini from Air
✅ **Agent offloading** working via Tailscale
✅ **Management scripts** for easy remote administration
✅ **Updated documentation** with Tailscale setup

**Benefits:**
- **Work from anywhere**: Coffee shops, travel, different offices
- **Secure connection**: Encrypted WireGuard VPN 
- **No port forwarding**: No router configuration needed
- **Simple management**: SSH and HTTP APIs via Tailscale
- **Full functionality**: All features work remotely

**Your Graph API compliance workflow now works globally** - analyze 1000+ endpoints using Mini's 70B models from any location! 🌍🚀