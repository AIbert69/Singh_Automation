/**
 * @fileoverview Input validation schemas using Zod
 * @module lib/validation
 *
 * Provides type-safe validation for all API inputs, ensuring data integrity
 * and preventing injection attacks.
 */

import { z } from 'zod';

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

/**
 * Valid email address schema
 */
export const emailSchema = z
    .string()
    .email('Invalid email address')
    .max(254, 'Email too long');

/**
 * Alphanumeric ID schema (prevents injection)
 * Allows: letters, numbers, hyphens, underscores
 */
export const safeIdSchema = z
    .string()
    .min(1, 'ID is required')
    .max(100, 'ID too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'ID contains invalid characters');

/**
 * URL schema with HTTPS preference
 */
export const urlSchema = z
    .string()
    .url('Invalid URL')
    .max(2048, 'URL too long');

/**
 * Date string schema (ISO 8601 format)
 */
export const dateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/, 'Invalid date format');

/**
 * NAICS code schema (6 digits)
 */
export const naicsCodeSchema = z
    .string()
    .regex(/^\d{6}$/, 'Invalid NAICS code format');

/**
 * Currency amount schema (positive number)
 */
export const currencySchema = z
    .number()
    .positive('Amount must be positive')
    .max(1000000000000, 'Amount too large');

// =============================================================================
// OPPORTUNITY SCHEMAS
// =============================================================================

/**
 * Opportunity status enum
 */
export const opportunityStatusSchema = z.enum(['GO', 'NO-GO', 'Review']);

/**
 * Opportunity type enum
 */
export const opportunityTypeSchema = z.enum([
    'contract', 'sbir', 'grant', 'state', 'county', 'dibbs', 'forecast'
]);

/**
 * Full opportunity object schema
 */
export const opportunitySchema = z.object({
    id: safeIdSchema,
    noticeId: safeIdSchema.optional(),
    title: z.string().min(1).max(500),
    solicitation: z.string().max(100).optional(),
    agency: z.string().max(200).optional(),
    postedDate: z.string().optional(),
    closeDate: z.string().nullable().optional(),
    setAside: z.string().max(200).optional(),
    naicsCode: z.string().max(10).optional(),
    value: z.number().nullable().optional(),
    description: z.string().max(10000).optional(),
    fullDescription: z.string().optional(),
    link: urlSchema.optional(),
    isLive: z.boolean().optional(),
    source: z.string().max(50).optional(),
    type: opportunityTypeSchema.optional(),
    category: z.string().max(50).optional(),
    status: opportunityStatusSchema.optional(),
    statusReason: z.string().max(500).optional(),
    recommendation: z.string().max(50).optional(),
    qualification: z.object({
        status: opportunityStatusSchema,
        reason: z.string(),
        recommendation: z.string().optional(),
        score: z.number().optional(),
        breakdown: z.record(z.unknown()).optional(),
    }).optional(),
});

/**
 * Partial opportunity for updates
 */
export const partialOpportunitySchema = opportunitySchema.partial();

// =============================================================================
// API REQUEST SCHEMAS
// =============================================================================

/**
 * Email subscription request
 */
export const emailSubscriptionSchema = z.object({
    email: emailSchema,
    frequency: z.enum(['daily', 'weekly', 'immediate']).optional().default('daily'),
});

/**
 * Scan filters request
 */
export const scanFiltersSchema = z.object({
    keywords: z.array(z.string().max(100)).max(20).optional(),
    naicsCodes: z.array(naicsCodeSchema).max(10).optional(),
    minValue: currencySchema.optional(),
    maxValue: currencySchema.optional(),
    states: z.array(z.string().length(2)).max(50).optional(),
    daysBack: z.number().int().min(1).max(365).optional().default(60),
    limit: z.number().int().min(1).max(500).optional().default(100),
});

/**
 * Opportunity filter request
 */
export const opportunityFilterSchema = z.object({
    minScore: z.number().int().min(0).max(100).optional().default(50),
    limit: z.number().int().min(1).max(500).optional().default(100),
    portal: z.string().max(50).optional(),
    status: opportunityStatusSchema.optional(),
    type: opportunityTypeSchema.optional(),
});

/**
 * Proposal generation request
 */
export const proposalRequestSchema = z.object({
    opportunityId: safeIdSchema,
    opportunity: opportunitySchema.optional(),
    includeAwards: z.boolean().optional().default(true),
    format: z.enum(['json', 'docx', 'pdf']).optional().default('json'),
});

/**
 * Validation request (for Claude API)
 */
export const validationRequestSchema = z.object({
    opportunity: opportunitySchema,
    context: z.string().max(50000).optional(),
});

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validates input against a schema and returns result
 * @template T
 * @param {z.ZodSchema<T>} schema - Zod schema to validate against
 * @param {unknown} input - Input to validate
 * @returns {{ success: true, data: T } | { success: false, errors: string[] }}
 */
export function validateInput(schema, input) {
    const result = schema.safeParse(input);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors = result.error.errors.map(err => {
        const path = err.path.join('.');
        return path ? `${path}: ${err.message}` : err.message;
    });

    return { success: false, errors };
}

/**
 * Validates and throws on failure
 * @template T
 * @param {z.ZodSchema<T>} schema - Zod schema to validate against
 * @param {unknown} input - Input to validate
 * @returns {T}
 * @throws {ValidationError} If validation fails
 */
export function validateOrThrow(schema, input) {
    const result = validateInput(schema, input);

    if (!result.success) {
        const error = new Error(`Validation failed: ${result.errors.join(', ')}`);
        error.name = 'ValidationError';
        error.errors = result.errors;
        throw error;
    }

    return result.data;
}

/**
 * Sanitizes a string for safe HTML display
 * @param {string} str - String to sanitize
 * @returns {string}
 */
export function sanitizeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

/**
 * Sanitizes a string for safe use in JavaScript context
 * @param {string} str - String to sanitize
 * @returns {string}
 */
export function sanitizeJs(str) {
    if (!str) return '';
    return str
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
}

// =============================================================================
// ANTHROPIC API MESSAGE SANITIZATION
// =============================================================================

/**
 * Valid media types for Anthropic API image content blocks
 */
const VALID_IMAGE_MEDIA_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
];

/**
 * Detects image media type from base64 data header bytes.
 * @param {string} data - Base64-encoded image data
 * @returns {string} Detected media type or 'image/png' as default
 */
function detectMediaType(data) {
    if (!data || typeof data !== 'string') return 'image/png';

    // Strip data URI prefix if present (e.g., "data:image/jpeg;base64,...")
    const dataUriMatch = data.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    if (dataUriMatch) {
        const type = dataUriMatch[1].toLowerCase();
        if (VALID_IMAGE_MEDIA_TYPES.includes(type)) return type;
    }

    // Detect from magic bytes in base64
    // JPEG: /9j/ (FF D8 FF)
    // PNG: iVBOR (89 50 4E 47)
    // GIF: R0lG (47 49 46)
    // WebP: UklGR (52 49 46 46)
    const raw = data.replace(/^data:[^;]+;base64,/, '');
    if (raw.startsWith('/9j/')) return 'image/jpeg';
    if (raw.startsWith('iVBOR')) return 'image/png';
    if (raw.startsWith('R0lG')) return 'image/gif';
    if (raw.startsWith('UklGR')) return 'image/webp';

    return 'image/png';
}

/**
 * Ensures every image content block in an Anthropic API message has
 * a valid media_type field. Fixes the error:
 *   "messages.N.content.M.image.source.base64.media_type: Field required"
 *
 * @param {string|Array} content - Message content (string or array of content blocks)
 * @returns {string|Array} Sanitized content with media_type set on all image blocks
 */
export function sanitizeMessageContent(content) {
    // String content has no image blocks to fix
    if (typeof content === 'string') return content;
    if (!Array.isArray(content)) return content;

    return content.map(block => {
        if (!block || typeof block !== 'object') return block;
        if (block.type !== 'image') return block;

        // Ensure source exists and has required fields
        const source = block.source;
        if (!source || typeof source !== 'object') return block;

        if (source.type === 'base64' && !source.media_type) {
            return {
                ...block,
                source: {
                    ...source,
                    media_type: detectMediaType(source.data),
                    // Strip data URI prefix from data field if present
                    data: typeof source.data === 'string'
                        ? source.data.replace(/^data:[^;]+;base64,/, '')
                        : source.data,
                },
            };
        }

        // Validate existing media_type is one Anthropic accepts
        if (source.type === 'base64' && source.media_type &&
            !VALID_IMAGE_MEDIA_TYPES.includes(source.media_type)) {
            return {
                ...block,
                source: {
                    ...source,
                    media_type: detectMediaType(source.data),
                },
            };
        }

        return block;
    });
}

/**
 * Sanitizes all messages in an Anthropic API messages array, ensuring
 * every image content block has a valid media_type.
 *
 * @param {Array} messages - Anthropic API messages array
 * @returns {Array} Sanitized messages
 */
export function sanitizeMessages(messages) {
    if (!Array.isArray(messages)) return messages;

    return messages.map(msg => {
        if (!msg || typeof msg !== 'object') return msg;
        return {
            ...msg,
            content: sanitizeMessageContent(msg.content),
        };
    });
}

export default {
    // Schemas
    emailSchema,
    safeIdSchema,
    urlSchema,
    dateSchema,
    naicsCodeSchema,
    currencySchema,
    opportunitySchema,
    emailSubscriptionSchema,
    scanFiltersSchema,
    opportunityFilterSchema,
    proposalRequestSchema,
    validationRequestSchema,

    // Utilities
    validateInput,
    validateOrThrow,
    sanitizeHtml,
    sanitizeJs,
    sanitizeMessageContent,
    sanitizeMessages,
};
