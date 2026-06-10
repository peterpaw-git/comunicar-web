import { create } from 'zustand';
import { api, setAuthToken } from './api';
import type { SortingState } from '@tanstack/react-table';
import type { Contact, SelectionGroup, Template, MessageDraft, SendResult, HistoryEntry, AuthUser } from './types';
import type { Lang } from './i18n';

interface State {
  contacts: Contact[];
  total: number;
  loading: boolean;
  search: string;
  gruppoFilter: string[];
  attivoFilter: string;
  gruppoOptions: string[];

  history: HistoryEntry[];
  historySearch: string;

  selectedIds: Set<number>;

  selectionGroups: SelectionGroup[];
  templates: Template[];

  draft: MessageDraft;

  sorting: SortingState;
  sortedContactIds: number[];

  sending: boolean;
  pendingSend: boolean;
  sendProgress: { done: number; total: number };
  sendResults: SendResult[];
  jobId: string | null;

  setSearch: (s: string) => void;
  setGruppoFilter: (g: string[]) => void;
  setAttivoFilter: (a: string) => void;

  fetchHistory: (q?: string) => Promise<void>;
  removeHistory: (id: number) => Promise<void>;
  setHistorySearch: (q: string) => void;

  fetchContacts: () => Promise<void>;
  fetchMeta: () => Promise<void>;

  toggleSelect: (id: number) => void;
  selectAll: () => void;
  clearSelection: () => void;
  applyGroupFilter: (g: SelectionGroup) => void;

  fetchSelectionGroups: () => Promise<void>;
  saveSelectionGroup: (name: string, description?: string) => Promise<void>;
  updateSelectionGroup: (id: number, name: string, description?: string) => Promise<void>;
  removeSelectionGroup: (id: number) => Promise<void>;

  fetchTemplates: () => Promise<void>;
  saveTemplate: (name: string) => Promise<void>;
  loadTemplate: (t: Template) => void;
  removeTemplate: (id: number) => Promise<void>;

  setDraft: (d: Partial<MessageDraft>) => void;

  setSorting: (s: SortingState) => void;
  setSortedContactIds: (ids: number[]) => void;

  requestSend: () => void;
  confirmSend: () => Promise<void>;
  cancelSend: () => void;
  startSend: () => Promise<void>; // kept for back-compat (calls requestSend)
  markFatto: (fatto: boolean) => Promise<void>;

  createContact: (data: Partial<Contact>) => Promise<Contact>;
  updateContact: (id: number, data: Partial<Contact>) => Promise<Contact>;
  deleteContacts: (ids: number[]) => Promise<void>;

  importCSV: (file: File) => Promise<number>;

  lang: Lang;
  setLang: (l: Lang) => void;

  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;

  // ── Auth ────────────────────────────────────────────────────────────────
  authUser: AuthUser | null;
  authToken: string | null;
  authLoading: boolean;
  sessionExpired: boolean;
  inactivityTimeout: number;       // minutes; 0 = disabled
  login: (email: string, password: string) => Promise<void>;
  logout: (reason?: 'inactivity') => void;
  loadAuth: () => Promise<boolean>;
  clearMustChangePassword: () => void;
  fetchSettings: () => Promise<void>;
  setInactivityTimeout: (m: number) => void;
}

export const useStore = create<State>((set, get) => ({
  contacts: [],
  total: 0,
  loading: false,
  search: '',
  gruppoFilter: [],
  attivoFilter: '',
  gruppoOptions: [],

  history: [],
  historySearch: '',

  selectedIds: new Set(),

  selectionGroups: [],
  templates: [],

  draft: { title: '', body: '', type: 'whatsapp' },

  sorting: [],
  sortedContactIds: [],

  lang: (localStorage.getItem('comunicar-lang') as Lang | null) ?? 'it',
  setLang: (l) => { set({ lang: l }); localStorage.setItem('comunicar-lang', l); },

  theme: (localStorage.getItem('comunicar-theme') as 'light' | 'dark' | null) ?? 'light',
  setTheme: (t) => {
    set({ theme: t });
    localStorage.setItem('comunicar-theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  },

  authUser: null,
  authToken: localStorage.getItem('comunicar-token'),
  authLoading: false,
  sessionExpired: false,
  inactivityTimeout: 30,

  login: async (email, password) => {
    const { token, user } = await api.auth.login(email, password);
    setAuthToken(token);
    // Store role so LoginPage can set autocomplete accordingly next visit
    localStorage.setItem('comunicar-last-role', user.role);
    set({ authUser: user, authToken: token, sessionExpired: false });
  },

  // Called after a successful password change so mustChangePassword clears in-store too
  clearMustChangePassword: () => {
    set(s => s.authUser ? { authUser: { ...s.authUser, mustChangePassword: false } } : {});
  },

  logout: (reason) => {
    setAuthToken(null);
    set({ authUser: null, authToken: null, sessionExpired: reason === 'inactivity' });
  },

  loadAuth: async () => {
    const token = localStorage.getItem('comunicar-token');
    if (!token) { set({ authLoading: false }); return false; }
    set({ authLoading: true });
    try {
      const user = await api.auth.me();
      set({ authUser: user, authToken: token, authLoading: false });
      return true;
    } catch {
      setAuthToken(null);
      set({ authUser: null, authToken: null, authLoading: false });
      return false;
    }
  },

  fetchSettings: async () => {
    try {
      const s = await api.settings.get();
      set({ inactivityTimeout: s.inactivityTimeout });
    } catch { /* keep default */ }
  },

  setInactivityTimeout: (m) => set({ inactivityTimeout: m }),

  sending: false,
  pendingSend: false,
  sendProgress: { done: 0, total: 0 },
  sendResults: [],
  jobId: null,

  setSearch: (s) => { set({ search: s }); get().fetchContacts(); },
  setGruppoFilter: (g) => { set({ gruppoFilter: g }); get().fetchContacts(); },
  setAttivoFilter: (a) => { set({ attivoFilter: a }); get().fetchContacts(); },

  fetchHistory: async (q) => {
    const query = q ?? get().historySearch;
    const data = await api.history.list(query);
    set({ history: data });
  },

  removeHistory: async (id) => {
    await api.history.remove(id);
    await get().fetchHistory();
  },

  setHistorySearch: (q) => { set({ historySearch: q }); get().fetchHistory(q); },

  fetchContacts: async () => {
    const { search, gruppoFilter, attivoFilter } = get();
    set({ loading: true });
    try {
      const res = await api.contacts.list({ search, gruppo: gruppoFilter, attivo: attivoFilter, pageSize: 500 });
      set({ contacts: res.data, total: res.total });
    } finally {
      set({ loading: false });
    }
  },

  fetchMeta: async () => {
    const groups = await api.contacts.groups();
    set({ gruppoOptions: groups });
  },

  toggleSelect: (id) => {
    const s = new Set(get().selectedIds);
    s.has(id) ? s.delete(id) : s.add(id);
    set({ selectedIds: s });
  },

  selectAll: () => {
    set({ selectedIds: new Set(get().contacts.map(c => c.id)) });
  },

  clearSelection: () => set({ selectedIds: new Set() }),

  applyGroupFilter: (g) => {
    try {
      const filter = JSON.parse(g.filter_json);
      const gruppo = Array.isArray(filter.gruppo)
        ? filter.gruppo
        : filter.gruppo ? [filter.gruppo] : [];
      set({ search: filter.search ?? '', gruppoFilter: gruppo, attivoFilter: filter.attivo ?? '' });
      setTimeout(() => get().fetchContacts(), 0);
    } catch { /* ignore */ }
  },

  fetchSelectionGroups: async () => {
    const groups = await api.selectionGroups.list();
    set({ selectionGroups: groups });
  },

  saveSelectionGroup: async (name, description) => {
    const { search, gruppoFilter, attivoFilter } = get();
    await api.selectionGroups.create(name, { search, gruppo: gruppoFilter, attivo: attivoFilter }, description);
    await get().fetchSelectionGroups();
  },

  updateSelectionGroup: async (id, name, description) => {
    await api.selectionGroups.update(id, name, description);
    await get().fetchSelectionGroups();
  },


  removeSelectionGroup: async (id) => {
    await api.selectionGroups.remove(id);
    await get().fetchSelectionGroups();
  },

  fetchTemplates: async () => {
    const t = await api.templates.list();
    set({ templates: t });
  },

  saveTemplate: async (name) => {
    const { draft } = get();
    await api.templates.create({ name, title: draft.title, body: draft.body, type: draft.type });
    await get().fetchTemplates();
  },

  loadTemplate: (t) => {
    set({ draft: { ...get().draft, title: t.title ?? '', body: t.body ?? '', type: t.type as 'whatsapp' | 'email' } });
  },

  removeTemplate: async (id) => {
    await api.templates.remove(id);
    await get().fetchTemplates();
  },

  setDraft: (d) => set({ draft: { ...get().draft, ...d } }),

  setSorting: (s) => set({ sorting: s }),
  setSortedContactIds: (ids) => set({ sortedContactIds: ids }),

  requestSend: () => set({ pendingSend: true }),
  cancelSend:  () => set({ pendingSend: false }),

  confirmSend: async () => {
    const { selectedIds, sortedContactIds, draft } = get();
    // ordered IDs: sorted display order, filtered to selected
    const ids = sortedContactIds.length
      ? sortedContactIds.filter(id => selectedIds.has(id))
      : Array.from(selectedIds);
    if (!ids.length) return;

    set({ pendingSend: false, sending: true, sendResults: [], sendProgress: { done: 0, total: ids.length } });

    const { jobId, total } = await api.send.start(ids, draft);
    set({ jobId });

    const es = new EventSource(api.sseUrl(`/api/send/${jobId}/events`));
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      set(s => ({
        sendProgress: { done: data.done, total },
        sendResults: data.latest ? [...s.sendResults, data.latest] : s.sendResults,
      }));
      if (data.finished) {
        es.close();
        set({ sending: false });
        get().fetchHistory();
        // Auto-mark as Concluído all contacts with at least one successful delivery
        const allResults = get().sendResults;
        const okIds = [...new Set(
          allResults
            .filter(r => r.status === 'ok' && r.contactId != null)
            .map(r => r.contactId as number)
        )];
        if (okIds.length > 0) {
          api.contacts.patchMany(okIds, { fatto: 1 }).then(() => get().fetchContacts());
        }
      }
    };
    es.onerror = () => { es.close(); set({ sending: false }); };
  },

  startSend: () => { get().requestSend(); return Promise.resolve(); },

  markFatto: async (fatto) => {
    const ids = Array.from(get().selectedIds);
    if (!ids.length) return;
    await api.contacts.patchMany(ids, { fatto: fatto ? 1 : 0 });
    await get().fetchContacts();
  },

  createContact: async (data) => {
    const item = await api.contacts.create(data);
    await get().fetchContacts();
    await get().fetchMeta();
    return item;
  },

  updateContact: async (id, data) => {
    const item = await api.contacts.update(id, data);
    await get().fetchContacts();
    return item;
  },

  deleteContacts: async (ids) => {
    await api.contacts.remove(ids);
    const s = new Set(get().selectedIds);
    ids.forEach(id => s.delete(id));
    set({ selectedIds: s });
    await get().fetchContacts();
    await get().fetchMeta();
  },

  importCSV: async (file) => {
    const { imported } = await api.import(file);
    await get().fetchContacts();
    await get().fetchMeta();
    return imported;
  },
}));
