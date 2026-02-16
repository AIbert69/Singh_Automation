# Troubleshooting Guide - Singh Automation Platform

## Claude API Connection Issues

### Symptom: "Can't reach the Claude API" or Connection Timeout Errors

If you're experiencing issues connecting to the Claude API, follow these troubleshooting steps:

#### 1. Verify API Key Configuration

**Check if ANTHROPIC_API_KEY is set:**

```bash
# For local development
echo $ANTHROPIC_API_KEY

# For Vercel deployments
vercel env ls
```

**What to verify:**
- API key exists and is not empty
- API key starts with `sk-ant-api03-` (Anthropic API key format)
- API key has no extra spaces or quotes
- API key is not expired

**How to get an API key:**
1. Visit https://console.anthropic.com/
2. Sign in or create an account
3. Go to API Keys section
4. Generate a new key
5. Add it to your environment:
   - **Local**: Create `.env` file with `ANTHROPIC_API_KEY=your-key-here`
   - **Vercel**: `vercel env add ANTHROPIC_API_KEY`

#### 2. Test API Connectivity

**Using the health check endpoint:**

```bash
# Basic health check
curl http://localhost:3000/api/health

# With connectivity testing
curl "http://localhost:3000/api/health?testing=true"
```

**Expected response when working:**
```json
{
  "status": "ok",
  "services": {
    "claude": true
  },
  "connectivity": {
    "claude": {
      "connected": true,
      "latency": 234
    }
  }
}
```

**Expected response when failing:**
```json
{
  "status": "warning",
  "services": {
    "claude": true
  },
  "connectivity": {
    "claude": {
      "connected": false,
      "latency": 5234,
      "error": "Network error or timeout"
    }
  }
}
```

#### 3. Common Issues and Solutions

##### Issue: "ANTHROPIC_API_KEY not configured"
**Solution:**
1. Create a `.env` file in the project root (if local)
2. Add: `ANTHROPIC_API_KEY=your-key-here`
3. Restart your dev server: `npm run dev`

For Vercel:
```bash
vercel env add ANTHROPIC_API_KEY
# Enter your key when prompted
vercel --prod  # Redeploy
```

##### Issue: "Network error calling Claude API"
**Possible causes:**
- Firewall blocking outbound HTTPS to api.anthropic.com
- Corporate proxy intercepting requests
- DNS resolution issues
- Network connectivity problems

**Solutions:**
```bash
# Test network connectivity
ping api.anthropic.com
curl -I https://api.anthropic.com

# If behind a proxy, set proxy environment variables
export HTTPS_PROXY=http://your-proxy:port
export HTTP_PROXY=http://your-proxy:port

# Restart your application
npm run dev
```

##### Issue: "Claude API request timeout after 90000ms"
**Possible causes:**
- Slow network connection
- API endpoint experiencing high load
- Large request payload

**Solutions:**
1. Check your network speed
2. Try again (the code has automatic retry logic)
3. Check Anthropic API status: https://status.anthropic.com
4. If persistent, increase timeout in code:
   ```javascript
   await generateWithClaude(apiKey, systemPrompt, userPrompt, {
     timeout: 120000  // 2 minutes instead of 90 seconds
   });
   ```

##### Issue: "HTTP 401: Unauthorized" or "Invalid API Key"
**Solutions:**
1. Verify your API key is correct (no typos)
2. Check if the key is still active in Anthropic console
3. Generate a new API key if needed
4. Update environment variable
5. Restart application

##### Issue: "HTTP 429: Rate Limit Exceeded"
**Solutions:**
1. Wait 60 seconds and try again
2. The code automatically retries with exponential backoff
3. Check your API usage in Anthropic console
4. Upgrade your API plan if needed

##### Issue: "HTTP 500: Internal Server Error" from Anthropic
**Solutions:**
1. This is an Anthropic API issue, not your code
2. Check https://status.anthropic.com
3. The code will automatically retry
4. Try again in a few minutes

#### 4. Advanced Diagnostics

**Check API call in code:**

```javascript
import { testClaudeConnection } from './lib/claude-api.js';

// Test connection
const result = await testClaudeConnection(process.env.ANTHROPIC_API_KEY);
console.log('Connection test:', result);

// Expected output:
// { connected: true, latency: 234 }
// or
// { connected: false, latency: 5234, error: "Timeout" }
```

**Enable debug logging:**

Set `DEBUG_MODE=true` in your `.env` file to see detailed API request/response logs.

#### 5. Production Deployment (Vercel)

**Verify environment variables are set:**

```bash
# List all environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local
```

**Redeploy after changing environment variables:**

```bash
vercel --prod
```

**Check deployment logs:**

```bash
vercel logs
# Look for "ANTHROPIC_API_KEY not configured" or other errors
```

#### 6. Retry Logic

The code automatically retries failed requests with exponential backoff:
- Attempt 1: Immediate
- Attempt 2: After 2 seconds
- Attempt 3: After 4 seconds
- Attempt 4: After 8 seconds

If all 4 attempts fail, the error is returned to the user with detailed diagnostics.

#### 7. Getting Help

If you're still experiencing issues after trying these solutions:

1. **Check Anthropic API Status**: https://status.anthropic.com
2. **Review error logs**:
   - Local: Check your terminal output
   - Vercel: `vercel logs`
3. **Contact Anthropic Support**: support@anthropic.com
4. **File an issue**: Include:
   - Error message (without API key)
   - Network diagnostics (ping, curl results)
   - Environment (local vs Vercel)
   - Timestamp of the error

---

## SAM.gov API Connection Issues

### Symptom: "SAM API error" or "Failed to fetch opportunities"

#### Solutions:

1. **Verify SAM API Key:**
   ```bash
   echo $SAM_API_KEY
   ```

2. **Get SAM API Key:**
   - Visit https://sam.gov/
   - Create account or sign in
   - Go to Profile > API Keys
   - Generate new key (instant approval for public data)

3. **Fallback:**
   - The app can work without SAM API key using public endpoint
   - Some features may be limited

---

## Quick Reference

### Environment Variables Checklist

- [ ] `ANTHROPIC_API_KEY` - Required for proposal generation
- [ ] `SAM_API_KEY` - Optional, improves SAM.gov access
- [ ] `DEBUG_MODE` - Optional, set to `true` for verbose logging

### Health Check URLs

- **Local**: http://localhost:3000/api/health?testing=true
- **Production**: https://singh-automation.vercel.app/api/health?testing=true

### Support Resources

- **Anthropic API Docs**: https://docs.anthropic.com
- **Anthropic API Status**: https://status.anthropic.com
- **SAM.gov API Docs**: https://open.gsa.gov/api/entity-api/
- **Project Issues**: https://github.com/AIbert69/Singh_Automation/issues
