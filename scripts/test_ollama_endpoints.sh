#!/bin/bash
# Test Ollama endpoints from client

echo "Testing Ollama endpoints connectivity..."
echo "======================================="

OLLAMA_HOST="100.114.129.95"
OLLAMA_PORT="11434"

echo ""
echo "1. Testing basic connectivity to Ollama:"
echo "   Command: nc -zv $OLLAMA_HOST $OLLAMA_PORT"
nc -zv $OLLAMA_HOST $OLLAMA_PORT 2>&1

echo ""
echo "2. Testing /api/version endpoint:"
echo "   URL: http://$OLLAMA_HOST:$OLLAMA_PORT/api/version"
if curl -s --connect-timeout 5 http://$OLLAMA_HOST:$OLLAMA_PORT/api/version > /dev/null 2>&1; then
    echo "   ✓ Version endpoint accessible"
    curl -s http://$OLLAMA_HOST:$OLLAMA_PORT/api/version
else
    echo "   ✗ Version endpoint not accessible"
    echo "   Trying with verbose output:"
    curl -v --connect-timeout 5 http://$OLLAMA_HOST:$OLLAMA_PORT/api/version 2>&1 | head -20
fi

echo ""
echo "3. Testing /api/tags endpoint:"
echo "   URL: http://$OLLAMA_HOST:$OLLAMA_PORT/api/tags"
if curl -s --connect-timeout 5 http://$OLLAMA_HOST:$OLLAMA_PORT/api/tags > /dev/null 2>&1; then
    echo "   ✓ Tags endpoint accessible"
    curl -s http://$OLLAMA_HOST:$OLLAMA_PORT/api/tags | python3 -c "import json, sys; d=json.load(sys.stdin); print(f\"   Models found: {len(d.get('models', []))}\"); [print(f\"     - {m['name']}\") for m in d.get('models', [])]"
else
    echo "   ✗ Tags endpoint not accessible"
    echo "   Trying with verbose output:"
    curl -v --connect-timeout 5 http://$OLLAMA_HOST:$OLLAMA_PORT/api/tags 2>&1 | head -20
fi

echo ""
echo "4. Testing from different IPs:"
echo "   Trying LAN IP (10.0.10.244):"
curl -s --connect-timeout 2 http://10.0.10.244:11434/api/version 2>&1 && echo "   ✓ LAN IP works" || echo "   ✗ LAN IP doesn't work"

echo ""
echo "5. Testing Tailscale connectivity:"
tailscale ping -c 1 $OLLAMA_HOST 2>&1 | grep -E "pong|time"

echo ""
echo "======================================="
echo "If endpoints fail, check:"
echo "1. Tailscale is connected: tailscale status"
echo "2. Can ping Mini: tailscale ping $OLLAMA_HOST"
echo "3. Firewall isn't blocking port $OLLAMA_PORT"
echo "4. Try the LAN IP if on same network: http://10.0.10.244:11434/api/version"