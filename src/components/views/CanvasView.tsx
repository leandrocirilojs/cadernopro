import React, { useState, useRef, useEffect } from 'react';
import { Plus, CheckSquare, Sparkles } from 'lucide-react';
import { NotebookElement, ElementType } from '../../types';
import { NoteCard } from '../elements/NoteCard';
import { PostitCard } from '../elements/PostitCard';
import { TableCard } from '../elements/TableCard';
import { TaskCard } from '../elements/TaskCard';
import { CodeCard } from '../elements/CodeCard';
import { FormatToolbar } from '../FormatToolbar';

interface CanvasViewProps {
  elements: NotebookElement[];
  onUpdateElement: (id: string, data: Partial<NotebookElement>) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onDeleteElement: (id: string) => void;
  onAddNewElement: (type: ElementType, extraData?: Partial<NotebookElement>) => void;
  activeSubjectName: string;
}

export const CanvasView: React.FC<CanvasViewProps> = ({
  elements,
  onUpdateElement,
  onUpdatePosition,
  onDeleteElement,
  onAddNewElement,
  activeSubjectName
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showNewNoteForm, setShowNewNoteForm] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const newNoteContentRef = useRef<HTMLDivElement>(null);

  // Dragging state
  const draggingItem = useRef<{
    id: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    elementRef: HTMLElement | null;
  } | null>(null);

  // Dynamic canvas size calculation
  const [canvasDimensions, setCanvasDimensions] = useState({ minWidth: 1200, minHeight: 1000 });

  useEffect(() => {
    let maxR = 1200;
    let maxB = 900;
    elements.forEach(el => {
      const right = (el.x || 40) + (el.width || 380) + 120;
      const bottom = (el.y || 80) + (el.height || 260) + 120;
      if (right > maxR) maxR = right;
      if (bottom > maxB) maxB = bottom;
    });
    setCanvasDimensions({ minWidth: maxR, minHeight: maxB });
  }, [elements]);

  const handleStartDrag = (e: React.MouseEvent, element: NotebookElement) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).tagName === 'INPUT') return;

    const targetElem = document.getElementById(`canvas-item-${element.id}`);
    if (!targetElem) return;

    draggingItem.current = {
      id: element.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: element.x,
      initialY: element.y,
      elementRef: targetElem
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!draggingItem.current || !draggingItem.current.elementRef) return;
      const dx = moveEvent.clientX - draggingItem.current.startX;
      const dy = moveEvent.clientY - draggingItem.current.startY;
      const newX = Math.max(20, draggingItem.current.initialX + dx);
      const newY = Math.max(20, draggingItem.current.initialY + dy);

      draggingItem.current.elementRef.style.left = `${newX}px`;
      draggingItem.current.elementRef.style.top = `${newY}px`;
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      if (draggingItem.current) {
        const dx = upEvent.clientX - draggingItem.current.startX;
        const dy = upEvent.clientY - draggingItem.current.startY;
        const finalX = Math.max(20, Math.round(draggingItem.current.initialX + dx));
        const finalY = Math.max(20, Math.round(draggingItem.current.initialY + dy));

        onUpdatePosition(draggingItem.current.id, finalX, finalY);
      }
      draggingItem.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleCreateNoteFromForm = (e: React.FormEvent) => {
    e.preventDefault();
    const content = newNoteContentRef.current?.innerHTML || '';
    if (!newNoteTitle.trim() && !content.trim()) return;

    onAddNewElement('note', {
      title: newNoteTitle.trim() || 'Nova Anotação',
      content: content
    });

    setNewNoteTitle('');
    if (newNoteContentRef.current) newNoteContentRef.current.innerHTML = '';
    setShowNewNoteForm(false);
  };

  return (
    <div 
      ref={containerRef}
      id="canvas-scroll-container" 
      className="flex-1 overflow-auto bg-slate-50 relative canvas-grid-bg p-6"
    >
      <div 
        id="note-sheet-canvas"
        className="relative"
        style={{
          minWidth: `${canvasDimensions.minWidth}px`,
          minHeight: `${canvasDimensions.minHeight}px`
        }}
      >
        {/* Top Floating Creation Bar */}
        <div className="sticky top-2 z-20 inline-block mb-6">
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-xs p-1.5 rounded-2xl shadow-md border border-slate-200">
            <button
              id="new-note-toggle-btn"
              onClick={() => setShowNewNoteForm(!showNewNoteForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>{showNewNoteForm ? 'Fechar Formulário' : '+ Nova Anotação'}</span>
            </button>

            <button
              onClick={() => onAddNewElement('postit')}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-xl border border-amber-200 transition"
            >
              + Post-it
            </button>

            <button
              onClick={() => onAddNewElement('task')}
              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-xl border border-indigo-200 transition"
            >
              + Tarefa
            </button>

            <button
              onClick={() => onAddNewElement('code')}
              className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold rounded-xl border border-purple-200 transition"
            >
              + Código
            </button>

            <button
              onClick={() => onAddNewElement('table')}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 transition"
            >
              + Tabela
            </button>
          </div>

          {/* Quick Note Inserter Form */}
          {showNewNoteForm && (
            <form 
              onSubmit={handleCreateNoteFromForm}
              className="mt-3 w-96 md:w-[480px] bg-white border border-slate-200 rounded-2xl p-4 shadow-xl flex flex-col gap-2.5 z-30 animate-in fade-in zoom-in-95 duration-150"
            >
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Criar Nova Anotação no Quadro
              </h4>
              <input
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="Título da anotação (ex: Estruturas de dados em Python)..."
                required
                className="w-full text-sm font-semibold px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg outline-none"
              />
              <FormatToolbar 
                onCommand={(cmd, val) => {
                  if (newNoteContentRef.current) {
                    newNoteContentRef.current.focus();
                    document.execCommand(cmd, false, val);
                  }
                }} 
              />
              <div
                ref={newNoteContentRef}
                contentEditable
                data-placeholder="Escreva o conteúdo aqui... (pode colar texto formatado ou listas)"
                className="rich-text-content min-h-[90px] max-h-[220px] overflow-y-auto p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-400"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewNoteForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-xs"
                >
                  Salvar no Quadro
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Empty State if no elements */}
        {elements.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-white/80 border border-slate-200 shadow-sm flex items-center justify-center text-3xl mb-3">
              📝
            </div>
            <h3 className="text-base font-bold text-slate-700">Nenhum elemento neste quadro</h3>
            <p className="text-xs text-slate-500 max-w-sm text-center mt-1">
              Use a barra flutuante acima ou o menu lateral para inserir Anotações, Post-its, Códigos, Tabelas ou Tarefas.
            </p>
          </div>
        )}

        {/* Canvas Elements */}
        {elements.map((el) => {
          return (
            <div
              key={el.id}
              id={`canvas-item-${el.id}`}
              className="absolute select-text transition-shadow"
              style={{
                left: `${el.x}px`,
                top: `${el.y}px`,
                zIndex: el.pinned ? 15 : 1
              }}
            >
              {el.type === 'note' && (
                <NoteCard
                  element={el}
                  onUpdate={onUpdateElement}
                  onDelete={onDeleteElement}
                  isDraggable={true}
                  onMouseDownDrag={(e) => handleStartDrag(e, el)}
                />
              )}
              {el.type === 'postit' && (
                <PostitCard
                  element={el}
                  onUpdate={onUpdateElement}
                  onDelete={onDeleteElement}
                  isDraggable={true}
                  onMouseDownDrag={(e) => handleStartDrag(e, el)}
                />
              )}
              {el.type === 'table' && (
                <TableCard
                  element={el}
                  onUpdate={onUpdateElement}
                  onDelete={onDeleteElement}
                  isDraggable={true}
                  onMouseDownDrag={(e) => handleStartDrag(e, el)}
                />
              )}
              {el.type === 'task' && (
                <TaskCard
                  element={el}
                  onUpdate={onUpdateElement}
                  onDelete={onDeleteElement}
                  isDraggable={true}
                  onMouseDownDrag={(e) => handleStartDrag(e, el)}
                />
              )}
              {el.type === 'code' && (
                <CodeCard
                  element={el}
                  onUpdate={onUpdateElement}
                  onDelete={onDeleteElement}
                  isDraggable={true}
                  onMouseDownDrag={(e) => handleStartDrag(e, el)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
