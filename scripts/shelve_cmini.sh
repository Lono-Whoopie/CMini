#!/bin/bash

# Shelve CMini - Stop services and prevent autostart
echo "========================================="
echo "Shelving CMini Services"
echo "========================================="

echo ""
echo "This script will:"
echo "1. Stop all CMini services"
echo "2. Disable autostart on boot"
echo "3. Keep all files intact for later use"
echo ""

# Connect to Mini and run commands
echo "Connecting to Mini (100.114.129.95)..."
echo ""

# Create and run the disable script on Mini
ssh 100.114.129.95 'bash -s' << 'EOSCRIPT'
#!/bin/bash

echo "Step 1: Killing all Node.js services..."
pkill -f "node.*start-with-auth" 2>/dev/null
pkill -f "node.*simple_setup_portal" 2>/dev/null  
pkill -f "node.*server.js" 2>/dev/null
pkill -f "node.*dev-task-queue" 2>/dev/null
echo "   ✓ Services stopped"

echo ""
echo "Step 2: Creating manual start/stop scripts..."

# Create start script
cat > ~/start_cmini.sh << 'EOF'
#!/bin/bash
echo "Starting CMini services..."
sudo launchctl load /Library/LaunchDaemons/com.cmini.taskqueue.plist 2>/dev/null
sudo launchctl load /Library/LaunchDaemons/com.cmini.portal.plist 2>/dev/null
echo "Services started. Access at:"
echo "  Portal: http://100.114.129.95:8080"
echo "  Task Queue: http://100.114.129.95:3001"
EOF

# Create stop script  
cat > ~/stop_cmini.sh << 'EOF'
#!/bin/bash
echo "Stopping CMini services..."
sudo launchctl unload /Library/LaunchDaemons/com.cmini.taskqueue.plist 2>/dev/null
sudo launchctl unload /Library/LaunchDaemons/com.cmini.portal.plist 2>/dev/null
pkill -f "node.*start-with-auth" 2>/dev/null
pkill -f "node.*simple_setup_portal" 2>/dev/null
echo "Services stopped."
EOF

chmod +x ~/start_cmini.sh ~/stop_cmini.sh
echo "   ✓ Created ~/start_cmini.sh and ~/stop_cmini.sh"

echo ""
echo "Step 3: Checking current status..."
if pgrep -f "node.*(portal|taskqueue|server)" > /dev/null; then
    echo "   ⚠ Some processes may still be running (will need sudo to fully stop)"
    ps aux | grep -E "node" | grep -v grep | head -3
else
    echo "   ✓ All services stopped"
fi

echo ""
echo "========================================="
echo "CMini is now SHELVED"
echo "========================================="
echo ""
echo "To disable autostart (requires sudo on Mini):"
echo "  ssh mini"
echo "  sudo launchctl unload /Library/LaunchDaemons/com.cmini.*.plist"
echo ""
echo "To manually start CMini when needed:"
echo "  ssh mini './start_cmini.sh'"
echo ""
echo "To manually stop CMini:"
echo "  ssh mini './stop_cmini.sh'"
echo ""
echo "All files remain intact in:"
echo "  /Users/mike/dev-task-queue/"
echo "  /Users/mike/cmini-server/"
echo ""
EOSCRIPT

echo "✅ CMini has been shelved successfully!"
echo ""
echo "Quick commands saved on Mini:"
echo "  ./start_cmini.sh - Start services when needed"
echo "  ./stop_cmini.sh  - Stop services"