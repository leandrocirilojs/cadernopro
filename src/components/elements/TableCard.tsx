import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  GripVertical,
  X,
  Plus,
  Trash2,
  Download,
  Upload,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sigma,
  Sparkles,
  Search,
  Check,
  FileSpreadsheet,
  HelpCircle
} from 'lucide-react';
import { NotebookElement, TableData } from '../../types';
import { ResizeHandle } from './ResizeHandle';

interface TableCardProps {
  element: NotebookElement;
  onUpdate: (id: string, data: Partial<NotebookElement>) => void;
  onDelete: (id: string) => void;
  isDraggable?: boolean;
  onMouseDownDrag?: (e: any) => void;
}

// Convert column index (0, 1, 2...) to Excel letter (A, B, C... Z, AA...)
const colToLetter = (colIndex: number): string => {
  let temp = colIndex;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
};

// Parse Excel coordinate like "A1", "B3" into row and col indices
const parseCellCoord = (coord: string): { row: number; col: number } | null => {
  const match = coord.trim().toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  const letters = match[1];
  const row = parseInt(match[2], 10) - 1;
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  col -= 1;
  return { row, col };
};

// Evaluate basic Excel formulas like =SUM(A1:A5), =AVERAGE(B1:B3), =COUNT(A1:A10), =MAX(C1:C4), =MIN(C1:C4), =A1+B1
const evaluateFormula = (formula: string, matrix: string[][]): string => {
  try {
    const raw = formula.substring(1).trim().toUpperCase();

    // Range-based formulas: SUM, AVERAGE / MEDIA, COUNT / CONTAR, MAX, MIN
    const rangeMatch = raw.match(/^(SUM|SOMA|AVERAGE|MEDIA|COUNT|CONTAR|MAX|MIN)\(([A-Z0-9]+):([A-Z0-9]+)\)$/);
    if (rangeMatch) {
      const func = rangeMatch[1];
      const start = parseCellCoord(rangeMatch[2]);
      const end = parseCellCoord(rangeMatch[3]);

      if (!start || !end) return '#REF!';

      const rMin = Math.min(start.row, end.row);
      const rMax = Math.max(start.row, end.row);
      const cMin = Math.min(start.col, end.col);
      const cMax = Math.max(start.col, end.col);

      const nums: number[] = [];
      for (let r = rMin; r <= rMax; r++) {
        for (let c = cMin; c <= cMax; c++) {
          if (matrix[r] && matrix[r][c] !== undefined) {
            let valStr = matrix[r][c].trim();
            // If the referenced cell itself is a formula, prevent infinite loops by simple number check
            if (valStr.startsWith('=')) {
              valStr = evaluateFormula(valStr, matrix);
            }
            const valNum = parseFloat(valStr.replace(',', '.'));
            if (!isNaN(valNum)) {
              nums.push(valNum);
            }
          }
        }
      }

      if (func === 'SUM' || func === 'SOMA') {
        const sum = nums.reduce((acc, n) => acc + n, 0);
        return Number.isInteger(sum) ? sum.toString() : sum.toFixed(2).replace(/\.?0+$/, '');
      }
      if (func === 'AVERAGE' || func === 'MEDIA') {
        if (nums.length === 0) return '0';
        const avg = nums.reduce((acc, n) => acc + n, 0) / nums.length;
        return Number.isInteger(avg) ? avg.toString() : avg.toFixed(2).replace(/\.?0+$/, '');
      }
      if (func === 'COUNT' || func === 'CONTAR') {
        return nums.length.toString();
      }
      if (func === 'MAX') {
        return nums.length ? Math.max(...nums).toString() : '0';
      }
      if (func === 'MIN') {
        return nums.length ? Math.min(...nums).toString() : '0';
      }
    }

    // Direct cell arithmetic like =A1+B1, =A1*2, =A1/B1, =A1-B1
    let expression = raw.replace(/([A-Z]+)(\d+)/g, (_match, letters, rowDigits) => {
      const coord = parseCellCoord(letters + rowDigits);
      if (!coord || !matrix[coord.row] || matrix[coord.row][coord.col] === undefined) {
        return '0';
      }
      let val = matrix[coord.row][coord.col].trim();
      if (val.startsWith('=')) {
        val = evaluateFormula(val, matrix);
      }
      const num = parseFloat(val.replace(',', '.'));
      return isNaN(num) ? '0' : num.toString();
    });

    // Clean expression to only permit numbers and basic math operators
    if (/^[0-9+\-*/().\s]+$/.test(expression)) {
      // Safe evaluation of simple arithmetic
      const result = Function(`"use strict"; return (${expression})`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return Number.isInteger(result) ? result.toString() : result.toFixed(2).replace(/\.?0+$/, '');
      }
    }

    return '#VALOR!';
  } catch (err) {
    return '#ERRO!';
  }
};

export const TableCard: React.FC<TableCardProps> = ({
  element,
  onUpdate,
  onDelete,
  isDraggable = true,
  onMouseDownDrag
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tableData, setTableData] = useState<TableData>(() => {
    if (element.meta_json) {
      try {
        const parsed = JSON.parse(element.meta_json);
        if (parsed && Array.isArray(parsed.data)) {
          return parsed;
        }
      } catch (e) {
        // fallback to empty
      }
    }
    // Cria uma planilha limpa/vazia pronta para preenchimento pelo usuário
    const defaultRows = 4;
    const defaultCols = 4;
    return {
      rows: defaultRows,
      cols: defaultCols,
      data: Array.from({ length: defaultRows }, () => Array(defaultCols).fill(''))
    };
  });

  const [title, setTitle] = useState(element.title || 'Planilha ADS');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Selected cell state (Excel-like)
  const [activeCell, setActiveCell] = useState<{ r: number; c: number } | null>({ r: 0, c: 0 });
  const [editingCell, setEditingCell] = useState<{ r: number; c: number } | null>(null);
  const [formulaBarValue, setFormulaBarValue] = useState<string>('');
  const [showFormulaHelp, setShowFormulaHelp] = useState(false);

  // Styling state per cell (bold, italic, align)
  const [formatting, setFormatting] = useState<{
    [key: string]: { bold?: boolean; italic?: boolean; align?: 'left' | 'center' | 'right' };
  }>({});

  // Sync if element prop changes from outside
  useEffect(() => {
    if (element.meta_json) {
      try {
        const parsed = JSON.parse(element.meta_json);
        setTableData(parsed);
      } catch (e) {}
    }
  }, [element.meta_json]);

  // Keep formula bar in sync with active cell
  useEffect(() => {
    if (activeCell && tableData.data[activeCell.r] && tableData.data[activeCell.r][activeCell.c] !== undefined) {
      setFormulaBarValue(tableData.data[activeCell.r][activeCell.c]);
    } else {
      setFormulaBarValue('');
    }
  }, [activeCell, tableData]);

  const saveTable = (newData: TableData) => {
    setTableData(newData);
    onUpdate(element.id, {
      meta_json: JSON.stringify(newData)
    });
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const updatedMatrix = tableData.data.map((row, r) =>
      row.map((cell, c) => (r === rowIndex && c === colIndex ? value : cell))
    );
    saveTable({
      ...tableData,
      data: updatedMatrix
    });
    setFormulaBarValue(value);
  };

  const handleFormulaBarChange = (val: string) => {
    setFormulaBarValue(val);
    if (activeCell) {
      handleCellChange(activeCell.r, activeCell.c, val);
    }
  };

  // Precompute evaluated matrix for instant rendering of formulas
  const evaluatedMatrix = useMemo(() => {
    return tableData.data.map((row, r) =>
      row.map((cell, c) => {
        if (typeof cell === 'string' && cell.startsWith('=')) {
          return evaluateFormula(cell, tableData.data);
        }
        return cell;
      })
    );
  }, [tableData.data]);

  // Add / Remove operations
  const insertRowBelow = (targetRow?: number) => {
    const idx = targetRow !== undefined ? targetRow + 1 : tableData.rows;
    const newRow = Array(tableData.cols).fill('');
    const newData = [...tableData.data];
    newData.splice(idx, 0, newRow);
    saveTable({
      rows: tableData.rows + 1,
      cols: tableData.cols,
      data: newData
    });
    if (activeCell) {
      setActiveCell({ r: idx, c: activeCell.c });
    }
  };

  const deleteRow = (targetRow?: number) => {
    if (tableData.rows <= 1) return;
    const idx = targetRow !== undefined ? targetRow : (activeCell ? activeCell.r : tableData.rows - 1);
    const newData = tableData.data.filter((_, r) => r !== idx);
    saveTable({
      rows: tableData.rows - 1,
      cols: tableData.cols,
      data: newData
    });
    if (activeCell && activeCell.r >= newData.length) {
      setActiveCell({ r: Math.max(0, newData.length - 1), c: activeCell.c });
    }
  };

  const insertColRight = (targetCol?: number) => {
    const idx = targetCol !== undefined ? targetCol + 1 : tableData.cols;
    const newData = tableData.data.map((row) => {
      const copy = [...row];
      copy.splice(idx, 0, '');
      return copy;
    });
    saveTable({
      rows: tableData.rows,
      cols: tableData.cols + 1,
      data: newData
    });
    if (activeCell) {
      setActiveCell({ r: activeCell.r, c: idx });
    }
  };

  const deleteCol = (targetCol?: number) => {
    if (tableData.cols <= 1) return;
    const idx = targetCol !== undefined ? targetCol : (activeCell ? activeCell.c : tableData.cols - 1);
    const newData = tableData.data.map((row) => row.filter((_, c) => c !== idx));
    saveTable({
      rows: tableData.rows,
      cols: tableData.cols - 1,
      data: newData
    });
    if (activeCell && activeCell.c >= (tableData.cols - 1)) {
      setActiveCell({ r: activeCell.r, c: Math.max(0, tableData.cols - 2) });
    }
  };

  // Keyboard navigation like Excel
  const handleKeyDownCell = (e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        if (c > 0) setActiveCell({ r, c: c - 1 });
        else if (r > 0) setActiveCell({ r: r - 1, c: tableData.cols - 1 });
      } else {
        if (c < tableData.cols - 1) setActiveCell({ r, c: c + 1 });
        else if (r < tableData.rows - 1) setActiveCell({ r: r + 1, c: 0 });
        else {
          insertRowBelow();
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (r < tableData.rows - 1) {
        setActiveCell({ r: r + 1, c });
      } else {
        insertRowBelow(r);
      }
    } else if (e.key === 'ArrowUp' && !editingCell && r > 0) {
      setActiveCell({ r: r - 1, c });
    } else if (e.key === 'ArrowDown' && !editingCell && r < tableData.rows - 1) {
      setActiveCell({ r: r + 1, c });
    } else if (e.key === 'ArrowLeft' && !editingCell && c > 0) {
      setActiveCell({ r, c: c - 1 });
    } else if (e.key === 'ArrowRight' && !editingCell && c < tableData.cols - 1) {
      setActiveCell({ r, c: c + 1 });
    }
  };

  // Formatting toggles for active cell
  const toggleBold = () => {
    if (!activeCell) return;
    const key = `${activeCell.r}-${activeCell.c}`;
    setFormatting((prev) => ({
      ...prev,
      [key]: { ...prev[key], bold: !prev[key]?.bold }
    }));
  };

  const toggleItalic = () => {
    if (!activeCell) return;
    const key = `${activeCell.r}-${activeCell.c}`;
    setFormatting((prev) => ({
      ...prev,
      [key]: { ...prev[key], italic: !prev[key]?.italic }
    }));
  };

  const setAlign = (align: 'left' | 'center' | 'right') => {
    if (!activeCell) return;
    const key = `${activeCell.r}-${activeCell.c}`;
    setFormatting((prev) => ({
      ...prev,
      [key]: { ...prev[key], align }
    }));
  };

  // Formula insertion helper
  const insertFormulaQuick = (type: 'SUM' | 'AVERAGE' | 'COUNT') => {
    if (!activeCell) return;
    const currentC = activeCell.c;
    const colLetter = colToLetter(currentC);
    const startRow = 1; // 1-based index (header is row 1)
    const endRow = Math.max(1, activeCell.r);
    const formulaStr = `=${type}(${colLetter}${startRow}:${colLetter}${endRow})`;
    handleCellChange(activeCell.r, activeCell.c, formulaStr);
  };

  // Export CSV
  const exportCSV = () => {
    const csvContent = evaluatedMatrix
      .map((row) => row.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title || 'planilha'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const parsedRows = lines.map((line) => {
        // Simple regex parser for CSV handling quoted entries
        const row: string[] = [];
        let inQuotes = false;
        let current = '';
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            row.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        row.push(current.trim());
        return row;
      });

      if (parsedRows.length > 0) {
        const maxCols = Math.max(...parsedRows.map((r) => r.length));
        const normalized = parsedRows.map((r) => {
          while (r.length < maxCols) r.push('');
          return r;
        });
        saveTable({
          rows: normalized.length,
          cols: maxCols,
          data: normalized
        });
      }
    };
    reader.readAsText(file);
  };

  const activeCellCoord = activeCell
    ? `${colToLetter(activeCell.c)}${activeCell.r + 1}`
    : 'A1';

  return (
    <div
      ref={cardRef}
      id={`table-card-${element.id}`}
      className="bg-white border border-slate-300/80 rounded-2xl p-3 shadow-md flex flex-col relative transition-all hover:border-emerald-300 font-sans group"
      style={{
        width: isDraggable ? `${element.width || Math.max(520, tableData.cols * 130 + 70)}px` : '100%',
        height: isDraggable && element.height ? `${element.height}px` : undefined,
        minHeight: '260px'
      }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold text-slate-700 select-none touch-none py-1 px-1.5 rounded-lg active:bg-slate-100 ${
            isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          style={{ touchAction: 'none' }}
          onPointerDown={isDraggable ? onMouseDownDrag : undefined}
          onTouchStart={isDraggable ? onMouseDownDrag : undefined}
          onMouseDown={isDraggable ? onMouseDownDrag : undefined}
          title={isDraggable ? 'Arraste para mover no quadro (touch/mouse)' : undefined}
        >
          {isDraggable && <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />}
          <div className="flex items-center gap-1 text-emerald-700 font-bold">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Planilha ADS</span>
            <span className="text-[10px] font-normal text-slate-400">
              ({tableData.rows}L × {tableData.cols}C)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Formula helper trigger */}
          <button
            type="button"
            onClick={() => setShowFormulaHelp(!showFormulaHelp)}
            className={`p-1.5 rounded transition text-xs flex items-center gap-1 ${
              showFormulaHelp ? 'bg-emerald-100 text-emerald-800' : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'
            }`}
            title="Ajuda com Fórmulas do Excel (=SOMA, =MEDIA...)"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          {/* Import CSV */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded transition"
            title="Importar arquivo CSV / Excel"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleImportCSV}
            className="hidden"
          />

          {/* Export CSV */}
          <button
            type="button"
            onClick={exportCSV}
            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded transition"
            title="Exportar como arquivo .CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Delete Card */}
          <button
            type="button"
            onClick={() => onDelete(element.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition ml-1"
            title="Excluir tabela"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editable Title */}
      <div className="mb-2">
        {isEditingTitle ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              setIsEditingTitle(false);
              onUpdate(element.id, { title });
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditingTitle(false);
                onUpdate(element.id, { title });
              }
            }}
            autoFocus
            className="w-full text-xs font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded border border-emerald-400 outline-none"
          />
        ) : (
          <h4
            onClick={() => setIsEditingTitle(true)}
            className="text-xs font-bold text-slate-800 hover:bg-slate-50 px-1.5 py-0.5 rounded cursor-pointer transition inline-flex items-center gap-1.5"
            title="Clique para renomear a planilha"
          >
            <span>{title}</span>
            <span className="text-[10px] text-slate-400 font-normal">✎</span>
          </h4>
        )}
      </div>

      {/* Excel Ribbon Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2 bg-slate-50/90 p-1.5 rounded-xl border border-slate-200 text-xs">
        {/* Formatting actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleBold}
            className={`p-1 rounded hover:bg-slate-200 transition ${
              activeCell && formatting[`${activeCell.r}-${activeCell.c}`]?.bold
                ? 'bg-slate-300 text-slate-900 font-bold'
                : 'text-slate-600'
            }`}
            title="Negrito na célula ativa"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleItalic}
            className={`p-1 rounded hover:bg-slate-200 transition ${
              activeCell && formatting[`${activeCell.r}-${activeCell.c}`]?.italic
                ? 'bg-slate-300 text-slate-900 font-bold'
                : 'text-slate-600'
            }`}
            title="Itálico na célula ativa"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => setAlign('left')}
            className="p-1 rounded hover:bg-slate-200 text-slate-600 transition"
            title="Alinhar à esquerda"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setAlign('center')}
            className="p-1 rounded hover:bg-slate-200 text-slate-600 transition"
            title="Centralizar"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setAlign('right')}
            className="p-1 rounded hover:bg-slate-200 text-slate-600 transition"
            title="Alinhar à direita"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-slate-300 mx-1" />

          {/* Quick formula buttons */}
          <button
            type="button"
            onClick={() => insertFormulaQuick('SUM')}
            className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold border border-emerald-200 flex items-center gap-1 transition"
            title="Inserir =SOMA() na coluna da célula"
          >
            <Sigma className="w-3 h-3" />
            <span>Σ Soma</span>
          </button>
          <button
            type="button"
            onClick={() => insertFormulaQuick('AVERAGE')}
            className="px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold border border-blue-200 transition"
            title="Inserir =MEDIA() na coluna da célula"
          >
            x̄ Média
          </button>
        </div>

        {/* Row and Col Controls */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-slate-200">
            <span className="text-[10px] text-slate-500 font-medium mr-1">Linha:</span>
            <button
              type="button"
              onClick={() => insertRowBelow(activeCell ? activeCell.r : undefined)}
              className="p-0.5 hover:bg-emerald-50 text-emerald-700 rounded transition"
              title="Inserir linha abaixo"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => deleteRow(activeCell ? activeCell.r : undefined)}
              className="p-0.5 hover:bg-rose-50 text-rose-600 rounded transition"
              title="Excluir linha selecionada"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-slate-200">
            <span className="text-[10px] text-slate-500 font-medium mr-1">Coluna:</span>
            <button
              type="button"
              onClick={() => insertColRight(activeCell ? activeCell.c : undefined)}
              className="p-0.5 hover:bg-emerald-50 text-emerald-700 rounded transition"
              title="Inserir coluna à direita"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => deleteCol(activeCell ? activeCell.c : undefined)}
              className="p-0.5 hover:bg-rose-50 text-rose-600 rounded transition"
              title="Excluir coluna selecionada"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Excel Formula Bar (fx) */}
      <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-slate-100 rounded-lg border border-slate-200">
        <div className="w-12 text-center text-xs font-mono font-bold text-slate-700 bg-white border border-slate-300 rounded py-0.5 shadow-2xs">
          {activeCellCoord}
        </div>
        <div className="text-xs font-mono font-bold text-emerald-700 select-none">
          ƒx
        </div>
        <input
          type="text"
          value={formulaBarValue}
          onChange={(e) => handleFormulaBarChange(e.target.value)}
          placeholder="Digite um valor ou fórmula (ex: =SUM(A1:A5), =A2+B2, =AVERAGE(C1:C10))"
          className="flex-1 bg-white px-2 py-0.5 rounded text-xs font-mono text-slate-800 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {/* Formula Help Callout */}
      {showFormulaHelp && (
        <div className="mb-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1 animate-in fade-in">
          <div className="font-bold flex items-center justify-between text-emerald-800">
            <span>Fórmulas Suportadas estilo Excel:</span>
            <button
              type="button"
              onClick={() => setShowFormulaHelp(false)}
              className="text-emerald-600 hover:text-emerald-900"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
            <div>• <code className="bg-white px-1 rounded">=SUM(A1:A5)</code> ou <code className="bg-white px-1 rounded">=SOMA(...)</code></div>
            <div>• <code className="bg-white px-1 rounded">=AVERAGE(B1:B10)</code> ou <code className="bg-white px-1 rounded">=MEDIA(...)</code></div>
            <div>• <code className="bg-white px-1 rounded">=COUNT(C1:C10)</code> (Contar números)</div>
            <div>• <code className="bg-white px-1 rounded">=MAX(A1:A10)</code> / <code className="bg-white px-1 rounded">=MIN(A1:A10)</code></div>
            <div>• Operações Diretas: <code className="bg-white px-1 rounded">=A2+B2</code>, <code className="bg-white px-1 rounded">=C1*1.2</code>, <code className="bg-white px-1 rounded">=A1/B1</code></div>
            <div>• Navegação: <span className="font-sans text-[11px] text-slate-600">Tab (próxima), Shift+Tab (anterior), Enter (baixo)</span></div>
          </div>
        </div>
      )}

      {/* Spreadsheet Grid Container */}
      <div className="flex-1 overflow-auto border border-slate-300 rounded-lg min-h-[140px] bg-white select-none">
        <table className="w-full text-xs text-left border-collapse border-spacing-0">
          <thead>
            {/* Top row: Column Letters (A, B, C...) */}
            <tr className="bg-slate-100 text-slate-600 font-semibold sticky top-0 z-10 select-none">
              {/* Corner header */}
              <th className="w-10 min-w-10 max-w-10 border border-slate-300 bg-slate-200/80 text-center py-1 text-[11px] text-slate-500">
                #
              </th>
              {Array.from({ length: tableData.cols }).map((_, c) => {
                const isColActive = activeCell?.c === c;
                return (
                  <th
                    key={`col-head-${c}`}
                    className={`border border-slate-300 text-center py-1 px-2 text-[11px] font-mono min-w-[100px] transition-colors ${
                      isColActive ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    {colToLetter(c)}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {tableData.data.map((row, r) => {
              const isRowActive = activeCell?.r === r;
              return (
                <tr key={`row-${r}`} className="hover:bg-slate-50/50">
                  {/* Row Number Header (1, 2, 3...) */}
                  <td
                    className={`border border-slate-300 text-center py-1 text-[11px] font-mono select-none transition-colors ${
                      isRowActive ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {r + 1}
                  </td>

                  {/* Table Cells */}
                  {row.map((cellRaw, c) => {
                    const isSelected = activeCell?.r === r && activeCell?.c === c;
                    const isEditing = editingCell?.r === r && editingCell?.c === c;
                    const isFormula = typeof cellRaw === 'string' && cellRaw.startsWith('=');
                    const displayValue = isEditing ? cellRaw : evaluatedMatrix[r][c];

                    const cellFormat = formatting[`${r}-${c}`] || {};
                    const isFirstRow = r === 0;

                    return (
                      <td
                        key={`cell-${r}-${c}`}
                        onClick={() => {
                          setActiveCell({ r, c });
                        }}
                        onDoubleClick={() => {
                          setActiveCell({ r, c });
                          setEditingCell({ r, c });
                        }}
                        className={`border border-slate-200 p-0 relative min-w-[100px] transition-colors ${
                          isSelected
                            ? 'ring-2 ring-emerald-500 ring-inset z-5 bg-emerald-50/30'
                            : isFirstRow
                            ? 'bg-slate-50/60'
                            : 'bg-white'
                        }`}
                      >
                        <input
                          type="text"
                          value={displayValue}
                          onChange={(e) => handleCellChange(r, c, e.target.value)}
                          onFocus={() => {
                            setActiveCell({ r, c });
                            setEditingCell({ r, c });
                          }}
                          onBlur={() => {
                            setEditingCell(null);
                          }}
                          onKeyDown={(e) => handleKeyDownCell(e, r, c)}
                          style={{
                            textAlign: cellFormat.align || (isFirstRow ? 'center' : 'left'),
                            fontWeight: cellFormat.bold || isFirstRow ? 'bold' : 'normal',
                            fontStyle: cellFormat.italic ? 'italic' : 'normal'
                          }}
                          className={`w-full h-full px-2 py-1.5 text-xs outline-none bg-transparent transition font-sans ${
                            isFormula && !isEditing ? 'text-emerald-700 font-semibold' : 'text-slate-800'
                          }`}
                        />

                        {/* Formula indicator badge in corner */}
                        {isFormula && !isEditing && (
                          <span
                            className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full"
                            title={`Fórmula: ${cellRaw}`}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Spreadsheet Status Footer */}
      <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <div className="flex items-center gap-2">
          <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            {activeCellCoord} selecionada
          </span>
          <span className="text-[10px] text-slate-400">
            {tableData.rows} linhas × {tableData.cols} colunas
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span>Pressione <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[9px]">Tab</kbd> para avançar</span>
          <span>•</span>
          <span>{element.date}</span>
        </div>
      </div>

      {/* Interactive Resize Handle */}
      {isDraggable && (
        <ResizeHandle
          cardRef={cardRef}
          elementId={element.id}
          initialWidth={element.width || Math.max(520, tableData.cols * 130 + 70)}
          initialHeight={element.height || 290}
          minWidth={340}
          minHeight={220}
          onResizeEnd={(id, width, height) => onUpdate(id, { width, height })}
          colorClass="text-slate-400 hover:text-emerald-600"
        />
      )}
    </div>
  );
};
