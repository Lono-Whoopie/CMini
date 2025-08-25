#!/bin/bash
# Script to copy SSH key to Mini

echo "Setting up SSH key authentication to M4 Pro Mini..."
echo "You'll be prompted for your Mini password once."
echo ""

# Copy the SSH key
ssh-copy-id -i ~/.ssh/id_ed25519.pub 100.118.38.115

# Test the connection
echo ""
echo "Testing passwordless SSH connection..."
ssh 100.118.38.115 "echo 'Success! SSH key authentication is working.' && hostname"