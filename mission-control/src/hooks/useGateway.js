import { useState, useEffect, useCallback } from 'react';
import {
  MOCK_DASHBOARD,
  MOCK_SESSIONS,
  MOCK_CRONS,
  MOCK_AGENTS,
  MOCK_SKILLS,
  MOCK_LOGS,
} from '../data/mockData.js';

const POLL_INTERVAL = 10000; // 10 seconds

async function fetchApi(endpoint) {
  try {
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return null;
  }
}

export function useGateway() {
  const [dashboard, setDashboard] = useState(MOCK_DASHBOARD);
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [crons, setCrons] = useState(MOCK_CRONS);
  const [agents, setAgents] = useState(MOCK_AGENTS);
  const [skills, setSkills] = useState(MOCK_SKILLS);
  const [logs, setLogs] = useState(MOCK_LOGS);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const refresh = useCallback(async () => {
    const results = await Promise.all([
      fetchApi('/api/dashboard'),
      fetchApi('/api/sessions'),
      fetchApi('/api/crons'),
      fetchApi('/api/agents'),
      fetchApi('/api/skills'),
      fetchApi('/api/logs'),
    ]);

    const [dashRes, sessRes, cronRes, agentRes, skillRes, logRes] = results;

    let anyLive = false;

    if (dashRes?.success) {
      setDashboard(dashRes.data);
      if (dashRes.live) anyLive = true;
    }
    if (sessRes?.success) {
      setSessions(sessRes.data);
      if (sessRes.live) anyLive = true;
    }
    if (cronRes?.success) {
      setCrons(cronRes.data);
      if (cronRes.live) anyLive = true;
    }
    if (agentRes?.success) {
      setAgents(agentRes.data);
      if (agentRes.live) anyLive = true;
    }
    if (skillRes?.success) {
      setSkills(skillRes.data);
      if (skillRes.live) anyLive = true;
    }
    if (logRes?.success) {
      setLogs(logRes.data);
      if (logRes.live) anyLive = true;
    }

    setIsLive(anyLive);
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return { dashboard, sessions, crons, agents, skills, logs, isLive, lastUpdate, refresh };
}
