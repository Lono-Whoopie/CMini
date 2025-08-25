#!/bin/bash
# Claude Mini Server Update Checker

MINI_IP="100.114.129.95"
PORTAL_PORT="8080"
TASK_PORT="3001"

echo "🔍 Checking Mini Server for updates..."
echo ""

# Check portal version
echo "📋 Portal Version:"
curl -s http://${MINI_IP}:${PORTAL_PORT}/version 2>/dev/null | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(f\"  Version: {data.get('version', 'Unknown')}\")
    print(f\"  Updated: {data.get('updated', 'Unknown')}\")
    print(f\"  Features:\")
    for f in data.get('features', []):
        print(f\"    - {f}\")
except:
    print('  ❌ Could not reach portal')
"

echo ""
echo "🚀 Server Capabilities:"
curl -s http://${MINI_IP}:${TASK_PORT}/api/stats 2>/dev/null | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    caps = data.get('capabilities', {})
    for key, value in caps.items():
        print(f\"  - {key}: {value}\")
except:
    print('  ❌ Could not reach task server')
"

echo ""
echo "🤖 Available Models:"
curl -s http://${MINI_IP}:${TASK_PORT}/api/models 2>/dev/null | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    installed = data.get('installed', [])
    print(f\"  Installed: {len(installed)} models\")
    for model in installed[:5]:  # Show first 5
        print(f\"    - {model}\")
    if len(installed) > 5:
        print(f\"    ... and {len(installed)-5} more\")
except:
    print('  ❌ Could not fetch models')
"

echo ""
echo "💡 To update your configuration:"
echo "   1. Visit http://${MINI_IP}:${PORTAL_PORT}"
echo "   2. Copy the latest instructions"
echo "   3. Paste into Claude to reconfigure"
echo ""
echo "✅ Update check complete!"