import React, { useState } from 'react';
import { X, Download, Upload, Database, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessRestore: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose, onSuccessRestore }) => {
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleDownloadBackup = async () => {
    try {
      await api.downloadBackup();
    } catch (err: any) {
      setMessage({ text: err.message || 'Erro ao exportar backup do Firebase', type: 'error' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage(null);

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      const result = await api.importDatabase(jsonData);
      setMessage({ text: result.message || 'Banco de dados restaurado com sucesso!', type: 'success' });
      setTimeout(() => {
        onSuccessRestore();
        onClose();
      }, 1500);
    } catch (err: any) {
      setMessage({ text: err.message || 'Erro ao processar arquivo de backup.', type: 'error' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Backup & Restauração</h3>
              <p className="text-xs text-slate-400">Gerenciamento seguro de dados no Firebase Firestore</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {message && (
          <div className={`p-3 rounded-xl mb-4 text-xs font-medium flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Export card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
              Fazer Backup (Exportar Firestore)
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Baixe todas as suas anotações, post-its, tarefas e matérias do Firebase em formato JSON.
            </p>
            <button
              onClick={handleDownloadBackup}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Backup Firebase (.JSON)</span>
            </button>
          </div>

          {/* Import card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
              Restaurar Backup (Importar Firestore)
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Carregue um arquivo JSON para restaurar coleções e documentos diretamente no Firebase Firestore.
            </p>
            <label className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-300 hover:border-blue-400 hover:text-blue-700 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition ${
              importing ? 'opacity-50 pointer-events-none' : ''
            }`}>
              <Upload className="w-4 h-4" />
              <span>{importing ? 'Restaurando...' : 'Selecionar Arquivo de Backup (.JSON)'}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                disabled={importing}
              />
            </label>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
