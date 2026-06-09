import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Pencil, KeyRound } from 'lucide-react';
import { api } from '../api';
import type { AuthUser, UserRole } from '../types';

interface Props {
  onClose: () => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin:        'Admin',
  coordenadora: 'Coordenadora',
  secretaria:   'Secretaria',
};

const inputCls = 'border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-brand-500 w-full';

type Mode = 'list' | 'new' | 'edit' | 'change-pw';

export default function UserManagementModal({ onClose }: Props) {
  const [users, setUsers]   = useState<AuthUser[]>([]);
  const [mode, setMode]     = useState<Mode>('list');
  const [editing, setEditing] = useState<AuthUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  // Form fields
  const [fEmail, setFEmail]     = useState('');
  const [fName, setFName]       = useState('');
  const [fRole, setFRole]       = useState<UserRole>('secretaria');
  const [fPass, setFPass]       = useState('');
  const [fActive, setFActive]   = useState(true);

  // Change-password fields
  const [cpCurrent, setCpCurrent] = useState('');
  const [cpNew, setCpNew]         = useState('');

  const load = async () => {
    try { setUsers(await api.auth.listUsers()); } catch {}
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setFEmail(''); setFName(''); setFRole('secretaria'); setFPass('');
    setError(''); setEditing(null); setMode('new');
  };
  const openEdit = (u: AuthUser) => {
    setFName(u.name); setFRole(u.role); setFPass(''); setFActive(true); // active field from list
    setError(''); setEditing(u); setMode('edit');
  };

  const handleCreate = async () => {
    if (!fEmail || !fName || !fPass) { setError('Tutti i campi sono obbligatori'); return; }
    setSaving(true); setError('');
    try {
      await api.auth.createUser({ email: fEmail, name: fName, role: fRole, password: fPass });
      await load();
      setMode('list');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Errore creazione utente');
    } finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setSaving(true); setError('');
    try {
      const data: { name?: string; role?: UserRole; password?: string } = { name: fName, role: fRole };
      if (fPass) data.password = fPass;
      await api.auth.updateUser(editing.id, data);
      await load();
      setMode('list');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Errore aggiornamento');
    } finally { setSaving(false); }
  };

  const handleDelete = async (u: AuthUser) => {
    if (!window.confirm(`Eliminare l'utente ${u.name}?`)) return;
    try {
      await api.auth.deleteUser(u.id);
      await load();
    } catch {}
  };

  const handleChangePw = async () => {
    if (!cpCurrent || !cpNew) { setError('Compila entrambi i campi'); return; }
    setSaving(true); setError('');
    try {
      await api.auth.changePassword(cpCurrent, cpNew);
      setMode('list'); setCpCurrent(''); setCpNew('');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Errore cambio password');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">
            {mode === 'list'      && 'Gestione Utenti'}
            {mode === 'new'       && 'Nuovo Utente'}
            {mode === 'edit'      && `Modifica: ${editing?.name}`}
            {mode === 'change-pw' && 'Cambia Password'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-3">
          {error && <p className="text-xs text-red-600">{error}</p>}

          {/* ── LIST ── */}
          {mode === 'list' && (
            <>
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setError(''); setCpCurrent(''); setCpNew(''); setMode('change-pw'); }}
                  className="flex items-center gap-1 text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-50">
                  <KeyRound size={12} /> Cambia mia password
                </button>
                <button onClick={openNew}
                  className="flex items-center gap-1 text-xs bg-brand-600 text-white rounded px-2 py-1 hover:bg-brand-700">
                  <Plus size={12} /> Novo utente
                </button>
              </div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-1 text-left font-semibold">Nome</th>
                    <th className="px-2 py-1 text-left font-semibold">E-mail</th>
                    <th className="px-2 py-1 text-left font-semibold">Ruolo</th>
                    <th className="px-2 py-1 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t border-gray-100">
                      <td className="px-2 py-1.5">{u.name}</td>
                      <td className="px-2 py-1.5 text-gray-500">{u.email}</td>
                      <td className="px-2 py-1.5">
                        <span className="bg-gray-100 rounded px-1.5 py-0.5">{ROLE_LABELS[u.role]}</span>
                      </td>
                      <td className="px-2 py-1.5 flex gap-1 justify-end">
                        <button onClick={() => openEdit(u)} className="text-gray-400 hover:text-brand-600">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(u)} className="text-gray-400 hover:text-red-600">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* ── NEW ── */}
          {mode === 'new' && (
            <div className="flex flex-col gap-2">
              <label className="flex flex-col gap-0.5 text-xs font-medium text-gray-600">
                E-mail
                <input type="email" className={inputCls} value={fEmail} onChange={e => setFEmail(e.target.value)} />
              </label>
              <label className="flex flex-col gap-0.5 text-xs font-medium text-gray-600">
                Nome
                <input type="text" className={inputCls} value={fName} onChange={e => setFName(e.target.value)} />
              </label>
              <label className="flex flex-col gap-0.5 text-xs font-medium text-gray-600">
                Ruolo
                <select className={inputCls} value={fRole} onChange={e => setFRole(e.target.value as UserRole)}>
                  <option value="admin">Admin</option>
                  <option value="coordenadora">Coordenadora</option>
                  <option value="secretaria">Secretaria</option>
                </select>
              </label>
              <label className="flex flex-col gap-0.5 text-xs font-medium text-gray-600">
                Password
                <input type="password" className={inputCls} value={fPass} onChange={e => setFPass(e.target.value)} placeholder="min 6 caratteri" />
              </label>
            </div>
          )}

          {/* ── EDIT ── */}
          {mode === 'edit' && (
            <div className="flex flex-col gap-2">
              <label className="flex flex-col gap-0.5 text-xs font-medium text-gray-600">
                Nome
                <input type="text" className={inputCls} value={fName} onChange={e => setFName(e.target.value)} />
              </label>
              <label className="flex flex-col gap-0.5 text-xs font-medium text-gray-600">
                Ruolo
                <select className={inputCls} value={fRole} onChange={e => setFRole(e.target.value as UserRole)}>
                  <option value="admin">Admin</option>
                  <option value="coordenadora">Coordenadora</option>
                  <option value="secretaria">Secretaria</option>
                </select>
              </label>
              <label className="flex flex-col gap-0.5 text-xs font-medium text-gray-600">
                Nuova password <span className="text-gray-400 font-normal">(lascia vuoto per non cambiare)</span>
                <input type="password" className={inputCls} value={fPass} onChange={e => setFPass(e.target.value)} />
              </label>
            </div>
          )}

          {/* ── CHANGE PASSWORD ── */}
          {mode === 'change-pw' && (
            <div className="flex flex-col gap-2">
              <label className="flex flex-col gap-0.5 text-xs font-medium text-gray-600">
                Password attuale
                <input type="password" className={inputCls} value={cpCurrent} onChange={e => setCpCurrent(e.target.value)} />
              </label>
              <label className="flex flex-col gap-0.5 text-xs font-medium text-gray-600">
                Nuova password
                <input type="password" className={inputCls} value={cpNew} onChange={e => setCpNew(e.target.value)} placeholder="min 6 caratteri" />
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        {mode !== 'list' && (
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200">
            <button onClick={() => { setMode('list'); setError(''); }}
              className="text-sm border border-gray-300 rounded px-4 py-1.5 hover:bg-gray-50">
              Annulla
            </button>
            <button
              disabled={saving}
              onClick={mode === 'new' ? handleCreate : mode === 'edit' ? handleUpdate : handleChangePw}
              className="text-sm bg-brand-600 text-white rounded px-4 py-1.5 hover:bg-brand-700 disabled:opacity-50">
              {saving ? 'Salvataggio…' : 'Salva'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
