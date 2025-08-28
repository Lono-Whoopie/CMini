# CMini Security Migration Plan

## Executive Summary
This document outlines the comprehensive migration plan to transform the CMini M4 Pro Mini server from its current insecure state to a hardened, production-ready configuration. The migration addresses critical security vulnerabilities while maintaining service availability.

## 1. Current State Analysis

### System Configuration
- **Platform**: macOS on M4 Pro Mini (64GB RAM)
- **Network**: Accessible via Tailscale (100.114.129.95) and LAN (10.0.10.244)
- **User**: All services running as 'mike' user with admin privileges
- **Auto-login**: ENABLED - System boots directly to desktop without authentication

### Service Configuration

| Service | Port | Binding | Authentication | User | Start Method |
|---------|------|---------|----------------|------|--------------|
| Redis | 6379 | 0.0.0.0 | None (protected-mode no) | mike | Manual script |
| Ollama | 11434 | 0.0.0.0 | None | mike | Manual script |
| Task Queue | 3001 | 0.0.0.0 | None | mike | Manual script |
| Setup Portal | 8080 | 0.0.0.0 | None | mike | Manual script |

### Critical Security Issues

#### 🔴 **CRITICAL**
1. **Physical Access Vulnerability**: Auto-login grants immediate full system access
2. **Redis Completely Exposed**: No authentication, accessible from any network interface
3. **All Services on Public Interfaces**: Services accept connections from any network

#### 🟠 **HIGH**
4. **User-Space Services**: All services run with full user privileges
5. **No Service Isolation**: Single user compromise affects all services
6. **Manual Service Management**: No proper logging, monitoring, or automatic recovery

#### 🟡 **MEDIUM**
7. **Admin User Running Services**: mike user has sudo privileges
8. **No Rate Limiting**: Services vulnerable to DoS attacks
9. **No Audit Logging**: No tracking of access or changes

### File Locations
```
~/start_services.sh          # Manual startup script
~/monitor_services.sh        # Infinite loop monitor (resource waste)
~/dev-task-queue/            # Task queue server
/opt/homebrew/etc/redis.conf # Redis config (overridden by CLI)
```

## 2. Desired End State Architecture

### Security Principles
- **Principle of Least Privilege**: Each service runs with minimal required permissions
- **Defense in Depth**: Multiple layers of security
- **Zero Trust Network**: Authenticate and authorize all connections
- **Audit and Monitoring**: Log all access and changes

### Target Configuration

| Service | Port | Binding | Authentication | User | Start Method |
|---------|------|---------|----------------|------|--------------|
| Redis | 6379 | 100.114.129.95 | Required (ACL) | _redis | LaunchDaemon |
| Ollama | 11434 | 100.114.129.95 | API Key | _ollama | LaunchDaemon |
| Task Queue | 3001 | 100.114.129.95 | API Key | _taskqueue | LaunchDaemon |
| Setup Portal | 8080 | 100.114.129.95 | Basic Auth | _portal | LaunchDaemon |

### Security Improvements
- **No Auto-login**: Require authentication on physical access
- **Service Isolation**: Each service runs as dedicated daemon user
- **Network Restrictions**: Services only accessible via Tailscale
- **Authentication**: All services require authentication
- **System Service Management**: Proper LaunchDaemons with logging
- **Firewall Rules**: macOS firewall configured to restrict access

## 3. Migration Plan

### Phase 1: Preparation (Day 1)
**Duration**: 2-4 hours  
**Risk Level**: Low  
**Downtime**: None

1. **Create Backup**
   ```bash
   # Backup current configurations
   mkdir -p ~/cmini_backup_$(date +%Y%m%d)
   cp ~/start_services.sh ~/cmini_backup_*/
   cp ~/monitor_services.sh ~/cmini_backup_*/
   cp -r ~/dev-task-queue ~/cmini_backup_*/
   brew services list > ~/cmini_backup_*/brew_services.txt
   ```

2. **Document Current State**
   ```bash
   # Capture running processes
   ps aux | grep -E "redis|ollama|node" > ~/cmini_backup_*/processes.txt
   netstat -an | grep LISTEN > ~/cmini_backup_*/ports.txt
   ```

3. **Create Daemon Users**
   ```bash
   # Create service users (requires admin)
   sudo dscl . -create /Users/_redis
   sudo dscl . -create /Users/_redis UserShell /usr/bin/false
   sudo dscl . -create /Users/_redis RealName "Redis Service"
   sudo dscl . -create /Users/_redis UniqueID 510
   sudo dscl . -create /Users/_redis PrimaryGroupID 20
   
   sudo dscl . -create /Users/_ollama
   sudo dscl . -create /Users/_ollama UserShell /usr/bin/false
   sudo dscl . -create /Users/_ollama RealName "Ollama Service"
   sudo dscl . -create /Users/_ollama UniqueID 511
   sudo dscl . -create /Users/_ollama PrimaryGroupID 20
   
   sudo dscl . -create /Users/_taskqueue
   sudo dscl . -create /Users/_taskqueue UserShell /usr/bin/false
   sudo dscl . -create /Users/_taskqueue RealName "Task Queue Service"
   sudo dscl . -create /Users/_taskqueue UniqueID 512
   sudo dscl . -create /Users/_taskqueue PrimaryGroupID 20
   
   sudo dscl . -create /Users/_portal
   sudo dscl . -create /Users/_portal UserShell /usr/bin/false
   sudo dscl . -create /Users/_portal RealName "Portal Service"
   sudo dscl . -create /Users/_portal UniqueID 513
   sudo dscl . -create /Users/_portal PrimaryGroupID 20
   ```

### Phase 2: Redis Security (Day 2)
**Duration**: 1-2 hours  
**Risk Level**: Medium  
**Downtime**: 5 minutes

1. **Configure Redis ACL**
   ```bash
   # Create Redis ACL file
   cat > /opt/homebrew/etc/redis-acl.conf << 'EOF'
   user default on nopass ~* &* +@all
   user taskqueue on >SecurePassword123! ~* &* +@all
   EOF
   ```

2. **Update Redis Configuration**
   ```bash
   # Backup original
   cp /opt/homebrew/etc/redis.conf /opt/homebrew/etc/redis.conf.backup
   
   # Update configuration
   cat >> /opt/homebrew/etc/redis.conf << 'EOF'
   # Security Configuration
   bind 100.114.129.95 127.0.0.1
   protected-mode yes
   requirepass RedisMainPassword123!
   aclfile /opt/homebrew/etc/redis-acl.conf
   EOF
   ```

3. **Create Redis LaunchDaemon**
   ```xml
   sudo tee /Library/LaunchDaemons/com.cmini.redis.plist << 'EOF'
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>Label</key>
       <string>com.cmini.redis</string>
       <key>ProgramArguments</key>
       <array>
           <string>/opt/homebrew/bin/redis-server</string>
           <string>/opt/homebrew/etc/redis.conf</string>
       </array>
       <key>RunAtLoad</key>
       <true/>
       <key>UserName</key>
       <string>_redis</string>
       <key>GroupName</key>
       <string>staff</string>
       <key>StandardOutPath</key>
       <string>/var/log/redis.log</string>
       <key>StandardErrorPath</key>
       <string>/var/log/redis-error.log</string>
   </dict>
   </plist>
   EOF
   ```

### Phase 3: Service Migration (Day 3)
**Duration**: 2-3 hours  
**Risk Level**: Medium  
**Downtime**: 30 minutes

1. **Update Task Queue Server**
   ```javascript
   // Add to task-queue-server.js
   const BIND_HOST = '100.114.129.95';
   const API_KEY = process.env.TASKQUEUE_API_KEY || 'DefaultAPIKey123!';
   
   // Add authentication middleware
   app.use((req, res, next) => {
       const apiKey = req.headers['x-api-key'];
       if (apiKey !== API_KEY) {
           return res.status(401).json({ error: 'Unauthorized' });
       }
       next();
   });
   
   // Update Redis connection
   const redis = new Redis({
       host: '100.114.129.95',
       password: 'RedisMainPassword123!'
   });
   ```

2. **Create Task Queue LaunchDaemon**
   ```xml
   sudo tee /Library/LaunchDaemons/com.cmini.taskqueue.plist << 'EOF'
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>Label</key>
       <string>com.cmini.taskqueue</string>
       <key>ProgramArguments</key>
       <array>
           <string>/usr/local/bin/node</string>
           <string>/opt/cmini/task-queue-server.js</string>
       </array>
       <key>RunAtLoad</key>
       <true/>
       <key>UserName</key>
       <string>_taskqueue</string>
       <key>EnvironmentVariables</key>
       <dict>
           <key>TASKQUEUE_API_KEY</key>
           <string>SecureAPIKey456!</string>
           <key>BIND_HOST</key>
           <string>100.114.129.95</string>
       </dict>
   </dict>
   </plist>
   EOF
   ```

3. **Configure Ollama Service**
   ```bash
   # Create Ollama configuration
   sudo mkdir -p /etc/ollama
   sudo tee /etc/ollama/config.json << 'EOF'
   {
       "host": "100.114.129.95:11434",
       "api_key": "OllamaAPIKey789!"
   }
   EOF
   ```

### Phase 4: Disable Auto-login (Day 4)
**Duration**: 30 minutes  
**Risk Level**: Low  
**Downtime**: Requires restart

1. **Disable Auto-login**
   ```bash
   # Remove auto-login setting
   sudo defaults delete /Library/Preferences/com.apple.loginwindow autoLoginUser
   
   # Verify change
   defaults read /Library/Preferences/com.apple.loginwindow
   ```

2. **Enable FileVault (Optional but Recommended)**
   ```bash
   sudo fdesetup enable
   ```

### Phase 5: Firewall Configuration (Day 5)
**Duration**: 1 hour  
**Risk Level**: Low  
**Downtime**: None

1. **Configure macOS Firewall**
   ```bash
   # Enable firewall
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
   
   # Set to block all incoming connections
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setblockall on
   
   # Add exceptions for Tailscale
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /Applications/Tailscale.app
   ```

2. **Create Custom Firewall Rules**
   ```bash
   # Create pf rules for service restrictions
   sudo tee /etc/pf.anchors/cmini << 'EOF'
   # Allow Tailscale network only
   pass in quick on utun* proto tcp from any to any port {3001, 8080, 11434, 6379}
   block in quick proto tcp from any to any port {3001, 8080, 11434, 6379}
   EOF
   ```

## 4. Validation Steps

### Service Validation Checklist
- [ ] Redis requires authentication
- [ ] Redis only accessible via Tailscale IP
- [ ] Task Queue requires API key
- [ ] Task Queue only accessible via Tailscale IP
- [ ] Ollama requires API key
- [ ] Ollama only accessible via Tailscale IP
- [ ] Portal requires authentication
- [ ] Portal only accessible via Tailscale IP
- [ ] All services run as daemon users
- [ ] All services start automatically on boot
- [ ] Auto-login is disabled
- [ ] Firewall is enabled and configured

### Testing Commands
```bash
# Test Redis authentication
redis-cli -h 100.114.129.95 -a RedisMainPassword123! ping

# Test Task Queue API
curl -H "X-API-Key: SecureAPIKey456!" http://100.114.129.95:3001/health

# Test Ollama API
curl -H "Authorization: Bearer OllamaAPIKey789!" http://100.114.129.95:11434/api/version

# Verify services running as correct users
ps aux | grep -E "_redis|_ollama|_taskqueue|_portal"

# Verify network bindings
netstat -an | grep LISTEN | grep 100.114.129.95
```

## 5. Rollback Procedures

### Complete Rollback
```bash
# Stop all LaunchDaemons
sudo launchctl unload /Library/LaunchDaemons/com.cmini.*.plist

# Restore original configurations
cp ~/cmini_backup_*/redis.conf.backup /opt/homebrew/etc/redis.conf

# Start services with original scripts
~/start_services.sh

# Re-enable auto-login (if needed)
sudo defaults write /Library/Preferences/com.apple.loginwindow autoLoginUser -string "mike"
```

### Partial Rollback (Service-Specific)
```bash
# Rollback specific service (e.g., Redis)
sudo launchctl unload /Library/LaunchDaemons/com.cmini.redis.plist
brew services start redis

# Rollback Task Queue
sudo launchctl unload /Library/LaunchDaemons/com.cmini.taskqueue.plist
cd ~/dev-task-queue && npm start
```

## 6. Post-Migration Monitoring

### Daily Checks (First Week)
```bash
# Check service status
sudo launchctl list | grep com.cmini

# Check logs for errors
tail -f /var/log/redis.log
tail -f /var/log/taskqueue.log

# Monitor resource usage
top -o cpu -n 10
```

### Weekly Security Audit
```bash
# Check for unauthorized access attempts
grep "authentication" /var/log/redis.log
grep "401" /var/log/taskqueue.log

# Verify firewall status
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Check listening ports
netstat -an | grep LISTEN
```

## 7. Client Configuration Updates

Update all client configurations to include authentication:

### Python Client Update
```python
# ~/.claude_mini_client.py updates
REDIS_PASSWORD = 'RedisMainPassword123!'
TASKQUEUE_API_KEY = 'SecureAPIKey456!'
OLLAMA_API_KEY = 'OllamaAPIKey789!'

headers = {
    'X-API-Key': TASKQUEUE_API_KEY,
    'Content-Type': 'application/json'
}
```

### Environment Variables Update
```bash
# ~/.claude_config updates
export CLAUDE_TASKQUEUE_API_KEY="SecureAPIKey456!"
export CLAUDE_OLLAMA_API_KEY="OllamaAPIKey789!"
export CLAUDE_REDIS_PASSWORD="RedisMainPassword123!"
```

## 8. Timeline Summary

| Day | Phase | Duration | Risk | Downtime |
|-----|-------|----------|------|----------|
| 1 | Preparation | 2-4 hours | Low | None |
| 2 | Redis Security | 1-2 hours | Medium | 5 minutes |
| 3 | Service Migration | 2-3 hours | Medium | 30 minutes |
| 4 | Disable Auto-login | 30 minutes | Low | Restart |
| 5 | Firewall Configuration | 1 hour | Low | None |
| 6 | Validation & Testing | 2 hours | Low | None |
| 7 | Monitoring Setup | 1 hour | Low | None |

## 9. Risk Mitigation

### Identified Risks
1. **Service Disruption**: Mitigated by phased approach and rollback procedures
2. **Configuration Errors**: Mitigated by backup and validation steps
3. **Authentication Issues**: Mitigated by testing each service individually
4. **Network Access Loss**: Mitigated by maintaining local console access

### Emergency Contacts
- Document administrator contact information
- Tailscale support channels
- macOS enterprise support (if applicable)

## 10. Success Criteria

The migration is considered successful when:
1. All services are running under daemon users
2. Authentication is required for all services
3. Services are only accessible via Tailscale network
4. Auto-login is disabled
5. All validation tests pass
6. System has been stable for 48 hours post-migration
7. No unauthorized access attempts succeed

## Appendix A: Security Configuration Files

### Redis ACL Configuration
Location: `/opt/homebrew/etc/redis-acl.conf`
```
user default on nopass ~* &* +@all
user taskqueue on >SecurePassword123! ~* &* +@all
user monitoring on >MonitoringPassword! ~* &* +@read
```

### Task Queue API Configuration
Location: `/opt/cmini/config/taskqueue.json`
```json
{
  "bind_host": "100.114.129.95",
  "port": 3001,
  "api_keys": {
    "primary": "SecureAPIKey456!",
    "monitoring": "MonitoringKey789!"
  },
  "redis": {
    "host": "100.114.129.95",
    "password": "RedisMainPassword123!"
  }
}
```

## Appendix B: Monitoring Scripts

### Service Health Check Script
```bash
#!/bin/bash
# /opt/cmini/scripts/health-check.sh

SERVICES=("redis" "taskqueue" "ollama" "portal")
FAILURES=0

for service in "${SERVICES[@]}"; do
    if ! sudo launchctl list | grep -q "com.cmini.$service"; then
        echo "ERROR: $service is not running"
        ((FAILURES++))
    else
        echo "OK: $service is running"
    fi
done

exit $FAILURES
```

## Appendix C: Emergency Recovery

### If Locked Out
1. Boot into Recovery Mode (Command+R during startup)
2. Open Terminal from Utilities menu
3. Reset user password using `resetpassword` command
4. Disable System Integrity Protection if needed: `csrutil disable`
5. Reboot and regain access

### Complete System Reset
```bash
# Remove all custom configurations
sudo rm -f /Library/LaunchDaemons/com.cmini.*
sudo rm -rf /opt/cmini
sudo dscl . -delete /Users/_redis
sudo dscl . -delete /Users/_ollama
sudo dscl . -delete /Users/_taskqueue
sudo dscl . -delete /Users/_portal

# Restore original services
brew services restart redis
~/start_services.sh
```

---

**Document Version**: 1.0  
**Created**: 2025-08-25  
**Author**: CMini Security Migration Team  
**Review Status**: Ready for Implementation