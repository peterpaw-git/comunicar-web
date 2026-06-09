import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  flexRender,
  type ColumnDef, type SortingState, type Updater, type ColumnSizingState,
} from '@tanstack/react-table';
import { useMemo, useEffect, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Pencil } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../store';
import { useT } from '../useT';
import type { Contact } from '../types';

const LS_KEY = 'comunicar-col-sizes';

const ATTIVO_BADGE: Record<string, string> = {
  SI:  'bg-green-100 text-green-800',
  FU:  'bg-blue-100 text-blue-800',
};

function loadSizes(): ColumnSizingState {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}'); } catch { return {}; }
}

interface Props {
  onEdit: (contact: Contact) => void;
}

export default function ContactGrid({ onEdit }: Props) {
  const { contacts, selectedIds, toggleSelect, selectAll, clearSelection, loading,
          sorting, setSorting, setSortedContactIds } = useStore();
  const t = useT();

  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(loadSizes);

  const allSelected = contacts.length > 0 && contacts.every(c => selectedIds.has(c.id));
  const someSelected = !allSelected && contacts.some(c => selectedIds.has(c.id));

  const columns = useMemo<ColumnDef<Contact>[]>(() => [
    {
      id: 'select',
      size: 36, minSize: 36, maxSize: 36, enableResizing: false,
      header: () => (
        <input type="checkbox" className="rounded border-gray-300"
          checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected; }}
          onChange={() => allSelected ? clearSelection() : selectAll()} />
      ),
      cell: ({ row }) => (
        <input type="checkbox" className="rounded border-gray-300"
          checked={selectedIds.has(row.original.id)}
          onChange={() => toggleSelect(row.original.id)} />
      ),
      enableSorting: false,
    },
    { accessorKey: 'attivo', header: t.colStato, size: 56, minSize: 40,
      cell: ({ getValue }) => {
        const v = getValue<string | null>();
        return v ? <span className={clsx('px-1.5 py-0.5 rounded text-xs font-semibold', ATTIVO_BADGE[v] ?? 'bg-gray-100')}>{v}</span> : null;
      }
    },
    { accessorKey: 'da_fare', header: t.colFare, size: 48, minSize: 36,
      cell: ({ getValue }) => getValue() ? <span className="text-brand-600 font-bold">✓</span> : null },
    { accessorKey: 'fatto', header: t.colFatto, size: 48, minSize: 36,
      cell: ({ getValue }) => getValue() ? <span className="text-gray-400">✓</span> : null },
    { accessorKey: 'filhos',       header: t.colAluno,        size: 160, minSize: 60 },
    { accessorKey: 'responsabile', header: t.colResponsabile, size: 200, minSize: 80 },
    { accessorKey: 'gruppo',       header: t.colGruppo,       size: 72,  minSize: 50 },
    { accessorKey: 'whats_mae', header: t.colWaMae, size: 120, minSize: 70,
      cell: ({ row, getValue }) => {
        const n = getValue<string | null>();
        if (!n) return null;
        const full = `${row.original.pref_int1 ?? '55'}${n}`;
        return <a href={`https://wa.me/${full}`} target="_blank" rel="noreferrer"
          className="text-green-700 underline">{n}</a>;
      }
    },
    { accessorKey: 'whats_pai', header: t.colWaPai, size: 120, minSize: 70,
      cell: ({ row, getValue }) => {
        const n = getValue<string | null>();
        if (!n) return null;
        const full = `${row.original.pref_int2 ?? '55'}${n}`;
        return <a href={`https://wa.me/${full}`} target="_blank" rel="noreferrer"
          className="text-green-700 underline">{n}</a>;
      }
    },
    { accessorKey: 'email_1', header: t.colEmail1, size: 200, minSize: 80,
      cell: ({ getValue }) => {
        const v = getValue<string | null>();
        return v ? <a href={`mailto:${v}`} className="text-blue-700 underline truncate block">{v}</a> : null;
      }
    },
    { accessorKey: 'voti', header: t.colNote, size: 120, minSize: 60,
      cell: ({ getValue }) => {
        const v = getValue<string | null>();
        if (!v) return null;
        return (
          <span
            title={v}
            className="block truncate cursor-help"
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {v}
          </span>
        );
      }
    },
    {
      id: 'actions', header: '', size: 36, minSize: 36, maxSize: 36,
      enableSorting: false, enableResizing: false,
      cell: ({ row }) => (
        <button
          onClick={e => { e.stopPropagation(); onEdit(row.original); }}
          className="text-gray-400 hover:text-brand-600 p-0.5 rounded"
          title={t.colEdit}
        >
          <Pencil size={12} />
        </button>
      ),
    },
    { accessorKey: 'progressivo', header: '', size: 0, enableHiding: true, enableResizing: false },
    { accessorKey: 'id',          header: '', size: 0, enableHiding: true, enableResizing: false },
  ], [allSelected, someSelected, selectedIds, selectAll, clearSelection, toggleSelect, onEdit, t]);

  const table = useReactTable({
    data: contacts,
    columns,
    columnResizeMode: 'onChange',
    state: { sorting, columnVisibility: { progressivo: false, id: false }, columnSizing },
    onSortingChange: (updater: Updater<SortingState>) =>
      setSorting(typeof updater === 'function' ? updater(sorting) : updater),
    onColumnSizingChange: (updater: Updater<ColumnSizingState>) => {
      setColumnSizing(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        localStorage.setItem(LS_KEY, JSON.stringify(next));
        return next;
      });
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    setSortedContactIds(table.getRowModel().rows.map(r => r.original.id));
  }, [sorting, contacts]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="overflow-auto scrollbar-thin flex-1 min-h-0">
        <table className="text-xs border-collapse" style={{ width: table.getTotalSize(), minWidth: 900 }}>
          <thead className="sticky top-0 z-10 bg-gray-200">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th key={h.id}
                    style={{ width: h.getSize(), position: 'relative' }}
                    className="px-2 py-1.5 text-left font-semibold border-b border-gray-300 whitespace-nowrap select-none"
                    onClick={h.column.getToggleSortingHandler()}
                  >
                    <span className="flex items-center gap-1 cursor-pointer">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getCanSort() && (
                        h.column.getIsSorted() === 'asc'  ? <ChevronUp size={12} /> :
                        h.column.getIsSorted() === 'desc' ? <ChevronDown size={12} /> :
                        <ChevronsUpDown size={12} className="text-gray-400" />
                      )}
                    </span>
                    {/* Resize handle */}
                    {h.column.getCanResize() && (
                      <div
                        onMouseDown={h.getResizeHandler()}
                        onTouchStart={h.getResizeHandler()}
                        onClick={e => e.stopPropagation()}
                        className={clsx(
                          'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none',
                          'hover:bg-brand-500',
                          h.column.getIsResizing() ? 'bg-brand-500' : 'bg-transparent'
                        )}
                      />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className="text-center py-8 text-gray-400">{t.gridLoading}</td></tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="text-center py-8 text-gray-400">{t.gridEmpty}</td></tr>
            ) : table.getRowModel().rows.map((row, i) => {
              const sel = selectedIds.has(row.original.id);
              return (
                <tr key={row.id}
                  onClick={() => toggleSelect(row.original.id)}
                  onDoubleClick={() => onEdit(row.original)}
                  title={t.rowEditHint}
                  className={clsx(
                    'cursor-pointer border-b border-gray-100',
                    sel ? 'bg-brand-100' : i % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100',
                    row.original.fatto ? 'opacity-60' : ''
                  )}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}
                      className="px-2 py-1 overflow-hidden"
                      style={{ width: cell.column.getSize(), maxWidth: cell.column.getSize() }}
                      onClick={e => { if (cell.column.id !== 'select') return; e.stopPropagation(); }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
