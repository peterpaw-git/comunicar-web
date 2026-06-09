import { useState } from 'react';
import { Plus, Trash2, Tag, ChevronDown, ChevronUp, Pencil, Check, X } from 'lucide-react';
import { useStore } from '../store';
import { useT } from '../useT';
import type { SelectionGroup } from '../types';

// ── Inline edit form for an existing group ───────────────────────────────────
function EditRow({
  group,
  onSave,
  onCancel,
}: {
  group: SelectionGroup;
  onSave: (name: string, description: string) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useT();
  const [name, setName] = useState(group.name);
  const [desc, setDesc] = useState(group.description ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await onSave(name.trim(), desc.trim());
    } catch {
      setError(t.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-2 py-2 bg-gray-50 border border-brand-200 rounded space-y-1.5">
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder={t.groupNamePlaceholder}
        className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-brand-500"
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onCancel(); }}
      />
      <textarea
        value={desc}
        onChange={e => setDesc(e.target.value)}
        placeholder={t.groupDescPlaceholder}
        rows={2}
        className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-brand-500 resize-none"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-1 justify-end">
        <button onClick={onCancel}
          className="flex items-center gap-0.5 text-xs border border-gray-300 rounded px-2 py-0.5 text-gray-500 hover:bg-gray-100">
          <X size={11} /> {t.cancel}
        </button>
        <button onClick={handleSave} disabled={saving || !name.trim()}
          className="flex items-center gap-0.5 text-xs bg-brand-600 text-white rounded px-2 py-0.5 hover:bg-brand-700 disabled:opacity-40">
          <Check size={11} /> {t.saveGroup}
        </button>
      </div>
    </div>
  );
}

// ── Group row: collapsed / expanded / editing ────────────────────────────────
function GroupRow({
  group,
  onApply,
  onEdit,
  onDelete,
}: {
  group: SelectionGroup;
  onApply: () => void;
  onEdit: (name: string, description: string) => Promise<void>;
  onDelete: () => void;
}) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <EditRow
        group={group}
        onSave={async (name, desc) => { await onEdit(name, desc); setEditing(false); }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="border border-gray-200 rounded overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 group">
        <button
          className="text-xs text-brand-700 hover:underline text-left flex-1 font-medium truncate"
          onClick={onApply}
          title={t.editGroup}
        >
          {group.name}
        </button>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-gray-400 hover:text-gray-600 shrink-0 p-0.5"
          title={expanded ? t.collapseGroup : t.expandGroup}
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        <button onClick={() => { setExpanded(true); setEditing(true); }}
          className="text-gray-400 hover:text-brand-600 shrink-0 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          title={t.editGroup}>
          <Pencil size={12} />
        </button>
        <button
          onClick={() => { if (window.confirm(t.confirmDeleteGroup(group.name))) onDelete(); }}
          className="text-gray-400 hover:text-red-500 shrink-0 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          title={t.deleteBtn}>
          <Trash2 size={12} />
        </button>
      </div>

      {/* Expanded: full description */}
      {expanded && (
        <div className="px-2 pb-2 pt-1 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 whitespace-pre-wrap">
          {group.description?.trim()
            ? group.description
            : <span className="italic">{t.noDescription}</span>
          }
        </div>
      )}
    </div>
  );
}

// ── Main panel ───────────────────────────────────────────────────────────────
export default function SelectionGroupsPanel() {
  const { selectionGroups, saveSelectionGroup, updateSelectionGroup, removeSelectionGroup, applyGroupFilter, selectedIds } = useStore();
  const t = useT();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [open, setOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      await saveSelectionGroup(name.trim(), desc.trim());
      setName('');
      setDesc('');
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      setSaveError(status === 409 ? t.errorDuplicateGroup : t.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded bg-white">
      {/* Section header */}
      <button
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
        onClick={() => setOpen(o => !o)}>
        <span className="flex items-center gap-2"><Tag size={14} /> {t.selectionGroupsTitle(selectionGroups.length)}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          {/* Create form */}
          <div className="space-y-1 mt-1">
            <div className="flex gap-1">
              <input
                value={name}
                onChange={e => { setName(e.target.value); setSaveError(''); }}
                placeholder={t.groupNamePlaceholder}
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-brand-500"
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
              <button onClick={handleCreate} disabled={saving || !name.trim()}
                className="bg-brand-600 text-white rounded px-2 py-1 text-xs hover:bg-brand-700 disabled:opacity-40 shrink-0">
                <Plus size={12} />
              </button>
            </div>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder={t.groupDescPlaceholder}
              rows={2}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-brand-500 resize-none"
            />
            {saveError && <p className="text-xs text-red-500">{saveError}</p>}
          </div>

          {/* Group list */}
          {selectionGroups.length === 0 && (
            <p className="text-xs text-gray-400 italic">{t.noGroupsSaved}</p>
          )}

          <div className="space-y-1">
            {selectionGroups.map(g => (
              <GroupRow
                key={g.id}
                group={g}
                onApply={() => applyGroupFilter(g)}
                onEdit={(newName, newDesc) => updateSelectionGroup(g.id, newName, newDesc)}
                onDelete={() => removeSelectionGroup(g.id)}
              />
            ))}
          </div>

          {selectedIds.size > 0 && (
            <p className="text-xs text-gray-500">
              {t.selectionHint(selectedIds.size)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
