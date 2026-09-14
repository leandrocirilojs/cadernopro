import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, X, Pin, Copy, Check, Sparkles } from 'lucide-react';
import { NotebookElement } from '../../types';
import { FormatToolbar } from '../FormatToolbar';

interface NoteCardProps {
  element: NotebookElement;
  onUpdate: (id: string, data: Partial<NotebookElement>) => void;
  onDelete: (id: string) => void;
  isDraggable?: boolean;
  onMouseDownDrag?: (e: React.MouseEvent) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  element,
  onUpdate,
  onDelete,
  isDraggable = true,
  onMouseDownDrag
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(element.title || 'Anotação sem título');
  const contentRef = useRef<HTMLDivElement>(null);

  // Sync content ref once
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== (element.content || '')) {
      contentRef.current.innerHTML = element.content || '';
    }
  }, [element.id]);

  const handleFormatCommand = (command: string, value: string = '') => {
    if (contentRef.current) {
      contentRef.current.focus();
      document.execCommand(command, false, value);
      onUpdate(element.id, { content: contentRef.current.innerHTML });
    }
  };

  const handleBlurContent = () => {
    if (contentRef.current) {
      onUpdate(element.id, { content: contentRef.current.innerHTML });
    }
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    onUpdate(element.id, { title });
  };

  const handleCopyNote = () => {
    const textToCopy = `${title}\n\n${contentRef.current?.innerText || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      id={`note-card-${element.id}`}
      className={`bg-white border rounded-2xl p-4 shadow-sm flex flex-col transition-all group ${
        element.pinned ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
      }`}
      style={{ width: isDraggable ? `${element.width || 420}px` : '100%' }}
    >
      {/* Header with Drag Handle & Actions */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
        <div 
          className={`flex items-center gap-1.5 text-xs font-semibold text-slate-500 ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
          onMouseDown={isDraggable ? onMouseDownDrag : undefined}
          title={isDraggable ? "Arraste para mover no quadro livre" : undefined}
        >
          {isDraggable && <GripVertical className="w-4 h-4 text-slate-400" />}
          <span className="text-blue-600 font-bold">📝 Anotação</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopyNote}
            className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
            title="Copiar anotação"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => onUpdate(element.id, { pinned: element.pinned ? 0 : 1 })}
            className={`p-1 rounded transition ${element.pinned ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-700'}`}
            title={element.pinned ? 'Desafixar anotação' : 'Fixar no topo'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(element.id)}
            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
            title="Excluir anotação"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editable Title */}
      <div className="mb-2">
        {isEditingTitle ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
            autoFocus
            className="w-full text-base font-bold text-blue-600 bg-blue-50/50 px-2 py-1 rounded border border-blue-300 outline-none"
          />
        ) : (
          <h3 
            onClick={() => setIsEditingTitle(true)}
            className="text-base font-bold text-blue-600 hover:bg-slate-50 px-1 py-0.5 rounded cursor-pointer transition leading-snug"
            title="Clique para editar título"
          >
            {title || 'Clique para adicionar título...'}
          </h3>
        )}
      </div>

      {/* Formatting Toolbar */}
      <div className="mb-2.5">
        <FormatToolbar onCommand={handleFormatCommand} showHeadings={true} />
      </div>

      {/* Rich Text Body */}
      <div
        ref={contentRef}
        contentEditable
        onBlur={handleBlurContent}
        data-placeholder="Estudante, digite suas anotações aqui..."
        className="rich-text-content flex-1 min-h-[100px] text-sm text-slate-700 outline-none p-2 rounded-lg bg-slate-50/60 focus:bg-white focus:ring-1 focus:ring-blue-200 border border-transparent focus:border-blue-300 transition overflow-y-auto max-h-[360px]"
      />

      {/* Footer Timestamp */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
        <span>{element.full_date || element.date}</span>
        <span className="text-[10px] text-slate-300">Auto-salvo no banco</span>
      </div>
    </div>
  );
};
