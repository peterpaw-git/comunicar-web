import axios from 'axios';
import type { Contact, SelectionGroup, Template, MessageDraft, HistoryEntry, ChatMessage, ChatContact } from './types';

const ax = axios.create({ baseURL: '/api' });

export const api = {
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
    window.open('/api/export', '_blank');
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
  },
};
