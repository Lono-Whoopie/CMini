#!/bin/bash

# Disable CMini Services Autostart
echo "Disabling CMini services autostart..."

# Copy the script to Mini and execute it
cat << 'REMOTE_SCRIPT' | ssh 100.114.129.95 'bash -s'

echo "Stopping and disabling CMini services..."

# Unload the services first
sudo launchctl unload /Library/LaunchDaemons/com.cmini.taskqueue.plist 2>/dev/null
sudo launchctl unload /Library/LaunchDaemons/com.cmini.portal.plist 2>/dev/null

# Disable them from auto-starting (keeps plist files but disables them)
sudo launchctl disable system/com.cmini.taskqueue 2>/dev/null
sudo launchctl disable system/com.cmini.portal 2>/dev/null

# Kill any running processes
pkill -f "node.*start-with-auth" 2>/dev/null
pkill -f "node.*simple_setup_portal" 2>/dev/null
pkill -f "node.*server.js" 2>/dev/null

echo "CMini services disabled from autostart."
echo ""
echo "Services will NOT start automatically on boot."
echo ""
echo "To manually start services when needed:"
echo "  sudo launchctl load /Library/LaunchDaemons/com.cmini.taskqueue.plist"
echo "  sudo launchctl load /Library/LaunchDaemons/com.cmini.portal.plist"
echo ""
echo "To re-enable autostart later:"
echo "  sudo launchctl enable system/com.cmini.taskqueue"
echo "  sudo launchctl enable system/com.cmini.portal"

REMOTE_SCRIPT

echo ""
echo "Script complete. CMini services are now shelved and won't autostart."