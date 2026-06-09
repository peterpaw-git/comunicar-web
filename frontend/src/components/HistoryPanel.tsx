import { useEffect, useState } from 'react';
import { Search, Trash2, RotateCcw, MessageSquare, Mail } from 'lucide-react';
import { useStore } from '../store';
import { useT } from '../useT';
import type { HistoryEntry } from '../types';

function formatDate(iso: string, lang: string) {
  const d = new Date(iso);
  const locale = lang === 'br' ? 'pt-BR' : 'it-IT';
  return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' }) +
    ' ' + d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

export default function HistoryPanel() {
  const { history, historySearch, fetchHistory, removeHistory, setHistorySearch, setDraft, lang } = useStore();
  const t = useT();
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => { fetchHistory(); }, []);

  const reuse = (h: HistoryEntry) => {
    setDraft({
      type: h.type,
      title: h.title ?? '',
      body: h.body ?? '',
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Search */}
      <div className="px-3 py-2 border-b border-gray-200 shrink-0">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={historySearch}
            onChange={e => setHistorySearch(e.target.value)}
            placeholder={t.historySearch}
            className="w-full border border-gray-300 rounded pl-6 pr-2 py-1 text-xs focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {history.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-xs">
            {historySearch ? t.historyNoResults : t.historyEmpty}
          </div>
        ) : (
          history.map(h => (
            <div key={h.id} className="border-b border-gray-100 last:border-0">
              <div
                className="flex items-start gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => setExpanded(expanded === h.id ? null : h.id)}
              >
                {/* Icon */}
                <div className="shrink-0 mt-0.5 text-gray-400">
                  {h.type === 'whatsapp' ? <MessageSquare size={13} /> : <Mail size={13} />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-medium text-gray-700 truncate">
                      {h.title || <span className="text-gray-400 italic">{t.noTitle}</span>}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">{formatDate(h.sent_at, lang)}</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">
                    {h.body || <span className="italic">{t.noBody}</span>}
                  </div>
                  <div className="flex gap-2 mt-1 text-xs text-gray-400">
                    <span>{h.recipients_count} {t.recipientsSuffix}</span>
                    {h.ok_count > 0 && <span className="text-green-600">{h.ok_count} ok</span>}
                    {h.error_count > 0 && <span className="text-red-500">{h.error_count} {t.errorsLabel}</span>}
                  </div>
                </div>
              </div>

              {/* Expanded preview + actions */}
              {expanded === h.id && (
                <div className="px-3 pb-3 bg-gray-50">
                  {h.body && (
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans border border-gray-200 rounded p-2 bg-white mb-2 max-h-32 overflow-y-auto">
                      {h.body}
                    </pre>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => reuse(h)}
                      className="flex items-center gap-1 text-xs bg-brand-600 text-white rounded px-2 py-1 hover:bg-brand-700"
                    >
                      <RotateCcw size={11} /> {t.reuseBtn}
                    </button>
                    <button
                      onClick={() => removeHistory(h.id)}
                      className="flex items-center gap-1 text-xs border border-gray-300 rounded px-2 py-1 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                    >
                      <Trash2 size={11} /> {t.deleteBtn}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
