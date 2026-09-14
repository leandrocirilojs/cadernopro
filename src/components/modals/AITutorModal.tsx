import React, { useState } from 'react';
import { X, Sparkles, Send, Copy, Check, BookOpen, HelpCircle, Code2, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { NotebookElement, Subject } from '../../types';

interface AITutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubject?: Subject;
  subjectElements: NotebookElement[];
}

export const AITutorModal: React.FC<AITutorModalProps> = ({
  isOpen,
  onClose,
  currentSubject,
  subjectElements
}) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Build context from notes
  const notesContext = subjectElements
    .filter(e => e.type === 'note' || e.type === 'postit' || e.type === 'code')
    .map(e => `[${e.type.toUpperCase()}] ${e.title ? e.title + ': ' : ''}${e.content.replace(/<[^>]+>/g, ' ')}`)
    .slice(0, 15)
    .join('\n\n');

  const handleAsk = async (customPrompt?: string, type?: 'summary' | 'quiz' | 'explain-code') => {
    const question = customPrompt || prompt;
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await api.askAI(question, notesContext, type);
      setResponse(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao comunicar com a IA');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Tutor de Estudos IA (ADS)
              </h3>
              <p className="text-xs text-purple-600 font-medium">
                Matéria ativa: {currentSubject?.name || 'Geral'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Study Prompt Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => handleAsk(`Resuma os tópicos principais de ${currentSubject?.name || 'ADS'} com base nas anotações do caderno.`, 'summary')}
            disabled={loading}
            className="p-2.5 bg-purple-50 hover:bg-purple-100/80 text-purple-900 border border-purple-200 rounded-xl text-left text-xs font-semibold flex items-center gap-2 transition"
          >
            <BookOpen className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Resumir Anotações</span>
          </button>

          <button
            onClick={() => handleAsk(`Crie um simulado de 3 questões de múltipla escolha com gabarito comentado sobre ${currentSubject?.name || 'Análise e Desenvolvimento de Sistemas'}.`, 'quiz')}
            disabled={loading}
            className="p-2.5 bg-blue-50 hover:bg-blue-100/80 text-blue-900 border border-blue-200 rounded-xl text-left text-xs font-semibold flex items-center gap-2 transition"
          >
            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Simulado de Prova</span>
          </button>

          <button
            onClick={() => handleAsk(`Explique de forma didática com exemplos práticos de código o conceito central de ${currentSubject?.name || 'Estruturas de Dados e Algoritmos'}.`, 'explain-code')}
            disabled={loading}
            className="p-2.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-200 rounded-xl text-left text-xs font-semibold flex items-center gap-2 transition"
          >
            <Code2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Explicar Conceito & Código</span>
          </button>
        </div>

        {/* Response Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[220px] mb-4 text-xs font-mono text-slate-800 leading-relaxed relative">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600 mb-2" />
              <p className="text-xs font-sans font-medium text-slate-600">Consultando Tutor IA...</p>
            </div>
          ) : error ? (
            <div className="text-rose-600 font-sans p-3 bg-rose-50 rounded-xl border border-rose-200">
              {error}
            </div>
          ) : response ? (
            <div className="space-y-2 whitespace-pre-wrap font-sans">
              <div className="flex items-center justify-end sticky top-0">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 shadow-xs rounded-lg text-xs text-slate-600 hover:text-purple-600 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <div className="text-slate-800 leading-relaxed text-xs sm:text-sm">
                {response}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-12 text-slate-400 font-sans">
              <Sparkles className="w-8 h-8 text-purple-300 mb-2" />
              <p className="font-semibold text-slate-600">Pergunte qualquer dúvida acadêmica sobre ADS</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Use os botões de atalho acima ou digite sua dúvida abaixo</p>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleAsk()}
            placeholder="Ex: Como funciona herança vs composição em POO?..."
            disabled={loading}
            className="flex-1 text-xs font-medium px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl outline-none"
          />
          <button
            onClick={() => handleAsk()}
            disabled={loading || !prompt.trim()}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 text-xs font-bold shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Perguntar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
