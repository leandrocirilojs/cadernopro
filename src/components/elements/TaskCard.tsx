import React, { useState } from 'react';
import { GripVertical, X, Check, Clock, AlertCircle } from 'lucide-react';
import { NotebookElement, PriorityLevel } from '../../types';

interface TaskCardProps {
  element: NotebookElement;
  onUpdate: (id: string, data: Partial<NotebookElement>) => void;
  onDelete: (id: string) => void;
  isDraggable?: boolean;
  onMouseDownDrag?: (e: any) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  element,
  onUpdate,
  onDelete,
  isDraggable = true,
  onMouseDownDrag
}) => {
  const isDone = Boolean(element.done);
  const [text, setText] = useState(element.content || '');

  const priorityColors: Record<PriorityLevel, { bg: string; text: string; label: string }> = {
    baixa: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Baixa' },
    media: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Média' },
    alta: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Alta' },
    urgente: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Urgente' }
  };

  const currentPriority = element.priority || 'media';

  const cyclePriority = () => {
    const cycle: PriorityLevel[] = ['baixa', 'media', 'alta', 'urgente'];
    const nextIdx = (cycle.indexOf(currentPriority) + 1) % cycle.length;
    onUpdate(element.id, { priority: cycle[nextIdx] });
  };

  const handleToggleDone = () => {
    onUpdate(element.id, { done: isDone ? 0 : 1 });
  };

  const handleBlurText = () => {
    onUpdate(element.id, { content: text });
  };

  return (
    <div 
      id={`task-card-${element.id}`}
      className={`bg-white border rounded-2xl p-3.5 shadow-sm flex flex-col transition-all ${
        isDone 
          ? 'border-emerald-200 bg-emerald-50/20' 
          : 'border-slate-200 hover:border-slate-300'
      }`}
      style={{ width: isDraggable ? `${element.width || 340}px` : '100%' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <div 
          className={`flex items-center gap-1.5 text-xs font-semibold text-slate-500 select-none touch-none py-1 px-1 rounded-lg active:bg-slate-100 ${
            isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          style={{ touchAction: 'none' }}
          onPointerDown={isDraggable ? onMouseDownDrag : undefined}
          onTouchStart={isDraggable ? onMouseDownDrag : undefined}
          onMouseDown={isDraggable ? onMouseDownDrag : undefined}
          title={isDraggable ? "Arraste para mover no quadro (toque e arraste no celular)" : undefined}
        >
          {isDraggable && <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />}
          <span className="text-indigo-600 font-bold">☑️ Tarefa</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Priority Pill */}
          <button
            type="button"
            onClick={cyclePriority}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition hover:opacity-80 ${
              priorityColors[currentPriority]?.bg
            } ${priorityColors[currentPriority]?.text}`}
            title="Clique para alterar prioridade"
          >
            {priorityColors[currentPriority]?.label}
          </button>

          <button
            type="button"
            onClick={() => onDelete(element.id)}
            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
            title="Excluir tarefa"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Task Body */}
      <div className="flex items-start gap-2.5 my-1">
        <button
          type="button"
          onClick={handleToggleDone}
          className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center transition shrink-0 ${
            isDone 
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs' 
              : 'border-slate-300 hover:border-indigo-500 bg-white'
          }`}
          title={isDone ? 'Marcar como pendente' : 'Concluir tarefa'}
        >
          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlurText}
          placeholder="Descreva a tarefa de estudos..."
          className={`w-full text-xs font-medium resize-none bg-transparent outline-none leading-relaxed transition ${
            isDone ? 'line-through text-slate-400' : 'text-slate-800'
          }`}
        />
      </div>

      {/* Footer */}
      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          {element.date}
        </span>
        <span className={isDone ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
          {isDone ? 'Concluída ✓' : 'Pendente'}
        </span>
      </div>
    </div>
  );
};
