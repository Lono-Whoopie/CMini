#!/bin/bash
# Run this from your Air to fix Tailscale on Mini

echo "🔧 Fixing Tailscale on Mini via SSH..."
echo "You'll be prompted for your Mini password for sudo commands."
echo ""

# Connect with TTY allocation for sudo
ssh -tt 10.0.10.244 << 'ENDSSH'
echo "Connected to Mini. Setting up Tailscale..."

# Stop existing processes
echo "Stopping any existing Tailscale processes..."
pkill -f Tailscale 2>/dev/null
pkill -f tailscaled 2>/dev/null

# Create the daemon plist
echo "Creating Tailscale daemon configuration (needs sudo)..."
sudo tee /Library/LaunchDaemons/com.tailscale.tailscaled.plist > /dev/null << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.tailscale.tailscaled</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/tailscaled</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/tailscaled.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/tailscaled.error.log</string>
</dict>
</plist>
EOF

# Load the daemon
echo "Loading Tailscale daemon..."
sudo launchctl load -w /Library/LaunchDaemons/com.tailscale.tailscaled.plist

# Wait for it to start
echo "Waiting for daemon to start..."
sleep 5

# Connect to Tailscale
echo "Connecting to Tailscale network..."
/opt/homebrew/bin/tailscale up --accept-routes

# Show status
echo ""
echo "Checking Tailscale status..."
/opt/homebrew/bin/tailscale status

echo ""
echo "Your Tailscale IP:"
/opt/homebrew/bin/tailscale ip -4

echo ""
echo "✅ Done! Tailscale should now start automatically at boot."
exit
ENDSSH

echo ""
echo "Finished! Checking connection from Air..."
sleep 3
tailscale ping -c 1 100.118.38.115