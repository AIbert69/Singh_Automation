/**
 * Mammoth Command Center - Automation Workflows
 * Pre-built workflow templates and execution engine
 */

import { WORKFLOW_TRIGGERS, DEAL_STAGES, CONTACT_STATUSES } from './config.js';

// =============================================================================
// WORKFLOW ACTION TYPES
// =============================================================================

export const ACTION_TYPES = {
  SEND_EMAIL: 'send_email',
  CREATE_TASK: 'create_task',
  UPDATE_DEAL: 'update_deal',
  UPDATE_CONTACT: 'update_contact',
  SEND_NOTIFICATION: 'send_notification',
  WEBHOOK: 'webhook',
  DELAY: 'delay',
  CONDITION: 'condition',
  ASSIGN_USER: 'assign_user',
  ADD_TAG: 'add_tag',
  REMOVE_TAG: 'remove_tag',
  UPDATE_SCORE: 'update_score'
};

// =============================================================================
// PRE-BUILT WORKFLOW TEMPLATES
// =============================================================================

export const WORKFLOW_TEMPLATES = {
  // ---------------------------------------------------------------------------
  // SALES WORKFLOWS
  // ---------------------------------------------------------------------------

  new_lead_welcome: {
    id: 'new_lead_welcome',
    name: 'New Lead Welcome Sequence',
    description: 'Automatically welcome new leads with an email and create follow-up tasks',
    category: 'sales',
    trigger: 'contact_created',
    trigger_config: {
      status: 'lead'
    },
    actions: [
      {
        type: ACTION_TYPES.SEND_EMAIL,
        config: {
          template: 'welcome_email',
          delay_hours: 0,
          subject: 'Welcome to {{company_name}}!',
          track_opens: true
        }
      },
      {
        type: ACTION_TYPES.CREATE_TASK,
        config: {
          title: 'Follow up with {{contact_name}}',
          description: 'Initial outreach - qualify lead and assess needs',
          due_days: 3,
          priority: 'high'
        }
      },
      {
        type: ACTION_TYPES.UPDATE_SCORE,
        config: {
          field: 'lead_score',
          operation: 'add',
          value: 10
        }
      }
    ]
  },

  stale_deal_alert: {
    id: 'stale_deal_alert',
    name: 'Stale Deal Alert',
    description: 'Alert when a deal has been in the same stage for too long',
    category: 'sales',
    trigger: 'schedule',
    trigger_config: {
      cron: '0 9 * * 1-5', // 9 AM on weekdays
      check_condition: 'deal_stale_check'
    },
    conditions: {
      deal_stale_days: {
        lead: 7,
        qualified: 14,
        proposal: 10,
        negotiation: 7
      }
    },
    actions: [
      {
        type: ACTION_TYPES.SEND_NOTIFICATION,
        config: {
          channels: ['email', 'slack'],
          to: 'deal_owner',
          subject: 'Stale Deal Alert: {{deal_title}}',
          message: 'Deal "{{deal_title}}" has been in {{deal_stage}} for {{days_in_stage}} days.'
        }
      },
      {
        type: ACTION_TYPES.CREATE_TASK,
        config: {
          title: 'Review stale deal: {{deal_title}}',
          description: 'This deal has been inactive. Review and either progress or update status.',
          due_days: 1,
          priority: 'high',
          assign_to: 'deal_owner'
        }
      }
    ]
  },

  deal_won_celebration: {
    id: 'deal_won_celebration',
    name: 'Deal Won Celebration',
    description: 'Celebrate wins and start onboarding when a deal is closed won',
    category: 'sales',
    trigger: 'deal_won',
    trigger_config: {},
    actions: [
      {
        type: ACTION_TYPES.SEND_EMAIL,
        config: {
          template: 'deal_won_thank_you',
          to: 'contact',
          subject: 'Thank you for choosing {{company_name}}!'
        }
      },
      {
        type: ACTION_TYPES.SEND_NOTIFICATION,
        config: {
          channels: ['slack'],
          to: 'team',
          message: '🎉 Deal Won! {{deal_title}} - {{deal_value}} closed by {{deal_owner}}'
        }
      },
      {
        type: ACTION_TYPES.UPDATE_CONTACT,
        config: {
          status: 'customer'
        }
      },
      {
        type: ACTION_TYPES.CREATE_TASK,
        config: {
          title: 'Start onboarding for {{contact_name}}',
          description: 'Schedule kickoff call and send onboarding materials',
          due_days: 1,
          priority: 'high'
        }
      },
      {
        type: ACTION_TYPES.CREATE_TASK,
        config: {
          title: 'Update CRM records for {{deal_title}}',
          description: 'Ensure all deal information is complete and accurate',
          due_days: 2,
          priority: 'medium'
        }
      }
    ]
  },

  deal_lost_follow_up: {
    id: 'deal_lost_follow_up',
    name: 'Deal Lost Follow-up',
    description: 'Gather feedback and keep door open when a deal is lost',
    category: 'sales',
    trigger: 'deal_lost',
    trigger_config: {},
    actions: [
      {
        type: ACTION_TYPES.CREATE_TASK,
        config: {
          title: 'Send loss follow-up to {{contact_name}}',
          description: 'Send a professional email thanking them and gathering feedback on why we lost',
          due_days: 1,
          priority: 'medium'
        }
      },
      {
        type: ACTION_TYPES.DELAY,
        config: {
          days: 90
        }
      },
      {
        type: ACTION_TYPES.CREATE_TASK,
        config: {
          title: 'Re-engage {{contact_name}}',
          description: 'Check in to see if circumstances have changed',
          priority: 'low'
        }
      }
    ]
  },

  proposal_follow_up: {
    id: 'proposal_follow_up',
    name: 'Proposal Follow-up',
    description: 'Automatic follow-up when a proposal has been pending',
    category: 'sales',
    trigger: 'deal_stage_changed',
    trigger_config: {
      to_stage: 'proposal'
    },
    actions: [
      {
        type: ACTION_TYPES.DELAY,
        config: {
          days: 5
        }
      },
      {
        type: ACTION_TYPES.CONDITION,
        config: {
          check: 'deal_still_in_stage',
          stage: 'proposal',
          if_true: [
            {
              type: ACTION_TYPES.SEND_EMAIL,
              config: {
                template: 'proposal_follow_up',
                to: 'contact',
                subject: 'Following up on our proposal'
              }
            },
            {
              type: ACTION_TYPES.CREATE_TASK,
              config: {
                title: 'Call {{contact_name}} about proposal',
                due_days: 2,
                priority: 'high'
              }
            }
          ]
        }
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // EMAIL WORKFLOWS
  // ---------------------------------------------------------------------------

  email_response_reminder: {
    id: 'email_response_reminder',
    name: 'Email Response Reminder',
    description: 'Remind when an email has not been responded to',
    category: 'email',
    trigger: 'email_not_replied',
    trigger_config: {
      hours: 24,
      direction: 'inbound'
    },
    actions: [
      {
        type: ACTION_TYPES.CREATE_TASK,
        config: {
          title: 'Respond to email from {{contact_name}}',
          description: 'Email subject: {{email_subject}}',
          due_days: 0,
          priority: 'high'
        }
      },
      {
        type: ACTION_TYPES.SEND_NOTIFICATION,
        config: {
          channels: ['email'],
          to: 'assigned_user',
          subject: 'Reminder: Unanswered email from {{contact_name}}',
          message: 'Email "{{email_subject}}" has been unanswered for 24 hours.'
        }
      }
    ]
  },

  auto_categorize_email: {
    id: 'auto_categorize_email',
    name: 'Auto-Categorize Email',
    description: 'Automatically categorize incoming emails using AI',
    category: 'email',
    trigger: 'email_received',
    trigger_config: {},
    actions: [
      {
        type: 'ai_analyze',
        config: {
          analysis_type: 'email_sentiment',
          store_results: true
        }
      },
      {
        type: ACTION_TYPES.CONDITION,
        config: {
          check: 'sentiment_is',
          value: 'urgent',
          if_true: [
            {
              type: ACTION_TYPES.SEND_NOTIFICATION,
              config: {
                channels: ['slack', 'push'],
                to: 'assigned_user',
                message: '🚨 Urgent email from {{contact_name}}: {{email_subject}}'
              }
            }
          ]
        }
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // TASK WORKFLOWS
  // ---------------------------------------------------------------------------

  daily_task_digest: {
    id: 'daily_task_digest',
    name: 'Daily Task Digest',
    description: 'Send a daily summary of tasks due and overdue',
    category: 'tasks',
    trigger: 'schedule',
    trigger_config: {
      cron: '0 7 * * 1-5' // 7 AM on weekdays
    },
    actions: [
      {
        type: 'compile_digest',
        config: {
          include: ['tasks_due_today', 'overdue_tasks', 'high_priority_tasks'],
          group_by: 'company'
        }
      },
      {
        type: ACTION_TYPES.SEND_EMAIL,
        config: {
          template: 'daily_digest',
          to: 'all_users',
          subject: 'Your Daily Task Summary - {{date}}'
        }
      }
    ]
  },

  overdue_task_escalation: {
    id: 'overdue_task_escalation',
    name: 'Overdue Task Escalation',
    description: 'Escalate tasks that remain overdue',
    category: 'tasks',
    trigger: 'task_overdue',
    trigger_config: {
      overdue_days: 2
    },
    actions: [
      {
        type: ACTION_TYPES.UPDATE_DEAL,
        config: {
          field: 'priority',
          value: 'urgent'
        }
      },
      {
        type: ACTION_TYPES.SEND_NOTIFICATION,
        config: {
          channels: ['email', 'slack'],
          to: 'manager',
          subject: 'Escalation: Task overdue by {{overdue_days}} days',
          message: 'Task "{{task_title}}" assigned to {{assigned_user}} is overdue.'
        }
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // CONTACT WORKFLOWS
  // ---------------------------------------------------------------------------

  lead_scoring_update: {
    id: 'lead_scoring_update',
    name: 'Lead Scoring Update',
    description: 'Update lead score based on engagement',
    category: 'contacts',
    trigger: 'contact_activity',
    trigger_config: {
      activity_types: ['email_opened', 'email_clicked', 'meeting_scheduled']
    },
    actions: [
      {
        type: ACTION_TYPES.UPDATE_SCORE,
        config: {
          field: 'lead_score',
          rules: {
            email_opened: 5,
            email_clicked: 10,
            meeting_scheduled: 25
          }
        }
      },
      {
        type: ACTION_TYPES.CONDITION,
        config: {
          check: 'lead_score_above',
          value: 75,
          if_true: [
            {
              type: ACTION_TYPES.UPDATE_CONTACT,
              config: {
                status: 'prospect'
              }
            },
            {
              type: ACTION_TYPES.SEND_NOTIFICATION,
              config: {
                channels: ['slack'],
                to: 'sales_team',
                message: '🔥 Hot lead! {{contact_name}} score is now {{lead_score}}'
              }
            }
          ]
        }
      }
    ]
  },

  customer_churn_risk: {
    id: 'customer_churn_risk',
    name: 'Customer Churn Risk Alert',
    description: 'Alert when a customer shows signs of churning',
    category: 'contacts',
    trigger: 'schedule',
    trigger_config: {
      cron: '0 8 * * 1', // Monday 8 AM
      check_condition: 'customer_inactive_check'
    },
    conditions: {
      inactive_days: 60
    },
    actions: [
      {
        type: ACTION_TYPES.SEND_NOTIFICATION,
        config: {
          channels: ['email'],
          to: 'account_manager',
          subject: 'Churn Risk: {{contact_name}} has been inactive',
          message: 'Customer {{contact_name}} from {{organization}} has not engaged in {{inactive_days}} days.'
        }
      },
      {
        type: ACTION_TYPES.CREATE_TASK,
        config: {
          title: 'Re-engage {{contact_name}}',
          description: 'Check in with customer to assess satisfaction and prevent churn',
          due_days: 3,
          priority: 'high'
        }
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // CAMPAIGN WORKFLOWS
  // ---------------------------------------------------------------------------

  campaign_completion: {
    id: 'campaign_completion',
    name: 'Campaign Completion',
    description: 'Actions to take when a campaign ends',
    category: 'campaigns',
    trigger: 'campaign_ended',
    trigger_config: {},
    actions: [
      {
        type: 'compile_report',
        config: {
          metrics: ['sent', 'opened', 'clicked', 'converted', 'revenue'],
          format: 'summary'
        }
      },
      {
        type: ACTION_TYPES.SEND_EMAIL,
        config: {
          template: 'campaign_report',
          to: 'campaign_owner',
          subject: 'Campaign Report: {{campaign_name}}'
        }
      },
      {
        type: ACTION_TYPES.CREATE_TASK,
        config: {
          title: 'Review {{campaign_name}} results',
          description: 'Analyze campaign performance and document learnings',
          due_days: 3,
          priority: 'medium'
        }
      }
    ]
  }
};

// =============================================================================
// WORKFLOW ENGINE
// =============================================================================

export class WorkflowEngine {
  constructor(supabase, aiService = null) {
    this.supabase = supabase;
    this.aiService = aiService;
    this.executionQueue = [];
  }

  /**
   * Get all workflows for a company
   */
  async getWorkflows(companyId) {
    const { data, error } = await this.supabase
      .from('workflows')
      .select('*')
      .eq('company_id', companyId)
      .order('name');

    if (error) throw error;
    return data;
  }

  /**
   * Create a workflow from template
   */
  async createFromTemplate(companyId, templateId, customizations = {}) {
    const template = WORKFLOW_TEMPLATES[templateId];
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const workflow = {
      company_id: companyId,
      name: customizations.name || template.name,
      description: customizations.description || template.description,
      trigger: template.trigger,
      trigger_config: { ...template.trigger_config, ...customizations.trigger_config },
      actions: customizations.actions || template.actions,
      conditions: { ...template.conditions, ...customizations.conditions },
      is_active: customizations.is_active ?? true
    };

    const { data, error } = await this.supabase
      .from('workflows')
      .insert([workflow])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Execute a workflow
   */
  async execute(workflowId, triggerData) {
    const { data: workflow, error } = await this.supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (error || !workflow) {
      throw new Error('Workflow not found');
    }

    if (!workflow.is_active) {
      return { status: 'skipped', reason: 'Workflow is not active' };
    }

    // Create execution record
    const { data: execution, error: execError } = await this.supabase
      .from('workflow_executions')
      .insert([{
        workflow_id: workflowId,
        trigger_data: triggerData,
        status: 'running'
      }])
      .select()
      .single();

    if (execError) throw execError;

    const executionLog = [];

    try {
      // Execute each action
      for (const action of workflow.actions) {
        const result = await this.executeAction(action, triggerData, workflow);
        executionLog.push({
          action: action.type,
          status: 'completed',
          result,
          timestamp: new Date().toISOString()
        });
      }

      // Update execution status
      await this.supabase
        .from('workflow_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          execution_log: executionLog
        })
        .eq('id', execution.id);

      // Update workflow run count
      await this.supabase
        .from('workflows')
        .update({
          run_count: workflow.run_count + 1,
          last_run_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      return { status: 'completed', executionId: execution.id, log: executionLog };

    } catch (error) {
      // Update execution with error
      await this.supabase
        .from('workflow_executions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message,
          execution_log: executionLog
        })
        .eq('id', execution.id);

      throw error;
    }
  }

  /**
   * Execute a single action
   */
  async executeAction(action, triggerData, workflow) {
    const { type, config } = action;

    switch (type) {
      case ACTION_TYPES.SEND_EMAIL:
        return this.sendEmail(config, triggerData);

      case ACTION_TYPES.CREATE_TASK:
        return this.createTask(config, triggerData, workflow.company_id);

      case ACTION_TYPES.UPDATE_DEAL:
        return this.updateDeal(config, triggerData);

      case ACTION_TYPES.UPDATE_CONTACT:
        return this.updateContact(config, triggerData);

      case ACTION_TYPES.SEND_NOTIFICATION:
        return this.sendNotification(config, triggerData);

      case ACTION_TYPES.WEBHOOK:
        return this.callWebhook(config, triggerData);

      case ACTION_TYPES.DELAY:
        return this.handleDelay(config);

      case ACTION_TYPES.CONDITION:
        return this.evaluateCondition(config, triggerData, workflow);

      case ACTION_TYPES.UPDATE_SCORE:
        return this.updateScore(config, triggerData);

      default:
        console.log(`Unknown action type: ${type}`);
        return { skipped: true, reason: `Unknown action type: ${type}` };
    }
  }

  /**
   * Replace template variables in text
   */
  interpolate(text, data) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  /**
   * Action: Send Email
   */
  async sendEmail(config, triggerData) {
    // In production, integrate with email service
    console.log('Sending email:', {
      to: config.to,
      subject: this.interpolate(config.subject, triggerData),
      template: config.template
    });
    return { sent: true, to: config.to };
  }

  /**
   * Action: Create Task
   */
  async createTask(config, triggerData, companyId) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (config.due_days || 1));

    const task = {
      company_id: companyId,
      title: this.interpolate(config.title, triggerData),
      description: config.description ? this.interpolate(config.description, triggerData) : null,
      priority: config.priority || 'medium',
      status: 'pending',
      due_date: dueDate.toISOString(),
      deal_id: triggerData.deal_id || null,
      contact_id: triggerData.contact_id || null
    };

    const { data, error } = await this.supabase
      .from('tasks')
      .insert([task])
      .select()
      .single();

    if (error) throw error;
    return { task_id: data.id };
  }

  /**
   * Action: Update Deal
   */
  async updateDeal(config, triggerData) {
    if (!triggerData.deal_id) {
      return { skipped: true, reason: 'No deal_id in trigger data' };
    }

    const { error } = await this.supabase
      .from('deals')
      .update({ [config.field]: config.value })
      .eq('id', triggerData.deal_id);

    if (error) throw error;
    return { updated: true };
  }

  /**
   * Action: Update Contact
   */
  async updateContact(config, triggerData) {
    if (!triggerData.contact_id) {
      return { skipped: true, reason: 'No contact_id in trigger data' };
    }

    const { error } = await this.supabase
      .from('contacts')
      .update(config)
      .eq('id', triggerData.contact_id);

    if (error) throw error;
    return { updated: true };
  }

  /**
   * Action: Send Notification
   */
  async sendNotification(config, triggerData) {
    // In production, integrate with notification service
    console.log('Sending notification:', {
      channels: config.channels,
      to: config.to,
      message: this.interpolate(config.message, triggerData)
    });
    return { sent: true, channels: config.channels };
  }

  /**
   * Action: Call Webhook
   */
  async callWebhook(config, triggerData) {
    const response = await fetch(config.url, {
      method: config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify(triggerData)
    });

    return { status: response.status, ok: response.ok };
  }

  /**
   * Action: Handle Delay
   */
  async handleDelay(config) {
    // In production, this would schedule continuation
    const delayMs = (config.days || 0) * 86400000 +
                    (config.hours || 0) * 3600000 +
                    (config.minutes || 0) * 60000;
    return { delayed: true, delay_ms: delayMs };
  }

  /**
   * Action: Evaluate Condition
   */
  async evaluateCondition(config, triggerData, workflow) {
    // Simple condition evaluation
    let conditionMet = false;

    switch (config.check) {
      case 'deal_still_in_stage':
        // Check if deal is still in specified stage
        if (triggerData.deal_id) {
          const { data } = await this.supabase
            .from('deals')
            .select('stage')
            .eq('id', triggerData.deal_id)
            .single();
          conditionMet = data?.stage === config.stage;
        }
        break;

      case 'sentiment_is':
        conditionMet = triggerData.sentiment === config.value;
        break;

      case 'lead_score_above':
        conditionMet = (triggerData.lead_score || 0) > config.value;
        break;

      default:
        conditionMet = false;
    }

    if (conditionMet && config.if_true) {
      for (const action of config.if_true) {
        await this.executeAction(action, triggerData, workflow);
      }
    }

    return { conditionMet, check: config.check };
  }

  /**
   * Action: Update Score
   */
  async updateScore(config, triggerData) {
    if (!triggerData.contact_id) {
      return { skipped: true, reason: 'No contact_id' };
    }

    let delta = config.value;
    if (config.rules && triggerData.activity_type) {
      delta = config.rules[triggerData.activity_type] || 0;
    }

    const { data: contact } = await this.supabase
      .from('contacts')
      .select('lead_score')
      .eq('id', triggerData.contact_id)
      .single();

    const currentScore = contact?.lead_score || 0;
    let newScore = currentScore;

    switch (config.operation) {
      case 'add':
        newScore = currentScore + delta;
        break;
      case 'subtract':
        newScore = currentScore - delta;
        break;
      case 'set':
        newScore = delta;
        break;
    }

    newScore = Math.max(0, Math.min(100, newScore));

    await this.supabase
      .from('contacts')
      .update({ lead_score: newScore })
      .eq('id', triggerData.contact_id);

    return { previousScore: currentScore, newScore };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  ACTION_TYPES,
  WORKFLOW_TEMPLATES,
  WorkflowEngine
};
