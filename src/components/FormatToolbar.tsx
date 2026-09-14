import React from 'react';
import { Bold, Italic, Strikethrough, Underline, List, ListOrdered, Code, Palette } from 'lucide-react';

interface FormatToolbarProps {
  onCommand: (command: string, value?: string) => void;
  showHeadings?: boolean;
}

const TEXT_COLORS = [
  { name: 'Padrão', hex: '#0f172a' },
  { name: 'Vermelho', hex: '#ef4444' },
  { name: 'Laranja', hex: '#f97316' },
  { name: 'Verde', hex: '#10b981' },
  { name: 'Azul', hex: '#2563eb' },
  { name: 'Roxo', hex: '#9333ea' }
];

export const FormatToolbar: React.FC<FormatToolbarProps> = ({ onCommand, showHeadings = true }) => {
  const handleExecute = (e: React.MouseEvent, cmd: string, val: string = '') => {
    e.preventDefault();
    e.stopPropagation();
    onCommand(cmd, val);
  };

  return (
    <div 
      className="flex flex-wrap items-center gap-1 py-1 px-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs select-none"
      onMouseDown={(e) => e.preventDefault()} // Prevent losing focus from contentEditable
    >
      <button
        type="button"
        onMouseDown={(e) => handleExecute(e, 'bold')}
        className="p-1 rounded hover:bg-slate-200 text-slate-700 font-bold transition"
        title="Negrito (Ctrl+B)"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => handleExecute(e, 'italic')}
        className="p-1 rounded hover:bg-slate-200 text-slate-700 italic transition"
        title="Itálico (Ctrl+I)"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => handleExecute(e, 'strikeThrough')}
        className="p-1 rounded hover:bg-slate-200 text-slate-700 transition"
        title="Tachado"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => handleExecute(e, 'underline')}
        className="p-1 rounded hover:bg-slate-200 text-slate-700 transition"
        title="Sublinhado"
      >
        <Underline className="w-3.5 h-3.5" />
      </button>

      <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />

      {showHeadings && (
        <select
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'p') handleExecute(e as any, 'formatBlock', '<p>');
            else if (val) handleExecute(e as any, 'formatBlock', `<${val}>`);
          }}
          className="text-[11px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 outline-none cursor-pointer"
        >
          <option value="p">Normal</option>
          <option value="h1">Título Grande</option>
          <option value="h2">Subtítulo</option>
        </select>
      )}

      <button
        type="button"
        onMouseDown={(e) => handleExecute(e, 'insertUnorderedList')}
        className="p-1 rounded hover:bg-slate-200 text-slate-700 transition"
        title="Lista com marcadores"
      >
        <List className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => handleExecute(e, 'insertOrderedList')}
        className="p-1 rounded hover:bg-slate-200 text-slate-700 transition"
        title="Lista numerada"
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </button>

      <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />

      {/* Quick Color Dots */}
      <div className="flex items-center gap-1 pl-0.5">
        {TEXT_COLORS.map((c) => (
          <button
            key={c.name}
            type="button"
            onMouseDown={(e) => handleExecute(e, 'foreColor', c.hex)}
            className="w-3 h-3 rounded-full border border-slate-300 hover:scale-125 transition-transform"
            style={{ backgroundColor: c.hex }}
            title={c.name}
          />
        ))}
      </div>
    </div>
  );
};
