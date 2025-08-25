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

    'crewai-crew': `Design and coordinate a CrewAI crew for:

Task: {code}
Context: {context}

Define agents, roles, and workflow.`,

    'autogen-team': `Design and coordinate an AutoGen team for:

Task: {code}
Context: {context}

Define agents, communication patterns, and execution flow.`
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
    const { agents, tasks, process_type = 'sequential' } = job.data;
    
    try {
        // Implementation would integrate with actual CrewAI Python backend
        job.progress(50);
        
        return {
            success: true,
            message: 'CrewAI crew execution would be processed here',
            agents: agents.length,
            tasks: tasks.length,
            process_type
        };
    } catch (error) {
        throw new Error(`CrewAI execution failed: ${error.message}`);
    }
});

// Process AutoGen team executions  
devQueue.process('execute-autogen', async (job) => {
    const { agents, initial_message, max_rounds = 10 } = job.data;
    
    try {
        // Implementation would integrate with actual AutoGen Python backend
        job.progress(50);
        
        return {
            success: true,
            message: 'AutoGen team execution would be processed here',
            agents: agents.length,
            max_rounds
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
        timestamp: new Date()
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

// Execute CrewAI crew
app.post('/api/execute-crew', async (req, res) => {
    try {
        const job = await devQueue.add('execute-crew', req.body);
        res.json({ 
            success: true, 
            job_id: job.id,
            type: 'crewai'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Execute AutoGen team
app.post('/api/execute-autogen', async (req, res) => {
    try {
        const job = await devQueue.add('execute-autogen', req.body);
        res.json({ 
            success: true, 
            job_id: job.id,
            type: 'autogen'
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
            missing: Object.values(DEV_MODELS).filter(m => !installedModels.includes(m))
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

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Dev Task Queue Server running on port ${port}`);
    console.log(`📍 Accessible via Tailscale network`);
    console.log(`🔗 http://100.114.129.95:${port}`);
    console.log(`🔗 http://10.0.10.244:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await devQueue.close();
    redis.quit();
    process.exit(0);
});