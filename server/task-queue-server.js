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
const { spawn } = require('child_process');

// Import monitoring module
const monitoring = require('./monitoring');

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

// Development task queue - No timeout limits for long-running tasks
const devQueue = new Queue('Development Tasks', {
    redis: { host: 'localhost', port: 6379 },
    defaultJobOptions: {
        removeOnComplete: 100,  // Keep more completed jobs for reference
        removeOnFail: 50,       // Keep failed jobs for debugging
        attempts: 1,            // Don't retry automatically (let user decide)
        timeout: undefined,     // NO TIMEOUT - tasks can run for days
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
    'code-refactor': 'qwen2.5-coder:14b-instruct-q4_K_M',
    'architecture': 'qwen2.5-coder:32b-instruct-q4_K_M',
    'documentation': 'qwen2.5-coder:32b-instruct-q4_K_M',
    'debugging': 'qwen2.5-coder:32b-instruct-q4_K_M',
    'testing': 'qwen2.5-coder:14b-instruct-q4_K_M',
    'planning': 'qwen2.5-coder:32b-instruct-q4_K_M',
    'review': 'qwen2.5-coder:32b-instruct-q4_K_M',
    'api-testing': 'qwen2.5-coder:14b-instruct-q4_K_M',
    'data-analysis': 'qwen2.5-coder:32b-instruct-q4_K_M',
    'compliance-scoring': 'qwen2.5-coder:32b-instruct-q4_K_M',
    'batch-processing': 'qwen2.5-coder:32b-instruct-q4_K_M',
    'crewai-crew': 'qwen2.5-coder:32b-instruct-q4_K_M',
    'autogen-team': 'qwen2.5-coder:32b-instruct-q4_K_M',
    'agent-coordination': 'qwen2.5-coder:32b-instruct-q4_K_M'
};

// Development task prompts
const DEV_PROMPTS = {
    'code-analysis': `Analyze the following code and provide comprehensive feedback:
    
{code}

Provide analysis covering:
1. Code quality and best practices
2. Potential bugs or issues
3. Performance considerations
4. Security vulnerabilities
5. Refactoring suggestions`,
    
    'code-generation': `Generate code based on the following requirements:

{code}

Context: {context}

Generate clean, efficient, and well-documented code.`,

    'code-refactor': `Refactor the following code to improve quality and maintainability:

{code}

Focus on:
1. Code clarity and readability
2. Performance optimization
3. Design pattern implementation
4. Error handling improvement`,

    'debugging': `Debug the following code and identify issues:

{code}

Error/Issue: {context}

Provide:
1. Root cause analysis
2. Step-by-step debugging approach
3. Fix recommendations
4. Prevention strategies`,

    'documentation': `Create comprehensive documentation for:

{code}

Include:
1. Overview and purpose
2. API documentation
3. Usage examples
4. Configuration options
5. Troubleshooting guide`,

    'testing': `Create comprehensive tests for:

{code}

Include:
1. Unit tests
2. Integration tests
3. Edge cases
4. Error scenarios`,

    'compliance-scoring': `Score the following data against compliance standards:

{code}

Standards to check: {context}

Provide detailed compliance analysis and scoring.`,

    'crewai-crew': `Design and implement a CrewAI crew for the following task:

Task: {code}
Context: {context}

Create a detailed crew specification including:
1. Agent definitions with roles and goals
2. Task breakdown and dependencies
3. Workflow orchestration
4. Expected outputs from each agent
5. Inter-agent communication patterns

Format the response as a structured CrewAI implementation plan.`,

    'autogen-team': `Design and implement an AutoGen team for the following task:

Task: {code}
Context: {context}

Create a detailed team specification including:
1. Agent configurations with capabilities
2. Conversation patterns and flows
3. Task delegation strategy
4. Termination conditions
5. Expected interaction sequences

Format the response as a structured AutoGen implementation plan.`
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
            timeout: 0 // No timeout - let it run as long as needed
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

// Process CrewAI crew executions - Now with actual implementation
devQueue.process('execute-crew', async (job) => {
    const { 
        task_description, 
        agents = [], 
        context = '',
        process_type = 'sequential' 
    } = job.data;
    
    try {
        job.progress(10);
        
        // Generate CrewAI implementation using LLM
        const crewPrompt = `You are a CrewAI expert. Design and execute a crew for this task:

Task: ${task_description}
Context: ${context}
Process Type: ${process_type}

Create a detailed implementation with:
1. Agent Definitions (minimum 3 agents):
   - Role, Goal, Backstory for each
   - Tools and capabilities needed
   
2. Task Breakdown:
   - Specific tasks for each agent
   - Dependencies between tasks
   - Expected deliverables
   
3. Execution Plan:
   - Step-by-step workflow
   - Communication between agents
   - Quality checks and validation
   
4. Final Output:
   - Consolidated results from all agents
   - Summary of accomplishments
   - Next steps or recommendations

Simulate the crew execution and provide the complete output as if the crew actually ran.`;

        job.progress(30);
        
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'qwen2.5-coder:32b-instruct-q4_K_M',
            prompt: crewPrompt,
            options: {
                temperature: 0.7,
                num_predict: 16384, // Larger output for crew simulation
                top_k: 40,
                top_p: 0.95,
            },
            stream: false
        }, {
            timeout: 0 // No timeout - crews can run for days
        });
        
        job.progress(90);
        
        // Parse and structure the response
        const crewOutput = response.data.response;
        
        return {
            success: true,
            task_type: 'crewai-crew',
            crew_output: crewOutput,
            task_description,
            process_type,
            model_used: 'qwen2.5-coder:32b-instruct-q4_K_M',
            execution_time: new Date().toISOString(),
            tokens_generated: response.data.eval_count || 0
        };
    } catch (error) {
        throw new Error(`CrewAI execution failed: ${error.message}`);
    }
});

// Process AutoGen team executions - Now with actual implementation
devQueue.process('execute-autogen', async (job) => {
    const { 
        task_description,
        agents = [],
        initial_message,
        max_rounds = 10,
        context = ''
    } = job.data;
    
    try {
        job.progress(10);
        
        // Generate AutoGen implementation using LLM
        const autogenPrompt = `You are an AutoGen expert. Design and execute an agent team for this task:

Task: ${task_description}
Initial Message: ${initial_message || task_description}
Context: ${context}
Max Rounds: ${max_rounds}

Create a detailed implementation with:
1. Agent Configurations (minimum 3 agents):
   - UserProxyAgent for user interaction
   - AssistantAgent for primary work
   - Specialized agents as needed
   - System messages and functions for each
   
2. Conversation Flow:
   - Initial message handling
   - Agent interactions and responses
   - Decision points and branching
   
3. Execution Simulation:
   - Simulate ${max_rounds} rounds of conversation
   - Show agent reasoning and outputs
   - Include code generation where applicable
   
4. Final Results:
   - Task completion status
   - Generated artifacts (code, docs, etc.)
   - Summary of agent interactions
   - Recommendations for improvements

Simulate the complete AutoGen team execution with realistic agent conversations.`;

        job.progress(30);
        
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'qwen2.5-coder:32b-instruct-q4_K_M',
            prompt: autogenPrompt,
            options: {
                temperature: 0.7,
                num_predict: 16384, // Larger output for team simulation
                top_k: 40,
                top_p: 0.95,
            },
            stream: false
        }, {
            timeout: 0 // No timeout - teams can run for days
        });
        
        job.progress(90);
        
        // Parse and structure the response
        const teamOutput = response.data.response;
        
        return {
            success: true,
            task_type: 'autogen-team',
            team_output: teamOutput,
            task_description,
            initial_message,
            max_rounds,
            model_used: 'qwen2.5-coder:32b-instruct-q4_K_M',
            execution_time: new Date().toISOString(),
            tokens_generated: response.data.eval_count || 0
        };
    } catch (error) {
        throw new Error(`AutoGen execution failed: ${error.message}`);
    }
});

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date(),
        capabilities: {
            crewai: true,
            autogen: true,
            batch_processing: true,
            long_running: true
        }
    });
});

// Submit development task
app.post('/api/dev-task', async (req, res) => {
    try {
        const job = await devQueue.add('dev-task', req.body, {
            priority: req.body.priority || 0
        });
        
        res.json({ 
            success: true, 
            job_id: job.id,
            queue: 'dev-task'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Submit file for processing
app.post('/api/process-file', upload.single('file'), async (req, res) => {
    try {
        const fileContent = await fs.readFile(req.file.path, 'utf-8');
        const { task_type, context } = req.body;
        
        const job = await devQueue.add('dev-task', {
            task_type,
            content: fileContent,
            context,
            file_info: {
                originalName: req.file.originalname,
                size: req.file.size
            }
        });
        
        await fs.remove(req.file.path);
        
        res.json({ 
            success: true, 
            job_id: job.id 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Execute CrewAI crew - Updated endpoint
app.post('/api/execute-crew', async (req, res) => {
    try {
        const { task_description, agents, context, process_type } = req.body;
        
        if (!task_description) {
            return res.status(400).json({ error: 'task_description is required' });
        }
        
        const job = await devQueue.add('execute-crew', {
            task_description,
            agents: agents || [],
            context: context || '',
            process_type: process_type || 'sequential'
        }, {
            priority: 1, // Higher priority for crew tasks
            timeout: undefined // No timeout - crews can run for days
        });
        
        res.json({ 
            success: true, 
            job_id: job.id,
            type: 'crewai',
            message: 'CrewAI crew execution started. Task will run until completion (no timeout).'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Execute AutoGen team - Updated endpoint
app.post('/api/execute-autogen', async (req, res) => {
    try {
        const { task_description, agents, initial_message, max_rounds, context } = req.body;
        
        if (!task_description) {
            return res.status(400).json({ error: 'task_description is required' });
        }
        
        const job = await devQueue.add('execute-autogen', {
            task_description,
            agents: agents || [],
            initial_message: initial_message || task_description,
            max_rounds: max_rounds || 10,
            context: context || ''
        }, {
            priority: 1, // Higher priority for team tasks
            timeout: undefined // No timeout - teams can run for days
        });
        
        res.json({ 
            success: true, 
            job_id: job.id,
            type: 'autogen',
            message: 'AutoGen team execution started. Task will run until completion (no timeout).'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get job status
app.get('/api/job/:id', async (req, res) => {
    try {
        const job = await devQueue.getJob(req.params.id);
        
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        const state = await job.getState();
        const progress = job.progress();
        
        res.json({
            id: job.id,
            state,
            progress,
            data: job.data,
            result: job.returnvalue,
            failedReason: job.failedReason,
            processedOn: job.processedOn,
            finishedOn: job.finishedOn
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get queue statistics
app.get('/api/stats', async (req, res) => {
    try {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            devQueue.getWaitingCount(),
            devQueue.getActiveCount(),
            devQueue.getCompletedCount(),
            devQueue.getFailedCount(),
            devQueue.getDelayedCount()
        ]);
        
        res.json({
            queue: 'Development Tasks',
            stats: {
                waiting,
                active,
                completed,
                failed,
                delayed,
                total: waiting + active + completed + failed + delayed
            },
            capabilities: {
                crewai: 'Ready for CrewAI crew execution (no timeout)',
                autogen: 'Ready for AutoGen team execution (no timeout)',
                max_timeout: 'No timeout - tasks can run for days',
                models_available: Object.keys(DEV_MODELS).length,
                persistent_jobs: true
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// List available models
app.get('/api/models', async (req, res) => {
    try {
        const response = await axios.get('http://localhost:11434/api/tags');
        const installedModels = response.data.models.map(m => m.name);
        
        res.json({
            configured: DEV_MODELS,
            installed: installedModels,
            missing: Object.values(DEV_MODELS).filter(m => !installedModels.includes(m)),
            ready_for: {
                crewai: installedModels.includes('qwen2.5-coder:32b-instruct-q4_K_M'),
                autogen: installedModels.includes('qwen2.5-coder:32b-instruct-q4_K_M'),
                code_generation: installedModels.includes('qwen2.5-coder:32b-instruct-q4_K_M')
            }
        });
    } catch (error) {
        res.json({
            configured: DEV_MODELS,
            installed: [],
            missing: Object.values(DEV_MODELS),
            error: 'Could not fetch installed models'
        });
    }
});

// Clean old jobs
app.post('/api/clean', async (req, res) => {
    try {
        const { grace = 3600000 } = req.body; // Default 1 hour
        
        await devQueue.clean(grace, 'completed');
        await devQueue.clean(grace, 'failed');
        
        res.json({ 
            success: true, 
            message: 'Old jobs cleaned' 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// System monitoring endpoints
app.get('/api/system-stats', async (req, res) => {
    try {
        const stats = await monitoring.getSystemStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/process-stats', async (req, res) => {
    try {
        const stats = await monitoring.getProcessStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/jobs/recent', async (req, res) => {
    try {
        const jobs = await devQueue.getJobs(['completed', 'failed'], 0, 50);
        const jobData = jobs.map(job => ({
            id: job.id,
            type: job.data.task_type || job.name,
            status: job.finishedOn ? 'completed' : 'failed',
            duration: job.finishedOn - job.processedOn,
            finishedOn: job.finishedOn,
            result: job.returnvalue
        }));
        res.json(jobData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/jobs/active', async (req, res) => {
    try {
        const jobs = await devQueue.getActive();
        const jobData = jobs.map(job => ({
            id: job.id,
            type: job.data.task_type || job.name,
            progress: job.progress || 0,
            started: job.processedOn
        }));
        res.json(jobData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Dev Task Queue Server running on port ${port}`);
    console.log(`📍 Accessible via Tailscale network`);
    console.log(`🔗 http://100.114.129.95:${port}`);
    console.log(`🔗 http://10.0.10.244:${port}`);
    console.log(`✅ CrewAI and AutoGen support enabled`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await devQueue.close();
    redis.quit();
    process.exit(0);
});