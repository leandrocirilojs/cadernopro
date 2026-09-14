import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Subject, SUBJECT_PRESET_COLORS, SUBJECT_ICONS } from '../../types';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; color: string; icon?: string }) => void;
  initialSubject?: Subject | null;
}

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSubject
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(SUBJECT_PRESET_COLORS[0]);
  const [icon, setIcon] = useState(SUBJECT_ICONS[0]);

  useEffect(() => {
    if (initialSubject) {
      setName(initialSubject.name);
      setColor(initialSubject.color);
      setIcon(initialSubject.icon || SUBJECT_ICONS[0]);
    } else {
      setName('');
      setColor(SUBJECT_PRESET_COLORS[0]);
      setIcon(SUBJECT_ICONS[0]);
    }
  }, [initialSubject, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), color, icon });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">
            {initialSubject ? 'Editar Matéria' : 'Adicionar Nova Matéria'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Nome da Matéria
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Algoritmos e Estruturas de Dados..."
              required
              autoFocus
              className="w-full text-sm font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Cor de Identificação
            </label>
            <div className="grid grid-cols-5 gap-2">
              {SUBJECT_PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-9 rounded-xl border flex items-center justify-center transition-all ${
                    color === c ? 'ring-2 ring-blue-500 ring-offset-2 scale-105' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Ícone
            </label>
            <div className="grid grid-cols-6 gap-2">
              {SUBJECT_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`h-10 text-lg rounded-xl border flex items-center justify-center transition-all ${
                    icon === ic 
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
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
              {initialSubject ? 'Salvar Alterações' : 'Criar Matéria'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
