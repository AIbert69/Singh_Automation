/**
 * @fileoverview Claude API client with robust error handling and retry logic
 * @module lib/claude-api
 *
 * Provides reliable Claude API integration with:
 * - Exponential backoff retry logic
 * - Connection diagnostics
 * - Detailed error reporting
 * - Timeout management
 */

/**
 * Claude API error with enhanced diagnostics
 */
class ClaudeAPIError extends Error {
    constructor(message, statusCode, details = {}) {
        super(message);
        this.name = 'ClaudeAPIError';
        this.statusCode = statusCode;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * Delays execution for specified milliseconds
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Tests connectivity to Claude API
 * @param {string} apiKey - Anthropic API key
 * @returns {Promise<{connected: boolean, latency: number, error?: string}>}
 */
export async function testClaudeConnection(apiKey) {
    const startTime = Date.now();

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 10,
                messages: [{ role: 'user', content: 'test' }]
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const latency = Date.now() - startTime;

        if (response.ok || response.status === 400) {
            // 400 is OK for test - means we connected, just invalid request
            return { connected: true, latency };
        }

        return {
            connected: false,
            latency,
            error: `HTTP ${response.status}: ${response.statusText}`
        };

    } catch (error) {
        const latency = Date.now() - startTime;
        return {
            connected: false,
            latency,
            error: error.message
        };
    }
}

/**
 * Makes a Claude API request with retry logic
 * @param {string} apiKey - Anthropic API key
 * @param {Object} payload - Request payload
 * @param {Object} options - Configuration options
 * @param {number} options.timeout - Request timeout in ms (default: 90000)
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @param {Function} options.log - Logging function
 * @returns {Promise<Object>} Claude API response
 * @throws {ClaudeAPIError} If all retry attempts fail
 */
export async function callClaudeAPI(apiKey, payload, options = {}) {
    const {
        timeout = 90000,
        maxRetries = 3,
        log = console.log
    } = options;

    const retryDelays = [2000, 4000, 8000]; // Exponential backoff

    if (!apiKey || apiKey.trim() === '') {
        throw new ClaudeAPIError(
            'ANTHROPIC_API_KEY is not configured or is empty',
            503,
            {
                hint: 'Set ANTHROPIC_API_KEY in your environment variables or .env file',
                docs: 'https://docs.anthropic.com/en/api/getting-started'
            }
        );
    }

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                const delayMs = retryDelays[attempt - 1] || 8000;
                log('info', `Retrying Claude API call (attempt ${attempt + 1}/${maxRetries + 1}) after ${delayMs}ms`);
                await delay(delayMs);
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Success - parse and return
            if (response.ok) {
                const data = await response.json();
                return data;
            }

            // Handle error responses
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { message: errorText };
            }

            // Don't retry on 4xx errors (except 429 rate limit)
            if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                throw new ClaudeAPIError(
                    `Claude API error: ${errorData.error?.message || errorText}`,
                    response.status,
                    {
                        type: errorData.error?.type,
                        raw: errorText.substring(0, 500)
                    }
                );
            }

            // Retry on 5xx errors and 429 rate limit
            lastError = new ClaudeAPIError(
                `Claude API error (will retry): ${errorData.error?.message || response.statusText}`,
                response.status,
                { type: errorData.error?.type, attempt: attempt + 1 }
            );

            log('warn', lastError.message, { statusCode: response.status, attempt: attempt + 1 });

        } catch (error) {
            // Handle network errors, timeouts, etc.
            if (error.name === 'AbortError') {
                lastError = new ClaudeAPIError(
                    `Claude API request timeout after ${timeout}ms`,
                    408,
                    { attempt: attempt + 1, timeout }
                );
            } else if (error.name === 'ClaudeAPIError') {
                // Re-throw client errors immediately
                throw error;
            } else {
                lastError = new ClaudeAPIError(
                    `Network error calling Claude API: ${error.message}`,
                    0,
                    {
                        attempt: attempt + 1,
                        originalError: error.name,
                        hint: 'Check network connectivity and firewall settings'
                    }
                );
            }

            log('warn', lastError.message, lastError.details);
        }
    }

    // All retries exhausted
    throw new ClaudeAPIError(
        `Claude API call failed after ${maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`,
        lastError?.statusCode || 500,
        {
            attempts: maxRetries + 1,
            lastError: lastError?.details,
            troubleshooting: [
                'Verify ANTHROPIC_API_KEY is valid and not expired',
                'Check network connectivity to api.anthropic.com',
                'Verify no firewall or proxy is blocking the connection',
                'Check Anthropic API status at https://status.anthropic.com'
            ]
        }
    );
}

/**
 * Generates proposal content using Claude API
 * @param {string} apiKey - Anthropic API key
 * @param {string} systemPrompt - System instructions
 * @param {string} userPrompt - User message
 * @param {Object} options - Configuration options
 * @returns {Promise<{content: string, tokens: Object, cost: string}>}
 */
export async function generateWithClaude(apiKey, systemPrompt, userPrompt, options = {}) {
    const log = options.log || console.log;

    log('info', 'Calling Claude API for proposal generation');

    const payload = {
        model: 'claude-sonnet-4-20250514',
        max_tokens: options.maxTokens || 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
    };

    try {
        const data = await callClaudeAPI(apiKey, payload, {
            timeout: options.timeout || 90000,
            maxRetries: options.maxRetries || 3,
            log
        });

        const content = data.content[0]?.text || '';
        const inputTokens = data.usage?.input_tokens || 0;
        const outputTokens = data.usage?.output_tokens || 0;
        const cost = (inputTokens * 0.003 + outputTokens * 0.015) / 1000;

        log('info', 'Claude response received', { inputTokens, outputTokens, cost: `$${cost.toFixed(4)}` });

        return {
            content,
            tokens: { input: inputTokens, output: outputTokens },
            cost: `$${cost.toFixed(4)}`
        };

    } catch (error) {
        if (error.name === 'ClaudeAPIError') {
            log('error', 'Claude API error', {
                message: error.message,
                statusCode: error.statusCode,
                details: error.details
            });
        }
        throw error;
    }
}

export default {
    testClaudeConnection,
    callClaudeAPI,
    generateWithClaude,
    ClaudeAPIError
};
