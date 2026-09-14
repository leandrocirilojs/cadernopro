import React, { useState, useEffect } from 'react';
import { GripVertical, X, Plus, Minus, Download, Edit2 } from 'lucide-react';
import { NotebookElement, TableData } from '../../types';

interface TableCardProps {
  element: NotebookElement;
  onUpdate: (id: string, data: Partial<NotebookElement>) => void;
  onDelete: (id: string) => void;
  isDraggable?: boolean;
  onMouseDownDrag?: (e: any) => void;
}

export const TableCard: React.FC<TableCardProps> = ({
  element,
  onUpdate,
  onDelete,
  isDraggable = true,
  onMouseDownDrag
}) => {
  const [tableData, setTableData] = useState<TableData>(() => {
    if (element.meta_json) {
      try {
        return JSON.parse(element.meta_json);
      } catch (e) {
        // fallback
      }
    }
    return {
      rows: 3,
      cols: 3,
      data: [
        ['Coluna 1', 'Coluna 2', 'Coluna 3'],
        ['', '', ''],
        ['', '', '']
      ]
    };
  });

  const [title, setTitle] = useState(element.title || 'Tabela de Dados');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Sync state if element prop changes
  useEffect(() => {
    if (element.meta_json) {
      try {
        setTableData(JSON.parse(element.meta_json));
      } catch (e) {}
    }
  }, [element.meta_json]);

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
  };

  const addRow = () => {
    const newRow = Array(tableData.cols).fill('');
    saveTable({
      rows: tableData.rows + 1,
      cols: tableData.cols,
      data: [...tableData.data, newRow]
    });
  };

  const removeRow = () => {
    if (tableData.rows <= 1) return;
    saveTable({
      rows: tableData.rows - 1,
      cols: tableData.cols,
      data: tableData.data.slice(0, -1)
    });
  };

  const addCol = () => {
    const updatedMatrix = tableData.data.map((row) => [...row, '']);
    saveTable({
      rows: tableData.rows,
      cols: tableData.cols + 1,
      data: updatedMatrix
    });
  };

  const removeCol = () => {
    if (tableData.cols <= 1) return;
    const updatedMatrix = tableData.data.map((row) => row.slice(0, -1));
    saveTable({
      rows: tableData.rows,
      cols: tableData.cols - 1,
      data: updatedMatrix
    });
  };

  const exportCSV = () => {
    const csvContent = tableData.data
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title || 'tabela'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      id={`table-card-${element.id}`}
      className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col transition-all hover:border-slate-300"
      style={{ width: isDraggable ? `${Math.max(element.width || 440, tableData.cols * 130 + 40)}px` : '100%' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
        <div 
          className={`flex items-center gap-1.5 text-xs font-semibold text-slate-500 select-none touch-none py-1 px-1 rounded-lg active:bg-slate-100 ${
            isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          style={{ touchAction: 'none' }}
          onPointerDown={isDraggable ? onMouseDownDrag : undefined}
          onTouchStart={isDraggable ? onMouseDownDrag : undefined}
          onMouseDown={isDraggable ? onMouseDownDrag : undefined}
          title={isDraggable ? "Arraste para mover no quadro (toque e arraste no celular)" : undefined}
        >
          {isDraggable && <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />}
          <span className="text-emerald-600 font-bold">
            📊 Tabela ({tableData.rows}x{tableData.cols})
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={exportCSV}
            className="p-1 text-slate-400 hover:text-emerald-600 rounded transition"
            title="Exportar CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(element.id)}
            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
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
            className="w-full text-sm font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-300 outline-none"
          />
        ) : (
          <h4
            onClick={() => setIsEditingTitle(true)}
            className="text-sm font-bold text-slate-800 hover:bg-slate-50 px-1 py-0.5 rounded cursor-pointer transition flex items-center gap-1.5"
            title="Clique para editar título da tabela"
          >
            <span>{title}</span>
            <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
          </h4>
        )}
      </div>

      {/* Controls Bar */}
      <div className="flex items-center gap-2 mb-2 text-xs text-slate-600">
        <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg">
          <span className="text-[11px] font-medium text-slate-500">Linhas:</span>
          <button onClick={addRow} className="p-0.5 hover:bg-slate-200 rounded" title="Adicionar linha">
            <Plus className="w-3 h-3 text-emerald-600" />
          </button>
          <button onClick={removeRow} className="p-0.5 hover:bg-slate-200 rounded" title="Remover linha">
            <Minus className="w-3 h-3 text-rose-500" />
          </button>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg">
          <span className="text-[11px] font-medium text-slate-500">Colunas:</span>
          <button onClick={addCol} className="p-0.5 hover:bg-slate-200 rounded" title="Adicionar coluna">
            <Plus className="w-3 h-3 text-emerald-600" />
          </button>
          <button onClick={removeCol} className="p-0.5 hover:bg-slate-200 rounded" title="Remover coluna">
            <Minus className="w-3 h-3 text-rose-500" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-xs text-left border-collapse">
          <tbody>
            {tableData.data.map((row, r) => (
              <tr key={`row-${r}`} className={r === 0 ? 'bg-slate-100 font-semibold text-slate-800' : 'hover:bg-slate-50/70'}>
                {row.map((cell, c) => (
                  <td 
                    key={`cell-${r}-${c}`}
                    className="border border-slate-200 p-1.5 min-w-[90px]"
                  >
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => handleCellChange(r, c, e.target.value)}
                      placeholder={r === 0 ? `Cabeçalho ${c + 1}` : '...'}
                      className="w-full bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-emerald-400 px-1 py-0.5 rounded"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
        <span>{element.date}</span>
        <span className="text-[10px]">Tabela editável</span>
      </div>
    </div>
  );
};
