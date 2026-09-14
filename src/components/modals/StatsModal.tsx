import React, { useEffect, useState } from 'react';
import { X, BarChart2, CheckCircle2, Clock, FileText, StickyNote, Table, Code, Database, Globe } from 'lucide-react';
import { NotebookStats } from '../../types';
import { api } from '../../services/api';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<NotebookStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getStats()
        .then(data => setStats(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Estatísticas do Caderno</h3>
              <p className="text-xs text-slate-400">Métricas de estudo e banco de dados SQLite</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium">
            Carregando estatísticas...
          </div>
        ) : stats ? (
          <div className="space-y-4">
            {/* Main Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-blue-50/60 border border-blue-100 p-3 rounded-2xl text-center">
                <FileText className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <span className="text-xl font-black text-blue-900 block">{stats.totalNotes}</span>
                <span className="text-[11px] font-semibold text-blue-700">Anotações</span>
              </div>

              <div className="bg-amber-50/60 border border-amber-100 p-3 rounded-2xl text-center">
                <StickyNote className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                <span className="text-xl font-black text-amber-900 block">{stats.totalPostits}</span>
                <span className="text-[11px] font-semibold text-amber-700">Post-its</span>
              </div>

              <div className="bg-indigo-50/60 border border-indigo-100 p-3 rounded-2xl text-center">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                <span className="text-xl font-black text-indigo-900 block">{stats.totalTasks}</span>
                <span className="text-[11px] font-semibold text-indigo-700">Tarefas</span>
              </div>

              <div className="bg-purple-50/60 border border-purple-100 p-3 rounded-2xl text-center">
                <Code className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                <span className="text-xl font-black text-purple-900 block">{stats.totalCodes}</span>
                <span className="text-[11px] font-semibold text-purple-700">Códigos</span>
              </div>
            </div>

            {/* Task Breakdown */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center justify-between">
                <span>Progresso de Tarefas</span>
                <span className="text-emerald-600 font-bold">
                  {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}% concluído
                </span>
              </h4>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex mb-3">
                <div 
                  className="bg-emerald-500 h-full transition-all"
                  style={{ width: `${stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {stats.completedTasks} Concluídas
                </span>
                <span className="flex items-center gap-1.5 text-amber-600">
                  <Clock className="w-3.5 h-3.5" /> {stats.pendingTasks} Pendentes
                </span>
              </div>
            </div>

            {/* General App Info */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">MATÉRIAS</span>
                <span className="text-sm font-bold text-slate-800">{stats.totalSubjects}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">TABELAS</span>
                <span className="text-sm font-bold text-slate-800">{stats.totalTables}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">MEUS APPS</span>
                <span className="text-sm font-bold text-slate-800">{stats.totalApps}</span>
              </div>
            </div>

            {/* Database Badge */}
            <div className="p-3 bg-amber-50 text-amber-900 rounded-xl border border-amber-200 text-xs font-medium space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <Database className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Banco de Dados: <strong>Firebase Firestore</strong> (Nuvem Google)</span>
              </div>
              <p className="text-[11px] text-amber-700 pl-6">
                Sincronização em tempo real nas coleções: <code>subjects</code>, <code>notebook_elements</code> e <code>my_apps</code>.
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
