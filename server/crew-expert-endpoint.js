/**
 * CrewAI Expert Endpoint Module
 * 
 * Adds intelligent crew creation endpoints to the task queue server
 * This module should be integrated into task-queue-server.js
 */

const CrewAIExpert = require('./crew-expert');

function addCrewExpertEndpoints(app, devQueue) {
    const expert = new CrewAIExpert();

    /**
     * Simple crew request endpoint
     * Takes a simple description and creates an optimized crew
     */
    app.post('/api/crew/simple', async (req, res) => {
        try {
            const { description, context, files, priority } = req.body;

            if (!description) {
                return res.status(400).json({ 
                    error: 'Description is required' 
                });
            }

            // Use expert to generate full crew config
            const crewConfig = expert.generateCrewConfig({
                task_description: description,
                context: context || '',
                files: files || [],
                priority: priority || 'normal',
                requirements: []
            });

            // Submit to queue
            const job = await devQueue.add('expert-crew', {
                type: 'expert-designed-crew',
                config: crewConfig,
                original_request: req.body,
                timestamp: new Date().toISOString()
            }, {
                priority: priority === 'high' ? 1 : priority === 'low' ? 3 : 2,
                removeOnComplete: false,
                removeOnFail: false
            });

            res.json({
                success: true,
                job_id: job.id,
                crew_name: crewConfig.crew_name,
                pattern_used: expert.analyzeRequest({ task_description: description }),
                estimated_time: crewConfig.tasks.reduce((sum, t) => sum + t.max_time, 0),
                message: 'Expert-designed crew has been created and submitted'
            });

        } catch (error) {
            console.error('Crew expert error:', error);
            res.status(500).json({ 
                error: 'Failed to create expert crew',
                details: error.message 
            });
        }
    });

    /**
     * Analyze request endpoint
     * Returns what crew pattern would be used without executing
     */
    app.post('/api/crew/analyze', async (req, res) => {
        try {
            const { description, context, requirements } = req.body;

            if (!description) {
                return res.status(400).json({ 
                    error: 'Description is required' 
                });
            }

            const pattern_key = expert.analyzeRequest({ 
                task_description: description 
            });
            const pattern = expert.patterns[pattern_key];
            
            const config = expert.generateCrewConfig({
                task_description: description,
                context: context || '',
                requirements: requirements || []
            });

            res.json({
                pattern: pattern_key,
                crew_name: pattern.name,
                description: pattern.description,
                agents: config.agents.map(a => ({
                    role: a.role,
                    goal: a.goal,
                    tools: a.tools
                })),
                tasks: config.tasks.map(t => ({
                    id: t.id,
                    description: t.description,
                    estimated_time: t.max_time
                })),
                estimated_total_time: config.tasks.reduce((sum, t) => sum + t.max_time, 0),
                process_type: config.process_type,
                execution_strategy: config.execution_strategy
            });

        } catch (error) {
            console.error('Analysis error:', error);
            res.status(500).json({ 
                error: 'Failed to analyze request',
                details: error.message 
            });
        }
    });

    /**
     * Get available crew patterns
     */
    app.get('/api/crew/patterns', (req, res) => {
        const patterns = Object.entries(expert.patterns).map(([key, pattern]) => ({
            key: key,
            name: pattern.name,
            description: pattern.description,
            agent_count: pattern.agents.length,
            process_type: pattern.process_type,
            use_cases: getUseCases(key)
        }));

        res.json({
            patterns: patterns,
            total: patterns.length
        });
    });

    /**
     * Advanced crew request with full control
     */
    app.post('/api/crew/advanced', async (req, res) => {
        try {
            const {
                task_description,
                context,
                requirements,
                files,
                priority,
                process_type,
                max_iterations,
                custom_agents,
                custom_tasks
            } = req.body;

            if (!task_description) {
                return res.status(400).json({ 
                    error: 'Task description is required' 
                });
            }

            // Generate base config
            let crewConfig = expert.generateCrewConfig({
                task_description,
                context: context || '',
                requirements: requirements || [],
                files: files || [],
                priority: priority || 'normal',
                process_type: process_type,
                max_iterations: max_iterations || 10
            });

            // Apply custom agents if provided
            if (custom_agents && custom_agents.length > 0) {
                crewConfig.agents = mergeAgents(crewConfig.agents, custom_agents);
            }

            // Apply custom tasks if provided
            if (custom_tasks && custom_tasks.length > 0) {
                crewConfig.tasks = mergeTasks(crewConfig.tasks, custom_tasks);
            }

            // Submit to queue
            const job = await devQueue.add('expert-crew-advanced', {
                type: 'expert-designed-crew-advanced',
                config: crewConfig,
                original_request: req.body,
                timestamp: new Date().toISOString()
            }, {
                priority: priority === 'high' ? 1 : priority === 'low' ? 3 : 2,
                removeOnComplete: false,
                removeOnFail: false
            });

            res.json({
                success: true,
                job_id: job.id,
                crew_name: crewConfig.crew_name,
                agent_count: crewConfig.agents.length,
                task_count: crewConfig.tasks.length,
                estimated_time: crewConfig.tasks.reduce((sum, t) => sum + t.max_time, 0),
                message: 'Advanced expert crew created and submitted'
            });

        } catch (error) {
            console.error('Advanced crew error:', error);
            res.status(500).json({ 
                error: 'Failed to create advanced crew',
                details: error.message 
            });
        }
    });

    /**
     * Get crew execution status with detailed progress
     */
    app.get('/api/crew/status/:jobId', async (req, res) => {
        try {
            const job = await devQueue.getJob(req.params.jobId);
            
            if (!job) {
                return res.status(404).json({ 
                    error: 'Job not found' 
                });
            }

            const state = await job.getState();
            const progress = job.progress();
            const logs = job.logs || [];

            // Extract crew-specific information
            const crewInfo = job.data.config ? {
                crew_name: job.data.config.crew_name,
                agents: job.data.config.agents.map(a => a.role),
                current_task: getCurrentTask(progress, job.data.config.tasks),
                completed_tasks: getCompletedTasks(progress, job.data.config.tasks)
            } : {};

            res.json({
                job_id: job.id,
                state: state,
                progress: progress,
                crew_info: crewInfo,
                logs: logs.slice(-10), // Last 10 log entries
                created_at: new Date(job.timestamp).toISOString(),
                updated_at: job.processedOn ? new Date(job.processedOn).toISOString() : null,
                finished_at: job.finishedOn ? new Date(job.finishedOn).toISOString() : null
            });

        } catch (error) {
            console.error('Status error:', error);
            res.status(500).json({ 
                error: 'Failed to get crew status',
                details: error.message 
            });
        }
    });
}

// Helper functions
function getUseCases(pattern_key) {
    const use_cases = {
        'code-review': [
            'Pull request reviews',
            'Security audits',
            'Code quality assessment',
            'Technical debt analysis'
        ],
        'api-development': [
            'REST API creation',
            'GraphQL schema design',
            'Microservice development',
            'API documentation'
        ],
        'debugging': [
            'Bug investigation',
            'Performance issues',
            'Memory leaks',
            'Race conditions'
        ],
        'architecture-design': [
            'System design',
            'Scalability planning',
            'Technology selection',
            'Migration planning'
        ],
        'data-analysis': [
            'Business intelligence',
            'Predictive modeling',
            'Data visualization',
            'Trend analysis'
        ],
        'refactoring': [
            'Legacy code modernization',
            'Performance optimization',
            'Code structure improvement',
            'Design pattern implementation'
        ],
        'nist-compliance': [
            'NIST CSF implementation',
            'NIST 800-53 control assessment',
            'NIST 800-171 compliance for CUI',
            'Risk Management Framework (RMF)',
            'FedRAMP preparation',
            'Security control validation',
            'Continuous monitoring setup',
            'POA&M development'
        ],
        'cmmc-compliance': [
            'CMMC Level 1-3 assessment',
            'CUI protection implementation',
            'DFARS compliance',
            'DoD contractor certification',
            'Supply chain security',
            'Incident response planning',
            'Evidence package preparation',
            'Gap remediation roadmap'
        ]
    };

    return use_cases[pattern_key] || [];
}

function mergeAgents(baseAgents, customAgents) {
    // Merge custom agents with base agents
    const merged = [...baseAgents];
    
    customAgents.forEach(custom => {
        const existing = merged.findIndex(a => a.role === custom.role);
        if (existing >= 0) {
            // Merge properties
            merged[existing] = { ...merged[existing], ...custom };
        } else {
            // Add new agent
            merged.push(custom);
        }
    });

    return merged;
}

function mergeTasks(baseTasks, customTasks) {
    // Merge custom tasks with base tasks
    const merged = [...baseTasks];
    
    customTasks.forEach(custom => {
        const existing = merged.findIndex(t => t.id === custom.id);
        if (existing >= 0) {
            // Merge properties
            merged[existing] = { ...merged[existing], ...custom };
        } else {
            // Add new task
            merged.push(custom);
        }
    });

    return merged;
}

function getCurrentTask(progress, tasks) {
    if (!tasks || tasks.length === 0) return null;
    
    const taskIndex = Math.floor((progress / 100) * tasks.length);
    return tasks[Math.min(taskIndex, tasks.length - 1)];
}

function getCompletedTasks(progress, tasks) {
    if (!tasks || tasks.length === 0) return [];
    
    const completedCount = Math.floor((progress / 100) * tasks.length);
    return tasks.slice(0, completedCount).map(t => t.id);
}

module.exports = { addCrewExpertEndpoints };