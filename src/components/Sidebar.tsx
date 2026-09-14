import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  StickyNote, 
  Table as TableIcon, 
  CheckSquare, 
  Code, 
  Database, 
  Download, 
  BarChart2, 
  Sparkles,
  X
} from 'lucide-react';
import { Subject, CalendarActivity, ElementType } from '../types';

interface SidebarProps {
  subjects: Subject[];
  activeSubjectId: string;
  onSelectSubject: (id: string) => void;
  onOpenNewSubjectModal: () => void;
  onEditSubject: (subject: Subject) => void;
  onDeleteSubject: (subject: Subject) => void;
  onQuickInsert: (type: ElementType) => void;
  selectedDateFilter: string | null;
  onSelectDateFilter: (date: string | null) => void;
  calendarActivity: CalendarActivity[];
  onOpenStatsModal: () => void;
  onOpenExportModal: () => void;
  onOpenAITutor: () => void;
  dbStatus: 'connected' | 'syncing' | 'error';
  elementCountsBySubject: Record<string, number>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  subjects,
  activeSubjectId,
  onSelectSubject,
  onOpenNewSubjectModal,
  onEditSubject,
  onDeleteSubject,
  onQuickInsert,
  selectedDateFilter,
  onSelectDateFilter,
  calendarActivity,
  onOpenStatsModal,
  onOpenExportModal,
  onOpenAITutor,
  dbStatus,
  elementCountsBySubject,
}) => {
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Date formatting in Portuguese (PT-BR)
  const now = new Date();
  const dayNames = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const todayHeaderLabel = `${dayNames[now.getDay()]}, ${now.getDate()} De ${monthNames[now.getMonth()]}`;

  // Calendar calculations
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calYear, calMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calYear, calMonth + 1, 1));
  };

  // Activity map
  const activityMap = React.useMemo(() => {
    const map = new Map<string, number>();
    calendarActivity.forEach(a => map.set(a.date, a.count));
    return map;
  }, [calendarActivity]);

  return (
    <aside 
      id="app-sidebar" 
      className="w-72 md:w-80 bg-white border-r border-slate-200 flex flex-col h-screen shrink-0 overflow-y-auto select-none"
    >
      {/* Top Header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold tracking-tight text-blue-600 flex items-center gap-2">
            <span>Agenda</span>
            <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">ADS PRO</span>
          </h1>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50/80 border border-amber-200 text-amber-800 text-[10px] font-semibold" title={`Firebase Firestore: ${dbStatus === 'connected' ? 'Conectado e Sincronizado' : dbStatus}`}>
            <span className={`inline-block w-2 h-2 rounded-full ${
              dbStatus === 'connected' ? 'bg-emerald-500 ring-2 ring-emerald-200' :
              dbStatus === 'syncing' ? 'bg-amber-400 animate-pulse' : 'bg-rose-500'
            }`} />
            <span>Firebase</span>
          </div>
        </div>
        <p className="text-xs font-medium text-slate-500 capitalize">{todayHeaderLabel}</p>
      </div>

      {/* Calendar Section */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <CalendarIcon className="w-3 h-3" /> Calendário
          </span>
          {selectedDateFilter && (
            <button
              onClick={() => onSelectDateFilter(null)}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5"
              title="Limpar filtro de data"
            >
              <X className="w-3 h-3" /> Limpar
            </button>
          )}
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-2">
          <button
            id="prev-month-btn"
            onClick={handlePrevMonth}
            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-slate-700">
            {monthNames[calMonth]} {calYear}
          </span>
          <button
            id="next-month-btn"
            onClick={handleNextMonth}
            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400 mb-1">
          <span>D</span>
          <span>S</span>
          <span>T</span>
          <span>Q</span>
          <span>Q</span>
          <span>S</span>
          <span>S</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-7 w-7" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${String(dayNum).padStart(2, '0')}/${String(calMonth + 1).padStart(2, '0')}/${calYear}`;
            const isToday = 
              dayNum === now.getDate() && 
              calMonth === now.getMonth() && 
              calYear === now.getFullYear();
            const isSelected = selectedDateFilter === dateStr;
            const activityCount = activityMap.get(dateStr) || 0;

            return (
              <button
                key={`day-${dayNum}`}
                id={`cal-day-${dayNum}`}
                onClick={() => onSelectDateFilter(isSelected ? null : dateStr)}
                className={`h-7 w-7 rounded-full flex flex-col items-center justify-center mx-auto relative transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : isToday
                    ? 'bg-blue-100 text-blue-700 font-bold hover:bg-blue-200'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                title={`${dateStr}${activityCount > 0 ? ` (${activityCount} itens)` : ''}`}
              >
                <span>{dayNum}</span>
                {activityCount > 0 && !isSelected && (
                  <span className="w-1 h-1 rounded-full bg-blue-500 absolute bottom-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {selectedDateFilter && (
          <div className="mt-2 text-center">
            <span className="text-[11px] bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-md border border-blue-200">
              Filtrando: {selectedDateFilter}
            </span>
          </div>
        )}
      </div>

      {/* Quick Inserter */}
      <div className="p-4 border-b border-slate-100">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
          Inserir
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            id="insert-postit-btn"
            onClick={() => onQuickInsert('postit')}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-slate-50 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition"
          >
            <StickyNote className="w-3.5 h-3.5 text-amber-500" />
            <span>Post-it</span>
          </button>
          <button
            id="insert-note-btn"
            onClick={() => onQuickInsert('note')}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition"
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>Anotação</span>
          </button>
          <button
            id="insert-table-btn"
            onClick={() => onQuickInsert('table')}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition"
          >
            <TableIcon className="w-3.5 h-3.5 text-emerald-500" />
            <span>Tabela</span>
          </button>
          <button
            id="insert-task-btn"
            onClick={() => onQuickInsert('task')}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition"
          >
            <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
            <span>Tarefa</span>
          </button>
        </div>
        <button
          id="insert-code-btn"
          onClick={() => onQuickInsert('code')}
          className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-50 hover:bg-purple-50 hover:text-purple-800 hover:border-purple-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition"
        >
          <Code className="w-3.5 h-3.5 text-purple-600" />
          <span>Código ADS (Python / JS / SQL)</span>
        </button>
      </div>

      {/* Subjects List */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Matérias
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {subjects.length}
          </span>
        </div>

        <ul id="subject-list" className="space-y-1">
          {subjects.map((subj) => {
            const isActive = subj.id === activeSubjectId;
            const count = elementCountsBySubject[subj.id] || 0;
            return (
              <li
                key={subj.id}
                id={`subject-item-${subj.id}`}
                onClick={() => onSelectSubject(subj.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-900 border border-blue-200 shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: subj.color }}
                  />
                  <span className="truncate">{subj.name}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    isActive ? 'bg-blue-200/70 text-blue-800' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                  }`}>
                    {count}
                  </span>

                  {/* Actions visible on hover */}
                  <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditSubject(subj);
                      }}
                      className="p-1 hover:text-blue-600 hover:bg-white rounded transition"
                      title="Editar matéria"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    {subjects.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSubject(subj);
                        }}
                        className="p-1 hover:text-rose-600 hover:bg-white rounded transition"
                        title="Excluir matéria"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <button
          id="add-subject-btn"
          onClick={onOpenNewSubjectModal}
          className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-slate-600 hover:text-blue-700 text-xs font-medium rounded-xl transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Nova matéria</span>
        </button>
      </div>

      {/* Footer Navigation & Extra Tools */}
      <div className="p-3 bg-slate-50/80 border-t border-slate-200 space-y-1">
        <button
          onClick={onOpenAITutor}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-purple-700 hover:bg-purple-100/70 transition"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Tutor IA (ADS)
          </span>
          <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded font-semibold">Gemini</span>
        </button>

        <div className="grid grid-cols-2 gap-1 pt-1">
          <button
            onClick={onOpenStatsModal}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200 transition"
          >
            <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Métricas</span>
          </button>
          <button
            onClick={onOpenExportModal}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200 transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Backup DB</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
