import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../store';
import { useT } from '../useT';
import type { Contact } from '../types';

interface Props {
  contact?: Contact | null;
  onClose: () => void;
}

const EMPTY: Partial<Contact> = {
  attivo: 'SI', da_fare: 0, fatto: 0,
  responsabile: '', filhos: '', gruppo: '',
  whats_mae: '', pref_int1: '55',
  whats_pai: '', pref_int2: '55',
  email_1: '', email_2: '',
  cpf: '', gruppo2: '', boleto: '', voti: '',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}

const inputCls = 'border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-brand-500';

export default function ContactModal({ contact, onClose }: Props) {
  const { createContact, updateContact, gruppoOptions } = useStore();
  const t = useT();
  const [form, setForm] = useState<Partial<Contact>>(contact ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(contact ?? EMPTY);
    setError('');
  }, [contact]);

  const set = (k: keyof Contact, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.responsabile?.trim()) { setError(t.errorResponsabile); return; }
    setSaving(true);
    setError('');
    try {
      if (contact) {
        await updateContact(contact.id, form);
      } else {
        await createContact(form);
      }
      onClose();
    } catch {
      setError(t.errorSave);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">{contact ? t.editContact : t.newContactTitle}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
          {/* Row 1 */}
          <Field label={t.fieldResponsabile}>
            <input className={inputCls} value={form.responsabile ?? ''} onChange={e => set('responsabile', e.target.value)} />
          </Field>
          <Field label={t.fieldFilhos}>
            <input className={inputCls} value={form.filhos ?? ''} onChange={e => set('filhos', e.target.value)} />
          </Field>

          {/* Row 2 */}
          <Field label={t.fieldGruppo}>
            <input className={inputCls} list="gruppo-options" value={form.gruppo ?? ''} onChange={e => set('gruppo', e.target.value)} />
            <datalist id="gruppo-options">
              {gruppoOptions.map(g => <option key={g} value={g} />)}
            </datalist>
          </Field>
          <Field label={t.fieldStato}>
            <select className={inputCls} value={form.attivo ?? ''} onChange={e => set('attivo', e.target.value || null)}>
              <option value="">—</option>
              <option value="SI">SI</option>
              <option value="FU">FU</option>
            </select>
          </Field>

          {/* Row 3 — WhatsApp */}
          <Field label={t.fieldWaMae}>
            <div className="flex gap-1">
              <input className={`${inputCls} w-16`} value={form.pref_int1 ?? '55'} onChange={e => set('pref_int1', e.target.value)} placeholder="+55" />
              <input className={`${inputCls} flex-1`} value={form.whats_mae ?? ''} onChange={e => set('whats_mae', e.target.value)} placeholder="numero" />
            </div>
          </Field>
          <Field label={t.fieldWaPai}>
            <div className="flex gap-1">
              <input className={`${inputCls} w-16`} value={form.pref_int2 ?? '55'} onChange={e => set('pref_int2', e.target.value)} placeholder="+55" />
              <input className={`${inputCls} flex-1`} value={form.whats_pai ?? ''} onChange={e => set('whats_pai', e.target.value)} placeholder="numero" />
            </div>
          </Field>

          {/* Row 4 — Email */}
          <Field label={t.fieldEmail1}>
            <input type="email" className={inputCls} value={form.email_1 ?? ''} onChange={e => set('email_1', e.target.value)} />
          </Field>
          <Field label={t.fieldEmail2}>
            <input type="email" className={inputCls} value={form.email_2 ?? ''} onChange={e => set('email_2', e.target.value)} />
          </Field>

          {/* Row 5 */}
          <Field label={t.fieldCpf}>
            <input className={inputCls} value={form.cpf ?? ''} onChange={e => set('cpf', e.target.value)} />
          </Field>
          <Field label={t.fieldGruppo2}>
            <input className={inputCls} value={form.gruppo2 ?? ''} onChange={e => set('gruppo2', e.target.value)} />
          </Field>

          {/* Row 6 */}
          <Field label={t.fieldBoleto}>
            <input className={inputCls} value={form.boleto ?? ''} onChange={e => set('boleto', e.target.value)} />
          </Field>
          <Field label={t.fieldNote}>
            <textarea rows={3} className={inputCls}
              style={{ resize: 'vertical', minHeight: '4.5rem' }}
              value={form.voti ?? ''} onChange={e => set('voti', e.target.value)} />
          </Field>

          {/* Checkboxes */}
          <div className="col-span-2 flex gap-6 pt-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300"
                checked={!!form.da_fare} onChange={e => set('da_fare', e.target.checked ? 1 : 0)} />
              {t.fieldDaFare}
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300"
                checked={!!form.fatto} onChange={e => set('fatto', e.target.checked ? 1 : 0)} />
              {t.fieldFatto}
            </label>
          </div>

          {error && <p className="col-span-2 text-xs text-red-600">{error}</p>}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200">
          <button type="button" onClick={onClose} className="text-sm border border-gray-300 rounded px-4 py-1.5 hover:bg-gray-50">
            {t.cancel}
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="text-sm bg-brand-600 text-white rounded px-4 py-1.5 hover:bg-brand-700 disabled:opacity-50">
            {saving ? t.saving : contact ? t.saveChanges : t.createContact}
          </button>
        </div>
      </div>
    </div>
  );
}
