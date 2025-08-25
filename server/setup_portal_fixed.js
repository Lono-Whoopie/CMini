const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 8080;

// Get the Mini's IPs
const MINI_TAILSCALE_IP = '100.114.129.95';
const MINI_LAN_IP = '10.0.10.244';
const TASK_QUEUE_PORT = '3001';

// Main HTML page
const indexHTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8').replace(/\${MINI_TAILSCALE_IP}/g, MINI_TAILSCALE_IP)
    .replace(/\${MINI_LAN_IP}/g, MINI_LAN_IP)
    .replace(/\${TASK_QUEUE_PORT}/g, TASK_QUEUE_PORT);

// Setup scripts
const macosScript = fs.readFileSync(path.join(__dirname, 'macos.sh'), 'utf8').replace(/\${MINI_TAILSCALE_IP}/g, MINI_TAILSCALE_IP)
    .replace(/\${MINI_LAN_IP}/g, MINI_LAN_IP)
    .replace(/\${TASK_QUEUE_PORT}/g, TASK_QUEUE_PORT);

const linuxScript = fs.readFileSync(path.join(__dirname, 'linux.sh'), 'utf8').replace(/\${MINI_TAILSCALE_IP}/g, MINI_TAILSCALE_IP)
    .replace(/\${MINI_LAN_IP}/g, MINI_LAN_IP)
    .replace(/\${TASK_QUEUE_PORT}/g, TASK_QUEUE_PORT);

const windowsScript = fs.readFileSync(path.join(__dirname, 'windows.ps1'), 'utf8').replace(/\${MINI_TAILSCALE_IP}/g, MINI_TAILSCALE_IP)
    .replace(/\${MINI_LAN_IP}/g, MINI_LAN_IP)
    .replace(/\${TASK_QUEUE_PORT}/g, TASK_QUEUE_PORT);

const claudeMd = fs.readFileSync(path.join(__dirname, 'CLAUDE.md'), 'utf8').replace(/\${MINI_TAILSCALE_IP}/g, MINI_TAILSCALE_IP)
    .replace(/\${MINI_LAN_IP}/g, MINI_LAN_IP)
    .replace(/\${TASK_QUEUE_PORT}/g, TASK_QUEUE_PORT);

// Routes
app.get('/', (req, res) => {
    res.send(indexHTML);
});

app.get('/setup/macos.sh', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(macosScript);
});

app.get('/setup/linux.sh', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(linuxScript);
});

app.get('/setup/windows.ps1', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(windowsScript);
});

app.get('/config/claude.md', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(claudeMd);
});

app.get('/config/claude_config', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.sendFile(path.join(__dirname, '.claude_config'));
});

app.get('/config/claude_mini_client.py', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.sendFile(path.join(__dirname, '.claude_mini_client.py'));
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`🌐 Setup Portal running on port ${port}`);
    console.log(`📍 Access at: http://${MINI_TAILSCALE_IP}:${port}`);
    console.log(`📍 Or locally: http://${MINI_LAN_IP}:${port}`);
});