// Minimal monitoring module with no exec calls or external dependencies
const os = require('os');

// Simple in-memory cache
let cache = {
    data: null,
    timestamp: 0
};

const CACHE_DURATION = 5000; // 5 seconds

function getCachedOrCompute(computeFn) {
    const now = Date.now();
    if (cache.data && (now - cache.timestamp) < CACHE_DURATION) {
        return cache.data;
    }
    
    cache.data = computeFn();
    cache.timestamp = now;
    return cache.data;
}

async function getSystemStats() {
    return getCachedOrCompute(() => {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const loadAvg = os.loadavg();
        
        return {
            cpuUsage: Math.min(100, Math.round(loadAvg[0] * 10)),
            cpuCores: os.cpus().length,
            memoryUsage: usedMem / (1024 ** 3),
            memoryTotal: totalMem / (1024 ** 3),
            memoryPercent: (usedMem / totalMem) * 100,
            diskUsage: 100 * (1024 ** 3), // Placeholder 100GB
            diskTotal: 500 * (1024 ** 3), // Placeholder 500GB  
            diskPercent: 20, // Placeholder 20%
            temperature: 0,
            loadAverage: loadAvg,
            uptime: os.uptime()
        };
    });
}

async function getProcessStats() {
    // Just return current process info, no external calls
    const mem = process.memoryUsage();
    return {
        node: {
            pid: process.pid,
            cpu: 0, // CPU usage not easily available without exec
            mem: Math.round(mem.heapUsed / (1024 * 1024)) // MB
        },
        redis: { pid: 0, cpu: 0, mem: 0 }, // Assume running
        ollama: { pid: 0, cpu: 0, mem: 0 } // Assume running
    };
}

async function getOllamaStats() {
    // Return placeholder data - no external HTTP calls
    return {
        modelMemoryUsage: 30, // Assume 30GB for models
        activeModels: ['qwen2.5-coder:32b', 'qwen2.5-coder:14b', 'llama3.2:3b'],
        modelCount: 3
    };
}

async function getQueueStats() {
    // This is populated by the server directly
    return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0
    };
}

module.exports = { getSystemStats, getProcessStats, getOllamaStats, getQueueStats };