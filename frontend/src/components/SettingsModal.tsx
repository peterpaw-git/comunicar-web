import { useState, useEffect } from 'react';
import { X, Timer } from 'lucide-react';
import { api } from '../api';
import { useT } from '../useT';
import { useStore } from '../store';

interface Props {
  onClose: () => void;
}

const QUICK_OPTIONS = [0, 5, 10, 15, 30, 60, 120];

export default function SettingsModal({ onClose }: Props) {
  const t = useT();
  const { setInactivityTimeout } = useStore();
  const [timeout, setTimeoutVal] = useState(30);
  const [saving, setSaving]      = useState(false);
  const [saved, setSaved]        = useState(false);
  const [error, setError]        = useState('');

  useEffect(() => {
    api.settings.get().then(s => setTimeoutVal(s.inactivityTimeout)).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const s = await api.settings.update({ inactivityTimeout: timeout });
      setInactivityTimeout(s.inactivityTimeout);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Errore salvataggio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Timer size={15} /> {t.settingsTitle}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-700">{t.settingsInactivityLabel}</span>
            <p className="text-xs text-gray-400">{t.settingsInactivityHint}</p>

            {/* Quick-pick chips */}
            <div className="flex flex-wrap gap-1.5 mt-1">
              {QUICK_OPTIONS.map(v => (
                <button
                  key={v}
                  onClick={() => setTimeoutVal(v)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    timeout === v
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'border-gray-300 text-gray-600 hover:border-brand-400 hover:text-brand-600'
                  }`}
                >
                  {v === 0 ? '∞ off' : `${v} ${t.settingsMinutes}`}
                </button>
              ))}
            </div>

            {/* Custom value input */}
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number" min={0} max={480} step={1}
                value={timeout}
                onChange={e => setTimeoutVal(Math.max(0, Math.min(480, parseInt(e.target.value) || 0)))}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm w-20 focus:outline-none focus:border-brand-500 text-center"
              />
              <span className="text-sm text-gray-500">{t.settingsMinutes}</span>
            </div>
            <p className="text-xs text-gray-400">{t.settingsZeroDisabled}</p>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200">
          <button onClick={onClose}
            className="text-sm border border-gray-300 rounded px-4 py-1.5 hover:bg-gray-50">
            {t.userMgmtCancel}
          </button>
          <button onClick={handleSave} disabled={saving}
            className={`text-sm rounded px-4 py-1.5 transition-colors disabled:opacity-50 ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}>
            {saved ? t.settingsSaved : saving ? t.userMgmtSaving : t.userMgmtSave}
          </button>
        </div>
      </div>
    </div>
  );
}
