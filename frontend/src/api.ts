import axios from 'axios';
import type { Contact, SelectionGroup, Template, MessageDraft, HistoryEntry, ChatMessage, ChatContact, AuthUser } from './types';

const ax = axios.create({ baseURL: '/api' });

// ── Auth token helpers ────────────────────────────────────────────────────────
export function getAuthToken(): string | null {
  return localStorage.getItem('comunicar-token');
}
export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem('comunicar-token', token);
  else localStorage.removeItem('comunicar-token');
}

// Attach token to every request
ax.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 → clear token + notify app
ax.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      setAuthToken(null);
      window.dispatchEvent(new CustomEvent('comunicar:unauthorized'));
    }
    return Promise.reject(err);
  }
);

export const api = {
  // ── Auth ─────────────────────────────────────────────────────────────────
  auth: {
    login: (email: string, password: string) =>
      ax.post<{ token: string; user: AuthUser }>('/auth/login', { email, password }).then(r => r.data),

    me: () =>
      ax.get<AuthUser>('/auth/me').then(r => r.data),

    changePassword: (currentPassword: string, newPassword: string) =>
      ax.post('/auth/change-password', { currentPassword, newPassword }).then(r => r.data),

    // Admin only
    listUsers: () =>
      ax.get<AuthUser[]>('/auth/users').then(r => r.data),

    createUser: (data: { email: string; name: string; role: string; password: string }) =>
      ax.post<AuthUser>('/auth/users', data).then(r => r.data),

    updateUser: (id: number, data: Partial<{ name: string; role: string; active: boolean; password: string }>) =>
      ax.patch<AuthUser>(`/auth/users/${id}`, data).then(r => r.data),

    deleteUser: (id: number) =>
      ax.delete(`/auth/users/${id}`).then(r => r.data),
  },

  contacts: {
    list: (params: { search?: string; gruppo?: string | string[]; attivo?: string; page?: number; pageSize?: number }) => {
      const p = { ...params, gruppo: Array.isArray(params.gruppo) ? params.gruppo.join(',') : params.gruppo };
      return ax.get<{ total: number; data: Contact[] }>('/contacts', { params: p }).then(r => r.data);
    },

    groups: () =>
      ax.get<string[]>('/contacts/groups').then(r => r.data),

    patchMany: (ids: number[], patch: { da_fare?: number; fatto?: number }) =>
      ax.patch('/contacts', { ids, ...patch }).then(r => r.data),

    patch: (id: number, patch: { da_fare?: number; fatto?: number }) =>
      ax.patch(`/contacts/${id}`, patch).then(r => r.data),

    create: (data: Partial<Contact>) =>
      ax.post<Contact>('/contacts', data).then(r => r.data),

    update: (id: number, data: Partial<Contact>) =>
      ax.put<Contact>(`/contacts/${id}`, data).then(r => r.data),

    remove: (ids: number[]) =>
      ax.delete('/contacts', { data: { ids } }).then(r => r.data),
  },

  selectionGroups: {
    list: () =>
      ax.get<SelectionGroup[]>('/selection-groups').then(r => r.data),

    create: (name: string, filter_json: object, description?: string) =>
      ax.post('/selection-groups', { name, filter_json, description }).then(r => r.data),

    update: (id: number, name: string, description?: string) =>
      ax.put(`/selection-groups/${id}`, { name, description }).then(r => r.data),

    remove: (id: number) =>
      ax.delete(`/selection-groups/${id}`).then(r => r.data),
  },

  templates: {
    list: () =>
      ax.get<Template[]>('/templates').then(r => r.data),

    create: (t: Omit<Template, 'id' | 'created_at'>) =>
      ax.post('/templates', t).then(r => r.data),

    remove: (id: number) =>
      ax.delete(`/templates/${id}`).then(r => r.data),
  },

  send: {
    start: (contactIds: number[], message: MessageDraft) =>
      ax.post<{ jobId: string; total: number }>('/send', { contactIds, message }).then(r => r.data),

    results: (jobId: string) =>
      ax.get(`/send/${jobId}/results`).then(r => r.data),
  },

  import: (file: File) => {
    const fd = new FormData();
    fd.append('csv', file);
    return ax.post<{ imported: number }>('/import', fd).then(r => r.data);
  },

  export: () => {
    const token = getAuthToken();
    const url = token ? `/api/export?token=${encodeURIComponent(token)}` : '/api/export';
    const a = document.createElement('a');
    a.href = url;
    a.click();
  },

  history: {
    list: (q = '') =>
      ax.get<HistoryEntry[]>('/history', { params: { q, limit: 200 } }).then(r => r.data),

    remove: (id: number) =>
      ax.delete(`/history/${id}`).then(r => r.data),
  },

  whatsapp: {
    getChats: () =>
      ax.get<ChatContact[]>('/whatsapp/chats').then(r => r.data),

    getContacts: () =>
      ax.get<ChatContact[]>('/whatsapp/contacts').then(r => r.data),

    getMessages: (jid: string) =>
      ax.get<ChatMessage[]>(`/whatsapp/messages/${encodeURIComponent(jid)}`).then(r => r.data),

    send: (jid: string, text: string, contactId: number | null) =>
      ax.post<{ ok: boolean; message: ChatMessage }>('/whatsapp/send', { jid, text, contactId }).then(r => r.data),

    // For SSE, we need to pass token as query param since EventSource can't set headers
    eventsUrl: () => {
      const token = getAuthToken();
      return token ? `/api/whatsapp/events?token=${encodeURIComponent(token)}` : '/api/whatsapp/events';
    },
  },

  // Helper to build SSE URL with auth token (for EventSource which can't set headers)
  sseUrl: (path: string) => {
    const token = getAuthToken();
    return token ? `${path}?token=${encodeURIComponent(token)}` : path;
  },
};
