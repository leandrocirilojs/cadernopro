import React, { useState } from 'react';
import { GripVertical, X, Copy, Check, Code as CodeIcon, Terminal } from 'lucide-react';
import { NotebookElement } from '../../types';

interface CodeCardProps {
  element: NotebookElement;
  onUpdate: (id: string, data: Partial<NotebookElement>) => void;
  onDelete: (id: string) => void;
  isDraggable?: boolean;
  onMouseDownDrag?: (e: any) => void;
}

const LANGUAGES = [
  { id: 'python', name: 'Python' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'sql', name: 'SQL (PostgreSQL/SQLite)' },
  { id: 'java', name: 'Java' },
  { id: 'cpp', name: 'C++' },
  { id: 'html', name: 'HTML / CSS' },
  { id: 'bash', name: 'Bash / Linux' }
];

export const CodeCard: React.FC<CodeCardProps> = ({
  element,
  onUpdate,
  onDelete,
  isDraggable = true,
  onMouseDownDrag
}) => {
  const [code, setCode] = useState(element.content || '');
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState(element.title || 'Snippet de Código');

  const meta = element.meta_json ? JSON.parse(element.meta_json) : { language: 'python' };
  const currentLang = meta.language || 'python';

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLanguageChange = (lang: string) => {
    onUpdate(element.id, {
      meta_json: JSON.stringify({ ...meta, language: lang })
    });
  };

  const handleBlur = () => {
    onUpdate(element.id, { content: code, title });
  };

  return (
    <div 
      id={`code-card-${element.id}`}
      className="bg-slate-900 border border-slate-700 rounded-2xl p-3.5 shadow-lg flex flex-col text-slate-100 transition-all"
      style={{ width: isDraggable ? `${element.width || 440}px` : '100%' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div 
          className={`flex items-center gap-1.5 text-xs font-semibold text-slate-400 select-none touch-none py-1 px-1 rounded-lg active:bg-slate-800 ${
            isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          style={{ touchAction: 'none' }}
          onPointerDown={isDraggable ? onMouseDownDrag : undefined}
          onTouchStart={isDraggable ? onMouseDownDrag : undefined}
          onMouseDown={isDraggable ? onMouseDownDrag : undefined}
          title={isDraggable ? "Arraste para mover no quadro (toque e arraste no celular)" : undefined}
        >
          {isDraggable && <GripVertical className="w-4 h-4 text-slate-500 shrink-0" />}
          <span className="text-purple-400 font-bold flex items-center gap-1">
            <CodeIcon className="w-3.5 h-3.5" /> Código ADS
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <select
            value={currentLang}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="text-[11px] bg-slate-800 text-purple-300 font-semibold border border-slate-700 rounded px-1.5 py-0.5 outline-none cursor-pointer"
          >
            {LANGUAGES.map(l => (
              <option key={l.id} value={l.id} className="bg-slate-900 text-slate-200">
                {l.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1 text-slate-400 hover:text-white rounded transition"
            title="Copiar código"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => onDelete(element.id)}
            className="p-1 text-slate-400 hover:text-rose-400 rounded transition"
            title="Excluir bloco de código"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Snippet Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleBlur}
        placeholder="Título do algoritmo ou script..."
        className="w-full text-xs font-bold text-slate-200 bg-transparent mb-2 px-1 outline-none border-b border-transparent focus:border-purple-500"
      />

      {/* Code Textarea */}
      <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
        <textarea
          rows={7}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onBlur={handleBlur}
          placeholder="// Cole ou escreva seu código aqui..."
          className="w-full p-2.5 font-mono text-xs text-purple-200 bg-transparent resize-y outline-none leading-relaxed selection:bg-purple-900 selection:text-white"
          spellCheck={false}
        />
      </div>

      {/* Footer */}
      <div className="mt-2 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-medium">
        <span>{element.date}</span>
        <span className="flex items-center gap-1 text-slate-400">
          <Terminal className="w-3 h-3 text-purple-400" />
          Pronto para compilar/executar
        </span>
      </div>
    </div>
  );
};
