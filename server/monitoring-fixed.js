// Fixed monitoring module without memory leaks
const os = require('os');
const fs = require('fs');
const path = require('path');

// Cache for reducing repeated calculations
let cache = {
    systemStats: null,
    processStats: null,
    lastUpdate: 0
};

const CACHE_TTL = 5000; // Cache for 5 seconds

async function getSystemStats() {
    // Return cached value if still fresh
    if (cache.systemStats && Date.now() - cache.lastUpdate < CACHE_TTL) {
        return cache.systemStats;
    }
    
    try {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const loadAvg = os.loadavg();
        
        // Get disk usage by reading from df output file if available
        // or use a simple estimate
        let diskUsage = 0;
        let diskTotal = 512 * (1024 ** 3); // Default 512GB
        let diskPercent = 0;
        
        try {
            // Try to read disk stats from /tmp file that we update periodically
            const diskStats = fs.readFileSync('/tmp/disk_stats.txt', 'utf8');
            const parts = diskStats.trim().split(' ');
            if (parts.length >= 3) {
                diskTotal = parseInt(parts[0]);
                diskUsage = parseInt(parts[1]);
                diskPercent = parseFloat(parts[2]);
            }
        } catch (e) {
            // Use estimates if file doesn't exist
            diskPercent = 20; // Assume 20% used
            diskUsage = diskTotal * 0.2;
        }
        
        const result = {
            cpuUsage: Math.min(100, loadAvg[0] * 10), // Rough estimate
            cpuCores: os.cpus().length,
            memoryUsage: usedMem / (1024 ** 3),
            memoryTotal: totalMem / (1024 ** 3),
            memoryPercent: (usedMem / totalMem) * 100,
            diskUsage: diskUsage,
            diskTotal: diskTotal,
            diskPercent: diskPercent,
            temperature: 0, // Not available without sensors
            loadAverage: loadAvg,
            uptime: os.uptime()
        };
        
        // Update cache
        cache.systemStats = result;
        cache.lastUpdate = Date.now();
        
        return result;
    } catch (error) {
        console.error('Error getting system stats:', error);
        return {
            cpuUsage: 0,
            memoryUsage: 0,
            memoryTotal: os.totalmem() / (1024 ** 3),
            memoryPercent: 0,
            diskUsage: 0,
            diskTotal: 0,
            diskPercent: 0,
            temperature: 0,
            error: error.message
        };
    }
}

async function getProcessStats() {
    // Return cached value if still fresh
    if (cache.processStats && Date.now() - cache.lastUpdate < CACHE_TTL) {
        return cache.processStats;
    }
    
    try {
        // Check if our own process is running (it always is)
        const currentProcess = {
            node: {
                pid: process.pid,
                cpu: process.cpuUsage().user / 1000000, // Convert to seconds
                mem: process.memoryUsage().heapUsed / (1024 * 1024) // Convert to MB
            },
            redis: null,
            ollama: null
        };
        
        // Try to read process info from /tmp file updated by cron
        try {
            const procStats = fs.readFileSync('/tmp/process_stats.json', 'utf8');
            const stats = JSON.parse(procStats);
            currentProcess.redis = stats.redis || null;
            currentProcess.ollama = stats.ollama || null;
        } catch (e) {
            // Assume they're running if we can't check
            currentProcess.redis = { pid: 0, cpu: 0, mem: 0 };
            currentProcess.ollama = { pid: 0, cpu: 0, mem: 0 };
        }
        
        // Update cache
        cache.processStats = currentProcess;
        
        return currentProcess;
    } catch (error) {
        console.error('Error getting process stats:', error);
        return {
            node: null,
            redis: null,
            ollama: null,
            error: error.message
        };
    }
}

async function getOllamaStats() {
    try {
        // Try axios if available, otherwise return placeholder
        try {
            const axios = require('axios');
            const response = await axios.get('http://localhost:11434/api/tags', { 
                timeout: 2000,
                validateStatus: () => true // Don't throw on HTTP errors
            });
            
            if (response.status === 200 && response.data) {
                const models = response.data.models || [];
                const totalSize = models.reduce((acc, model) => acc + (model.size || 0), 0);
                
                return { 
                    modelMemoryUsage: totalSize / (1024 ** 3), // Convert to GB
                    activeModels: models.map(m => m.name),
                    modelCount: models.length
                };
            }
        } catch (e) {
            // Axios not available or request failed
        }
        
        // Return placeholder data
        return { 
            modelMemoryUsage: 0, 
            activeModels: [],
            modelCount: 0
        };
    } catch (error) {
        return { 
            modelMemoryUsage: 0, 
            activeModels: [],
            modelCount: 0,
            error: error.message
        };
    }
}

async function getQueueStats() {
    // This will be populated by the server directly
    return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0
    };
}

// Create a background updater for disk and process stats
// This runs once per minute instead of on every request
function startBackgroundUpdater() {
    const updateStats = () => {
        try {
            // Update disk stats using df
            const { execSync } = require('child_process');
            try {
                const dfOutput = execSync('df -k / | tail -1', { encoding: 'utf8', timeout: 1000 });
                const parts = dfOutput.trim().split(/\s+/);
                if (parts.length >= 4) {
                    const total = parseInt(parts[1]) * 1024;
                    const used = parseInt(parts[2]) * 1024;
                    const percent = (used / total) * 100;
                    fs.writeFileSync('/tmp/disk_stats.txt', `${total} ${used} ${percent}`);
                }
            } catch (e) {
                // Ignore df errors
            }
            
            // Update process stats
            try {
                const psOutput = execSync('ps aux | head -50', { encoding: 'utf8', timeout: 1000 });
                const lines = psOutput.split('\n');
                const stats = {};
                
                for (const line of lines) {
                    if (line.includes('redis-server')) {
                        const parts = line.trim().split(/\s+/);
                        stats.redis = {
                            pid: parseInt(parts[1]),
                            cpu: parseFloat(parts[2]),
                            mem: parseFloat(parts[3])
                        };
                    }
                    if (line.includes('ollama')) {
                        const parts = line.trim().split(/\s+/);
                        stats.ollama = {
                            pid: parseInt(parts[1]),
                            cpu: parseFloat(parts[2]),
                            mem: parseFloat(parts[3])
                        };
                    }
                }
                
                fs.writeFileSync('/tmp/process_stats.json', JSON.stringify(stats));
            } catch (e) {
                // Ignore ps errors
            }
        } catch (error) {
            console.error('Background updater error:', error);
        }
    };
    
    // Run immediately and then every 60 seconds
    updateStats();
    setInterval(updateStats, 60000);
}

// Start the background updater when module loads
startBackgroundUpdater();

module.exports = { getSystemStats, getProcessStats, getOllamaStats, getQueueStats };