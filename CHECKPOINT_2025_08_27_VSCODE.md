# 🏁 COMPREHENSIVE CHECKPOINT - August 27, 2025
## CMini M4 Pro Development Server - Ready for VSCode

---

## 🎯 CURRENT STATUS

### System Version: 3.1.0
- **Portal**: http://100.114.129.95:8080
- **Production API**: http://100.114.129.95:3001 (✅ Running - v3.0.0)
- **Development API**: http://100.114.129.95:3002 (✅ Running - v3.1.0 testing)
- **Ollama**: http://100.114.129.95:11434 (✅ Running)

### Version System
```bash
# Check current version
curl http://100.114.129.95:8080/version

# Version history
v3.1.0 - Direct model support, slot system, code extraction (in dev)
v3.0.0 - CrewAI working, job details, MCP servers (in prod)
v2.0.0 - Security migration, daemon users
v1.0.0 - Initial deployment
```

---

## 📂 PROJECT STRUCTURE FOR VSCODE

### Main Directories
```
/Users/mike/dev-task-queue/          # Production slot
├── server.js                        # Main Express server
├── crew_executor.py                 # Original CrewAI executor
├── crew_executor_v2.py             # Enhanced with code extraction
├── direct_model_executor.py        # Basic direct model execution
├── direct_model_executor_v2.py    # With intelligent model selection
├── model_selector.py               # Intelligent model selection logic
├── slot_manager.sh                 # Dev/prod deployment manager
└── venv/                          # Python virtual environment

/Users/mike/dev-task-queue-dev/     # Development slot (testing)
├── [Same structure as above]
└── Testing new features here

/Users/mike/cmini-server/           # Web portal
├── simple_setup_portal.js         # Main portal server
├── job-monitor.html               # Jobs monitoring page
├── job-details.html              # Job details drill-through
└── scripts/
    └── setup_client.sh           # One-command client setup

/Users/mike/mcp-servers/           # MCP integrations
├── ms-365-mcp-server/
├── azure-mcp/
├── azure-devops-mcp/
└── mcp_integration.py
```

---

## 🚀 TODAY'S SESSION ACHIEVEMENTS

### 1. ✅ Direct Model Endpoint (Partially Working)
- Created `/api/direct-model` for single-agent tasks
- Added intelligent model selection based on task analysis
- Models auto-selected: qwen2.5-coder:32b, 14b, llama3.2:3b
- **STATUS**: API works but job processor has issues in dev

### 2. ✅ Crew Output Optimization
- Created `crew_executor_v2.py` with clean code extraction
- Automatically parses out code blocks from agent responses
- Reduces post-processing token usage
- Extracts files and code blocks separately

### 3. ✅ Dev/Test Slot System (NEW!)
**Purpose**: Deploy and test changes safely without breaking production

**Architecture**:
```
Production Slot (Port 3001)          Development Slot (Port 3002)
├── Stable, tested code              ├── New features testing
├── /Users/mike/dev-task-queue/      ├── /Users/mike/dev-task-queue-dev/
├── Real jobs processing             ├── Test jobs only
└── Auto-backup before updates       └── Full isolation from prod
```

**Slot Manager Commands**:
```bash
# Deployment workflow
./slot_manager.sh status              # View both slots status
./slot_manager.sh start-dev           # Start dev server on 3002
./slot_manager.sh deploy-to-dev file  # Copy changes to dev
./slot_manager.sh test-dev            # Run automated tests
./slot_manager.sh compare             # Diff dev vs prod
./slot_manager.sh promote             # Deploy dev→prod (with backup)
./slot_manager.sh rollback           # Restore from backup

# Monitoring
./slot_manager.sh logs-dev           # Tail dev logs
./slot_manager.sh logs-prod          # Tail production logs
```

**Safety Features**:
- Automatic backup before promotion
- Health checks before/after deployment  
- Test suite must pass for promotion
- One-command rollback to previous version
- Complete isolation between slots

**Current Status**:
- ✅ Slot system operational
- ✅ Dev server running on 3002
- ⚠️ Process detection needs fix (but health checks work)
- ⚠️ Direct model processor needs fix in dev

### 4. ✅ Model Selection Intelligence
```python
# Automatically selects best model for task:
- Complex code → qwen2.5-coder:32b
- Simple code → qwen2.5-coder:14b
- Quick tasks → llama3.2:3b
- API development → deepseek-coder:16b (if available)
```

---

## 🐛 CURRENT ISSUES TO FIX

### 1. Direct Model Job Processing
```
Error: "Missing process handler for job type direct-model"
Location: /Users/mike/dev-task-queue-dev/server.js
Issue: Job processor registration not working properly
```

### 2. Slot Manager Process Detection
```
Issue: Shows servers as "not running" even when they are
Fix needed: Update process detection logic in slot_manager.sh
Current workaround: Use health checks instead
```

### 3. Recommendation Endpoint
```
Status: Working in dev (port 3002)
Endpoint: POST /api/recommend-approach
Input: {"task_description": "..."}
Returns: Recommendation for crew vs direct model
```

---

## 🔧 WORKING ENDPOINTS

### Production (Port 3001) - Stable
```bash
GET  /health                    # Health check
GET  /api/jobs                  # All jobs
GET  /api/job/{id}             # Single job details
POST /api/execute-crew         # Submit CrewAI job
POST /api/crew/simple          # Expert crew patterns
POST /api/dev-task            # Generic dev task
```

### Development (Port 3002) - Testing
```bash
GET  /health                    # Health check
POST /api/direct-model         # Direct model execution (broken)
POST /api/recommend-approach   # Get crew vs direct recommendation
[All production endpoints also available]
```

---

## 📋 TODO LIST FOR VSCODE SESSION

### Immediate Fixes Needed
1. **Fix direct-model job processor**
   - Issue: devQueue.process('direct-model') not registering
   - File: `/Users/mike/dev-task-queue-dev/server.js`
   - Line: ~475 (look for duplication)

2. **Fix slot manager detection**
   - File: `/Users/mike/dev-task-queue/slot_manager.sh`
   - Issue: grep patterns not matching node processes

3. **Update portal instructions**
   - Add version 3.1.0 features
   - Document when to use crew vs direct
   - Update one-command script

### Enhancements
4. **Improve crew output parsing**
   - Better code block extraction
   - Handle multiple file outputs
   - Clean agent meta-commentary

5. **Add model benchmarking**
   - Track execution times per model
   - Compare quality metrics
   - Auto-tune selection algorithm

6. **Complete MCP integration**
   - Finish authentication setup
   - Add to crew tools
   - Document usage

---

## 🔑 KEY DECISIONS MADE

1. **Single-agent tasks should NOT use CrewAI**
   - Direct model endpoint for efficiency
   - Reduces overhead and cost
   - Faster execution for simple tasks

2. **Dev/Test slots for safe deployment**
   - Test on port 3002 before promoting
   - Automatic backup on promotion
   - Rollback capability

3. **Clean code extraction from crews**
   - Parse out only code, not explanations
   - Reduce Claude token usage
   - Better structured output

---

## 🛠️ QUICK START COMMANDS

```bash
# Open in VSCode
code /Users/mike/dev-task-queue

# Check status
./slot_manager.sh status

# Test in dev
./slot_manager.sh start-dev
./slot_manager.sh test-dev

# Deploy changes
./slot_manager.sh deploy-to-dev server.js
./slot_manager.sh promote

# Monitor logs
tail -f /tmp/taskqueue.log      # Production
tail -f /tmp/taskqueue-dev.log  # Development

# Test endpoints
curl http://100.114.129.95:3001/health
curl http://100.114.129.95:3002/health

# Submit test job
curl -X POST http://100.114.129.95:3002/api/direct-model \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Write hello world in Python"}'
```

---

## 📊 METRICS

- **Jobs Processed**: 33 total (28-33 testing direct model)
- **Models Available**: 3 (qwen2.5-coder:32b/14b, llama3.2:3b)
- **Endpoints Added**: 3 new (/api/direct-model, /api/recommend-approach, dev slot)
- **Files Modified**: 8 major files
- **Testing**: Dev slot operational but needs fixes

---

## 🔐 SECURITY STATUS

- ✅ Phase 1-4 completed (daemon users, Redis ACL, LaunchDaemons)
- ⏳ Phase 5 pending (firewall configuration)
- ✅ Passwords in `.env` file (gitignored)
- ✅ Services running as daemon users
- ✅ SSH key-only access

---

## 💡 ARCHITECTURE INSIGHTS

1. **Two-tier processing**:
   - Simple tasks → Direct model (fast, efficient)
   - Complex tasks → CrewAI (multi-agent orchestration)

2. **Model selection hierarchy**:
   - Analyze task complexity
   - Match model capabilities
   - Balance speed vs quality

3. **Dev/Prod separation**:
   - Test safely on port 3002
   - Promote when validated
   - Rollback if issues

---

## 📚 REFERENCE DOCS

- CrewAI Docs: https://docs.crewai.com
- Ollama API: https://github.com/ollama/ollama/blob/main/docs/api.md
- Bull Queue: https://docs.bullmq.io
- MCP Spec: https://modelcontextprotocol.io

---

## ✅ READY FOR VSCODE

**Project Root**: `/Users/mike/dev-task-queue`
**Dev Environment**: `/Users/mike/dev-task-queue-dev`
**Python Venv**: `source venv/bin/activate`
**Main Entry**: `server.js`

**Critical Files to Review**:
1. `server.js` - Fix direct-model processor
2. `slot_manager.sh` - Fix process detection
3. `direct_model_executor_v2.py` - Verify model selection
4. `crew_executor_v2.py` - Improve output parsing

---

*Generated: August 27, 2025 15:45 PST*
*Ready for VSCode Claude Code integration*
*Context preserved for seamless continuation*