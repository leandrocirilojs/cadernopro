import React from 'react';
import { NotebookElement, ElementType } from '../../types';
import { NoteCard } from '../elements/NoteCard';
import { PostitCard } from '../elements/PostitCard';
import { TableCard } from '../elements/TableCard';
import { TaskCard } from '../elements/TaskCard';
import { CodeCard } from '../elements/CodeCard';
import { Plus, StickyNote, FileText, CheckSquare, Code, Table } from 'lucide-react';

interface GridViewProps {
  elements: NotebookElement[];
  onUpdateElement: (id: string, data: Partial<NotebookElement>) => void;
  onDeleteElement: (id: string) => void;
  onAddNewElement: (type: ElementType) => void;
}

export const GridView: React.FC<GridViewProps> = ({
  elements,
  onUpdateElement,
  onDeleteElement,
  onAddNewElement
}) => {
  return (
    <div id="grid-view-container" className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
      {/* Quick Add Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
          <span>Visualização em Grade Organizada</span>
          <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full">
            {elements.length} itens
          </span>
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddNewElement('note')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition"
          >
            <FileText className="w-3.5 h-3.5" /> + Anotação
          </button>
          <button
            onClick={() => onAddNewElement('postit')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg transition"
          >
            <StickyNote className="w-3.5 h-3.5" /> + Post-it
          </button>
          <button
            onClick={() => onAddNewElement('task')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition"
          >
            <CheckSquare className="w-3.5 h-3.5" /> + Tarefa
          </button>
          <button
            onClick={() => onAddNewElement('code')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition"
          >
            <Code className="w-3.5 h-3.5" /> + Código
          </button>
        </div>
      </div>

      {/* Empty State */}
      {elements.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-3xl mb-3">
            📚
          </div>
          <h3 className="text-base font-bold text-slate-700">Nenhum item encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm text-center mt-1">
            Adicione uma anotação ou post-it para começar a organizar esta matéria.
          </p>
        </div>
      )}

      {/* Grid columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
        {elements.map((el) => {
          return (
            <div key={el.id} className="w-full">
              {el.type === 'note' && (
                <NoteCard
                  element={el}
                  onUpdate={onUpdateElement}
                  onDelete={onDeleteElement}
                  isDraggable={false}
                />
              )}
              {el.type === 'postit' && (
                <PostitCard
                  element={el}
                  onUpdate={onUpdateElement}
                  onDelete={onDeleteElement}
                  isDraggable={false}
                />
              )}
              {el.type === 'table' && (
                <TableCard
                  element={el}
                  onUpdate={onUpdateElement}
                  onDelete={onDeleteElement}
                  isDraggable={false}
                />
              )}
              {el.type === 'task' && (
                <TaskCard
                  element={el}
                  onUpdate={onUpdateElement}
                  onDelete={onDeleteElement}
                  isDraggable={false}
                />
              )}
              {el.type === 'code' && (
                <CodeCard
                  element={el}
                  onUpdate={onUpdateElement}
                  onDelete={onDeleteElement}
                  isDraggable={false}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
