import React, { useState, useRef, useEffect } from 'react';
import {
  GripVertical,
  X,
  Copy,
  Check,
  Code as CodeIcon,
  Play,
  RotateCcw,
  Terminal,
  Clock,
  Sparkles,
  AlertCircle,
  Eye,
  Trash2,
  HelpCircle
} from 'lucide-react';
import { NotebookElement } from '../../types';
import { ResizeHandle } from './ResizeHandle';
import { api } from '../../services/api';

interface CodeCardProps {
  element: NotebookElement;
  onUpdate: (id: string, data: Partial<NotebookElement>) => void;
  onDelete: (id: string) => void;
  isDraggable?: boolean;
  onMouseDownDrag?: (e: any) => void;
}

const LANGUAGES = [
  { id: 'python', name: 'Python 3', runner: true, placeholder: '# Exemplo em Python\ndef fib(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a\n\nprint("Fibonacci(10):", fib(10))\nprint("Status: Sucesso!")' },
  { id: 'javascript', name: 'JavaScript (Node.js)', runner: true, placeholder: '// Exemplo em JavaScript\nconst alunos = ["Ana", "Bruno", "Carlos"];\nconst formatado = alunos.map((nome, idx) => `${idx + 1}. ${nome}`);\n\nconsole.log("Turma ADS:");\nconsole.log(formatado.join("\\n"));' },
  { id: 'typescript', name: 'TypeScript', runner: true, placeholder: '// Exemplo em TypeScript\ninterface Aluno {\n  nome: string;\n  matricula: number;\n}\n\nconst aluno: Aluno = { nome: "Lucas", matricula: 202601 };\nconsole.log(`Aluno matriculado: ${aluno.nome} (#${aluno.matricula})`);' },
  { id: 'sql', name: 'SQL (SQLite)', runner: true, placeholder: '-- Consultas SQL em memória\nCREATE TABLE alunos (id INTEGER PRIMARY KEY, nome TEXT, curso TEXT, cra REAL);\nINSERT INTO alunos VALUES (1, "Maria Silva", "ADS", 9.4);\nINSERT INTO alunos VALUES (2, "João Pereira", "ADS", 8.8);\n\nSELECT * FROM alunos WHERE cra >= 9.0;' },
  { id: 'html', name: 'HTML / CSS Preview', runner: true, placeholder: '<!DOCTYPE html>\n<div style="font-family: sans-serif; padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; color: #166534;">\n  <h3 style="margin: 0 0 8px;">🚀 Protótipo ADS</h3>\n  <p style="margin: 0; font-size: 13px;">Renderizado ao vivo no editor!</p>\n</div>' },
  { id: 'bash', name: 'Bash / Shell', runner: true, placeholder: '#!/bin/bash\necho "Data do sistema: $(date)"\necho "Usuário atual: $(whoami)"\necho "ADS Sandbox operacional"' },
  { id: 'java', name: 'Java (Syntax)', runner: false, placeholder: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Olá, ADS!");\n    }\n}' },
  { id: 'cpp', name: 'C++ (Syntax)', runner: false, placeholder: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "C++ no Caderno ADS" << endl;\n    return 0;\n}' }
];

export const CodeCard: React.FC<CodeCardProps> = ({
  element,
  onUpdate,
  onDelete,
  isDraggable = true,
  onMouseDownDrag
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [code, setCode] = useState(element.content || '');
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState(element.title || 'Script ADS');
  const [activeTab, setActiveTab] = useState<'editor' | 'console' | 'preview'>('editor');

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [errorOutput, setErrorOutput] = useState<string>('');
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [htmlPreview, setHtmlPreview] = useState<string>('');
  const [hasRun, setHasRun] = useState(false);

  // Meta parsing
  const meta = element.meta_json ? (() => {
    try {
      return JSON.parse(element.meta_json);
    } catch {
      return { language: 'python' };
    }
  })() : { language: 'python' };

  const currentLang = meta.language || 'python';
  const langConfig = LANGUAGES.find(l => l.id === currentLang) || LANGUAGES[0];

  // Set default placeholder code if blank on creation
  useEffect(() => {
    if (!element.content && langConfig.placeholder) {
      setCode(langConfig.placeholder);
      onUpdate(element.id, { content: langConfig.placeholder });
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLanguageChange = (newLang: string) => {
    const targetConfig = LANGUAGES.find(l => l.id === newLang);
    const updatedMeta = { ...meta, language: newLang };
    
    // If the editor is still using a default placeholder of previous lang, swap it
    const isCurrentPlaceholder = LANGUAGES.some(l => l.placeholder === code);
    const newCode = isCurrentPlaceholder && targetConfig ? targetConfig.placeholder : code;

    setCode(newCode);
    onUpdate(element.id, {
      content: newCode,
      meta_json: JSON.stringify(updatedMeta)
    });

    // Reset execution outputs
    setOutput('');
    setErrorOutput('');
    setHasRun(false);
    setHtmlPreview('');
    setActiveTab('editor');
  };

  const handleBlur = () => {
    onUpdate(element.id, { content: code, title });
  };

  // Run/Interpret code
  const handleExecuteCode = async () => {
    if (!code.trim()) return;

    setIsRunning(true);
    setErrorOutput('');
    setOutput('');
    setHasRun(true);

    try {
      if (currentLang === 'html') {
        setHtmlPreview(code);
        setActiveTab('preview');
        setIsRunning(false);
        return;
      }

      const res = await api.executeCode({
        code,
        language: currentLang
      });

      setOutput(res.output || '');
      setErrorOutput(res.error || '');
      setExecutionTime(res.executionTimeMs || null);
      if (res.isHtml && res.htmlContent) {
        setHtmlPreview(res.htmlContent);
        setActiveTab('preview');
      } else {
        setActiveTab('console');
      }
    } catch (err: any) {
      setErrorOutput(err.message || 'Erro ao conectar ao executor de código.');
      setActiveTab('console');
    } finally {
      setIsRunning(false);
    }
  };

  const clearConsole = () => {
    setOutput('');
    setErrorOutput('');
    setHasRun(false);
    setExecutionTime(null);
  };

  return (
    <div 
      ref={cardRef}
      id={`code-card-${element.id}`}
      className="bg-slate-950 border border-slate-700/80 rounded-2xl p-3.5 shadow-xl flex flex-col relative text-slate-100 transition-all font-sans"
      style={{ 
        width: isDraggable ? `${element.width || 480}px` : '100%',
        height: isDraggable && element.height ? `${element.height}px` : undefined,
        minHeight: '260px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/90">
        <div 
          className={`flex items-center gap-1.5 text-xs font-semibold text-slate-400 select-none touch-none py-1 px-1 rounded-lg active:bg-slate-800 ${
            isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          style={{ touchAction: 'none' }}
          onPointerDown={isDraggable ? onMouseDownDrag : undefined}
          onTouchStart={isDraggable ? onMouseDownDrag : undefined}
          onMouseDown={isDraggable ? onMouseDownDrag : undefined}
          title={isDraggable ? "Arraste para mover no quadro" : undefined}
        >
          {isDraggable && <GripVertical className="w-4 h-4 text-slate-500 shrink-0" />}
          <span className="text-purple-400 font-bold flex items-center gap-1">
            <CodeIcon className="w-3.5 h-3.5 text-purple-400" />
            <span>Terminal ADS</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Language Selector */}
          <select
            value={currentLang}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="text-[11px] bg-slate-900 text-purple-300 font-medium border border-slate-700 rounded-md px-2 py-1 outline-none cursor-pointer hover:border-purple-500 transition"
          >
            {LANGUAGES.map(l => (
              <option key={l.id} value={l.id} className="bg-slate-900 text-slate-200">
                {l.name} {l.runner ? '⚡' : ''}
              </option>
            ))}
          </select>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
            title="Copiar código"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Delete Card */}
          <button
            type="button"
            onClick={() => onDelete(element.id)}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition"
            title="Excluir bloco de código"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title & Execution Action Bar */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleBlur}
          placeholder="Título do script ou consulta..."
          className="flex-1 text-xs font-bold text-slate-200 bg-transparent px-1 py-0.5 outline-none border-b border-transparent focus:border-purple-500 rounded"
        />

        {/* Run Button */}
        <button
          type="button"
          onClick={handleExecuteCode}
          disabled={isRunning}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition shadow-sm ${
            isRunning
              ? 'bg-purple-900 text-purple-200 cursor-not-allowed animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
          }`}
          title="Executar / Interpretar código agora (Ctrl+Enter)"
        >
          {isRunning ? (
            <>
              <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              <span>Executando...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Executar</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs (Código vs Console vs Preview) */}
      <div className="flex items-center justify-between border-b border-slate-800 mb-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-2.5 py-1 text-xs font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'editor'
                ? 'border-purple-500 text-purple-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CodeIcon className="w-3 h-3" />
            <span>Código</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('console')}
            className={`px-2.5 py-1 text-xs font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'console'
                ? 'border-purple-500 text-purple-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3 h-3" />
            <span>Saída / Console</span>
            {hasRun && (
              <span className={`w-1.5 h-1.5 rounded-full ${errorOutput ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            )}
          </button>

          {currentLang === 'html' && (
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-2.5 py-1 text-xs font-medium border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'border-purple-500 text-purple-300 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Preview Visual</span>
            </button>
          )}
        </div>

        {activeTab === 'console' && hasRun && (
          <button
            type="button"
            onClick={clearConsole}
            className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-800 transition"
            title="Limpar saída do console"
          >
            <Trash2 className="w-3 h-3" />
            <span>Limpar</span>
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'editor' && (
        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900/90 flex-1 flex flex-col min-h-[120px]">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              // Quick execution shortcut: Ctrl+Enter or Cmd+Enter
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleExecuteCode();
              }
            }}
            placeholder="// Digite ou cole seu código aqui..."
            className="w-full flex-1 p-3 font-mono text-xs text-purple-200 bg-transparent resize-none outline-none leading-relaxed selection:bg-purple-900 selection:text-white"
            spellCheck={false}
          />
        </div>
      )}

      {activeTab === 'console' && (
        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900/95 flex-1 flex flex-col min-h-[120px] p-3 font-mono text-xs overflow-y-auto">
          {!hasRun && !isRunning ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center gap-2">
              <Terminal className="w-6 h-6 text-slate-600" />
              <p>Nenhuma execução recente.</p>
              <p className="text-[11px] text-slate-600">
                Clique no botão verde <strong className="text-emerald-500">▶ Executar</strong> ou pressione <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 text-[10px]">Ctrl+Enter</kbd>.
              </p>
            </div>
          ) : isRunning ? (
            <div className="flex-1 flex flex-col items-center justify-center text-purple-300 gap-2">
              <RotateCcw className="w-5 h-5 animate-spin text-purple-400" />
              <span>Interpretando código no servidor...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {output && (
                <pre className="text-emerald-300 whitespace-pre-wrap font-mono leading-relaxed selection:bg-emerald-900">
                  {output}
                </pre>
              )}
              {errorOutput && (
                <div className="p-2 bg-rose-950/40 border border-rose-900/60 rounded-lg text-rose-300">
                  <div className="flex items-center gap-1.5 font-bold text-rose-400 mb-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Saída de Erro:</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
                    {errorOutput}
                  </pre>
                </div>
              )}
              {!output && !errorOutput && (
                <div className="text-slate-400 italic">
                  ✓ O código executou com sucesso, mas não produziu saídas no terminal (ex: use print() ou console.log()).
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'preview' && currentLang === 'html' && (
        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-white flex-1 flex flex-col min-h-[120px] p-2">
          <iframe
            srcDoc={htmlPreview || code}
            sandbox="allow-scripts"
            title="HTML Preview"
            className="w-full h-full border-0 rounded bg-white"
          />
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-2 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-medium">
        <div className="flex items-center gap-2">
          <span>{element.date}</span>
          {executionTime !== null && (
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3 h-3 text-purple-400" />
              {executionTime}ms
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-[9px] text-slate-400">Ctrl+Enter</kbd>
          <span>para rodar</span>
        </div>
      </div>

      {/* Interactive Resize Handle */}
      {isDraggable && (
        <ResizeHandle
          cardRef={cardRef}
          elementId={element.id}
          initialWidth={element.width || 480}
          initialHeight={element.height || 280}
          minWidth={320}
          minHeight={200}
          onResizeEnd={(id, width, height) => onUpdate(id, { width, height })}
          colorClass="text-slate-500 hover:text-purple-400"
        />
      )}
    </div>
  );
};
