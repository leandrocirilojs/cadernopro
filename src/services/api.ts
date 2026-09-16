import { Subject, NotebookElement, MyApp, CalendarActivity, NotebookStats } from '../types';
import { firestoreService, db } from './firebase';
import firebaseConfig from '../../firebase-applet-config.json';

const API_BASE = '/api';

export const api = {
  // Health & Database identification
  async getHealth() {
    return {
      status: 'ok',
      database: 'firebase-firestore',
      projectId: firebaseConfig.projectId,
      firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
      timestamp: new Date().toISOString()
    };
  },

  // Subjects (Firebase Firestore)
  async getSubjects(): Promise<Subject[]> {
    return firestoreService.getSubjects();
  },

  async createSubject(data: { name: string; color: string; icon?: string }): Promise<Subject> {
    return firestoreService.createSubject(data);
  },

  async updateSubject(id: string, data: { name?: string; color?: string; icon?: string }): Promise<Subject> {
    return firestoreService.updateSubject(id, data);
  },

  async deleteSubject(id: string): Promise<{ success: boolean; id: string }> {
    const success = await firestoreService.deleteSubject(id);
    return { success, id };
  },

  // Elements (Notes, Post-its, Tasks, Tables, Code in Firestore)
  async getElements(params?: {
    subjectId?: string;
    date?: string;
    type?: string;
    search?: string;
  }): Promise<NotebookElement[]> {
    return firestoreService.getElements(params);
  },

  async createElement(data: Partial<NotebookElement>): Promise<NotebookElement> {
    return firestoreService.createElement(data);
  },

  async updateElement(id: string, data: Partial<NotebookElement>): Promise<NotebookElement> {
    return firestoreService.updateElement(id, data);
  },

  async updateElementPosition(id: string, x: number, y: number): Promise<void> {
    return firestoreService.updateElementPosition(id, x, y);
  },

  async deleteElement(id: string): Promise<{ success: boolean; id: string }> {
    const success = await firestoreService.deleteElement(id);
    return { success, id };
  },

  // Apps (Firebase Firestore)
  async getApps(): Promise<MyApp[]> {
    return firestoreService.getApps();
  },

  async createApp(data: { name: string; description: string; url: string; icon: string; category?: string }): Promise<MyApp> {
    return firestoreService.createApp(data);
  },

  async updateApp(id: string, data: Partial<MyApp>): Promise<MyApp> {
    return firestoreService.updateApp(id, data);
  },

  async deleteApp(id: string): Promise<{ success: boolean; id: string }> {
    const success = await firestoreService.deleteApp(id);
    return { success, id };
  },

  // Calendar
  async getCalendarActivity(): Promise<CalendarActivity[]> {
    return firestoreService.getCalendarActivity();
  },

  // Stats
  async getStats(): Promise<NotebookStats> {
    return firestoreService.getStats();
  },

  // Backup & Restore via Firebase
  async downloadBackup(): Promise<void> {
    const data = await firestoreService.exportFullData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caderno_ads_firebase_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  exportDatabaseUrl(): string {
    return `${API_BASE}/database/export`;
  },

  async importDatabase(jsonData: any): Promise<{ success: boolean; message: string }> {
    return firestoreService.importFullData(jsonData);
  },

  // AI Assistant (Gemini API server-side proxy with static warning)
  async askAI(prompt: string, context?: string, type?: 'summary' | 'quiz' | 'explain-code'): Promise<string> {
    try {
      const res = await fetch(`${API_BASE}/ai/study-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context, type })
      });
      if (res.ok) {
        const data = await res.json();
        return data.response;
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Erro ao consultar IA');
    } catch (err: any) {
      if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
        throw err;
      }
      return 'Nota do GitHub Pages (Modo Estático): Para usar o Tutor IA Gemini em produção sem servidor Node.js, você pode hospedar no Render/Vercel ou configurar a chamada direta com chave client-side. Suas anotações, matérias, tarefas e quadros continuam funcionando 100% no Firebase!';
    }
  },

  // Code Runner / Interpreter (Supports both server-side execution and client-side static mode)
  async executeCode(payload: {
    code: string;
    language: string;
    input?: string;
  }): Promise<{
    success: boolean;
    output: string;
    error?: string;
    exitCode?: number | null;
    executionTimeMs?: number;
    isHtml?: boolean;
    htmlContent?: string;
  }> {
    const startTime = performance.now();

    // 1. If HTML, preview directly
    if (payload.language === 'html') {
      return {
        success: true,
        output: 'Preview HTML/CSS renderizado na aba visual.',
        executionTimeMs: Math.round(performance.now() - startTime),
        isHtml: true,
        htmlContent: payload.code
      };
    }

    // 2. Try server execution if backend is available
    try {
      const res = await fetch(`${API_BASE}/code/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {
      // Backend not running (e.g. GitHub Pages static hosting), fallback to client-side runner
    }

    // 3. Client-side static execution fallback
    if (payload.language === 'javascript' || payload.language === 'typescript') {
      try {
        const logs: string[] = [];
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        const capture = (...args: any[]) => {
          logs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
        };

        // Sandbox evaluation for JS
        const sandboxFunc = new Function('console', `
          "use strict";
          try {
            ${payload.code}
          } catch(e) {
            throw e;
          }
        `);

        sandboxFunc({
          log: capture,
          warn: capture,
          error: capture,
          info: capture
        });

        const executionTimeMs = Math.round(performance.now() - startTime);
        return {
          success: true,
          output: logs.length > 0 ? logs.join('\n') : 'Código executado com sucesso (sem saídas em console.log).',
          executionTimeMs
        };
      } catch (err: any) {
        return {
          success: false,
          output: '',
          error: `Erro em tempo de execução: ${err.message || String(err)}`,
          executionTimeMs: Math.round(performance.now() - startTime)
        };
      }
    }

    // For Python, Bash or SQL when on GitHub Pages (static mode without backend)
    return {
      success: false,
      output: '',
      error: `[Aviso GitHub Pages]: A linguagem '${payload.language}' necessita de compilador/interpretador de servidor.\n\n` +
        `• No GitHub Pages (modo estático), JavaScript e HTML funcionam direto no navegador.\n` +
        `• Seus códigos e anotações continuam salvos com segurança no Firebase Firestore!`,
      executionTimeMs: Math.round(performance.now() - startTime)
    };
  }
};
