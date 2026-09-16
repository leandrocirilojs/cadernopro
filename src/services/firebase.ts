import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  writeBatch 
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Subject, NotebookElement, MyApp, CalendarActivity, NotebookStats } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use the provisioned database ID from firebase-applet-config.json
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Authenticate anonymously in background if available
let authPromise: Promise<any> | null = null;
export async function ensureAuth() {
  if (!authPromise) {
    authPromise = signInAnonymously(auth).catch(err => {
      console.warn('Firebase anonymous auth note:', err.message);
      return null;
    });
  }
  return authPromise;
}

// Initial seed data for ADS students
const INITIAL_SUBJECTS = [
  { id: 'sub_logica', name: 'Lógica e Algoritmos', color: '#d98b3f', icon: '📐', sort_order: 1 },
  { id: 'sub_banco_dados', name: 'Banco de Dados', color: '#3b82f6', icon: '🗄️', sort_order: 2 },
  { id: 'sub_eng_soft', name: 'Engenharia de Software', color: '#10b981', icon: '⚙️', sort_order: 3 },
  { id: 'sub_dev_web', name: 'Desenvolvimento Web', color: '#8b5cf6', icon: '🌐', sort_order: 4 },
  { id: 'sub_est_dados', name: 'Estrutura de Dados', color: '#ec4899', icon: '💻', sort_order: 5 }
];

const INITIAL_APPS: Omit<MyApp, 'id'>[] = [
  {
    name: 'Roadmap.sh',
    description: 'Trilhas de estudo completas para Backend, Frontend, DevOps e Ciência da Computação.',
    url: 'https://roadmap.sh',
    icon: '🗺️',
    category: 'Estudo',
    sort_order: 1,
    created_at: new Date().toISOString()
  },
  {
    name: 'VisuAlgo',
    description: 'Visualização interativa passo a passo de algoritmos e estruturas de dados em tempo real.',
    url: 'https://visualgo.net',
    icon: '📊',
    category: 'Simulador',
    sort_order: 2,
    created_at: new Date().toISOString()
  },
  {
    name: 'DB Fiddle (SQL Sandbox)',
    description: 'Teste e execute queries SQL em PostgreSQL, MySQL e SQLite diretamente no navegador.',
    url: 'https://www.db-fiddle.com',
    icon: '🗄️',
    category: 'Ferramenta',
    sort_order: 3,
    created_at: new Date().toISOString()
  },
  {
    name: 'MDN Web Docs',
    description: 'A maior documentação oficial para desenvolvedores web (HTML, CSS, JavaScript, Web APIs).',
    url: 'https://developer.mozilla.org',
    icon: '🌐',
    category: 'Referência',
    sort_order: 4,
    created_at: new Date().toISOString()
  },
  {
    name: 'LeetCode Brasil / Global',
    description: 'Resolução de problemas de programação para entrevistas técnicas e treino de lógica.',
    url: 'https://leetcode.com',
    icon: '⚡',
    category: 'Exercícios',
    sort_order: 5,
    created_at: new Date().toISOString()
  },
  {
    name: 'GitHub Education Pack',
    description: 'Benefícios gratuitos para estudantes de ADS: Copilot, domínios, servidores na nuvem e ferramentas.',
    url: 'https://education.github.com/pack',
    icon: '🎓',
    category: 'Benefícios',
    sort_order: 6,
    created_at: new Date().toISOString()
  }
];

function getFormattedDate(d = new Date()) {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function getFormattedFullDate(d = new Date()) {
  return `${getFormattedDate(d)}, ${d.toLocaleTimeString('pt-BR')}`;
}

// Seed initial elements if empty
async function seedInitialDataIfEmpty() {
  try {
    const subjectsSnap = await getDocs(collection(db, 'subjects'));
    if (subjectsSnap.empty) {
      console.log('Seeding initial subjects into Firebase Firestore...');
      const batch = writeBatch(db);
      
      const now = new Date().toISOString();
      for (const s of INITIAL_SUBJECTS) {
        const ref = doc(db, 'subjects', s.id);
        batch.set(ref, {
          ...s,
          created_at: now
        });
      }

      // Initial elements for sub_logica
      const dateStr = getFormattedDate();
      const fullDateStr = getFormattedFullDate();

      const elem1Ref = doc(db, 'notebook_elements', 'elem_init_note_1');
      batch.set(elem1Ref, {
        id: 'elem_init_note_1',
        subject_id: 'sub_logica',
        type: 'note',
        title: 'Estruturas de Controle e Laços em ADS',
        content: '<p>A lógica de programação é a base sólida de qualquer arquiteto de software. Os blocos fundamentais incluem:</p><ul><li><strong>Condicionais:</strong> <code>if / else if / else</code> e <code>switch case</code>.</li><li><strong>Repetições:</strong> <code>for</code> (quando sabemos o limite) e <code>while</code> (baseado em condição dinâmica).</li><li><strong>Dica de ouro:</strong> Sempre trate o caso de parada para evitar loops infinitos!</li></ul>',
        color: 'yellow',
        date: dateStr,
        full_date: fullDateStr,
        x: 40,
        y: 40,
        width: 440,
        height: 240,
        done: 0,
        priority: 'alta',
        pinned: 1,
        created_at: now,
        updated_at: now
      });

      const elem2Ref = doc(db, 'notebook_elements', 'elem_init_postit_1');
      batch.set(elem2Ref, {
        id: 'elem_init_postit_1',
        subject_id: 'sub_logica',
        type: 'postit',
        title: 'Lembrete de Prova',
        content: '📌 Entregar projeto de Algoritmos no GitHub da faculdade até sexta-feira às 23:59!',
        color: 'yellow',
        date: dateStr,
        full_date: fullDateStr,
        x: 520,
        y: 40,
        width: 320,
        height: 190,
        done: 0,
        priority: 'urgente',
        pinned: 0,
        created_at: now,
        updated_at: now
      });

      const elem3Ref = doc(db, 'notebook_elements', 'elem_init_task_1');
      batch.set(elem3Ref, {
        id: 'elem_init_task_1',
        subject_id: 'sub_logica',
        type: 'task',
        title: 'Implementar Busca Binária iterativa e recursiva',
        content: 'Criar uma implementação comparando o tempo de execução com uma Busca Linear tradicional em um array ordenado de 100.000 inteiros.',
        color: 'blue',
        date: dateStr,
        full_date: fullDateStr,
        x: 520,
        y: 250,
        width: 340,
        height: 200,
        done: 0,
        priority: 'alta',
        pinned: 0,
        created_at: now,
        updated_at: now
      });

      const elem4Ref = doc(db, 'notebook_elements', 'elem_init_code_1');
      batch.set(elem4Ref, {
        id: 'elem_init_code_1',
        subject_id: 'sub_logica',
        type: 'code',
        title: 'QuickSort com Pivô Central (Python)',
        content: `def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

print(quicksort([3, 6, 8, 10, 1, 2, 1]))`,
        color: 'purple',
        date: dateStr,
        full_date: fullDateStr,
        x: 40,
        y: 310,
        width: 440,
        height: 270,
        done: 0,
        priority: 'media',
        pinned: 0,
        meta_json: JSON.stringify({ language: 'python' }),
        created_at: now,
        updated_at: now
      });

      const elem5Ref = doc(db, 'notebook_elements', 'elem_init_table_1');
      batch.set(elem5Ref, {
        id: 'elem_init_table_1',
        subject_id: 'sub_logica',
        type: 'table',
        title: 'Complexidade de Algoritmos (Big-O)',
        content: '',
        color: 'mint',
        date: dateStr,
        full_date: fullDateStr,
        x: 40,
        y: 600,
        width: 440,
        height: 240,
        done: 0,
        priority: 'media',
        pinned: 0,
        meta_json: JSON.stringify({
          rows: 4,
          cols: 3,
          data: [
            ['Algoritmo', 'Melhor Caso', 'Pior Caso'],
            ['Busca Binária', 'O(1)', 'O(log n)'],
            ['Quick Sort', 'O(n log n)', 'O(n²)'],
            ['Merge Sort', 'O(n log n)', 'O(n log n)']
          ]
        }),
        created_at: now,
        updated_at: now
      });

      // Initial apps
      INITIAL_APPS.forEach((appItem, idx) => {
        const appRef = doc(db, 'my_apps', `app_${idx + 1}`);
        batch.set(appRef, {
          ...appItem,
          id: `app_${idx + 1}`
        });
      });

      await batch.commit();
      console.log('Firebase Firestore initialized with seed data!');
    }
  } catch (err) {
    console.error('Error checking or seeding Firebase Firestore:', err);
  }
}

// Ensure auth and initial seed
let initPromise: Promise<void> | null = null;
export async function initializeFirestoreService(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await ensureAuth();
      await seedInitialDataIfEmpty();
    })();
  }
  return initPromise;
}

// ==========================================
// FIRESTORE CRUD OPERATIONS
// ==========================================

export const firestoreService = {
  // Subjects
  async getSubjects(): Promise<Subject[]> {
    await initializeFirestoreService();
    const q = query(collection(db, 'subjects'));
    const snap = await getDocs(q);
    const subjects = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as Subject[];

    return subjects.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  },

  async createSubject(data: { name: string; color: string; icon?: string }): Promise<Subject> {
    await initializeFirestoreService();
    const existing = await this.getSubjects();
    const newId = `sub_${Date.now()}`;
    const newSubject: Subject = {
      id: newId,
      name: data.name,
      color: data.color || '#3b82f6',
      icon: data.icon || '📚',
      sort_order: existing.length + 1,
      created_at: new Date().toISOString()
    };

    await setDoc(doc(db, 'subjects', newId), newSubject);
    return newSubject;
  },

  async updateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
    await initializeFirestoreService();
    const subjectRef = doc(db, 'subjects', id);
    await updateDoc(subjectRef, { ...data });
    const snap = await getDoc(subjectRef);
    return { id: snap.id, ...snap.data() } as Subject;
  },

  async deleteSubject(id: string): Promise<boolean> {
    await initializeFirestoreService();
    await deleteDoc(doc(db, 'subjects', id));

    // Also cascade delete elements from this subject
    const elementsQuery = query(collection(db, 'notebook_elements'), where('subject_id', '==', id));
    const snap = await getDocs(elementsQuery);
    const batch = writeBatch(db);
    snap.forEach(d => batch.delete(d.ref));
    await batch.commit();

    return true;
  },

  // Elements
  async getElements(params?: {
    subjectId?: string;
    date?: string;
    type?: string;
    search?: string;
  }): Promise<NotebookElement[]> {
    await initializeFirestoreService();
    let q = query(collection(db, 'notebook_elements'));

    if (params?.subjectId) {
      q = query(q, where('subject_id', '==', params.subjectId));
    }

    const snap = await getDocs(q);
    let elements = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as NotebookElement[];

    if (params?.date) {
      elements = elements.filter(el => el.date === params.date);
    }

    if (params?.type && params.type !== 'all') {
      elements = elements.filter(el => el.type === params.type);
    }

    if (params?.search) {
      const s = params.search.toLowerCase();
      elements = elements.filter(el => 
        (el.title && el.title.toLowerCase().includes(s)) ||
        (el.content && el.content.toLowerCase().includes(s))
      );
    }

    // Sort: pinned first, then updated_at descending
    return elements.sort((a, b) => {
      if ((b.pinned || 0) !== (a.pinned || 0)) {
        return (b.pinned || 0) - (a.pinned || 0);
      }
      return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
    });
  },

  async createElement(data: Partial<NotebookElement>): Promise<NotebookElement> {
    await initializeFirestoreService();
    const newId = `elem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

    const element: NotebookElement = {
      id: newId,
      subject_id: data.subject_id || '',
      type: data.type || 'note',
      title: data.title || '',
      content: data.content || '',
      color: data.color || 'yellow',
      date: data.date || getFormattedDate(now),
      full_date: data.full_date || getFormattedFullDate(now),
      x: typeof data.x === 'number' ? data.x : 50,
      y: typeof data.y === 'number' ? data.y : 50,
      width: data.width || 340,
      height: data.height || 220,
      done: data.done || 0,
      priority: data.priority || 'media',
      pinned: data.pinned || 0,
      meta_json: data.meta_json || '',
      page: typeof data.page === 'number' ? data.page : 1,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    await setDoc(doc(db, 'notebook_elements', newId), element);
    return element;
  },

  async updateElement(id: string, data: Partial<NotebookElement>): Promise<NotebookElement> {
    await initializeFirestoreService();
    const elemRef = doc(db, 'notebook_elements', id);
    const updates = {
      ...data,
      updated_at: new Date().toISOString()
    };
    await updateDoc(elemRef, updates);
    const snap = await getDoc(elemRef);
    return { id: snap.id, ...snap.data() } as NotebookElement;
  },

  async updateElementPosition(id: string, x: number, y: number): Promise<void> {
    await initializeFirestoreService();
    const elemRef = doc(db, 'notebook_elements', id);
    await updateDoc(elemRef, {
      x,
      y,
      updated_at: new Date().toISOString()
    });
  },

  async deleteElement(id: string): Promise<boolean> {
    await initializeFirestoreService();
    await deleteDoc(doc(db, 'notebook_elements', id));
    return true;
  },

  // Apps
  async getApps(): Promise<MyApp[]> {
    await initializeFirestoreService();
    const snap = await getDocs(collection(db, 'my_apps'));
    const apps = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as MyApp[];

    return apps.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  },

  async createApp(data: { name: string; description: string; url: string; icon: string; category?: string }): Promise<MyApp> {
    await initializeFirestoreService();
    const newId = `app_${Date.now()}`;
    const existing = await this.getApps();
    const newApp: MyApp = {
      id: newId,
      name: data.name,
      description: data.description || '',
      url: data.url,
      icon: data.icon || '🚀',
      category: data.category || 'Geral',
      sort_order: existing.length + 1,
      created_at: new Date().toISOString()
    };

    await setDoc(doc(db, 'my_apps', newId), newApp);
    return newApp;
  },

  async updateApp(id: string, data: Partial<MyApp>): Promise<MyApp> {
    await initializeFirestoreService();
    const appRef = doc(db, 'my_apps', id);
    await updateDoc(appRef, { ...data });
    const snap = await getDoc(appRef);
    return { id: snap.id, ...snap.data() } as MyApp;
  },

  async deleteApp(id: string): Promise<boolean> {
    await initializeFirestoreService();
    await deleteDoc(doc(db, 'my_apps', id));
    return true;
  },

  // Calendar Activities
  async getCalendarActivity(): Promise<CalendarActivity[]> {
    await initializeFirestoreService();
    const snap = await getDocs(collection(db, 'notebook_elements'));
    const dateCounts = new Map<string, { count: number; types: Set<string> }>();

    snap.forEach(d => {
      const el = d.data() as NotebookElement;
      if (!el.date) return;
      const current = dateCounts.get(el.date) || { count: 0, types: new Set<string>() };
      current.count += 1;
      if (el.type) current.types.add(el.type);
      dateCounts.set(el.date, current);
    });

    const results: CalendarActivity[] = [];
    dateCounts.forEach((val, date) => {
      results.push({
        date,
        count: val.count,
        types: Array.from(val.types).join(',')
      });
    });

    return results;
  },

  // Statistics
  async getStats(): Promise<NotebookStats> {
    await initializeFirestoreService();
    const [elementsSnap, subjectsSnap, appsSnap] = await Promise.all([
      getDocs(collection(db, 'notebook_elements')),
      getDocs(collection(db, 'subjects')),
      getDocs(collection(db, 'my_apps'))
    ]);

    let totalNotes = 0;
    let totalPostits = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    let pendingTasks = 0;
    let totalTables = 0;
    let totalCodes = 0;

    elementsSnap.forEach(d => {
      const el = d.data() as NotebookElement;
      if (el.type === 'note') totalNotes++;
      else if (el.type === 'postit') totalPostits++;
      else if (el.type === 'table') totalTables++;
      else if (el.type === 'code') totalCodes++;
      else if (el.type === 'task') {
        totalTasks++;
        if (el.done === 1) completedTasks++;
        else pendingTasks++;
      }
    });

    return {
      totalNotes,
      totalPostits,
      totalTasks,
      completedTasks,
      pendingTasks,
      totalTables,
      totalCodes,
      totalSubjects: subjectsSnap.size,
      totalApps: appsSnap.size
    };
  },

  // Export Full Data from Firestore
  async exportFullData(): Promise<any> {
    await initializeFirestoreService();
    const [subjectsSnap, elementsSnap, appsSnap] = await Promise.all([
      getDocs(collection(db, 'subjects')),
      getDocs(collection(db, 'notebook_elements')),
      getDocs(collection(db, 'my_apps'))
    ]);

    return {
      database: 'Firebase Firestore',
      projectId: firebaseConfig.projectId,
      firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
      exported_at: new Date().toISOString(),
      subjects: subjectsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      elements: elementsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      apps: appsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    };
  },

  // Import / Restore Full Data into Firestore
  async importFullData(jsonData: any): Promise<{ success: boolean; message: string }> {
    await initializeFirestoreService();
    if (!jsonData) throw new Error('Dados de backup vazios');

    const batch = writeBatch(db);

    if (Array.isArray(jsonData.subjects)) {
      for (const s of jsonData.subjects) {
        if (s.id) {
          batch.set(doc(db, 'subjects', s.id), s);
        }
      }
    }

    if (Array.isArray(jsonData.elements)) {
      for (const el of jsonData.elements) {
        if (el.id) {
          batch.set(doc(db, 'notebook_elements', el.id), el);
        }
      }
    }

    if (Array.isArray(jsonData.apps)) {
      for (const app of jsonData.apps) {
        if (app.id) {
          batch.set(doc(db, 'my_apps', app.id), app);
        }
      }
    }

    await batch.commit();
    return { success: true, message: 'Dados restaurados com sucesso no Firebase Firestore!' };
  }
};
