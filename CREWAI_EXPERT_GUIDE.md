# CrewAI Expert Service Guide

## Overview
The CrewAI Expert Service transforms simple natural language requests into professionally designed, optimized CrewAI crews. Instead of manually defining agents, tasks, and configurations, you can now make simple requests and let the expert system handle the complexity.

## Why Use the Expert Service?

### Before (Manual Crew Creation)
```python
# Tedious manual configuration
crew_config = {
    "agents": [
        {
            "role": "Security Auditor",
            "goal": "Find vulnerabilities",
            "backstory": "...",
            "tools": ["scanner", "analyzer"],
            # ... many more properties
        },
        # ... define 3-5 more agents
    ],
    "tasks": [
        # ... define multiple tasks with dependencies
    ],
    "process_type": "hierarchical",
    # ... dozens more configuration options
}
```

### After (Expert Service)
```python
# Simple one-liner
result = client.simple_crew("Review this code for security issues")
```

## Features

### 🎯 Intelligent Pattern Matching
The expert service automatically determines the best crew pattern based on your request:
- **Code Review**: Security, performance, quality analysis
- **API Development**: Design, implementation, documentation
- **Debugging**: Investigation, root cause analysis, fixes
- **Architecture Design**: System design, scalability, infrastructure
- **Data Analysis**: Statistical analysis, visualization, insights
- **Refactoring**: Code improvement, pattern implementation
- **NIST Compliance**: CSF, 800-53, 800-171, RMF assessments and implementation
- **CMMC Compliance**: Level 1-3 assessments, CUI protection, DoD requirements

### 🤖 Pre-Configured Expert Agents
Each pattern includes professionally designed agents with:
- Detailed roles and goals
- Rich backstories establishing expertise
- Appropriate tools and capabilities
- Collaboration instructions
- Optimal task dependencies

### ⚡ Optimized Execution
- Automatic process type selection (sequential/hierarchical)
- Smart task scheduling and dependencies
- Resource allocation based on priority
- Retry strategies and error handling
- Progress tracking and logging

## Quick Start

### Installation
```bash
# Copy the expert client to your machine
curl -o ~/claude_mini_expert.py \
  http://100.114.129.95:8080/client/claude_mini_expert.py

# Make it executable
chmod +x ~/claude_mini_expert.py
```

### Basic Usage

#### 1. Simple Crew Request
```python
from claude_mini_expert import CrewAIExpertClient

client = CrewAIExpertClient()

# One line to create a complete crew
result = client.simple_crew(
    "Review the authentication system for security issues",
    context="Node.js Express application"
)

# Job ID: 42
# Pattern: code-review
# Estimated time: 2850s
```

#### 2. Analyze Without Executing
```python
# Preview what crew would be created
analysis = client.analyze_request(
    "Build a REST API for user management",
    context="Python FastAPI"
)

# Shows agents, tasks, estimated time without running
```

#### 3. Monitor Progress
```python
# Wait for completion with progress updates
result = client.wait_for_crew(job_id="42", check_interval=10)
```

## Usage Examples

### Code Review
```python
from claude_mini_expert import review_code

# Simple code review
result = review_code(
    "authentication module",
    files=["auth.py", "middleware.py", "models.py"],
    context="Django application"
)
```

### API Development
```python
from claude_mini_expert import build_api

# Create complete API with documentation
result = build_api(
    "user management system with CRUD operations",
    context="Node.js, Express, MongoDB"
)
```

### Debugging
```python
from claude_mini_expert import debug_issue

# High-priority debugging
result = debug_issue(
    "memory leak in worker processes",
    context="Python multiprocessing application",
    priority="high"
)
```

### System Architecture
```python
from claude_mini_expert import design_system

# Design complete architecture
result = design_system(
    "e-commerce platform",
    requirements=[
        "Handle 10K concurrent users",
        "Multi-region deployment",
        "PCI compliance"
    ]
)
```

### Data Analysis
```python
from claude_mini_expert import analyze_data

# Analyze and visualize data
result = analyze_data(
    "sales trends and customer behavior",
    files=["sales_2024.csv", "customers.json"]
)
```

### Refactoring
```python
from claude_mini_expert import refactor_code

# Improve code structure
result = refactor_code(
    "legacy payment processing module",
    files=["payment.py", "legacy_gateway.py"],
    context="Needs to support multiple payment providers"
)
```

### NIST Compliance
```python
from claude_mini_expert import nist_compliance

# NIST Cybersecurity Framework assessment
result = nist_compliance(
    "assess current security posture",
    framework="CSF",
    context="Financial services organization with cloud infrastructure"
)

# NIST 800-171 for CUI
result = nist_compliance(
    "implement CUI protection controls",
    framework="800-171",
    context="Defense contractor handling sensitive data"
)
```

### CMMC Assessment
```python
from claude_mini_expert import cmmc_assessment

# CMMC Level 2 assessment
result = cmmc_assessment(
    "prepare for certification",
    level=2,
    context="Small defense contractor, 50 employees"
)

# Gap analysis
from claude_mini_expert import compliance_gap_analysis

result = compliance_gap_analysis(
    "CMMC",
    description="Focus on access control and incident response",
    files=["security_policy.pdf", "network_diagram.png"]
)
```

## Advanced Usage

### Custom Configuration
```python
from claude_mini_expert import CrewAIExpertClient, AdvancedCrewRequest, Priority

client = CrewAIExpertClient()

# Full control over crew configuration
request = AdvancedCrewRequest(
    task_description="Optimize database performance",
    context="PostgreSQL with complex queries",
    requirements=[
        "Identify slow queries",
        "Suggest indexes",
        "Rewrite inefficient queries"
    ],
    priority=Priority.HIGH,
    process_type="hierarchical",
    max_iterations=20,
    custom_agents=[
        {
            "role": "Database Specialist",
            "goal": "Optimize query performance",
            "tools": ["explain_analyze", "pg_stat"]
        }
    ]
)

result = client.advanced_crew(request)
```

### Pattern Discovery
```python
# See all available patterns
patterns = client.get_patterns()

# Output:
# 📚 Available Crew Patterns (6 patterns)
# ========================================
# 🔹 Code Review Crew (code-review)
#    Comprehensive code review with security, performance...
#    Agents: 4 | Process: hierarchical
#    Use cases:
#      • Pull request reviews
#      • Security audits
#      • Code quality assessment
# ...
```

## API Reference

### Simple Crew Endpoint
```bash
POST /api/crew/simple
{
  "description": "Review this code",
  "context": "Python Django app",
  "files": ["views.py", "models.py"],
  "priority": "normal"
}
```

### Analyze Request Endpoint
```bash
POST /api/crew/analyze
{
  "description": "Build an API",
  "context": "Node.js Express"
}
```

### Advanced Crew Endpoint
```bash
POST /api/crew/advanced
{
  "task_description": "Complex task",
  "requirements": ["req1", "req2"],
  "custom_agents": [...],
  "custom_tasks": [...],
  "process_type": "sequential"
}
```

### Get Patterns Endpoint
```bash
GET /api/crew/patterns
```

### Get Status Endpoint
```bash
GET /api/crew/status/{job_id}
```

## Crew Patterns Details

### Code Review Pattern
**Agents**: Security Auditor, Performance Engineer, Code Quality Specialist, Test Coverage Analyst  
**Best for**: Pull requests, security audits, quality assessments  
**Process**: Hierarchical  
**Typical duration**: 45-60 minutes  

### API Development Pattern
**Agents**: API Architect, Backend Developer, Documentation Writer, Integration Tester  
**Best for**: REST/GraphQL APIs, microservices, API documentation  
**Process**: Sequential  
**Typical duration**: 60-90 minutes  

### Debugging Pattern
**Agents**: Bug Investigator, Root Cause Analyst, Solution Developer  
**Best for**: Bug fixes, performance issues, memory leaks  
**Process**: Sequential  
**Typical duration**: 30-45 minutes  

### Architecture Design Pattern
**Agents**: Solution Architect, Database Architect, Infrastructure Engineer, Security Architect  
**Best for**: System design, scalability planning, technology selection  
**Process**: Hierarchical  
**Typical duration**: 60-75 minutes  

### Data Analysis Pattern
**Agents**: Data Scientist, Data Engineer, Visualization Specialist, Business Analyst  
**Best for**: Statistical analysis, ML models, dashboards, insights  
**Process**: Sequential  
**Typical duration**: 60-90 minutes  

### Refactoring Pattern
**Agents**: Refactoring Strategist, Refactoring Developer, Test Engineer  
**Best for**: Legacy code modernization, technical debt, restructuring  
**Process**: Sequential  
**Typical duration**: 45-60 minutes  

### NIST Compliance Pattern
**Agents**: NIST Framework Specialist, Control Implementation Engineer, Risk Management Analyst, Compliance Documentation Specialist, Continuous Monitoring Architect  
**Best for**: NIST CSF implementation, 800-53 controls, 800-171 CUI protection, RMF, FedRAMP  
**Process**: Hierarchical  
**Typical duration**: 75-90 minutes  
**Key deliverables**: Gap analysis, control mappings, SSPs, POA&Ms, risk assessments  

### CMMC Compliance Pattern
**Agents**: CMMC Lead Assessor, CUI Protection Specialist, Practice Implementation Lead, Supply Chain Security Analyst, Documentation Manager, Incident Response Coordinator  
**Best for**: CMMC Level 1-3 certification, DoD contractors, DFARS compliance, supply chain security  
**Process**: Hierarchical  
**Typical duration**: 90-120 minutes  
**Key deliverables**: Assessment results, maturity scores, remediation roadmap, evidence packages  

## Best Practices

### 1. Provide Clear Context
```python
# Good: Specific context
result = client.simple_crew(
    "Review authentication",
    context="Django REST API with JWT tokens, Redis sessions"
)

# Bad: Vague context
result = client.simple_crew("Review code")
```

### 2. Include Relevant Files
```python
# Good: Specify files to analyze
result = client.simple_crew(
    "Find performance issues",
    files=["api.py", "database.py", "cache.py"]
)
```

### 3. Set Appropriate Priority
```python
# High priority for production issues
result = client.simple_crew(
    "Debug production crash",
    priority="high"  # Gets more resources
)
```

### 4. Use Requirements for Complex Tasks
```python
# Clear requirements for better results
result = client.advanced_crew(
    AdvancedCrewRequest(
        task_description="Migrate to microservices",
        requirements=[
            "Zero downtime migration",
            "Maintain backward compatibility",
            "Implement service discovery",
            "Add centralized logging"
        ]
    )
)
```

## Troubleshooting

### Crew Takes Too Long
- Check estimated time before execution
- Use `analyze_request()` to preview
- Consider breaking into smaller tasks

### Wrong Pattern Selected
- Be more specific in description
- Use advanced mode to specify pattern
- Include keywords from desired pattern

### Results Not Detailed Enough
- Add more context
- Specify requirements explicitly
- Use advanced mode with custom agents

## Performance Tips

1. **Batch Related Tasks**: Submit related reviews together
2. **Use Priority Wisely**: High priority uses more resources
3. **Cache Results**: Reuse analysis for similar code
4. **Monitor Progress**: Use status endpoint for long tasks

## Integration Examples

### Shell Script
```bash
#!/bin/bash
# review.sh - Quick code review script

python3 -c "
from claude_mini_expert import review_code
review_code('$1', files=['$2'])
"
```

### GitHub Actions
```yaml
- name: AI Code Review
  run: |
    python3 -c "
    from claude_mini_expert import review_code
    review_code(
      'PR ${{ github.event.pull_request.title }}',
      files=${{ steps.changed-files.outputs.all }}
    )"
```

### VS Code Task
```json
{
  "label": "AI Review Current File",
  "type": "shell",
  "command": "python3",
  "args": [
    "-c",
    "from claude_mini_expert import review_code; review_code('${file}')"
  ]
}
```

## Comparison: Manual vs Expert

| Aspect | Manual Crew Creation | Expert Service |
|--------|---------------------|----------------|
| Lines of code | 100-200 | 1-5 |
| Time to create | 30-60 minutes | 10 seconds |
| Expertise needed | High | None |
| Optimization | Manual | Automatic |
| Best practices | Your responsibility | Built-in |
| Agent design | From scratch | Pre-configured |
| Task dependencies | Manual setup | Auto-generated |
| Error handling | DIY | Included |
| Progress tracking | Optional | Automatic |

## Summary

The CrewAI Expert Service makes it trivial to create sophisticated AI crews:

1. **Simple**: One line of code instead of hundreds
2. **Fast**: Seconds to create, minutes to hours saved
3. **Optimized**: Best practices and patterns built-in
4. **Flexible**: Simple or advanced modes available
5. **Reliable**: Professional agent configurations
6. **Monitored**: Built-in progress tracking

Start using the expert service today and let the Mini handle the complexity of crew creation while you focus on getting results!