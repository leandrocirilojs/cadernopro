import React, { useState, useEffect } from 'react';
import { X, Globe } from 'lucide-react';
import { MyApp } from '../../types';

interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string; url: string; icon: string; category: string }) => void;
  initialApp?: MyApp | null;
}

const DEFAULT_CATEGORIES = [
  'Inteligência Artificial',
  'Simuladores & Redes',
  'Engenharia de Software',
  'Banco de Dados & Backend',
  'Produtividade & Estudo',
  'Geral'
];

export const AppModal: React.FC<AppModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialApp
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('🚀');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);

  useEffect(() => {
    if (initialApp) {
      setName(initialApp.name);
      setDescription(initialApp.description || '');
      setUrl(initialApp.url);
      setIcon(initialApp.icon || '🚀');
      setCategory(initialApp.category || DEFAULT_CATEGORIES[0]);
    } else {
      setName('');
      setDescription('');
      setUrl('');
      setIcon('🚀');
      setCategory(DEFAULT_CATEGORIES[0]);
    }
  }, [initialApp, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      url: url.trim(),
      icon: icon.trim() || '🚀',
      category: category.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">
            {initialApp ? 'Editar Projeto' : 'Adicionar Novo Projeto / App'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Nome do Projeto
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: EduAI, Quiz IA, Simulador..."
                required
                className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Ícone / Emoji
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="Ex: 🤖 ou URL"
                className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              URL / Link do Repositório ou Demo
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              required
              className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none"
            >
              {DEFAULT_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Descrição do Projeto
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo do projeto, tecnologias utilizadas (ex: Python, React, Flask)..."
              className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition"
            >
              Salvar Projeto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
