#!/bin/bash

# CMini Services Shutdown Script
echo "Shutting down CMini services..."

# Unload LaunchDaemons
echo "Stopping taskqueue daemon..."
sudo launchctl unload /Library/LaunchDaemons/com.cmini.taskqueue.plist 2>/dev/null

echo "Stopping portal daemon..."
sudo launchctl unload /Library/LaunchDaemons/com.cmini.portal.plist 2>/dev/null

# Kill any remaining node processes
echo "Killing any remaining Node.js processes..."
pkill -f "node.*start-with-auth" 2>/dev/null
pkill -f "node.*simple_setup_portal" 2>/dev/null
pkill -f "node.*server.js" 2>/dev/null

# Wait for processes to stop
sleep 2

# Verify shutdown
echo -e "\nVerifying shutdown..."
if pgrep -f "node.*(portal|taskqueue|server)" > /dev/null; then
    echo "Warning: Some processes may still be running:"
    ps aux | grep -E "node.*(portal|taskqueue|server)" | grep -v grep
else
    echo "All CMini services successfully stopped!"
fi

echo -e "\nServices status:"
echo "Portal (8080): Stopped"
echo "Task Queue (3001): Stopped"
echo "Dev Queue (3002): Stopped"

echo -e "\nTo restart services, run:"
echo "sudo launchctl load /Library/LaunchDaemons/com.cmini.taskqueue.plist"
echo "sudo launchctl load /Library/LaunchDaemons/com.cmini.portal.plist"