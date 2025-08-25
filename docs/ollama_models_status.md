# Ollama Models Status

## Currently Installed
- ✅ **llama3.2:3b** - 2.0 GB (test model)

## Currently Downloading
- ⏳ **qwen2.5-coder:32b-instruct-q4_K_M** - 19 GB (11% complete)
  - Primary coding assistant
  - Best for complex code generation and analysis
  
- ⏳ **qwen2.5-coder:14b-instruct-q4_K_M** - 9 GB (6% complete)
  - Fast coding model for quick iterations
  - Good balance of speed and quality

## Recommended Models to Download Later

### Essential for Development
1. **deepseek-coder-v2:16b-lite-instruct-q4_K_M** (~9 GB)
   - Alternative coding model
   - Good for different perspectives

2. **llama3.3:70b-instruct-q4_K_M** (~40 GB)
   - Heavy reasoning and architecture decisions
   - Best for complex problem solving

3. **qwen2.5:72b-instruct-q4_K_M** (~42 GB)
   - Documentation and analysis
   - Excellent for writing and reviewing docs

### Download Commands
```bash
# From Air, download models on Mini:
ssh 100.118.38.115 'ollama pull deepseek-coder-v2:16b-lite-instruct-q4_K_M'
ssh 100.118.38.115 'ollama pull llama3.3:70b-instruct-q4_K_M'
ssh 100.118.38.115 'ollama pull qwen2.5:72b-instruct-q4_K_M'
```

### Check Download Progress
```bash
# Watch download progress
ssh 100.118.38.115 'watch ollama list'
```

## Network Note
- Currently on WiFi: ~60-120 MB/s download speeds
- After ethernet connection: Should get 500+ MB/s speeds
- Estimated time on WiFi: 2-3 hours per large model
- Estimated time on ethernet: 15-30 minutes per large model

## Storage Usage
- Total estimated storage for all models: ~120 GB
- Current usage: ~30 GB (after current downloads complete)
- Available on Mini: Check with `ssh 100.118.38.115 'df -h /'`