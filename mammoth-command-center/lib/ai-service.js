/**
 * Mammoth Command Center - AI Service
 * Claude AI integration for email intelligence, deal insights, and task parsing
 */

import { AI_CONFIG } from './config.js';
import { sanitizeMessages } from '../../lib/validation.js';

// =============================================================================
// AI SERVICE CLASS
// =============================================================================

export class AIService {
  constructor(apiKey = null) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY;
    this.model = AI_CONFIG.model;
    this.maxTokens = AI_CONFIG.maxTokens;
    this.baseUrl = 'https://api.anthropic.com/v1';
  }

  /**
   * Make a request to Claude API
   */
  async chat(messages, options = {}) {
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: options.model || this.model,
        max_tokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || AI_CONFIG.temperature,
        messages: sanitizeMessages(messages)
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'AI service error');
    }

    const data = await response.json();
    return data.content[0].text;
  }

  // ===========================================================================
  // EMAIL INTELLIGENCE
  // ===========================================================================

  /**
   * Summarize an email thread
   * @param {Array} emails - Array of email objects in the thread
   * @returns {Object} Summary with key points and action items
   */
  async summarizeEmailThread(emails) {
    const emailsText = emails.map((email, i) => `
Email ${i + 1}:
From: ${email.from_address}
To: ${email.to_addresses?.join(', ')}
Subject: ${email.subject}
Date: ${email.sent_at}
Body:
${email.body_text || email.body_preview}
---`).join('\n');

    const response = await this.chat([
      {
        role: 'user',
        content: `Analyze this email thread and provide:
1. A concise summary (2-3 sentences)
2. Key points (bullet points)
3. Action items if any
4. Overall sentiment (positive, neutral, negative, or urgent)

Email Thread:
${emailsText}

Respond in JSON format:
{
  "summary": "...",
  "keyPoints": ["...", "..."],
  "actionItems": ["...", "..."],
  "sentiment": "...",
  "urgency": "low|medium|high"
}`
      }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        summary: response,
        keyPoints: [],
        actionItems: [],
        sentiment: 'neutral',
        urgency: 'medium'
      };
    }
  }

  /**
   * Analyze email sentiment
   * @param {string} emailContent - Email body text
   * @returns {Object} Sentiment analysis result
   */
  async analyzeEmailSentiment(emailContent) {
    const response = await this.chat([
      {
        role: 'user',
        content: `Analyze the sentiment and urgency of this email. Respond in JSON format only.

Email:
${emailContent}

Response format:
{
  "sentiment": "positive|neutral|negative|urgent",
  "confidence": 0.0-1.0,
  "indicators": ["reason 1", "reason 2"],
  "suggestedCategory": "needs_response|waiting|fyi|scheduled",
  "priority": "low|medium|high|urgent"
}`
      }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        indicators: [],
        suggestedCategory: 'fyi',
        priority: 'medium'
      };
    }
  }

  /**
   * Generate email draft response
   * @param {Object} context - Email context
   * @returns {Object} Draft response
   */
  async generateEmailDraft(context) {
    const { originalEmail, contactInfo, dealInfo, tone = 'professional', instruction = '' } = context;

    const contextInfo = [];
    if (contactInfo) {
      contextInfo.push(`Contact: ${contactInfo.first_name} ${contactInfo.last_name} (${contactInfo.organization || 'N/A'})`);
    }
    if (dealInfo) {
      contextInfo.push(`Related Deal: ${dealInfo.title} - ${dealInfo.stage} - $${dealInfo.value}`);
    }

    const response = await this.chat([
      {
        role: 'user',
        content: `Draft a ${tone} email response to this message.

Original Email:
From: ${originalEmail.from_address}
Subject: ${originalEmail.subject}
Body:
${originalEmail.body_text || originalEmail.body_preview}

${contextInfo.length > 0 ? `Context:\n${contextInfo.join('\n')}` : ''}

${instruction ? `Additional Instructions: ${instruction}` : ''}

Generate a response that:
1. Is ${tone} in tone
2. Addresses the key points
3. Includes appropriate greeting and sign-off
4. Is concise but complete

Respond in JSON format:
{
  "subject": "Re: ...",
  "body": "...",
  "suggestedFollowUp": "description of any follow-up action"
}`
      }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        subject: `Re: ${originalEmail.subject}`,
        body: response,
        suggestedFollowUp: null
      };
    }
  }

  /**
   * Extract entities from email
   * @param {string} emailContent - Email body text
   * @returns {Object} Extracted entities
   */
  async extractEmailEntities(emailContent) {
    const response = await this.chat([
      {
        role: 'user',
        content: `Extract structured data from this email. Respond in JSON format only.

Email:
${emailContent}

Extract:
{
  "people": [{"name": "...", "role": "..."}],
  "companies": ["..."],
  "dates": [{"date": "YYYY-MM-DD", "context": "..."}],
  "amounts": [{"value": 0, "currency": "USD", "context": "..."}],
  "actionItems": [{"task": "...", "assignee": "...", "dueDate": "..."}],
  "topics": ["..."]
}`
      }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        people: [],
        companies: [],
        dates: [],
        amounts: [],
        actionItems: [],
        topics: []
      };
    }
  }

  // ===========================================================================
  // SALES INTELLIGENCE
  // ===========================================================================

  /**
   * Analyze deal and provide insights
   * @param {Object} deal - Deal object
   * @param {Array} activities - Related activities
   * @returns {Object} Deal insights
   */
  async analyzeDeal(deal, activities = [], contact = null) {
    const activitySummary = activities.slice(0, 10).map(a =>
      `${a.type}: ${a.title} (${a.created_at})`
    ).join('\n');

    const response = await this.chat([
      {
        role: 'user',
        content: `Analyze this sales deal and provide insights.

Deal Information:
- Title: ${deal.title}
- Value: $${deal.value}
- Stage: ${deal.stage}
- Probability: ${deal.probability}%
- Expected Close: ${deal.expected_close}
- Days in Current Stage: ${deal.stage_changed_at ? Math.floor((Date.now() - new Date(deal.stage_changed_at)) / 86400000) : 'Unknown'}

${contact ? `Contact: ${contact.first_name} ${contact.last_name} at ${contact.organization}` : ''}

Recent Activity:
${activitySummary || 'No recent activity'}

Provide:
{
  "healthScore": 0-100,
  "riskFactors": ["..."],
  "opportunities": ["..."],
  "recommendedActions": [{"action": "...", "priority": "high|medium|low", "reasoning": "..."}],
  "winProbabilityAdjustment": "suggest new probability if different",
  "nextBestAction": "...",
  "staleDaysThreshold": "number of days before this deal type typically goes stale"
}`
      }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        healthScore: 50,
        riskFactors: [],
        opportunities: [],
        recommendedActions: [],
        winProbabilityAdjustment: null,
        nextBestAction: 'Follow up with contact'
      };
    }
  }

  /**
   * Generate proposal section
   * @param {Object} context - Proposal context
   * @returns {string} Generated proposal content
   */
  async generateProposalSection(context) {
    const { sectionType, deal, company, requirements = '' } = context;

    const sectionPrompts = {
      executive_summary: 'Write an executive summary that highlights the key benefits and value proposition',
      scope: 'Define the scope of work including deliverables, timeline, and milestones',
      approach: 'Describe our approach and methodology for delivering this solution',
      pricing: 'Create a pricing section with clear line items and total',
      terms: 'Outline standard terms and conditions',
      about_us: 'Write a company overview highlighting relevant experience and capabilities'
    };

    const response = await this.chat([
      {
        role: 'user',
        content: `Generate a ${sectionType.replace('_', ' ')} section for a proposal.

Deal: ${deal.title}
Value: $${deal.value}
Client: ${deal.contact?.organization || 'Prospective Client'}
Our Company: ${company.name}

${requirements ? `Requirements:\n${requirements}` : ''}

${sectionPrompts[sectionType] || 'Generate appropriate content for this section.'}

Write professional, persuasive content suitable for a B2B proposal. Use specific details where possible.`
      }
    ]);

    return response;
  }

  // ===========================================================================
  // TASK INTELLIGENCE
  // ===========================================================================

  /**
   * Parse natural language task
   * @param {string} input - Natural language task description
   * @returns {Object} Parsed task details
   */
  async parseNaturalLanguageTask(input, companyContext = null) {
    const response = await this.chat([
      {
        role: 'user',
        content: `Parse this task description into structured data. Today's date is ${new Date().toISOString().split('T')[0]}.

Input: "${input}"

${companyContext ? `Company Context: ${companyContext}` : ''}

Extract:
{
  "title": "concise task title",
  "description": "full description if different from title",
  "dueDate": "YYYY-MM-DD or null",
  "dueTime": "HH:MM or null",
  "priority": "low|medium|high|urgent",
  "relatedContact": "name if mentioned or null",
  "relatedDeal": "deal reference if mentioned or null",
  "estimatedDuration": "minutes or null",
  "category": "follow_up|meeting|call|email|document|research|other"
}`
      }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        title: input,
        description: null,
        dueDate: null,
        dueTime: null,
        priority: 'medium',
        relatedContact: null,
        relatedDeal: null,
        estimatedDuration: null,
        category: 'other'
      };
    }
  }

  /**
   * Suggest task priority based on context
   * @param {Object} task - Task details
   * @param {Object} context - Additional context
   * @returns {Object} Priority suggestion
   */
  async suggestTaskPriority(task, context = {}) {
    const response = await this.chat([
      {
        role: 'user',
        content: `Suggest the appropriate priority for this task.

Task: ${task.title}
Description: ${task.description || 'N/A'}
Due Date: ${task.due_date || 'Not set'}

Context:
- Related Deal Value: ${context.dealValue ? `$${context.dealValue}` : 'N/A'}
- Deal Stage: ${context.dealStage || 'N/A'}
- Contact Status: ${context.contactStatus || 'N/A'}
- Days Until Due: ${task.due_date ? Math.ceil((new Date(task.due_date) - new Date()) / 86400000) : 'N/A'}

Respond in JSON:
{
  "suggestedPriority": "low|medium|high|urgent",
  "reasoning": "...",
  "confidence": 0.0-1.0
}`
      }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        suggestedPriority: 'medium',
        reasoning: 'Default priority assigned',
        confidence: 0.5
      };
    }
  }

  // ===========================================================================
  // ANALYTICS & REPORTING
  // ===========================================================================

  /**
   * Generate natural language query response
   * @param {string} query - Natural language question
   * @param {Object} data - Available data context
   * @returns {string} Natural language answer
   */
  async answerDataQuestion(query, dataContext) {
    const response = await this.chat([
      {
        role: 'user',
        content: `Answer this question about the business data.

Question: "${query}"

Available Data Context:
${JSON.stringify(dataContext, null, 2)}

Provide a clear, concise answer. If the data doesn't fully support the answer, indicate what's missing.`
      }
    ]);

    return response;
  }

  /**
   * Generate executive summary report
   * @param {Object} metrics - Business metrics
   * @param {string} period - Time period
   * @returns {Object} Report content
   */
  async generateExecutiveReport(metrics, period = 'week') {
    const response = await this.chat([
      {
        role: 'user',
        content: `Generate an executive summary report based on these metrics.

Period: ${period}
Metrics:
${JSON.stringify(metrics, null, 2)}

Create a report with:
{
  "headline": "One-line summary of performance",
  "keyHighlights": ["...", "..."],
  "concerns": ["...", "..."],
  "recommendations": ["...", "..."],
  "outlook": "Brief outlook for next period"
}`
      }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        headline: 'Performance report generated',
        keyHighlights: [],
        concerns: [],
        recommendations: [],
        outlook: 'Continue monitoring metrics'
      };
    }
  }

  /**
   * Identify anomalies in data
   * @param {Array} data - Time series or metric data
   * @returns {Array} Identified anomalies
   */
  async identifyAnomalies(data, metricName = 'metric') {
    const response = await this.chat([
      {
        role: 'user',
        content: `Analyze this ${metricName} data and identify any anomalies or notable patterns.

Data:
${JSON.stringify(data, null, 2)}

Respond with:
{
  "anomalies": [
    {"date": "...", "value": 0, "type": "spike|drop|unusual", "significance": "low|medium|high", "possibleCause": "..."}
  ],
  "trend": "increasing|decreasing|stable|volatile",
  "seasonality": "description if any detected",
  "summary": "Brief analysis summary"
}`
      }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        anomalies: [],
        trend: 'stable',
        seasonality: null,
        summary: response
      };
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let aiServiceInstance = null;

export function getAIService(apiKey = null) {
  if (!aiServiceInstance || apiKey) {
    aiServiceInstance = new AIService(apiKey);
  }
  return aiServiceInstance;
}

export default AIService;
