import { useState } from 'react';
import { X, KeyRound } from 'lucide-react';
import { api } from '../api';

interface Props {
  onClose: () => void;
}

const inputCls = 'border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-brand-500 w-full';

export default function ChangePasswordModal({ onClose }: Props) {
  const [current, setCurrent] = useState('');
  const [next, setNext]       = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [ok, setOk]           = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || !next) { setError('Compila tutti i campi'); return; }
    if (next.length < 6)   { setError('Minimo 6 caratteri'); return; }
    if (next !== confirm)  { setError('Le password non coincidono'); return; }
    setSaving(true); setError('');
    try {
      await api.auth.changePassword(current, next);
      setOk(true);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Errore cambio password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <KeyRound size={15} /> Cambia Password
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {ok ? (
          <div className="p-6 text-center">
            <p className="text-green-600 font-medium">Password aggiornata con successo!</p>
            <button onClick={onClose} className="mt-4 text-sm bg-brand-600 text-white rounded px-4 py-1.5 hover:bg-brand-700">
              Chiudi
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
              Password attuale
              <input type="password" className={inputCls} value={current}
                onChange={e => setCurrent(e.target.value)} autoComplete="current-password" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
              Nuova password <span className="text-gray-400 font-normal">(min 6 caratteri)</span>
              <input type="password" className={inputCls} value={next}
                onChange={e => setNext(e.target.value)} autoComplete="new-password" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
              Conferma nuova password
              <input type="password" className={inputCls} value={confirm}
                onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
            </label>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose}
                className="text-sm border border-gray-300 rounded px-4 py-1.5 hover:bg-gray-50">
                Annulla
              </button>
              <button type="submit" disabled={saving}
                className="text-sm bg-brand-600 text-white rounded px-4 py-1.5 hover:bg-brand-700 disabled:opacity-50">
                {saving ? 'Salvataggio…' : 'Salva'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
