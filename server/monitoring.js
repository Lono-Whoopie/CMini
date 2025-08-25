// Simple monitoring module without external dependencies
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function getSystemStats() {
    try {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const loadAvg = os.loadavg();
        
        // Try to get disk usage
        let diskUsage = 0;
        let diskTotal = 512 * (1024 ** 3); // Default 512GB
        let diskPercent = 0;
        
        try {
            const { stdout } = await execPromise('df -k / | tail -1');
            const parts = stdout.trim().split(/\s+/);
            if (parts.length >= 4) {
                diskTotal = parseInt(parts[1]) * 1024; // Convert KB to bytes
                diskUsage = parseInt(parts[2]) * 1024;
                diskPercent = (diskUsage / diskTotal) * 100;
            }
        } catch (e) {
            console.error('Could not get disk stats:', e.message);
        }
        
        return {
            cpuUsage: Math.min(100, loadAvg[0] * 10), // Rough estimate
            cpuCores: os.cpus().length,
            memoryUsage: usedMem / (1024 ** 3),
            memoryTotal: totalMem / (1024 ** 3),
            memoryPercent: (usedMem / totalMem) * 100,
            diskUsage: diskUsage,
            diskTotal: diskTotal,
            diskPercent: diskPercent,
            temperature: 0, // Not available without sensors
            loadAverage: loadAvg
        };
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
    try {
        const processes = {};
        
        // Check for node process
        try {
            const { stdout: nodePs } = await execPromise('ps aux | grep "node server" | grep -v grep | head -1');
            if (nodePs) {
                const parts = nodePs.trim().split(/\s+/);
                processes.node = {
                    pid: parseInt(parts[1]),
                    cpu: parseFloat(parts[2]),
                    mem: parseFloat(parts[3])
                };
            }
        } catch (e) {
            processes.node = null;
        }
        
        // Check for redis
        try {
            const { stdout: redisPs } = await execPromise('ps aux | grep redis-server | grep -v grep | head -1');
            if (redisPs) {
                const parts = redisPs.trim().split(/\s+/);
                processes.redis = {
                    pid: parseInt(parts[1]),
                    cpu: parseFloat(parts[2]),
                    mem: parseFloat(parts[3])
                };
            }
        } catch (e) {
            processes.redis = null;
        }
        
        // Check for ollama
        try {
            const { stdout: ollamaPs } = await execPromise('ps aux | grep ollama | grep -v grep | head -1');
            if (ollamaPs) {
                const parts = ollamaPs.trim().split(/\s+/);
                processes.ollama = {
                    pid: parseInt(parts[1]),
                    cpu: parseFloat(parts[2]),
                    mem: parseFloat(parts[3])
                };
            }
        } catch (e) {
            processes.ollama = null;
        }
        
        return processes;
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
        const axios = require('axios');
        const response = await axios.get('http://localhost:11434/api/tags', { timeout: 2000 });
        const models = response.data.models || [];
        
        const totalSize = models.reduce((acc, model) => acc + (model.size || 0), 0);
        
        return { 
            modelMemoryUsage: totalSize / (1024 ** 3), // Convert to GB
            activeModels: models.map(m => m.name),
            modelCount: models.length
        };
    } catch (error) {
        // Ollama might not be running or axios not available
        return { 
            modelMemoryUsage: 0, 
            activeModels: [],
            modelCount: 0
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

module.exports = { getSystemStats, getProcessStats, getOllamaStats, getQueueStats };