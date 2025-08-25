#!/bin/bash
# Fix Tailscale on Mini - Run this on the Mini locally

echo "🔧 Fixing Tailscale on Mini..."
echo ""

# Stop any existing Tailscale processes
echo "Stopping existing Tailscale processes..."
pkill -f Tailscale
pkill -f tailscaled

# Create system daemon plist
echo "Creating system daemon configuration..."
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

# Wait for daemon to start
sleep 3

# Connect to Tailscale
echo "Connecting to Tailscale network..."
/opt/homebrew/bin/tailscale up --accept-routes

# Check status
echo ""
echo "✅ Tailscale status:"
/opt/homebrew/bin/tailscale status

echo ""
echo "📍 Your Tailscale IP:"
/opt/homebrew/bin/tailscale ip -4

echo ""
echo "✅ Tailscale is now configured to start automatically at boot!"