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

  // AI Assistant (Gemini API server-side proxy)
  async askAI(prompt: string, context?: string, type?: 'summary' | 'quiz' | 'explain-code'): Promise<string> {
    const res = await fetch(`${API_BASE}/ai/study-assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, context, type })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao consultar IA');
    }
    return data.response;
  }
};

