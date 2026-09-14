import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = path.join(process.cwd(), 'caderno.db');

let db: DatabaseSync;

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon?: string;
  sort_order: number;
  created_at: string;
}

export interface NotebookElement {
  id: string;
  subject_id: string;
  type: 'note' | 'postit' | 'table' | 'task' | 'code';
  title?: string;
  content: string;
  color?: string;
  date: string;
  full_date: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  done: number;
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  meta_json?: string;
  pinned: number;
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

export function initDb() {
  db = new DatabaseSync(DB_PATH);

  // Enable WAL mode for better concurrency and reliability
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT DEFAULT '📚',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS elements (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT,
      content TEXT,
      color TEXT DEFAULT 'yellow',
      date TEXT NOT NULL,
      full_date TEXT NOT NULL,
      x REAL DEFAULT 40,
      y REAL DEFAULT 80,
      width REAL DEFAULT 340,
      height REAL DEFAULT 240,
      done INTEGER DEFAULT 0,
      priority TEXT DEFAULT 'media',
      meta_json TEXT,
      pinned INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS my_apps (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      url TEXT NOT NULL,
      icon TEXT NOT NULL,
      category TEXT DEFAULT 'Projetos ADS',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_elements_subject ON elements(subject_id);
    CREATE INDEX IF NOT EXISTS idx_elements_date ON elements(date);
    CREATE INDEX IF NOT EXISTS idx_elements_type ON elements(type);
  `);

  // Seed default subjects if empty
  const countSubjects = db.prepare('SELECT COUNT(*) as count FROM subjects').get() as { count: number };
  if (countSubjects.count === 0) {
    const defaultSubjects: Subject[] = [
      { id: '1', name: 'Análise e Modelagem de Sistemas', color: '#d98b3f', icon: '📐', sort_order: 1, created_at: new Date().toISOString() },
      { id: '2', name: 'Engenharia de Software', color: '#5b8bd9', icon: '⚙️', sort_order: 2, created_at: new Date().toISOString() },
      { id: '3', name: 'Redes de Computadores', color: '#6fbf73', icon: '🌐', sort_order: 3, created_at: new Date().toISOString() },
      { id: '4', name: 'Banco de Dados', color: '#8b5cf6', icon: '🗄️', sort_order: 4, created_at: new Date().toISOString() },
      { id: '5', name: 'Desenvolvimento Web', color: '#ec4899', icon: '💻', sort_order: 5, created_at: new Date().toISOString() }
    ];

    const insertSub = db.prepare(`
      INSERT INTO subjects (id, name, color, icon, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const sub of defaultSubjects) {
      insertSub.run(sub.id, sub.name, sub.color, sub.icon, sub.sort_order, sub.created_at);
    }
  }

  // Seed default elements if empty
  const countElements = db.prepare('SELECT COUNT(*) as count FROM elements').get() as { count: number };
  if (countElements.count === 0) {
    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const fullDate = now.toLocaleString('pt-BR');

    const seedItems: Partial<NotebookElement>[] = [
      {
        id: 'elem_1',
        subject_id: '1',
        type: 'note',
        title: 'Estruturas de dados em Python – parte I',
        content: '<p>Estudante, esta videoaula foi preparada especialmente para você. Nela, você irá aprender conteúdos importantes para a sua formação profissional em ADS. Vamos assisti-la?</p><ul><li>Listas, Tuplas e Dicionários</li><li>Complexidade de Algoritmos O(n)</li><li>Aplicações práticas em modelagem de dados</li></ul>',
        color: 'white',
        date: dateFormatted,
        full_date: fullDate,
        x: 40,
        y: 80,
        width: 440,
        height: 280,
        done: 0,
        priority: 'media',
        pinned: 1,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      },
      {
        id: 'elem_2',
        subject_id: '1',
        type: 'postit',
        title: 'Lembrete de Aula',
        content: 'Revisar conceitos de Casos de Uso (UML) para a prova da próxima semana!',
        color: 'blue',
        date: dateFormatted,
        full_date: fullDate,
        x: 520,
        y: 90,
        width: 280,
        height: 200,
        done: 0,
        priority: 'alta',
        pinned: 0,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      },
      {
        id: 'elem_3',
        subject_id: '1',
        type: 'code',
        title: 'Pilha em Python (Stack LIFO)',
        content: 'class Pilha:\n    def __init__(self):\n        self.items = []\n    \n    def push(self, item):\n        self.items.append(item)\n    \n    def pop(self):\n        if not self.is_empty():\n            return self.items.pop()\n        raise IndexError("Pilha vazia")\n    \n    def is_empty(self):\n        return len(self.items) == 0',
        meta_json: JSON.stringify({ language: 'python' }),
        color: 'slate',
        date: dateFormatted,
        full_date: fullDate,
        x: 40,
        y: 400,
        width: 440,
        height: 260,
        done: 0,
        priority: 'media',
        pinned: 0,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      },
      {
        id: 'elem_4',
        subject_id: '1',
        type: 'task',
        title: '',
        content: 'Modelar Diagrama de Classes do Trabalho Final',
        color: 'yellow',
        date: dateFormatted,
        full_date: fullDate,
        x: 520,
        y: 330,
        width: 320,
        height: 120,
        done: 0,
        priority: 'alta',
        pinned: 0,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      },
      {
        id: 'elem_5',
        subject_id: '1',
        type: 'table',
        title: 'Comparativo Metodologias Ágeis',
        content: '',
        meta_json: JSON.stringify({
          rows: 3,
          cols: 3,
          data: [
            ['Critério', 'Scrum', 'Kanban'],
            ['Cadência', 'Sprints fixas (1-4 semanas)', 'Fluxo contínuo'],
            ['Papéis', 'PO, Scrum Master, Time Dev', 'Sem papéis obrigatórios']
          ]
        }),
        color: 'white',
        date: dateFormatted,
        full_date: fullDate,
        x: 520,
        y: 480,
        width: 420,
        height: 200,
        done: 0,
        priority: 'media',
        pinned: 0,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }
    ];

    const insertElem = db.prepare(`
      INSERT INTO elements (
        id, subject_id, type, title, content, color, date, full_date,
        x, y, width, height, done, priority, meta_json, pinned, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of seedItems) {
      insertElem.run(
        item.id,
        item.subject_id,
        item.type,
        item.title || '',
        item.content || '',
        item.color || 'yellow',
        item.date,
        item.full_date,
        item.x || 40,
        item.y || 80,
        item.width || 340,
        item.height || 220,
        item.done || 0,
        item.priority || 'media',
        item.meta_json || null,
        item.pinned || 0,
        item.created_at,
        item.updated_at
      );
    }
  }

  // Seed default apps if empty
  const countApps = db.prepare('SELECT COUNT(*) as count FROM my_apps').get() as { count: number };
  if (countApps.count === 0) {
    const defaultApps: MyApp[] = [
      {
        id: 'app_1',
        name: 'EduAI',
        description: 'Transforme temas e arquivos em materiais de estudo completos com IA.',
        url: 'https://leandrocirilojs.github.io/Aiedu/',
        icon: '🤖',
        category: 'Inteligência Artificial',
        sort_order: 1,
        created_at: new Date().toISOString()
      },
      {
        id: 'app_2',
        name: 'Caderno Digital',
        description: 'Seu caderno digital clássico de ADS',
        url: 'https://leandrocirilojs.github.io/cadernoads/',
        icon: '💻',
        category: 'Estudo & Organização',
        sort_order: 2,
        created_at: new Date().toISOString()
      },
      {
        id: 'app_3',
        name: 'Cisco Packet Tracer',
        description: 'Simulador de Redes e topologias de computadores',
        url: 'https://leandrocirilojs.github.io/Cisco-Packet-Tracer/',
        icon: '🛜',
        category: 'Simuladores & Redes',
        sort_order: 3,
        created_at: new Date().toISOString()
      },
      {
        id: 'app_4',
        name: 'Engenharia de Software (Scrum)',
        description: 'Simulador interativo de cerimônias Scrum e sprints',
        url: 'https://leandrocirilojs.github.io/engenharia/',
        icon: '⚙️',
        category: 'Engenharia de Software',
        sort_order: 4,
        created_at: new Date().toISOString()
      },
      {
        id: 'app_5',
        name: 'Quiz IA',
        description: 'Cole qualquer conteúdo — resumo, PDF copiado, anotação — e a IA gera perguntas infinitas.',
        url: 'https://leandrocirilojs.github.io/faculdade/',
        icon: '❓',
        category: 'Inteligência Artificial',
        sort_order: 5,
        created_at: new Date().toISOString()
      },
      {
        id: 'app_6',
        name: 'Simulador de Encapsulamento',
        description: 'Simulador visual das camadas de modelo OSI e TCP/IP na Internet',
        url: 'https://leandrocirilojs.github.io/Simulador-de-Encapsulamento-da-Internet/',
        icon: '🟧',
        category: 'Simuladores & Redes',
        sort_order: 6,
        created_at: new Date().toISOString()
      },
      {
        id: 'app_7',
        name: 'Controle de Saídas',
        description: 'Controle de saídas e logística operacional',
        url: 'https://cullen.qzz.io/',
        icon: '🏪',
        category: 'Sistemas Comerciais',
        sort_order: 7,
        created_at: new Date().toISOString()
      },
      {
        id: 'app_8',
        name: 'API Groq Keys',
        description: 'Painel e documentação oficial da API ultra-rápida Groq',
        url: 'https://console.groq.com/keys',
        icon: '🦾',
        category: 'Ferramentas de Dev',
        sort_order: 8,
        created_at: new Date().toISOString()
      }
    ];

    const insertApp = db.prepare(`
      INSERT INTO my_apps (id, name, description, url, icon, category, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const app of defaultApps) {
      insertApp.run(app.id, app.name, app.description, app.url, app.icon, app.category, app.sort_order, app.created_at);
    }
  }

  return db;
}

export function getDb(): DatabaseSync {
  if (!db) {
    return initDb();
  }
  return db;
}

// Subject queries
export function getAllSubjects(): Subject[] {
  const statement = getDb().prepare('SELECT * FROM subjects ORDER BY sort_order ASC, created_at ASC');
  return statement.all() as unknown as Subject[];
}

export function createSubject(data: { name: string; color: string; icon?: string }): Subject {
  const id = 'sub_' + Date.now();
  const created_at = new Date().toISOString();
  const maxOrder = (getDb().prepare('SELECT MAX(sort_order) as maxOrder FROM subjects').get() as { maxOrder: number | null })?.maxOrder || 0;
  
  getDb().prepare(`
    INSERT INTO subjects (id, name, color, icon, sort_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.name, data.color, data.icon || '📚', maxOrder + 1, created_at);

  return { id, name: data.name, color: data.color, icon: data.icon || '📚', sort_order: maxOrder + 1, created_at };
}

export function updateSubject(id: string, data: { name?: string; color?: string; icon?: string }): Subject | null {
  const current = getDb().prepare('SELECT * FROM subjects WHERE id = ?').get(id) as unknown as Subject;
  if (!current) return null;

  const newName = data.name ?? current.name;
  const newColor = data.color ?? current.color;
  const newIcon = data.icon ?? current.icon;

  getDb().prepare(`
    UPDATE subjects SET name = ?, color = ?, icon = ? WHERE id = ?
  `).run(newName, newColor, newIcon, id);

  return { ...current, name: newName, color: newColor, icon: newIcon };
}

export function deleteSubject(id: string): boolean {
  // Cascades to elements via FOREIGN KEY or manual delete
  getDb().prepare('DELETE FROM elements WHERE subject_id = ?').run(id);
  const result = getDb().prepare('DELETE FROM subjects WHERE id = ?').run(id);
  return result.changes > 0;
}

// Elements queries
export function getElements(subjectId?: string, dateFilter?: string, typeFilter?: string, search?: string): NotebookElement[] {
  let query = 'SELECT * FROM elements WHERE 1=1';
  const params: (string | number)[] = [];

  if (subjectId) {
    query += ' AND subject_id = ?';
    params.push(subjectId);
  }
  if (dateFilter) {
    query += ' AND date = ?';
    params.push(dateFilter);
  }
  if (typeFilter && typeFilter !== 'all') {
    query += ' AND type = ?';
    params.push(typeFilter);
  }
  if (search && search.trim()) {
    query += ' AND (title LIKE ? OR content LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }

  query += ' ORDER BY pinned DESC, created_at DESC';

  const statement = getDb().prepare(query);
  const rows = statement.all(...params) as unknown as NotebookElement[];
  return rows;
}

export function createElement(data: Partial<NotebookElement>): NotebookElement {
  const id = 'elem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const now = new Date();
  const date = data.date || `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const full_date = data.full_date || now.toLocaleString('pt-BR');
  const created_at = now.toISOString();
  const updated_at = created_at;

  getDb().prepare(`
    INSERT INTO elements (
      id, subject_id, type, title, content, color, date, full_date,
      x, y, width, height, done, priority, meta_json, pinned, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.subject_id!,
    data.type || 'note',
    data.title || '',
    data.content || '',
    data.color || 'yellow',
    date,
    full_date,
    data.x ?? 40,
    data.y ?? 80,
    data.width ?? 340,
    data.height ?? 220,
    data.done ? 1 : 0,
    data.priority || 'media',
    data.meta_json || null,
    data.pinned ? 1 : 0,
    created_at,
    updated_at
  );

  return {
    id,
    subject_id: data.subject_id!,
    type: data.type || 'note',
    title: data.title || '',
    content: data.content || '',
    color: data.color || 'yellow',
    date,
    full_date,
    x: data.x ?? 40,
    y: data.y ?? 80,
    width: data.width ?? 340,
    height: data.height ?? 220,
    done: data.done ? 1 : 0,
    priority: data.priority || 'media',
    meta_json: data.meta_json,
    pinned: data.pinned ? 1 : 0,
    created_at,
    updated_at
  };
}

export function updateElement(id: string, data: Partial<NotebookElement>): NotebookElement | null {
  const current = getDb().prepare('SELECT * FROM elements WHERE id = ?').get(id) as unknown as NotebookElement;
  if (!current) return null;

  const updated_at = new Date().toISOString();
  const updated: NotebookElement = {
    ...current,
    ...data,
    done: data.done !== undefined ? (data.done ? 1 : 0) : current.done,
    pinned: data.pinned !== undefined ? (data.pinned ? 1 : 0) : current.pinned,
    updated_at
  };

  getDb().prepare(`
    UPDATE elements SET
      subject_id = ?,
      type = ?,
      title = ?,
      content = ?,
      color = ?,
      date = ?,
      full_date = ?,
      x = ?,
      y = ?,
      width = ?,
      height = ?,
      done = ?,
      priority = ?,
      meta_json = ?,
      pinned = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    updated.subject_id,
    updated.type,
    updated.title || '',
    updated.content || '',
    updated.color || 'yellow',
    updated.date,
    updated.full_date,
    updated.x,
    updated.y,
    updated.width ?? 340,
    updated.height ?? 220,
    updated.done,
    updated.priority,
    updated.meta_json || null,
    updated.pinned,
    updated.updated_at,
    id
  );

  return updated;
}

export function deleteElement(id: string): boolean {
  const result = getDb().prepare('DELETE FROM elements WHERE id = ?').run(id);
  return result.changes > 0;
}

// Batch update positions when dragged
export function updateElementPosition(id: string, x: number, y: number): boolean {
  const result = getDb().prepare('UPDATE elements SET x = ?, y = ?, updated_at = ? WHERE id = ?').run(x, y, new Date().toISOString(), id);
  return result.changes > 0;
}

// Apps queries
export function getAllApps(): MyApp[] {
  return getDb().prepare('SELECT * FROM my_apps ORDER BY sort_order ASC, created_at ASC').all() as unknown as MyApp[];
}

export function createApp(data: { name: string; description: string; url: string; icon: string; category?: string }): MyApp {
  const id = 'app_' + Date.now();
  const created_at = new Date().toISOString();
  const maxOrder = (getDb().prepare('SELECT MAX(sort_order) as maxOrder FROM my_apps').get() as { maxOrder: number | null })?.maxOrder || 0;

  getDb().prepare(`
    INSERT INTO my_apps (id, name, description, url, icon, category, sort_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.name, data.description, data.url, data.icon, data.category || 'Geral', maxOrder + 1, created_at);

  return {
    id,
    name: data.name,
    description: data.description,
    url: data.url,
    icon: data.icon,
    category: data.category || 'Geral',
    sort_order: maxOrder + 1,
    created_at
  };
}

export function updateApp(id: string, data: Partial<MyApp>): MyApp | null {
  const current = getDb().prepare('SELECT * FROM my_apps WHERE id = ?').get(id) as unknown as MyApp;
  if (!current) return null;

  const updated: MyApp = {
    ...current,
    ...data
  };

  getDb().prepare(`
    UPDATE my_apps SET name = ?, description = ?, url = ?, icon = ?, category = ? WHERE id = ?
  `).run(updated.name, updated.description, updated.url, updated.icon, updated.category, id);

  return updated;
}

export function deleteApp(id: string): boolean {
  const result = getDb().prepare('DELETE FROM my_apps WHERE id = ?').run(id);
  return result.changes > 0;
}

// Calendar event dates (dates that have items)
export function getDatesWithActivity(): { date: string; count: number; types: string }[] {
  return getDb().prepare(`
    SELECT date, COUNT(*) as count, GROUP_CONCAT(DISTINCT type) as types
    FROM elements
    GROUP BY date
  `).all() as unknown as { date: string; count: number; types: string }[];
}

// Global Stats
export function getNotebookStats() {
  const totalNotes = (getDb().prepare("SELECT COUNT(*) as c FROM elements WHERE type = 'note'").get() as { c: number }).c;
  const totalPostits = (getDb().prepare("SELECT COUNT(*) as c FROM elements WHERE type = 'postit'").get() as { c: number }).c;
  const totalTasks = (getDb().prepare("SELECT COUNT(*) as c FROM elements WHERE type = 'task'").get() as { c: number }).c;
  const completedTasks = (getDb().prepare("SELECT COUNT(*) as c FROM elements WHERE type = 'task' AND done = 1").get() as { c: number }).c;
  const totalTables = (getDb().prepare("SELECT COUNT(*) as c FROM elements WHERE type = 'table'").get() as { c: number }).c;
  const totalCodes = (getDb().prepare("SELECT COUNT(*) as c FROM elements WHERE type = 'code'").get() as { c: number }).c;
  const totalSubjects = (getDb().prepare("SELECT COUNT(*) as c FROM subjects").get() as { c: number }).c;
  const totalApps = (getDb().prepare("SELECT COUNT(*) as c FROM my_apps").get() as { c: number }).c;

  return {
    totalNotes,
    totalPostits,
    totalTasks,
    completedTasks,
    pendingTasks: totalTasks - completedTasks,
    totalTables,
    totalCodes,
    totalSubjects,
    totalApps
  };
}

// Export / Import
export function exportFullData() {
  const subjects = getAllSubjects();
  const elements = getDb().prepare('SELECT * FROM elements').all();
  const apps = getAllApps();
  return {
    version: '2.0',
    exported_at: new Date().toISOString(),
    subjects,
    elements,
    apps
  };
}

export function importFullData(data: { subjects?: Subject[]; elements?: NotebookElement[]; apps?: MyApp[] }) {
  if (data.subjects && Array.isArray(data.subjects)) {
    getDb().exec('DELETE FROM subjects');
    const insertSub = getDb().prepare(`
      INSERT INTO subjects (id, name, color, icon, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const s of data.subjects) {
      insertSub.run(s.id, s.name, s.color, s.icon || '📚', s.sort_order || 0, s.created_at || new Date().toISOString());
    }
  }

  if (data.elements && Array.isArray(data.elements)) {
    getDb().exec('DELETE FROM elements');
    const insertElem = getDb().prepare(`
      INSERT INTO elements (
        id, subject_id, type, title, content, color, date, full_date,
        x, y, width, height, done, priority, meta_json, pinned, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const e of data.elements) {
      insertElem.run(
        e.id,
        e.subject_id,
        e.type,
        e.title || '',
        e.content || '',
        e.color || 'yellow',
        e.date,
        e.full_date,
        e.x || 40,
        e.y || 80,
        e.width || 340,
        e.height || 220,
        e.done ? 1 : 0,
        e.priority || 'media',
        e.meta_json || null,
        e.pinned ? 1 : 0,
        e.created_at || new Date().toISOString(),
        e.updated_at || new Date().toISOString()
      );
    }
  }

  if (data.apps && Array.isArray(data.apps)) {
    getDb().exec('DELETE FROM my_apps');
    const insertApp = getDb().prepare(`
      INSERT INTO my_apps (id, name, description, url, icon, category, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const a of data.apps) {
      insertApp.run(a.id, a.name, a.description, a.url, a.icon, a.category || 'Geral', a.sort_order || 0, a.created_at || new Date().toISOString());
    }
  }

  return true;
}
