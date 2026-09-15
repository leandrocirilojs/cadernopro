import React, { useRef, useState } from 'react';

interface ResizeHandleProps {
  cardRef: React.RefObject<HTMLDivElement | null>;
  elementId: string;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  onResizeEnd: (id: string, width: number, height: number) => void;
  colorClass?: string;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  cardRef,
  elementId,
  initialWidth = 360,
  initialHeight = 220,
  minWidth = 240,
  minHeight = 140,
  onResizeEnd,
  colorClass = 'text-slate-400 hover:text-blue-600'
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [currentDims, setCurrentDims] = useState<{ w: number; h: number } | null>(null);

  const resizeState = useRef<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    finalWidth: number;
    finalHeight: number;
  } | null>(null);

  const handleStartResize = (e: any) => {
    // Prevent event bubbling so card drag is NOT triggered
    e.stopPropagation();

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

    const cardEl = cardRef.current;
    if (!cardEl) return;

    const rect = cardEl.getBoundingClientRect();
    const startW = Math.round(rect.width) || initialWidth;
    const startH = Math.round(rect.height) || initialHeight;

    resizeState.current = {
      startX: clientX,
      startY: clientY,
      startWidth: startW,
      startHeight: startH,
      finalWidth: startW,
      finalHeight: startH
    };

    setIsResizing(true);
    setCurrentDims({ w: startW, h: startH });

    cardEl.classList.add('ring-2', 'ring-blue-400', 'shadow-xl');

    const updateSize = (moveX: number, moveY: number) => {
      if (!resizeState.current || !cardRef.current) return;
      const dx = moveX - resizeState.current.startX;
      const dy = moveY - resizeState.current.startY;

      const newW = Math.max(minWidth, Math.round(resizeState.current.startWidth + dx));
      const newH = Math.max(minHeight, Math.round(resizeState.current.startHeight + dy));

      resizeState.current.finalWidth = newW;
      resizeState.current.finalHeight = newH;

      cardRef.current.style.width = `${newW}px`;
      cardRef.current.style.height = `${newH}px`;
      setCurrentDims({ w: newW, h: newH });
    };

    const handlePointerMove = (ev: PointerEvent) => {
      ev.preventDefault();
      updateSize(ev.clientX, ev.clientY);
    };

    const handleTouchMove = (ev: TouchEvent) => {
      if (ev.touches.length > 0) {
        ev.preventDefault(); // Stop mobile browser scrolling while resizing
        updateSize(ev.touches[0].clientX, ev.touches[0].clientY);
      }
    };

    const handleMouseMove = (ev: MouseEvent) => {
      ev.preventDefault();
      updateSize(ev.clientX, ev.clientY);
    };

    const endResize = () => {
      if (resizeState.current) {
        const { finalWidth, finalHeight } = resizeState.current;
        onResizeEnd(elementId, finalWidth, finalHeight);
      }
      if (cardRef.current) {
        cardRef.current.classList.remove('ring-2', 'ring-blue-400', 'shadow-xl');
      }
      setIsResizing(false);
      setCurrentDims(null);
      resizeState.current = null;
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', endResize);
      window.removeEventListener('pointercancel', endResize);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', endResize);
      window.removeEventListener('touchcancel', endResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', endResize);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', endResize);
    window.addEventListener('pointercancel', endResize);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', endResize);
    window.addEventListener('touchcancel', endResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', endResize);
  };

  return (
    <>
      {/* Dimension preview tag during resize */}
      {isResizing && currentDims && (
        <div className="absolute -bottom-7 right-0 z-50 bg-slate-900/90 text-white text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md shadow-md backdrop-blur-xs pointer-events-none whitespace-nowrap">
          {currentDims.w} × {currentDims.h}px
        </div>
      )}

      {/* Resize Handle Button / Grip */}
      <div
        id={`resize-handle-${elementId}`}
        className={`absolute bottom-0 right-0 w-7 h-7 flex items-end justify-end p-1 select-none touch-none cursor-se-resize transition-opacity rounded-br-2xl z-20 ${colorClass}`}
        style={{ touchAction: 'none' }}
        onPointerDown={handleStartResize}
        onTouchStart={handleStartResize}
        onMouseDown={handleStartResize}
        title="Arraste para redimensionar (largura e altura)"
      >
        <svg
          className="w-3.5 h-3.5 opacity-60 hover:opacity-100 active:opacity-100 transition"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <line x1="11" y1="3" x2="3" y2="11" />
          <line x1="11" y1="7" x2="7" y2="11" />
          <line x1="11" y1="11" x2="11" y2="11" />
        </svg>
      </div>
    </>
  );
};
