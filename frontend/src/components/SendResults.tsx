import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useStore } from '../store';
import { useT } from '../useT';
import clsx from 'clsx';

export default function SendResults() {
  const { sendResults, sendProgress, sending } = useStore();
  const t = useT();

  if (!sending && sendResults.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-300 text-sm">
        <Clock size={16} className="mr-2" /> {t.resultsEmpty}
      </div>
    );
  }

  const ok  = sendResults.filter(r => r.status === 'ok').length;
  const err = sendResults.filter(r => r.status === 'error').length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-4 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs">
        <span className="text-green-700 font-semibold flex items-center gap-1"><CheckCircle size={12} /> {ok} ok</span>
        {err > 0 && <span className="text-red-600 font-semibold flex items-center gap-1"><XCircle size={12} /> {err} {t.errorsLabel}</span>}
        {sending && <span className="text-gray-500">{sendProgress.done}/{sendProgress.total}</span>}
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {sendResults.map((r, i) => (
          <div key={i} className={clsx(
            'flex items-center gap-2 px-3 py-1.5 border-b border-gray-100 text-xs',
            r.status === 'ok' ? 'bg-white' : 'bg-red-50'
          )}>
            {r.status === 'ok'
              ? <CheckCircle size={12} className="text-green-500 shrink-0" />
              : <XCircle    size={12} className="text-red-500 shrink-0" />}
            <span className="font-medium truncate flex-1">{r.responsabile}</span>
            <span className="text-gray-400 shrink-0">{r.channel}</span>
            {r.error && <span className="text-red-500 truncate max-w-[120px]" title={r.error}>{r.error}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
