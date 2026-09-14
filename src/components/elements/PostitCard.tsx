import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, X, Palette, Pin } from 'lucide-react';
import { NotebookElement, POSTIT_COLORS } from '../../types';
import { FormatToolbar } from '../FormatToolbar';

interface PostitCardProps {
  element: NotebookElement;
  onUpdate: (id: string, data: Partial<NotebookElement>) => void;
  onDelete: (id: string) => void;
  isDraggable?: boolean;
  onMouseDownDrag?: (e: any) => void;
}

export const PostitCard: React.FC<PostitCardProps> = ({
  element,
  onUpdate,
  onDelete,
  isDraggable = true,
  onMouseDownDrag
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentColorConfig = POSTIT_COLORS.find(c => c.id === element.color) || POSTIT_COLORS[0];

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

  return (
    <div 
      id={`postit-card-${element.id}`}
      className="postit-card rounded-2xl p-4 flex flex-col transition-all relative border"
      style={{
        backgroundColor: currentColorConfig.bg,
        borderColor: currentColorConfig.border,
        color: currentColorConfig.text,
        width: isDraggable ? `${element.width || 320}px` : '100%',
        minHeight: '200px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/10">
        <div 
          className={`flex items-center gap-1.5 text-xs font-bold select-none touch-none py-1 px-1 rounded-lg active:bg-black/10 ${
            isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          style={{ touchAction: 'none' }}
          onPointerDown={isDraggable ? onMouseDownDrag : undefined}
          onTouchStart={isDraggable ? onMouseDownDrag : undefined}
          onMouseDown={isDraggable ? onMouseDownDrag : undefined}
          title={isDraggable ? "Arraste para mover o Post-it (toque e arraste no celular)" : undefined}
        >
          {isDraggable && <GripVertical className="w-3.5 h-3.5 opacity-60 shrink-0" />}
          <span>📌 Post-it</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Color Picker Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1 rounded-md hover:bg-black/10 transition"
              title="Mudar cor do post-it"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {showColorPicker && (
              <div className="absolute right-0 top-7 z-30 bg-white p-2 rounded-xl shadow-xl border border-slate-200 grid grid-cols-4 gap-1.5 w-36">
                {POSTIT_COLORS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onUpdate(element.id, { color: c.id });
                      setShowColorPicker(false);
                    }}
                    className={`w-6 h-6 rounded-lg border transition transform hover:scale-110 ${
                      element.color === c.id ? 'ring-2 ring-blue-500 scale-105' : ''
                    }`}
                    style={{ backgroundColor: c.bg, borderColor: c.border }}
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onUpdate(element.id, { pinned: element.pinned ? 0 : 1 })}
            className={`p-1 rounded transition ${element.pinned ? 'bg-black/15 font-bold' : 'hover:bg-black/10'}`}
            title={element.pinned ? 'Desafixar' : 'Fixar'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(element.id)}
            className="p-1 rounded hover:bg-black/10 transition"
            title="Excluir post-it"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mini Format Toolbar */}
      <div className="mb-2 opacity-90 hover:opacity-100 transition">
        <FormatToolbar onCommand={handleFormatCommand} showHeadings={false} />
      </div>

      {/* Editable Body */}
      <div
        ref={contentRef}
        contentEditable
        onBlur={handleBlurContent}
        data-placeholder="Lembrete rápido..."
        className="flex-1 min-h-[90px] text-sm outline-none leading-relaxed p-1.5 rounded-lg bg-black/5 focus:bg-white/40 transition"
      />

      {/* Footer */}
      <div className="mt-2 pt-1 border-t border-black/5 flex items-center justify-between text-[10px] opacity-60 font-medium">
        <span>{element.date}</span>
        <span>ADS Post-it</span>
      </div>
    </div>
  );
};
