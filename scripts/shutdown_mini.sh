#!/bin/bash
echo "Preparing to shut down Mini for ethernet move..."
echo ""
echo "Please enter your Mini password when prompted:"
ssh -t 100.118.38.115 'sudo shutdown -h now'
echo ""
echo "Mini is shutting down. You can now:"
echo "1. Move it to your Unifi rack"
echo "2. Connect ethernet cable"
echo "3. Power it back on"
echo ""
echo "Once restarted, the downloads will resume automatically."