import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Send, MessageCircle, ChevronLeft, X, Users } from 'lucide-react';
import clsx from 'clsx';
import { api } from '../api';
import { useT } from '../useT';
import type { ChatContact, ChatMessage } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(ts: string): string {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Ieri';
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
}

function formatFull(ts: string): string {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function chatDisplayName(chat: ChatContact): string {
  if (chat.contactName) {
    return chat.label ? `${chat.contactName} (${chat.label})` : chat.contactName;
  }
  return chat.jid;
}

// ── ContactRow ───────────────────────────────────────────────────────────────
function ContactRow({ chat, selected, onClick }: {
  chat: ChatContact;
  selected: boolean;
  onClick: () => void;
}) {
  const name = chatDisplayName(chat);
  const initial = name[0]?.toUpperCase() ?? '?';
  const lastMsg = chat.lastMessage;

  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-2.5 px-3 py-2.5 text-left border-b border-gray-100 transition-colors',
        selected
          ? 'bg-brand-50 border-l-[3px] border-l-brand-600'
          : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'
      )}
    >
      <div className="w-9 h-9 rounded-full bg-brand-200 text-brand-800 flex items-center justify-center text-sm font-bold shrink-0">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <span className={clsx('text-xs font-semibold truncate', selected ? 'text-brand-700' : 'text-gray-800')}>
            {name}
          </span>
          {lastMsg && (
            <span className="text-[10px] text-gray-400 shrink-0">{formatTime(lastMsg.timestamp)}</span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <p className="text-[11px] text-gray-500 truncate flex-1">
            {lastMsg
              ? (lastMsg.direction === 'out' ? '→ ' : '← ') + lastMsg.text
              : <span className="italic text-gray-400">—</span>
            }
          </p>
          {chat.unreadCount > 0 && (
            <span className="shrink-0 bg-brand-600 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── MessageBubble ─────────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isOut = msg.direction === 'out';
  return (
    <div className={clsx('flex', isOut ? 'justify-end' : 'justify-start')}>
      <div className={clsx(
        'max-w-[72%] px-3 py-1.5 rounded-2xl text-xs shadow-sm',
        isOut
          ? msg.status === 'error'
            ? 'bg-red-100 text-red-800 border border-red-300 rounded-br-sm'
            : 'bg-brand-600 text-white rounded-br-sm'
          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
      )}>
        {msg.bulk && (
          <span className={clsx(
            'text-[9px] font-semibold uppercase tracking-wide block mb-0.5',
            isOut ? 'text-white/60' : 'text-gray-400'
          )}>
            bulk
          </span>
        )}
        <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
        <p className={clsx('text-[10px] mt-0.5 text-right leading-none', isOut ? 'text-white/70' : 'text-gray-400')}>
          {formatFull(msg.timestamp)}
          {isOut && msg.status === 'error' && ' ⚠'}
        </p>
      </div>
    </div>
  );
}

// ── New Chat Picker ───────────────────────────────────────────────────────────
function NewChatPicker({ onSelect, onClose }: {
  onSelect: (chat: ChatContact) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.whatsapp.getContacts().then(setContacts).catch(() => {});
  }, []);

  const filtered = contacts.filter(c => {
    const s = search.toLowerCase();
    return (
      (c.contactName ?? '').toLowerCase().includes(s) ||
      (c.filhos ?? '').toLowerCase().includes(s) ||
      c.jid.includes(s)
    );
  });

  return (
    <div className="absolute inset-0 z-20 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-brand-700 text-white shrink-0">
        <button onClick={onClose} className="p-1 rounded hover:bg-white/20">
          <ChevronLeft size={16} />
        </button>
        <h3 className="text-sm font-semibold flex-1">{t.chatPickContact}</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/20">
          <X size={14} />
        </button>
      </div>
      {/* Search */}
      <div className="px-2 py-2 border-b border-gray-100 shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.chatPickSearch}
            className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:border-brand-400"
          />
        </div>
      </div>
      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
            <Users size={28} strokeWidth={1} />
            <p className="text-xs">Nessun risultato</p>
          </div>
        )}
        {filtered.map(c => (
          <button
            key={c.jid}
            onClick={() => onSelect(c)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 text-left"
          >
            <div className="w-8 h-8 rounded-full bg-brand-200 text-brand-800 flex items-center justify-center text-sm font-bold shrink-0">
              {(c.contactName ?? c.jid)[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">
                {c.contactName ?? c.jid}
                {c.label && <span className="text-gray-400 font-normal ml-1">({c.label})</span>}
              </p>
              {c.filhos && <p className="text-[11px] text-gray-500 truncate">{c.filhos}</p>}
              <p className="text-[10px] text-gray-400">{c.jid}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Thread (right panel) ──────────────────────────────────────────────────────
function Thread({ jid, chat, onBack }: {
  jid: string;
  chat: ChatContact | null;
  onBack: () => void;
}) {
  const t = useT();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadMessages = useCallback(async () => {
    try {
      const msgs = await api.whatsapp.getMessages(jid);
      setMessages(msgs);
    } catch { /* ignore */ }
  }, [jid]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Expose reload for SSE events (used by parent via ref)
  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const msgText = text.trim();
    setText('');
    setSending(true);
    try {
      const result = await api.whatsapp.send(jid, msgText, chat?.contactId ?? null);
      setMessages(prev => [...prev, result.message]);
    } catch {
      // error already stored in conversation by backend
      await loadMessages();
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const name = chat ? chatDisplayName(chat) : jid;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-brand-700 text-white shrink-0">
        <button onClick={onBack} className="lg:hidden p-1 rounded hover:bg-white/20">
          <ChevronLeft size={16} />
        </button>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold shrink-0">
          {name[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">{name}</p>
          {chat?.filhos && <p className="text-[11px] text-white/70 truncate">{chat.filhos}</p>}
          <p className="text-[10px] text-white/60">{jid}</p>
        </div>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-2"
        style={{ background: 'var(--chat-bg, #e5ddd5)' }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
            <MessageCircle size={36} strokeWidth={1} />
            <p className="text-xs">{t.chatNoMessages}</p>
          </div>
        )}
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 flex items-end gap-2 px-3 py-2.5 border-t border-gray-200 bg-white">
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => {
            setText(e.target.value);
            // Auto-resize
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
          }}
          placeholder={t.chatInputPlaceholder}
          rows={1}
          className="flex-1 border border-gray-200 rounded-2xl px-3 py-2 text-xs focus:outline-none focus:border-brand-400 resize-none bg-gray-50 leading-relaxed"
          style={{ minHeight: 36, maxHeight: 96 }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 disabled:opacity-40 transition-colors"
          title="Invia (Enter)"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
function EmptyState({ onNewChat }: { onNewChat: () => void }) {
  const t = useT();
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 bg-gray-50">
      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
        <MessageCircle size={40} strokeWidth={1} className="text-gray-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-600">{t.chatSelectContact}</p>
        <p className="text-xs mt-1">{t.chatNoConversations}</p>
      </div>
      <button
        onClick={onNewChat}
        className="flex items-center gap-1.5 bg-brand-600 text-white text-xs rounded-full px-4 py-2 hover:bg-brand-700"
      >
        <Plus size={13} /> {t.chatNewChat}
      </button>
    </div>
  );
}

// ── Main ChatDashboard ────────────────────────────────────────────────────────
export default function ChatDashboard() {
  const t = useT();
  const [chats, setChats] = useState<ChatContact[]>([]);
  const [selectedJid, setSelectedJid] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [mobileShowThread, setMobileShowThread] = useState(false);

  const selectedChat = chats.find(c => c.jid === selectedJid) ?? null;

  const loadChats = useCallback(async () => {
    try {
      const data = await api.whatsapp.getChats();
      setChats(data);
    } catch { /* ignore */ }
    finally { setLoadingChats(false); }
  }, []);

  useEffect(() => { loadChats(); }, [loadChats]);

  // SSE — real-time incoming messages
  useEffect(() => {
    const es = new EventSource('/api/whatsapp/events');
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'message') {
        // Refresh chat list
        loadChats();
      }
    };
    return () => es.close();
  }, [loadChats]);

  const handleSelectJid = (jid: string) => {
    setSelectedJid(jid);
    setMobileShowThread(true);
    // Update local chat list unread immediately
    setChats(prev => prev.map(c => c.jid === jid ? { ...c, unreadCount: 0 } : c));
  };

  const handlePickContact = (contact: ChatContact) => {
    // If chat doesn't exist yet, add a placeholder
    if (!chats.find(c => c.jid === contact.jid)) {
      setChats(prev => [{ ...contact, lastMessage: null, unreadCount: 0 }, ...prev]);
    }
    setShowPicker(false);
    handleSelectJid(contact.jid);
  };

  return (
    <div className="flex h-full min-h-0 relative overflow-hidden" style={{ '--chat-bg': 'var(--color-chat-bg, #e5ddd5)' } as React.CSSProperties}>

      {/* ── Left sidebar (chat list) ── */}
      <div className={clsx(
        'flex flex-col w-72 xl:w-80 shrink-0 border-r border-gray-200 bg-white relative',
        mobileShowThread ? 'hidden lg:flex' : 'flex'
      )}>
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-brand-700 text-white shrink-0">
          <h2 className="font-semibold flex-1 text-sm">{t.chatTitle}</h2>
          <button onClick={() => setShowPicker(true)}
            className="p-1 rounded hover:bg-white/20 transition-colors"
            title={t.chatNewChat}>
            <Plus size={16} />
          </button>
        </div>

        {/* Search */}
        <ChatListSearch chats={chats} selectedJid={selectedJid} onSelect={handleSelectJid}
          loadingChats={loadingChats} onNewChat={() => setShowPicker(true)} />

        {/* New chat picker overlay */}
        {showPicker && (
          <NewChatPicker
            onSelect={handlePickContact}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>

      {/* ── Right: thread ── */}
      <div className={clsx(
        'flex-1 min-w-0 min-h-0',
        !mobileShowThread && 'hidden lg:flex lg:flex-col'
      )}>
        {selectedJid
          ? <Thread
              key={selectedJid}
              jid={selectedJid}
              chat={selectedChat}
              onBack={() => { setMobileShowThread(false); setSelectedJid(null); }}
            />
          : <EmptyState onNewChat={() => setShowPicker(true)} />
        }
      </div>

    </div>
  );
}

// ── ChatListSearch (searchable inner part of left sidebar) ────────────────────
function ChatListSearch({ chats, selectedJid, onSelect, loadingChats, onNewChat }: {
  chats: ChatContact[];
  selectedJid: string | null;
  onSelect: (jid: string) => void;
  loadingChats: boolean;
  onNewChat: () => void;
}) {
  const t = useT();
  const [search, setSearch] = useState('');

  const filtered = chats.filter(c => {
    const s = search.toLowerCase();
    return (
      (c.contactName ?? '').toLowerCase().includes(s) ||
      (c.filhos ?? '').toLowerCase().includes(s) ||
      c.jid.includes(s)
    );
  });

  return (
    <>
      <div className="px-2 py-2 border-b border-gray-100 shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.chatSearch}
            className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:border-brand-400"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loadingChats && (
          <p className="text-xs text-gray-400 text-center py-8">{t.loading}</p>
        )}
        {!loadingChats && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
            <MessageCircle size={32} strokeWidth={1} />
            <p className="text-xs text-center">{t.chatNoConversations}</p>
            <button onClick={onNewChat} className="text-xs text-brand-600 hover:underline">
              {t.chatStart}
            </button>
          </div>
        )}
        {filtered.map(chat => (
          <ContactRow
            key={chat.jid}
            chat={chat}
            selected={chat.jid === selectedJid}
            onClick={() => onSelect(chat.jid)}
          />
        ))}
      </div>
    </>
  );
}
