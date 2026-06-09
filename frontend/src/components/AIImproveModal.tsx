import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Sparkles, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { useT } from '../useT';
import { api } from '../api';

type AIMode = 'base' | 'premium';

interface Props {
  initialText: string;
  onAccept: (text: string) => void;
  onClose: () => void;
}

const DEBOUNCE_MS = 1500;

export default function AIImproveModal({ initialText, onAccept, onClose }: Props) {
  const t = useT();

  const [leftText, setLeftText]   = useState(initialText);
  const [rightText, setRightText] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [noKey, setNoKey]         = useState(false);
  const [ran, setRan]             = useState(false);
  const [mode, setMode]           = useState<AIMode>('base');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef    = useRef<AbortController | null>(null);
  const modeRef     = useRef<AIMode>('base'); // always up-to-date in callbacks
  modeRef.current = mode;

  // ── Run AI ──────────────────────────────────────────────────────────────────
  const runAI = useCallback(async (text: string, aiMode?: AIMode) => {
    if (!text.trim()) { setRightText(''); setLoading(false); return; }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError('');
    setNoKey(false);
    try {
      const { improved } = await api.ai.improve(text, aiMode ?? modeRef.current);
      setRightText(improved);
      setRan(true);
    } catch (e: unknown) {
      const data = (e as { response?: { data?: { error?: string; noKey?: boolean } } })?.response?.data;
      if (data?.noKey) { setNoKey(true); setError(t.aiNoKey); }
      else              { setError(data?.error || t.aiError); }
    } finally {
      setLoading(false);
    }
  }, [t]);

  // ── Initial run on mount ───────────────────────────────────────────────────
  useEffect(() => {
    if (initialText.trim()) runAI(initialText, 'base');
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mode change → re-run immediately ──────────────────────────────────────
  const handleModeChange = (newMode: AIMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    modeRef.current = newMode;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (leftText.trim()) {
      setLoading(true);
      runAI(leftText, newMode);
    }
  };

  // ── Left-side edits with debounce ─────────────────────────────────────────
  const handleLeftChange = (val: string) => {
    setLeftText(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setRightText(''); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(() => runAI(val), DEBOUNCE_MS);
  };

  const handleManualRefresh = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runAI(leftText);
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const canAcceptRight = !loading && !!rightText && !error;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6"
      onClick={handleBackdrop}
    >
      <div
        className="bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-5xl"
        style={{ maxHeight: 'calc(100vh - 3rem)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2 text-purple-700 font-semibold text-base">
            <Sparkles size={16} />
            {t.aiModalTitle}
          </div>

          {/* Mode selector — center of header */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {(['base', 'premium'] as AIMode[]).map(m => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                title={m === 'base' ? t.aiModalModeBaseDesc : t.aiModalModePremiumDesc}
                className={clsx(
                  'px-3 py-1 rounded-md text-xs font-semibold transition-all',
                  mode === m
                    ? m === 'premium'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                      : 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {m === 'base' ? t.aiModalModeBase : t.aiModalModePremium}
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded p-1"
            title={t.aiModalClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode description */}
        <div className="px-5 py-1.5 bg-gray-50 border-b border-gray-100 shrink-0">
          <p className="text-[11px] text-gray-500 text-center">
            {mode === 'premium' ? t.aiModalModePremiumDesc : t.aiModalModeBaseDesc}
          </p>
        </div>

        {/* ── Two-column body ── */}
        <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden gap-0">

          {/* ──────── LEFT: Original (editable) ──────── */}
          <div className="flex flex-col flex-1 min-w-0 p-4 sm:border-r border-gray-200 gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {t.aiModalOriginal}
              </span>
            </div>

            <textarea
              autoFocus
              value={leftText}
              onChange={e => handleLeftChange(e.target.value)}
              placeholder={t.aiModalEmpty}
              className={clsx(
                'flex-1 min-h-[180px] sm:min-h-0 w-full border border-gray-300 rounded-lg px-3 py-2.5',
                'text-sm leading-relaxed resize-none focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200',
                'transition-colors'
              )}
            />

            <button
              onClick={() => onAccept(leftText)}
              disabled={!leftText.trim()}
              className={clsx(
                'shrink-0 w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors',
                leftText.trim()
                  ? 'bg-gray-700 hover:bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              )}
            >
              {t.aiModalUseThis}
            </button>
          </div>

          {/* ──────── RIGHT: AI improved ──────── */}
          <div className="flex flex-col flex-1 min-w-0 p-4 gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <span className={clsx(
                'text-xs font-semibold uppercase tracking-wide',
                mode === 'premium' ? 'text-indigo-600' : 'text-purple-600'
              )}>
                {t.aiModalImproved}
              </span>

              {ran && !loading && (
                <button
                  onClick={handleManualRefresh}
                  title={t.aiModalRefresh}
                  className="ml-auto text-purple-400 hover:text-purple-600 transition-colors"
                >
                  <RefreshCw size={13} />
                </button>
              )}
            </div>

            {/* Right content area */}
            <div
              className={clsx(
                'flex-1 min-h-[180px] sm:min-h-0 border rounded-lg px-3 py-2.5 text-sm leading-relaxed',
                'overflow-y-auto scrollbar-thin',
                loading
                  ? 'border-purple-200 bg-purple-50/40'
                  : error
                    ? 'border-red-200 bg-red-50/30'
                    : mode === 'premium'
                      ? 'border-indigo-200 bg-indigo-50/20'
                      : 'border-purple-200 bg-purple-50/20',
              )}
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-purple-500">
                  <Loader2 size={24} className="animate-spin" />
                  <span className="text-xs font-medium">{t.aiModalProcessing}</span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-start gap-2 text-red-600">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span className="text-xs font-medium">{error}</span>
                  </div>
                  {!noKey && (
                    <button
                      onClick={handleManualRefresh}
                      className="text-xs text-purple-600 hover:text-purple-800 underline mt-1"
                    >
                      {t.aiModalRefresh}
                    </button>
                  )}
                </div>
              ) : rightText ? (
                <div className="whitespace-pre-wrap text-gray-800">{rightText}</div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-300 text-xs italic text-center">
                  {t.aiModalEmpty}
                </div>
              )}
            </div>

            <button
              onClick={() => onAccept(rightText)}
              disabled={!canAcceptRight}
              className={clsx(
                'shrink-0 w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors',
                canAcceptRight
                  ? mode === 'premium'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm'
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              )}
            >
              {loading
                ? <><Loader2 size={13} className="animate-spin" /> {t.aiModalProcessing}</>
                : <><Sparkles size={13} /> {t.aiModalUseThis}</>
              }
            </button>
          </div>
        </div>

        {/* ── Footer hint ── */}
        <div className="px-5 py-2 border-t border-gray-100 bg-gray-50 rounded-b-xl shrink-0">
          <p className="text-[11px] text-gray-400 text-center">{t.aiModalEditHint}</p>
        </div>
      </div>
    </div>
  );
}
