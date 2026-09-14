import React, { useState } from 'react';
import { Check, Plus, Trash2, Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { NotebookElement, PriorityLevel } from '../../types';

interface TasksViewProps {
  tasks: NotebookElement[];
  onUpdateElement: (id: string, data: Partial<NotebookElement>) => void;
  onDeleteElement: (id: string) => void;
  onAddNewElement: (type: 'task', extraData?: Partial<NotebookElement>) => void;
  activeSubjectName: string;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onUpdateElement,
  onDeleteElement,
  onAddNewElement,
  activeSubjectName
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<PriorityLevel>('media');

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return !t.done;
    if (filter === 'completed') return Boolean(t.done);
    return true;
  });

  const completedCount = tasks.filter(t => t.done).length;
  const pendingCount = tasks.length - completedCount;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    onAddNewElement('task', {
      content: newTaskText.trim(),
      priority: newTaskPriority,
      done: 0
    });
    setNewTaskText('');
  };

  const priorityLabels: Record<PriorityLevel, { text: string; bg: string; color: string }> = {
    baixa: { text: 'Baixa', bg: 'bg-slate-100', color: 'text-slate-600' },
    media: { text: 'Média', bg: 'bg-blue-100', color: 'text-blue-700' },
    alta: { text: 'Alta', bg: 'bg-amber-100', color: 'text-amber-800' },
    urgente: { text: 'Urgente', bg: 'bg-rose-100', color: 'text-rose-700' }
  };

  return (
    <div id="tasks-view-container" className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full">
      {/* Header & Stats */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Tarefas de {activeSubjectName}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe entregas, trabalhos práticos e prazos acadêmicos
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-2">
          <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs text-center">
            <span className="text-xs text-slate-400 block font-medium">Pendentes</span>
            <span className="text-sm font-bold text-amber-600">{pendingCount}</span>
          </div>
          <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs text-center">
            <span className="text-xs text-slate-400 block font-medium">Concluídas</span>
            <span className="text-sm font-bold text-emerald-600">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* New Task Bar */}
      <form onSubmit={handleCreate} className="mb-6 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Adicionar nova tarefa (ex: Entregar trabalho de UML)..."
          className="flex-1 text-sm bg-transparent outline-none px-2 text-slate-800"
        />

        <select
          value={newTaskPriority}
          onChange={(e) => setNewTaskPriority(e.target.value as PriorityLevel)}
          className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1.5 outline-none font-medium"
        >
          <option value="baixa">Prioridade Baixa</option>
          <option value="media">Prioridade Média</option>
          <option value="alta">Prioridade Alta</option>
          <option value="urgente">Urgente 🔥</option>
        </select>

        <button
          type="submit"
          className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </button>
      </form>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 mb-4 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
            filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Todas ({tasks.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
            filter === 'pending' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Pendentes ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
            filter === 'completed' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Concluídas ({completedCount})
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Nenhuma tarefa encontrada neste filtro</p>
            <p className="text-xs text-slate-400 mt-1">Crie tarefas para gerenciar suas entregas e estudos</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = Boolean(task.done);
            const prio = task.priority || 'media';
            return (
              <div
                key={task.id}
                className={`bg-white border rounded-xl p-3.5 flex items-center justify-between gap-3 transition shadow-xs ${
                  isDone ? 'border-emerald-200 bg-emerald-50/20 opacity-75' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => onUpdateElement(task.id, { done: isDone ? 0 : 1 })}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                      isDone 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'border-slate-300 hover:border-indigo-500 bg-white'
                    }`}
                  >
                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium leading-normal ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {task.content || 'Tarefa sem descrição'}
                    </p>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> Criado em: {task.full_date || task.date}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityLabels[prio]?.bg} ${priorityLabels[prio]?.color}`}>
                    {priorityLabels[prio]?.text}
                  </span>

                  <button
                    onClick={() => onDeleteElement(task.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition hover:bg-slate-100"
                    title="Excluir tarefa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
