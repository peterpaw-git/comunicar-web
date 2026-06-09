import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import clsx from 'clsx';
import { useT } from '../useT';

interface Props {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}

export default function GroupMultiSelect({ options, value, onChange }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (g: string) => {
    onChange(value.includes(g) ? value.filter(v => v !== g) : [...value, g]);
  };

  const label = value.length === 0
    ? t.allGroups
    : value.length === 1
      ? value[0]
      : t.nGroups(value.length);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={clsx(
          'flex items-center gap-1 border rounded px-2 py-1 text-xs focus:outline-none focus:border-brand-500 min-w-[120px] max-w-[160px] bg-white',
          value.length > 0 ? 'border-brand-400 text-brand-700' : 'border-gray-300 text-gray-700'
        )}
      >
        <span className="flex-1 text-left truncate">{label}</span>
        {value.length > 0 && (
          <span
            onClick={e => { e.stopPropagation(); onChange([]); }}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X size={10} />
          </span>
        )}
        <ChevronDown size={12} className="shrink-0 text-gray-400" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded shadow-lg min-w-[140px] max-h-60 overflow-y-auto">
          {options.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-400">{t.noGroups}</div>
          )}
          {options.map(g => (
            <label key={g} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-xs">
              <input
                type="checkbox"
                className="rounded border-gray-300 accent-brand-600"
                checked={value.includes(g)}
                onChange={() => toggle(g)}
              />
              <span>{g}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
