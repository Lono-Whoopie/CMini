const express = require('express');
const path = require('path');
const app = express();
const port = 8080;

const MINI_TAILSCALE_IP = '100.114.129.95';
const MINI_LAN_IP = '10.0.10.244';
const TASK_QUEUE_PORT = '3001';

const setupHTML = `<!DOCTYPE html>
<html>
<head>
    <title>Mini Dev Server Setup</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        h1 { color: #333; }
        .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        pre { background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        code { background: #e5e5e5; padding: 2px 5px; border-radius: 3px; font-family: 'Courier New', monospace; }
        .status { display: inline-block; padding: 5px 10px; background: #10b981; color: white; border-radius: 5px; margin: 5px; }
        .copy-btn { background: #3b82f6; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin: 10px 0; }
        .copy-btn:hover { background: #2563eb; }
    </style>
</head>
<body>
    <h1>🚀 Mini Dev Server - Setup Instructions</h1>
    
    <div class="card">
        <h2>Server Status</h2>
        <span class="status">✅ Online</span>
        <span class="status" style="background:#6366f1">Tailscale: ${MINI_TAILSCALE_IP}</span>
        <span class="status" style="background:#8b5cf6">LAN: ${MINI_LAN_IP}</span>
        <span class="status" style="background:#ec4899">Port: ${TASK_QUEUE_PORT}</span>
    </div>

    <div class="card">
        <h2>📋 Instructions for Claude</h2>
        <p>Copy and paste these instructions into Claude to configure any computer:</p>
        
        <button class="copy-btn" onclick="copyInstructions()">Copy Instructions</button>
        
        <pre id="instructions">Please configure this computer to use the Mini Dev Server for AI tasks.
Note: On Windows, configure WSL (Windows Subsystem for Linux) not native Windows.

Server Details:
- Tailscale IP: ${MINI_TAILSCALE_IP}
- Task Queue API: http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}
- Ollama API: http://${MINI_TAILSCALE_IP}:11434
- Redis: ${MINI_TAILSCALE_IP}:6379

Please do the following:
1. Create a ~/.claude_config file with environment variables for the Mini server
2. Add the config to shell profile (.zshrc or .bashrc)
3. Create a ~/CLAUDE.md file documenting:
   - AUTOMATIC UPDATE CHECK at session start (curl http://${MINI_TAILSCALE_IP}:8080/version)
   - Mini server capabilities and endpoints
   - WHEN to use the Mini (tasks >16GB RAM, 32B+ models, batch processing)
   - HOW to offload tasks (submit to task queue, use Ollama API)
   - Available models and their best use cases
4. Create a Python client at ~/.claude_mini_client.py for interacting with the server
5. Set up helper functions and aliases for easy access
6. Add to CLAUDE.md: "Check portal for updates: curl http://${MINI_TAILSCALE_IP}:8080/version"

CRITICAL: The CLAUDE.md file MUST explain that the Mini solves Claude Code's 2-minute timeout:

The Mini server is designed to handle tasks that exceed Claude Code's limitations:
- **2-minute timeout**: Any operation lasting >90 seconds should go to Mini
- **Context depletion**: Tasks with many file reads should be offloaded
- **Multi-agent requests**: CrewAI/AutoGen ALWAYS go to Mini
- **Long command sequences**: Multi-step builds/tests/deployments go to Mini

ALWAYS use Mini when user:
- Asks for CrewAI crew or AutoGen team (mandatory)
- Requests tasks that "might take a while"
- Wants processing of 5+ files
- Needs builds, tests, or deployments
- Requires 32B+ model inference

The Mini has:
- 64GB RAM (can run 70B models)
- No timeout limitations (tasks can run for hours)
- Queue system for async processing
- Ability to preserve Claude's context by offloading

Make SURE future Claude instances understand:
1. Claude Code times out after 2 minutes
2. Context depletes with every file read
3. Mini handles what Claude Code cannot
4. CrewAI/AutoGen ALWAYS go to Mini</pre>
    </div>

    <div class="card">
        <h2>🔧 Test Commands - Copy & Run These</h2>
        <p>Test each endpoint to verify connectivity:</p>
        
        <h3>1. Test Health (Should return JSON with status)</h3>
        <pre>curl http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/health</pre>
        
        <h3>2. Check Queue Stats</h3>
        <pre>curl http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/api/stats</pre>
        
        <h3>3. List Available Models</h3>
        <pre>curl http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/api/models</pre>
        
        <h3>4. Submit a Simple Code Analysis Task</h3>
        <pre>curl -X POST http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/api/dev-task \\
  -H "Content-Type: application/json" \\
  -d '{"task_type":"code-analysis","content":"def hello():\\n    print(\"hello world\")"}'</pre>
        
        <h3>5. Check Job Status (replace JOB_ID with actual ID from step 4)</h3>
        <pre>curl http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/api/job/JOB_ID</pre>
        
        <h3>6. Test Ollama Directly</h3>
        <pre>curl http://${MINI_TAILSCALE_IP}:11434/api/version</pre>
        
        <h3>7. List Ollama Models</h3>
        <pre>curl http://${MINI_TAILSCALE_IP}:11434/api/tags</pre>
        
        <h3>8. Quick Ollama Generation Test</h3>
        <pre>curl -X POST http://${MINI_TAILSCALE_IP}:11434/api/generate \\
  -H "Content-Type: application/json" \\
  -d '{"model":"llama3.2:3b","prompt":"Say hello","stream":false}'</pre>
    </div>
    
    <div class="card">
        <h2>🎯 CrewAI & AutoGen - Long-Running Multi-Agent Tasks</h2>
        <p><strong>The Mini is specifically designed for multi-agent orchestration that runs for extended periods!</strong></p>
        
        <h3>When to Use CrewAI/AutoGen on Mini:</h3>
        <ul>
            <li>Any time user mentions "crew" or "team"</li>
            <li>Complex multi-step projects</li>
            <li>Tasks requiring multiple specialized agents</li>
            <li>Workflows that need days to complete</li>
            <li>Iterative development with agent collaboration</li>
        </ul>
        
        <h3>Python Example - Submit CrewAI Crew:</h3>
        <pre>import requests

# Submit a long-running crew task
crew_task = {
    "task_description": "Build complete microservices architecture",
    "context": "E-commerce platform with 10 services",
    "process_type": "hierarchical"
}

response = requests.post(
    'http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/api/execute-crew',
    json=crew_task
)

job_id = response.json()['job_id']
print(f"Crew started with job ID: {job_id}")
print("This crew can run for days - check status periodically")

# Check status later (even days later!)
status = requests.get(f'http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/api/job/{job_id}')
print(f"Crew status: {status.json()['state']}")</pre>
        
        <h3>Key Features:</h3>
        <ul>
            <li>✅ NO TIMEOUT - Crews/teams run until completion</li>
            <li>✅ Persistent - Jobs survive server restarts</li>
            <li>✅ 64GB RAM - Handle complex agent interactions</li>
            <li>✅ Queue-based - Submit and forget, check later</li>
        </ul>
    </div>
    
    <div class="card">
        <h2>🐍 Python Examples</h2>
        <p>Create a test script to verify all endpoints:</p>
        <pre>import requests
import json

# Test server health
health = requests.get('http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/health')
print("Health:", health.json())

# Get queue stats
stats = requests.get('http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/api/stats')
print("Stats:", stats.json())

# List models
models = requests.get('http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/api/models')
print("Models available:", len(models.json().get('installed', [])))

# Submit a task
task = requests.post('http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/api/dev-task',
    json={"task_type": "code-analysis", "content": "print('test')"})
print("Task submitted:", task.json())

# Check job status (if task was successful)
if task.status_code == 200:
    job_id = task.json().get('job_id')
    if job_id:
        job = requests.get(f'http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/api/job/{job_id}')
        print("Job status:", job.json().get('state'))</pre>
    </div>

    <div class="card">
        <h2>⚠️ Prerequisites & Troubleshooting</h2>
        <p><strong>Tailscale Required:</strong> Make sure Tailscale is installed and connected to the same network.</p>
        <p>Install from: <a href="https://tailscale.com/download">https://tailscale.com/download</a></p>
        
        <h3>Troubleshooting Connection Issues</h3>
        <ul>
            <li><strong>Can reach /health but not other endpoints?</strong>
                <ul>
                    <li>Check if the task queue server is running: <code>curl http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/health</code></li>
                    <li>Verify Redis is running on Mini: <code>redis-cli -h ${MINI_TAILSCALE_IP} ping</code></li>
                    <li>Check Ollama is accessible: <code>curl http://${MINI_TAILSCALE_IP}:11434/api/version</code></li>
                </ul>
            </li>
            <li><strong>Connection refused?</strong>
                <ul>
                    <li>Verify Tailscale is connected: <code>tailscale status</code></li>
                    <li>Ping the Mini: <code>tailscale ping ${MINI_TAILSCALE_IP}</code></li>
                    <li>Try LAN IP if on same network: <code>curl http://${MINI_LAN_IP}:${TASK_QUEUE_PORT}/health</code></li>
                </ul>
            </li>
            <li><strong>Task submission fails?</strong>
                <ul>
                    <li>Check if models are installed: <code>curl http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/api/models</code></li>
                    <li>Verify JSON syntax in your request</li>
                    <li>Check server logs on Mini: <code>ssh ${MINI_TAILSCALE_IP} 'tail -20 ~/dev-task-queue/server.log'</code></li>
                </ul>
            </li>
        </ul>
    </div>

    <div class="card">
        <h2>📚 API Endpoints</h2>
        <ul>
            <li><code>GET /health</code> - Server health check</li>
            <li><code>POST /api/dev-task</code> - Submit development task</li>
            <li><code>GET /api/job/:id</code> - Check job status</li>
            <li><code>GET /api/stats</code> - Queue statistics</li>
            <li><code>GET /api/models</code> - List available models</li>
            <li><code>POST /api/process-file</code> - Process uploaded file</li>
            <li><code>POST /api/execute-crew</code> - Execute CrewAI crew (NO TIMEOUT)</li>
            <li><code>POST /api/execute-autogen</code> - Execute AutoGen team (NO TIMEOUT)</li>
        </ul>
        
        <h3>🚀 CrewAI Crew Execution</h3>
        <pre>curl -X POST http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/api/execute-crew \\
  -H "Content-Type: application/json" \\
  -d '{
    "task_description": "Analyze codebase and suggest improvements",
    "context": "Focus on performance and security",
    "process_type": "sequential"
  }'</pre>
        
        <h3>🤖 AutoGen Team Execution</h3>
        <pre>curl -X POST http://${MINI_TAILSCALE_IP}:${TASK_QUEUE_PORT}/api/execute-autogen \\
  -H "Content-Type: application/json" \\
  -d '{
    "task_description": "Build a chatbot system",
    "initial_message": "Design a customer service bot",
    "max_rounds": 50,
    "context": "E-commerce platform support"
  }'</pre>
        
        <p><strong>⚡ NO TIMEOUT LIMITS:</strong> CrewAI and AutoGen tasks can run for days or weeks!</p>
    </div>

    <script>
        function copyInstructions() {
            const text = document.getElementById('instructions').textContent;
            navigator.clipboard.writeText(text).then(() => {
                alert('Instructions copied to clipboard!');
            });
        }
    </script>
</body>
</html>`;

app.get('/', (req, res) => {
    res.send(setupHTML);
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', server: 'Mini Dev Server Setup Portal' });
});

app.get('/version', (req, res) => {
    res.json({ 
        version: '2.1.0',
        updated: '2025-08-25',
        features: [
            'CrewAI/AutoGen support with NO TIMEOUTS',
            'M4 Pro optimization for Metal acceleration',
            'Persistent job queue for days-long tasks',
            '64GB RAM for multiple 70B models',
            'Automatic update checking',
            'NEW: Job monitoring dashboard with system stats'
        ],
        check_for_updates: 'curl http://100.114.129.95:8080/version'
    });
});

// Serve job monitoring page
app.get('/jobs', (req, res) => {
    res.sendFile(path.join(__dirname, 'job-monitor.html'));
});

// Diagnostic endpoint to test Ollama from portal
app.get('/test-ollama', async (req, res) => {
    const tests = {};
    
    try {
        // Test Ollama version
        const versionRes = await fetch(`http://localhost:11434/api/version`);
        tests.version = await versionRes.json();
    } catch (e) {
        tests.version = { error: e.message };
    }
    
    try {
        // Test Ollama tags
        const tagsRes = await fetch(`http://localhost:11434/api/tags`);
        const tags = await tagsRes.json();
        tests.tags = { models_count: tags.models ? tags.models.length : 0 };
    } catch (e) {
        tests.tags = { error: e.message };
    }
    
    res.json({
        ollama_tests: tests,
        access_urls: {
            tailscale: `http://${MINI_TAILSCALE_IP}:11434`,
            lan: `http://${MINI_LAN_IP}:11434`,
            local: 'http://localhost:11434'
        }
    });
});

app.listen(port, '0.0.0.0', () => {
    console.log('Setup Portal running on port ' + port);
    console.log('Access at: http://' + MINI_TAILSCALE_IP + ':' + port);
    console.log('Or locally: http://' + MINI_LAN_IP + ':' + port);
});