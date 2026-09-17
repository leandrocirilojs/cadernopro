import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from './services/api';
import { Subject, NotebookElement, MyApp, CalendarActivity, ViewTab, ElementType, POSTIT_COLORS } from './types';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { CanvasView } from './components/views/CanvasView';
import { GridView } from './components/views/GridView';
import { TasksView } from './components/views/TasksView';
import { AppsView } from './components/views/AppsView';
import { SubjectModal } from './components/modals/SubjectModal';
import { AppModal } from './components/modals/AppModal';
import { StatsModal } from './components/modals/StatsModal';
import { BackupModal } from './components/modals/BackupModal';
import { AITutorModal } from './components/modals/AITutorModal';

export function App() {
  // Master state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<string>('');
  const [elements, setElements] = useState<NotebookElement[]>([]);
  const [apps, setApps] = useState<MyApp[]>([]);
  const [calendarActivity, setCalendarActivity] = useState<CalendarActivity[]>([]);
  
  // View & Filters
  const [activeView, setActiveView] = useState<ViewTab>('canvas');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'syncing' | 'error'>('connected');

  // Modals state
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [appModalOpen, setAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<MyApp | null>(null);

  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [aiTutorModalOpen, setAiTutorModalOpen] = useState(false);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setDbStatus('syncing');
      const [subs, appList, calAct] = await Promise.all([
        api.getSubjects(),
        api.getApps(),
        api.getCalendarActivity()
      ]);

      setSubjects(subs);
      setApps(appList);
      setCalendarActivity(calAct);

      if (subs.length > 0) {
        setActiveSubjectId(prev => prev || subs[0].id);
      }
      setDbStatus('connected');
    } catch (err) {
      console.error('Error loading initial data:', err);
      setDbStatus('error');
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load elements whenever subject, date filter, type filter, or search changes
  const loadElements = useCallback(async () => {
    if (!activeSubjectId && activeView !== 'apps') return;

    try {
      const data = await api.getElements({
        subjectId: activeSubjectId,
        date: selectedDateFilter || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        search: searchQuery || undefined
      });
      setElements(data);
    } catch (err) {
      console.error('Error loading elements:', err);
    }
  }, [activeSubjectId, selectedDateFilter, typeFilter, searchQuery, activeView]);

  useEffect(() => {
    loadElements();
  }, [loadElements]);

  // Refresh calendar activity helper
  const refreshCalendarActivity = async () => {
    try {
      const act = await api.getCalendarActivity();
      setCalendarActivity(act);
    } catch (e) {}
  };

  // Quick Insert Element Handler
  const handleQuickInsert = async (type: ElementType, extraData?: Partial<NotebookElement>) => {
    if (!activeSubjectId) return;

    // Calculate smart initial position on canvas
    const offsetIndex = elements.length % 6;
    const initialX = 50 + (offsetIndex % 3) * 360;
    const initialY = 100 + Math.floor(offsetIndex / 3) * 300;

    const defaultColor = type === 'postit' 
      ? POSTIT_COLORS[elements.filter(e => e.type === 'postit').length % POSTIT_COLORS.length].id 
      : undefined;

    let defaultTitle = extraData?.title;
    let defaultContent = extraData?.content || '';

    if (!defaultTitle) {
      if (type === 'note') defaultTitle = 'Nova Anotação';
      else if (type === 'table') defaultTitle = 'Planilha sem título';
      else if (type === 'code') defaultTitle = 'Script ADS';
    }

    const tableMetaJson = type === 'table' && !extraData?.meta_json 
      ? JSON.stringify({
          rows: 4,
          cols: 4,
          data: [
            ['', '', '', ''],
            ['', '', '', ''],
            ['', '', '', ''],
            ['', '', '', '']
          ]
        })
      : extraData?.meta_json;

    try {
      const newElem = await api.createElement({
        subject_id: activeSubjectId,
        type,
        title: defaultTitle,
        content: defaultContent,
        color: defaultColor,
        x: initialX,
        y: initialY,
        width: type === 'table' ? 480 : type === 'code' ? 440 : type === 'note' ? 420 : 320,
        height: type === 'table' ? 260 : 220,
        done: 0,
        priority: extraData?.priority || 'media',
        meta_json: tableMetaJson,
        ...extraData
      });

      setElements(prev => [...prev, newElem]);
      refreshCalendarActivity();
    } catch (err) {
      console.error('Error creating element:', err);
    }
  };

  // Update element
  const handleUpdateElement = async (id: string, updates: Partial<NotebookElement>) => {
    // Optimistic UI update
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));

    try {
      await api.updateElement(id, updates);
      if (updates.date) refreshCalendarActivity();
    } catch (err) {
      console.error('Error updating element:', err);
      loadElements(); // rollback
    }
  };

  // Update element position (drag and drop)
  const handleUpdatePosition = async (id: string, x: number, y: number) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, x, y } : el));
    try {
      await api.updateElementPosition(id, x, y);
    } catch (err) {
      console.error('Error updating position:', err);
    }
  };

  // Delete element
  const handleDeleteElement = async (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    try {
      await api.deleteElement(id);
      refreshCalendarActivity();
    } catch (err) {
      console.error('Error deleting element:', err);
      loadElements();
    }
  };

  // Subject Management
  const handleSaveSubject = async (data: { name: string; color: string; icon?: string }) => {
    try {
      if (editingSubject) {
        const updated = await api.updateSubject(editingSubject.id, data);
        setSubjects(prev => prev.map(s => s.id === updated.id ? updated : s));
      } else {
        const created = await api.createSubject(data);
        setSubjects(prev => [...prev, created]);
        setActiveSubjectId(created.id);
      }
      setEditingSubject(null);
    } catch (err) {
      console.error('Error saving subject:', err);
    }
  };

  const handleUpdateSubject = async (id: string, updates: Partial<Subject>) => {
    try {
      const updated = await api.updateSubject(id, updates);
      setSubjects(prev => prev.map(s => s.id === updated.id ? updated : s));
    } catch (err) {
      console.error('Error updating subject:', err);
    }
  };

  const handleDeleteSubject = async (subject: Subject) => {
    if (!window.confirm(`Tem certeza que deseja excluir a matéria "${subject.name}" e todas as suas anotações?`)) {
      return;
    }
    try {
      await api.deleteSubject(subject.id);
      const remaining = subjects.filter(s => s.id !== subject.id);
      setSubjects(remaining);
      if (activeSubjectId === subject.id && remaining.length > 0) {
        setActiveSubjectId(remaining[0].id);
      }
      refreshCalendarActivity();
    } catch (err) {
      console.error('Error deleting subject:', err);
    }
  };

  // Apps Management
  const handleSaveApp = async (data: { name: string; description: string; url: string; icon: string; category: string }) => {
    try {
      if (editingApp) {
        const updated = await api.updateApp(editingApp.id, data);
        setApps(prev => prev.map(a => a.id === updated.id ? updated : a));
      } else {
        const created = await api.createApp(data);
        setApps(prev => [...prev, created]);
      }
      setEditingApp(null);
    } catch (err) {
      console.error('Error saving app:', err);
    }
  };

  const handleDeleteApp = async (id: string) => {
    if (!window.confirm('Excluir este projeto do catálogo?')) return;
    try {
      await api.deleteApp(id);
      setApps(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error deleting app:', err);
    }
  };

  // Current Subject
  const currentSubject = useMemo(() => {
    return subjects.find(s => s.id === activeSubjectId);
  }, [subjects, activeSubjectId]);

  // Element counts by subject
  const elementCountsBySubject = useMemo(() => {
    const counts: Record<string, number> = {};
    subjects.forEach(s => {
      // In a real database we can show total or current
      counts[s.id] = s.id === activeSubjectId ? elements.length : 0;
    });
    return counts;
  }, [subjects, activeSubjectId, elements]);

  // Dedicated tasks list for tasks view
  const subjectTasks = useMemo(() => {
    return elements.filter(e => e.type === 'task');
  }, [elements]);

  return (
    <div id="app-root" className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Desktop and Drawer for Mobile) */}
      <div className={`fixed inset-y-0 left-0 z-50 transform md:relative md:translate-x-0 transition-transform duration-200 ease-in-out ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar
          subjects={subjects}
          activeSubjectId={activeSubjectId}
          onSelectSubject={(id) => {
            setActiveSubjectId(id);
            if (activeView === 'apps') setActiveView('canvas');
            setMobileSidebarOpen(false);
          }}
          onOpenNewSubjectModal={() => {
            setEditingSubject(null);
            setSubjectModalOpen(true);
          }}
          onEditSubject={(sub) => {
            setEditingSubject(sub);
            setSubjectModalOpen(true);
          }}
          onDeleteSubject={handleDeleteSubject}
          onQuickInsert={(type) => {
            if (activeView === 'apps') setActiveView('canvas');
            handleQuickInsert(type);
            setMobileSidebarOpen(false);
          }}
          selectedDateFilter={selectedDateFilter}
          onSelectDateFilter={setSelectedDateFilter}
          calendarActivity={calendarActivity}
          onOpenStatsModal={() => setStatsModalOpen(true)}
          onOpenExportModal={() => setBackupModalOpen(true)}
          onOpenAITutor={() => setAiTutorModalOpen(true)}
          dbStatus={dbStatus}
          elementCountsBySubject={elementCountsBySubject}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopHeader
          currentSubject={currentSubject}
          elementCount={elements.length}
          selectedDateFilter={selectedDateFilter}
          activeView={activeView}
          onChangeView={setActiveView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onOpenAITutor={() => setAiTutorModalOpen(true)}
          onPrint={() => window.print()}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
        />

        {/* Dynamic Views */}
        {activeView === 'canvas' && (
          <CanvasView
            elements={elements}
            onUpdateElement={handleUpdateElement}
            onUpdatePosition={handleUpdatePosition}
            onDeleteElement={handleDeleteElement}
            onAddNewElement={handleQuickInsert}
            activeSubjectName={currentSubject?.name || 'ADS'}
            currentSubject={currentSubject}
            onUpdateSubject={handleUpdateSubject}
          />
        )}

        {activeView === 'grid' && (
          <GridView
            elements={elements}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            onAddNewElement={handleQuickInsert}
          />
        )}

        {activeView === 'tasks' && (
          <TasksView
            tasks={subjectTasks}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            onAddNewElement={(type, extra) => handleQuickInsert(type, extra)}
            activeSubjectName={currentSubject?.name || 'ADS'}
          />
        )}

        {activeView === 'apps' && (
          <AppsView
            apps={apps}
            onAddNewApp={() => {
              setEditingApp(null);
              setAppModalOpen(true);
            }}
            onEditApp={(app) => {
              setEditingApp(app);
              setAppModalOpen(true);
            }}
            onDeleteApp={handleDeleteApp}
          />
        )}
      </main>

      {/* Modals */}
      <SubjectModal
        isOpen={subjectModalOpen}
        onClose={() => setSubjectModalOpen(false)}
        onSave={handleSaveSubject}
        initialSubject={editingSubject}
      />

      <AppModal
        isOpen={appModalOpen}
        onClose={() => setAppModalOpen(false)}
        onSave={handleSaveApp}
        initialApp={editingApp}
      />

      <StatsModal
        isOpen={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
      />

      <BackupModal
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
        onSuccessRestore={() => {
          loadInitialData();
          loadElements();
        }}
      />

      <AITutorModal
        isOpen={aiTutorModalOpen}
        onClose={() => setAiTutorModalOpen(false)}
        currentSubject={currentSubject}
        subjectElements={elements}
      />
    </div>
  );
}
export default App;
