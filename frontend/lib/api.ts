/**
 * API Client
 * ==========
 * Frontend থেকে backend call করার helper।
 * Clerk token automatically attach করে।
 */

import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ── Axios instance ──────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Token inject করার helper ────────────────────────────────────
export function withAuth(token: string) {
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
}

// ── CV API ──────────────────────────────────────────────────────
export const cvApi = {
  upload: (formData: FormData, token: string) =>
    apiClient.post('/cv/upload', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }),

  getInfo: (token: string) =>
    apiClient.get('/cv/', withAuth(token)),

  getChunks: (token: string) =>
    apiClient.get('/cv/chunks', withAuth(token)),

  delete: (token: string) =>
    apiClient.delete('/cv/', withAuth(token)),
};

// ── Jobs API ────────────────────────────────────────────────────
export const jobsApi = {
  search: (query: string, token: string) =>
    apiClient.post('/jobs/search', { query }, withAuth(token)),

  fitScore: (jobDesc: string, token: string) =>
    apiClient.post('/jobs/fit-score', { job_description: jobDesc }, withAuth(token)),
};

// ── Assistant API ───────────────────────────────────────────────
export const assistantApi = {
  chat: (messages: any[], sessionId: string | null, token: string) =>
    apiClient.post('/assistant/chat', { messages, session_id: sessionId }, withAuth(token)),
};

// ── Tracker API ─────────────────────────────────────────────────
export const trackerApi = {
  getApplications: (token: string) =>
    apiClient.get('/tracker/applications', withAuth(token)),

  createApplication: (data: any, token: string) =>
    apiClient.post('/tracker/applications', data, withAuth(token)),

  updateStatus: (id: string, status: string, token: string) =>
    apiClient.patch(`/tracker/applications/${id}`, { status }, withAuth(token)),

  getGoals: (token: string) =>
    apiClient.get('/tracker/goals', withAuth(token)),
};
