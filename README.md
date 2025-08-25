# CMini - Claude Code Mini Server Architecture

A distributed AI task processing system designed to overcome Claude Code's 2-minute timeout limitation by offloading long-running tasks to a dedicated M4 Pro Mini server.

## Overview

CMini creates a client-server architecture that allows Claude Code instances to submit tasks that would exceed their operational limits to a powerful remote server. The system supports:

- **Unlimited task duration** - Tasks can run for days or weeks
- **Multi-agent orchestration** - Native CrewAI and AutoGen support
- **Heavy model inference** - 32B+ parameter models with 64GB unified memory
- **Persistent job queue** - Tasks survive restarts and network interruptions
- **Automatic load distribution** - Offload context-heavy operations

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Client (MacBook Air)                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │            Claude Code Instance                  │    │
│  │  - 2-minute timeout per operation               │    │
│  │  - Limited context window                       │    │
│  │  - Uses claude_mini_client.py                   │    │
│  └────────────────┬────────────────────────────────┘    │
│                   │                                      │
│                   ▼                                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │          Python Client Library                   │    │
│  │  ~/.claude_mini_client.py                       │    │
│  │  - Task submission                              │    │
│  │  - Job monitoring                               │    │
│  │  - CrewAI/AutoGen methods                       │    │
│  └────────────────┬────────────────────────────────┘    │
└───────────────────┼──────────────────────────────────────┘
                    │
                    │ Tailscale VPN
                    │ (100.114.129.95)
                    ▼
┌─────────────────────────────────────────────────────────┐
│                Server (M4 Pro Mini - 64GB)              │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │          Task Queue Server (Port 3001)          │    │
│  │  - Express.js + Bull Queue                      │    │
│  │  - No timeout limits                            │    │
│  │  - CrewAI/AutoGen endpoints                     │    │
│  └──────────┬──────────────────────────────────────┘    │
│             │                                            │
│      ┌──────┴──────┬───────────────┐                    │
│      ▼             ▼               ▼                    │
│  ┌────────┐  ┌──────────┐  ┌─────────────┐            │
│  │ Redis  │  │  Ollama  │  │Setup Portal │            │
│  │  6379  │  │  11434   │  │    8080     │            │
│  └────────┘  └──────────┘  └─────────────┘            │
│                                                          │
│  Models:                                                 │
│  - qwen2.5-coder:32b-instruct-q4_K_M (19.8GB)          │
│  - qwen2.5-coder:14b-instruct-q4_K_M (9GB)             │
│  - llama3.2:3b (2GB)                                    │
└─────────────────────────────────────────────────────────┘
```

## Key Features

### 1. No Timeout Architecture
- Tasks can run indefinitely
- Perfect for CrewAI crews and AutoGen teams
- Supports multi-day processing jobs

### 2. M4 Pro Optimization
- Metal acceleration for neural processing
- 14 CPU cores fully utilized
- 64GB unified memory for large models
- Optimized for Apple Silicon

### 3. Intelligent Task Routing
- Automatic detection of long-running tasks
- Context preservation by offloading heavy operations
- Batch processing capabilities

### 4. Multi-Agent Support
- Native CrewAI crew execution
- AutoGen team orchestration
- Unlimited conversation rounds
- Hierarchical and sequential processing

## When to Use CMini

### ALWAYS use CMini for:
1. **CrewAI or AutoGen requests** - Mandatory, no exceptions
2. **Tasks exceeding 90 seconds** - Build, test, deploy operations
3. **Processing 5+ files** - Batch operations
4. **32B+ model inference** - Heavy computation
5. **Context-heavy operations** - Multiple file reads/writes

### Use LOCAL Claude Code for:
- Simple single-file edits
- Quick searches and greps
- User interaction
- Tasks under 30 seconds

## Installation

### Server Setup (M4 Pro Mini)

1. Install prerequisites:
```bash
# Install Node.js and Redis
brew install node redis

# Install Ollama
curl -L https://ollama.ai/install.sh | sh

# Install Tailscale
# Download from App Store or https://tailscale.com
```

2. Deploy server files:
```bash
# Copy server files to Mini
scp -r server/* mini:~/cmini-server/
scp -r scripts/* mini:~/cmini-scripts/

# SSH to Mini
ssh mini

# Install dependencies
cd ~/cmini-server
npm install express bull redis multer

# Start services
~/cmini-scripts/start-services.sh
```

3. Configure Ollama optimization:
```bash
~/cmini-scripts/optimize-ollama.sh
```

### Client Setup (Any Computer)

1. Visit setup portal:
```
http://100.114.129.95:8080
```

2. Copy instructions and paste into Claude Code

3. Or manually install:
```bash
# Copy client files
cp client/claude_mini_client.py ~/.claude_mini_client.py
cp client/claude_config ~/.claude_config
cp client/check_updates.sh ~/.claude_check_updates.sh

# Source configuration
echo "source ~/.claude_config" >> ~/.zshrc
source ~/.claude_config

# Test connection
python3 ~/.claude_mini_client.py
```

## Usage Examples

### Submit CrewAI Crew
```python
from claude_mini_client import mini_client

result = mini_client.execute_crew(
    task_description="Build complete e-commerce platform",
    context="Microservices architecture with 10 services",
    process_type="hierarchical",
    wait=False  # Don't wait - let it run for days
)
print(f"Crew started: {result['job_id']}")
```

### Submit AutoGen Team
```python
result = mini_client.execute_autogen(
    task_description="Design authentication system",
    initial_message="Implement OAuth2 with JWT",
    max_rounds=100,
    wait=False
)
print(f"Team started: {result['job_id']}")
```

### Check Job Status
```python
status = mini_client.check_job(job_id)
print(f"State: {status['state']}")
if status['state'] == 'completed':
    print(f"Result: {status['result']}")
```

### Direct Ollama Query
```python
response = mini_client.query_ollama(
    prompt="Explain microservices architecture",
    model="qwen2.5-coder:32b-instruct-q4_K_M"
)
print(response)
```

## API Reference

### Task Queue Endpoints

- `GET /health` - Server health check
- `POST /api/dev-task` - Submit development task
- `POST /api/execute-crew` - Execute CrewAI crew
- `POST /api/execute-autogen` - Execute AutoGen team
- `GET /api/job/:id` - Check job status
- `GET /api/stats` - Queue statistics
- `GET /api/models` - List available models

### Task Types

- `code-analysis` - Analyze code quality
- `code-generation` - Generate new code
- `code-refactor` - Refactor existing code
- `debugging` - Debug and fix issues
- `documentation` - Generate docs
- `testing` - Create test suites
- `architecture` - System design
- `planning` - Project planning

## Monitoring

### Check Service Status
```bash
# All services at once
curl http://100.114.129.95:8080/health
curl http://100.114.129.95:3001/health
curl http://100.114.129.95:11434/api/version
redis-cli -h 100.114.129.95 ping
```

### View Queue Statistics
```bash
curl http://100.114.129.95:3001/api/stats | jq
```

### Check for Updates
```bash
~/.claude_check_updates.sh
```

## Troubleshooting

### Connection Issues
1. Verify Tailscale: `tailscale status`
2. Ping Mini: `tailscale ping 100.114.129.95`
3. Check firewall settings

### Service Issues
1. SSH to Mini: `ssh 100.114.129.95`
2. Check processes: `ps aux | grep -E "node|redis|ollama"`
3. View logs: `tail -f ~/cmini-server/server.log`
4. Restart services: `~/cmini-scripts/start-services.sh`

### Model Issues
1. List models: `curl http://100.114.129.95:11434/api/tags`
2. Pull missing model: `ollama pull model-name`
3. Check disk space: `df -h`

## Configuration Files

- `server/task-queue-server.js` - Main task queue server
- `server/setup-portal.js` - Web setup interface
- `client/claude_mini_client.py` - Python client library
- `scripts/start-services.sh` - Service startup script
- `scripts/optimize-ollama.sh` - Ollama optimization

## Requirements

### Server (Mini)
- M4 Pro or better (recommended: 64GB RAM)
- macOS 14.0+
- 100GB free disk space
- Gigabit ethernet connection

### Client
- Python 3.7+
- Tailscale installed and connected
- Network access to Mini

## Security

- All communication via Tailscale VPN (WireGuard)
- Redis protected mode disabled only for Tailscale network
- No authentication on internal services (rely on VPN)
- Services bound to all interfaces but protected by Tailscale ACLs

## License

MIT

## Contributing

Contributions welcome! The architecture is designed to be extensible:
- Add new task types in `task-queue-server.js`
- Extend client methods in `claude_mini_client.py`
- Add new models via Ollama

## Support

For issues or questions:
1. Check setup portal: http://100.114.129.95:8080
2. Run diagnostic: `python3 client/test_integration.py`
3. Check logs on Mini: `ssh 100.114.129.95 'tail -100 ~/cmini-server/server.log'`

---

Built to solve Claude Code's 2-minute timeout limitation and enable true long-running AI agent orchestration.