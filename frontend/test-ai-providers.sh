# AI Provider Testing - cURL Commands
# Run these from WSL/Git Bash to test which providers work from your network

# ============================================================================
# 1. ANTHROPIC CLAUDE
# ============================================================================
curl https://api.anthropic.com/v1/messages \
  --header "x-api-key: YOUR_ANTHROPIC_KEY_HERE" \
  --header "anthropic-version: 2023-06-01" \
  --header "content-type: application/json" \
  --data '{
    "model": "claude-3-5-sonnet-20240620",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Say hello"}]
  }'

# Expected: Should return JSON with "content" field containing response
# If fails: Network/firewall blocking Anthropic API

# ============================================================================
# 2. OPENAI GPT-4
# ============================================================================
curl https://api.openai.com/v1/chat/completions \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer YOUR_OPENAI_KEY_HERE" \
  --data '{
    "model": "gpt-4-turbo-preview",
    "messages": [{"role": "user", "content": "Say hello"}],
    "max_tokens": 100
  }'

# Expected: Should return JSON with "choices" array
# If fails: Network/firewall blocking OpenAI API

# ============================================================================
# 3. GOOGLE GEMINI
# ============================================================================
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=YOUR_GEMINI_KEY_HERE" \
  --header "Content-Type: application/json" \
  --data '{
    "contents": [{
      "parts": [{"text": "Say hello"}]
    }],
    "generationConfig": {
      "maxOutputTokens": 100
    }
  }'

# Expected: Should return JSON with "candidates" array
# If fails: Network/firewall blocking Google API

# ============================================================================
# 4. AZURE OPENAI
# ============================================================================
curl "https://YOUR_RESOURCE.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT/chat/completions?api-version=2024-02-15-preview" \
  --header "Content-Type: application/json" \
  --header "api-key: YOUR_AZURE_KEY_HERE" \
  --data '{
    "messages": [{"role": "user", "content": "Say hello"}],
    "max_tokens": 100
  }'

# Expected: Should return JSON with "choices" array
# If fails: Check Azure endpoint URL and deployment name

# ============================================================================
# QUICK NETWORK TEST
# ============================================================================

# Test if you can reach each API endpoint:
curl -I https://api.anthropic.com
curl -I https://api.openai.com
curl -I https://generativelanguage.googleapis.com

# If any return "Connection timeout" or "Connection refused":
# → That provider is blocked by your network/firewall

# ============================================================================
# TROUBLESHOOTING
# ============================================================================

# If Anthropic works in WSL but not in Windows Node.js:
# 1. Windows Firewall is blocking Node.js
# 2. Corporate proxy/VPN blocking outbound connections
# 3. Antivirus blocking Node.js network access

# Solutions:
# - Use Azure OpenAI (usually more accessible in corporate networks)
# - Configure proxy in Node.js
# - Add Node.js exception to Windows Firewall
# - Disable AI and use static form flow (works perfectly!)

# ============================================================================
# TESTING RESULTS TEMPLATE
# ============================================================================

# Copy and fill this out after testing:

# ✅ Anthropic Claude: [WORKS / FAILS / TIMEOUT]
# ✅ OpenAI GPT-4:     [WORKS / FAILS / TIMEOUT]
# ✅ Google Gemini:    [WORKS / FAILS / TIMEOUT]
# ✅ Azure OpenAI:     [WORKS / FAILS / TIMEOUT]

# Recommended provider based on results: __________
