import { X, Send, AlertTriangle } from 'lucide-react';
import { useStore } from '../store';
import { useT } from '../useT';

// Maps column accessor keys → translation keys
const COL_KEY_MAP: Record<string, keyof ReturnType<typeof useT>> = {
  responsabile: 'colResponsabile',
  filhos:       'colAluno',
  gruppo:       'colGruppo',
  attivo:       'colStato',
  whats_mae:    'colWaMae',
  whats_pai:    'colWaPai',
  email_1:      'colEmail1',
  voti:         'colNote',
  da_fare:      'fieldDaFare',
  fatto:        'fieldFatto',
};

export default function SendConfirmModal() {
  const { pendingSend, confirmSend, cancelSend, sorting, selectedIds, sortedContactIds, draft } = useStore();
  const t = useT();

  if (!pendingSend) return null;

  const orderedCount = sortedContactIds.length
    ? sortedContactIds.filter(id => selectedIds.has(id)).length
    : selectedIds.size;

  // Estimate: avg 6s per contact (mid of 2–10s range), WA only
  const estSeconds = draft.type === 'whatsapp' ? orderedCount * 6 : orderedCount * 2;
  const estLabel = estSeconds < 60
    ? `~${estSeconds}s`
    : `~${Math.round(estSeconds / 60)} min`;

  const sortLabel = !sorting.length
    ? t.confirmDefaultOrder
    : sorting.map(s => {
        const key = COL_KEY_MAP[s.id];
        const colName = key ? (t[key] as string) : s.id;
        return `${colName} ${s.desc ? '↓' : '↑'}`;
      }).join(', ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={cancelSend}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Send size={15} className="text-brand-600" />
            {t.confirmTitle}
          </h2>
          <button onClick={cancelSend} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">{t.confirmSpamNote}</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t.confirmRecipients}</span>
              <span className="font-semibold text-gray-800">{t.confirmContacts(orderedCount)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t.confirmChannel}</span>
              <span className="font-semibold text-gray-800">{draft.type === 'whatsapp' ? 'WhatsApp' : 'Email'}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t.confirmOrder}</span>
              <span className="font-semibold text-gray-800 text-right max-w-[180px]">{sortLabel}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t.confirmEstTime}</span>
              <span className="font-semibold text-gray-800">{estLabel}</span>
            </div>
          </div>

          {draft.title && (
            <div className="bg-gray-50 rounded p-2 border border-gray-200">
              <p className="text-xs font-semibold text-gray-700">{draft.title}</p>
              {draft.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{draft.body}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-4 py-3 border-t border-gray-200">
          <button onClick={cancelSend}
            className="flex-1 text-sm border border-gray-300 rounded px-3 py-2 hover:bg-gray-50 text-gray-600">
            {t.cancelBtn}
          </button>
          <button onClick={confirmSend}
            className="flex-1 text-sm bg-brand-600 text-white rounded px-3 py-2 hover:bg-brand-700 font-semibold flex items-center justify-center gap-2">
            <Send size={13} />
            {t.sendNowBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
