import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { GoogleGenAI } from '@google/genai';
import {
  initDb,
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getElements,
  createElement,
  updateElement,
  deleteElement,
  updateElementPosition,
  getAllApps,
  createApp,
  updateApp,
  deleteApp,
  getDatesWithActivity,
  getNotebookStats,
  exportFullData,
  importFullData
} from './server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database
initDb();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Gemini AI initialization
let aiClient: GoogleGenAI | null = null;
function getAIClient() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// ==========================================
// API ROUTES
// ==========================================

// Health / Status
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'firebase-firestore', timestamp: new Date().toISOString() });
});

// Subjects
app.get('/api/subjects', (req, res) => {
  try {
    const subjects = getAllSubjects();
    res.json(subjects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/subjects', (req, res) => {
  try {
    const { name, color, icon } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nome da matéria é obrigatório' });
    }
    const newSubject = createSubject({ name: name.trim(), color: color || '#3b82f6', icon });
    res.status(201).json(newSubject);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/subjects/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, icon } = req.body;
    const updated = updateSubject(id, { name, color, icon });
    if (!updated) {
      return res.status(404).json({ error: 'Matéria não encontrada' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/subjects/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = deleteSubject(id);
    if (!success) {
      return res.status(404).json({ error: 'Matéria não encontrada' });
    }
    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Elements (Notes, Post-its, Tables, Tasks, Code)
app.get('/api/elements', (req, res) => {
  try {
    const { subjectId, date, type, search } = req.query as {
      subjectId?: string;
      date?: string;
      type?: string;
      search?: string;
    };
    const elements = getElements(subjectId, date, type, search);
    res.json(elements);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/elements', (req, res) => {
  try {
    const data = req.body;
    if (!data.subject_id) {
      return res.status(400).json({ error: 'subject_id é obrigatório' });
    }
    const created = createElement(data);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/elements/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updated = updateElement(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Elemento não encontrado' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Drag position update
app.patch('/api/elements/:id/position', (req, res) => {
  try {
    const { id } = req.params;
    const { x, y } = req.body;
    if (typeof x !== 'number' || typeof y !== 'number') {
      return res.status(400).json({ error: 'Coordenadas inválidas' });
    }
    const ok = updateElementPosition(id, x, y);
    res.json({ success: ok, id, x, y });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/elements/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = deleteElement(id);
    if (!success) {
      return res.status(404).json({ error: 'Elemento não encontrado' });
    }
    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// My Apps Catalog
app.get('/api/apps', (req, res) => {
  try {
    const apps = getAllApps();
    res.json(apps);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/apps', (req, res) => {
  try {
    const { name, description, url, icon, category } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: 'Nome e URL do aplicativo são obrigatórios' });
    }
    const newApp = createApp({ name, description, url, icon: icon || '🚀', category });
    res.status(201).json(newApp);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/apps/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updated = updateApp(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'App não encontrado' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/apps/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = deleteApp(id);
    if (!success) {
      return res.status(404).json({ error: 'App não encontrado' });
    }
    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Activity dates for Calendar
app.get('/api/calendar/activity', (req, res) => {
  try {
    const activity = getDatesWithActivity();
    res.json(activity);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Statistics
app.get('/api/stats', (req, res) => {
  try {
    const stats = getNotebookStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export Database as JSON
app.get('/api/database/export', (req, res) => {
  try {
    const data = exportFullData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=caderno_ads_backup_${Date.now()}.json`);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Import / Restore Database
app.post('/api/database/import', (req, res) => {
  try {
    const data = req.body;
    if (!data || (!data.subjects && !data.elements && !data.apps)) {
      return res.status(400).json({ error: 'Formato de backup inválido' });
    }
    importFullData(data);
    res.json({ success: true, message: 'Banco de dados restaurado com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Study Assistant (Gemini)
app.post('/api/ai/study-assistant', async (req, res) => {
  try {
    const { prompt, context, type } = req.body;
    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Chave do Gemini API não configurada no servidor. Cadastre GEMINI_API_KEY nos segredos para ativar o tutor de IA.'
      });
    }

    let systemInstruction = 'Você é um professor e tutor universitário especialista em Análise e Desenvolvimento de Sistemas (ADS), Engenharia de Software e Ciência da Computação. Suas explicações devem ser claras, didáticas, em português do Brasil, com exemplos práticos de código quando aplicável.';
    
    if (type === 'summary') {
      systemInstruction += ' O usuário quer um resumo estruturado e direto dos tópicos das anotações fornecidas.';
    } else if (type === 'quiz') {
      systemInstruction += ' O usuário quer 3 a 5 perguntas de múltipla escolha com gabarito comentado para praticar para a prova da matéria.';
    } else if (type === 'explain-code') {
      systemInstruction += ' O usuário quer a explicação passo a passo da lógica do código e possíveis melhorias ou complexidade assintótica.';
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Contexto do Caderno de Estudos:\n${context || 'Geral'}\n\nSolicitação do aluno:\n${prompt}`,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ response: response.text });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao processar com IA' });
  }
});

// ==========================================
// CODE RUNNER / INTERPRETER ENDPOINT
// ==========================================
app.post('/api/code/execute', async (req, res) => {
  const { code, language = 'javascript', input = '' } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({
      success: false,
      output: '',
      error: 'Nenhum código fornecido para execução.'
    });
  }

  const lang = String(language).toLowerCase().trim();
  const startTime = Date.now();

  // HTML / CSS preview representation
  if (lang === 'html' || lang === 'css') {
    return res.json({
      success: true,
      output: 'Código HTML/CSS pronto para visualização.',
      isHtml: true,
      htmlContent: code,
      executionTimeMs: Date.now() - startTime
    });
  }

  // Create temporary directory for execution
  let tmpDir = '';
  try {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ads-runner-'));
    let command = '';
    let args: string[] = [];
    let scriptFile = '';

    if (lang === 'python' || lang === 'py') {
      scriptFile = path.join(tmpDir, 'main.py');
      fs.writeFileSync(scriptFile, code, 'utf-8');
      command = 'python3';
      args = ['-u', scriptFile];
    } else if (lang === 'javascript' || lang === 'js') {
      scriptFile = path.join(tmpDir, 'main.mjs');
      fs.writeFileSync(scriptFile, code, 'utf-8');
      command = 'node';
      args = [scriptFile];
    } else if (lang === 'typescript' || lang === 'ts') {
      scriptFile = path.join(tmpDir, 'main.ts');
      fs.writeFileSync(scriptFile, code, 'utf-8');
      const localTsx = path.join(process.cwd(), 'node_modules', '.bin', 'tsx');
      command = fs.existsSync(localTsx) ? localTsx : 'tsx';
      args = [scriptFile];
    } else if (lang === 'sql') {
      // Execute SQL via Python in-memory SQLite wrapper
      scriptFile = path.join(tmpDir, 'runner_sql.py');
      const pySqlWrapper = [
        'import sys',
        'import sqlite3',
        '',
        'raw_sql = sys.stdin.read()',
        "statements = [s.strip() for s in raw_sql.split(';') if s.strip()]",
        '',
        "conn = sqlite3.connect(':memory:')",
        'cursor = conn.cursor()',
        'query_count = 0',
        '',
        'for stmt in statements:',
        '    try:',
        '        cursor.execute(stmt)',
        '        if cursor.description:',
        '            cols = [c[0] for c in cursor.description]',
        '            rows = cursor.fetchall()',
        '            query_count += 1',
        '            print(f"--- [Query {query_count}] ---")',
        '            col_w = [len(str(c)) for c in cols]',
        '            for r in rows:',
        '                for i, v in enumerate(r):',
        '                    col_w[i] = max(col_w[i], len(str(v)))',
        '            header = " | ".join(str(c).ljust(col_w[i]) for i, c in enumerate(cols))',
        '            div = "-+-".join("-" * col_w[i] for i in range(len(cols)))',
        '            print(header)',
        '            print(div)',
        '            for r in rows:',
        '                print(" | ".join(str(v).ljust(col_w[i]) for i, v in enumerate(r)))',
        '            print(f"({len(rows)} registro(s) retornado(s))\\n")',
        '        else:',
        '            conn.commit()',
        '            print(f"✓ Instrução executada com sucesso. ({cursor.rowcount} linha(s) afetada(s))")',
        '    except Exception as e:',
        '        print(f"✕ Erro SQL: {e}")'
      ].join('\n');
      fs.writeFileSync(scriptFile, pySqlWrapper, 'utf-8');
      command = 'python3';
      args = ['-u', scriptFile];
    } else if (lang === 'bash' || lang === 'sh') {
      scriptFile = path.join(tmpDir, 'script.sh');
      fs.writeFileSync(scriptFile, code, 'utf-8');
      command = 'bash';
      args = [scriptFile];
    } else {
      // For compiled languages without local SDK in container (e.g. Java, C++), provide friendly simulation notice
      return res.json({
        success: false,
        output: '',
        error: 'O ambiente do container tem suporte nativo a execução e interpretação de Python 3, Node.js (JavaScript), TypeScript, consultas SQL e Bash. Para ' + language + ', recomendamos compilar em sua IDE local.',
        executionTimeMs: Date.now() - startTime
      });
    }

    // Spawn process with 10-second timeout guard
    const child = spawn(command, args, {
      cwd: tmpDir,
      timeout: 10000,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1',
        NODE_ENV: 'development'
      }
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      if (stdout.length > 50000) {
        child.kill();
        stdout += '\n[Saída truncada: limite de 50.000 caracteres atingido]';
      }
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    if (lang === 'sql') {
      child.stdin.write(code);
      child.stdin.end();
    } else if (input) {
      child.stdin.write(input);
      child.stdin.end();
    }

    child.on('close', (exitCode) => {
      // Clean up tmp files
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch (err) {}

      const executionTimeMs = Date.now() - startTime;
      res.json({
        success: exitCode === 0,
        output: stdout,
        error: stderr,
        exitCode,
        executionTimeMs
      });
    });

    child.on('error', (err) => {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch (e) {}

      res.status(500).json({
        success: false,
        output: '',
        error: `Falha ao iniciar processo: ${err.message}`,
        executionTimeMs: Date.now() - startTime
      });
    });
  } catch (err: any) {
    if (tmpDir) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch (e) {}
    }
    res.status(500).json({
      success: false,
      output: '',
      error: `Erro durante a execução: ${err.message}`,
      executionTimeMs: Date.now() - startTime
    });
  }
});

// ==========================================
// VITE DEV SERVER OR PRODUCTION STATIC
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Caderno ADS Pro] Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
