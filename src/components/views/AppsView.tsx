import React, { useState } from 'react';
import { ExternalLink, Plus, Trash2, Edit3, Globe, Code2, Sparkles, FolderGit2 } from 'lucide-react';
import { MyApp } from '../../types';

interface AppsViewProps {
  apps: MyApp[];
  onAddNewApp: () => void;
  onEditApp: (app: MyApp) => void;
  onDeleteApp: (id: string) => void;
}

export const AppsView: React.FC<AppsViewProps> = ({
  apps,
  onAddNewApp,
  onEditApp,
  onDeleteApp
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(apps.map(a => a.category).filter(Boolean)))];

  const filteredApps = apps.filter(a => {
    if (selectedCategory === 'all') return true;
    return a.category === selectedCategory;
  });

  const isImageIcon = (icon: string) => {
    return /^https?:\/\//i.test(icon) || /\.(png|jpe?g|svg|webp|gif)(\?.*)?$/i.test(icon);
  };

  return (
    <div id="apps-view-container" className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🚀</span>
              <h2 className="text-xl font-bold text-slate-800">
                Meus Apps & Projetos
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                {apps.length} Projetos
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Catálogo de repositórios, simuladores e portfólio de Análise e Desenvolvimento de Sistemas
            </p>
          </div>

          <button
            id="add-new-app-btn"
            onClick={onAddNewApp}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Adicionar Projeto</span>
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl capitalize transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat === 'all' ? 'Todos os Projetos' : cat}
            </button>
          ))}
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredApps.map((app) => {
            return (
              <div
                key={app.id}
                id={`app-card-${app.id}`}
                className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
              >
                {/* Action buttons on top right */}
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => onEditApp(app)}
                    className="p-1 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded transition"
                    title="Editar app"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteApp(app.id)}
                    className="p-1 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded transition"
                    title="Excluir app"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl mb-3.5 group-hover:scale-105 transition-transform">
                    {isImageIcon(app.icon) ? (
                      <img src={app.icon} alt={app.name} className="w-7 h-7 object-contain rounded" />
                    ) : (
                      <span>{app.icon || '📦'}</span>
                    )}
                  </div>

                  {/* Category badge */}
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                    {app.category || 'Geral'}
                  </span>

                  {/* Name */}
                  <h3 className="text-sm font-bold text-slate-800 mb-1.5 group-hover:text-blue-600 transition">
                    {app.name}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-4">
                    {app.description || 'Sem descrição cadastrada.'}
                  </p>
                </div>

                {/* Open Link button */}
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 group-hover:bg-blue-600 text-slate-700 group-hover:text-white text-xs font-bold rounded-xl transition"
                >
                  <span>Acessar Projeto</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            );
          })}
        </div>

        {filteredApps.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <FolderGit2 className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <h4 className="text-base font-bold text-slate-700">Nenhum projeto cadastrado nesta categoria</h4>
            <p className="text-xs text-slate-500 mt-1">Clique em "+ Adicionar Projeto" para cadastrar seus links.</p>
          </div>
        )}
      </div>
    </div>
  );
};
