import React from 'react';
import type { DataFormat } from '../types';

interface ToolbarProps {
  sourceFormat: DataFormat;
  targetFormat: DataFormat;
  onSwap: () => void;
  onConvert: () => void;
  onClear: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onToggleTable: () => void;
  isTableView: boolean;
  canShowTable: boolean;
  onToggleHistory: () => void;
  showHistory: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  sourceFormat,
  targetFormat,
  onSwap,
  onConvert,
  onClear,
  onCopy,
  onDownload,
  onToggleTable,
  isTableView,
  canShowTable,
  onToggleHistory,
  showHistory,
}) => {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button className="toolbar-btn" onClick={onToggleHistory} title="历史记录">
          {showHistory ? '隐藏历史' : '历史记录'}
        </button>
        <button className="toolbar-btn" onClick={onSwap} title="交换格式">
          ⇄ 交换
        </button>
        <button className="toolbar-btn primary" onClick={onConvert}>
          转换
        </button>
        <button className="toolbar-btn" onClick={onClear} title="清空">
          清空
        </button>
      </div>
      <div className="toolbar-right">
        {canShowTable && (
          <button className={`toolbar-btn ${isTableView ? 'active' : ''}`} onClick={onToggleTable}>
            {isTableView ? '代码视图' : '表格视图'}
          </button>
        )}
        <button className="toolbar-btn" onClick={onCopy} title="复制输出">
          复制
        </button>
        <button className="toolbar-btn" onClick={onDownload} title="下载文件">
          下载
        </button>
      </div>
    </div>
  );
};
