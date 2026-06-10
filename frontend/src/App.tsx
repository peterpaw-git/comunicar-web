import { useEffect, useState, useRef, useCallback } from 'react';
import { Search, X, Upload, Download, CheckSquare, Square, Users, MessageSquare, BarChart2, RefreshCw, UserPlus, Trash2, History, Sun, Moon, MessageCircle, LogOut, Settings, KeyRound, ChevronDown, Timer } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from './store';
import { useT } from './useT';
import type { Lang } from './i18n';
import ContactGrid from './components/ContactGrid';
import ContactModal from './components/ContactModal';
import GroupMultiSelect from './components/GroupMultiSelect';
import MessageComposer from './components/MessageComposer';
import SelectionGroupsPanel from './components/SelectionGroupsPanel';
import HistoryPanel from './components/HistoryPanel';
import SendConfirmModal from './components/SendConfirmModal';
import ChatDashboard from './components/ChatDashboard';
import LoginPage from './components/LoginPage';
import UserManagementModal from './components/UserManagementModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import SettingsModal from './components/SettingsModal';
import { useInactivityTimer } from './hooks/useInactivityTimer';
import type { Contact } from './types';

type AppMode = 'comunicar' | 'chat';
type MobileTab = 'contacts' | 'compose' | 'results' | 'history';
type RightTab = 'compose' | 'history';

const LS_RIGHT_W  = 'comunicar-right-width';
const LS_GROUPS_W = 'comunicar-groups-width';
const MIN_RIGHT  = 260; const MAX_RIGHT  = 560; const DEF_RIGHT  = 320;
const MIN_GROUPS = 140; const MAX_GROUPS = 380; const DEF_GROUPS = 224;

const LANG_FLAGS: Record<Lang, string> = { it: '🇮🇹', br: '🇧🇷' };
const LANG_LABELS: Record<Lang, string> = { it: 'IT', br: 'BR' };

export default function App() {
  const {
    search, setSearch, gruppoFilter, setGruppoFilter, attivoFilter, setAttivoFilter,
    gruppoOptions, total, loading, selectedIds, clearSelection, selectAll, contacts,
    fetchContacts, fetchMeta, fetchSelectionGroups, fetchTemplates,
    markFatto, importCSV, deleteContacts,
    lang, setLang, theme, setTheme,
    authUser, authLoading, loadAuth, logout,
    inactivityTimeout, fetchSettings,
  } = useStore();
  const t = useT();

  // ── Auth init ──────────────────────────────────────────────────────────────
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    loadAuth().finally(() => setAuthChecked(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for 401 from API interceptor
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('comunicar:unauthorized', handler);
    return () => window.removeEventListener('comunicar:unauthorized', handler);
  }, [logout]);

  // Apply persisted theme on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isSecretaria = authUser?.role === 'secretaria';
  const isAdmin      = authUser?.role === 'admin';

  const [appMode, setAppMode] = useState<AppMode>('comunicar');
  const [mobileTab, setMobileTab] = useState<MobileTab>('contacts');
  const [rightTab, setRightTab] = useState<RightTab>('compose');
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [modalContact, setModalContact] = useState<Contact | null | undefined>(undefined);
  const [showUserMgmt, setShowUserMgmt] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  // undefined = closed, null = new, Contact = edit

  // ── Resizable panels ──────────────────────────────────────────────────────
  const [rightWidth, setRightWidth]   = useState(() => Number(localStorage.getItem(LS_RIGHT_W)  || DEF_RIGHT));
  const [groupsWidth, setGroupsWidth] = useState(() => Number(localStorage.getItem(LS_GROUPS_W) || DEF_GROUPS));
  const panelDragRef = useRef<{ type: 'right' | 'groups'; startX: number; startW: number } | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = panelDragRef.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      if (d.type === 'right') {
        const w = Math.max(MIN_RIGHT, Math.min(MAX_RIGHT, d.startW - dx));
        setRightWidth(w);
        localStorage.setItem(LS_RIGHT_W, String(w));
      } else {
        const w = Math.max(MIN_GROUPS, Math.min(MAX_GROUPS, d.startW + dx));
        setGroupsWidth(w);
        localStorage.setItem(LS_GROUPS_W, String(w));
      }
    };
    const onUp = () => { panelDragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (authUser) {
      fetchContacts();
      fetchMeta();
      fetchSelectionGroups();
      fetchTemplates();
      fetchSettings();
    }
  }, [authUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Inactivity timer ────────────────────────────────────────────────────────
  const handleExpire = useCallback(() => {
    logout('inactivity');
  }, [logout]);

  const { warningVisible, remainingSeconds } = useInactivityTimer(
    authUser ? inactivityTimeout : 0,
    handleExpire,
  );

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg('');
    try {
      const n = await importCSV(file);
      setImportMsg(t.importSuccess(n));
    } catch {
      setImportMsg(t.importError);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const allSelected = contacts.length > 0 && contacts.every(c => selectedIds.has(c.id));

  const handleDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    if (!window.confirm(t.confirmDelete(ids.length))) return;
    await deleteContacts(ids);
  };

  // ── Render: loading / not authenticated ───────────────────────────────────
  if (!authChecked || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-400 text-sm">{t.authLoading}</div>
      </div>
    );
  }

  if (!authUser) {
    return <LoginPage />;
  }

  // Forced password change — show modal over a blurred app, cannot be dismissed
  if (authUser.mustChangePassword) {
    return (
      <div className="min-h-screen bg-gray-100">
        <ChangePasswordModal forced onClose={() => {/* noop — forced */}} />
      </div>
    );
  }

  // ── Language selector ────────────────────────────────────────────────────
  const LangSelector = (
    <div className="flex items-center gap-0.5 rounded border border-white/30 overflow-hidden ml-3">
      {(['it', 'br'] as Lang[]).map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          title={LANG_FLAGS[l]}
          className={clsx(
            'px-2 py-0.5 text-xs font-bold transition-colors',
            lang === l
              ? 'bg-white text-brand-700'
              : 'text-white/70 hover:text-white hover:bg-white/20'
          )}
        >
          {LANG_LABELS[l]}
        </button>
      ))}
    </div>
  );

  const Toolbar = (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-white border-b border-gray-200">
      {/* Search */}
      <div className="relative flex-1 min-w-[160px] max-w-xs">
        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full border border-gray-300 rounded pl-7 pr-7 py-1 text-xs focus:outline-none focus:border-brand-500" />
        {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={12} /></button>}
      </div>

      {/* Gruppo filter */}
      <GroupMultiSelect
        options={gruppoOptions}
        value={gruppoFilter}
        onChange={setGruppoFilter}
      />

      {/* Attivo filter */}
      <select value={attivoFilter} onChange={e => setAttivoFilter(e.target.value)}
        className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-brand-500">
        <option value="">{t.filterAll}</option>
        <option value="SI">SI</option>
        <option value="FU">FU</option>
      </select>

      {/* Select all / clear */}
      <button onClick={() => allSelected ? clearSelection() : selectAll()}
        className="flex items-center gap-1 text-xs text-gray-600 hover:text-brand-700 border border-gray-300 rounded px-2 py-1">
        {allSelected ? <CheckSquare size={12} /> : <Square size={12} />}
        {allSelected ? t.deselectAll : t.selectAll}
      </button>

      {/* Mark fatto */}
      {selectedIds.size > 0 && (
        <>
          <button onClick={() => markFatto(true)}
            className="text-xs bg-brand-600 text-white rounded px-2 py-1 hover:bg-brand-700">
            {t.markDone(selectedIds.size)}
          </button>
          <button onClick={() => markFatto(false)}
            className="text-xs bg-gray-200 text-gray-700 rounded px-2 py-1 hover:bg-gray-300">
            {t.unmarkDone}
          </button>
          {/* Delete: hidden for secretaria */}
          {!isSecretaria && (
            <button onClick={handleDelete}
              className="flex items-center gap-1 text-xs bg-red-500 text-white rounded px-2 py-1 hover:bg-red-600">
              <Trash2 size={12} /> {t.deleteSelected(selectedIds.size)}
            </button>
          )}
        </>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button onClick={() => setModalContact(null)}
          className="flex items-center gap-1 text-xs bg-brand-600 text-white rounded px-2 py-1 hover:bg-brand-700">
          <UserPlus size={12} /> {t.newContact}
        </button>
        <span className="text-xs text-gray-400">
          {loading ? t.loading : t.contactCount(total)}
        </span>
        <button onClick={fetchContacts} title={t.refresh} className="text-gray-400 hover:text-brand-600">
          <RefreshCw size={14} />
        </button>
      </div>
    </div>
  );

  // Import/export bar — admin only
  const ImportBar = isAdmin ? (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-200">
      <button onClick={() => fileRef.current?.click()} disabled={importing}
        className="flex items-center gap-1 text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-40">
        <Upload size={12} /> {importing ? t.importing : t.importCsv}
      </button>
      <button onClick={() => { const a = document.createElement('a'); a.href = '/api/export'; a.click(); }}
        className="flex items-center gap-1 text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-100">
        <Download size={12} /> {t.exportCsv}
      </button>
      {importMsg && <span className="text-xs text-brand-700">{importMsg}</span>}
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
    </div>
  ) : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <SendConfirmModal />
      {modalContact !== undefined && (
        <ContactModal
          contact={modalContact}
          onClose={() => setModalContact(undefined)}
        />
      )}
      {showUserMgmt && <UserManagementModal onClose={() => setShowUserMgmt(false)} />}
      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* Inactivity warning banner */}
      {warningVisible && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
                        bg-amber-600 text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-xl">
          <Timer size={14} />
          <span>{t.inactivityWarning(remainingSeconds)}</span>
          <button
            onClick={() => {/* any click resets the timer via event listener */}}
            className="bg-white text-amber-700 rounded-full px-3 py-0.5 text-xs font-semibold hover:bg-amber-50 transition-colors"
          >
            {t.inactivityWarningBtn}
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-brand-700 text-white px-4 py-2.5 flex items-center gap-3 shrink-0">
        <MessageSquare size={18} />
        <h1 className="font-bold text-base tracking-wide">Comunicar</h1>

        {/* Mode switcher */}
        <div className="flex items-center gap-0.5 rounded border border-white/30 overflow-hidden ml-2">
          {([
            { key: 'comunicar', label: t.chatModeComunicar, Icon: MessageSquare },
            { key: 'chat',      label: t.chatModeChat,      Icon: MessageCircle },
          ] as const).map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setAppMode(key)}
              className={clsx('flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium transition-colors',
                appMode === key ? 'bg-white text-brand-700' : 'text-white/70 hover:text-white hover:bg-white/20')}>
              <Icon size={12} />{label}
            </button>
          ))}
        </div>

        <span className="text-brand-200 text-xs ml-auto hidden sm:block">{t.appSubtitle}</span>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Modalità chiara' : 'Modalità scura'}
          className="p-1.5 rounded text-white/70 hover:text-white hover:bg-white/20 transition-colors"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {LangSelector}

        {/* User dropdown menu */}
        <div className="relative ml-2 pl-2 border-l border-white/20">
          <button
            onClick={() => setShowUserMenu(v => !v)}
            className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors"
          >
            <span className="hidden sm:block">
              {authUser.name}
              <span className="ml-1 text-white/40">({authUser.role})</span>
            </span>
            <ChevronDown size={13} className="text-white/50" />
          </button>

          {showUserMenu && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 min-w-[180px] py-1 text-gray-700">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-800">{authUser.name}</p>
                  <p className="text-xs text-gray-400">{authUser.email}</p>
                  <p className="text-xs text-brand-600 mt-0.5 capitalize">{authUser.role}</p>
                </div>

                <button
                  onClick={() => { setShowUserMenu(false); setShowChangePw(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
                >
                  <KeyRound size={13} /> {t.userMenuChangePassword}
                </button>

                {isAdmin && (
                  <>
                    <button
                      onClick={() => { setShowUserMenu(false); setShowUserMgmt(true); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
                    >
                      <Settings size={13} /> {t.userMenuManageUsers}
                    </button>
                    <button
                      onClick={() => { setShowUserMenu(false); setShowSettings(true); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
                    >
                      <Timer size={13} /> {t.settingsTitle}
                    </button>
                  </>
                )}

                <div className="border-t border-gray-100 mt-1">
                  <button
                    onClick={() => { setShowUserMenu(false); logout(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={13} /> {t.userMenuLogout}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── CHAT MODE ── */}
      {appMode === 'chat' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatDashboard />
        </div>
      )}

      {/* ── COMUNICAR MODE: DESKTOP layout (lg+) ── */}
      {appMode === 'comunicar' && <div className="hidden lg:flex flex-1 min-h-0">
        {/* Left panel */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          {ImportBar}
          {Toolbar}

          {/* Groups + Grid */}
          <div className="flex flex-1 min-h-0">
            {/* Side: selection groups — resizable */}
            <div style={{ width: groupsWidth }} className="shrink-0 overflow-y-auto scrollbar-thin p-2 bg-gray-50 flex flex-col">
              <SelectionGroupsPanel />
            </div>
            {/* Drag handle: groups */}
            <div
              className="w-1 shrink-0 cursor-col-resize bg-gray-200 hover:bg-brand-400 transition-colors select-none"
              onMouseDown={e => { panelDragRef.current = { type: 'groups', startX: e.clientX, startW: groupsWidth }; e.preventDefault(); }}
            />
            {/* Grid */}
            <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
              <ContactGrid onEdit={c => setModalContact(c)} />
            </div>
          </div>

          {/* Status bar */}
          <div className="shrink-0 px-3 py-1.5 bg-gray-100 border-t border-gray-200 text-xs text-gray-500 flex gap-4">
            <span>{t.totalContacts(total)}</span>
            {selectedIds.size > 0 && <span className="text-brand-700 font-semibold">{t.selectedContacts(selectedIds.size)}</span>}
          </div>
        </div>

        {/* Drag handle: right panel */}
        <div
          className="w-1 shrink-0 cursor-col-resize bg-gray-200 hover:bg-brand-400 transition-colors select-none"
          onMouseDown={e => { panelDragRef.current = { type: 'right', startX: e.clientX, startW: rightWidth }; e.preventDefault(); }}
        />

        {/* Right panel — resizable */}
        <div style={{ width: rightWidth }} className="shrink-0 flex flex-col min-h-0">
          {/* Tab header */}
          <div className="flex shrink-0 border-b border-gray-200 bg-white">
            {([
              { key: 'compose', label: t.tabMessage, Icon: MessageSquare },
              { key: 'history', label: t.tabHistory, Icon: History },
            ] as const).map(({ key, label, Icon }) => (
              <button key={key} onClick={() => setRightTab(key)}
                className={clsx('flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium transition-colors border-b-2',
                  rightTab === key
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700')}>
                <Icon size={13} />{label}
              </button>
            ))}
          </div>

          {rightTab === 'compose' && (
            <div className="flex-1 min-h-0 p-2">
              <MessageComposer />
            </div>
          )}

          {rightTab === 'history' && (
            <div className="flex-1 min-h-0 overflow-hidden">
              <HistoryPanel />
            </div>
          )}
        </div>
      </div>}

      {/* ── COMUNICAR MODE: MOBILE layout (< lg) ── */}
      {appMode === 'comunicar' && <div className="flex lg:hidden flex-col flex-1 min-h-0">
        {mobileTab === 'contacts' && (
          <div className="flex flex-col flex-1 min-h-0">
            {ImportBar}
            {Toolbar}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ContactGrid onEdit={c => setModalContact(c)} />
            </div>
            <div className="px-3 py-1.5 bg-gray-100 border-t border-gray-200 text-xs text-gray-500">
              {selectedIds.size > 0
                ? <span className="text-brand-700 font-semibold">{t.selectedContacts(selectedIds.size)}</span>
                : <span>{t.contactCount(total)}</span>}
            </div>
          </div>
        )}

        {mobileTab === 'compose' && (
          <div className="flex flex-col flex-1 min-h-0 p-2 gap-2">
            <SelectionGroupsPanel />
            <div className="flex-1 min-h-0">
              <MessageComposer />
            </div>
          </div>
        )}

        {mobileTab === 'results' && (
          <div className="flex flex-col flex-1 min-h-0 border-t border-gray-200">
            {/* SendResults now lives inside MessageComposer's Risultati tab */}
          </div>
        )}

        {mobileTab === 'history' && (
          <div className="flex flex-col flex-1 min-h-0 border-t border-gray-200">
            <HistoryPanel />
          </div>
        )}

        {/* Bottom tab bar */}
        <nav className="shrink-0 flex border-t border-gray-200 bg-white">
          {([
            { key: 'contacts', label: t.tabMessage === 'Mensagem' ? 'Contatos' : 'Contatti', Icon: Users },
            { key: 'compose',  label: t.tabMessage, Icon: MessageSquare },
            { key: 'history',  label: t.tabHistory,  Icon: BarChart2 },
          ] as const).map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setMobileTab(key as MobileTab)}
              className={clsx('flex-1 flex flex-col items-center py-2 text-xs gap-0.5 transition-colors',
                mobileTab === key ? 'text-brand-700 font-semibold' : 'text-gray-400')}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
      </div>}
    </div>
  );
}
