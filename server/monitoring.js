const si = require('systeminformation');
const Queue = require('bull');
const axios = require('axios');

const devQueue = new Queue('Development Tasks', { 
    redis: { host: 'localhost', port: 6379 } 
});

async function getSystemStats() {
    try {
        const [cpu, mem, disk, net, temp, currentLoad] = await Promise.all([
            si.cpu(),
            si.mem(),
            si.fsSize(),
            si.networkInterfaces(),
            si.cpuTemperature(),
            si.currentLoad()
        ]);

        // Calculate disk usage from all mounted drives
        const totalDisk = disk.reduce((acc, d) => acc + d.size, 0);
        const usedDisk = disk.reduce((acc, d) => acc + d.used, 0);

        return {
            cpuUsage: currentLoad.currentLoad || 0,
            cpuCores: cpu.cores || 14,
            memoryUsage: mem.used / (1024 ** 3),
            memoryTotal: mem.total / (1024 ** 3),
            memoryPercent: (mem.used / mem.total) * 100,
            diskUsage: usedDisk,
            diskTotal: totalDisk,
            diskPercent: (usedDisk / totalDisk) * 100,
            networkInterfaces: net.filter(ni => ni.ip4).map(ni => ({
                iface: ni.iface,
                ip4: ni.ip4
            })),
            temperature: temp.main || 0 // macOS might not provide temp data
        };
    } catch (error) {
        console.error('Error getting system stats:', error);
        return {
            cpuUsage: 0,
            memoryUsage: 0,
            diskUsage: 0,
            temperature: 0,
            error: error.message
        };
    }
}

async function getProcessStats() {
    try {
        const processes = await si.processes();
        
        const nodeProc = processes.list.find(p => 
            p.name.includes('node') || p.command?.includes('node'));
        const redisProc = processes.list.find(p => 
            p.name.includes('redis') || p.command?.includes('redis'));
        const ollamaProc = processes.list.find(p => 
            p.name.includes('ollama') || p.command?.includes('ollama'));

        return {
            node: nodeProc ? { 
                pid: nodeProc.pid, 
                cpu: nodeProc.cpu || 0,
                mem: nodeProc.mem || 0 
            } : null,
            redis: redisProc ? { 
                pid: redisProc.pid, 
                cpu: redisProc.cpu || 0,
                mem: redisProc.mem || 0 
            } : null,
            ollama: ollamaProc ? { 
                pid: ollamaProc.pid, 
                cpu: ollamaProc.cpu || 0,
                mem: ollamaProc.mem || 0 
            } : null
        };
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
        // Get actual Ollama stats from API
        const response = await axios.get('http://localhost:11434/api/tags');
        const models = response.data.models || [];
        
        const totalSize = models.reduce((acc, model) => acc + (model.size || 0), 0);
        
        return { 
            modelMemoryUsage: totalSize / (1024 ** 3), // Convert to GB
            activeModels: models.map(m => m.name),
            modelCount: models.length
        };
    } catch (error) {
        console.error('Error getting Ollama stats:', error);
        return { 
            modelMemoryUsage: 0, 
            activeModels: [],
            modelCount: 0,
            error: error.message
        };
    }
}

async function getQueueStats() {
    try {
        const stats = await devQueue.getJobCounts();
        return stats;
    } catch (error) {
        console.error('Error getting queue stats:', error);
        return {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            error: error.message
        };
    }
}

module.exports = { getSystemStats, getProcessStats, getOllamaStats, getQueueStats };