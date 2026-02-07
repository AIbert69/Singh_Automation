import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MOCK_DASHBOARD, MOCK_SESSIONS, MOCK_CRONS,
  MOCK_AGENTS, MOCK_SKILLS, MOCK_LOGS, MOCK_DOCUMENTS,
} from '../data/mock.js';

const POLL_MS = 10_000;

async function get(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

export function useGateway() {
  const [dashboard, setDashboard] = useState(MOCK_DASHBOARD);
  const [sessions, setSessions]   = useState(MOCK_SESSIONS);
  const [crons, setCrons]         = useState(MOCK_CRONS);
  const [agents, setAgents]       = useState(MOCK_AGENTS);
  const [skills, setSkills]       = useState(MOCK_SKILLS);
  const [logs, setLogs]           = useState(MOCK_LOGS);
  const [documents]               = useState(MOCK_DOCUMENTS); // client-only for now
  const [isLive, setIsLive]       = useState(false);
  const [lastPoll, setLastPoll]   = useState(null);
  const mountedRef = useRef(true);

  const poll = useCallback(async () => {
    const [dRes, sRes, cRes, aRes, skRes, lRes] = await Promise.all([
      get('/api/dashboard'),
      get('/api/sessions'),
      get('/api/crons'),
      get('/api/agents'),
      get('/api/skills'),
      get('/api/logs'),
    ]);

    if (!mountedRef.current) return;

    let live = false;

    if (dRes?.success) {
      setDashboard(dRes.data);
      if (dRes.live) live = true;
    }
    if (sRes?.success && sRes.data) {
      setSessions(sRes.data);
      if (sRes.live) live = true;
    }
    if (cRes?.success && cRes.data) {
      setCrons(cRes.data);
      if (cRes.live) live = true;
    }
    if (aRes?.success && aRes.data) {
      setAgents(aRes.data);
      if (aRes.live) live = true;
    }
    if (skRes?.success && skRes.data) {
      setSkills(skRes.data);
      if (skRes.live) live = true;
    }
    if (lRes?.success && lRes.data) {
      setLogs(lRes.data);
      if (lRes.live) live = true;
    }

    setIsLive(live);
    setLastPoll(new Date());
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, [poll]);

  return { dashboard, sessions, crons, agents, skills, logs, documents, isLive, lastPoll, poll };
}
