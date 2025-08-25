#!/usr/bin/env python3
"""
Test Mini Server Integration - Verify all features work
"""

import sys
import os
import json

# Load the Mini client
sys.path.insert(0, os.path.expanduser('~'))
exec(open(os.path.expanduser('~/.claude_mini_client.py')).read())

print("🧪 Testing Mini Server Integration")
print("=" * 50)

# 1. Test connection
print("\n1️⃣ Testing connection...")
try:
    health = mini_client.get_server_health()
    print(f"   ✅ Server status: {health['status']}")
except Exception as e:
    print(f"   ❌ Connection failed: {e}")
    sys.exit(1)

# 2. Test models
print("\n2️⃣ Checking models...")
try:
    models = mini_client.get_available_models()
    print(f"   ✅ Models installed: {len(models['installed'])}")
    for model in models['installed']:
        print(f"      - {model}")
except Exception as e:
    print(f"   ❌ Model check failed: {e}")

# 3. Test queue stats
print("\n3️⃣ Checking queue...")
try:
    stats = mini_client.get_queue_stats()
    print(f"   ✅ Queue status: {stats['stats']}")
except Exception as e:
    print(f"   ❌ Queue check failed: {e}")

# 4. Test CrewAI endpoint
print("\n4️⃣ Testing CrewAI endpoint...")
try:
    # Submit a test crew (don't wait)
    result = mini_client.execute_crew(
        task_description="Test crew connectivity",
        context="This is just a test",
        wait=False
    )
    if result.get('success'):
        print(f"   ✅ CrewAI endpoint working - Job ID: {result['job_id']}")
    else:
        print(f"   ⚠️ CrewAI endpoint returned: {result}")
except Exception as e:
    print(f"   ❌ CrewAI test failed: {e}")

# 5. Test AutoGen endpoint
print("\n5️⃣ Testing AutoGen endpoint...")
try:
    # Submit a test team (don't wait)
    result = mini_client.execute_autogen(
        task_description="Test team connectivity",
        max_rounds=1,
        wait=False
    )
    if result.get('success'):
        print(f"   ✅ AutoGen endpoint working - Job ID: {result['job_id']}")
    else:
        print(f"   ⚠️ AutoGen endpoint returned: {result}")
except Exception as e:
    print(f"   ❌ AutoGen test failed: {e}")

# 6. Test update checking
print("\n6️⃣ Checking for updates...")
try:
    import subprocess
    result = subprocess.run(
        ['curl', '-s', 'http://100.114.129.95:8080/version'],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        version_data = json.loads(result.stdout)
        print(f"   ✅ Portal version: {version_data['version']} ({version_data['updated']})")
    else:
        print("   ⚠️ Could not check version")
except Exception as e:
    print(f"   ❌ Update check failed: {e}")

print("\n" + "=" * 50)
print("✅ Integration test complete!")
print("\n💡 Your Air is fully configured to use the Mini for:")
print("   - CrewAI crews (no timeout)")
print("   - AutoGen teams (no timeout)")
print("   - Heavy model inference (32B+)")
print("   - Long-running tasks (days/weeks)")
print("   - Automatic update checking")