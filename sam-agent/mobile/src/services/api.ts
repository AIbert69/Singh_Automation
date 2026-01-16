/**
 * Sam Agent 2.0 API Service
 * Handles all communication with the backend
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

interface ApiResponse<T> {
  data: T;
  error?: string;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

// Types
export interface Opportunity {
  id: string;
  source: string;
  title: string;
  description?: string;
  agency?: string;
  estimated_value?: number;
  due_date?: string;
  fit_score: number;
  strategic_recommendation: string;
  url?: string;
  naics_codes?: string[];
  set_aside?: string;
  location?: string;
  state?: string;
}

export interface Briefing {
  date: string;
  greeting: string;
  summary: string;
  top_opportunities: TopOpportunity[];
  strategic_advice: string;
  action_items: string[];
  insight?: string;
  stats: BriefingStats;
}

export interface TopOpportunity {
  title: string;
  agency: string;
  value: string;
  fit_score: number;
  due_date: string;
  why_pursue: string;
  action: string;
}

export interface BriefingStats {
  total: number;
  pursue: number;
  review: number;
  watch: number;
  pass: number;
  avg_score: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface OpportunityAnalysis {
  fit_score: number;
  recommendation: string;
  analysis: string;
  strengths: string[];
  challenges: string[];
  action_items: string[];
  competitive_position?: string;
  probability_of_win?: string;
}

// API Functions
export const api = {
  // Health
  async health() {
    return fetchApi<{ status: string; checks: Record<string, string> }>('/health');
  },

  // Briefings
  async getTodayBriefing() {
    return fetchApi<Briefing>('/briefing/today');
  },

  async getBriefingByDate(date: string) {
    return fetchApi<Briefing>(`/briefing/${date}`);
  },

  // Opportunities
  async getOpportunities(params?: {
    status?: string;
    min_score?: number;
    source?: string;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.min_score) searchParams.set('min_score', params.min_score.toString());
    if (params?.source) searchParams.set('source', params.source);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const query = searchParams.toString();
    return fetchApi<{ opportunities: Opportunity[]; count: number }>(
      `/opportunities${query ? `?${query}` : ''}`
    );
  },

  async getTopOpportunities(limit = 10) {
    return fetchApi<{ opportunities: Opportunity[]; count: number }>(
      `/opportunities/top?limit=${limit}`
    );
  },

  async getOpportunity(id: string) {
    return fetchApi<Opportunity>(`/opportunities/${id}`);
  },

  async analyzeOpportunity(id: string) {
    return fetchApi<OpportunityAnalysis>(`/opportunities/${id}/analyze`);
  },

  async recordAction(id: string, actionType: string, notes?: string) {
    return fetchApi<{ success: boolean; message: string }>(
      `/opportunities/${id}/action`,
      {
        method: 'POST',
        body: JSON.stringify({ action_type: actionType, notes }),
      }
    );
  },

  // Chat
  async chat(message: string) {
    return fetchApi<{ response: string; timestamp: string }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  // Scan
  async triggerScan() {
    return fetchApi<{ message: string; status: string }>('/scan/now', {
      method: 'POST',
    });
  },

  // Stats
  async getStats() {
    return fetchApi<{
      memory: Record<string, any>;
      opportunities: Record<string, any>;
    }>('/stats');
  },

  // Market Intelligence
  async getMarketAnalysis() {
    return fetchApi<{
      naics_codes: string[];
      total_awards: number;
      total_value: number;
      top_agencies: { agency: string; total_value: number }[];
      top_contractors: { name: string; total_value: number }[];
    }>('/market/analysis');
  },

  // Events
  async getUpcomingEvents(days = 30) {
    return fetchApi<{ events: any[]; count: number }>(`/events?days=${days}`);
  },
};

export default api;
