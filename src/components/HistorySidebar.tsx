import React, { useState } from 'react';
import type { ConversionHistoryItem } from '../types';
import { formatTimestamp } from '../utils/helpers';
import { highlightSyntax } from '../utils/syntaxHighlight';

interface HistorySidebarProps {
  history: ConversionHistoryItem[];
  onRestore: (item: ConversionHistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  history,
  onRestore,
  onDelete,
  onClear,
  onClose,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedItem = history.find((item) => item.id === selectedId);

  if (selectedItem) {
    return (
      <div className="history-sidebar">
        <div className="history-header">
          <button className="history-back-btn" onClick={() => setSelectedId(null)}>
            ← 返回列表
          </button>
          <div className="history-actions">
            <button
              className="history-restore-btn"
              onClick={() => {
                onRestore(selectedItem);
              }}
            >
              恢复到编辑器
            </button>
            <button className="history-close-btn" onClick={onClose}>
              ×
            </button>
          </div>
        </div>
        <div className="history-detail">
          <div className="history-detail-meta">
            <span className="history-format">
              {selectedItem.sourceFormat.toUpperCase()} → {selectedItem.targetFormat.toUpperCase()}
            </span>
            <span className="history-detail-time">{formatTimestamp(selectedItem.timestamp)}</span>
          </div>

          <div className="history-detail-section">
            <div className="history-detail-label">输入 ({selectedItem.sourceFormat.toUpperCase()})</div>
            <pre className="history-detail-code">
              <code
                dangerouslySetInnerHTML={{
                  __html: highlightSyntax(selectedItem.input, selectedItem.sourceFormat),
                }}
              />
            </pre>
          </div>

          <div className="history-detail-section">
            <div className="history-detail-label">输出 ({selectedItem.targetFormat.toUpperCase()})</div>
            <pre className="history-detail-code">
              <code
                dangerouslySetInnerHTML={{
                  __html: highlightSyntax(selectedItem.output, selectedItem.targetFormat),
                }}
              />
            </pre>
          </div>
        </div>
      </div>
    );
  }

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
            <div
              key={item.id}
              className="history-item"
              onClick={() => setSelectedId(item.id)}
            >
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
              <div className="history-item-hint">点击查看详情</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
