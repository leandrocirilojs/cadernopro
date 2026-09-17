import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Layers, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Edit3, 
  Check, 
  ArrowRightLeft, 
  Grid, 
  FileText, 
  Sparkles,
  Copy,
  Info,
  Book,
  X,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Coffee,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotebookElement, ElementType, Subject, PaperStyle } from '../../types';
import { NoteCard } from '../elements/NoteCard';
import { PostitCard } from '../elements/PostitCard';
import { TableCard } from '../elements/TableCard';
import { TaskCard } from '../elements/TaskCard';
import { CodeCard } from '../elements/CodeCard';
import { FormatToolbar } from '../FormatToolbar';

interface CanvasViewProps {
  elements: NotebookElement[];
  onUpdateElement: (id: string, data: Partial<NotebookElement>) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onDeleteElement: (id: string) => void;
  onAddNewElement: (type: ElementType, extraData?: Partial<NotebookElement>) => void;
  activeSubjectName: string;
  currentSubject?: Subject;
  onUpdateSubject?: (id: string, data: Partial<Subject>) => void;
}

// Web Audio API lightweight paper rustle synthesizer (0 external dependencies)
function playPaperSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const duration = 0.14;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      const envelope = Math.sin(t * Math.PI) * Math.exp(-t * 3.2);
      data[i] = (Math.random() * 2 - 1) * envelope * 0.14;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + duration);
    filter.Q.value = 1.0;
    source.connect(filter);
    filter.connect(ctx.destination);
    source.start();
  } catch {
    // Ignore autoplay restriction
  }
}

export const CanvasView: React.FC<CanvasViewProps> = ({
  elements,
  onUpdateElement,
  onUpdatePosition,
  onDeleteElement,
  onAddNewElement,
  activeSubjectName,
  currentSubject,
  onUpdateSubject
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Page / Sheet management
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [direction, setDirection] = useState<number>(1); // +1 forward, -1 backward
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [paperStyle, setPaperStyle] = useState<PaperStyle>(currentSubject?.paperStyle || 'lines');
  
  // Custom total pages: at least the maximum page found in elements, or subject's totalPages, or 3 by default
  const maxElementPage = Math.max(1, ...elements.map(e => e.page || 1));
  const initialTotalPages = Math.max(maxElementPage, currentSubject?.totalPages || 3);
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages);

  // Sync if subject changes
  useEffect(() => {
    if (currentSubject?.totalPages && currentSubject.totalPages >= totalPages) {
      setTotalPages(currentSubject.totalPages);
    }
    if (currentSubject?.paperStyle) {
      setPaperStyle(currentSubject.paperStyle);
    }
  }, [currentSubject]);

  // Keep totalPages at least max element page
  useEffect(() => {
    if (maxElementPage > totalPages) {
      setTotalPages(maxElementPage);
    }
  }, [maxElementPage, totalPages]);

  // Modals & UI states
  const [showCreatePagesModal, setShowCreatePagesModal] = useState<boolean>(false);
  const [pagesToCreateInput, setPagesToCreateInput] = useState<number>(3);
  const [showNewNoteForm, setShowNewNoteForm] = useState<boolean>(false);
  const [newNoteTitle, setNewNoteTitle] = useState<string>('');
  const newNoteContentRef = useRef<HTMLDivElement>(null);
  const [movingElementId, setMovingElementId] = useState<string | null>(null);

  // Editable sheet title per page
  const [pageTitles, setPageTitles] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem(`caderno_page_titles_${currentSubject?.id || 'default'}`);
    return saved ? JSON.parse(saved) : {
      1: 'Folha 1: Introdução & Conceitos',
      2: 'Folha 2: Estruturas & Exercícios',
      3: 'Folha 3: Códigos & Prática'
    };
  });

  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [tempTitle, setTempTitle] = useState<string>('');

  // Persist page titles
  useEffect(() => {
    localStorage.setItem(`caderno_page_titles_${currentSubject?.id || 'default'}`, JSON.stringify(pageTitles));
  }, [pageTitles, currentSubject?.id]);

  // Elements for current page
  const pageElements = elements.filter(el => (el.page || 1) === currentPage);

  // Page turn handler
  const goToPage = useCallback((targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages || targetPage === currentPage) return;
    setDirection(targetPage > currentPage ? 1 : -1);
    setCurrentPage(targetPage);
    if (soundEnabled) playPaperSound();
  }, [currentPage, totalPages, soundEnabled]);

  // Reader Mode (Kindle Mode): Hides all surrounding UI, leaves only pure sheet & transitions
  const [isReaderMode, setIsReaderMode] = useState<boolean>(false);
  const [readerTheme, setReaderTheme] = useState<'paper' | 'sepia' | 'dark'>('paper');
  const [showReaderControls, setShowReaderControls] = useState<boolean>(true);
  const readerControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Responsive mobile zoom scale & screen detection
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
  });
  const [customZoom, setCustomZoom] = useState<number | null>(null);

  // Track window resize to adapt scale and detection automatically
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const isSmall = width < 1024;
      setIsSmallScreen(isSmall);

      if (customZoom === null) {
        if (width < 480) {
          // Mobile smartphones: fit smoothly around 1100px sheet base width
          const calculated = Math.min(1, Math.max(0.32, (width - 16) / 1120));
          setZoomScale(Number(calculated.toFixed(2)));
        } else if (width < 768) {
          // Large phones / small tablets
          const calculated = Math.min(1, Math.max(0.45, (width - 24) / 1120));
          setZoomScale(Number(calculated.toFixed(2)));
        } else if (width < 1024) {
          // Tablets / small laptops
          const calculated = Math.min(1, Math.max(0.65, (width - 40) / 1120));
          setZoomScale(Number(calculated.toFixed(2)));
        } else {
          setZoomScale(1);
        }
      } else {
        setZoomScale(customZoom);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [customZoom]);

  // Auto-hide floating reader controls after 3 seconds of inactivity
  const handleMouseMoveReader = () => {
    if (!isReaderMode) return;
    setShowReaderControls(true);
    if (readerControlsTimeoutRef.current) {
      clearTimeout(readerControlsTimeoutRef.current);
    }
    readerControlsTimeoutRef.current = setTimeout(() => {
      setShowReaderControls(false);
    }, 3200);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes reader mode
      if (e.key === 'Escape' && isReaderMode) {
        setIsReaderMode(false);
        return;
      }

      // Don't trigger if user is typing
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable ||
        target.closest('input') ||
        target.closest('textarea')
      ) {
        return;
      }

      if (e.key === 'ArrowLeft' && currentPage > 1) {
        e.preventDefault();
        goToPage(currentPage - 1);
      } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
        e.preventDefault();
        goToPage(currentPage + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, goToPage, isReaderMode]);

  // Create multiple pages
  const handleAddMultiplePages = (count: number) => {
    const newTotal = totalPages + count;
    setTotalPages(newTotal);
    if (currentSubject && onUpdateSubject) {
      onUpdateSubject(currentSubject.id, { totalPages: newTotal });
    }
    // Flip to first newly created page
    setDirection(1);
    setCurrentPage(totalPages + 1);
    if (soundEnabled) playPaperSound();
    setShowCreatePagesModal(false);
  };

  // Delete current page if safe
  const handleDeleteCurrentPage = () => {
    if (totalPages <= 1) {
      alert('O caderno precisa ter pelo menos 1 folha.');
      return;
    }

    if (pageElements.length > 0) {
      const confirmMove = window.confirm(
        `Esta folha contém ${pageElements.length} elemento(s). Deseja mover esses elementos para a Folha 1 antes de excluir a folha atual?`
      );
      if (confirmMove) {
        pageElements.forEach(el => onUpdateElement(el.id, { page: 1 }));
      } else {
        return;
      }
    }

    // Remap elements with higher pages
    elements.forEach(el => {
      if ((el.page || 1) > currentPage) {
        onUpdateElement(el.id, { page: (el.page || 1) - 1 });
      }
    });

    const newTotal = totalPages - 1;
    setTotalPages(newTotal);
    if (currentSubject && onUpdateSubject) {
      onUpdateSubject(currentSubject.id, { totalPages: newTotal });
    }

    const nextPage = Math.min(currentPage, newTotal);
    setDirection(-1);
    setCurrentPage(nextPage);
    if (soundEnabled) playPaperSound();
  };

  // Dragging state
  const draggingItem = useRef<{
    id: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    currentX: number;
    currentY: number;
    elementRef: HTMLElement | null;
  } | null>(null);

  // Dynamic canvas size calculation based on elements in current sheet
  const [contentMinHeight, setContentMinHeight] = useState<number>(760);
  const [sheetDimensions, setSheetDimensions] = useState({ minWidth: 1200, minHeight: 900 });
  const contentAreaRef = useRef<HTMLDivElement>(null);

  const updateSheetDimensions = useCallback(() => {
    let maxRight = 1100;
    let maxBottom = 700;

    // 1. Calculate from data properties
    pageElements.forEach(el => {
      const right = (el.x || 80) + (el.width || 420);
      const bottom = (el.y || 100) + (el.height || 260);
      if (right > maxRight) maxRight = right;
      if (bottom > maxBottom) maxBottom = bottom;
    });

    // 2. Measure actual rendered DOM items (which expand when user types notes, adds items or resizes)
    if (contentAreaRef.current) {
      const domItems = contentAreaRef.current.querySelectorAll('[id^="canvas-item-"]');
      domItems.forEach((node) => {
        const el = node as HTMLElement;
        const left = el.offsetLeft || 0;
        const top = el.offsetTop || 0;
        const w = el.offsetWidth || 0;
        const h = el.offsetHeight || 0;
        if (left + w > maxRight) maxRight = left + w;
        if (top + h > maxBottom) maxBottom = top + h;
      });
    }

    // Leave a generous 100px buffer below the lowest element so footer is never clipped or touching cards
    const calculatedContentHeight = Math.max(760, maxBottom + 100);
    const calculatedWidth = Math.max(1200, maxRight + 100);

    setContentMinHeight(calculatedContentHeight);
    setSheetDimensions({
      minWidth: calculatedWidth,
      minHeight: calculatedContentHeight + 140
    });
  }, [pageElements]);

  useEffect(() => {
    updateSheetDimensions();
    const timeout = setTimeout(updateSheetDimensions, 100);
    return () => clearTimeout(timeout);
  }, [updateSheetDimensions, currentPage]);

  // Use ResizeObserver & MutationObserver on contentAreaRef to react immediately when any note is typed into, expanded or resized
  useEffect(() => {
    const el = contentAreaRef.current;
    if (!el) return;

    let rafId: number | null = null;
    const scheduleUpdate = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        updateSheetDimensions();
      });
    };

    const resizeObserver = new ResizeObserver(() => {
      scheduleUpdate();
    });

    const mutationObserver = new MutationObserver(() => {
      scheduleUpdate();
    });

    resizeObserver.observe(el);
    mutationObserver.observe(el, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
      characterData: true
    });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [updateSheetDimensions]);

  const handleStartDrag = (e: any, element: NotebookElement) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'BUTTON' || 
      target.tagName === 'INPUT' || 
      target.tagName === 'SELECT' || 
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select')
    ) {
      return;
    }

    const targetElem = document.getElementById(`canvas-item-${element.id}`);
    if (!targetElem) return;

    let clientX = 0;
    let clientY = 0;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.clientX !== undefined) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return;
    }

    targetElem.style.zIndex = '999';
    targetElem.classList.add('shadow-2xl', 'scale-[1.02]', 'ring-2', 'ring-blue-400');

    draggingItem.current = {
      id: element.id,
      startX: clientX,
      startY: clientY,
      initialX: element.x,
      initialY: element.y,
      currentX: element.x,
      currentY: element.y,
      elementRef: targetElem
    };

    const updatePosition = (moveX: number, moveY: number) => {
      if (!draggingItem.current || !draggingItem.current.elementRef) return;
      const dx = moveX - draggingItem.current.startX;
      const dy = moveY - draggingItem.current.startY;
      const newX = Math.max(70, Math.round(draggingItem.current.initialX + dx));
      const newY = Math.max(90, Math.round(draggingItem.current.initialY + dy));

      draggingItem.current.currentX = newX;
      draggingItem.current.currentY = newY;
      draggingItem.current.elementRef.style.left = `${newX}px`;
      draggingItem.current.elementRef.style.top = `${newY}px`;

      // If dragged near or below current sheet content bottom, dynamically expand so footer moves away smoothly
      const itemH = draggingItem.current.elementRef.offsetHeight || 260;
      if (newY + itemH + 100 > contentMinHeight) {
        const expandedH = newY + itemH + 100;
        setContentMinHeight(expandedH);
        setSheetDimensions(prev => ({
          ...prev,
          minHeight: expandedH + 140
        }));
      }
    };

    const endDrag = () => {
      if (draggingItem.current) {
        const { id, currentX, currentY, elementRef } = draggingItem.current;
        if (elementRef) {
          elementRef.style.zIndex = element.pinned ? '15' : '1';
          elementRef.classList.remove('shadow-2xl', 'scale-[1.02]', 'ring-2', 'ring-blue-400');
        }
        onUpdatePosition(id, currentX, currentY);
      }
      draggingItem.current = null;
      cleanupListeners();
    };

    const handlePointerMove = (ev: PointerEvent) => {
      ev.preventDefault();
      updatePosition(ev.clientX, ev.clientY);
    };

    const handlePointerUp = () => endDrag();

    const handleTouchMove = (ev: TouchEvent) => {
      if (ev.touches.length > 0) {
        ev.preventDefault();
        updatePosition(ev.touches[0].clientX, ev.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => endDrag();

    const cleanupListeners = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
  };

  const handleCreateNoteFromForm = (e: React.FormEvent) => {
    e.preventDefault();
    const content = newNoteContentRef.current?.innerHTML || '';
    if (!newNoteTitle.trim() && !content.trim()) return;

    onAddNewElement('note', {
      title: newNoteTitle.trim() || 'Nova Anotação',
      content: content,
      page: currentPage,
      x: 90,
      y: 110
    });

    setNewNoteTitle('');
    if (newNoteContentRef.current) newNoteContentRef.current.innerHTML = '';
    setShowNewNoteForm(false);
  };

  // Move element to different page
  const handleMoveElementToPage = (elementId: string, targetPage: number) => {
    onUpdateElement(elementId, { page: targetPage });
    setMovingElementId(null);
    if (soundEnabled) playPaperSound();
  };

  // Generate spiral rings dynamically along the entire height of the notebook sheet (1 loop every ~44px)
  const ringCount = Math.max(18, Math.floor(sheetDimensions.minHeight / 44));
  const spiralLoops = Array.from({ length: ringCount }, (_, i) => i);

  return (
    <div 
      ref={containerRef}
      id="canvas-scroll-container" 
      className="flex-1 overflow-auto bg-slate-200/70 relative p-4 md:p-6 flex flex-col items-center select-none"
    >
      {/* 1. Top Notebook Control Bar */}
      <header className="w-full max-w-6xl mb-3 sm:mb-4 bg-white/95 backdrop-blur-md border border-slate-300/80 rounded-2xl shadow-sm p-2 sm:p-3 flex flex-wrap items-center justify-between gap-2 sm:gap-3 z-30">
        
        {/* Left: Quick Insert Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          <button
            id="new-note-toggle-btn"
            onClick={() => setShowNewNoteForm(!showNewNoteForm)}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showNewNoteForm ? 'Fechar' : '+ Anotação'}</span>
          </button>

          <button
            onClick={() => onAddNewElement('postit', { page: currentPage, x: 90, y: 110 })}
            className="px-2 sm:px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-xl border border-amber-200 transition"
          >
            + Post-it
          </button>

          <button
            onClick={() => onAddNewElement('task', { page: currentPage, x: 90, y: 110 })}
            className="px-2 sm:px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-xl border border-indigo-200 transition"
          >
            + Tarefa
          </button>

          <button
            onClick={() => onAddNewElement('code', { page: currentPage, x: 90, y: 110 })}
            className="px-2 sm:px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold rounded-xl border border-purple-200 transition"
          >
            + Código
          </button>

          <button
            onClick={() => onAddNewElement('table', { page: currentPage, x: 90, y: 110 })}
            className="px-2 sm:px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 transition"
          >
            + Tabela
          </button>
        </div>

        {/* Center: Page Flipping Navigation & Page Stamp */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100/90 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 shadow-inner">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            title="Página anterior (Seta ←)"
            className="p-1 rounded-lg text-slate-700 hover:bg-white hover:shadow-xs disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Folha {currentPage}/{totalPages}</span>
            <span className="text-[10px] font-medium text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 hidden sm:inline">
              {pageElements.length} item(s)
            </span>
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            title="Próxima página (Seta →)"
            className="p-1 rounded-lg text-slate-700 hover:bg-white hover:shadow-xs disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Choice of How Many Pages to Create, Paper Style & Audio */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Add 1 Quick Page */}
          <button
            onClick={() => {
              const newTotal = totalPages + 1;
              setTotalPages(newTotal);
              if (currentSubject && onUpdateSubject) {
                onUpdateSubject(currentSubject.id, { totalPages: newTotal });
              }
              setDirection(1);
              setCurrentPage(newTotal);
              if (soundEnabled) playPaperSound();
            }}
            title="Adicionar 1 folha e virar para ela"
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Folha</span>
          </button>

          {/* Button: Choose How Many Pages to Create */}
          <button
            onClick={() => setShowCreatePagesModal(true)}
            title="Escolher quantas folhas criar no caderno"
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Criar Folhas...</span>
            <span className="sm:hidden">Folhas...</span>
          </button>

          {/* Paper Texture Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => {
                setPaperStyle('lines');
                if (currentSubject && onUpdateSubject) onUpdateSubject(currentSubject.id, { paperStyle: 'lines' });
              }}
              title="Folha Pautada com Margem"
              className={`px-2 py-1 rounded-lg font-medium transition cursor-pointer ${paperStyle === 'lines' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Pautada
            </button>
            <button
              onClick={() => {
                setPaperStyle('grid');
                if (currentSubject && onUpdateSubject) onUpdateSubject(currentSubject.id, { paperStyle: 'grid' });
              }}
              title="Folha Quadriculada (Técnica/ADS)"
              className={`px-2 py-1 rounded-lg font-medium transition cursor-pointer ${paperStyle === 'grid' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Quadriculada
            </button>
            <button
              onClick={() => {
                setPaperStyle('dots');
                if (currentSubject && onUpdateSubject) onUpdateSubject(currentSubject.id, { paperStyle: 'dots' });
              }}
              title="Folha Pontilhada"
              className={`px-2 py-1 rounded-lg font-medium transition cursor-pointer ${paperStyle === 'dots' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Pontos
            </button>
            <button
              onClick={() => {
                setPaperStyle('blank');
                if (currentSubject && onUpdateSubject) onUpdateSubject(currentSubject.id, { paperStyle: 'blank' });
              }}
              title="Folha Lisa em Branco"
              className={`px-2 py-1 rounded-lg font-medium transition cursor-pointer ${paperStyle === 'blank' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Lisa
            </button>
          </div>

          {/* Responsive Zoom Controls (especially useful on mobile/tablets) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => {
                const next = Math.max(0.3, Number((zoomScale - 0.1).toFixed(2)));
                setCustomZoom(next);
                setZoomScale(next);
              }}
              title="Diminuir Zoom da Folha"
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[11px] font-bold text-slate-700 select-none min-w-[40px] text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => {
                const next = Math.min(1.4, Number((zoomScale + 0.1).toFixed(2)));
                setCustomZoom(next);
                setZoomScale(next);
              }}
              title="Aumentar Zoom da Folha"
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {customZoom !== null && (
              <button
                onClick={() => {
                  setCustomZoom(null);
                  const w = window.innerWidth;
                  if (w < 480) setZoomScale(Number(Math.min(1, Math.max(0.32, (w - 16) / 1120)).toFixed(2)));
                  else if (w < 768) setZoomScale(Number(Math.min(1, Math.max(0.45, (w - 24) / 1120)).toFixed(2)));
                  else if (w < 1024) setZoomScale(Number(Math.min(1, Math.max(0.65, (w - 40) / 1120)).toFixed(2)));
                  else setZoomScale(1);
                }}
                title="Ajustar automaticamente à tela"
                className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Som de folhear ativo' : 'Som de folhear desativado'}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${soundEnabled ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Modo Leitura / Kindle Mode Toggle */}
          <button
            onClick={() => setIsReaderMode(true)}
            title="Ativar Modo Leitura (Kindle) - Foco total na folha"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Book className="w-3.5 h-3.5 text-amber-400" />
            <span>Modo Leitura</span>
          </button>
        </div>
      </header>

      {/* 2. Top Notebook Divider Tabs (Abas de Caderno Universitário) */}
      <nav aria-label="Abas de Folhas do Caderno" className="w-full max-w-6xl flex items-end gap-1.5 overflow-x-auto pt-2 pb-0 px-2 -mb-px z-30 scrollbar-none">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
          const isActive = pageNum === currentPage;
          const count = elements.filter(el => (el.page || 1) === pageNum).length;
          return (
            <button
              key={`page-tab-${pageNum}`}
              onClick={() => goToPage(pageNum)}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-t border-x cursor-pointer shadow-xs whitespace-nowrap select-none ${
                isActive 
                  ? 'bg-[#fffefb] text-blue-700 border-slate-300 font-extrabold pb-2.5 z-30 translate-y-[1px]' 
                  : 'bg-slate-200/90 hover:bg-slate-100 text-slate-600 border-slate-300/80 hover:text-slate-800'
              }`}
            >
              <span>Folha {pageNum}</span>
              <span className={`text-[10px] px-1.5 py-0.5 font-semibold rounded-full ${isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-300/80 text-slate-600'}`}>
                {count}
              </span>
            </button>
          );
        })}

        <button
          onClick={() => setShowCreatePagesModal(true)}
          title="Criar mais folhas"
          className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-blue-700 hover:bg-white/80 rounded-t-xl transition cursor-pointer flex items-center gap-1.5 border border-dashed border-slate-300 bg-white/40 mb-[1px] whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Mais Folhas</span>
        </button>
      </nav>

      {/* Quick Note Inserter Form Floating Card */}
      {showNewNoteForm && (
        <form 
          onSubmit={handleCreateNoteFromForm}
          className="w-full max-w-lg mb-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl flex flex-col gap-2.5 z-30 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Criar Nova Anotação na Folha {currentPage}</span>
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">Pág. {currentPage}</span>
          </div>
          <input
            type="text"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            placeholder="Título da anotação (ex: Revisão de Algoritmos em Python)..."
            required
            className="w-full text-sm font-semibold px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg outline-none"
          />
          <FormatToolbar 
            onCommand={(cmd, val) => {
              if (newNoteContentRef.current) {
                newNoteContentRef.current.focus();
                document.execCommand(cmd, false, val);
              }
            }} 
          />
          <div
            ref={newNoteContentRef}
            contentEditable
            data-placeholder="Escreva o conteúdo aqui... (suporta texto rico, listas e códigos)"
            className="rich-text-content min-h-[90px] max-h-[220px] overflow-y-auto p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-400"
          />
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowNewNoteForm(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-xs cursor-pointer"
            >
              Inserir na Folha {currentPage}
            </button>
          </div>
        </form>
      )}

      {/* 3. The 3D Notebook Container with Page-Flip Transitions */}
      <div 
        className="w-full max-w-6xl notebook-page-flip-container relative mt-0 mb-8 z-10 overflow-x-auto pb-4 flex justify-center"
        style={{
          // When zoomed below 1, dynamically constrain container height so extra whitespace isn't excessive
          minHeight: zoomScale < 1 ? `${Math.round(860 * zoomScale)}px` : undefined
        }}
      >
        <div
          style={{
            transform: zoomScale !== 1 ? `scale(${zoomScale})` : undefined,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-out'
          }}
          className="w-full flex justify-center"
        >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`notebook-page-${currentPage}`}
            custom={direction}
            variants={{
              enter: (dir: number) => ({
                rotateY: dir > 0 ? 32 : -32,
                x: dir > 0 ? 70 : -70,
                opacity: 0,
                scale: 0.98,
                transformOrigin: dir > 0 ? 'left center' : 'right center'
              }),
              center: {
                rotateY: 0,
                x: 0,
                opacity: 1,
                scale: 1,
                transition: {
                  duration: 0.38,
                  ease: [0.22, 1, 0.36, 1]
                }
              },
              exit: (dir: number) => ({
                rotateY: dir > 0 ? -32 : 32,
                x: dir > 0 ? -70 : 70,
                opacity: 0,
                scale: 0.98,
                transformOrigin: dir > 0 ? 'left center' : 'right center',
                transition: {
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1]
                }
              })
            }}
            initial="enter"
            animate="center"
            exit="exit"
            id={`note-sheet-canvas-page-${currentPage}`}
            className={`w-full relative rounded-2xl border border-slate-300 notebook-sheet-shadow select-text flex flex-col justify-between ${
              paperStyle === 'lines' 
                ? 'notebook-paper-lined' 
                : paperStyle === 'grid' 
                  ? 'notebook-paper-grid' 
                  : paperStyle === 'dots' 
                    ? 'notebook-paper-dots' 
                    : 'notebook-paper-blank'
            }`}
            style={{
              minWidth: isSmallScreen ? `${Math.min(1100, Math.max(760, sheetDimensions.minWidth))}px` : `${Math.max(1100, sheetDimensions.minWidth)}px`,
              minHeight: `${Math.max(860, sheetDimensions.minHeight)}px`
            }}
          >
            {/* Left Spiral Binding Rings with punched holes */}
            <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between py-6 pointer-events-none z-20">
              {spiralLoops.map((idx) => (
                <div key={`spiral-ring-${idx}`} className="flex items-center pl-2 my-auto">
                  {/* Perforated hole */}
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-300 border border-slate-400 shadow-inner" />
                  {/* Spiral wire loop */}
                  <div className="w-8 h-2.5 -ml-3.5 spiral-ring rounded-full shadow-md transform -rotate-6" />
                </div>
              ))}
            </div>

            {/* Notebook Sheet Printed Header */}
            <header className="shrink-0 pl-16 pr-8 pt-6 pb-4 border-b border-slate-200/80 flex items-center justify-between gap-4 select-none">
              <div className="flex items-center gap-3">
                <span 
                  className="px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wider text-white shadow-xs"
                  style={{ backgroundColor: currentSubject?.color || '#3b82f6' }}
                >
                  {currentSubject?.icon || '📚'} {activeSubjectName}
                </span>

                {/* Editable Page Title */}
                {isEditingTitle ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      placeholder="Tema desta folha..."
                      autoFocus
                      className="text-sm font-semibold px-2 py-0.5 bg-white border border-blue-400 rounded outline-none"
                    />
                    <button
                      onClick={() => {
                        setPageTitles(prev => ({ ...prev, [currentPage]: tempTitle.trim() || `Folha ${currentPage}` }));
                        setIsEditingTitle(false);
                      }}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setTempTitle(pageTitles[currentPage] || `Folha ${currentPage}`);
                      setIsEditingTitle(true);
                    }}
                    title="Clique para editar o título desta folha"
                    className="flex items-center gap-1.5 text-sm font-bold text-slate-800 hover:text-blue-600 transition group cursor-pointer"
                  >
                    <span>{pageTitles[currentPage] || `Folha ${currentPage}`}</span>
                    <Edit3 className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                  </button>
                )}
              </div>

              {/* Date & Official Page Stamp */}
              <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
                <span className="hidden sm:inline bg-slate-100 px-2 py-1 rounded border border-slate-200">
                  Data: {new Date().toLocaleDateString('pt-BR')}
                </span>
                <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-md font-bold tracking-wider">
                  PÁGINA {String(currentPage).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
                </span>
              </div>
            </header>

            {/* Empty Sheet State */}
            {pageElements.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none z-10">
                <div className="w-16 h-16 rounded-2xl bg-white/90 border border-slate-200 shadow-sm flex items-center justify-center text-3xl mb-3">
                  📖
                </div>
                <h3 className="text-base font-bold text-slate-700">Folha {currentPage} em branco</h3>
                <p className="text-xs text-slate-500 max-w-sm text-center mt-1">
                  Esta folha está vazia. Use os botões na barra superior para adicionar anotações, post-its, códigos ou tabelas específicas para esta página.
                </p>
                <div className="mt-4 flex items-center gap-2 pointer-events-auto">
                  <button
                    onClick={() => onAddNewElement('note', { page: currentPage, x: 90, y: 110 })}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    + Anotação
                  </button>
                  <button
                    onClick={() => onAddNewElement('postit', { page: currentPage, x: 90, y: 110 })}
                    className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold rounded-xl border border-amber-300 transition cursor-pointer"
                  >
                    + Post-it
                  </button>
                  <button
                    onClick={() => onAddNewElement('code', { page: currentPage, x: 90, y: 110 })}
                    className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-semibold rounded-xl border border-purple-300 transition cursor-pointer"
                  >
                    + Código
                  </button>
                </div>
              </div>
            )}

            {/* Elements on Current Sheet */}
            <div 
              ref={contentAreaRef}
              className="relative w-full flex-1"
              style={{
                minHeight: `${contentMinHeight}px`
              }}
            >
              {pageElements.map((el) => {
                return (
                  <div
                    key={el.id}
                    id={`canvas-item-${el.id}`}
                    className="absolute select-text transition-shadow group"
                    style={{
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      zIndex: el.pinned ? 15 : 1
                    }}
                  >
                    {/* Quick Floating Move-To-Page Badge */}
                    <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-30 flex items-center bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg shadow-sm px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                      <span className="mr-1 text-slate-400">Folha {el.page || 1}</span>
                      {totalPages > 1 && (
                        <select
                          value={el.page || 1}
                          onChange={(e) => handleMoveElementToPage(el.id, Number(e.target.value))}
                          className="bg-transparent text-blue-600 font-bold outline-none cursor-pointer"
                          title="Mover elemento para outra folha"
                        >
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <option key={`opt-p-${p}`} value={p}>
                              Mover p/ Folha {p}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {el.type === 'note' && (
                      <NoteCard
                        element={el}
                        onUpdate={onUpdateElement}
                        onDelete={onDeleteElement}
                        isDraggable={true}
                        onMouseDownDrag={(e) => handleStartDrag(e, el)}
                      />
                    )}
                    {el.type === 'postit' && (
                      <PostitCard
                        element={el}
                        onUpdate={onUpdateElement}
                        onDelete={onDeleteElement}
                        isDraggable={true}
                        onMouseDownDrag={(e) => handleStartDrag(e, el)}
                      />
                    )}
                    {el.type === 'table' && (
                      <TableCard
                        element={el}
                        onUpdate={onUpdateElement}
                        onDelete={onDeleteElement}
                        isDraggable={true}
                        onMouseDownDrag={(e) => handleStartDrag(e, el)}
                      />
                    )}
                    {el.type === 'task' && (
                      <TaskCard
                        element={el}
                        onUpdate={onUpdateElement}
                        onDelete={onDeleteElement}
                        isDraggable={true}
                        onMouseDownDrag={(e) => handleStartDrag(e, el)}
                      />
                    )}
                    {el.type === 'code' && (
                      <CodeCard
                        element={el}
                        onUpdate={onUpdateElement}
                        onDelete={onDeleteElement}
                        isDraggable={true}
                        onMouseDownDrag={(e) => handleStartDrag(e, el)}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Notebook Sheet Bottom Stamp & Footer Controls */}
            <footer className="shrink-0 mt-auto pl-16 pr-8 py-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 select-none bg-white/40 backdrop-blur-xs z-10">
              <div className="flex items-center gap-2">
                <span className="font-serif italic text-slate-600 font-medium">Caderno ADS Pro</span>
                <span>•</span>
                <span>{pageElements.length} elemento(s) nesta folha</span>
              </div>

              <div className="flex items-center gap-3">
                {totalPages > 1 && (
                  <button
                    onClick={handleDeleteCurrentPage}
                    title="Excluir esta folha do caderno"
                    className="text-red-500 hover:text-red-700 flex items-center gap-1 font-medium transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Folha</span>
                  </button>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 disabled:opacity-40 hover:bg-slate-50 shadow-xs transition cursor-pointer"
                  >
                    ◀ Anterior
                  </button>
                  <span className="px-2.5 py-1 font-bold text-slate-700 bg-white/80 border border-slate-200/80 rounded shadow-2xs">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 disabled:opacity-40 hover:bg-slate-50 shadow-xs transition cursor-pointer"
                  >
                    Próxima ▶
                  </button>
                </div>
              </div>
            </footer>
          </motion.div>
        </AnimatePresence>
        </div>
      </div>

      {/* 4. Modal: Choose How Many Pages to Create */}
      {showCreatePagesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Criar Folhas no Caderno
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atualmente o caderno tem <span className="font-bold text-slate-700">{totalPages} folha(s)</span>.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreatePagesModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick presets */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                  Adicionar quantidade rápida:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 5].map((amt) => (
                    <button
                      key={`quick-add-${amt}`}
                      onClick={() => handleAddMultiplePages(amt)}
                      className="py-2.5 px-3 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-center text-xs font-bold text-slate-700 hover:text-blue-700 transition shadow-xs cursor-pointer"
                    >
                      +{amt} {amt === 1 ? 'Folha' : 'Folhas'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Ou escolha uma quantidade personalizada:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={pagesToCreateInput}
                    onChange={(e) => setPagesToCreateInput(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 text-center text-base font-bold px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none"
                  />
                  <span className="text-xs text-slate-500">novas folhas a adicionar</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Cada folha possui espaço próprio para anotações, post-its, códigos e tabelas, com efeito suave de virar a folha!
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreatePagesModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleAddMultiplePages(pagesToCreateInput)}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Criar {pagesToCreateInput} {pagesToCreateInput === 1 ? 'Folha' : 'Folhas'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 5. FULLSCREEN KINDLE READER MODE OVERLAY */}
      <AnimatePresence>
        {isReaderMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onMouseMove={handleMouseMoveReader}
            className={`fixed inset-0 z-50 overflow-y-auto flex flex-col items-center select-text ${
              readerTheme === 'sepia' 
                ? 'kindle-bg-sepia' 
                : readerTheme === 'dark' 
                  ? 'kindle-bg-dark' 
                  : 'kindle-bg-paper'
            }`}
          >
            {/* Kindle Floating Ambient Top Toolbar (Auto-hides on inactivity) */}
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: showReaderControls ? 0 : -30, opacity: showReaderControls ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="sticky top-2 sm:top-4 z-50 flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-2xl bg-black/85 backdrop-blur-md text-white border border-white/10 shadow-2xl text-xs select-none max-w-xl w-[96%] sm:w-[92%] my-2"
            >
              {/* Subject badge & Page info */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden">
                <Book className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                <span className="font-bold truncate max-w-[100px] sm:max-w-[180px]">
                  {activeSubjectName}
                </span>
                <span className="opacity-40">•</span>
                <span className="font-mono text-slate-300 font-semibold whitespace-nowrap text-[11px] sm:text-xs">
                  {currentPage}/{totalPages}
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Kindle Zoom / Fit controls on small screens */}
                <div className="flex items-center bg-white/10 p-0.5 rounded-xl border border-white/10 text-slate-200">
                  <button
                    onClick={() => {
                      const next = Math.max(0.3, Number((zoomScale - 0.1).toFixed(2)));
                      setCustomZoom(next);
                      setZoomScale(next);
                    }}
                    title="Diminuir Zoom"
                    className="p-1 hover:bg-white/20 rounded-lg transition cursor-pointer"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </button>
                  <span className="px-1 font-mono text-[10px] font-bold">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    onClick={() => {
                      const next = Math.min(1.4, Number((zoomScale + 0.1).toFixed(2)));
                      setCustomZoom(next);
                      setZoomScale(next);
                    }}
                    title="Aumentar Zoom"
                    className="p-1 hover:bg-white/20 rounded-lg transition cursor-pointer"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </button>
                </div>

                {/* Theme switchers (Paper, Sepia, Dark) */}
                <div className="flex items-center gap-0.5 sm:gap-1 bg-white/10 p-0.5 rounded-xl border border-white/10">
                  <button
                    onClick={() => setReaderTheme('paper')}
                    title="Folha Branca Natural"
                    className={`px-1.5 sm:px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition cursor-pointer ${
                      readerTheme === 'paper' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Papel
                  </button>
                  <button
                    onClick={() => setReaderTheme('sepia')}
                    title="Modo Sépia (Kindle Clássico)"
                    className={`px-1.5 sm:px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                      readerTheme === 'sepia' ? 'bg-[#fbf0d9] text-[#4a3525] shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Coffee className="w-3 h-3 hidden sm:inline" />
                    <span>Sépia</span>
                  </button>
                  <button
                    onClick={() => setReaderTheme('dark')}
                    title="Modo Escuro / Noturno"
                    className={`px-1.5 sm:px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                      readerTheme === 'dark' ? 'bg-slate-800 text-amber-300 shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Moon className="w-3 h-3 hidden sm:inline" />
                    <span>Noite</span>
                  </button>
                </div>

                {/* Close Reader Mode Button */}
                <button
                  onClick={() => setIsReaderMode(false)}
                  title="Sair do Modo Leitura (Esc)"
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-red-600/90 hover:bg-red-600 text-white rounded-xl font-bold transition cursor-pointer ml-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Sair</span>
                </button>
              </div>
            </motion.div>

            {/* Main Kindle Sheet Centered Stage */}
            <div 
              className="w-full flex-1 flex flex-col items-center justify-start sm:justify-center p-2 sm:p-6 md:p-10 notebook-page-flip-container relative overflow-x-auto"
              style={{
                minHeight: zoomScale < 1 ? `${Math.round(820 * zoomScale)}px` : undefined
              }}
            >
              <div
                style={{
                  transform: zoomScale !== 1 ? `scale(${zoomScale})` : undefined,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s ease-out'
                }}
                className="w-full flex justify-center"
              >
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={`kindle-page-${currentPage}`}
                  custom={direction}
                  variants={{
                    enter: (dir: number) => ({
                      rotateY: dir > 0 ? 32 : -32,
                      x: dir > 0 ? 80 : -80,
                      opacity: 0,
                      scale: 0.97,
                      transformOrigin: dir > 0 ? 'left center' : 'right center'
                    }),
                    center: {
                      rotateY: 0,
                      x: 0,
                      opacity: 1,
                      scale: 1,
                      transition: {
                        duration: 0.38,
                        ease: [0.22, 1, 0.36, 1]
                      }
                    },
                    exit: (dir: number) => ({
                      rotateY: dir > 0 ? -32 : 32,
                      x: dir > 0 ? -80 : 80,
                      opacity: 0,
                      scale: 0.97,
                      transformOrigin: dir > 0 ? 'left center' : 'right center',
                      transition: {
                        duration: 0.3,
                        ease: [0.22, 1, 0.36, 1]
                      }
                    })
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className={`relative rounded-2xl border flex flex-col justify-between transition-colors duration-200 ${
                    readerTheme === 'sepia' 
                      ? 'kindle-sheet-sepia border-[#e6d7b8]' 
                      : readerTheme === 'dark' 
                        ? 'kindle-sheet-dark border-slate-800' 
                        : 'kindle-sheet-paper border-slate-300'
                  }`}
                  style={{
                    width: '100%',
                    minWidth: isSmallScreen ? `${Math.min(1050, Math.max(760, sheetDimensions.minWidth))}px` : `${Math.max(1050, sheetDimensions.minWidth)}px`,
                    maxWidth: `${Math.max(1050, sheetDimensions.minWidth)}px`,
                    minHeight: `${Math.max(820, sheetDimensions.minHeight)}px`
                  }}
                >
                  {/* Spiral loops representation for realism in reader mode */}
                  <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between py-6 pointer-events-none z-20 opacity-85">
                    {spiralLoops.map((idx) => (
                      <div key={`kindle-spiral-${idx}`} className="flex items-center pl-2 my-auto">
                        <div className={`w-3.5 h-3.5 rounded-full border shadow-inner ${
                          readerTheme === 'dark' 
                            ? 'bg-slate-900 border-slate-800' 
                            : 'bg-slate-300/80 border-slate-400'
                        }`} />
                        <div className="w-8 h-2.5 -ml-3.5 spiral-ring rounded-full shadow-md transform -rotate-6" />
                      </div>
                    ))}
                  </div>

                  {/* Clean Page Title Header in Kindle Mode */}
                  <header className="shrink-0 pl-16 pr-8 pt-6 pb-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between gap-4 select-none">
                    <div className="flex items-center gap-3">
                      <span 
                        className="px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wider text-white shadow-xs"
                        style={{ backgroundColor: currentSubject?.color || '#3b82f6' }}
                      >
                        {currentSubject?.icon || '📚'} {activeSubjectName}
                      </span>
                      <span className="text-sm font-bold opacity-90">
                        {pageTitles[currentPage] || `Folha ${currentPage}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono opacity-70">
                      <span>PÁG. {currentPage} / {totalPages}</span>
                    </div>
                  </header>

                  {/* Clean Content Area */}
                  <div 
                    className="relative w-full flex-1"
                    style={{ minHeight: `${contentMinHeight}px` }}
                  >
                    {pageElements.length === 0 ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 select-none">
                        <BookOpen className="w-12 h-12 mb-2" />
                        <p className="text-sm font-medium">Folha em branco</p>
                      </div>
                    ) : (
                      pageElements.map((el) => (
                        <div
                          key={`kindle-el-${el.id}`}
                          className="absolute select-text"
                          style={{
                            left: `${el.x}px`,
                            top: `${el.y}px`,
                            zIndex: el.pinned ? 15 : 1
                          }}
                        >
                          {el.type === 'note' && (
                            <NoteCard
                              element={el}
                              onUpdate={onUpdateElement}
                              onDelete={onDeleteElement}
                              isDraggable={false}
                            />
                          )}
                          {el.type === 'postit' && (
                            <PostitCard
                              element={el}
                              onUpdate={onUpdateElement}
                              onDelete={onDeleteElement}
                              isDraggable={false}
                            />
                          )}
                          {el.type === 'table' && (
                            <TableCard
                              element={el}
                              onUpdate={onUpdateElement}
                              onDelete={onDeleteElement}
                              isDraggable={false}
                            />
                          )}
                          {el.type === 'task' && (
                            <TaskCard
                              element={el}
                              onUpdate={onUpdateElement}
                              onDelete={onDeleteElement}
                              isDraggable={false}
                            />
                          )}
                          {el.type === 'code' && (
                            <CodeCard
                              element={el}
                              onUpdate={onUpdateElement}
                              onDelete={onDeleteElement}
                              isDraggable={false}
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Clean Kindle Footer */}
                  <footer className="shrink-0 mt-auto pl-16 pr-8 py-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs opacity-70 select-none">
                    <span className="font-serif italic">Caderno ADS Pro • Leitura Concentrada</span>
                    <span className="font-mono">Folha {currentPage} de {totalPages}</span>
                  </footer>
                </motion.div>
              </AnimatePresence>
              </div>
            </div>

            {/* Kindle Floating Bottom Flipping Bar (Visible on mouse move, auto-hides) */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: showReaderControls ? 0 : 30, opacity: showReaderControls ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="sticky bottom-4 z-50 flex items-center justify-between gap-3 px-5 py-2.5 rounded-full bg-black/80 backdrop-blur-md text-white border border-white/10 shadow-2xl text-xs select-none max-w-sm w-[90%] my-2"
            >
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer font-bold"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <div className="font-mono font-bold text-amber-300">
                {currentPage} / {totalPages}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer font-bold"
              >
                <span>Próxima</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
