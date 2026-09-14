export interface Subject {
  id: string;
  name: string;
  color: string;
  icon?: string;
  sort_order: number;
  created_at: string;
}

export type ElementType = 'note' | 'postit' | 'table' | 'task' | 'code';
export type PriorityLevel = 'baixa' | 'media' | 'alta' | 'urgente';

export interface TableData {
  rows: number;
  cols: number;
  data: string[][];
}

export interface CodeMeta {
  language: string;
}

export interface NotebookElement {
  id: string;
  subject_id: string;
  type: ElementType;
  title?: string;
  content: string;
  color?: string;
  date: string;
  full_date: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  done: number; // 0 or 1
  priority: PriorityLevel;
  meta_json?: string;
  pinned: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

export interface MyApp {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  category: string;
  sort_order: number;
  created_at: string;
}

export interface CalendarActivity {
  date: string;
  count: number;
  types: string;
}

export interface NotebookStats {
  totalNotes: number;
  totalPostits: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalTables: number;
  totalCodes: number;
  totalSubjects: number;
  totalApps: number;
}

export type ViewTab = 'canvas' | 'grid' | 'tasks' | 'apps';

export const POSTIT_COLORS = [
  { id: 'yellow', name: 'Amarelo', bg: '#fef08a', text: '#713f12', border: '#fde047' },
  { id: 'pink', name: 'Rosa', bg: '#fbcfe8', text: '#831843', border: '#f9a8d4' },
  { id: 'blue', name: 'Azul', bg: '#bae6fd', text: '#0c4a6e', border: '#7dd3fc' },
  { id: 'green', name: 'Verde', bg: '#bbf7d0', text: '#14532d', border: '#86efac' },
  { id: 'purple', name: 'Roxo', bg: '#e9d5ff', text: '#581c87', border: '#d8b4fe' },
  { id: 'orange', name: 'Laranja', bg: '#fed7aa', text: '#7c2d12', border: '#fdba74' },
  { id: 'mint', name: 'Menta', bg: '#a7f3d0', text: '#064e3b', border: '#6ee7b7' },
  { id: 'slate', name: 'Cinza', bg: '#e2e8f0', text: '#1e293b', border: '#cbd5e1' }
];

export const SUBJECT_PRESET_COLORS = [
  '#d98b3f', // Âmbar / Laranja
  '#3b82f6', // Azul
  '#10b981', // Esmeralda / Verde
  '#8b5cf6', // Roxo
  '#ec4899', // Rosa
  '#06b6d4', // Ciano
  '#f59e0b', // Amarelo Dourado
  '#ef4444', // Vermelho
  '#6366f1', // Índigo
  '#14b8a6'  // Verde Água
];

export const SUBJECT_ICONS = ['📐', '⚙️', '🌐', '🗄️', '💻', '🤖', '📱', '🔒', '📊', '⚡', '🧠', '📚'];
