import { useRef, useState, useEffect } from 'react';
import { Send, Save, FolderOpen, Trash2, Image, X, Minimize2, BarChart2 } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../store';
import { useT } from '../useT';
import SendResults from './SendResults';

const LS_HEIGHT_KEY = 'comunicar-body-height';
import type { Template } from '../types';

type ComposerTab = 'compose' | 'results';

export default function MessageComposer() {
  const { draft, setDraft, templates, saveTemplate, loadTemplate, removeTemplate,
          requestSend, sending, sendProgress, sendResults, selectedIds } = useStore();
  const t = useT();
  const [templateName, setTemplateName] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [composerTab, setComposerTab] = useState<ComposerTab>('compose');
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // null = auto (flex-1 fills available space); number = user manually resized
  const [bodyHeight, setBodyHeight] = useState<number | null>(() => {
    const v = localStorage.getItem(LS_HEIGHT_KEY);
    return v ? Number(v) : null;
  });

  // Auto-switch to results tab when send starts
  useEffect(() => {
    if (sending) setComposerTab('results');
  }, [sending]);

  const handleTextareaMouseUp = () => {
    const el = textareaRef.current;
    if (!el) return;
    const h = el.offsetHeight;
    if (h >= 40) {
      setBodyHeight(h);
      localStorage.setItem(LS_HEIGHT_KEY, String(h));
    }
  };

  const resetBodyHeight = () => {
    setBodyHeight(null);
    localStorage.removeItem(LS_HEIGHT_KEY);
    if (textareaRef.current) textareaRef.current.style.height = '';
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      const base64 = result.split(',')[1];
      setDraft({ imageBase64: base64, imageFileName: file.name, imageMime: file.type });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    await saveTemplate(templateName.trim());
    setTemplateName('');
  };

  const canSend = selectedIds.size > 0 && (draft.body.trim() || draft.title.trim());
  const hasResults = sendResults.length > 0;

  return (
    <div className="flex flex-col h-full bg-white rounded border border-gray-200 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
        {/* WhatsApp */}
        <button
          onClick={() => { setDraft({ type: 'whatsapp' }); setComposerTab('compose'); }}
          className={clsx('px-4 py-2 text-xs font-semibold transition-colors',
            composerTab === 'compose' && draft.type === 'whatsapp'
              ? 'border-b-2 border-brand-600 text-brand-700 bg-white'
              : 'text-gray-500 hover:text-gray-700'
          )}>
          {t.tabWhatsApp}
        </button>
        {/* Email */}
        <button
          onClick={() => { setDraft({ type: 'email' }); setComposerTab('compose'); }}
          className={clsx('px-4 py-2 text-xs font-semibold transition-colors',
            composerTab === 'compose' && draft.type === 'email'
              ? 'border-b-2 border-brand-600 text-brand-700 bg-white'
              : 'text-gray-500 hover:text-gray-700'
          )}>
          {t.tabEmail}
        </button>
        {/* Risultati / Resultados */}
        <button
          onClick={() => setComposerTab('results')}
          className={clsx('px-3 py-2 text-xs font-semibold transition-colors flex items-center gap-1',
            composerTab === 'results'
              ? 'border-b-2 border-brand-600 text-brand-700 bg-white'
              : 'text-gray-500 hover:text-gray-700'
          )}>
          <BarChart2 size={12} />
          {t.tabResults}
          {/* Notification dot when there are results and we're not on results tab */}
          {hasResults && composerTab !== 'results' && (
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 inline-block ml-0.5" />
          )}
        </button>

        <div className="ml-auto flex items-center px-2 gap-1">
          {composerTab === 'compose' && (
            <button onClick={() => setShowTemplates(s => !s)}
              className="text-gray-400 hover:text-brand-600 p-1" title={t.templates}>
              <FolderOpen size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Templates dropdown */}
      {showTemplates && composerTab === 'compose' && (
        <div className="border-b border-gray-200 bg-gray-50 p-2 max-h-40 overflow-y-auto scrollbar-thin shrink-0">
          {templates.length === 0
            ? <p className="text-xs text-gray-400 italic px-1">{t.noTemplates}</p>
            : templates.map((t: Template) => (
              <div key={t.id} className="flex items-center justify-between group hover:bg-white rounded px-2 py-1">
                <button className="text-xs text-brand-700 hover:underline flex-1 text-left" onClick={() => { loadTemplate(t); setShowTemplates(false); }}>
                  {t.name} <span className="text-gray-400">({t.type})</span>
                </button>
                <button onClick={() => removeTemplate(t.id)} className="text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
              </div>
            ))
          }
        </div>
      )}

      {/* ── RESULTS TAB ── */}
      {composerTab === 'results' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <SendResults />
        </div>
      )}

      {/* ── COMPOSE TAB ── */}
      {composerTab === 'compose' && (
        /* When bodyHeight is null: flex layout fills available space naturally.
           When bodyHeight is set: container scrolls to accommodate fixed-height textarea. */
        <div className={clsx(
          'flex flex-col p-3 gap-2',
          bodyHeight ? 'overflow-y-auto flex-1' : 'flex-1 min-h-0 overflow-hidden'
        )}>
          {/* Title */}
          <div className="shrink-0">
            <label className="text-xs font-semibold text-gray-600 block mb-1">{t.labelTitle}</label>
            <input value={draft.title} onChange={e => setDraft({ title: e.target.value })}
              placeholder={t.titlePlaceholder}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-brand-500" />
          </div>

          {/* Body */}
          <div className={clsx('flex flex-col', bodyHeight ? 'shrink-0' : 'flex-1 min-h-0')}>
            <div className="flex items-center justify-between mb-1 shrink-0">
              <label className="text-xs font-semibold text-gray-600">{t.labelBody}</label>
              {bodyHeight !== null && (
                <button onClick={resetBodyHeight} title={t.resetHeight}
                  className="text-gray-300 hover:text-gray-500 transition-colors">
                  <Minimize2 size={11} />
                </button>
              )}
            </div>
            <textarea
              ref={textareaRef}
              value={draft.body}
              onChange={e => setDraft({ body: e.target.value })}
              onMouseUp={handleTextareaMouseUp}
              placeholder={t.bodyPlaceholder}
              style={bodyHeight ? { height: bodyHeight } : undefined}
              className={clsx(
                'border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-brand-500 resize-y w-full',
                bodyHeight ? '' : 'flex-1 min-h-[60px]'
              )}
            />
          </div>

          {/* Image (WA only) */}
          {draft.type === 'whatsapp' && (
            <div className="shrink-0">
              <label className="text-xs font-semibold text-gray-600 block mb-1">{t.labelImage}</label>
              {draft.imageBase64 ? (
                <div className="flex items-center gap-2 bg-brand-50 rounded px-2 py-1.5">
                  <Image size={14} className="text-brand-600" />
                  <span className="text-xs flex-1 truncate">{draft.imageFileName}</span>
                  <button onClick={() => setDraft({ imageBase64: undefined, imageFileName: undefined })}
                    className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className="w-full border border-dashed border-gray-300 rounded px-2 py-2 text-xs text-gray-400 hover:border-brand-400 hover:text-brand-600 flex items-center justify-center gap-1">
                  <Image size={12} /> {t.selectImage}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleImage} />
            </div>
          )}

          {/* Save template */}
          <div className="flex gap-1 shrink-0">
            <input value={templateName} onChange={e => setTemplateName(e.target.value)}
              placeholder={t.saveTemplate}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-brand-500"
              onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()} />
            <button onClick={handleSaveTemplate} disabled={!templateName.trim()}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded px-2 py-1 text-xs disabled:opacity-40 flex items-center gap-1">
              <Save size={12} /> {t.save}
            </button>
          </div>
        </div>
      )}

      {/* Send button — always visible at bottom */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 shrink-0">
        {sending ? (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>{t.sendingProgress}</span>
              <span>{sendProgress.done}/{sendProgress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-brand-600 h-2 rounded-full transition-all"
                style={{ width: `${sendProgress.total ? (sendProgress.done / sendProgress.total) * 100 : 0}%` }} />
            </div>
          </div>
        ) : (
          <button onClick={requestSend} disabled={!canSend}
            className={clsx(
              'w-full py-2 rounded text-sm font-bold flex items-center justify-center gap-2 transition-colors',
              canSend
                ? 'bg-brand-600 hover:bg-brand-700 text-white cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}>
            <Send size={14} />
            {selectedIds.size > 0 ? t.sendBtnTo(selectedIds.size) : t.sendBtn}
          </button>
        )}
      </div>
    </div>
  );
}
