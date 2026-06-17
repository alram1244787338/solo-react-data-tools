import React from 'react';
import type { ConversionHistoryItem } from '../types';
import { formatTimestamp } from '../utils/helpers';

interface HistorySidebarProps {
  history: ConversionHistoryItem[];
  onRestore: (item: ConversionHistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ history, onRestore, onDelete, onClear, onClose }) => {
  return (
    <div className="history-sidebar">
      <div className="history-header">
        <h3>转换历史</h3>
        <div className="history-actions">
          {history.length > 0 && (
            <button className="history-clear-btn" onClick={onClear}>
              清空
            </button>
          )}
          <button className="history-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
      </div>
      <div className="history-list">
        {history.length === 0 ? (
          <div className="history-empty">
            <p>暂无历史记录</p>
          </div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="history-item" onClick={() => onRestore(item)}>
              <div className="history-item-header">
                <span className="history-format">
                  {item.sourceFormat.toUpperCase()} → {item.targetFormat.toUpperCase()}
                </span>
                <button
                  className="history-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  title="删除"
                >
                  ×
                </button>
              </div>
              <div className="history-item-time">{formatTimestamp(item.timestamp)}</div>
              <div className="history-item-preview">
                {item.input.slice(0, 80)}
                {item.input.length > 80 ? '...' : ''}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
