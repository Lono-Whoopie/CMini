/**
 * CrewAI Expert Service
 * 
 * This service acts as an intelligent crew designer that takes simple requests
 * and creates optimized, detailed CrewAI configurations with proper agent roles,
 * tools, tasks, and execution strategies.
 */

const CREW_PATTERNS = {
    // Software Development Patterns
    'code-review': {
        name: 'Code Review Crew',
        description: 'Comprehensive code review with security, performance, and quality analysis',
        agents: [
            {
                role: 'Security Auditor',
                goal: 'Identify security vulnerabilities and compliance issues',
                backstory: 'Expert in OWASP Top 10, secure coding practices, and threat modeling with 15 years of security research experience',
                tools: ['code_analyzer', 'vulnerability_scanner', 'dependency_checker'],
                capabilities: ['static analysis', 'SAST scanning', 'CVE checking']
            },
            {
                role: 'Performance Engineer',
                goal: 'Analyze code performance, identify bottlenecks, and suggest optimizations',
                backstory: 'Specialized in algorithm optimization, caching strategies, and performance profiling with experience in high-scale systems',
                tools: ['profiler', 'complexity_analyzer', 'benchmark_runner'],
                capabilities: ['Big-O analysis', 'memory profiling', 'query optimization']
            },
            {
                role: 'Code Quality Specialist',
                goal: 'Ensure code maintainability, readability, and adherence to best practices',
                backstory: 'Passionate about clean code, design patterns, and technical debt reduction with expertise in multiple programming paradigms',
                tools: ['linter', 'code_formatter', 'documentation_checker'],
                capabilities: ['SOLID principles', 'design pattern detection', 'refactoring suggestions']
            },
            {
                role: 'Test Coverage Analyst',
                goal: 'Evaluate test coverage and suggest comprehensive test scenarios',
                backstory: 'Expert in TDD, BDD, and various testing methodologies with focus on edge cases and integration testing',
                tools: ['coverage_analyzer', 'test_generator', 'mutation_tester'],
                capabilities: ['unit test generation', 'integration test design', 'edge case identification']
            }
        ],
        process_type: 'hierarchical',
        manager_llm: 'qwen2.5-coder:32b-instruct-q4_K_M',
        agent_llm: 'qwen2.5-coder:14b-instruct-q4_K_M'
    },

    'api-development': {
        name: 'API Development Crew',
        description: 'Design and implement REST/GraphQL APIs with full documentation',
        agents: [
            {
                role: 'API Architect',
                goal: 'Design scalable, RESTful API architecture following best practices',
                backstory: 'Experienced in microservices, API gateway patterns, and distributed systems with focus on scalability',
                tools: ['openapi_designer', 'schema_validator', 'api_blueprint'],
                capabilities: ['REST principles', 'GraphQL schema design', 'versioning strategies']
            },
            {
                role: 'Backend Developer',
                goal: 'Implement robust API endpoints with proper error handling and validation',
                backstory: 'Full-stack developer specialized in Node.js, Python, and database design with emphasis on performance',
                tools: ['code_generator', 'orm_builder', 'migration_creator'],
                capabilities: ['CRUD operations', 'authentication', 'rate limiting', 'caching']
            },
            {
                role: 'Documentation Writer',
                goal: 'Create comprehensive API documentation with examples and tutorials',
                backstory: 'Technical writer focused on developer experience with expertise in OpenAPI, Postman, and interactive docs',
                tools: ['swagger_generator', 'postman_collection', 'markdown_editor'],
                capabilities: ['OpenAPI spec', 'example generation', 'tutorial writing']
            },
            {
                role: 'Integration Tester',
                goal: 'Design and execute comprehensive API test suites',
                backstory: 'QA engineer specialized in API testing, contract testing, and load testing',
                tools: ['postman', 'newman', 'k6_load_tester'],
                capabilities: ['endpoint testing', 'load testing', 'contract testing']
            }
        ],
        process_type: 'sequential',
        manager_llm: 'qwen2.5-coder:32b-instruct-q4_K_M',
        agent_llm: 'qwen2.5-coder:14b-instruct-q4_K_M'
    },

    'debugging': {
        name: 'Debugging Crew',
        description: 'Systematic debugging and root cause analysis',
        agents: [
            {
                role: 'Bug Investigator',
                goal: 'Reproduce bugs and gather diagnostic information',
                backstory: 'Expert debugger with deep knowledge of debugging tools and techniques across multiple platforms',
                tools: ['debugger', 'log_analyzer', 'trace_collector'],
                capabilities: ['stack trace analysis', 'memory dump analysis', 'log correlation']
            },
            {
                role: 'Root Cause Analyst',
                goal: 'Identify the fundamental cause of issues through systematic analysis',
                backstory: 'Systems thinker with expertise in failure analysis and post-mortem processes',
                tools: ['dependency_graph', 'call_graph', 'data_flow_analyzer'],
                capabilities: ['5-whys analysis', 'fishbone diagrams', 'timeline reconstruction']
            },
            {
                role: 'Solution Developer',
                goal: 'Develop and validate fixes for identified issues',
                backstory: 'Senior developer experienced in hotfixes, patches, and long-term solutions',
                tools: ['code_editor', 'test_runner', 'regression_tester'],
                capabilities: ['patch development', 'fix validation', 'regression prevention']
            }
        ],
        process_type: 'sequential',
        manager_llm: 'qwen2.5-coder:32b-instruct-q4_K_M',
        agent_llm: 'qwen2.5-coder:14b-instruct-q4_K_M'
    },

    'architecture-design': {
        name: 'Architecture Design Crew',
        description: 'System architecture design and technical decision making',
        agents: [
            {
                role: 'Solution Architect',
                goal: 'Design high-level system architecture and component interactions',
                backstory: 'Enterprise architect with 20 years designing scalable distributed systems',
                tools: ['diagramming_tool', 'architecture_patterns', 'cost_calculator'],
                capabilities: ['microservices', 'event-driven', 'serverless', 'cloud-native']
            },
            {
                role: 'Database Architect',
                goal: 'Design optimal data models and storage strategies',
                backstory: 'Data architect expert in SQL, NoSQL, and distributed databases',
                tools: ['er_designer', 'query_optimizer', 'migration_planner'],
                capabilities: ['normalization', 'sharding', 'replication', 'CAP theorem']
            },
            {
                role: 'Infrastructure Engineer',
                goal: 'Design cloud infrastructure and deployment strategies',
                backstory: 'DevOps expert in Kubernetes, Terraform, and cloud platforms',
                tools: ['terraform', 'kubernetes_yaml', 'ci_cd_pipeline'],
                capabilities: ['IaC', 'container orchestration', 'auto-scaling', 'monitoring']
            },
            {
                role: 'Security Architect',
                goal: 'Ensure security is built into the architecture',
                backstory: 'Security architect focused on zero-trust and defense in depth',
                tools: ['threat_modeler', 'security_scanner', 'compliance_checker'],
                capabilities: ['threat modeling', 'encryption', 'authentication', 'authorization']
            }
        ],
        process_type: 'hierarchical',
        manager_llm: 'qwen2.5-coder:32b-instruct-q4_K_M',
        agent_llm: 'qwen2.5-coder:14b-instruct-q4_K_M'
    },

    'data-analysis': {
        name: 'Data Analysis Crew',
        description: 'Comprehensive data analysis, visualization, and insights',
        agents: [
            {
                role: 'Data Scientist',
                goal: 'Perform statistical analysis and build predictive models',
                backstory: 'PhD in statistics with expertise in machine learning and data mining',
                tools: ['python_notebook', 'scikit_learn', 'tensorflow'],
                capabilities: ['regression', 'classification', 'clustering', 'time series']
            },
            {
                role: 'Data Engineer',
                goal: 'Build data pipelines and ensure data quality',
                backstory: 'Expert in ETL, data warehousing, and real-time processing',
                tools: ['apache_spark', 'airflow', 'sql_engine'],
                capabilities: ['ETL', 'data cleaning', 'stream processing', 'data validation']
            },
            {
                role: 'Visualization Specialist',
                goal: 'Create insightful dashboards and reports',
                backstory: 'Data visualization expert with UX design background',
                tools: ['plotly', 'tableau', 'd3js'],
                capabilities: ['dashboard design', 'interactive viz', 'storytelling']
            },
            {
                role: 'Business Analyst',
                goal: 'Translate data insights into business recommendations',
                backstory: 'MBA with experience bridging technical and business teams',
                tools: ['excel', 'powerbi', 'report_builder'],
                capabilities: ['KPI definition', 'ROI analysis', 'strategic recommendations']
            }
        ],
        process_type: 'sequential',
        manager_llm: 'qwen2.5-coder:32b-instruct-q4_K_M',
        agent_llm: 'qwen2.5-coder:14b-instruct-q4_K_M'
    },

    'refactoring': {
        name: 'Code Refactoring Crew',
        description: 'Systematic code refactoring and technical debt reduction',
        agents: [
            {
                role: 'Refactoring Strategist',
                goal: 'Identify refactoring opportunities and create migration plan',
                backstory: 'Expert in design patterns and evolutionary architecture',
                tools: ['code_analyzer', 'dependency_mapper', 'complexity_meter'],
                capabilities: ['pattern detection', 'smell identification', 'impact analysis']
            },
            {
                role: 'Refactoring Developer',
                goal: 'Execute refactoring while maintaining functionality',
                backstory: 'Senior developer specialized in large-scale refactoring projects',
                tools: ['ide_refactoring', 'ast_manipulator', 'test_harness'],
                capabilities: ['extract method', 'move class', 'introduce pattern']
            },
            {
                role: 'Test Engineer',
                goal: 'Ensure refactoring doesn't break existing functionality',
                backstory: 'QA expert in regression testing and test automation',
                tools: ['test_runner', 'mutation_testing', 'coverage_tool'],
                capabilities: ['regression testing', 'characterization tests', 'golden master']
            }
        ],
        process_type: 'sequential',
        manager_llm: 'qwen2.5-coder:32b-instruct-q4_K_M',
        agent_llm: 'qwen2.5-coder:14b-instruct-q4_K_M'
    },

    'nist-compliance': {
        name: 'NIST Cybersecurity Framework Compliance Crew',
        description: 'Comprehensive NIST CSF assessment and implementation guidance',
        agents: [
            {
                role: 'NIST Framework Specialist',
                goal: 'Assess current state against NIST CSF and identify gaps',
                backstory: 'Certified cybersecurity professional with 10+ years implementing NIST frameworks including CSF, 800-53, 800-171, and RMF. Expert in translating technical controls to business requirements',
                tools: ['nist_csf_mapper', 'control_assessor', 'gap_analyzer', 'rmf_toolkit'],
                capabilities: ['CSF mapping', 'control assessment', 'maturity scoring', 'risk assessment', 'implementation roadmap']
            },
            {
                role: 'Control Implementation Engineer',
                goal: 'Design and implement technical controls to meet NIST requirements',
                backstory: 'Security engineer specialized in implementing NIST 800-53 controls, with expertise in cloud security, zero trust architecture, and security automation',
                tools: ['control_automation', 'policy_engine', 'compliance_scanner', 'security_orchestrator'],
                capabilities: ['technical controls', 'security automation', 'policy as code', 'continuous monitoring', 'control validation']
            },
            {
                role: 'Risk Management Analyst',
                goal: 'Perform risk assessments and develop risk management strategies per NIST RMF',
                backstory: 'Risk management professional certified in NIST RMF, FAIR, and ISO 31000 with experience in quantitative risk analysis and executive risk reporting',
                tools: ['risk_calculator', 'threat_modeler', 'vulnerability_assessor', 'risk_register'],
                capabilities: ['risk scoring', 'threat modeling', 'vulnerability assessment', 'risk mitigation', 'residual risk analysis']
            },
            {
                role: 'Compliance Documentation Specialist',
                goal: 'Create comprehensive compliance documentation and evidence packages',
                backstory: 'Technical writer specialized in cybersecurity compliance with experience preparing for audits, creating SSPs, POA&Ms, and executive compliance reports',
                tools: ['ssp_generator', 'poam_tracker', 'evidence_collector', 'audit_reporter'],
                capabilities: ['SSP creation', 'POA&M management', 'evidence collection', 'audit preparation', 'compliance reporting']
            },
            {
                role: 'Continuous Monitoring Architect',
                goal: 'Establish continuous monitoring and metrics per NIST guidelines',
                backstory: 'DevSecOps expert focused on implementing NIST continuous monitoring strategies, security metrics, and automated compliance validation',
                tools: ['siem_integrator', 'metrics_dashboard', 'compliance_monitor', 'alert_manager'],
                capabilities: ['continuous monitoring', 'security metrics', 'KPI/KRI development', 'automated alerting', 'trend analysis']
            }
        ],
        process_type: 'hierarchical',
        manager_llm: 'qwen2.5-coder:32b-instruct-q4_K_M',
        agent_llm: 'qwen2.5-coder:14b-instruct-q4_K_M'
    },

    'cmmc-compliance': {
        name: 'CMMC Assessment and Implementation Crew',
        description: 'CMMC Level 1-3 assessment, gap analysis, and implementation roadmap',
        agents: [
            {
                role: 'CMMC Lead Assessor',
                goal: 'Conduct CMMC assessment and determine current maturity level',
                backstory: 'Certified CMMC Lead Assessor with experience conducting 100+ assessments across all CMMC levels. Expert in DoD requirements, DFARS clauses, and CUI handling',
                tools: ['cmmc_assessor', 'practice_evaluator', 'maturity_scorer', 'evidence_validator'],
                capabilities: ['CMMC assessment', 'practice evaluation', 'maturity scoring', 'gap identification', 'remediation planning']
            },
            {
                role: 'CUI Protection Specialist',
                goal: 'Implement controls for Controlled Unclassified Information protection',
                backstory: 'Security architect specialized in CUI protection, FIPS 140-2 encryption, and data classification with deep knowledge of NIST 800-171 and DFARS 252.204-7012',
                tools: ['cui_scanner', 'encryption_validator', 'data_classifier', 'flow_mapper'],
                capabilities: ['CUI identification', 'data classification', 'encryption implementation', 'data flow mapping', 'boundary protection']
            },
            {
                role: 'CMMC Practice Implementation Lead',
                goal: 'Implement all required CMMC practices across domains',
                backstory: 'Implementation specialist with expertise in all 17 CMMC domains, having successfully guided 50+ organizations through CMMC certification',
                tools: ['practice_implementer', 'control_deployer', 'configuration_manager', 'hardening_toolkit'],
                capabilities: ['practice implementation', 'control deployment', 'system hardening', 'configuration management', 'technical implementation']
            },
            {
                role: 'Supply Chain Security Analyst',
                goal: 'Assess and secure the Defense Industrial Base supply chain',
                backstory: 'Supply chain security expert focused on flow-down requirements, vendor risk management, and ensuring CMMC compliance across subcontractors',
                tools: ['vendor_assessor', 'flowdown_tracker', 'supply_chain_mapper', 'risk_aggregator'],
                capabilities: ['vendor assessment', 'flow-down management', 'supply chain mapping', 'third-party risk', 'vendor compliance']
            },
            {
                role: 'CMMC Documentation Manager',
                goal: 'Prepare all required CMMC documentation and evidence',
                backstory: 'Documentation expert specialized in System Security Plans, POA&Ms, network diagrams, and evidence packages for CMMC assessments',
                tools: ['ssp_builder', 'diagram_generator', 'evidence_packager', 'artifact_manager'],
                capabilities: ['SSP development', 'network documentation', 'evidence packaging', 'artifact management', 'assessment preparation']
            },
            {
                role: 'Incident Response Coordinator',
                goal: 'Establish CMMC-compliant incident response capabilities',
                backstory: 'Incident response expert with focus on DoD reporting requirements, forensics for CUI environments, and DFARS-compliant breach procedures',
                tools: ['ir_planner', 'forensics_toolkit', 'breach_reporter', 'response_orchestrator'],
                capabilities: ['IR planning', 'forensics', 'breach response', 'DoD reporting', 'tabletop exercises']
            }
        ],
        process_type: 'hierarchical',
        manager_llm: 'qwen2.5-coder:32b-instruct-q4_K_M',
        agent_llm: 'qwen2.5-coder:14b-instruct-q4_K_M'
    }
};

class CrewAIExpert {
    constructor() {
        this.patterns = CREW_PATTERNS;
    }

    /**
     * Analyze request and determine best crew pattern
     */
    analyzeRequest(request) {
        const { task_description, context, requirements } = request;
        
        // Keywords for pattern matching
        const patterns = {
            'code-review': ['review', 'audit', 'quality', 'security check', 'analyze code'],
            'api-development': ['api', 'rest', 'graphql', 'endpoint', 'microservice'],
            'debugging': ['bug', 'fix', 'error', 'crash', 'debug', 'troubleshoot'],
            'architecture-design': ['architecture', 'design', 'system', 'scalability', 'infrastructure'],
            'data-analysis': ['data', 'analysis', 'visualization', 'insights', 'analytics'],
            'refactoring': ['refactor', 'cleanup', 'technical debt', 'restructure', 'modernize'],
            'nist-compliance': ['nist', 'csf', 'cybersecurity framework', '800-53', '800-171', 'rmf', 'risk management framework', 'controls assessment', 'compliance audit'],
            'cmmc-compliance': ['cmmc', 'cui', 'controlled unclassified', 'dfars', 'dod', 'defense', 'level 1', 'level 2', 'level 3', 'maturity model', 'supply chain security']
        };

        const description_lower = task_description.toLowerCase();
        let bestMatch = null;
        let highestScore = 0;

        for (const [pattern, keywords] of Object.entries(patterns)) {
            let score = 0;
            for (const keyword of keywords) {
                if (description_lower.includes(keyword)) {
                    score += 1;
                }
            }
            if (score > highestScore) {
                highestScore = score;
                bestMatch = pattern;
            }
        }

        return bestMatch || 'code-review'; // Default to code review
    }

    /**
     * Generate detailed crew configuration
     */
    generateCrewConfig(request) {
        const { 
            task_description, 
            context = '', 
            requirements = [],
            files = [],
            priority = 'normal',
            max_iterations = 10,
            process_type = null 
        } = request;

        // Determine best pattern
        const pattern_key = this.analyzeRequest(request);
        const pattern = this.patterns[pattern_key];

        // Build detailed task list based on pattern and request
        const tasks = this.generateTasks(pattern, task_description, context, requirements);

        // Customize agents based on specific requirements
        const agents = this.customizeAgents(pattern.agents, context, requirements);

        // Generate crew configuration
        const config = {
            crew_name: `${pattern.name} - ${new Date().toISOString()}`,
            description: pattern.description,
            task_description: task_description,
            context: this.enrichContext(context, files, requirements),
            agents: agents,
            tasks: tasks,
            process_type: process_type || pattern.process_type,
            manager_llm: pattern.manager_llm,
            agent_llm: pattern.agent_llm,
            max_iterations: max_iterations,
            priority: priority,
            delegation: true,
            verbose: true,
            memory: true,
            cache: true,
            max_rpm: 20,
            share_crew: false,
            output_format: 'structured',
            callbacks: {
                on_task_complete: 'log_progress',
                on_agent_finish: 'save_output',
                on_crew_complete: 'generate_report'
            },
            tools_config: this.generateToolsConfig(pattern_key),
            execution_strategy: this.determineExecutionStrategy(pattern_key, priority)
        };

        return config;
    }

    /**
     * Generate specific tasks based on pattern and request
     */
    generateTasks(pattern, task_description, context, requirements) {
        const tasks = [];
        
        // Create tasks for each agent
        pattern.agents.forEach((agent, index) => {
            const task = {
                id: `task_${index + 1}`,
                description: `${agent.role}: ${this.generateTaskDescription(agent, task_description)}`,
                agent: agent.role,
                dependencies: index > 0 ? [`task_${index}`] : [],
                expected_output: this.generateExpectedOutput(agent.role, pattern.name),
                tools: agent.tools,
                context_variables: ['task_description', 'requirements', 'previous_outputs'],
                max_time: this.estimateTaskTime(agent.role),
                retry_on_failure: true,
                max_retries: 3
            };
            tasks.push(task);
        });

        // Add synthesis task
        tasks.push({
            id: `task_synthesis`,
            description: 'Synthesize all findings and create comprehensive report',
            agent: pattern.agents[0].role, // Lead agent does synthesis
            dependencies: tasks.map(t => t.id),
            expected_output: 'Comprehensive report with all findings, recommendations, and action items',
            tools: ['report_generator', 'markdown_formatter'],
            context_variables: ['all_outputs'],
            max_time: 600,
            retry_on_failure: false
        });

        return tasks;
    }

    /**
     * Customize agents based on specific requirements
     */
    customizeAgents(base_agents, context, requirements) {
        return base_agents.map(agent => {
            const customized = { ...agent };
            
            // Add context-specific expertise
            if (context.includes('Python')) {
                customized.backstory += ' Specialized in Python ecosystem.';
                customized.tools.push('python_analyzer');
            }
            if (context.includes('JavaScript') || context.includes('TypeScript')) {
                customized.backstory += ' Expert in JavaScript/TypeScript.';
                customized.tools.push('eslint', 'typescript_compiler');
            }
            if (context.includes('cloud') || context.includes('AWS')) {
                customized.backstory += ' Experienced with cloud platforms.';
                customized.tools.push('cloud_cost_analyzer');
            }
            
            // Add requirement-specific capabilities
            requirements.forEach(req => {
                if (req.toLowerCase().includes('performance')) {
                    customized.capabilities.push('performance optimization');
                }
                if (req.toLowerCase().includes('security')) {
                    customized.capabilities.push('security hardening');
                }
            });

            // Add collaboration instructions
            customized.collaboration = {
                share_findings: true,
                request_clarification: true,
                provide_feedback: true,
                delegation_enabled: true
            };

            return customized;
        });
    }

    /**
     * Enrich context with additional information
     */
    enrichContext(context, files, requirements) {
        let enriched = context;
        
        if (files && files.length > 0) {
            enriched += `\n\nFiles to analyze: ${files.join(', ')}`;
        }
        
        if (requirements && requirements.length > 0) {
            enriched += `\n\nSpecific requirements:\n${requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
        }
        
        // Add best practices reminder
        enriched += `\n\nRemember to follow best practices, document findings clearly, and provide actionable recommendations.`;
        
        return enriched;
    }

    /**
     * Generate task description based on agent role
     */
    generateTaskDescription(agent, main_task) {
        const role_tasks = {
            'Security Auditor': 'Perform security analysis and identify vulnerabilities in',
            'Performance Engineer': 'Analyze performance characteristics and optimization opportunities for',
            'Code Quality Specialist': 'Review code quality and maintainability of',
            'Test Coverage Analyst': 'Evaluate test coverage and testing strategies for',
            'API Architect': 'Design API structure and contracts for',
            'Backend Developer': 'Implement backend logic for',
            'Documentation Writer': 'Create comprehensive documentation for',
            'Bug Investigator': 'Investigate and reproduce issues in',
            'Root Cause Analyst': 'Identify root causes of problems in',
            'Solution Developer': 'Develop solutions for issues found in',
            'Solution Architect': 'Design overall architecture for',
            'Database Architect': 'Design data model and storage strategy for',
            'Infrastructure Engineer': 'Plan infrastructure and deployment for',
            'Data Scientist': 'Perform statistical analysis on',
            'Data Engineer': 'Build data pipeline for',
            'Visualization Specialist': 'Create visualizations for',
            'Business Analyst': 'Provide business insights from',
            'Refactoring Strategist': 'Plan refactoring strategy for',
            'Refactoring Developer': 'Execute refactoring of',
            'Test Engineer': 'Ensure quality and test coverage for'
        };

        return `${role_tasks[agent.role] || 'Work on'} ${main_task}`;
    }

    /**
     * Generate expected output format for each role
     */
    generateExpectedOutput(role, crew_type) {
        const outputs = {
            'Security Auditor': {
                format: 'markdown',
                sections: ['vulnerabilities', 'risk_assessment', 'recommendations', 'compliance_check']
            },
            'Performance Engineer': {
                format: 'json',
                metrics: ['response_time', 'throughput', 'resource_usage', 'bottlenecks']
            },
            'Code Quality Specialist': {
                format: 'markdown',
                sections: ['code_smells', 'design_patterns', 'maintainability_index', 'suggestions']
            },
            'API Architect': {
                format: 'openapi',
                includes: ['endpoints', 'schemas', 'authentication', 'versioning']
            },
            'Backend Developer': {
                format: 'code',
                deliverables: ['implementation', 'tests', 'migrations', 'config']
            },
            'Documentation Writer': {
                format: 'markdown',
                sections: ['overview', 'api_reference', 'examples', 'tutorials']
            },
            'NIST Framework Specialist': {
                format: 'structured',
                sections: ['gap_analysis', 'control_mappings', 'maturity_scores', 'remediation_roadmap']
            },
            'Control Implementation Engineer': {
                format: 'json',
                deliverables: ['technical_controls', 'automation_scripts', 'validation_results']
            },
            'Risk Management Analyst': {
                format: 'structured',
                elements: ['risk_register', 'threat_models', 'mitigation_strategies', 'residual_risks']
            },
            'CMMC Lead Assessor': {
                format: 'structured',
                components: ['assessment_results', 'maturity_levels', 'gap_findings', 'remediation_plan']
            },
            'CUI Protection Specialist': {
                format: 'technical',
                outputs: ['cui_inventory', 'encryption_status', 'data_flows', 'boundary_definitions']
            },
            'Supply Chain Security Analyst': {
                format: 'structured',
                reports: ['vendor_assessments', 'flowdown_requirements', 'risk_aggregation', 'compliance_status']
            }
        };

        return outputs[role] || { format: 'markdown', sections: ['analysis', 'findings', 'recommendations'] };
    }

    /**
     * Estimate task completion time based on role
     */
    estimateTaskTime(role) {
        const times = {
            'Security Auditor': 900,
            'Performance Engineer': 600,
            'Code Quality Specialist': 450,
            'Test Coverage Analyst': 450,
            'API Architect': 600,
            'Backend Developer': 1200,
            'Documentation Writer': 600,
            'Bug Investigator': 450,
            'Root Cause Analyst': 600,
            'Solution Developer': 900,
            'Solution Architect': 750,
            'Database Architect': 600,
            'Infrastructure Engineer': 600,
            'Data Scientist': 900,
            'Data Engineer': 750,
            'Visualization Specialist': 450,
            'Business Analyst': 450,
            'Refactoring Strategist': 600,
            'Refactoring Developer': 900,
            'Test Engineer': 600,
            // NIST Compliance roles
            'NIST Framework Specialist': 1200,
            'Control Implementation Engineer': 900,
            'Risk Management Analyst': 750,
            'Compliance Documentation Specialist': 900,
            'Continuous Monitoring Architect': 600,
            // CMMC Compliance roles
            'CMMC Lead Assessor': 1500,
            'CUI Protection Specialist': 900,
            'CMMC Practice Implementation Lead': 1200,
            'Supply Chain Security Analyst': 900,
            'CMMC Documentation Manager': 900,
            'Incident Response Coordinator': 750
        };

        return times[role] || 600; // Default 10 minutes
    }

    /**
     * Generate tools configuration
     */
    generateToolsConfig(pattern_key) {
        const configs = {
            'code-review': {
                code_analyzer: { enabled: true, depth: 'deep' },
                vulnerability_scanner: { enabled: true, rules: 'owasp-top-10' },
                linter: { enabled: true, config: 'strict' }
            },
            'api-development': {
                openapi_designer: { enabled: true, version: '3.1.0' },
                code_generator: { enabled: true, framework: 'express' },
                postman: { enabled: true, auto_generate: true }
            },
            'debugging': {
                debugger: { enabled: true, breakpoints: 'auto' },
                log_analyzer: { enabled: true, correlation: true },
                trace_collector: { enabled: true, depth: 'full' }
            },
            'architecture-design': {
                diagramming_tool: { enabled: true, format: 'plantuml' },
                cost_calculator: { enabled: true, providers: ['aws', 'gcp', 'azure'] },
                threat_modeler: { enabled: true, framework: 'stride' }
            },
            'data-analysis': {
                python_notebook: { enabled: true, kernel: 'python3' },
                scikit_learn: { enabled: true, auto_select: true },
                plotly: { enabled: true, interactive: true }
            },
            'refactoring': {
                code_analyzer: { enabled: true, metrics: ['complexity', 'coupling', 'cohesion'] },
                ast_manipulator: { enabled: true, safe_mode: true },
                test_runner: { enabled: true, continuous: true }
            },
            'nist-compliance': {
                nist_csf_mapper: { enabled: true, framework_version: '2.0' },
                control_assessor: { enabled: true, standards: ['800-53', '800-171', 'CSF'] },
                gap_analyzer: { enabled: true, scoring_method: 'maturity' },
                risk_calculator: { enabled: true, methodology: 'FAIR' },
                compliance_monitor: { enabled: true, continuous: true },
                evidence_collector: { enabled: true, automated: true }
            },
            'cmmc-compliance': {
                cmmc_assessor: { enabled: true, version: '2.0', levels: [1, 2, 3] },
                practice_evaluator: { enabled: true, domains: 17 },
                cui_scanner: { enabled: true, classification_rules: 'NIST_800-171' },
                encryption_validator: { enabled: true, standard: 'FIPS_140-2' },
                vendor_assessor: { enabled: true, flowdown_tracking: true },
                evidence_packager: { enabled: true, format: 'CMMC_AB_standard' }
            }
        };

        return configs[pattern_key] || {};
    }

    /**
     * Determine execution strategy based on pattern and priority
     */
    determineExecutionStrategy(pattern_key, priority) {
        const strategies = {
            'high': {
                parallel_tasks: 4,
                timeout_multiplier: 1.5,
                retry_strategy: 'exponential_backoff',
                resource_allocation: 'maximum'
            },
            'normal': {
                parallel_tasks: 2,
                timeout_multiplier: 1.0,
                retry_strategy: 'linear',
                resource_allocation: 'balanced'
            },
            'low': {
                parallel_tasks: 1,
                timeout_multiplier: 0.8,
                retry_strategy: 'simple',
                resource_allocation: 'minimal'
            }
        };

        return strategies[priority] || strategies['normal'];
    }

    /**
     * Generate simple-to-expert request mapping
     */
    simplifyRequest(simple_request) {
        // Map simple requests to detailed configurations
        const mappings = {
            'review this code': {
                pattern: 'code-review',
                focus: ['security', 'performance', 'quality']
            },
            'build an api': {
                pattern: 'api-development',
                focus: ['design', 'implementation', 'documentation']
            },
            'fix this bug': {
                pattern: 'debugging',
                focus: ['investigation', 'root-cause', 'solution']
            },
            'design the system': {
                pattern: 'architecture-design',
                focus: ['scalability', 'security', 'cost']
            },
            'analyze the data': {
                pattern: 'data-analysis',
                focus: ['insights', 'visualization', 'recommendations']
            },
            'clean up the code': {
                pattern: 'refactoring',
                focus: ['structure', 'patterns', 'testing']
            }
        };

        // Find best mapping
        const simple_lower = simple_request.toLowerCase();
        for (const [key, value] of Object.entries(mappings)) {
            if (simple_lower.includes(key)) {
                return value;
            }
        }

        return { pattern: 'code-review', focus: ['general'] };
    }
}

// Export the expert system
module.exports = CrewAIExpert;

// CLI interface for testing
if (require.main === module) {
    const expert = new CrewAIExpert();
    
    // Example usage
    const request = {
        task_description: 'Review and optimize the authentication system for security vulnerabilities',
        context: 'Node.js Express application with JWT authentication',
        requirements: [
            'Check for common vulnerabilities',
            'Optimize performance',
            'Ensure OWASP compliance'
        ],
        files: ['auth.js', 'middleware.js', 'user.model.js'],
        priority: 'high'
    };

    const config = expert.generateCrewConfig(request);
    console.log(JSON.stringify(config, null, 2));
}