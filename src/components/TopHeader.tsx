import React from 'react';
import { 
  Search, 
  X, 
  Menu, 
  LayoutGrid, 
  Move, 
  CheckSquare, 
  Layers, 
  Globe, 
  Printer, 
  Sparkles
} from 'lucide-react';
import { Subject, ViewTab } from '../types';

interface TopHeaderProps {
  currentSubject?: Subject;
  elementCount: number;
  selectedDateFilter: string | null;
  activeView: ViewTab;
  onChangeView: (view: ViewTab) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onToggleMobileSidebar: () => void;
  onOpenAITutor: () => void;
  onPrint: () => void;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentSubject,
  elementCount,
  selectedDateFilter,
  activeView,
  onChangeView,
  searchQuery,
  onSearchChange,
  onToggleMobileSidebar,
  onOpenAITutor,
  onPrint,
  typeFilter,
  onTypeFilterChange
}) => {
  return (
    <header 
      id="app-top-header" 
      className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between gap-3 shrink-0 z-10"
    >
      {/* Left side: Subject title & stats */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
          title="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 truncate">
          {activeView === 'apps' ? (
            <div className="flex items-center gap-2 truncate">
              <span className="text-xl">🚀</span>
              <div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-none">
                  Meus Apps & Projetos
                </h2>
                <span className="text-xs text-slate-400 font-medium">
                  Repositórios e portfólio de desenvolvimento
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                {currentSubject?.color && (
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: currentSubject.color }}
                  />
                )}
                <h2 className="text-base md:text-lg font-bold text-slate-800 tracking-tight truncate">
                  {currentSubject?.name || 'Selecione uma matéria'}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mt-0.5">
                <span>{elementCount} elemento(s)</span>
                {selectedDateFilter && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 font-semibold">Data: {selectedDateFilter}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Live search */}
      <div className="hidden lg:flex items-center flex-1 max-w-xs relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          id="global-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar no caderno..."
          className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-lg outline-none transition"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Right side: View tabs & actions */}
      <div className="flex items-center gap-2">
        {/* Type filter pill (when in notes) */}
        {activeView !== 'apps' && (
          <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium text-slate-600">
            <button
              onClick={() => onTypeFilterChange('all')}
              className={`px-2 py-1 rounded-md transition ${typeFilter === 'all' ? 'bg-white text-slate-800 shadow-xs font-semibold' : 'hover:text-slate-900'}`}
            >
              Todos
            </button>
            <button
              onClick={() => onTypeFilterChange('note')}
              className={`px-2 py-1 rounded-md transition ${typeFilter === 'note' ? 'bg-white text-slate-800 shadow-xs font-semibold' : 'hover:text-slate-900'}`}
            >
              Anotações
            </button>
            <button
              onClick={() => onTypeFilterChange('postit')}
              className={`px-2 py-1 rounded-md transition ${typeFilter === 'postit' ? 'bg-white text-slate-800 shadow-xs font-semibold' : 'hover:text-slate-900'}`}
            >
              Post-its
            </button>
          </div>
        )}

        {/* View Switchers */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          <button
            id="tab-canvas-view"
            onClick={() => onChangeView('canvas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'canvas'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'hover:text-slate-900 hover:bg-slate-200/50'
            }`}
            title="Quadro Livre com movimentação livre e arrasto"
          >
            <Move className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Quadro Livre</span>
          </button>

          <button
            id="tab-grid-view"
            onClick={() => onChangeView('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'grid'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'hover:text-slate-900 hover:bg-slate-200/50'
            }`}
            title="Grade organizada e responsiva"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Grade</span>
          </button>

          <button
            id="tab-tasks-view"
            onClick={() => onChangeView('tasks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'tasks'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'hover:text-slate-900 hover:bg-slate-200/50'
            }`}
            title="Gerenciador de Tarefas da matéria"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Tarefas</span>
          </button>

          <button
            id="tab-apps-view"
            onClick={() => onChangeView('apps')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'apps'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'hover:text-slate-900 hover:bg-slate-200/50'
            }`}
            title="Catálogo Meus Apps"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Meus Apps</span>
          </button>
        </div>

        {/* Print / Export button */}
        <button
          onClick={onPrint}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition hidden sm:flex"
          title="Imprimir / Visualização de Caderno"
        >
          <Printer className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
