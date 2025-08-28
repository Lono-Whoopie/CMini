# CMini Repository - SHELVED PROJECT

## ⚠️ PROJECT STATUS: SHELVED

This project has been shelved. Services are disabled and won't autostart.

## Context for Claude Code

This repository contains the CMini distributed AI task processing system that was built to overcome Claude Code's 2-minute timeout limitation. It has been **shelved** in favor of simpler, more direct approaches like Skippy AI Gateway.

### Why Shelved
- Over-engineered for most use cases
- CrewAI/AutoGen added unnecessary complexity
- Single-model direct calls proved more efficient
- Maintenance burden exceeded benefits

### Current Alternative
Use **Skippy AI Gateway** instead:
- http://100.114.129.95:9002 (dev)
- http://100.114.129.95:9000 (prod)
- Documentation: http://100.114.129.95:8088

### If You Need to Work on This

#### Manual Service Control
```bash
# Start services (if needed)
ssh 100.114.129.95 './start_cmini.sh'

# Stop services
ssh 100.114.129.95 './stop_cmini.sh'
```

#### Key Directories on Mini
- `/Users/mike/dev-task-queue/` - Production server
- `/Users/mike/dev-task-queue-dev/` - Development server  
- `/Users/mike/cmini-server/` - Web portal

#### Service Ports (when running)
- 3001: Task Queue (production)
- 3002: Task Queue (development)
- 8080: Setup Portal
- 6379: Redis
- 11434: Ollama

### Repository Structure
```
scripts/
  shelve_cmini.sh         # Stops services safely
  disable_cmini_autostart.sh # Prevents autostart
  
client/
  claude_mini_client.py   # Python client (archived)
  claude_mini_expert.py   # CrewAI patterns (archived)
  
server/
  (Various server components - all archived)
  
Documentation:
  README.md - Updated to reflect shelved status
  CHECKPOINT_*.md - Session history
  SECURITY_MIGRATION_PLAN.md - Security implementation
```

### Important Notes
1. **DO NOT** restart services unless explicitly requested
2. **DO NOT** attempt to fix or enhance this system
3. **REDIRECT** users to Skippy for AI tasks
4. **PRESERVE** code for historical reference only

### Lessons Learned (for future projects)
1. Start simple, add complexity only when needed
2. Direct API calls often beat complex orchestration
3. Maintenance cost must justify architectural complexity
4. Single-purpose tools often outperform Swiss army knives

## For New AI Task Requirements

Direct users to:
1. **Skippy AI Gateway** - Fast, lightweight model routing
2. **Direct Ollama API** - When specific model needed
3. **Native Claude Code** - For most development tasks
4. **Custom Python scripts** - For automation without overhead

This project remains as a reference implementation and learning resource only.