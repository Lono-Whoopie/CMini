# CMini - AI Task Processing System (SHELVED)

## 🚨 PROJECT STATUS: SHELVED

**CMini has been shelved in favor of direct single-model approaches.** The services are disabled and will not autostart. All code and configurations remain intact for potential future use.

### Quick Commands (if needed)
```bash
# To manually start CMini services
ssh 100.114.129.95 './start_cmini.sh'

# To stop CMini services  
ssh 100.114.129.95 './stop_cmini.sh'
```

### Current Focus
Development has shifted to:
- **Skippy AI Gateway** - Lightweight, fast single-model routing (http://100.114.129.95:9002)
- **Direct Ollama Integration** - Streamlined single-task processing
- **Simplified Architecture** - Removing unnecessary CrewAI/AutoGen overhead

---

## Original Documentation (Archived)

A distributed AI task processing system designed to overcome Claude Code's 2-minute timeout limitation by offloading long-running tasks to a dedicated M4 Pro Mini server.

### Why It Was Built
CMini was created to:
- Handle unlimited task duration for CrewAI/AutoGen crews
- Support 32B+ parameter model inference with 64GB unified memory
- Provide persistent job queues for long-running operations
- Enable multi-agent orchestration

### Architecture Overview
```
Client (Claude Code) → Task Queue Server (3001) → Ollama/CrewAI/AutoGen
                     → Setup Portal (8080)
                     → Redis Queue (6379)
```

### Components
- **Task Queue Server** - Express.js + Bull Queue for job management
- **Setup Portal** - Web interface for client configuration
- **CrewAI Integration** - Multi-agent crew orchestration
- **Direct Model Executor** - Single model task processing
- **Job Monitoring** - Real-time job status tracking

### File Structure
```
/Users/mike/dev-task-queue/          # Production server
/Users/mike/dev-task-queue-dev/      # Development server
/Users/mike/cmini-server/             # Web portal
/Users/mike/mcp-servers/              # MCP integrations
```

### Models Available
- qwen2.5-coder:32b-instruct-q4_K_M (19.8GB)
- qwen2.5-coder:14b-instruct-q4_K_M (9GB)  
- llama3.2:3b (2GB)

### Security Implementation
- Phase 1-4: Completed (daemon users, Redis ACL, LaunchDaemons)
- Phase 5: Pending (firewall configuration)
- All passwords in `.env` files (gitignored)
- Services run as daemon users
- SSH key-only access enabled

### Lessons Learned
1. **Complexity vs. Benefit** - Multi-agent systems added unnecessary overhead for most tasks
2. **Single Model Efficiency** - Direct model calls are faster and simpler for 90% of use cases
3. **Maintenance Burden** - Complex orchestration requires significant upkeep
4. **Resource Usage** - CrewAI/AutoGen consume excessive resources for simple tasks

### Migration Path
Users should transition to:
1. **Skippy AI Gateway** for intelligent model routing
2. **Direct Ollama API** for specific model calls
3. **Custom Python scripts** for task automation
4. **Native Claude Code** for most development tasks

---

## Repository Contents

### Active Scripts (for manual management)
- `scripts/shelve_cmini.sh` - Safely stop all services
- `scripts/start_cmini.sh` - Manual start (created on Mini)
- `scripts/stop_cmini.sh` - Manual stop (created on Mini)

### Documentation
- `CHECKPOINT_2025_08_27_VSCODE.md` - Last active session details
- `SECURITY_MIGRATION_PLAN.md` - Security implementation record
- `CREWAI_EXPERT_GUIDE.md` - CrewAI patterns documentation

### Client Libraries (archived)
- `client/claude_mini_client.py` - Original Python client
- `client/claude_mini_expert.py` - CrewAI expert patterns

### Server Components (archived)
- `server/task-queue-server.js` - Main queue server
- `server/simple_setup_portal.js` - Web portal
- `server/crew-expert.js` - CrewAI expert system
- `server/job-monitor.html` - Job monitoring dashboard

---

## License

MIT

## Note

This project served as a valuable learning experience in distributed AI systems. While shelved, the code remains available for reference or potential future revival with a simplified architecture.

For current AI task processing needs, please use Skippy or direct Ollama integration.