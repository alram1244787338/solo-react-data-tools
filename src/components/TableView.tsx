import React, { useState, useCallback } from 'react';
import type { TableData } from '../types';

interface TableViewProps {
  data: TableData;
  onChange: (data: TableData) => void;
}

export const TableView: React.FC<TableViewProps> = ({ data, onChange }) => {
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleCellClick = useCallback((rowIndex: number, colIndex: number, value: string) => {
    setEditingCell({ row: rowIndex, col: colIndex });
    setEditValue(value);
  }, []);

  const handleCellBlur = useCallback(
    (rowIndex: number, colIndex: number) => {
      if (editingCell?.row === rowIndex && editingCell?.col === colIndex) {
        const newRows = [...data.rows];
        newRows[rowIndex] = [...newRows[rowIndex]];
        newRows[rowIndex][colIndex] = editValue;
        onChange({ ...data, rows: newRows });
        setEditingCell(null);
      }
    },
    [data, editValue, editingCell, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
      if (e.key === 'Enter') {
        handleCellBlur(rowIndex, colIndex);
      } else if (e.key === 'Escape') {
        setEditingCell(null);
      }
    },
    [handleCellBlur]
  );

  const addRow = useCallback(() => {
    const newRow = data.headers.map(() => '');
    onChange({ ...data, rows: [...data.rows, newRow] });
  }, [data, onChange]);

  const addColumn = useCallback(() => {
    const newHeader = `字段${data.headers.length + 1}`;
    const newRows = data.rows.map((row) => [...row, '']);
    onChange({ headers: [...data.headers, newHeader], rows: newRows });
  }, [data, onChange]);

  const deleteRow = useCallback(
    (index: number) => {
      const newRows = data.rows.filter((_, i) => i !== index);
      onChange({ ...data, rows: newRows });
    },
    [data, onChange]
  );

  const deleteColumn = useCallback(
    (index: number) => {
      const newHeaders = data.headers.filter((_, i) => i !== index);
      const newRows = data.rows.map((row) => row.filter((_, i) => i !== index));
      onChange({ headers: newHeaders, rows: newRows });
    },
    [data, onChange]
  );

  const editHeader = useCallback(
    (index: number, value: string) => {
      const newHeaders = [...data.headers];
      newHeaders[index] = value;
      onChange({ ...data, headers: newHeaders });
    },
    [data, onChange]
  );

  if (data.headers.length === 0) {
    return (
      <div className="table-empty">
        <p>暂无数据</p>
        <button className="toolbar-btn" onClick={addColumn}>
          添加列
        </button>
      </div>
    );
  }

  return (
    <div className="table-view">
      <div className="table-toolbar">
        <button className="table-tool-btn" onClick={addRow}>
          + 添加行
        </button>
        <button className="table-tool-btn" onClick={addColumn}>
          + 添加列
        </button>
        <span className="table-info">
          {data.rows.length} 行 × {data.headers.length} 列
        </span>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="row-index">#</th>
              {data.headers.map((header, colIndex) => (
                <th key={colIndex}>
                  <input
                    type="text"
                    className="header-input"
                    value={header}
                    onChange={(e) => editHeader(colIndex, e.target.value)}
                  />
                  <button
                    className="col-delete-btn"
                    onClick={() => deleteColumn(colIndex)}
                    title="删除列"
                  >
                    ×
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="row-index">{rowIndex + 1}</td>
                {row.map((cell, colIndex) => (
                  <td key={colIndex}>
                    {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                      <input
                        type="text"
                        className="cell-input"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleCellBlur(rowIndex, colIndex)}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                        autoFocus
                      />
                    ) : (
                      <div className="cell-content" onClick={() => handleCellClick(rowIndex, colIndex, cell)}>
                        {cell || <span className="cell-empty">空</span>}
                      </div>
                    )}
                  </td>
                ))}
                <td className="row-actions">
                  <button className="row-delete-btn" onClick={() => deleteRow(rowIndex)} title="删除行">
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
