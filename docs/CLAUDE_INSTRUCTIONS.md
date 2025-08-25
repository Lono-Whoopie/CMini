# Claude Configuration - M4 Pro Mini Integration

## ⚠️ IMPORTANT: Check for Updates
**Before starting any session, check the setup portal for updates:**
```bash
# Check portal for latest instructions and capabilities
curl -s http://100.114.129.95:8080/ | grep -A5 "Key Features"

# Check server capabilities
curl -s http://100.114.129.95:3001/api/stats | python3 -c "import json,sys; print(json.load(sys.stdin).get('capabilities', {}))"
```
If you see new features or endpoints, update your local configuration!

## Overview
This system is configured with a remote M4 Pro Mini (64GB RAM) for heavy compute tasks. The Mini runs Ollama for LLM inference and a task queue server for distributed processing.

## Mini Dev Server Access
- **Tailscale IP**: 100.114.129.95
- **LAN IP**: 10.0.10.244
- **SSH Access**: `ssh 100.114.129.95`
- **Setup Portal**: http://100.114.129.95:8080
- **Task Queue Server**: http://100.114.129.95:3001
- **Ollama API**: http://100.114.129.95:11434
- **Redis**: 100.114.129.95:6379

## Key Features
- **NO TIMEOUT LIMITS** - Tasks can run for days or weeks
- **64GB RAM** - Can run 70B+ parameter models
- **Persistent Queue** - Jobs survive restarts
- **Built for Long-Running Tasks** - CrewAI/AutoGen teams that run for extended periods

## Available Services

### 1. Setup Portal (http://100.114.129.95:8080)
Web interface for configuring any computer to use the Mini:
- Copy-paste instructions for Claude configuration
- Test commands for all endpoints
- Troubleshooting guide
- Python examples

### 2. Development Task Queue Server (http://100.114.129.95:3001)
Submit heavy processing tasks to the Mini's queue:

#### Endpoints:
- `GET /health` - Server health check
- `POST /api/dev-task` - Submit development task
- `GET /api/job/:id` - Check job status
- `GET /api/stats` - Queue statistics
- `GET /api/models` - List configured/installed models
- `POST /api/process-file` - Upload and process file
- `POST /api/clean` - Clean old jobs

#### Supported task types:
  - `code-analysis` - Analyze code quality and issues
  - `code-generation` - Generate code from requirements
  - `code-refactor` - Refactor existing code
  - `debugging` - Debug and fix issues
  - `documentation` - Generate documentation
  - `testing` - Create test suites
  - `architecture` - System design and architecture
  - `planning` - Project planning and breakdown

### 3. Ollama LLM Service (http://100.114.129.95:11434)
Direct LLM inference on Mini:

#### Endpoints:
- `GET /api/version` - Get Ollama version
- `GET /api/tags` - List installed models
- `POST /api/generate` - Generate text
- `POST /api/pull` - Download new models
- `POST /api/delete` - Remove a model

#### Models installed:
- **qwen2.5-coder:32b-instruct-q4_K_M** (19.8GB) - Primary coding model
- **qwen2.5-coder:14b-instruct-q4_K_M** (9GB) - Fast coding model
- **llama3.2:3b** (2GB) - Test/lightweight model

### 4. Redis Queue
- Host: 100.114.129.95
- Port: 6379
- Used for task queue management (Bull queue backend)
- No authentication required (protected mode disabled for Tailscale network)

## How to Use

### Submitting Tasks to Mini
```bash
# Example: Submit code for analysis
curl -X POST http://100.114.129.95:3001/api/dev-task \
  -H "Content-Type: application/json" \
  -d '{"task_type":"code-analysis","content":"<code here>"}'

# Check job status
curl http://100.114.129.95:3001/api/job/<job_id>
```

### Direct Ollama Queries
```bash
# Query Ollama directly
curl -X POST http://100.114.129.95:11434/api/generate \
  -d '{"model":"qwen2.5-coder:32b-instruct-q4_K_M","prompt":"<prompt>"}'
```

### SSH Commands
```bash
# SSH to Mini
ssh 100.114.129.95

# Copy files to Mini
scp file.txt 100.114.129.95:~/

# Run commands on Mini
ssh 100.114.129.95 'command here'
```

## Environment Variables Available
All Claude instances have these environment variables:
- `CLAUDE_DEV_SERVER` - Task queue server URL
- `CLAUDE_MINI_IP` - Mini's Tailscale IP
- `CLAUDE_OLLAMA_HOST` - Ollama API URL
- `CLAUDE_REDIS_HOST` - Redis host

## Helper Functions
When sourced from ~/.claude_config:
- `claude_submit_task <type> <content>` - Submit task to queue
- `claude_check_job <id>` - Check job status
- `claude_server_health` - Check server health
- `claude_models` - List available models
- `mini` - SSH to Mini quickly

## Important Notes
1. The Mini is on ethernet for fast network speeds
2. Models download in background - check with `mini-models`
3. Task queue persists jobs in Redis
4. All services auto-start on Mini boot
5. Tailscale provides secure access from anywhere

## When to Use Mini (CRITICAL - ALWAYS READ THIS)

### PRIMARY PURPOSE: Overcome Claude Code's 2-minute timeout limitation
The Mini server exists to handle tasks that exceed Claude Code's attention span and context window.

### ALWAYS use the Mini for:

#### 1. **Time-Critical Tasks** (will exceed 2 minutes)
- Any task likely to run longer than 90 seconds
- Multi-step command sequences with delays
- Build processes, test suites, or deployments
- Large file processing or data transformations
- Submit to Mini's queue and check status periodically

#### 2. **Context-Heavy Tasks** (will deplete context quickly)
- Analyzing multiple large files
- Processing entire codebases
- Generating extensive documentation
- Tasks requiring many tool calls or file reads
- Offload to preserve context for user interaction

#### 3. **Multi-Agent Orchestration** (ALWAYS use Mini)
- **CrewAI crews** - User explicitly requests, always use Mini
- **AutoGen teams** - User explicitly requests, always use Mini
- Complex agent coordination tasks
- Multi-model conversations or debates
- Hierarchical task decomposition

#### 4. **Heavy Model Inference**
- **32B+ parameter models** (qwen2.5-coder:32b)
- **70B models** for architecture and planning
- Complex reasoning requiring larger context windows
- Code generation for entire modules/systems

#### 5. **Batch Operations**
- Processing 5+ files in sequence
- Running analysis across multiple components
- Bulk refactoring or code updates
- Parallel API calls or data fetching

### Use LOCAL resources ONLY for:
- Simple, single file edits
- Quick searches and greps
- User interaction and clarification
- Planning and outlining (before execution)
- Tasks guaranteed to complete in <30 seconds

### Decision Framework:
1. **User mentions CrewAI/AutoGen?** → Mini immediately
2. **Task has multiple steps?** → Estimate time, if >90s → Mini
3. **Processing multiple files?** → Mini's batch API
4. **Already at 50% context usage?** → Mini for heavy tasks
5. **User says "this might take a while"?** → Mini
6. **Build/test/deploy operation?** → Mini with status polling

### How to hand off to Mini:
```python
# For long-running tasks
job = mini_client.submit_task(task_type, content, wait=False)
# Continue with other work
# Check status later
status = mini_client.check_job(job['job_id'])
```

### REMEMBER:
- Claude Code has a 2-minute timeout per operation
- Context depletes with every file read and tool use
- The Mini is designed to handle what Claude Code cannot
- When in doubt, offload to Mini and preserve local resources

## Example Scenarios

### Scenario 1: User asks "Create a CrewAI crew to analyze this codebase"
**Action**: IMMEDIATELY use Mini's dedicated CrewAI endpoint
```python
from claude_mini_client import mini_client

# Submit crew task - it can run for days!
result = mini_client.execute_crew(
    task_description="Analyze codebase architecture and suggest improvements",
    context="Focus on scalability and maintainability",
    process_type="hierarchical",
    wait=False  # Don't wait - let it run in background
)
print(f"Crew started with job ID: {result['job_id']}")
print("Check status with: mini_client.check_job(result['job_id'])")
```

### Scenario 2: User asks "Refactor these 10 files"
**Action**: Use Mini's batch processing
```python
files = [...] # list of 10 files
mini_client.batch_analyze(files, wait=False)
# Continue with other work while Mini processes
```

### Scenario 3: "Run the test suite and fix any failures"
**Action**: Mini (will exceed 2 minutes)
```python
mini_client.submit_task('testing',
    content=test_command,
    context="Run tests and generate fixes",
    wait=False)
```

### Scenario 4: "Generate documentation for this entire project"
**Action**: Mini (context-heavy, multiple file reads)
```python
mini_client.submit_task('documentation',
    content=project_structure,
    context="Generate comprehensive docs")
```

### Scenario 5: "Quick fix this typo"
**Action**: LOCAL (simple, <30 seconds)
```python
# Just use local Edit tool
```

### Scenario 6: User asks "Create an AutoGen team to build this feature"
**Action**: IMMEDIATELY use Mini's AutoGen endpoint
```python
from claude_mini_client import mini_client

# Submit AutoGen team - can run for days with many rounds
result = mini_client.execute_autogen(
    task_description="Build complete authentication system",
    initial_message="Design and implement OAuth2 with JWT",
    max_rounds=100,  # Can have many rounds!
    context="Node.js backend with React frontend",
    wait=False  # Never wait for teams
)
print(f"AutoGen team started: {result['job_id']}")
```

### Scenario 7: "This will probably take a while..."
**Action**: Mini (user is hinting at long duration)
```python
# Any task the user suggests might be long goes to Mini
mini_client.submit_task('architecture', 
    content=requirements,
    wait=False)  # Let it run, check later
```

## Quick Status Checks
```bash
# Check if Mini is accessible
tailscale ping 100.114.129.95

# Check all services at once
curl http://100.114.129.95:8080/health  # Portal
curl http://100.114.129.95:3001/health  # Task queue
curl http://100.114.129.95:11434/api/version  # Ollama
redis-cli -h 100.114.129.95 ping  # Redis

# Check installed models
curl http://100.114.129.95:3001/api/models | python3 -m json.tool

# Check queue statistics
curl http://100.114.129.95:3001/api/stats | python3 -m json.tool
```

## Troubleshooting

### If Ollama endpoints don't work:
1. Check Tailscale connection: `tailscale status`
2. Try pinging Mini: `tailscale ping 100.114.129.95`
3. Test with LAN IP if on same network: `curl http://10.0.10.244:11434/api/version`
4. SSH to Mini and restart Ollama: `ssh 100.114.129.95 '~/start_services.sh'`

### If task submission fails:
1. Check Redis is running: `redis-cli -h 100.114.129.95 ping`
2. Verify models are installed: `curl http://100.114.129.95:3001/api/models`
3. Check server logs: `ssh 100.114.129.95 'tail -20 ~/dev-task-queue/server.log'`

### Service Management:
- **Start all services**: `ssh 100.114.129.95 '~/start_services.sh'`
- **Check running processes**: `ssh 100.114.129.95 'ps aux | grep -E "node|redis|ollama"'`